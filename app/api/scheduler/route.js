import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const POSTS_KEY = "tcf:scheduler:posts";
const CAMPAIGNS_KEY = "tcf:scheduler:campaigns";

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    if (type === "campaigns") {
      const campaigns = (await kv.get(CAMPAIGNS_KEY)) || [];
      return Response.json(campaigns);
    }

    const posts = (await kv.get(POSTS_KEY)) || [];
    const platform = url.searchParams.get("platform");
    const status = url.searchParams.get("status");
    const campaign = url.searchParams.get("campaign");
    const month = url.searchParams.get("month"); // YYYY-MM

    let filtered = posts;
    if (platform) filtered = filtered.filter((p) => p.platforms?.includes(platform));
    if (status) filtered = filtered.filter((p) => p.status === status);
    if (campaign) filtered = filtered.filter((p) => p.campaign === campaign);
    if (month) filtered = filtered.filter((p) => p.scheduledDate?.startsWith(month));

    filtered.sort((a, b) => {
      const da = `${a.scheduledDate || "9999"}T${a.scheduledTime || "00:00"}`;
      const db = `${b.scheduledDate || "9999"}T${b.scheduledTime || "00:00"}`;
      return da.localeCompare(db);
    });

    return Response.json(filtered);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { type, ...data } = body;

    if (type === "campaign") {
      const campaigns = (await kv.get(CAMPAIGNS_KEY)) || [];
      const now = new Date().toISOString();
      const campaign = { ...data, id: genId(), createdAt: now, updatedAt: now };
      campaigns.push(campaign);
      await kv.set(CAMPAIGNS_KEY, campaigns);
      return Response.json(campaign, { status: 201 });
    }

    const posts = (await kv.get(POSTS_KEY)) || [];
    const now = new Date().toISOString();
    const post = { ...data, id: genId(), createdAt: now, updatedAt: now };
    posts.push(post);
    await kv.set(POSTS_KEY, posts);
    return Response.json(post, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
