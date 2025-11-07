// src/components/ChatMessage.tsx
import { View, Text, StyleSheet } from "react-native";




export default function ChatMessage({ msg }: { msg: { text: string; createdAt: number; sender: "user" | "assistant"; stress?: number; tags?: string[] } }) {
  const isUser = msg.sender === "user";
  return (
    <View style={[styles.bubble, isUser ? styles.user : styles.ai]}>
      <Text style={styles.text}>{msg.text}</Text>
      <Text style={styles.meta}>
        {new Date(msg.createdAt).toLocaleTimeString()}
        {msg.stress ? ` · stress ${msg.stress}` : ""}
        {msg.tags?.length ? ` · ${msg.tags.join(", ")}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { marginVertical: 6, padding: 12, borderRadius: 12, maxWidth: "88%" },
  user: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  ai: { alignSelf: "flex-start", backgroundColor: "#EEE" },
  text: { fontSize: 16 },
  meta: { fontSize: 11, opacity: 0.6, marginTop: 6 },
});

