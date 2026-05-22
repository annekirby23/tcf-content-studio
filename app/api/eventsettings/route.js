import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:eventsettings";

const DEFAULT = {
  clubs: ["General", "Youth", "Fitness", "Social", "Wellness", "Community"],
  slackChannels: ["#general", "#events", "#team", "#announcements"],
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await kvGet(KEY)) || DEFAULT;
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const current = (await kvGet(KEY)) || DEFAULT;
    const updated = { ...current };
    if (Array.isArray(body.clubs)) updated.clubs = body.clubs;
    if (Array.isArray(body.slackChannels)) updated.slackChannels = body.slackChannels;
    await kvSet(KEY, updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
