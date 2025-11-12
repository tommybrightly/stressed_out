// src/ui/shadow.ts
import { Platform } from "react-native";
export function shadow(elevation = 4) {
  if (Platform.OS === "android") return { elevation };
  // iOS: translate elevation to soft shadow
  const y = Math.round(elevation * 0.6);
  const blur = Math.round(elevation * 2.5);
  const opacity = 0.18 + Math.min(elevation, 10) * 0.01;
  return {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
  };
}
