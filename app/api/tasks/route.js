import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId") || user.id;

    const tasks = (await kvGet(`tcf:tasks:${targetId}`)) || [];
    return Response.json(tasks);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { text, priority, dueDate, description } = body;

    const task = {
      id: crypto.randomBytes(8).toString("hex"),
      text,
      priority: priority || "medium",
      dueDate: dueDate || null,
      description: description || "",
      done: false,
      createdAt: new Date().toISOString(),
    };

    const tasks = (await kvGet(`tcf:tasks:${user.id}`)) || [];
    tasks.unshift(task);
    await kvSet(`tcf:tasks:${user.id}`, tasks);

    return Response.json(task, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
