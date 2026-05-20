import { NextResponse } from "next/server";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:brandrepo";
const VALID_CATEGORIES = ["logo", "link", "collateral", "other"];

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const items = (await kvGet(KEY)) || [];
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = items[idx];
    const updated = {
      ...existing,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      description: body.description !== undefined ? String(body.description).trim() : existing.description,
      url: body.url !== undefined ? String(body.url).trim() : existing.url,
      category: body.category !== undefined && VALID_CATEGORIES.includes(body.category) ? body.category : existing.category,
      fileData: body.fileData !== undefined ? (body.fileData ? String(body.fileData) : null) : existing.fileData,
      fileName: body.fileName !== undefined ? (body.fileName ? String(body.fileName).trim() : null) : existing.fileName,
      updatedAt: new Date().toISOString(),
      updatedById: user.id,
      updatedByName: user.name,
    };

    items[idx] = updated;
    await kvSet(KEY, items);

    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const items = (await kvGet(KEY)) || [];
    const filtered = items.filter((item) => item.id !== id);

    if (filtered.length === items.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await kvSet(KEY, filtered);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
