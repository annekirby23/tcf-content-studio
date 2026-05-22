import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

// Each image lives in its own key so large base64 data never contaminates
// the main bulletin posts/shoutouts store.
const IMAGE_KEYS = {
  calendarImage:        "tcf:bulletin:img:calendar",
  teamScheduleImage:    "tcf:bulletin:img:schedule1",
  teamScheduleImage2:   "tcf:bulletin:img:schedule2",
  monthlyScheduleImage: "tcf:bulletin:img:monthlySchedule",
};

// One-time migration: remove any large image blobs that were previously
// stored directly inside the main bulletin key, freeing up Redis memory.
async function cleanupOldImages() {
  try {
    const bulletin = await kvGet("tcf:bulletin");
    if (!bulletin) return;
    const imageFields = ["calendarImage", "teamScheduleImage", "teamScheduleImage2", "monthlyScheduleImage"];
    const hasOld = imageFields.some((f) => bulletin[f]);
    if (!hasOld) return;
    imageFields.forEach((f) => { delete bulletin[f]; });
    await kvSet("tcf:bulletin", bulletin);
  } catch {}
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Clean up old oversized data from the main bulletin key on first load
    await cleanupOldImages();

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

    // value is a compressed JPEG data URL (~150KB) — safe to store in Redis
    await kvSet(IMAGE_KEYS[field], value || null);

    // Return updated images object
    const entries = await Promise.all(
      Object.entries(IMAGE_KEYS).map(async ([f, key]) => [f, (await kvGet(key)) || null])
    );
    return Response.json(Object.fromEntries(entries));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
