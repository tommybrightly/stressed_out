// src/ui/Section.tsx
import React from "react";
import { View, Text, ViewProps } from "react-native";
import { Card } from "./Card";

export function Section({
  title, children, style, ...rest
}: ViewProps & { title?: string }) {
  return (
    <Card style={[{ padding: 14, gap: 10 }, style]} {...rest}>
      {title ? <Text style={{ fontSize: 15, fontWeight: "600" }}>{title}</Text> : null}
      <View style={{ gap: 8 }}>{children}</View>
    </Card>
  );
}
