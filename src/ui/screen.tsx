// src/ui/Screen.tsx
import React from "react";
import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function Screen({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, backgroundColor: "#F6F7F8" }}>
      <LinearGradient
        colors={["#FFFFFF", "#F6F7F8"]}
        style={{ position: "absolute", inset: 0 }}
      />
      {children}
    </View>
  );
}
