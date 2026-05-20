import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:dailyops:reference";

const DEFAULT_REFERENCE = {
  mail: { description: "", steps: [], notes: "" },
  tours: { description: "", steps: [], notes: "" },
  communication: [],
  papercut: { description: "", steps: [], notes: "" },
  parking: { description: "", steps: [], notes: "" },
  daypasser: { description: "", steps: [], notes: "" },
  guests: { description: "", steps: [], notes: "" },
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await kvGet(KEY)) || DEFAULT_REFERENCE;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const existing = (await kvGet(KEY)) || { ...DEFAULT_REFERENCE };

    const SECTION_KEYS = ["mail", "tours", "papercut", "parking", "daypasser", "guests"];
    for (const key of SECTION_KEYS) {
      if (body[key] !== undefined) {
        existing[key] = { ...(existing[key] || {}), ...body[key] };
      }
    }

    if (body.communication !== undefined) {
      if (Array.isArray(body.communication)) {
        existing.communication = body.communication.map((tpl) => ({
          id: tpl.id || crypto.randomBytes(8).toString("hex"),
          name: String(tpl.name || "").trim(),
          subject: String(tpl.subject || "").trim(),
          body: String(tpl.body || "").trim(),
        }));
      }
    }

    await kvSet(KEY, existing);
    return NextResponse.json(existing);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
