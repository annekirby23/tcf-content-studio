import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:brandrepo";

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = (await kvGet(KEY)) || [];
    return NextResponse.json(items);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, description, url, category, fileData, fileName } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const VALID_CATEGORIES = ["logo", "link", "collateral", "other"];

    const item = {
      id: crypto.randomBytes(8).toString("hex"),
      name: name.trim(),
      description: description ? String(description).trim() : "",
      url: url ? String(url).trim() : "",
      category: VALID_CATEGORIES.includes(category) ? category : "other",
      fileData: fileData ? String(fileData) : null,
      fileName: fileName ? String(fileName).trim() : null,
      createdAt: new Date().toISOString(),
      createdById: user.id,
      createdByName: user.name,
    };

    const items = (await kvGet(KEY)) || [];
    items.unshift(item);
    await kvSet(KEY, items);

    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
