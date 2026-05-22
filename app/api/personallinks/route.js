import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId") || user.id;

    const links = (await kvGet(`tcf:personallinks:${targetId}`)) || [];
    return Response.json(links);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { emoji, name, url, description } = body;

    const link = {
      id: crypto.randomBytes(8).toString("hex"),
      emoji: emoji || null,
      name: name || "",
      url: url || "",
      description: description || "",
      createdAt: new Date().toISOString(),
    };

    const links = (await kvGet(`tcf:personallinks:${user.id}`)) || [];
    links.unshift(link);
    await kvSet(`tcf:personallinks:${user.id}`, links);

    return Response.json(link, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
