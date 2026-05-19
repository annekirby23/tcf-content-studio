import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const POSTS_KEY = "tcf:scheduler:posts";

export async function GET(req, { params }) {
  try {
    const posts = (await kv.get(POSTS_KEY)) || [];
    const post = posts.find((p) => p.id === params.id);
    if (!post) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(post);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const body = await req.json();
    const posts = (await kv.get(POSTS_KEY)) || [];
    const idx = posts.findIndex((p) => p.id === params.id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });
    posts[idx] = { ...posts[idx], ...body, id: params.id, updatedAt: new Date().toISOString() };
    await kv.set(POSTS_KEY, posts);
    return Response.json(posts[idx]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const posts = (await kv.get(POSTS_KEY)) || [];
    const filtered = posts.filter((p) => p.id !== params.id);
    if (filtered.length === posts.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    await kv.set(POSTS_KEY, filtered);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
