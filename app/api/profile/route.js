import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId") || user.id;

    const profile = (await kvGet(`tcf:profile:${targetId}`)) || {};
    return Response.json(profile);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { image, title, jobTitle, email, phone, bio, orgLevel, funFacts, headerImage, processRole, sectionTitles, headerImagePositionX, headerImagePositionY } = body;

    const existing = (await kvGet(`tcf:profile:${user.id}`)) || {};
    const updated = {
      ...existing,
      ...(image !== undefined && { image }),
      ...(title !== undefined && { title }),
      ...(jobTitle !== undefined && { jobTitle }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(bio !== undefined && { bio }),
      ...(orgLevel !== undefined && { orgLevel }),
      ...(funFacts !== undefined && { funFacts }),
      ...(headerImage !== undefined && { headerImage }),
      ...(processRole !== undefined && { processRole }),
      ...(sectionTitles !== undefined && { sectionTitles }),
      ...(headerImagePositionX !== undefined && { headerImagePositionX }),
      ...(headerImagePositionY !== undefined && { headerImagePositionY }),
      updatedAt: new Date().toISOString(),
    };

    await kvSet(`tcf:profile:${user.id}`, updated);
    return Response.json(updated);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
