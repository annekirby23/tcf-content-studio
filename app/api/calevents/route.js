import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:calevents";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const events = (await kvGet(KEY)) || [];
    return Response.json(events);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const event = {
      id: crypto.randomBytes(8).toString("hex"),
      title: body.title || "Untitled Event",
      date: body.date || "",
      description: body.description || "",
      color: body.color || "#10B981",
      allDay: true,
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const events = (await kvGet(KEY)) || [];
    events.push(event);
    await kvSet(KEY, events);
    return Response.json(event, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
