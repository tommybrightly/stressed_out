import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, StressEntry } from "../types";
import * as FileSystem from "expo-file-system";
import { getFS, ensureDrawingsDir, readTextFile, writeTextFile } from "./fsCompat";


const MSG_KEY = "@calmsketch/messages";
const STRESS_KEY = "@calmsketch/stressEntries";


export type SavedDrawing = { id: string; uri: string; createdAt: number };

const INDEX_NAME = "drawings.v1.json";

const FS_ANY: any = FileSystem; // TS-safe shim for older typings
const BASE_DIR: string =
(FS_ANY.documentDirectory as string | undefined) ??
(FS_ANY.cacheDirectory as string | undefined) ??
  "";
const DRAWINGS_JSON = `${BASE_DIR}drawings.v1.json`;


  export async function loadDrawings(): Promise<SavedDrawing[]> {
    const fs = await getFS();
    const drawingsDir = await ensureDrawingsDir(fs);
  
    const text = await readTextFile(fs, drawingsDir, INDEX_NAME);
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? (parsed as SavedDrawing[]) : [];
    } catch {
      return [];
    }
  }

  export async function saveDrawings(all: SavedDrawing[]) {
    const fs = await getFS();
    const drawingsDir = await ensureDrawingsDir(fs);
    await writeTextFile(fs, drawingsDir, INDEX_NAME, JSON.stringify(all));
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