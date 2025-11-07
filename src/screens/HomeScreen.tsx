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
  ActivityIndicator
} from "react-native";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { chatWithAI, ChatMsg } from "../lib/ai";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";
import StressTagInput from "../../src/components/StressTagInput";

const FALLBACK = "I hit a snag talking to the server. Mind trying again in a moment?";

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const lastUserMsgId = useRef<string | null>(null);

  // Load/persist messages for metrics, but we won't render the full history.
  useEffect(() => {
    (async () => {
      const initial = await loadMessages();
      setMessages(initial);
    })();
  }, []);

  // Map your internal Message[] → backend ChatMsg[] (drop fallback lines, trim history)
  function toChatMsgs(ms: Message[]): ChatMsg[] {
    const system: ChatMsg = {
      role: "system",
      content:
        "You are a concise, supportive companion. Be validating, practical, and brief."
    };

    const rest: ChatMsg[] = ms
      // remove our old fallback replies so they don't pollute context
      .filter(m => !(m.sender === "assistant" && m.text === FALLBACK))
      .map<ChatMsg>(m => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text
      }));

    // keep the last 12 total (system + tail) to keep prompt small
    const tail = rest.slice(-12);
    return [system, ...tail];
  }

  async function attachStress({ stress, tags }: { stress: number; tags: string[] }) {
    if (!messages.length) return;

    // find last user message
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

    // 1) append user message locally
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
    try {
      // Try to pass the most recent self-reported stress level, if present
      const lastStressCarrier = [...next].reverse().find(
        m => m.sender === "user" && typeof (m as any).stress === "number"
      ) as (Message & { stress?: number }) | undefined;

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
      // Append a friendly fallback (still hidden from future prompts by toChatMsgs)
      const failMsg: Message = {
        id: Math.random().toString(36).slice(2),
        text: FALLBACK,
        sender: "assistant",
        createdAt: Date.now()
      };
      const finalList = [...next, failMsg];
      setMessages(finalList);
      await saveMessages(finalList);
    } finally {
      setLoading(false);
    }
  }

  // 🔎 UI should NOT show prior conversation. Only show the latest assistant reply (if any).
  const latestAssistant = [...messages].reverse().find(m => m.sender === "assistant");
  const visibleMessages = latestAssistant ? [latestAssistant] : [];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <Text style={styles.title}>CalmSketch — Chat</Text>

        {!!errorText && (
          <Text style={{ color: "crimson", marginBottom: 6 }}>{errorText}</Text>
        )}

        {loading && (
          <View style={{ paddingVertical: 6 }}>
            <ActivityIndicator />
          </View>
        )}

        {/* Only render the most recent AI message (no history clutter) */}
        <FlatList
          data={visibleMessages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => <ChatMessage msg={item} />}
          style={{ flex: 1 }}
          ListEmptyComponent={
            <Text style={{ color: "#666" }}>
              Tell me what’s on your mind. I’ll respond right here.
            </Text>
          }
        />

        <View style={styles.row}>
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

        <View style={{ marginTop: 8 }}>
          <StressTagInput onSave={attachStress} />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  }
});
