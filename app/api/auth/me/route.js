import { getSession } from "@/lib/serverAuth";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    return Response.json(user);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
