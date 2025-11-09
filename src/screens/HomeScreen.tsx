import { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, FlatList, Platform, StyleSheet, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Screen from "../components/Screen";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { chatWithAI, ChatMsg } from "../lib/ai";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";
import { useKeyboardInset } from "../hooks/useKeyboardInset";
import { classifyEmotionHeuristic } from "../emotion/classifyEmotion";
import { appendEmotionEvent } from "../storage/emotions";
import { colors as theme } from "../theme/colors";
import { shadowTray } from "../theme/shadow";

const FALLBACK = "I hit a snag talking to the server. Mind trying again in a moment?";
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function SendButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={1}
      // style={[styles.sendBtn, disabled ? styles.sendBtnDisabled : styles.sendBtnEnabled]}
      style={[styles.sendBtn, styles.sendBtnEnabled]} //always keep dark blue color
    >
      <Text style={styles.sendBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState(56);
  const [sessionStart, setSessionStart] = useState<number>(() => Date.now());
  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => { (async () => setMessages(await loadMessages()))(); }, []);
  useEffect(() => { requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true })); }, [messages.length]);
  useEffect(() => { if (keyboardInset > 0) requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true })); }, [keyboardInset]);

  function startNewSession() { setSessionStart(Date.now()); }

  function toChatMsgs(ms: Message[]): ChatMsg[] {
    const system: ChatMsg = { role: "system", content: "You are a concise, supportive companion. Be validating, practical, and brief." };
    const rest: ChatMsg[] = ms.filter(m => m.createdAt >= sessionStart)
      .filter(m => !(m.sender === "assistant" && m.text === FALLBACK))
      .map(m => ({ role: m.sender === "assistant" ? "assistant" : "user", content: m.text }));
    return [system, ...rest.slice(-12)];
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setErrorText(null);

    const userMsg: Message = { id: uid(), text: trimmed, sender: "user", createdAt: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setText("");
    await saveMessages(next);

    try {
      const h = classifyEmotionHeuristic(trimmed);
      await appendEmotionEvent({ id: uid(), category: h.category, confidence: h.confidence, at: Date.now(), sample: trimmed.slice(0, 120) });
    } catch {}

    setLoading(true);
    try {
      const reply = await chatWithAI(toChatMsgs(next), undefined);
      const aiMsg: Message = { id: uid(), text: reply, sender: "assistant", createdAt: Date.now() };
      const finalList = [...next, aiMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } catch (e: any) {
      setErrorText(String(e?.message || e));
      const failMsg: Message = { id: uid(), text: FALLBACK, sender: "assistant", createdAt: Date.now() };
      const finalList = [...next, failMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } finally {
      setLoading(false);
    }
  }

  const sessionMessages = messages.filter(m => m.createdAt >= sessionStart);
  const safeBottom = Math.max(insets.bottom, 8);
  const bottomLift = keyboardInset > 0 ? keyboardInset : safeBottom;

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🌤 Stress Less</Text>
        <TouchableOpacity onPress={startNewSession} style={styles.newSessionBtn}>
          <Text style={styles.newSessionText}>New Session</Text>
        </TouchableOpacity>
      </View>

      {!!errorText && <Text style={{ color: "#B91C1C", marginBottom: 6 }}>{errorText}</Text>}
      {loading && <View style={{ paddingVertical: 6 }}><ActivityIndicator /></View>}

      <FlatList
        ref={listRef}
        data={sessionMessages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <ChatMessage msg={item} />}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: inputBarHeight + bottomLift + 12 }}
      />

      {/* Opaque underlay so bubbles don't show through when bar is raised */}
      <View pointerEvents="none" style={[styles.inputUnderlay, { height: bottomLift + inputBarHeight }]} />

      {/* Floating input bar */}
      <View
        onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
        style={[styles.inputBar, shadowTray, { bottom: bottomLift, left: 0, right: 0 }]}
      >
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Tell me what's on your mind..."
          placeholderTextColor={theme.textSubtle}
          onSubmitEditing={send}
          returnKeyType="send"
          editable={!loading}
          blurOnSubmit={false}
          multiline
        />
        <SendButton title={loading ? "Sending..." : "Send"} onPress={send} disabled={loading || !text.trim()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: "700", color: theme.text },
  newSessionBtn: {
    paddingHorizontal: 12, paddingVertical: 8, backgroundColor: theme.cream, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.line,
  },
  newSessionText: { fontSize: 12, fontWeight: "700", color: theme.text },

  inputUnderlay: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: theme.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line, zIndex: 1,
  },
  inputBar: {
    position: "absolute", flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 10, paddingTop: 8, paddingBottom: 8,
    backgroundColor: theme.white, borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 2,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: theme.line, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: Platform.select({ ios: 12, android: 10 }), maxHeight: 120, backgroundColor: theme.white, color: theme.text,
  },
  sendBtn: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: Platform.select({ ios: 10, android: 8 }), minWidth: 74, alignItems: "center", justifyContent: "center" },
  sendBtnEnabled: { backgroundColor: theme.primary },
  sendBtnDisabled: { backgroundColor: "#BFDDEF" },
  sendBtnText: { color: theme.white, fontWeight: "700" },
});
