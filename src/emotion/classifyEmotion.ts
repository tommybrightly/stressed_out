// src/emotion/classifyEmotion.ts
export type EmotionCategory =
  | "calm"
  | "happy"
  | "sad"
  | "mad"
  | "anxious"
  | "hopeless"
  | "tired"
  | "stressed"
  | "lonely"
  | "grief";

export const EMOTION_CATEGORIES: EmotionCategory[] = [
  "calm",
  "happy",
  "sad",
  "mad",
  "anxious",
  "hopeless",
  "tired",
  "stressed",
  "lonely",
  "grief",
];

// quick keyword weights (fast + offline). you can tweak these any time.
const KEYWORDS: Record<EmotionCategory, string[]> = {
  calm: ["calm", "peaceful", "ok", "fine", "grounded", "balanced"],
  happy: ["happy", "joy", "excited", "grateful", "content", "optimistic", "good"],
  sad: ["sad", "down", "blue", "depressed", "cry", "tearful"],
  mad: ["angry", "mad", "furious", "rage", "irritated", "annoyed"],
  anxious: ["anxious", "nervous", "worried", "panic", "overthinking", "fear"],
  hopeless: ["hopeless", "helpless", "empty", "numb", "pointless"],
  tired: ["tired", "exhausted", "fatigued", "drained", "burned out", "burnt out"],
  stressed: ["stressed", "overwhelmed", "pressure", "swamped", "frazzled"],
  lonely: ["lonely", "isolated", "alone", "left out"],
  grief: ["grief", "grieving", "mourning", "loss", "bereaved"],
};

export type EmotionClassification = {
  category: EmotionCategory;
  confidence: number; // 0..1
  reasons: string[];
};

// simple heuristic scorer
export function classifyEmotionHeuristic(text: string): EmotionClassification {
  const t = ` ${text.toLowerCase()} `;
  const scores: Record<EmotionCategory, number> = Object.fromEntries(
    EMOTION_CATEGORIES.map((c) => [c, 0]),
  ) as Record<EmotionCategory, number>;

  for (const cat of EMOTION_CATEGORIES) {
    for (const kw of KEYWORDS[cat]) {
      // word boundary-ish
      const re = new RegExp(`(^|\\W)${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\W|$)`, "gi");
      const matches = t.match(re);
      if (matches) scores[cat] += matches.length;
    }
  }

  // small bias towards "stressed" since it's common in your app’s context
  scores.stressed += 0.25;

  // choose the max
  let best: EmotionCategory = "calm";
  let bestScore = -Infinity;
  for (const cat of EMOTION_CATEGORIES) {
    if (scores[cat] > bestScore) {
      best = cat;
      bestScore = scores[cat];
    }
  }

  // map to a confidence-ish value
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = total > 0 ? Math.min(1, (bestScore + 0.01) / (total + 0.5)) : 0.35;

  return {
    category: best,
    confidence: Number(confidence.toFixed(2)),
    reasons: Object.entries(scores)
      .filter(([, s]) => s > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([k, s]) => `${k}:${s}`),
  };
}

// optional: server-assist (uses your existing /api/chat if you want)
// call this when you want a smarter label; otherwise the heuristic above is fine.
// NOTE: wire it only if you want to spend tokens.
export async function classifyEmotionLLM(message: string): Promise<EmotionClassification | null> {
  try {
    const res = await fetch("https://stressed-out.vercel.app/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "You extract the primary emotion category from the user's latest message. Valid categories: calm, happy, sad, mad, anxious, hopeless, tired, stressed, lonely, grief. Reply ONLY with a JSON object {\"category\":\"...\",\"confidence\":number}.",
          },
          { role: "user", content: message },
        ],
        // if your backend supports extra params, you can pass a "mode": "classify"
      }),
    });
    const text = await res.text();
    const json = safeJson(text);
    if (!json?.category) return null;
    const cat = EMOTION_CATEGORIES.includes(json.category)
      ? (json.category as EmotionCategory)
      : "stressed";
    return {
      category: cat,
      confidence: typeof json.confidence === "number" ? json.confidence : 0.7,
      reasons: ["llm"],
    };
  } catch {
    return null;
  }
}

function safeJson(t: string) {
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
