import { Tabs } from "expo-router";
import { Text } from "react-native";
import { useFinflow } from "@/data/provider";
import { colors, type } from "@/theme";

export default function TabLayout() {
  const { state } = useFinflow();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 72,
        },
        tabBarLabelStyle: { fontSize: type.caption, paddingBottom: 8 },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {[
        ["index", "Resumen", "⌂"],
        ["transactions", "Movimientos", "☷"],
        ["results", state.profile === "personal" ? "Fugas" : "Resultados", "▥"],
        ["goals", "Objetivos", "◎"],
        ["more", "Más", "···"],
      ].map(([name, title, glyph]) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color }) => (
              <Text style={{ color, fontSize: type.title }}>{glyph}</Text>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
