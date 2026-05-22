import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:assets";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const assets = (await kvGet(KEY)) || [];
    const idx = assets.findIndex((a) => a.id === id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

    const existing = assets[idx];
    if (user.role !== "admin" && existing.createdBy !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    assets[idx] = {
      ...existing,
      ...(body.name !== undefined && { name: body.name }),
      ...(body.type !== undefined && { type: body.type }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo }),
      ...(body.assignedToName !== undefined && { assignedToName: body.assignedToName }),
      ...(body.driveUrl !== undefined && { driveUrl: body.driveUrl }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.postTitle !== undefined && { postTitle: body.postTitle }),
      updatedAt: new Date().toISOString(),
    };

    await kvSet(KEY, assets);
    return Response.json(assets[idx]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const assets = (await kvGet(KEY)) || [];
    const asset = assets.find((a) => a.id === id);
    if (!asset) return Response.json({ error: "Not found" }, { status: 404 });

    if (user.role !== "admin" && asset.createdBy !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    await kvSet(KEY, assets.filter((a) => a.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
