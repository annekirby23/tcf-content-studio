import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ideas = (await kvGet("tcf:ideas")) || [];
  return NextResponse.json(ideas);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, theme } = body;
  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const submittedBy = body.submittedBy || user.name;

  const idea = {
    id: crypto.randomBytes(8).toString("hex"),
    title: title.trim(),
    description: description ? String(description).trim() : "",
    theme: theme || null,
    submittedBy,
    submittedById: user.id,
    upvotes: [],
    createdAt: new Date().toISOString(),
  };

  const ideas = (await kvGet("tcf:ideas")) || [];
  ideas.unshift(idea);
  await kvSet("tcf:ideas", ideas);

  return NextResponse.json(idea, { status: 201 });
}
