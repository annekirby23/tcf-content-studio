import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId") || user.id;

    const tasks = (await kvGet(`tcf:dailytasks:${targetId}`)) || [];
    return Response.json(tasks);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { text, days } = body;

    const task = {
      id: crypto.randomBytes(8).toString("hex"),
      text,
      done: false,
      days: Array.isArray(days) && days.length > 0 ? days : ["mon","tue","wed","thu","fri"],
      createdAt: new Date().toISOString(),
    };

    const tasks = (await kvGet(`tcf:dailytasks:${user.id}`)) || [];
    tasks.unshift(task);
    await kvSet(`tcf:dailytasks:${user.id}`, tasks);

    return Response.json(task, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
