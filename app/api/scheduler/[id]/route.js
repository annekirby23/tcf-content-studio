import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const POSTS_KEY = "tcf:scheduler:posts";

const MEMBER_ALLOWED_STATUSES = ["draft", "review"];

export async function GET(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const posts = (await kvGet(POSTS_KEY)) || [];
    const post = posts.find((p) => p.id === id);
    if (!post) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(post);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const posts = (await kvGet(POSTS_KEY)) || [];
    const idx = posts.findIndex((p) => p.id === id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

    // Members cannot move posts to admin-only statuses
    if (user.role !== "admin" && body.status && !MEMBER_ALLOWED_STATUSES.includes(body.status)) {
      return Response.json({ error: "Insufficient permissions to set this status" }, { status: 403 });
    }

    posts[idx] = { ...posts[idx], ...body, id, updatedAt: new Date().toISOString() };
    await kvSet(POSTS_KEY, posts);
    return Response.json(posts[idx]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });

    const { id } = await params;
    const posts = (await kvGet(POSTS_KEY)) || [];
    const filtered = posts.filter((p) => p.id !== id);
    if (filtered.length === posts.length) return Response.json({ error: "Not found" }, { status: 404 });

    await kvSet(POSTS_KEY, filtered);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
