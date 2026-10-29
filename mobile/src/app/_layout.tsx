import { AuthProvider, useAuth } from '@/data/auth';
import { accountStorageKey } from '../../../src/workspace/auth-contract.mjs';
import React from "react";
import { Stack } from "expo-router/stack";
import { usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { FinflowProvider } from "@/data/provider";
import { colors } from "@/theme";

function Navigator() {
  const path = usePathname();
  const title =
    (
      {
        "/": "FinFlow",
        "/transactions": "Movimientos",
        "/results": "Tu análisis",
        "/goals": "Objetivos",
        "/more": "Tu espacio",
      } as Record<string, string>
    )[path] || "FinFlow";
  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.blue,
          headerTitleStyle: { color: colors.ink },
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: "minimal",
        }}
      >
        <Stack.Screen name="(tabs)" options={{ title }} />
        <Stack.Screen
          name="profile"
          options={{
            title: "Hagamos espacio para tus metas",
            presentation: "modal",
          }}
        />
        <Stack.Screen
          name="transaction"
          options={{ title: "Tu movimiento", presentation: "modal" }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: "Configurar mi espacio", presentation: "modal" }}
        />
        <Stack.Screen
          name="goal"
          options={{ title: "Mi objetivo", presentation: "modal" }}
        />
        <Stack.Screen
          name="import"
          options={{ title: "Llevar mis datos", presentation: "modal" }}
        />
        <Stack.Screen
          name="learn"
          options={{ title: "Un pequeño paso cada día" }}
        />
      </Stack>
    </>
  );
}
function AccountWorkspace() {
  const { user } = useAuth();
  const storageKey = accountStorageKey('finflow-mobile-v1', user);
  return (
    <FinflowProvider key={storageKey} storageKey={storageKey}>
      <Navigator />
    </FinflowProvider>
  );
}
export default function RootLayout() { return <AuthProvider><AccountWorkspace /></AuthProvider>; }
