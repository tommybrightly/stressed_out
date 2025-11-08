// src/storage/storage.ts
import { Directory, File, Paths } from "expo-file-system";

export type SavedDrawing = { id: string; uri: string; createdAt: number };

const INDEX_NAME = "drawings.v1.json";

// Lazily ensure /document/drawings exists and return the Directory object
async function getDrawingsDir(): Promise<Directory> {
  const dir = new Directory(Paths.document, "drawings");
  if (!dir.exists) {
    dir.create(); // modern API's create() is sync; safe to call here
  }
  return dir;
}

// Lazily get the JSON index File inside drawings/
async function getIndexFile(): Promise<File> {
  const dir = await getDrawingsDir();
  const file = new File(dir, INDEX_NAME);
  return file;
}

export async function loadDrawings(): Promise<SavedDrawing[]> {
  try {
    const indexFile = await getIndexFile();
    if (!indexFile.exists) return [];
    const text = await indexFile.text();            // async in your setup
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as SavedDrawing[]) : [];
  } catch {
    return [];
  }
}

export async function saveDrawings(all: SavedDrawing[]) {
  try {
    const indexFile = await getIndexFile();
    await indexFile.write(JSON.stringify(all));     // async in your setup
  } catch {
    // ignore persistence errors
  }
}
