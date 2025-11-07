export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };


const BACKEND_URL = "stressed-out.vercel.app";
export async function chatWithAI(messages: ChatMsg[], mood?: number) {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mood }),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) throw new Error(`AI ${res.status}: ${text || "no body"}`);
  const data = JSON.parse(text || "{}");
  return data.reply ?? "I’m here with you. Let’s take a slow breath together.";
}
