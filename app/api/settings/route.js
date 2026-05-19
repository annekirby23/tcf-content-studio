import { NextResponse } from "next/server";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const ALLOWED_TYPES = ["themes", "contentTypes", "platforms", "pillars"];

export async function GET(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const data = await kvGet(`tcf:settings:${type}`);
  return NextResponse.json(data);
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, data } = body;

  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${ALLOWED_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!Array.isArray(data)) {
    return NextResponse.json({ error: "data must be an array" }, { status: 400 });
  }

  await kvSet(`tcf:settings:${type}`, data);

  return NextResponse.json({ ok: true, data });
}
