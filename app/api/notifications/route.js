import { getSession } from "@/lib/serverAuth";
import { getRedis } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const redis = getRedis();
    const notifKey = `tcf:notifications:${user.id}`;
    const notifications = JSON.parse((await redis.get(notifKey)) || "[]");
    return Response.json(notifications);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { ids } = await req.json(); // array of notification ids to mark read, or empty = mark all
    const redis = getRedis();
    const notifKey = `tcf:notifications:${user.id}`;
    const notifications = JSON.parse((await redis.get(notifKey)) || "[]");

    const updated = notifications.map((n) =>
      (!ids || ids.includes(n.id)) ? { ...n, read: true } : n
    );
    await redis.set(notifKey, JSON.stringify(updated));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
