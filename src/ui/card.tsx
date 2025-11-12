// src/ui/Card.tsx
import React from "react";
import { View, ViewProps } from "react-native";
import { shadow } from "./shadow";

export function Card({ style, ...props }: ViewProps) {
  return (
    <View
      style={[
        {
          borderRadius: 16,
          backgroundColor: "#fff",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          ...shadow(5),
        },
        style,
      ]}
      {...props}
    />
  );
}
