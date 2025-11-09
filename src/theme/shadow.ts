// src/theme/shadow.ts
import { Platform } from "react-native";

export const shadowCard = {
  // iOS
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 8,
  // Android
  elevation: 3,
};

export const shadowTray = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowOffset: { width: 0, height: -2 },
  shadowRadius: 8,
  elevation: 6,
};
