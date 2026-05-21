import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:slack:engagement";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  const all = (await kvGet(KEY)) || [];
  const result = channelId ? all.filter((s) => s.channelId === channelId) : all;
  return NextResponse.json(result);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { channelId, channelName, text } = body;
  if (!channelId || !text) {
    return NextResponse.json({ error: "channelId and text are required" }, { status: 400 });
  }

  const entry = {
    id: crypto.randomBytes(8).toString("hex"),
    channelId,
    channelName: channelName || "",
    text,
    generatedBy: user.name,
    generatedById: user.id,
    createdAt: new Date().toISOString(),
  };

  const all = (await kvGet(KEY)) || [];
  all.unshift(entry);
  await kvSet(KEY, all);

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req) {
  const user = await getSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const all = (await kvGet(KEY)) || [];
  const entry = all.find((s) => s.id === id);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = user.role === "admin";
  const isOwner = entry.generatedById === user.id;
  if (!isAdmin && !isOwner) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await kvSet(KEY, all.filter((s) => s.id !== id));
  return NextResponse.json({ ok: true });
}
