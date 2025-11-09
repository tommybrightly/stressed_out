// src/components/ChatMessage.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme/colors";

export default function ChatMessage({ msg }: { msg: { sender: "user" | "assistant"; text: string } }) {
  const isUser = msg.sender === "user";
  return (
    <View style={[styles.row, isUser ? { justifyContent: "flex-end" } : { justifyContent: "flex-start" }]}>
      <View style={[styles.bubble, isUser ? styles.user : styles.assistant]}>
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>{msg.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { width: "100%", marginBottom: 8, flexDirection: "row" },
  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  user: {
        backgroundColor: colors.userBubble, // #007AFF
        borderBottomRightRadius: 6,
      },
  assistant: {
    backgroundColor: colors.assistantBubble,
    borderBottomLeftRadius: 6,
  },
  text: { fontSize: 16, lineHeight: 22 },
  userText: { color: "#FFFFFF" },       // white on blue
  assistantText: { color: colors.text }, // warm dark gray
});
