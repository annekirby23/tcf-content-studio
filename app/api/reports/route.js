import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/serverAuth";
import { kvGet } from "@/lib/redis";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Add it to your Vercel environment variables.");
  return new Anthropic({ apiKey });
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { type } = body;

    const client = getClient();

    // ── AI Task Summary ────────────────────────────────────────────────────────
    if (type === "summary") {
      const teamTasks = (await kvGet("tcf:teamtasks")) || [];
      const events = (await kvGet("tcf:events")) || [];

      const openTasks = teamTasks.filter((t) => t.status !== "done");
      const overdue = openTasks.filter((t) => t.dueDate && t.dueDate < new Date().toISOString().split("T")[0]);

      const taskLines = openTasks.slice(0, 40).map((t) => {
        const assignees = (t.assignees || []).map((a) => a.name).join(", ") || "Unassigned";
        const due = t.dueDate ? `(due ${t.dueDate})` : "";
        return `- [${t.status}] ${t.text} | Assigned: ${assignees} | Priority: ${t.priority || "medium"} ${due}`;
      }).join("\n");

      const upcomingEvents = events.slice(0, 10).map((e) => `- ${e.title} on ${e.date}`).join("\n");

      const prompt = `You are a helpful team assistant summarizing the current workload for a membership community organization (TCF).

OPEN TEAM TASKS (${openTasks.length} total, ${overdue.length} overdue):
${taskLines || "None"}

UPCOMING EVENTS:
${upcomingEvents || "None"}

Write a concise, friendly 2–4 paragraph summary covering:
1. Overall workload snapshot (how many open, any overdue concerns)
2. Who has the most on their plate right now (based on assignees)
3. Any patterns or bottlenecks you notice
4. 2–3 actionable priorities the team should focus on this week

Keep it conversational, specific, and encouraging. Speak as if you're a knowledgeable team lead briefing the group.`;

      const message = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      });

      return Response.json({ result: message.content[0].text });
    }

    // ── Idea Generator ─────────────────────────────────────────────────────────
    if (type === "ideas") {
      const { contentType, topic, audience, tone, questions } = body;

      const prompt = `You are a creative content strategist for TCF, a community membership organization.

Generate content for the following:
- Content type: ${contentType || "Blog Post"}
- Topic: ${topic || "community building"}
- Target audience: ${audience || "current and prospective members"}
- Tone: ${tone || "warm, professional, and inspiring"}
${questions ? `- Additional context: ${questions}` : ""}

${contentType === "Blog Post" ? `Write a complete blog post with:
- A compelling headline
- An engaging intro (2–3 sentences)
- 3–4 main sections with subheadings
- A closing paragraph with a call to action
- Suggested meta description (1 sentence)
Format clearly with section headers.` : ""}

${contentType === "Social Campaign" ? `Generate a 5-post social media campaign with:
- Campaign theme and hashtag
- 5 individual post captions (label each one)
- Each post should build on the last
- Mix of educational, inspirational, and community-focused posts
Format clearly with post numbers.` : ""}

${contentType === "Newsletter" ? `Write a complete newsletter with:
- Subject line (and 2 alternates)
- Greeting and opening hook
- 2–3 content sections
- Featured event or announcement placeholder
- Closing and call-to-action
Format clearly with section labels.` : ""}`;

      const message = await client.messages.create({
        model: "claude-opus-4-7",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      });

      return Response.json({ result: message.content[0].text });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
