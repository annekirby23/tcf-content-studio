import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:leadership";

const DEFAULT_DATA = {
  driveUrl: "",
  meetings: [],
  agenda: [],
  meetingNotes: [],
  tasks: [],
  workingOn: [],
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await kvGet(KEY)) || DEFAULT_DATA;
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const current = (await kvGet(KEY)) || { ...DEFAULT_DATA };

    const updated = { ...current, ...body };
    await kvSet(KEY, updated);

    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
