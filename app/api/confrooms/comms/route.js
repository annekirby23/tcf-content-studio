import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:confrooms:comms";

function genId() {
  return crypto.randomBytes(8).toString("hex");
}

const DEFAULT = { cards: [] };

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await kvGet(KEY)) || { ...DEFAULT };
    if (!Array.isArray(data.cards)) data.cards = [];
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try { body = await req.json(); } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const existing = (await kvGet(KEY)) || { ...DEFAULT };
    if (!Array.isArray(existing.cards)) existing.cards = [];

    if (body.cards !== undefined && Array.isArray(body.cards)) {
      existing.cards = body.cards.map((c) => ({
        id: c.id || genId(),
        type: ["email", "howto", "general"].includes(c.type) ? c.type : "general",
        title: String(c.title || "").trim(),
        category: String(c.category || "").trim(),
        subject: String(c.subject || "").trim(),
        overview: String(c.overview || ""),
        body: String(c.body || ""),
        steps: Array.isArray(c.steps) ? c.steps.map(String) : [],
        notes: String(c.notes || ""),
        createdAt: c.createdAt || new Date().toISOString(),
      }));
    }

    await kvSet(KEY, existing);
    return NextResponse.json(existing);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
