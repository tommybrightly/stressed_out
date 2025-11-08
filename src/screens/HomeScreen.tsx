// src/screens/HomeScreen.tsx
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { chatWithAI, ChatMsg } from "../lib/ai";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";
import { useKeyboardInset } from "../hooks/useKeyboardInset";

import {
  classifyEmotionHeuristic /* , classifyEmotionLLM */,
} from "../emotion/classifyEmotion";
import { appendEmotionEvent } from "../storage/emotions";

const FALLBACK =
  "I hit a snag talking to the server. Mind trying again in a moment?";

// uid
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/* ---------- Blue Send Button ---------- */
function SendButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.sendBtn,
        disabled ? styles.sendBtnDisabled : styles.sendBtnEnabled,
      ]}
    >
      <Text style={styles.sendBtnText}>{title}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const keyboardInset = useKeyboardInset(); // returns keyboard overlap in px (0 if hidden)

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState(56);

  const [sessionStart, setSessionStart] = useState<number>(() => Date.now());
  const lastUserMsgId = useRef<string | null>(null);

  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    (async () => {
      const initial = await loadMessages();
      setMessages(initial);
    })();
  }, []);

  function startNewSession() {
    setSessionStart(Date.now());
  }

  function toChatMsgs(ms: Message[]): ChatMsg[] {
    const system: ChatMsg = {
      role: "system",
      content:
        "You are a concise, supportive companion. Be validating, practical, and brief.",
    };
    const rest: ChatMsg[] = ms
      .filter((m) => m.createdAt >= sessionStart)
      .filter((m) => !(m.sender === "assistant" && m.text === FALLBACK))
      .map<ChatMsg>((m) => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text,
      }));
    return [system, ...rest.slice(-12)];
  }

  // Optional helper if you still use explicit stress logging somewhere else
  async function attachStress({ stress, tags }: { stress: number; tags: string[] }) {
    if (!messages.length) return;
    const idxFromEnd = [...messages].reverse().findIndex((m) => m.sender === "user");
    const realIdx = idxFromEnd === -1 ? -1 : messages.length - 1 - idxFromEnd;
    if (realIdx < 0) return;

    const copy = [...messages];
    copy[realIdx] = { ...copy[realIdx], stress, tags };
    setMessages(copy);
    await saveMessages(copy);

    await logStress({
      id: uid(),
      createdAt: Date.now(),
      stress,
      tags,
      note: copy[realIdx].text,
    });
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setErrorText(null);

    const userMsg: Message = {
      id: uid(),
      text: trimmed,
      sender: "user",
      createdAt: Date.now(),
    };
    lastUserMsgId.current = userMsg.id;

    // 1) optimistic UI
    const next = [...messages, userMsg];
    setMessages(next);
    setText("");
    await saveMessages(next);

    // 2) auto-log emotion from the user message
    try {
      const h = classifyEmotionHeuristic(trimmed);
      await appendEmotionEvent({
        id: uid(),
        category: h.category,
        confidence: h.confidence,
        at: Date.now(),
        sample: trimmed.slice(0, 120),
      });
    } catch {
      // soft-fail
    }

    // 3) call assistant
    setLoading(true);
    try {
      type StressCarrier = Message & { stress: number };
      const lastStressCarrier = [...next]
        .filter((m) => m.createdAt >= sessionStart)
        .reverse()
        .find(
          (m): m is StressCarrier =>
            m.sender === "user" && typeof (m as Record<string, unknown>).stress === "number"
        );
      const mood = lastStressCarrier?.stress;

      const reply = await chatWithAI(toChatMsgs(next), mood);

      const aiMsg: Message = {
        id: uid(),
        text: reply,
        sender: "assistant",
        createdAt: Date.now(),
      };
      const finalList = [...next, aiMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } catch (e: any) {
      setErrorText(String(e?.message || e));
      const failMsg: Message = {
        id: uid(),
        text: FALLBACK,
        sender: "assistant",
        createdAt: Date.now(),
      };
      const finalList = [...next, failMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } finally {
      setLoading(false);
    }
  }

  const sessionMessages = messages.filter((m) => m.createdAt >= sessionStart);

  /* ---------------- Exact placement above keyboard ----------------
     When the keyboard is OPEN, position the bar exactly by keyboardInset.
     When CLOSED, use safe-area bottom (or a small minimum).
     This avoids the previous "too high" double-offset.
  -----------------------------------------------------------------*/
  const safeBottom = Math.max(insets.bottom, 8);
  const bottomLift = keyboardInset > 0 ? keyboardInset : safeBottom;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top", "bottom"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>CalmSketch — Chat</Text>
          <TouchableOpacity onPress={startNewSession} style={styles.newSessionBtn}>
            <Text style={styles.newSessionText}>New Session</Text>
          </TouchableOpacity>
        </View>

        {!!errorText && <Text style={{ color: "crimson", marginBottom: 6 }}>{errorText}</Text>}
        {loading && (
          <View style={{ paddingVertical: 6 }}>
            <ActivityIndicator />
          </View>
        )}

        <FlatList
          ref={listRef}
          data={sessionMessages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => <ChatMessage msg={item} />}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            // keep the last message above the floating input bar
            paddingBottom: inputBarHeight + bottomLift + 12,
          }}
          onContentSizeChange={() => {
            requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
          }}
        />

        {/* Floating input bar */}
        <View
          onLayout={(e) => setInputBarHeight(e.nativeEvent.layout.height)}
          style={[
            styles.inputBar,
            {
              bottom: bottomLift, // sits exactly atop the keyboard when open
              left: 0,
              right: 0,
            },
          ]}
        >
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Tell me what's on your mind..."
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!loading}
            blurOnSubmit={false}
            multiline
          />

          {/* Blue send button */}
          <SendButton
            title={loading ? "Sending..." : "Send"}
            onPress={send}
            disabled={loading || !text.trim()}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: "700" },
  newSessionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  newSessionText: { fontSize: 12, fontWeight: "600", color: "#333" },

  inputBar: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: "white",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
    maxHeight: 120,
  },

  /* Send button styles */
  sendBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: Platform.select({ ios: 10, android: 8 }),
    minWidth: 74,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnEnabled: {
    backgroundColor: "#2563eb", // blue-600
  },
  sendBtnDisabled: {
    backgroundColor: "#93c5fd", // blue-300
  },
  sendBtnText: {
    color: "white",
    fontWeight: "700",
  },
});
