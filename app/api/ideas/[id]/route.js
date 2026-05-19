import { NextResponse } from "next/server";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function PUT(req, { params }) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ideas = (await kvGet("tcf:ideas")) || [];
  const index = ideas.findIndex((idea) => idea.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const idea = { ...ideas[index] };

  if (body.action === "upvote") {
    const upvoteIndex = idea.upvotes.indexOf(user.id);
    if (upvoteIndex === -1) {
      idea.upvotes = [...idea.upvotes, user.id];
    } else {
      idea.upvotes = idea.upvotes.filter((uid) => uid !== user.id);
    }
  } else if (body.action === "update") {
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (body.title !== undefined) idea.title = String(body.title).trim();
    if (body.description !== undefined) idea.description = String(body.description).trim();
    if (body.theme !== undefined) idea.theme = body.theme;
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  ideas[index] = idea;
  await kvSet("tcf:ideas", ideas);

  return NextResponse.json(idea);
}

export async function DELETE(req, { params }) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ideas = (await kvGet("tcf:ideas")) || [];
  const idea = ideas.find((i) => i.id === id);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  const isAdmin = user.role === "admin";
  const isOwner = idea.submittedById === user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = ideas.filter((i) => i.id !== id);
  await kvSet("tcf:ideas", updated);

  return NextResponse.json({ ok: true });
}
