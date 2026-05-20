import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:confrooms:settings";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const settings = (await kvGet(KEY)) || {};
    return Response.json(settings);
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
    const existing = (await kvGet(KEY)) || {};
    const updated = {
      ...existing,
      ...(body.skeddaEmbedUrl !== undefined && { skeddaEmbedUrl: body.skeddaEmbedUrl }),
      ...(body.honeyBookEmbedUrl !== undefined && { honeyBookEmbedUrl: body.honeyBookEmbedUrl }),
      ...(body.honeyBookEmbedCode !== undefined && { honeyBookEmbedCode: body.honeyBookEmbedCode }),
      updatedAt: new Date().toISOString(),
    };
    await kvSet(KEY, updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
