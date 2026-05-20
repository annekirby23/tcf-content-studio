import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:tcfinfo";

const DEFAULT = {
  mission: "",
  values: "",
  motto: "",
  history: "",
  ourWhy: "",
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
    if (body.mission !== undefined) updated.mission = body.mission;
    if (body.values !== undefined) updated.values = body.values;
    if (body.motto !== undefined) updated.motto = body.motto;
    if (body.history !== undefined) updated.history = body.history;
    if (body.ourWhy !== undefined) updated.ourWhy = body.ourWhy;
    await kvSet(KEY, updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
