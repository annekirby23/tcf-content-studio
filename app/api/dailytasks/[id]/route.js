import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const tasks = (await kvGet(`tcf:dailytasks:${user.id}`)) || [];
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return Response.json({ error: "Task not found" }, { status: 404 });

    const task = { ...tasks[index] };
    if (body.text !== undefined) task.text = body.text;
    if (body.done !== undefined) task.done = body.done;
    if (body.doneWeek !== undefined) task.doneWeek = body.doneWeek;
    if (body.days !== undefined) task.days = body.days;

    tasks[index] = task;
    await kvSet(`tcf:dailytasks:${user.id}`, tasks);

    return Response.json(task);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const tasks = (await kvGet(`tcf:dailytasks:${user.id}`)) || [];
    const exists = tasks.some((t) => t.id === id);
    if (!exists) return Response.json({ error: "Task not found" }, { status: 404 });

    const updated = tasks.filter((t) => t.id !== id);
    await kvSet(`tcf:dailytasks:${user.id}`, updated);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
