import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");
  try {
    const { messages, mood } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    const system = [
      { role: "system", content: "You are a concise, supportive companion." },
      mood ? { role: "system", content: `User mood: ${mood}. Be validating and practical.` } : null,
    ].filter(Boolean);

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [...system, ...messages]   // [{role, content}]
    });

    const reply = resp.output_text?.trim()
      || "I’m here with you. Let’s take a slow breath together.";
    res.json({ reply });
  } catch (e: any) {
    res.status(500).json({ error: String(e?.message || e) });
  }
}
