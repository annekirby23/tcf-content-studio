import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:roho";

const DEFAULT = {
  about: "",
  teamMembers: [],
  tasks: [],
  meetingNotes: [],
  spaceNeeds: [],
  eventCoverage: [],
};

function genId() {
  return crypto.randomBytes(8).toString("hex");
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await kvGet(KEY)) || { ...DEFAULT };
    // Ensure all arrays exist
    for (const k of ["teamMembers","tasks","meetingNotes","spaceNeeds","eventCoverage"]) {
      if (!Array.isArray(data[k])) data[k] = [];
    }
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
    for (const k of ["teamMembers","tasks","meetingNotes","spaceNeeds","eventCoverage"]) {
      if (!Array.isArray(existing[k])) existing[k] = [];
    }

    if (body.about !== undefined) existing.about = String(body.about);

    if (body.teamMembers !== undefined && Array.isArray(body.teamMembers)) {
      existing.teamMembers = body.teamMembers.map((m) => ({
        id: m.id || genId(),
        userId: String(m.userId || ""),
        name: String(m.name || "").trim(),
        role: String(m.role || "").trim(),
      }));
    }

    if (body.tasks !== undefined && Array.isArray(body.tasks)) {
      existing.tasks = body.tasks.map((t) => ({
        id: t.id || genId(),
        text: String(t.text || "").trim(),
        assigneeId: String(t.assigneeId || ""),
        assigneeName: String(t.assigneeName || "").trim(),
        dueDate: String(t.dueDate || ""),
        priority: ["high","medium","low"].includes(t.priority) ? t.priority : "medium",
        done: Boolean(t.done),
        createdAt: t.createdAt || new Date().toISOString(),
      }));
    }

    if (body.meetingNotes !== undefined && Array.isArray(body.meetingNotes)) {
      existing.meetingNotes = body.meetingNotes.map((n) => ({
        id: n.id || genId(),
        date: String(n.date || ""),
        title: String(n.title || "").trim(),
        content: String(n.content || ""),
        authorId: String(n.authorId || ""),
        authorName: String(n.authorName || "").trim(),
        createdAt: n.createdAt || new Date().toISOString(),
      }));
    }

    if (body.spaceNeeds !== undefined && Array.isArray(body.spaceNeeds)) {
      existing.spaceNeeds = body.spaceNeeds.map((s) => ({
        id: s.id || genId(),
        text: String(s.text || "").trim(),
        status: ["open","in-progress","done"].includes(s.status) ? s.status : "open",
        priority: ["high","medium","low"].includes(s.priority) ? s.priority : "medium",
        reportedBy: String(s.reportedBy || "").trim(),
        reportedById: String(s.reportedById || ""),
        notes: String(s.notes || ""),
        createdAt: s.createdAt || new Date().toISOString(),
      }));
    }

    if (body.eventCoverage !== undefined && Array.isArray(body.eventCoverage)) {
      existing.eventCoverage = body.eventCoverage.map((e) => ({
        id: e.id || genId(),
        title: String(e.title || "").trim(),
        date: String(e.date || ""),
        location: String(e.location || "").trim(),
        notes: String(e.notes || ""),
        slots: Array.isArray(e.slots) ? e.slots.map((sl) => ({
          slotIndex: Number(sl.slotIndex ?? 0),
          userId: String(sl.userId || ""),
          name: String(sl.name || "").trim(),
          coverDate: String(sl.coverDate || ""),
        })) : [],
      }));
    }

    await kvSet(KEY, existing);
    return NextResponse.json(existing);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
