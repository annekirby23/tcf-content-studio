import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:events";

export async function GET(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const events = (await kvGet(KEY)) || [];
    const event = events.find((e) => e.id === id);
    if (!event) return Response.json({ error: "Event not found" }, { status: 404 });

    return Response.json(event);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const events = (await kvGet(KEY)) || [];
    const index = events.findIndex((e) => e.id === id);
    if (index === -1) return Response.json({ error: "Event not found" }, { status: 404 });

    const event = {
      ...events[index],
      items: [...(events[index].items || [])],
      comments: [...(events[index].comments || [])],
      resourceLinks: [...(events[index].resourceLinks || [])],
      members: [...(events[index].members || [])],
    };

    if (body.itemAction === "add") {
      const item = {
        id: crypto.randomBytes(8).toString("hex"),
        text: body.itemText,
        category: body.category || "General",
        done: false,
        assignedTo: body.assignedTo || null,
        createdAt: new Date().toISOString(),
      };
      event.items.push(item);
    } else if (body.itemAction === "toggle") {
      const itemIndex = event.items.findIndex((i) => i.id === body.itemId);
      if (itemIndex === -1) return Response.json({ error: "Item not found" }, { status: 404 });
      event.items[itemIndex] = { ...event.items[itemIndex], done: !event.items[itemIndex].done };
    } else if (body.itemAction === "delete") {
      event.items = event.items.filter((i) => i.id !== body.itemId);
    } else if (body.commentAction === "add") {
      const comment = {
        id: crypto.randomBytes(8).toString("hex"),
        text: body.commentText,
        authorName: user.name,
        authorId: user.id,
        createdAt: new Date().toISOString(),
      };
      event.comments.push(comment);
    } else if (body.commentAction === "delete") {
      event.comments = event.comments.filter((c) => c.id !== body.commentId);
    } else {
      if (body.title !== undefined) event.title = body.title;
      if (body.description !== undefined) event.description = body.description;
      if (body.status !== undefined) event.status = body.status;
      if (body.date !== undefined) event.date = body.date;
      if (body.color !== undefined) event.color = body.color;
      if (body.driveFolderUrl !== undefined) event.driveFolderUrl = body.driveFolderUrl;
      if (body.resourceLinks !== undefined) event.resourceLinks = body.resourceLinks;
      if (body.members !== undefined) event.members = body.members;
      if (body.notes !== undefined) event.notes = body.notes;
      if (body.club !== undefined) event.club = body.club;
      if (body.slackChannel !== undefined) event.slackChannel = body.slackChannel;
    }

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
    const exists = events.some((e) => e.id === id);
    if (!exists) return Response.json({ error: "Event not found" }, { status: 404 });

    const updated = events.filter((e) => e.id !== id);
    await kvSet(KEY, updated);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
