// src/lib/ai.ts
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };


export const BACKEND_URL = "https://stressed-out.vercel.app";

export async function chatWithAI(messages: ChatMsg[], mood?: number): Promise<string> {
  const url = `${BACKEND_URL}/api/chat`;

  // Temporary diagnostics
  console.log("CHAT URL ->", url);
  console.log("CHAT BODY ->", JSON.stringify({ messages, mood }));

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mood }),
  });

  const text = await res.text().catch(() => "");
  console.log("CHAT STATUS ->", res.status, "BODY ->", text);

  if (!res.ok) throw new Error(`AI ${res.status}: ${text || "no body"}`);

  const data = text ? JSON.parse(text) : {};
  return data.reply ?? "I’m here with you. Let’s take a slow breath together.";
}
