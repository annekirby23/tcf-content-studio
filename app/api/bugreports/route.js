import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:bugreports";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const reports = (await kvGet(KEY)) || [];
    return Response.json(reports);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { title, description, priority = "medium" } = body;
    if (!title?.trim()) return Response.json({ error: "Title required" }, { status: 400 });

    const report = {
      id: crypto.randomBytes(6).toString("hex"),
      title: title.trim(),
      description: (description || "").trim(),
      priority,
      status: "open",
      submittedBy: user.name,
      submittedById: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      adminNote: "",
    };
    const reports = (await kvGet(KEY)) || [];
    reports.unshift(report);
    await kvSet(KEY, reports);
    return Response.json(report, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const { id, status, adminNote } = await req.json();
    const reports = (await kvGet(KEY)) || [];
    const idx = reports.findIndex((r) => r.id === id);
    if (idx === -1) return Response.json({ error: "Not found" }, { status: 404 });

    // Only admins can change status; anyone can add a note if it's their own report
    if (status !== undefined) {
      if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
      reports[idx].status = status;
    }
    if (adminNote !== undefined && user.role === "admin") {
      reports[idx].adminNote = adminNote;
    }
    reports[idx].updatedAt = new Date().toISOString();
    await kvSet(KEY, reports);
    return Response.json(reports[idx]);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getSession(req);
    if (!user || user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await req.json();
    const reports = (await kvGet(KEY)) || [];
    await kvSet(KEY, reports.filter((r) => r.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
