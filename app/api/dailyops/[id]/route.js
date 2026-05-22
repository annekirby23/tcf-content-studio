import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:dailyops";

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

    const checklists = (await kvGet(KEY)) || [];
    const idx = checklists.findIndex((c) => c.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = checklists[idx];
    const updated = {
      ...existing,
      title: body.title !== undefined ? String(body.title).trim() : existing.title,
      location: body.location !== undefined ? String(body.location).trim() : existing.location,
      type: body.type !== undefined ? (body.type === "close" ? "close" : "open") : existing.type,
      assignedMemberId: body.assignedMemberId !== undefined ? body.assignedMemberId : existing.assignedMemberId,
      assignedMemberName: body.assignedMemberName !== undefined ? body.assignedMemberName : existing.assignedMemberName,
      items: body.items !== undefined
        ? Array.isArray(body.items)
          ? body.items.map((item) => ({ id: item.id || crypto.randomBytes(4).toString("hex"), text: String(item.text || "").trim() }))
          : existing.items
        : existing.items,
      notes: body.notes !== undefined ? String(body.notes).trim() : existing.notes,
      updatedAt: new Date().toISOString(),
      updatedById: user.id,
      updatedByName: user.name,
    };

    checklists[idx] = updated;
    await kvSet(KEY, checklists);

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

    const checklists = (await kvGet(KEY)) || [];
    const filtered = checklists.filter((c) => c.id !== id);

    if (filtered.length === checklists.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await kvSet(KEY, filtered);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
