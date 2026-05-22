import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:membershipinfo";

const DEFAULT_INFO = {
  signupFormDetails: "",
  signupFormUrl: "",
  welcomeEmail: "",
  membershipTerms: "",
  membershipTermsUrl: "",
  signupLink: "",
  billingDetails: "",
  billingUrl: "",
  endingInfo: "",
  endingUrl: "",
  membershipTiers: [],
  waitingList: [],
  deskRelocationList: [],
};

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = (await kvGet(KEY)) || DEFAULT_INFO;
    if (!data.membershipTiers) data.membershipTiers = [];
    if (!data.waitingList) data.waitingList = [];
    if (!data.deskRelocationList) data.deskRelocationList = [];
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const existing = (await kvGet(KEY)) || { ...DEFAULT_INFO };

    const STRING_FIELDS = [
      "signupFormDetails",
      "signupFormUrl",
      "welcomeEmail",
      "membershipTerms",
      "membershipTermsUrl",
      "signupLink",
      "billingDetails",
      "billingUrl",
      "endingInfo",
      "endingUrl",
    ];

    for (const field of STRING_FIELDS) {
      if (body[field] !== undefined) {
        existing[field] = String(body[field]);
      }
    }

    if (body.membershipTiers !== undefined && Array.isArray(body.membershipTiers)) {
      existing.membershipTiers = body.membershipTiers.map((tier) => ({
        id: tier.id || crypto.randomBytes(8).toString("hex"),
        name: String(tier.name || "").trim(),
        price: String(tier.price || "").trim(),
        billingFrequency: String(tier.billingFrequency || "monthly").trim(),
        description: String(tier.description || "").trim(),
        features: Array.isArray(tier.features) ? tier.features.map((f) => String(f).trim()).filter(Boolean) : [],
        highlight: Boolean(tier.highlight),
        color: String(tier.color || "#6366F1").trim(),
        instructions: String(tier.instructions || ""),
        emailSubject: String(tier.emailSubject || "").trim(),
        emailBody: String(tier.emailBody || ""),
      }));
    }

    if (body.waitingList !== undefined && Array.isArray(body.waitingList)) {
      existing.waitingList = body.waitingList.map((entry) => ({
        id: entry.id || crypto.randomBytes(8).toString("hex"),
        name: String(entry.name || "").trim(),
        email: String(entry.email || "").trim(),
        date: String(entry.date || "").trim(),
        notes: String(entry.notes || "").trim(),
        status: entry.status || "Waiting",
      }));
    }

    if (body.deskRelocationList !== undefined && Array.isArray(body.deskRelocationList)) {
      existing.deskRelocationList = body.deskRelocationList.map((entry) => ({
        id: entry.id || crypto.randomBytes(8).toString("hex"),
        name: String(entry.name || "").trim(),
        fromDesk: String(entry.fromDesk || "").trim(),
        toDesk: String(entry.toDesk || "").trim(),
        date: String(entry.date || "").trim(),
        notes: String(entry.notes || "").trim(),
        status: entry.status || "Requested",
      }));
    }

    await kvSet(KEY, existing);
    return NextResponse.json(existing);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
