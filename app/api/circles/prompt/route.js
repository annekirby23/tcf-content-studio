import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/serverAuth";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");
  return new Anthropic({ apiKey });
}

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { theme, previousPrompts = [] } = body;

    const client = getClient();

    const avoidList = previousPrompts.length > 0
      ? `\n\nAvoid repeating these recent prompts:\n${previousPrompts.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
      : "";

    const systemPrompt = `You are a community engagement specialist for TCF (The Coworking Firm), a coworking space that runs a program called TCF Circles — small groups of members paired together to connect and build community. Your job is to generate a single engaging conversation-starter prompt that helps circle members get to know each other on a deeper level. The prompt should be fun, inclusive, not too personal, and spark genuine conversation. It should feel warm and community-focused.${avoidList}`;

    const userMessage = theme
      ? `Generate ONE circle engagement prompt related to this theme: "${theme}". Return only the prompt itself, no quotes, no preamble.`
      : `Generate ONE creative circle engagement prompt. Examples of the style: "What was your first concert?", "What's a skill you've always wanted to learn?", "What's your go-to comfort meal?". Return only the prompt itself, no quotes, no preamble.`;

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 150,
      messages: [{ role: "user", content: userMessage }],
      system: systemPrompt,
    });

    const prompt = response.content[0]?.text?.trim() || "What's a book, show, or movie that changed the way you think?";
    return Response.json({ prompt });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
