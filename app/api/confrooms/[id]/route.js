import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:confrooms";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const rooms = (await kvGet(KEY)) || [];
    const index = rooms.findIndex((r) => r.id === id);
    if (index === -1) return Response.json({ error: "Room not found" }, { status: 404 });

    const room = { ...rooms[index] };
    const fields = ["name", "location", "capacity", "pricing", "amenities", "bookingContact", "bookingUrl", "skeddaUrl", "honeyBookUrl", "linkedLocationId", "linkedLocationName", "details", "image"];
    for (const f of fields) {
      if (body[f] !== undefined) room[f] = body[f];
    }
    room.updatedAt = new Date().toISOString();

    rooms[index] = room;
    await kvSet(KEY, rooms);
    return Response.json(room);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const rooms = (await kvGet(KEY)) || [];
    if (!rooms.some((r) => r.id === id)) return Response.json({ error: "Room not found" }, { status: 404 });

    await kvSet(KEY, rooms.filter((r) => r.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
