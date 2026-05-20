import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:calevents";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const events = (await kvGet(KEY)) || [];
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return Response.json({ error: "Event not found" }, { status: 404 });

    const event = { ...events[index] };
    if (body.title !== undefined) event.title = body.title;
    if (body.date !== undefined) event.date = body.date;
    if (body.description !== undefined) event.description = body.description;
    if (body.color !== undefined) event.color = body.color;
    event.updatedAt = new Date().toISOString();

    events[index] = event;
    await kvSet(KEY, events);
    return Response.json(event);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const events = (await kvGet(KEY)) || [];
    if (!events.some((e) => e.id === id)) return Response.json({ error: "Event not found" }, { status: 404 });

    await kvSet(KEY, events.filter((e) => e.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
