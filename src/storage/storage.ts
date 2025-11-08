import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, StressEntry } from "../types";
import * as FileSystem from "expo-file-system";
import { getFS, ensureDrawingsDir, readTextFile, writeTextFile } from "./fsCompat";
import { Directory, File, Paths } from "expo-file-system";


const MSG_KEY = "@calmsketch/messages";
const STRESS_KEY = "@calmsketch/stressEntries";


export type SavedDrawing = { id: string; uri: string; createdAt: number };

const INDEX_NAME = "drawings.v1.json";

const drawingsDir = new Directory(Paths.document, "drawings");
if (!drawingsDir.exists) drawingsDir.create();

const indexFile = new File(drawingsDir, "drawings.v1.json");


export async function loadDrawings(): Promise<SavedDrawing[]> {
    try {
      if (!drawingsDir.exists) drawingsDir.create();
      if (!indexFile.exists) return [];
      const text = await indexFile.text();                 // <-- add await
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? (parsed as SavedDrawing[]) : [];
    } catch {
      return [];
    }
  }

  export async function saveDrawings(all: SavedDrawing[]) {
    try {
      if (!drawingsDir.exists) drawingsDir.create();
      indexFile.write(JSON.stringify(all)); // modern API: sync write
    } catch {
      // ignore persistence errors
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