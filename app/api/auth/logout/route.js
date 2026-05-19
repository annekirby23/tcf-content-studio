import { deleteSession } from "@/lib/serverAuth";

export async function POST(req) {
  try {
    const token = req.headers.get("x-session");
    if (token) await deleteSession(token);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
