import crypto from "crypto";
import { getSession } from "@/lib/serverAuth";
import { kvGet, kvSet } from "@/lib/redis";

const KEY = "tcf:memberjourney";

const DEFAULT_STAGES = [
  {
    id: "discovery",
    name: "Discovery",
    icon: "🔍",
    color: "#6366F1",
    tagline: "How potential members find TCF",
    description: "The first moment a future member becomes aware of TCF — through social media, a friend's referral, driving by, a Google search, or a community event.",
    whyImportant: "First impressions are everything. Every touchpoint during Discovery shapes how someone feels about TCF before they've ever walked through the door. A strong discovery experience builds excitement and increases the likelihood they'll take the next step.",
    steps: [
      { id: "d1", text: "Prospect sees TCF on social media or Google", done: false },
      { id: "d2", text: "Website visit / inquiry submitted", done: false },
      { id: "d3", text: "Initial response sent within 24 hours", done: false },
      { id: "d4", text: "Tour scheduled", done: false },
    ],
    assignedMembers: [],
    notes: "",
    resources: [],
  },
  {
    id: "tour",
    name: "Tour",
    icon: "🚶",
    color: "#8B5CF6",
    tagline: "The first in-person experience",
    description: "The prospect visits TCF for the first time. This is the make-or-break moment — the facility, the staff, and the energy all need to be welcoming and professional.",
    whyImportant: "The tour is often the deciding factor. People join people, not just facilities. A warm, personalized tour that connects emotionally and answers every question will convert prospects into members.",
    steps: [
      { id: "t1", text: "Tour scheduled and confirmed via email/text", done: false },
      { id: "t2", text: "Welcome them by name at the door", done: false },
      { id: "t3", text: "Walk through all amenities", done: false },
      { id: "t4", text: "Answer all questions", done: false },
      { id: "t5", text: "Share membership options and pricing", done: false },
      { id: "t6", text: "Follow-up within 24 hours", done: false },
    ],
    assignedMembers: [],
    notes: "",
    resources: [],
  },
  {
    id: "signup",
    name: "Sign Up",
    icon: "✍️",
    color: "#EC4899",
    tagline: "Converting a prospect to a member",
    description: "The prospect decides to join and completes the membership agreement, payment setup, and any intake paperwork. This moment should feel exciting and frictionless.",
    whyImportant: "A complicated or confusing sign-up process can cause last-minute hesitation. Making it smooth and celebratory reinforces their decision and sets a positive tone for the relationship.",
    steps: [
      { id: "s1", text: "Membership agreement reviewed and signed", done: false },
      { id: "s2", text: "Payment method set up", done: false },
      { id: "s3", text: "Member profile created in system", done: false },
      { id: "s4", text: "Access credentials / key fob issued", done: false },
      { id: "s5", text: "Welcome email sent with next steps", done: false },
      { id: "s6", text: "Onboarding session scheduled", done: false },
    ],
    assignedMembers: [],
    notes: "",
    resources: [],
  },
  {
    id: "onboarding",
    name: "Onboarding",
    icon: "📋",
    color: "#F59E0B",
    tagline: "Setting them up for success",
    description: "A structured process that ensures every new member knows how to use the facility, access all resources, and feels comfortable from day one.",
    whyImportant: "Members who are properly onboarded stay longer, get better results, and refer more people. Onboarding removes the uncertainty of being new and creates an early emotional connection with the TCF team.",
    steps: [
      { id: "o1", text: "Orientation session completed", done: false },
      { id: "o2", text: "Facility walkthrough — equipment, hours, rules", done: false },
      { id: "o3", text: "Member app / portal set up", done: false },
      { id: "o4", text: "Goals conversation completed", done: false },
      { id: "o5", text: "Introduced to 2+ team members by name", done: false },
      { id: "o6", text: "First class or session scheduled", done: false },
      { id: "o7", text: "Photo taken for member wall (if applicable)", done: false },
    ],
    assignedMembers: [],
    notes: "",
    resources: [],
  },
  {
    id: "settled",
    name: "Getting Settled",
    icon: "🏠",
    color: "#10B981",
    tagline: "The critical first 30–60 days",
    description: "The first one to two months after joining is when members are most at risk of dropping off. Regular check-ins, quick answers, and celebrating early wins are essential.",
    whyImportant: "Most member churn happens in the first 30–60 days — before habits form and before they feel truly part of the community. Proactive outreach during this window dramatically improves long-term retention.",
    steps: [
      { id: "se1", text: "Week 1 check-in call or text sent", done: false },
      { id: "se2", text: "Week 2 check-in — any questions or concerns?", done: false },
      { id: "se3", text: "30-day milestone check-in completed", done: false },
      { id: "se4", text: "Member feedback collected", done: false },
      { id: "se5", text: "Any issues addressed proactively", done: false },
      { id: "se6", text: "Celebrate a win or milestone with them", done: false },
    ],
    assignedMembers: [],
    notes: "",
    resources: [],
  },
  {
    id: "connected",
    name: "Connected",
    icon: "🤝",
    color: "#3B82F6",
    tagline: "A member who truly belongs",
    description: "The member is now fully engaged — attending consistently, joining events and challenges, building real relationships with staff and other members, and naturally referring others.",
    whyImportant: "A connected member is your best marketing asset. They're less likely to cancel, more likely to upgrade, and most likely to refer friends and family. Building genuine community creates members for life.",
    steps: [
      { id: "c1", text: "Attending 3+ times per week consistently", done: false },
      { id: "c2", text: "Participating in events or challenges", done: false },
      { id: "c3", text: "Knows 3+ staff members by name", done: false },
      { id: "c4", text: "Has referred at least one person", done: false },
      { id: "c5", text: "Engaged with TCF on social media", done: false },
      { id: "c6", text: "Recognized as a community leader or ambassador", done: false },
    ],
    assignedMembers: [],
    notes: "",
    resources: [],
  },
];

