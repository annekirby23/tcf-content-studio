import { getSession, getUsers } from "@/lib/serverAuth";
import { kvGet, kvSet, getRedis } from "@/lib/redis";
import crypto from "crypto";

const POSTS_KEY = "tcf:scheduler:posts";

function genId() {
  return crypto.randomBytes(8).toString("hex");
}

function parseMentions(text, users) {
  const mentions = [];
  const regex = /@([\w\s]+?)(?=\s|$|@)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].trim();
    const user = users.find((u) => u.name.toLowerCase() === name.toLowerCase());
    if (user) mentions.push({ id: user.id, name: user.name });
  }
  return mentions;
}

export async function POST(req) {
  try {
    const currentUser = await getSession(req);
    if (!currentUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { postId, text } = await req.json();
    if (!postId || !text?.trim()) return Response.json({ error: "postId and text are required" }, { status: 400 });

    const posts = (await kvGet(POSTS_KEY)) || [];
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx === -1) return Response.json({ error: "Post not found" }, { status: 404 });

    const users = await getUsers();
    const mentions = parseMentions(text, users);

    const note = {
      id: genId(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      text: text.trim(),
      mentions: mentions.map((m) => m.id),
      createdAt: new Date().toISOString(),
    };

    if (!posts[idx].notes) posts[idx].notes = [];
    posts[idx].notes.push(note);
    await kvSet(POSTS_KEY, posts);

    // Create notifications for each mentioned user
    if (mentions.length > 0) {
      const redis = getRedis();
      for (const mentioned of mentions) {
        if (mentioned.id === currentUser.id) continue;
        const notifKey = `tcf:notifications:${mentioned.id}`;
        const existing = JSON.parse((await redis.get(notifKey)) || "[]");
        existing.unshift({
          id: genId(),
          postId,
          postTitle: posts[idx].title,
          noteId: note.id,
          noteText: text.trim(),
          mentionedBy: currentUser.name,
          read: false,
          createdAt: note.createdAt,
        });
        await redis.set(notifKey, JSON.stringify(existing.slice(0, 50)));
      }
    }

    return Response.json(note, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
