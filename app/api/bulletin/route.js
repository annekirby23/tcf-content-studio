import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:bulletin";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await kvGet(KEY)) || { posts: [], shoutouts: [] };
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const data = (await kvGet(KEY)) || { posts: [], shoutouts: [] };

    if (body.type === "shoutout") {
      const shoutout = {
        id: crypto.randomBytes(6).toString("hex"),
        fromId: user.id,
        fromName: user.name,
        toId: body.toId,
        toName: body.toName,
        message: body.message || "",
        createdAt: new Date().toISOString(),
      };
      data.shoutouts = [shoutout, ...(data.shoutouts || [])];
    } else {
      if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
      const post = {
        id: crypto.randomBytes(6).toString("hex"),
        authorId: user.id,
        authorName: user.name,
        title: body.title || "",
        content: body.content || "",
        pinned: !!body.pinned,
        createdAt: new Date().toISOString(),
      };
      data.posts = [post, ...(data.posts || [])];
    }

    await kvSet(KEY, data);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { id, type } = await req.json();
    const data = (await kvGet(KEY)) || { posts: [], shoutouts: [] };

    if (type === "shoutout") {
      const item = data.shoutouts.find((s) => s.id === id);
      if (item && item.fromId !== user.id && user.role !== "admin") {
        return Response.json({ error: "Forbidden" }, { status: 403 });
      }
      data.shoutouts = (data.shoutouts || []).filter((s) => s.id !== id);
    } else {
      if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
      data.posts = (data.posts || []).filter((p) => p.id !== id);
    }

    await kvSet(KEY, data);
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
