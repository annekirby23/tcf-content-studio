import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const GOALS_KEY = "tcf:goals";

const DEFAULTS = {
  publishedPerMonth: 20,
  scheduledPerWeek: 5,
  reviewTargetDays: 2,
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const goals = (await kvGet(GOALS_KEY)) || DEFAULTS;
    return Response.json(goals);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const body = await req.json();
    const current = (await kvGet(GOALS_KEY)) || DEFAULTS;
    const updated = {
      publishedPerMonth: Math.max(1, parseInt(body.publishedPerMonth) || current.publishedPerMonth),
      scheduledPerWeek: Math.max(1, parseInt(body.scheduledPerWeek) || current.scheduledPerWeek),
      reviewTargetDays: Math.max(1, parseInt(body.reviewTargetDays) || current.reviewTargetDays),
    };
    await kvSet(GOALS_KEY, updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
