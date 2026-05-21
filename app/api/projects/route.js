import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:projects";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const projects = (await kvGet(KEY)) || [];
    // If a userId is provided, return projects the user owns OR is a collaborator on
    const filtered = userId
      ? projects.filter((p) =>
          p.createdById === userId ||
          (Array.isArray(p.members) && p.members.some((m) => (m.id || m) === userId))
        )
      : projects;
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
    const { name, description, details, link, color, status, members } = body;

    const project = {
      id: crypto.randomBytes(8).toString("hex"),
      name,
      description: description || "",
      details: details || "",
      link: link || "",
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
