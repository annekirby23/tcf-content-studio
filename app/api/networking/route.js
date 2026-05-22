import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:networking";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = (await kvGet(KEY)) || [];
  return NextResponse.json(events);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, date, location, description, notes, attendees } = body;
  if (!name?.trim()) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const event = {
    id: crypto.randomBytes(8).toString("hex"),
    name: name.trim(),
    date: date || "",
    location: location || "",
    description: description || "",
    notes: notes || "",
    attendees: Array.isArray(attendees) ? attendees : [],
    status: "upcoming",
    rating: null,
    postEventUpdate: "",
    createdBy: user.name,
    createdById: user.id,
    createdAt: new Date().toISOString(),
  };

  const events = (await kvGet(KEY)) || [];
  events.unshift(event);
  await kvSet(KEY, events);
  return NextResponse.json(event, { status: 201 });
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, name, date, location, description, notes, attendees, status, rating, postEventUpdate } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const events = (await kvGet(KEY)) || [];
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = { ...events[idx] };
  if (name !== undefined) updated.name = name.trim();
  if (date !== undefined) updated.date = date;
  if (location !== undefined) updated.location = location;
  if (description !== undefined) updated.description = description;
  if (notes !== undefined) updated.notes = notes;
  if (attendees !== undefined) updated.attendees = Array.isArray(attendees) ? attendees : [];
  if (status !== undefined) updated.status = status;
  if (rating !== undefined) updated.rating = rating;
  if (postEventUpdate !== undefined) updated.postEventUpdate = postEventUpdate;
  updated.updatedAt = new Date().toISOString();

  events[idx] = updated;
  await kvSet(KEY, events);
  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const events = (await kvGet(KEY)) || [];
  const filtered = events.filter((e) => e.id !== id);
  if (filtered.length === events.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await kvSet(KEY, filtered);
  return NextResponse.json({ ok: true });
}
