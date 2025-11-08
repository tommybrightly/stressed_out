// src/storage/fsCompat.ts
// A tiny compatibility layer that prefers the **new** Expo FS API (SDK 54+),
// but gracefully falls back to the legacy module if your local types/runtime
// aren’t fully updated yet.

let mode: "modern" | "legacy" | null = null;

export async function getFS() {
  if (mode) return _fs;

  // Try modern API first
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("expo-file-system"); // new API entrypoint
    // Heuristic: new API exposes object-oriented classes/methods.
    // Some SDKs also keep old functions alongside. We'll detect by presence of "Directory".
    if (mod && (mod.Directory || mod.File)) {
      mode = "modern";
      _fs = { kind: "modern", mod };
      return _fs;
    }
    // If no modern surface, we’ll try legacy.
  } catch {
    /* ignore and try legacy */
  }

  // Fallback: legacy module
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const legacy = require("expo-file-system/legacy");
    mode = "legacy";
    _fs = { kind: "legacy", mod: legacy };
    return _fs;
  } catch (e) {
    throw new Error(
      "Expo FileSystem not available. Make sure expo-file-system is installed."
    );
  }
}

type FSModern = {
  kind: "modern";
  mod: any; // Directory/File OO API (SDK 54+)
};
type FSLegacy = {
  kind: "legacy";
  mod: any; // old constants + functions
};
let _fs: FSModern | FSLegacy;
export type FSHandle = FSModern | FSLegacy;

// Helpers used by storage.ts / DrawingScreen.tsx

export async function ensureDrawingsDir(fs: FSHandle) {
  if (fs.kind === "modern") {
    const { Directory } = fs.mod;
    const docs = await Directory.documentDirectory(); // Directory instance
    return await docs.ensureDirectoryExistsAsync("drawings"); // Directory for /drawings
  } else {
    const FileSystem = fs.mod;
    const root = FileSystem.documentDirectory!;
    const dir = root + "drawings/";
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    return { uri: dir };
  }
}

export async function readTextFile(fs: FSHandle, dir: any, name: string): Promise<string | null> {
  if (fs.kind === "modern") {
    const file = await dir.getFileAsync(name); // File instance
    const exists = await file.existsAsync();
    if (!exists) return null;
    return await file.readAsStringAsync();
  } else {
    const FileSystem = fs.mod;
    const path = dir.uri + name;
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(path);
  }
}

export async function writeTextFile(fs: FSHandle, dir: any, name: string, contents: string) {
  if (fs.kind === "modern") {
    const file = await dir.getFileAsync(name); // File instance (created if missing)
    await file.write(contents);
  } else {
    const FileSystem = fs.mod;
    await FileSystem.writeAsStringAsync(dir.uri + name, contents);
  }
}

export async function deleteFile(fs: FSHandle, uriOrDir: any, nameOrUndefined?: string) {
  if (fs.kind === "modern") {
    const file = await uriOrDir.getFileAsync(nameOrUndefined as string);
    const exists = await file.existsAsync();
    if (exists) await file.deleteAsync({ idempotent: true });
  } else {
    const FileSystem = fs.mod;
    const path = typeof nameOrUndefined === "string" ? uriOrDir.uri + nameOrUndefined : uriOrDir;
    try { await FileSystem.deleteAsync(path, { idempotent: true }); } catch {}
  }
}
