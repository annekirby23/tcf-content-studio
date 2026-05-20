import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/serverAuth";
import { kvGet } from "@/lib/redis";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  return new Anthropic({ apiKey });
}

function today() {
  return new Date().toISOString().split("T")[0];
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type } = body;
    const client = getClient();

    // ── Daily Summary ─────────────────────────────────────────────────────────
    if (type === "summary") {
      const { userName, userId } = body;
      const teamTasks = (await kvGet("tcf:teamtasks")) || [];
      const events = (await kvGet("tcf:events")) || [];

      // Tasks assigned to this user
      const myTasks = teamTasks.filter(
        (t) => t.status !== "done" && (t.assignees || []).some((a) => a.id === userId)
      );

      const todayStr = today();
      const overdue = myTasks.filter((t) => t.dueDate && t.dueDate < todayStr);
      const dueToday = myTasks.filter((t) => t.dueDate === todayStr);
      const upcoming = myTasks
        .filter((t) => t.dueDate && t.dueDate > todayStr)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);

      const taskLines = [
        ...overdue.map((t) => `- [OVERDUE] ${t.text} (due ${t.dueDate}) — ${t.priority || "medium"} priority`),
        ...dueToday.map((t) => `- [DUE TODAY] ${t.text} — ${t.priority || "medium"} priority`),
        ...upcoming.map((t) => `- [Upcoming] ${t.text} (due ${t.dueDate}) — ${t.priority || "medium"} priority`),
      ].join("\n") || "No tasks with due dates assigned.";

      const upcomingEvents = events
        .filter((e) => e.date >= todayStr)
        .slice(0, 3)
        .map((e) => `- ${e.title} on ${e.date}`)
        .join("\n") || "None";

      const prompt = `You are a warm, encouraging team assistant at TCF, a community fitness organization. You're greeting ${userName} at the start of their day.

Their current tasks:
${taskLines}

Upcoming team events:
${upcomingEvents}

Today's date: ${todayStr}

Write a personalized daily briefing for ${userName} with exactly two parts:

**TASKS** (2-4 sentences): Mention their most urgent/overdue items first, then what's coming up. Be specific about due dates. Keep it practical and motivating — not alarming.

**MESSAGE** (1-2 sentences): A genuine, specific, uplifting note to start the day. Make it feel personal and real, not generic. Reference the work they have ahead if relevant.

Use plain text, no markdown headers. Separate the two parts with a blank line. Keep the whole thing under 150 words.`;

      const message = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      });

      return Response.json({ result: message.content[0].text });
    }

    // ── Platform Q&A ──────────────────────────────────────────────────────────
    if (type === "question") {
      const { question, userName, history = [] } = body;

      // Gather all platform data as context
      const [tcfInfo, events, teamTasks, memberJourney, training, locations, inventory, bulletin, internalData] =
        await Promise.all([
          kvGet("tcf:tcfinfo"),
          kvGet("tcf:events"),
          kvGet("tcf:teamtasks"),
          kvGet("tcf:memberjourney"),
          kvGet("tcf:training"),
          kvGet("tcf:locations"),
          kvGet("tcf:inventory"),
          kvGet("tcf:bulletin"),
          kvGet("tcf:internal"),
        ]);

      const infoChunks = [];

      if (tcfInfo) {
        infoChunks.push(`## TCF Organization Info
Mission: ${tcfInfo.mission || "N/A"}
Values: ${tcfInfo.values || "N/A"}
Motto: ${tcfInfo.motto || "N/A"}
History: ${tcfInfo.history || "N/A"}
Our Why: ${tcfInfo.ourWhy || "N/A"}
Website: ${tcfInfo.website || "N/A"}`);
      }

      // Internal data: memberships, HR info, contacts
      if (internalData) {
        if (internalData.membership) {
          infoChunks.push(`## Membership Info\n${internalData.membership}`);
        }
        if (Array.isArray(internalData.memberships) && internalData.memberships.length) {
          const lines = internalData.memberships.map((m) =>
            `- ${m.name}: $${m.cost} ${m.billingCycle}${m.details ? ` — ${m.details}` : ""}`
          ).join("\n");
          infoChunks.push(`## Memberships & Subscriptions\n${lines}`);
        }
        if (internalData.hrInfo) infoChunks.push(`## HR Info\n${internalData.hrInfo}`);
        if (internalData.contacts) infoChunks.push(`## Key Contacts\n${internalData.contacts}`);
      }

      if (events?.length) {
        const upcoming = events.slice(0, 10).map((e) => `- ${e.title} on ${e.date}${e.description ? `: ${e.description}` : ""}`).join("\n");
        infoChunks.push(`## Upcoming Events\n${upcoming}`);
      }

      if (teamTasks?.length) {
        const open = teamTasks.filter((t) => t.status !== "done").slice(0, 20);
        infoChunks.push(`## Open Team Tasks (${open.length})\n${open.map((t) => `- [${t.status}] ${t.text}${t.dueDate ? ` (due ${t.dueDate})` : ""}`).join("\n")}`);
      }

      if (memberJourney?.stages?.length) {
        const stages = memberJourney.stages.map((s) => `- ${s.name}: ${s.description || ""}`).join("\n");
        infoChunks.push(`## Member Journey Stages\n${stages}`);
      }

      if (training) {
        const trainingStr = JSON.stringify(training).slice(0, 1500);
        infoChunks.push(`## Training Materials\n${trainingStr}`);
      }

      if (locations?.length) {
        const locStr = locations.map((l) => `- ${l.name || l.id}: ${l.address || ""} ${l.notes || ""}`).join("\n");
        infoChunks.push(`## Locations\n${locStr}`);
      }

      if (inventory?.length) {
        const invStr = inventory.slice(0, 20).map((i) => `- ${i.itemName} (${i.orderType || "item"}, status: ${i.orderStatus})`).join("\n");
        infoChunks.push(`## Inventory Items\n${invStr}`);
      }

      if (bulletin?.posts?.length) {
        const recentPosts = bulletin.posts.slice(0, 5).map((p) => `- ${p.title || "(no title)"}: ${p.content}`).join("\n");
        infoChunks.push(`## Recent Bulletin Announcements\n${recentPosts}`);
      }

      const context = infoChunks.join("\n\n");

      const systemPrompt = `You are a helpful internal assistant for TCF, a community fitness organization. You have access to the organization's internal platform data below. Answer questions accurately and helpfully. If the answer isn't in the data, say so honestly. Keep answers concise (2-4 sentences unless a longer answer is clearly needed).

--- PLATFORM DATA ---
${context}
--- END DATA ---`;

      const messages = [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        { role: "user", content: question },
      ];

      const message = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 400,
        system: systemPrompt,
        messages,
      });

      return Response.json({ result: message.content[0].text });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
