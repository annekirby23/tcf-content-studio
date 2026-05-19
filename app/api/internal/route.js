import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await kvGet("tcf:internal")) || { hrInfo: "", contacts: "", membership: "" };
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
    const existing = (await kvGet("tcf:internal")) || { hrInfo: "", contacts: "", membership: "" };
    const updated = {
      ...existing,
      ...(body.hrInfo !== undefined && { hrInfo: body.hrInfo }),
      ...(body.contacts !== undefined && { contacts: body.contacts }),
      ...(body.membership !== undefined && { membership: body.membership }),
      updatedAt: new Date().toISOString(),
      updatedBy: user.id,
    };

    await kvSet("tcf:internal", updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
