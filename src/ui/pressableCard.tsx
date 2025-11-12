// src/ui/PressableCard.tsx
import React, { useRef } from "react";
import { Pressable, Animated, PressableStateCallbackType } from "react-native";
import { Card } from "./Card";

type PressableCardProps =
  Omit<React.ComponentProps<typeof Pressable>, "children"> & {
    children?:
      | React.ReactNode
      | ((state: PressableStateCallbackType) => React.ReactNode);
  };

export function PressableCard({ children, ...pressableProps }: PressableCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPressIn={(e) => {
        Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
        pressableProps.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
        pressableProps.onPressOut?.(e);
      }}
      {...pressableProps}
    >
      {(state) => {
        const resolvedChild =
          typeof children === "function" ? children(state) : children;
        return (
          <Animated.View style={{ transform: [{ scale }] }}>
            <Card>{resolvedChild}</Card>
          </Animated.View>
        );
      }}
    </Pressable>
  );
}
