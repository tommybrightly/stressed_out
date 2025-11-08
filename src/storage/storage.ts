import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, StressEntry } from "../types";
import * as FileSystem from "expo-file-system";


const MSG_KEY = "@calmsketch/messages";
const STRESS_KEY = "@calmsketch/stressEntries";


export type SavedDrawing = { id: string; uri: string; createdAt: number };

const FS_ANY: any = FileSystem; // TS-safe shim for older typings
const BASE_DIR: string =
  (FS_ANY.documentDirectory as string | undefined) ??
  (FS_ANY.cacheDirectory as string | undefined) ??
  "";
const DRAWINGS_JSON = `${BASE_DIR}drawings.v1.json`;

export async function loadDrawings(): Promise<SavedDrawing[]> {
  try {
    const info = await FileSystem.getInfoAsync(DRAWINGS_JSON);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(DRAWINGS_JSON);
    const parsed = JSON.parse(raw);
    // basic shape guard
    if (Array.isArray(parsed)) return parsed as SavedDrawing[];
    return [];
  } catch {
    return [];
  }
}

export async function saveDrawings(all: SavedDrawing[]): Promise<void> {
  try {
    await FileSystem.writeAsStringAsync(DRAWINGS_JSON, JSON.stringify(all));
  } catch {
    // swallow; caller can ignore persistence failure
  }
}

export async function loadMessages(): Promise<Message[]> {
const raw = await AsyncStorage.getItem(MSG_KEY);
return raw ? JSON.parse(raw) : [];
}


export async function saveMessages(msgs: Message[]) {
await AsyncStorage.setItem(MSG_KEY, JSON.stringify(msgs));
}


export async function loadStressEntries(): Promise<StressEntry[]> {
const raw = await AsyncStorage.getItem(STRESS_KEY);
return raw ? JSON.parse(raw) : [];
}


export async function saveStressEntries(entries: StressEntry[]) {
await AsyncStorage.setItem(STRESS_KEY, JSON.stringify(entries));
}


export async function logStress(entry: StressEntry) {
const entries = await loadStressEntries();
entries.push(entry);
await saveStressEntries(entries);
}