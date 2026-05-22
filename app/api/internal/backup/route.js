import { getSession } from "@/lib/serverAuth";
import { getRedis } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const redis = getRedis();
    const keys = await redis.keys("*");

    const dump = {};
    for (const key of keys) {
      const raw = await redis.get(key);
      try {
        dump[key] = JSON.parse(raw);
      } catch {
        dump[key] = raw;
      }
    }

    const json = JSON.stringify(dump, null, 2);
    const timestamp = new Date().toISOString().slice(0, 10);

    return new Response(json, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="tcf-backup-${timestamp}.json"`,
      },
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