export async function GET(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const data = (await kvGet(KEY)) || { stages: DEFAULT_STAGES };
    // Ensure all default stages exist
    if (!data.stages || data.stages.length === 0) data.stages = DEFAULT_STAGES;
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    const current = (await kvGet(KEY)) || { stages: DEFAULT_STAGES };

    if (body.stageAction === "updateStage") {
      const { stageId, patch } = body;
      current.stages = (current.stages || []).map((s) =>
        s.id === stageId ? { ...s, ...patch } : s
      );
    } else if (body.stageAction === "addStep") {
      const { stageId, text } = body;
      current.stages = (current.stages || []).map((s) => {
        if (s.id !== stageId) return s;
        return { ...s, steps: [...(s.steps || []), { id: crypto.randomBytes(6).toString("hex"), text, done: false }] };
      });
    } else if (body.stageAction === "toggleStep") {
      const { stageId, stepId } = body;
      current.stages = (current.stages || []).map((s) => {
        if (s.id !== stageId) return s;
        return { ...s, steps: (s.steps || []).map((st) => st.id === stepId ? { ...st, done: !st.done } : st) };
      });
    } else if (body.stageAction === "editStep") {
      const { stageId, stepId, text } = body;
      current.stages = (current.stages || []).map((s) => {
        if (s.id !== stageId) return s;
        return { ...s, steps: (s.steps || []).map((st) => st.id === stepId ? { ...st, text } : st) };
      });
    } else if (body.stageAction === "deleteStep") {
      const { stageId, stepId } = body;
      current.stages = (current.stages || []).map((s) => {
        if (s.id !== stageId) return s;
        return { ...s, steps: (s.steps || []).filter((st) => st.id !== stepId) };
      });
    } else if (body.stageAction === "addResource") {
      const { stageId, label, url } = body;
      current.stages = (current.stages || []).map((s) => {
        if (s.id !== stageId) return s;
        return { ...s, resources: [...(s.resources || []), { id: crypto.randomBytes(6).toString("hex"), label, url }] };
      });
    } else if (body.stageAction === "deleteResource") {
      const { stageId, resourceId } = body;
      current.stages = (current.stages || []).map((s) => {
        if (s.id !== stageId) return s;
        return { ...s, resources: (s.resources || []).filter((r) => r.id !== resourceId) };
      });
    }

    await kvSet(KEY, current);
    return Response.json(current);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
