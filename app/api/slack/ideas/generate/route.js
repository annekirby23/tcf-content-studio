import { NextResponse } from "next/server";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const IDEAS_KEY = "tcf:slack:ideas";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  return new Anthropic({ apiKey });
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { channelId, channelName, description, purpose, notes } = body;
    if (!channelId) return NextResponse.json({ error: "channelId is required" }, { status: 400 });

    const contextParts = [
      purpose && `Purpose: ${purpose}`,
      description && `Description: ${description}`,
      notes && `Notes: ${notes}`,
    ].filter(Boolean).join("\n");

    const prompt = `You are a creative community manager for TCF, a coworking space. Generate ONE engaging Slack post idea for the channel "#${channelName}".

${contextParts || "No additional context provided."}

Return ONLY a JSON object in this exact format (no markdown, no extra text):
{"title": "short catchy title", "copy": "the full post copy ready to paste into Slack, 2-4 sentences, conversational and energetic"}`;

    const client = getClient();
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = message.content[0].text.trim();

    let title = "";
    let copy = "";

    try {
      // Strip possible markdown code fences
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
      const parsed = JSON.parse(cleaned);
      title = parsed.title || "";
      copy = parsed.copy || "";
    } catch {
      // Fallback: use the raw text as copy, derive a title
      copy = raw;
      title = raw.split(/[.!?\n]/)[0].slice(0, 80).trim();
    }

    if (!title || !copy) {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 502 });
    }

    const newIdea = {
      id: crypto.randomBytes(8).toString("hex"),
      channelId,
      title,
      copy,
      assignedTo: null,
      submittedBy: user.name,
      submittedById: user.id,
      aiGenerated: true,
      createdAt: new Date().toISOString(),
    };

    const ideas = (await kvGet(IDEAS_KEY)) || [];
    ideas.unshift(newIdea);
    await kvSet(IDEAS_KEY, ideas);

    return NextResponse.json(newIdea, { status: 201 });
  } catch (e) {
    console.error("[/api/slack/ideas/generate]", e);
    return NextResponse.json({ error: e.message || "Failed to generate idea." }, { status: 500 });
  }
}
