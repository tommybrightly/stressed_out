// src/components/Screen.tsx
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, ViewProps } from "react-native";
import { colors } from "../theme/colors";

export default function Screen({ children, style }: ViewProps & { children: React.ReactNode }) {
  return (
    <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[{ flex: 1, padding: 16 }, style]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}
