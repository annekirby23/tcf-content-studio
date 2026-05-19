import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";
import crypto from "crypto";

const KEY = "tcf:assets";

function genId() {
  return crypto.randomBytes(8).toString("hex");
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const assets = (await kvGet(KEY)) || [];
    return Response.json(assets);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.name?.trim()) return Response.json({ error: "name is required" }, { status: 400 });
    if (!body.type?.trim()) return Response.json({ error: "type is required" }, { status: 400 });

    const asset = {
      id: genId(),
      name: body.name.trim(),
      type: body.type.trim(),
      status: body.status || "needed",
      assignedTo: body.assignedTo || null,
      assignedToName: body.assignedToName || null,
      driveUrl: body.driveUrl?.trim() || null,
      notes: body.notes?.trim() || null,
      dueDate: body.dueDate || null,
      postTitle: body.postTitle?.trim() || null,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const assets = (await kvGet(KEY)) || [];
    assets.unshift(asset);
    await kvSet(KEY, assets);
    return Response.json(asset, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
