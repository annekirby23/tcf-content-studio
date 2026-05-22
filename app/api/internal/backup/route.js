import { getRedis, kvGet } from "@/lib/redis";

export async function GET(req) {
  try {
    // Session token can come from x-session header OR ?token= query param
    // (query param allows direct browser URL access)
    const url = new URL(req.url);
    const token =
      req.headers.get("x-session") || url.searchParams.get("token");

    if (!token) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const redis = getRedis();
    const userId = await redis.get(`tcf:session:${token}`);
    if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const users = (await kvGet("tcf:users")) || [];
    const user = users.find((u) => u.id === userId);
    if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

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
