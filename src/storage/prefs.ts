// src/storage/prefs.ts
import { Directory, File, Paths } from "expo-file-system";

type Prefs = {
  hideOnboarding?: boolean; // if true, we never show the onboarding again
};

const DIR_NAME = "drawings";      // reuse your existing app dir
const FILE_NAME = "prefs.v1.json";

async function getDir(): Promise<Directory> {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create(); // sync in your setup
  return dir;
}

async function getFile(): Promise<File> {
  const dir = await getDir();
  const file = new File(dir, FILE_NAME);
  if (!file.exists) {
    file.create();
    await file.write("{}");
  }
  return file;
}

export async function loadPrefs(): Promise<Prefs> {
  try {
    const f = await getFile();
    const raw = await f.text();
    const data = JSON.parse(raw);
    return (data ?? {}) as Prefs;
  } catch {
    return {};
  }
}

export async function savePrefs(next: Prefs) {
  const f = await getFile();
  await f.write(JSON.stringify(next));
}

export async function setHideOnboarding(v: boolean) {
  const cur = await loadPrefs();
  await savePrefs({ ...cur, hideOnboarding: v });
}
