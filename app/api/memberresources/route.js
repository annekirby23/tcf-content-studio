import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:memberresources";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resources = (await kvGet(KEY)) || [];
    return NextResponse.json(resources);
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

    const {
      name,
      icon,
      tagline,
      description,
      howTo,
      waiverUrl,
      vendors,
      assignedMemberId,
      assignedMemberName,
      notes,
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const resource = {
      id: crypto.randomBytes(8).toString("hex"),
      name: name.trim(),
      icon: icon ? String(icon).trim() : "📦",
      tagline: tagline ? String(tagline).trim() : "",
      description: description ? String(description).trim() : "",
      howTo: howTo ? String(howTo).trim() : "",
      waiverUrl: waiverUrl ? String(waiverUrl).trim() : "",
      vendors: vendors ? String(vendors).trim() : "",
      assignedMemberId: assignedMemberId || "",
      assignedMemberName: assignedMemberName || "",
      notes: notes ? String(notes).trim() : "",
      createdAt: new Date().toISOString(),
      createdById: user.id,
      createdByName: user.name,
    };

    const resources = (await kvGet(KEY)) || [];
    resources.push(resource);
    await kvSet(KEY, resources);

    return NextResponse.json(resource, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
