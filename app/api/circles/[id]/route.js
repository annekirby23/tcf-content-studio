import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:circles";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const circles = (await kvGet(KEY)) || [];
    const index = circles.findIndex((c) => c.id === id);
    if (index === -1) return Response.json({ error: "Circle not found" }, { status: 404 });

    const circle = { ...circles[index] };
    const fields = ["name","members","assignedMemberId","assignedMemberName","connectionReason",
                    "goals","status","rating","dinnerInvited","dinnerNotes","communicationPref",
                    "nextMeetup","notes","meetups","photos","tasks"];
    for (const f of fields) { if (body[f] !== undefined) circle[f] = body[f]; }
    circle.updatedAt = new Date().toISOString();

    circles[index] = circle;
    await kvSet(KEY, circles);
    return Response.json(circle);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const circles = (await kvGet(KEY)) || [];
    if (!circles.some((c) => c.id === id)) return Response.json({ error: "Circle not found" }, { status: 404 });

    await kvSet(KEY, circles.filter((c) => c.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
