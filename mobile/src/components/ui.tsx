import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import {
  Host,
  Button as ExpoButton,
  Picker,
  TextInput,
  useNativeState,
} from "@expo/ui";
import { scheduleOnRN } from "react-native-worklets";
import { router } from "expo-router";
import { searchCurrencies, currencyOptions } from "../../../src/workspace/currencies.mjs";
import { useFinflow, useWorkspace } from "@/data/provider";
import { colors, radius, shadow, spacing, type } from "@/theme";

export function Copy({
  children,
  muted = false,
  small = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  small?: boolean;
}) {
  return (
    <Text
      selectable
      style={{
        fontSize: small ? type.caption : type.body,
        lineHeight: small ? 19 : 25,
        color: muted ? colors.muted : colors.ink,
      }}
    >
      {children}
    </Text>
  );
}
export function Title({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: type.title,
        fontWeight: "600",
        letterSpacing: -0.6,
        color: colors.ink,
        lineHeight: 29,
      }}
    >
      {children}
    </Text>
  );
}
export function Card({
  children,
  tint = false,
}: {
  children: React.ReactNode;
  tint?: boolean;
}) {
  return (
    <View
      style={{
        backgroundColor: tint ? colors.blueSoft : colors.surface,
        borderRadius: radius.lg,
        borderCurve: "continuous",
        padding: spacing.xl,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.line,
        boxShadow: shadow,
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Host
      matchContents
      colorScheme="light"
      seedColor={colors.blue}
      style={{ width: "100%" }}
    >
      <ExpoButton
        label={title}
        onPress={onPress}
        disabled={disabled}
        variant={secondary ? "outlined" : "filled"}
        style={{
          width: "100%",
          paddingVertical: spacing.md,
          borderRadius: radius.md,
        }}
      />
    </Host>
  );
}
export function Field({
  label,
  value,
  onChange,
  keyboard = "default",
  multiline = false,
  placeholder = "",
  maxLength = 120,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: KeyboardTypeOptions;
  multiline?: boolean;
  placeholder?: string;
  maxLength?: number;
}) {
  const text = useNativeState(value);
  const change = useCallback(
    (next: string) => {
      "worklet";
      text.value = next;
      scheduleOnRN(onChange, next);
    },
    [text, onChange],
  );
  return (
    <View style={{ gap: spacing.sm }}>
      <Copy small>{label}</Copy>
      <Host
        matchContents
        colorScheme="light"
        seedColor={colors.blue}
        style={{ width: "100%" }}
      >
        <TextInput
          value={text}
          onChangeText={change}
          keyboardType={keyboard}
          multiline={multiline}
          placeholder={placeholder || label}
          maxLength={maxLength}
          autoCorrect={false}
          testID={label}
          style={{
            width: "100%",
            height: multiline ? 180 : 52,
            padding: spacing.md,
            borderRadius: radius.sm,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: colors.surface,
          }}
          textStyle={{ fontSize: type.body, color: colors.black }}
        />
      </Host>
    </View>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Copy small>{label}</Copy>
      <Host
        matchContents
        colorScheme="light"
        seedColor={colors.blue}
        style={{ width: "100%" }}
      >
        <Picker selectedValue={value} onValueChange={onChange} testID={label}>
          {options.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </Picker>
      </Host>
    </View>
  );
}
export function ErrorText({ message }: { message: string }) {
  return message ? (
    <Text
      selectable
      accessibilityRole="alert"
      style={{ fontSize: type.small, color: colors.coral, lineHeight: 22 }}
    >
      {message}
    </Text>
  ) : null;
}
export function CurrencySelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [query, setQuery] = useState("");
  const matches = searchCurrencies(query);
  const current = currencyOptions.find(entry => entry.code === value);
  const options = current && !matches.some(entry => entry.code === value) ? [current, ...matches] : matches;
  return <View style={{ gap: spacing.sm }}>
    <Field label="Buscar moneda por nombre o código" value={query} onChange={setQuery} maxLength={80} />
    <Select label="Moneda del espacio" value={value} onChange={onChange}
      options={options.map(entry => ({ value: entry.code, label: `${entry.code} · ${entry.name}` }))} />
    <Copy muted small>{matches.length ? `${matches.length} ${matches.length === 1 ? "moneda disponible" : "monedas disponibles"}` : "Sin coincidencias. Se conserva tu moneda actual."}</Copy>
  </View>;
}
export function Metric({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: 145,
        minWidth: 0,
        backgroundColor: colors.surface,
        padding: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.line,
        gap: spacing.sm,
      }}
    >
      <Copy muted small>
        {label}
      </Copy>
      <Text
        selectable
        style={{
          fontSize: type.title,
          fontWeight: "600",
          letterSpacing: -0.6,
          fontVariant: ["tabular-nums"],
          color: colors.ink,
        }}
      >
        {value}
      </Text>
      {caption && (
        <Copy muted small>
          {caption}
        </Copy>
      )}
    </View>
  );
}
export function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: spacing.lg,
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <Text
        style={{
          flex: 1,
          color: colors.ink,
          fontSize: type.small,
          fontWeight: bold ? "600" : "400",
        }}
      >
        {label}
      </Text>
      <Text
        selectable
        style={{
          flexShrink: 1,
          textAlign: "right",
          fontVariant: ["tabular-nums"],
          color: colors.ink,
          fontSize: type.small,
          fontWeight: bold ? "600" : "400",
        }}
      >
        {value}
      </Text>
    </View>
  );
}
export function Frame({ children }: { children?: React.ReactNode }) {
  const { ready, error, retry } = useFinflow();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxl * 2,
        gap: spacing.xl,
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
      }}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      {!ready ? (
        <Card>
          <Title>
            {error
              ? "Abramos tus datos con cuidado."
              : "Preparando tu espacio…"}
          </Title>
          {error ? (
            <>
              <ErrorText message={error} />
              <Button title="Reintentar" onPress={retry} />
            </>
          ) : (
            <ActivityIndicator color={colors.blue} />
          )}
        </Card>
      ) : (
        children
      )}
    </ScrollView>
  );
}
export function ContextLine() {
  const { state, dataset, commit } = useWorkspace();
  const [error, setError] = useState("");
  const periods = [
    ...new Set([state.period, ...dataset.rows.map((r) => r.date.slice(0, 7))]),
  ]
    .sort()
    .reverse();
  return (
    <Card>
      <Copy muted small>
        {dataset.name} · {dataset.currency}
      </Copy>
      <Button title={`Moneda: ${dataset.currency} · Cambiar`} onPress={() => router.push("/settings")} secondary />
      <Select
        label="Periodo"
        value={state.period}
        options={periods.map((p) => ({
          label: new Intl.DateTimeFormat("es", {
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${p}-01T00:00:00Z`)),
          value: p,
        }))}
        onChange={(v) => {
          setError("");
          void commit((s) => ({ ...s, period: v })).catch((e) =>
            setError(e.message),
          );
        }}
      />
      <ErrorText message={error} />
      {dataset.rows.some((r) => r.source === "Datos de ejemplo") && (
        <Copy muted small>
          Incluye datos de ejemplo. Puedes empezar con tus datos desde Más.
        </Copy>
      )}
    </Card>
  );
}
