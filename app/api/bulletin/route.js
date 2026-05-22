import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:bulletin";

const DEFAULT_DATA = {
  posts: [],
  shoutouts: [],
  memberCount: 356,
  memberGoal: 400,
  memberGoalDate: "September 2026",
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await kvGet(KEY)) || DEFAULT_DATA;
    // Backfill defaults
    if (data.memberCount === undefined) data.memberCount = 356;
    if (data.memberGoal === undefined) data.memberGoal = 400;
    if (data.memberGoalDate === undefined) data.memberGoalDate = "September 2026";
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    const body = await req.json();
    const data = (await kvGet(KEY)) || { ...DEFAULT_DATA };

    // ── Edit an existing post ───────────────────────────────────────────────────
    if (body.postId) {
      data.posts = (data.posts || []).map((p) => {
        if (p.id !== body.postId) return p;
        return {
          ...p,
          title: body.title !== undefined ? body.title : p.title,
          content: body.content !== undefined ? body.content : p.content,
          pinned: body.pinned !== undefined ? !!body.pinned : p.pinned,
          mustRead: body.mustRead !== undefined ? !!body.mustRead : p.mustRead,
          showOnWorkspace: body.showOnWorkspace !== undefined ? !!body.showOnWorkspace : p.showOnWorkspace,
          updatedAt: new Date().toISOString(),
        };
      });
      await kvSet(KEY, data);
      return Response.json(data);
    }

    // ── Member count / goal update ──────────────────────────────────────────────
    if (body.memberCount !== undefined) data.memberCount = Number(body.memberCount);
    if (body.memberGoal !== undefined) data.memberGoal = Number(body.memberGoal);
    if (body.memberGoalDate !== undefined) data.memberGoalDate = body.memberGoalDate;

    // ── Image uploads ───────────────────────────────────────────────────────────
    if (body.calendarImage !== undefined) data.calendarImage = body.calendarImage;
    if (body.teamScheduleImage !== undefined) data.teamScheduleImage = body.teamScheduleImage;
    if (body.teamScheduleImage2 !== undefined) data.teamScheduleImage2 = body.teamScheduleImage2;
    if (body.monthlyScheduleImage !== undefined) data.monthlyScheduleImage = body.monthlyScheduleImage;

    await kvSet(KEY, data);
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
    const data = (await kvGet(KEY)) || { ...DEFAULT_DATA };

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
        mustRead: !!body.mustRead,
        showOnWorkspace: !!body.showOnWorkspace,
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
    const data = (await kvGet(KEY)) || { ...DEFAULT_DATA };

    if (type === "shoutout") {
      const item = (data.shoutouts || []).find((s) => s.id === id);
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
