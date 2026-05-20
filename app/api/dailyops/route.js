import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:dailyops";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const checklists = (await kvGet(KEY)) || [];

    const { searchParams } = new URL(req.url);
    const assignedTo = searchParams.get("assignedTo");

    if (assignedTo) {
      return NextResponse.json(checklists.filter((c) => c.assignedMemberId === assignedTo));
    }

    return NextResponse.json(checklists);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { title, location, type, assignedMemberId, assignedMemberName, items, notes } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const checklist = {
      id: crypto.randomBytes(8).toString("hex"),
      title: title.trim(),
      location: location ? String(location).trim() : "",
      type: type === "close" ? "close" : "open",
      assignedMemberId: assignedMemberId || "",
      assignedMemberName: assignedMemberName || "",
      items: Array.isArray(items) ? items.map((item) => ({ id: item.id || crypto.randomBytes(4).toString("hex"), text: String(item.text || "").trim() })) : [],
      notes: notes ? String(notes).trim() : "",
      createdAt: new Date().toISOString(),
      createdById: user.id,
      createdByName: user.name,
    };

    const checklists = (await kvGet(KEY)) || [];
    checklists.unshift(checklist);
    await kvSet(KEY, checklists);

    return NextResponse.json(checklist, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
