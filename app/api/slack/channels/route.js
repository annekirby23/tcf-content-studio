import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const CHANNELS_KEY = "tcf:slack:channels";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const channels = (await kvGet(CHANNELS_KEY)) || [];
  return NextResponse.json(channels);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, description, emoji, assignedTo, helpers, memberManagers, engagementLevel, notes, isMemberClub, clubId, purpose } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (name.trim().length > 50) {
    return NextResponse.json({ error: "name must be 50 characters or fewer" }, { status: 400 });
  }

  const channels = (await kvGet(CHANNELS_KEY)) || [];

  const newChannel = {
    id: crypto.randomBytes(8).toString("hex"),
    name: name.trim(),
    description: description || "",
    emoji: emoji || "💬",
    assignedTo: assignedTo || null,
    helpers: Array.isArray(helpers) ? helpers : [],
    memberManagers: Array.isArray(memberManagers) ? memberManagers : [],
    engagementLevel: ["none","low","moderate","high"].includes(engagementLevel) ? engagementLevel : "none",
    notes: String(notes || ""),
    isMemberClub: Boolean(isMemberClub),
    clubId: clubId || null,
    purpose: String(purpose || ""),
    createdBy: user.name,
    createdAt: new Date().toISOString(),
  };

  channels.push(newChannel);
  await kvSet(CHANNELS_KEY, channels);

  return NextResponse.json(newChannel, { status: 201 });
}

export async function DELETE(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id query param required" }, { status: 400 });

  const channels = (await kvGet(CHANNELS_KEY)) || [];
  const filtered = channels.filter((c) => c.id !== id);

  if (filtered.length === channels.length) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  await kvSet(CHANNELS_KEY, filtered);
  return NextResponse.json({ ok: true });
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, name, description, emoji, assignedTo, helpers, memberManagers, engagementLevel, notes, isMemberClub, clubId, purpose } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "name must be a non-empty string" }, { status: 400 });
    }
    if (name.trim().length > 50) {
      return NextResponse.json({ error: "name must be 50 characters or fewer" }, { status: 400 });
    }
  }

  const channels = (await kvGet(CHANNELS_KEY)) || [];
  const idx = channels.findIndex((c) => c.id === id);

  if (idx === -1) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

  const updated = { ...channels[idx] };
  if (name !== undefined) updated.name = name.trim();
  if (description !== undefined) updated.description = description;
  if (emoji !== undefined) updated.emoji = emoji;
  if (assignedTo !== undefined) updated.assignedTo = assignedTo || null;
  if (helpers !== undefined) updated.helpers = Array.isArray(helpers) ? helpers : [];
  if (memberManagers !== undefined) updated.memberManagers = Array.isArray(memberManagers) ? memberManagers : [];
  if (engagementLevel !== undefined) updated.engagementLevel = ["none","low","moderate","high"].includes(engagementLevel) ? engagementLevel : "none";
  if (notes !== undefined) updated.notes = String(notes || "");
  if (isMemberClub !== undefined) updated.isMemberClub = Boolean(isMemberClub);
  if (clubId !== undefined) updated.clubId = clubId || null;
  if (purpose !== undefined) updated.purpose = String(purpose || "");
  updated.updatedAt = new Date().toISOString();

  channels[idx] = updated;
  await kvSet(CHANNELS_KEY, channels);

  return NextResponse.json(updated);
}
