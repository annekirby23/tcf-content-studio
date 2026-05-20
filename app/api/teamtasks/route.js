import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = (await kvGet("tcf:teamtasks")) || [];
  return NextResponse.json(tasks);
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

  const { text } = body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Task text is required" }, { status: 400 });
  }

  const now = new Date().toISOString();

  const task = {
    id: crypto.randomBytes(8).toString("hex"),
    text: text.trim(),
    locations: Array.isArray(body.locations) ? body.locations : [],
    status: body.status || "in_progress",
    assignees: Array.isArray(body.assignees) ? body.assignees : [],
    dueDate: body.dueDate || null,
    priority: body.priority || "medium",
    taskType: body.taskType || "General",
    description: body.description ? String(body.description).trim() : "",
    effortLevel: body.effortLevel || "Medium",
    summary: body.summary ? String(body.summary).trim() : "",
    attachFile: body.attachFile || null,
    addedBy: user.name,
    addedById: user.id,
    createdAt: now,
    updatedAt: now,
  };

  const tasks = (await kvGet("tcf:teamtasks")) || [];
  tasks.unshift(task);
  await kvSet("tcf:teamtasks", tasks);

  return NextResponse.json(task, { status: 201 });
}
