// src/ui/Bubble.tsx
import React from "react";
import { View, Text } from "react-native";
import { shadow } from "./shadow";
import { tokens } from "./tokens";

export function Bubble({
  fromUser, children,
}: { fromUser?: boolean; children: React.ReactNode }) {
  const bg = fromUser ? tokens.color.primary : "#fff";
  const color = fromUser ? "#fff" : tokens.color.text;
  return (
    <View
      style={[
        {
          maxWidth: "80%",
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 18,
          backgroundColor: bg,
          borderWidth: fromUser ? 0 : 1,
          borderColor: fromUser ? "transparent" : tokens.color.outline,
          alignSelf: fromUser ? "flex-end" : "flex-start",
          ...(!fromUser ? shadow(2) : {}),
        },
      ]}
    >
      <Text style={{ color, fontSize: 16, lineHeight: 16 * tokens.type.line }}>
        {children as any}
      </Text>
    </View>
  );
}
