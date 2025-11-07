import AsyncStorage from "@react-native-async-storage/async-storage";
import { Message, StressEntry } from "../types";


const MSG_KEY = "@calmsketch/messages";
const STRESS_KEY = "@calmsketch/stressEntries";


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