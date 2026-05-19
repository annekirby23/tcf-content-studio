import Redis from "ioredis";

const POSTS_KEY = "tcf:scheduler:posts";

let redis;
function getRedis() {
  if (!redis) redis = new Redis(process.env.REDIS_URL);
  return redis;
}

async function get(key) {
  const val = await getRedis().get(key);
  return val ? JSON.parse(val) : null;
}

async function set(key, value) {
  await getRedis().set(key, JSON.stringify(value));
}

export async function GET(req, { params }) {
  try {
    const posts = (await get(POSTS_KEY)) || [];
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
    const posts = (await get(POSTS_KEY)) || [];
    const idx = posts.findIndex((p) => p.id === params.id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });
    posts[idx] = { ...posts[idx], ...body, id: params.id, updatedAt: new Date().toISOString() };
    await set(POSTS_KEY, posts);
    return Response.json(posts[idx]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const posts = (await get(POSTS_KEY)) || [];
    const filtered = posts.filter((p) => p.id !== params.id);
    if (filtered.length === posts.length) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    await set(POSTS_KEY, filtered);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
