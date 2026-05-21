import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:slack:clubs";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clubs = (await kvGet(KEY)) || [];
  return NextResponse.json(clubs);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  const notes = String(body.notes || "").trim();

  const clubs = (await kvGet(KEY)) || [];
  const club = { id: crypto.randomBytes(8).toString("hex"), name, notes, createdAt: new Date().toISOString() };
  clubs.push(club);
  await kvSet(KEY, clubs);
  return NextResponse.json(club, { status: 201 });
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, name, notes } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const clubs = (await kvGet(KEY)) || [];
  const idx = clubs.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  clubs[idx] = { ...clubs[idx], name: String(name || "").trim(), notes: String(notes || "").trim() };
  await kvSet(KEY, clubs);
  return NextResponse.json(clubs[idx]);
}

export async function DELETE(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const clubs = (await kvGet(KEY)) || [];
  await kvSet(KEY, clubs.filter((c) => c.id !== id));
  return NextResponse.json({ ok: true });
}
