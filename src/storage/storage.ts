// src/storage/storage.ts
import { Directory, File, Paths } from "expo-file-system";

/* -------------------- Drawings -------------------- */
export type SavedDrawing = { id: string; uri: string; createdAt: number };

const DRAWINGS_INDEX = "drawings.v1.json";
const MESSAGES_INDEX = "messages.v1.json";
const STRESS_INDEX   = "stress.v1.json";

// Lazily ensure /document/drawings exists and return the Directory object
async function getDrawingsDir(): Promise<Directory> {
  const dir = new Directory(Paths.document, "drawings");
  if (!dir.exists) {
    // modern API's create() is sync in your setup
    dir.create();
  }
  return dir;
}

// Generic helper to get a file under /document/drawings
async function getFile(name: string): Promise<File> {
  const dir = await getDrawingsDir();
  const file = new File(dir, name);
  if (!file.exists) {
    // Ensure the file exists so subsequent read/write calls are safe.
    file.create(); // sync in your setup
  }
  return file;
}

// ---- drawings index file (JSON array)
async function getDrawingsIndexFile(): Promise<File> {
  // Keep backward compat with your original code path
  const dir = await getDrawingsDir();
  const file = new File(dir, DRAWINGS_INDEX);
  if (!file.exists) {
    file.create();
    await file.write("[]");
  }
  return file;
}

export async function loadDrawings(): Promise<SavedDrawing[]> {
  try {
    const indexFile = await getDrawingsIndexFile();
    const text = await indexFile.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as SavedDrawing[]) : [];
  } catch {
    return [];
  }
}

export async function saveDrawings(all: SavedDrawing[]) {
  try {
    const indexFile = await getDrawingsIndexFile();
    await indexFile.write(JSON.stringify(all));
  } catch {
    // ignore persistence errors
  }
}

/* -------------------- Chat Messages -------------------- */
// Minimal shape to match your usage in HomeScreen.
// If you already have a central Message type elsewhere, this stays compatible.
export type StoredMessage = {
  id: string;
  text: string;
  sender: "user" | "assistant";
  createdAt: number;
  // optional fields you sometimes attach:
  stress?: number;
  tags?: string[];
};

async function getMessagesFile(): Promise<File> {
  const file = await getFile(MESSAGES_INDEX);
  // Initialize empty array if brand new
  if ((await file.text()).trim().length === 0) {
    await file.write("[]");
  }
  return file;
}

export async function loadMessages(): Promise<StoredMessage[]> {
  try {
    const f = await getMessagesFile();
    const raw = await f.text();
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as StoredMessage[]) : [];
  } catch {
    return [];
  }
}

export async function saveMessages(all: StoredMessage[]) {
  try {
    const f = await getMessagesFile();
    await f.write(JSON.stringify(all));
  } catch {
    // ignore
  }
}

/* -------------------- Stress Logs (optional) -------------------- */
export type StressLog = {
  id: string;
  createdAt: number;
  stress: number;   // 1..10
  tags: string[];   // e.g., ["school","deadline"]
  note?: string;    // the user message snippet
};

async function getStressFile(): Promise<File> {
  const f = await getFile(STRESS_INDEX);
  if ((await f.text()).trim().length === 0) {
    await f.write("[]");
  }
  return f;
}

export async function logStress(entry: StressLog) {
  try {
    const f = await getStressFile();
    const raw = await f.text();
    const arr: StressLog[] = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
    arr.unshift(entry);
    await f.write(JSON.stringify(arr));
  } catch {
    // ignore
  }
}

// (optional) if you need to read them back later:
export async function loadStressLogs(): Promise<StressLog[]> {
  try {
    const f = await getStressFile();
    const raw = await f.text();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as StressLog[]) : [];
  } catch {
    return [];
  }
}
