import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const projects = (await kvGet(`tcf:projects:${user.id}`)) || [];
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return Response.json({ error: "Project not found" }, { status: 404 });

    const project = { ...projects[index], tasks: [...(projects[index].tasks || [])] };

    if (body.taskAction === "add") {
      const task = {
        id: crypto.randomBytes(8).toString("hex"),
        text: body.taskText,
        done: false,
        createdAt: new Date().toISOString(),
      };
      project.tasks.push(task);
    } else if (body.taskAction === "toggle") {
      const taskIndex = project.tasks.findIndex((t) => t.id === body.taskId);
      if (taskIndex === -1) return Response.json({ error: "Task not found" }, { status: 404 });
      project.tasks[taskIndex] = { ...project.tasks[taskIndex], done: !project.tasks[taskIndex].done };
    } else if (body.taskAction === "delete") {
      project.tasks = project.tasks.filter((t) => t.id !== body.taskId);
    } else {
      if (body.name !== undefined) project.name = body.name;
      if (body.description !== undefined) project.description = body.description;
      if (body.color !== undefined) project.color = body.color;
      if (body.status !== undefined) project.status = body.status;
    }

    projects[index] = project;
    await kvSet(`tcf:projects:${user.id}`, projects);

    return Response.json(project);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const projects = (await kvGet(`tcf:projects:${user.id}`)) || [];
    const exists = projects.some((p) => p.id === id);
    if (!exists) return Response.json({ error: "Project not found" }, { status: 404 });

    const updated = projects.filter((p) => p.id !== id);
    await kvSet(`tcf:projects:${user.id}`, updated);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
