import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:confrooms";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const rooms = (await kvGet(KEY)) || [];
    return Response.json(rooms);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const room = {
      id: crypto.randomBytes(8).toString("hex"),
      name: body.name || "Untitled Room",
      location: body.location || "",
      capacity: body.capacity || "",
      pricing: body.pricing || "",
      amenities: body.amenities || "",
      bookingContact: body.bookingContact || "",
      bookingUrl: body.bookingUrl || "",
      skeddaUrl: body.skeddaUrl || "",
      honeyBookUrl: body.honeyBookUrl || "",
      linkedLocationId: body.linkedLocationId || null,
      linkedLocationName: body.linkedLocationName || "",
      details: body.details || "",
      image: body.image || "",
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rooms = (await kvGet(KEY)) || [];
    rooms.push(room);
    await kvSet(KEY, rooms);
    return Response.json(room, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
