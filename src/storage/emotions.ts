// src/storage/emotions.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { EmotionCategory } from "../emotion/classifyEmotion";

export type EmotionEvent = {
  id: string;                  // unique id
  category: EmotionCategory;
  confidence: number;          // 0..1
  at: number;                  // timestamp
  messageId?: string;          // your chat message id (optional)
  sample?: string;             // small snippet for audit/debug (optional)
};

const KEY = "emotions.v1";

export async function loadEmotionEvents(): Promise<EmotionEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as EmotionEvent[]) : [];
  } catch {
    return [];
  }
}

export async function saveEmotionEvents(all: EmotionEvent[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(all));
}

export async function appendEmotionEvent(ev: EmotionEvent) {
  const cur = await loadEmotionEvents();
  cur.unshift(ev);
  await saveEmotionEvents(cur);
}

export type CountByCategory = Record<EmotionCategory, number>;

export function countsFrom(events: EmotionEvent[]): CountByCategory {
  const counts = Object.create(null) as CountByCategory;
  // initialize zeros
  [
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
  ].forEach((c) => ((counts as any)[c] = 0));
  for (const e of events) (counts as any)[e.category] += 1;
  return counts;
}
