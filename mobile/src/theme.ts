import { Platform } from "react-native";
import { Color } from "expo-router";

export const colors = {
  background: "#f7f9fb",
  surface: "#ffffff",
  ink: Platform.select({
    ios: Color.ios.label,
    android: Color.android.material.onSurface,
    default: "#202b3d",
  })!,
  muted: Platform.select({
    ios: Color.ios.secondaryLabel,
    android: Color.android.material.onSurfaceVariant,
    default: "#657083",
  })!,
  blue: "#3478ee",
  blueSoft: "#edf3ff",
  green: "#257f68",
  mint: "#eaf5ed",
  peach: "#fff0e7",
  coral: "#b75d4d",
  line: "#e8ecf1",
  white: "#ffffff",
  black: "#202b3d",
};
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const type = {
  caption: 12,
  small: 14,
  body: 16,
  title: 22,
  display: 34,
};
export const shadow = "0 3px 18px rgba(40, 64, 94, 0.04)";
