import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId") || user.id;
    const data = (await kvGet(`tcf:blockschedule:${targetId}`)) || { blocks: [] };
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
    const targetId = (user.role === "admin" && body.targetUserId) ? body.targetUserId : user.id;
    const data = { blocks: body.blocks || [], updatedAt: new Date().toISOString() };
    await kvSet(`tcf:blockschedule:${targetId}`, data);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
