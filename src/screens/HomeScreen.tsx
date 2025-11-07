import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { chatWithAI, ChatMsg } from "../lib/ai";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";


const FALLBACK = "I hit a snag talking to the server. Mind trying again in a moment?";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  // Session anchor: everything with createdAt >= sessionStart is "this session"
  const [sessionStart, setSessionStart] = useState<number>(() => Date.now());
  const lastUserMsgId = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const initial = await loadMessages();
      setMessages(initial);
    })();
  }, []);

  // Start a brand-new session (does NOT delete old history; just hides it from the chat UI)
  function startNewSession() {
    setSessionStart(Date.now());
  }

  // Map your internal messages to backend schema, trim old fallback lines, and only keep recent tail
  function toChatMsgs(ms: Message[]): ChatMsg[] {
    const system: ChatMsg = {
      role: "system",
      content:
        "You are a concise, supportive companion. Be validating, practical, and brief."
    };

    const rest: ChatMsg[] = ms
      .filter(m => m.createdAt >= sessionStart) // only messages from this session
      .filter(m => !(m.sender === "assistant" && m.text === FALLBACK))
      .map<ChatMsg>(m => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text
      }));

    // Keep prompt small to avoid latency/cost
    const tail = rest.slice(-12);
    return [system, ...tail];
  }

  async function attachStress({ stress, tags }: { stress: number; tags: string[] }) {
    if (!messages.length) return;

    // find last user message (in any session; that’s okay for logging)
    const idxFromEnd = [...messages].reverse().findIndex(m => m.sender === "user");
    const realIdx = idxFromEnd === -1 ? -1 : messages.length - 1 - idxFromEnd;
    if (realIdx < 0) return;

    const copy = [...messages];
    copy[realIdx] = { ...copy[realIdx], stress, tags };
    setMessages(copy);
    await saveMessages(copy);

    await logStress({
      id: Math.random().toString(36).slice(2),
      createdAt: Date.now(),
      stress,
      tags,
      note: copy[realIdx].text
    });
  }

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setErrorText(null);

    // 1) append user message locally (belongs to current session)
    const userMsg: Message = {
      id: Math.random().toString(36).slice(2),
      text: trimmed,
      sender: "user",
      createdAt: Date.now()
    };
    lastUserMsgId.current = userMsg.id;

    const next = [...messages, userMsg];
    setMessages(next);
    setText("");
    await saveMessages(next);

    // 2) call backend
    setLoading(true);
    type StressCarrier = Message & { stress: number };
    try {
      // pass the most recent self-reported stress value (in this session if possible)
      const lastStressCarrier = [...next]
      .filter(m => m.createdAt >= sessionStart)
      .reverse()
      .find(
        (m): m is StressCarrier =>
          m.sender === "user" && typeof (m as Record<string, unknown>).stress === "number"
      );
      const mood = lastStressCarrier?.stress;

      const reply = await chatWithAI(toChatMsgs(next), mood);

      // 3) append assistant reply
      const aiMsg: Message = {
        id: Math.random().toString(36).slice(2),
        text: reply,
        sender: "assistant",
        createdAt: Date.now()
      };
      const finalList = [...next, aiMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } catch (e: any) {
      setErrorText(String(e?.message || e));
      // Append a friendly fallback (will be filtered from future prompts)
      const failMsg: Message = {
        id: Math.random().toString(36).slice(2),
        text: FALLBACK,
        sender: "assistant",
        createdAt: Date.now()
      };
      const finalList = [...messages, failMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } finally {
      setLoading(false);
    }
  }

  // Only render messages from the current session
  const sessionMessages = messages.filter(m => m.createdAt >= sessionStart);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      // iOS uses padding; Android uses height to play nice with adjustResize
      behavior={Platform.select({ ios: "padding", android: "height" })}
      // Add some offset for any header plus safe area
      keyboardVerticalOffset={Platform.select({ ios: 90 + insets.top, android: 0 })}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>CalmSketch — Chat</Text>
          <TouchableOpacity onPress={startNewSession} style={styles.newSessionBtn}>
            <Text style={styles.newSessionText}>New Session</Text>
          </TouchableOpacity>
        </View>

        {!!errorText && (
          <Text style={{ color: "crimson", marginBottom: 6 }}>{errorText}</Text>
        )}

        {loading && (
          <View style={{ paddingVertical: 6 }}>
            <ActivityIndicator />
          </View>
        )}

        {/* Render the current session thread */}
        <FlatList
          data={sessionMessages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => <ChatMessage msg={item} />}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input row sticks to bottom; KeyboardAvoidingView + safe-area keeps it visible */}
        <View style={[styles.row, { marginBottom: 8 }]}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Tell me what's on your mind..."
            onSubmitEditing={send}
            returnKeyType="send"
            editable={!loading}
          />
          <Button title={loading ? "Sending..." : "Send"} onPress={send} disabled={loading} />
        </View>

        
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 })
  },
  newSessionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 8
  },
  newSessionText: { fontSize: 12, fontWeight: "600", color: "#333" }
});
