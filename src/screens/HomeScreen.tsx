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
  TouchableOpacity,
  InputAccessoryView, // iOS-only nicety
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { chatWithAI, ChatMsg } from "../lib/ai";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";

const FALLBACK = "I hit a snag talking to the server. Mind trying again in a moment?";
const ACCESSORY_ID = "chat-input-accessory";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [inputBarHeight, setInputBarHeight] = useState(56); // measured later

  const [sessionStart, setSessionStart] = useState<number>(() => Date.now());
  const lastUserMsgId = useRef<string | null>(null);

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
      content: "You are a concise, supportive companion. Be validating, practical, and brief."
    };
    const rest: ChatMsg[] = ms
      .filter(m => m.createdAt >= sessionStart)
      .filter(m => !(m.sender === "assistant" && m.text === FALLBACK))
      .map<ChatMsg>(m => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text
      }));
    return [system, ...rest.slice(-12)];
  }

  async function attachStress({ stress, tags }: { stress: number; tags: string[] }) {
    if (!messages.length) return;
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

    setLoading(true);
    type StressCarrier = Message & { stress: number };
    try {
      const lastStressCarrier = [...next]
        .filter(m => m.createdAt >= sessionStart)
        .reverse()
        .find(
          (m): m is StressCarrier =>
            m.sender === "user" && typeof (m as Record<string, unknown>).stress === "number"
        );
      const mood = lastStressCarrier?.stress;

      const reply = await chatWithAI(toChatMsgs(next), mood);

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

  const sessionMessages = messages.filter(m => m.createdAt >= sessionStart);

  // iOS only: account for header + safe area; Android lets the OS resize the window
  const iosOffset = 64 + insets.top;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? iosOffset : 0}
      >
        <View style={[styles.container]}>
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

          <FlatList
            data={sessionMessages}
            keyExtractor={m => m.id}
            renderItem={({ item }) => <ChatMessage msg={item} />}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingBottom: inputBarHeight + Math.max(insets.bottom, 8), // ← keep above input
            }}
          />

          {/* iOS: input rides the keyboard */}
          {Platform.OS === "ios" ? (
            <InputAccessoryView nativeID={ACCESSORY_ID}>
              <View
                style={[styles.row, { paddingBottom: Math.max(insets.bottom, 8) }]}
                onLayout={e => setInputBarHeight(e.nativeEvent.layout.height)}
              >
                <TextInput
                  style={styles.input}
                  value={text}
                  onChangeText={setText}
                  placeholder="Tell me what's on your mind..."
                  onSubmitEditing={send}
                  returnKeyType="send"
                  inputAccessoryViewID={ACCESSORY_ID}
                  editable={!loading}
                  blurOnSubmit={false}
                />
                <Button title={loading ? "Sending..." : "Send"} onPress={send} disabled={loading} />
              </View>
            </InputAccessoryView>
          ) : (
            // Android: normal flow; OS resizes the window
            <View
              style={[styles.row, { marginBottom: Math.max(insets.bottom, 8) }]}
              onLayout={e => setInputBarHeight(e.nativeEvent.layout.height)}
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
              />
              <Button title={loading ? "Sending..." : "Send"} onPress={send} disabled={loading} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "white", paddingHorizontal: 8, paddingTop: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.select({ ios: 12, android: 10 }),
  },
  newSessionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 8
  },
  newSessionText: { fontSize: 12, fontWeight: "600", color: "#333" }
});
