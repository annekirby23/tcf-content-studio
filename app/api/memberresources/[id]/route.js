import { NextResponse } from "next/server";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:memberresources";

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

    const resources = (await kvGet(KEY)) || [];
    const idx = resources.findIndex((r) => r.id === id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const existing = resources[idx];
    const updated = {
      ...existing,
      name: body.name !== undefined ? String(body.name).trim() : existing.name,
      icon: body.icon !== undefined ? String(body.icon).trim() : existing.icon,
      tagline: body.tagline !== undefined ? String(body.tagline).trim() : existing.tagline,
      description: body.description !== undefined ? String(body.description).trim() : existing.description,
      howTo: body.howTo !== undefined ? String(body.howTo).trim() : existing.howTo,
      waiverUrl: body.waiverUrl !== undefined ? String(body.waiverUrl).trim() : existing.waiverUrl,
      vendors: body.vendors !== undefined ? String(body.vendors).trim() : existing.vendors,
      assignedMemberId: body.assignedMemberId !== undefined ? body.assignedMemberId : existing.assignedMemberId,
      assignedMemberName: body.assignedMemberName !== undefined ? body.assignedMemberName : existing.assignedMemberName,
      notes: body.notes !== undefined ? String(body.notes).trim() : existing.notes,
      updatedAt: new Date().toISOString(),
      updatedById: user.id,
      updatedByName: user.name,
    };

    resources[idx] = updated;
    await kvSet(KEY, resources);

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

    const resources = (await kvGet(KEY)) || [];
    const filtered = resources.filter((r) => r.id !== id);

    if (filtered.length === resources.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await kvSet(KEY, filtered);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
