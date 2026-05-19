import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";
import crypto from "crypto";

const KEY = "tcf:inventory";

function genId() {
  return crypto.randomBytes(8).toString("hex");
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const assignedToFilter = searchParams.get("assignedTo");

    let items = (await kvGet(KEY)) || [];

    if (statusFilter) items = items.filter((i) => i.orderStatus === statusFilter);
    if (assignedToFilter) items = items.filter((i) => i.personAddedId === assignedToFilter);

    return Response.json(items);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.itemName?.trim()) return Response.json({ error: "itemName is required" }, { status: 400 });

    const item = {
      id: genId(),
      itemName: body.itemName.trim(),
      date: today(),
      neededWhen: body.neededWhen || "",
      forWhat: body.forWhat || "",
      personAdded: user.name,
      personAddedId: user.id,
      orderStatus: body.orderStatus || "Not Started",
      location: body.location || "",
      notes: body.notes || "",
      url: body.url || "",
      createdAt: new Date().toISOString(),
    };

    const items = (await kvGet(KEY)) || [];
    items.unshift(item);
    await kvSet(KEY, items);

    return Response.json(item, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.id) return Response.json({ error: "id is required" }, { status: 400 });

    const items = (await kvGet(KEY)) || [];
    const idx = items.findIndex((i) => i.id === body.id);
    if (idx === -1) return Response.json({ error: "Item not found" }, { status: 404 });

    const { id, ...updates } = body;
    const updated = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    await kvSet(KEY, items);

    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "id query param required" }, { status: 400 });

    const items = (await kvGet(KEY)) || [];
    const item = items.find((i) => i.id === id);
    if (!item) return Response.json({ error: "Item not found" }, { status: 404 });

    if (user.role !== "admin" && item.personAddedId !== user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const filtered = items.filter((i) => i.id !== id);
    await kvSet(KEY, filtered);

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
