import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const links = (await kvGet(`tcf:personallinks:${user.id}`)) || [];
    const index = links.findIndex((l) => l.id === id);
    if (index === -1) return Response.json({ error: "Link not found" }, { status: 404 });

    const link = { ...links[index] };
    if (body.emoji !== undefined) link.emoji = body.emoji;
    if (body.name !== undefined) link.name = body.name;
    if (body.url !== undefined) link.url = body.url;
    if (body.description !== undefined) link.description = body.description;

    links[index] = link;
    await kvSet(`tcf:personallinks:${user.id}`, links);

    return Response.json(link);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const links = (await kvGet(`tcf:personallinks:${user.id}`)) || [];
    const exists = links.some((l) => l.id === id);
    if (!exists) return Response.json({ error: "Link not found" }, { status: 404 });

    const updated = links.filter((l) => l.id !== id);
    await kvSet(`tcf:personallinks:${user.id}`, updated);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
