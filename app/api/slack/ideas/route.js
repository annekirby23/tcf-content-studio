import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const IDEAS_KEY = "tcf:slack:ideas";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  const ideas = (await kvGet(IDEAS_KEY)) || [];
  const result = channelId ? ideas.filter((i) => i.channelId === channelId) : ideas;

  return NextResponse.json(result);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { channelId, title, copy, assignedTo } = body;

  if (!channelId || typeof channelId !== "string" || channelId.trim().length === 0) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const ideas = (await kvGet(IDEAS_KEY)) || [];

  const newIdea = {
    id: crypto.randomBytes(8).toString("hex"),
    channelId: channelId.trim(),
    title: title.trim(),
    copy: copy || "",
    assignedTo: assignedTo || null,
    submittedBy: user.name,
    submittedById: user.id,
    createdAt: new Date().toISOString(),
  };

  ideas.unshift(newIdea);
  await kvSet(IDEAS_KEY, ideas);

  return NextResponse.json(newIdea, { status: 201 });
}

export async function DELETE(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const ideas = (await kvGet(IDEAS_KEY)) || [];
  const idea = ideas.find((i) => i.id === id);

  if (!idea) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  const isSubmitter = idea.submittedById === user.id;

  if (!isAdmin && !isSubmitter) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filtered = ideas.filter((i) => i.id !== id);
  await kvSet(IDEAS_KEY, filtered);

  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, title, copy, assignedTo } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const ideas = (await kvGet(IDEAS_KEY)) || [];
  const idx = ideas.findIndex((i) => i.id === id);

  if (idx === -1) return NextResponse.json({ error: "Idea not found" }, { status: 404 });

  const idea = ideas[idx];
  const isAdmin = user.role === "admin";
  const isSubmitter = idea.submittedById === user.id;

  if (!isAdmin && !isSubmitter) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = { ...idea };
  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "title must be a non-empty string" }, { status: 400 });
    }
    updated.title = title.trim();
  }
  if (copy !== undefined) updated.copy = copy;
  if (assignedTo !== undefined) updated.assignedTo = assignedTo;

  ideas[idx] = updated;
  await kvSet(IDEAS_KEY, ideas);

  return NextResponse.json(updated);
}
