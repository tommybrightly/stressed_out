// src/api/chat.ts
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

const BACKEND_URL = process.env.EXPO_PUBLIC_API_URL   // Expo
  || process.env.API_URL                               // RN CLI with env lib
  || "https://stressedout-api.vercel.app";             // fallback

export async function chatWithAI(messages: ChatMsg[], mood?: number): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mood }),
  });

  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json(); // expect { reply: string }
  return data.reply ?? "I’m here with you. Let’s take a slow breath together.";
}
