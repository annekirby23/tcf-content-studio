import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:locations";

export async function PUT(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const locations = (await kvGet(KEY)) || [];
    const index = locations.findIndex((l) => l.id === id);
    if (index === -1) return Response.json({ error: "Location not found" }, { status: 404 });

    const location = { ...locations[index] };
    const fields = ["name","details","image","address","responsibleMemberId","responsibleMemberName",
                    "parkingDetails","parkingMapUrl","parkingInstructionsData","parkingInstructionsName"];
    for (const f of fields) { if (body[f] !== undefined) location[f] = body[f]; }
    location.updatedAt = new Date().toISOString();

    locations[index] = location;
    await kvSet(KEY, locations);
    return Response.json(location);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const locations = (await kvGet(KEY)) || [];
    const exists = locations.some((l) => l.id === id);
    if (!exists) return Response.json({ error: "Location not found" }, { status: 404 });

    await kvSet(KEY, locations.filter((l) => l.id !== id));
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
