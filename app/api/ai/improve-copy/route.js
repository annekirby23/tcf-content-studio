import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/serverAuth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const user = await getSession(req);
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { caption, platforms = [], contentType = "post", tone = "professional yet approachable" } = await req.json();
    if (!caption?.trim()) return Response.json({ error: "Caption is required" }, { status: 400 });

    const platformNames = platforms.map((p) => {
      const map = { instagram: "Instagram", tiktok: "TikTok", linkedin: "LinkedIn", x: "X/Twitter", facebook: "Facebook", youtube: "YouTube", pinterest: "Pinterest", email: "Newsletter", blog: "Blog", podcast: "Podcast" };
      return map[p] || p;
    }).join(", ") || "social media";

    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are an expert social media copywriter for a membership community brand. Improve this ${contentType} caption for ${platformNames}.

Guidelines:
- Keep the tone: ${tone}
- Make it engaging, clear, and on-brand for a membership/community organization
- Add relevant emojis where appropriate (don't overdo it)
- Preserve the core message and any specific details
- Optimize for the platform's style and audience
- Return ONLY the improved caption text — no explanations, no "Here's the improved version:" prefix

Original caption:
${caption}`,
      }],
    });

    const improved = message.content[0].text.trim();
    return Response.json({ improved });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
