// Expected POST body: { messages: [{role, content}], mood?: number }
export type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function chatWithAI(messages: ChatMsg[], mood?: number): Promise<string> {
  const res = await fetch("stressed-n20gxtfe6-thomas-brightlys-projects.vercel.app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, mood })
  });
  if (!res.ok) throw new Error(`AI error ${res.status}`);
  const data = await res.json();
  // Expect { reply: string }
  return data.reply ?? "I’m here with you. Let’s take a slow breath together.";
}
