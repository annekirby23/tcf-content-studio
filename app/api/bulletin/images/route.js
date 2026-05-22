import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

// Each image lives in its own key so large base64 data never contaminates
// the main bulletin posts/shoutouts store.
const IMAGE_KEYS = {
  calendarImage:       "tcf:bulletin:img:calendar",
  teamScheduleImage:   "tcf:bulletin:img:schedule1",
  teamScheduleImage2:  "tcf:bulletin:img:schedule2",
  monthlyScheduleImage:"tcf:bulletin:img:monthlySchedule",
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const entries = await Promise.all(
      Object.entries(IMAGE_KEYS).map(async ([field, key]) => [field, (await kvGet(key)) || null])
    );
    return Response.json(Object.fromEntries(entries));
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
    const { field, value } = body;

    if (!IMAGE_KEYS[field]) {
      return Response.json({ error: "Unknown image field" }, { status: 400 });
    }

    if (value) {
      await kvSet(IMAGE_KEYS[field], value);
    } else {
      await kvSet(IMAGE_KEYS[field], null);
    }

    // Return updated images object
    const entries = await Promise.all(
      Object.entries(IMAGE_KEYS).map(async ([f, key]) => [f, (await kvGet(key)) || null])
    );
    return Response.json(Object.fromEntries(entries));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
