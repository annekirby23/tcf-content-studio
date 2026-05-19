import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const projects = (await kvGet(`tcf:projects:${user.id}`)) || [];
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
    const { name, description, color, status } = body;

    const project = {
      id: crypto.randomBytes(8).toString("hex"),
      name,
      description: description || "",
      color: color || null,
      status: status || "active",
      tasks: [],
      createdAt: new Date().toISOString(),
    };

    const projects = (await kvGet(`tcf:projects:${user.id}`)) || [];
    projects.unshift(project);
    await kvSet(`tcf:projects:${user.id}`, projects);

    return Response.json(project, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
