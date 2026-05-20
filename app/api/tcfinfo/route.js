import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:tcfinfo";

const ALLOWED = ["mission", "values", "motto", "history", "ourWhy", "website", "instagram", "facebook", "linkedin", "tiktok", "youtube"];

const DEFAULT = {
  mission: "", values: "", motto: "", history: "", ourWhy: "",
  website: "", instagram: "", facebook: "", linkedin: "", tiktok: "", youtube: "",
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
    const current = (await kvGet(KEY)) || { ...DEFAULT };
    const updated = { ...current };
    ALLOWED.forEach((key) => { if (body[key] !== undefined) updated[key] = body[key]; });
    await kvSet(KEY, updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
