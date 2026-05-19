import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const POSTS_KEY = "tcf:scheduler:posts";
const CAMPAIGNS_KEY = "tcf:scheduler:campaigns";

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    if (type === "campaigns") {
      return Response.json((await kvGet(CAMPAIGNS_KEY)) || []);
    }

    const posts = (await kvGet(POSTS_KEY)) || [];
    const platform = url.searchParams.get("platform");
    const status = url.searchParams.get("status");
    const campaign = url.searchParams.get("campaign");
    const month = url.searchParams.get("month");

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
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type, ...data } = body;
    const now = new Date().toISOString();

    if (type === "campaign") {
      const campaigns = (await kvGet(CAMPAIGNS_KEY)) || [];
      const campaign = { ...data, id: genId(), createdAt: now, updatedAt: now };
      campaigns.push(campaign);
      await kvSet(CAMPAIGNS_KEY, campaigns);
      return Response.json(campaign, { status: 201 });
    }

    // Members can only create draft or review posts
    if (user.role !== "admin" && !["draft", "review"].includes(data.status)) {
      data.status = "draft";
    }

    const posts = (await kvGet(POSTS_KEY)) || [];
    const post = { ...data, id: genId(), createdBy: user.id, createdAt: now, updatedAt: now };
    posts.push(post);
    await kvSet(POSTS_KEY, posts);
    return Response.json(post, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
