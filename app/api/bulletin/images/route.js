import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

// Redis stores only a short URL per image (~100 chars), not the image data.
// The actual image bytes live in Cloudinary (free 25GB tier).
const IMAGE_KEYS = {
  calendarImage:        "tcf:bulletin:img:calendar",
  teamScheduleImage:    "tcf:bulletin:img:schedule1",
  teamScheduleImage2:   "tcf:bulletin:img:schedule2",
  monthlyScheduleImage: "tcf:bulletin:img:monthlySchedule",
};

// Upload a base64 data URL to Cloudinary and return the hosted URL.
async function uploadToCloudinary(base64DataUrl) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset    = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (!cloudName || !preset) throw new Error("Cloudinary env vars not set");

  const body = new URLSearchParams();
  body.append("file", base64DataUrl);
  body.append("upload_preset", preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Cloudinary error ${res.status}`);
  }
  const data = await res.json();
  return data.secure_url; // e.g. "https://res.cloudinary.com/..."
}

// One-time migration: remove any old image blobs stored in the main bulletin key.
async function cleanupOldImages() {
  try {
    const bulletin = await kvGet("tcf:bulletin");
    if (!bulletin) return;
    const fields = ["calendarImage", "teamScheduleImage", "teamScheduleImage2", "monthlyScheduleImage"];
    if (!fields.some((f) => bulletin[f])) return;
    fields.forEach((f) => { delete bulletin[f]; });
    await kvSet("tcf:bulletin", bulletin);
  } catch {}
}

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

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

    if (value) {
      // value is a compressed base64 JPEG — upload to Cloudinary, store the URL
      const url = await uploadToCloudinary(value);
      await kvSet(IMAGE_KEYS[field], url);
    } else {
      // Remove image
      await kvSet(IMAGE_KEYS[field], null);
    }

    const entries = await Promise.all(
      Object.entries(IMAGE_KEYS).map(async ([f, key]) => [f, (await kvGet(key)) || null])
    );
    return Response.json(Object.fromEntries(entries));
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
