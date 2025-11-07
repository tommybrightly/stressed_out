import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { messages, mood } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    // Build system preamble + trim the history a bit so the prompt stays small
    const system = {
      role: "system" as const,
      content:
        `You are a concise, supportive companion. Be validating, practical, and brief.` +
        (typeof mood === "number" ? ` The user self-reported mood is ${mood}/10.` : "")
    };

    // Keep the last 12 turns max
    const tail = messages.slice(-12);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [system, ...tail], // <- Chat Completions expects {role, content}
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "No output from model" });

    return res.status(200).json({ reply });
  } catch (e: any) {
    console.error("API/chat ERROR:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
