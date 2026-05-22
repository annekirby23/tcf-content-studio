import { NextResponse } from "next/server";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const DEFAULT_TRAINING = { videos: [], links: [], pdfs: [] };

export async function GET(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = (await kvGet("tcf:training")) || DEFAULT_TRAINING;
  return NextResponse.json(data);
}

export async function PUT(req) {
  const user = await getSession(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = (await kvGet("tcf:training")) || DEFAULT_TRAINING;

  const merged = {
    videos: Array.isArray(body.videos) ? body.videos : existing.videos,
    links: Array.isArray(body.links) ? body.links : existing.links,
    pdfs: Array.isArray(body.pdfs) ? body.pdfs : existing.pdfs,
  };

  await kvSet("tcf:training", merged);
  return NextResponse.json(merged);
}
