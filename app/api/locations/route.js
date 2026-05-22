import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:locations";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const locations = (await kvGet(KEY)) || [];
    return Response.json(locations);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const { name, details, image, responsibleMemberId, responsibleMemberName, address,
            parkingDetails, parkingMapUrl, parkingInstructionsData, parkingInstructionsName } = body;

    const location = {
      id: crypto.randomBytes(8).toString("hex"),
      name: name || "Untitled Location",
      details: details || "",
      image: image || "",
      address: address || "",
      responsibleMemberId: responsibleMemberId || null,
      responsibleMemberName: responsibleMemberName || null,
      parkingDetails: parkingDetails || "",
      parkingMapUrl: parkingMapUrl || "",
      parkingInstructionsData: parkingInstructionsData || "",
      parkingInstructionsName: parkingInstructionsName || "",
      createdBy: user.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const locations = (await kvGet(KEY)) || [];
    locations.push(location);
    await kvSet(KEY, locations);
    return Response.json(location, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
