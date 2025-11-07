import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from "react-native";
import ChatMessage from "../../src/components/ChatMessage";
import { Message } from "../types";
import { chatWithAI, ChatMsg } from "../lib/ai";
import { loadMessages, saveMessages, logStress } from "../../src/storage/storage";
import StressTagInput from "../../src/components/StressTagInput";
import { BACKEND_URL } from "../lib/ai";

export default function HomeScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const lastUserMsgId = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const initial = await loadMessages();
      setMessages(initial);
    })();
  }, []);

  // ---- attachStress must be top-level (not nested inside send)
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

// inside HomeScreen component

function toChatMsgs(ms: Message[]) {
  const system = {
    role: "system" as const,
    content:
      "You are a concise, supportive companion. Be validating, practical, and brief."
  };
  const rest = ms.map(m => ({
    role: m.sender === "assistant" ? ("assistant" as const) : ("user" as const),
    content: m.text
  }));
  return [system, ...rest];
}

async function send() {
  const trimmed = text.trim();
  if (!trimmed) return;

  setErrorText(null);

  const userMsg: Message = {
    id: Math.random().toString(36).slice(2),
    text: trimmed,
    sender: "user",
    createdAt: Date.now()
  };

  const next = [...messages, userMsg];
  setMessages(next);
  setText("");
  await saveMessages(next);

  setLoading(true);
  try {
    // optionally pass most recent stress as mood
    const lastStress = [...next].reverse().find(
      m => m.sender === "user" && typeof (m as any).stress === "number"
    ) as (Message & { stress?: number }) | undefined;

    const reply = await chatWithAI(toChatMsgs(next), lastStress?.stress);
    const aiMsg: Message = {
      id: Math.random().toString(36).slice(2),
      text: reply,
      sender: "assistant", // your app uses "ai" (mapped to assistant above)
      createdAt: Date.now()
    };
    const finalList = [...next, aiMsg];
    setMessages(finalList);
    await saveMessages(finalList);
  } catch (e: any) {
    setErrorText(String(e?.message || e));
    const failMsg: Message = {
      id: Math.random().toString(36).slice(2),
      text: "I couldn’t reach the AI just now. Please try again.",
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

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Stress Less — Chat</Text>

        {!!errorText && (
          <Text style={{ color: "crimson", marginBottom: 6 }}>{errorText}</Text>
        )}

        <FlatList
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ paddingBottom: 12 }}
          renderItem={({ item }) => <ChatMessage msg={item} />}
          style={{ flex: 1 }}
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
          {/* DEBUG PANEL — remove later */}
<View style={{ marginTop: 8, padding: 8, backgroundColor: "#f6f6f6", borderRadius: 8 }}>
  <Text style={{ fontSize: 12, color: "#666" }}>Backend: {BACKEND_URL}</Text>
  <Button
    title="Test /api/health"
    onPress={async () => {
      try {
        const r = await fetch(`${BACKEND_URL}/api/health`);
        const t = await r.text();
        alert(`health: ${r.status} ${t}`);
      } catch (e: any) {
        alert(`health failed: ${String(e)}`);
      }
    }}
  />
  {errorText ? (
    <Text style={{ color: "crimson", marginTop: 6 }}>Last error: {errorText}</Text>
  ) : null}
</View>

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
