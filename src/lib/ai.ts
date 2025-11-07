// ai.ts
// Expected POST body: { messages: [{role, content}], mood?: number }
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

// Put your Vercel URL here (production URL from the Vercel dashboard)
const BACKEND_URL = "https://stressed-n20gxtfe6-thomas-brightlys-projects.vercel.app"; //

export async function chatWithAI(messages: ChatMsg[], mood?: number): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {   // <-- note /api/chat
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mood }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AI error ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.reply ?? "I’m here with you. Let’s take a slow breath together.";
}
