import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId") || user.id;

    const notes = (await kvGet(`tcf:personalnotes:${targetId}`)) || [];
    return Response.json(notes);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, content } = body;

    const now = new Date().toISOString();
    const note = {
      id: crypto.randomBytes(8).toString("hex"),
      title: title || "",
      content: content || "",
      createdAt: now,
      updatedAt: now,
    };

    const notes = (await kvGet(`tcf:personalnotes:${user.id}`)) || [];
    notes.unshift(note);
    await kvSet(`tcf:personalnotes:${user.id}`, notes);

    return Response.json(note, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
