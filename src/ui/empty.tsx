// src/ui/Empty.tsx
import React from "react";
import { View, Text } from "react-native";
import { Card } from "./Card";

export function Empty({ title, hint }: { title: string; hint: string }) {
  return (
    <Card style={{ padding: 18, alignItems: "center" }}>
      <Text style={{ fontWeight: "600", fontSize: 16 }}>{title}</Text>
      <Text style={{ marginTop: 6, color: "#6B7280", textAlign: "center" }}>
        {hint}
      </Text>
    </Card>
  );
}
