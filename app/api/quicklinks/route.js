import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const REDIS_KEY = "tcf:quicklinks";

export async function GET(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = (await kvGet(REDIS_KEY)) || [];
  return NextResponse.json(links);
}

export async function POST(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, url, emoji, description, category } = body;
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const link = {
    id: crypto.randomBytes(8).toString("hex"),
    name: name.trim(),
    url: url.trim(),
    emoji: emoji && typeof emoji === "string" && emoji.trim() ? emoji.trim() : "🔗",
    description: description ? String(description).trim() : "",
    category: category && typeof category === "string" && category.trim() ? category.trim() : "General",
  };

  const links = (await kvGet(REDIS_KEY)) || [];
  links.push(link);
  await kvSet(REDIS_KEY, links);

  return NextResponse.json(link, { status: 201 });
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, name, url, emoji, description, category } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const links = (await kvGet(REDIS_KEY)) || [];
  const idx = links.findIndex((l) => l.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const existing = links[idx];
  const updated = {
    ...existing,
    ...(name !== undefined && { name: String(name).trim() }),
    ...(url !== undefined && { url: String(url).trim() }),
    ...(emoji !== undefined && { emoji: String(emoji).trim() || "🔗" }),
    ...(description !== undefined && { description: String(description).trim() }),
    ...(category !== undefined && { category: String(category).trim() || "General" }),
  };

  links[idx] = updated;
  await kvSet(REDIS_KEY, links);

  return NextResponse.json(updated);
}

export async function DELETE(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }

  const links = (await kvGet(REDIS_KEY)) || [];
  const filtered = links.filter((l) => l.id !== id);
  if (filtered.length === links.length) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await kvSet(REDIS_KEY, filtered);
  return NextResponse.json({ success: true });
}
