// backend/api/chat.ts
import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages, mood } = req.body ?? {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages[] required" });
    }

    const system = [
      { role: "system", content: "You are a concise, supportive companion." },
      mood ? { role: "system", content: `User mood: ${mood}. Be validating and practical.` } : null,
    ].filter(Boolean);

    console.log("API/chat: calling OpenAI…");

    const resp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [...system, ...messages], // [{role, content}]
    });

    const reply = (resp as any)?.output_text?.trim?.();
    if (!reply) {
      console.error("API/chat: OpenAI returned no output_text", resp);
      // Force an error so you can see it in the client + logs
      return res.status(502).json({ error: "No output from model" });
    }

    console.log("API/chat: success");
    return res.status(200).json({ reply });
  } catch (e: any) {
    console.error("API/chat ERROR:", e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
