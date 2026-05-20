import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:calevents";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const events = (await kvGet(KEY)) || [];
    return Response.json(events);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// Generate recurring dates from a start date
function generateDates(startDate, frequency, endDate, count) {
  const dates = [];
  const start = new Date(startDate + "T12:00:00Z");
  const end = endDate ? new Date(endDate + "T12:00:00Z") : null;
  const maxCount = count || 52; // safety cap

  let current = new Date(start);
  let i = 0;

  while (i < maxCount) {
    if (end && current > end) break;
    dates.push(current.toISOString().split("T")[0]);
    i++;
    if (i >= maxCount) break;

    switch (frequency) {
      case "daily":    current.setDate(current.getDate() + 1); break;
      case "weekly":   current.setDate(current.getDate() + 7); break;
      case "biweekly": current.setDate(current.getDate() + 14); break;
      case "monthly":  current.setMonth(current.getMonth() + 1); break;
      case "yearly":   current.setFullYear(current.getFullYear() + 1); break;
      default:         current.setDate(current.getDate() + 7);
    }
  }

  return dates;
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();

    const events = (await kvGet(KEY)) || [];

    // Recurring: generate multiple events
    if (body.recurring && body.date) {
      const recurringGroupId = crypto.randomBytes(8).toString("hex");
      const dates = generateDates(body.date, body.recurringFrequency || "weekly", body.recurringEndDate || null, body.recurringCount || null);

      const newEvents = dates.map((date) => ({
        id: crypto.randomBytes(8).toString("hex"),
        title: body.title || "Untitled Event",
        date,
        description: body.description || "",
        color: body.color || "#10B981",
        allDay: true,
        recurring: true,
        recurringGroupId,
        recurringFrequency: body.recurringFrequency || "weekly",
        createdBy: user.name,
        createdById: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      events.push(...newEvents);
      await kvSet(KEY, events);
      return Response.json(newEvents, { status: 201 });
    }

    // Single event
    const event = {
      id: crypto.randomBytes(8).toString("hex"),
      title: body.title || "Untitled Event",
      date: body.date || "",
      description: body.description || "",
      color: body.color || "#10B981",
      allDay: true,
      recurring: false,
      recurringGroupId: null,
      createdBy: user.name,
      createdById: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events.push(event);
    await kvSet(KEY, events);
    return Response.json(event, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
