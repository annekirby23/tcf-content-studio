import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:projects";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const projects = (await kvGet(KEY)) || [];
    return Response.json(projects);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, description, color, status, members } = body;

    const project = {
      id: crypto.randomBytes(8).toString("hex"),
      name,
      description: description || "",
      color: color || null,
      status: status || "planning",
      tasks: [],
      members: Array.isArray(members) ? members : [],
      statusUpdates: [],
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString(),
    };

    const projects = (await kvGet(KEY)) || [];
    projects.unshift(project);
    await kvSet(KEY, projects);

    return Response.json(project, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
