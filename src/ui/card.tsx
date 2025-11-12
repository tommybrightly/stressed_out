// src/ui/Card.tsx
import React from "react";
import { View, ViewProps } from "react-native";
import { shadow } from "./shadow";

type CardProps = React.PropsWithChildren<ViewProps>;

export function Card({ style, children, ...rest }: CardProps) {
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
      {...rest}
    >
      {children}
    </View>
  );
}
