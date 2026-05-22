import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const notes = (await kvGet(`tcf:personalnotes:${user.id}`)) || [];
    const index = notes.findIndex((n) => n.id === id);
    if (index === -1) return Response.json({ error: "Note not found" }, { status: 404 });

    const note = { ...notes[index] };
    if (body.title !== undefined) note.title = body.title;
    if (body.content !== undefined) note.content = body.content;
    note.updatedAt = new Date().toISOString();

    notes[index] = note;
    await kvSet(`tcf:personalnotes:${user.id}`, notes);

    return Response.json(note);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const notes = (await kvGet(`tcf:personalnotes:${user.id}`)) || [];
    const exists = notes.some((n) => n.id === id);
    if (!exists) return Response.json({ error: "Note not found" }, { status: 404 });

    const updated = notes.filter((n) => n.id !== id);
    await kvSet(`tcf:personalnotes:${user.id}`, updated);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
