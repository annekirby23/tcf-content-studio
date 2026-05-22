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

  const tasks = (await kvGet("tcf:teamtasks")) || [];
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updatedTask = {
    ...tasks[index],
    ...body,
    id: tasks[index].id,
    addedBy: tasks[index].addedBy,
    addedById: tasks[index].addedById,
    createdAt: tasks[index].createdAt,
    updatedAt: new Date().toISOString(),
  };

  tasks[index] = updatedTask;
  await kvSet("tcf:teamtasks", tasks);

  return NextResponse.json(updatedTask);
}

export async function DELETE(req, { params }) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tasks = (await kvGet("tcf:teamtasks")) || [];
  const task = tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = tasks.filter((t) => t.id !== id);
  await kvSet("tcf:teamtasks", updated);

  return NextResponse.json({ ok: true });
}
