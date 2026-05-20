import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:circles";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const circles = (await kvGet(KEY)) || [];
    return Response.json(circles);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const circle = {
      id: crypto.randomBytes(8).toString("hex"),
      name: body.name || "New Circle",
      members: body.members || [],          // [{ id, name, email }]
      assignedMemberId: body.assignedMemberId || null,
      assignedMemberName: body.assignedMemberName || "",
      connectionReason: body.connectionReason || "",
      goals: body.goals || "",
      status: body.status || "active",      // active | paused | inactive
      rating: body.rating || 0,             // 0-5
      dinnerInvited: body.dinnerInvited || false,
      dinnerNotes: body.dinnerNotes || "",
      communicationPref: body.communicationPref || "",
      nextMeetup: body.nextMeetup || "",
      notes: body.notes || "",
      meetups: body.meetups || [],          // [{ id, date, notes, attendees, photos }]
      photos: body.photos || [],            // [{ url, caption, uploadedAt }]
      tasks: body.tasks || [],              // [{ id, text, done }]
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const circles = (await kvGet(KEY)) || [];
    circles.push(circle);
    await kvSet(KEY, circles);
    return Response.json(circle, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
