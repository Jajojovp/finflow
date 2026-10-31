import React, { useState } from "react";
import { Linking, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Crypto from "expo-crypto";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, ReduceMotion } from "react-native-reanimated";
import { cashPosition } from "../../../src/workspace/finance.mjs";
import { snapshotSummary } from "../../../src/workspace/snapshot.mjs";
import { useWorkspace } from "@/data/provider";
import {
  archiveTransaction,
  appendDemo,
  inspectBackup,
  demoWorkspace,
  emptySettings,
  emptyWorkspace,
  encodeBackup,
  financialNames,
  reviewRows,
  confirmImportRows,
  getWorkspace,
  makeTransaction,
  profileNames,
  updateWorkspace,
  workspaceKey,
  type Profile,
  type Snapshot,
} from "@/data/model";
import {
  Button,
  Card,
  Copy,
  ErrorText,
  Field,
  Frame,
  Select,
  CurrencySelect,
  Title,
} from "@/components/ui";
import { colors, spacing, type } from "@/theme";
import { isCurrencyCode, currencyMath } from "../../../src/workspace/currencies.mjs";

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "No se pudo guardar. Inténtalo de nuevo.";
function finish() {
  if (router.canGoBack()) router.back();
  else router.replace("/");
}
async function copy(value: string) {
  const success = await Clipboard.setStringAsync(value);
  if (!success)
    throw new Error(
      "No se pudo copiar. Revisa el permiso del portapapeles e inténtalo de nuevo.",
    );
}
function delight() {
  if (process.env.EXPO_OS === "ios")
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Success,
    ).catch(() => {});
}

export function ProfileScreen() {
  const { ready } = useWorkspace();
  return ready ? <ProfileForm /> : <Frame />;
}
function ProfileForm() {
  const { state, commit, saving } = useWorkspace(),
    [selected, setSelected] = useState<Profile>(state.profile),
    [error, setError] = useState("");
  async function choose(example: boolean) {
    setError("");
    try {
      await commit((s) => {
        const next = { ...s, profile: selected, onboarded: true };
        const key = workspaceKey(next);
        const existing = s.datasets[key];
        const workspace = existing
          ? example && !existing.rows.length
            ? appendDemo(existing, selected, s.period, s.entity)
            : existing
          : example
            ? demoWorkspace(selected, s.period, s.entity)
            : emptyWorkspace(selected, s.period, s.entity);
        return {
          ...next,
          datasets: {
            ...s.datasets,
            [key]: workspace,
          },
        };
      });
      delight();
      router.dismissAll();
      router.replace("/");
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Frame>
      <Animated.View
        entering={FadeIn.duration(220).reduceMotion(ReduceMotion.System)}
        style={{ gap: spacing.xl }}
      >
        <View style={{ gap: spacing.md }}>
          <Text
            style={{
              fontSize: 48,
              fontWeight: "700",
              fontStyle: "italic",
              color: colors.blue,
            }}
          >
            f
          </Text>
          <Title>Un pequeño paso. Un futuro más claro.</Title>
          <Copy muted>
            ¿Cómo quieres usar FinFlow? Podrás cambiarlo cuando quieras.
          </Copy>
        </View>
        <Select
          label="Mi perfil"
          value={selected}
          onChange={(v) => setSelected(v as Profile)}
          options={(Object.entries(profileNames) as [Profile, string][]).map(
            ([value, label]) => ({ value, label }),
          )}
        />
        <Card tint>
          <Title>
            {selected === "personal"
              ? "Mi dinero. Mis objetivos."
              : selected === "business"
                ? "Tu empresa, con perspectiva."
                : "Números que puedes explicar."}
          </Title>
          <Copy muted>
            {selected === "personal"
              ? "Ingresos, gastos, ahorro y pequeñas metas."
              : selected === "business"
                ? "Resultados, equilibrio, caja y escenarios."
                : "Espacios separados para cada cliente, análisis y evidencia."}
          </Copy>
        </Card>
        <Button
          title={saving ? "Guardando…" : "Comenzar con mis datos"}
          disabled={saving}
          onPress={() => {
            void choose(false);
          }}
        />
        <Button
          title="Explorar con ejemplos"
          secondary
          disabled={saving}
          onPress={() => {
            void choose(true);
          }}
        />
        <Copy muted small>
          Gratis y de código abierto. Sin tarjeta ni registro. Tus datos
          permanecen en este dispositivo.
        </Copy>
        <ErrorText message={error} />
      </Animated.View>
    </Frame>
  );
}
export function TransactionScreen() {
  const { ready } = useWorkspace();
  const params = useLocalSearchParams<{ id?: string; type?: string }>();
  return ready ? (
    <TransactionForm
      key={params.id || "new"}
      id={params.id}
      initialType={params.type}
    />
  ) : (
    <Frame />
  );
}
function TransactionForm({
  id,
  initialType,
}: {
  id?: string;
  initialType?: string;
}) {
  const { dataset, state, update, commit, saving } = useWorkspace(),
    existing = dataset.rows.find((r) => r.id === id);
  const [date, setDate] = useState(existing?.date || state.period + "-01"),
    [description, setDescription] = useState(existing?.description || ""),
    [category, setCategory] = useState(existing?.category || ""),
    [flow, setFlow] = useState(
      existing?.type || (initialType === "ingreso" ? "ingreso" : "gasto"),
    );
  const [amount, setAmount] = useState(existing ? String(existing.amount) : ""),
    [kind, setKind] = useState(
      existing?.financialType || (flow === "ingreso" ? "revenue" : "opex"),
    ),
    [behavior, setBehavior] = useState(existing?.behavior || "fixed"),
    [error, setError] = useState("");
  const options =
    flow === "ingreso"
      ? ["revenue", "other_income", "capital"]
      : [
          "opex",
          "cogs",
          "interest",
          "tax",
          "depreciation",
          "capital",
          "unclassified",
        ];
  async function save() {
    setError("");
    try {
      const row = makeTransaction(
        {
          date,
          description,
          category,
          type: flow,
          amount: Number(amount.replace(",", ".")),
          financialType: kind,
          behavior,
          source: id ? "Editado" : "Manual",
        },
        id || Crypto.randomUUID(),
      );
      await commit((s) => ({
        ...updateWorkspace(s, (d) => ({
          ...d,
          rows: id
            ? d.rows.map((r) => (r.id === id ? row : r))
            : [...d.rows, row],
        })),
        period: row.date.slice(0, 7),
      }));
      delight();
      finish();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  async function archive() {
    if (!id) return;
    setError("");
    try {
      await update((d) => archiveTransaction(d, id));
      finish();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  if (id && !existing)
    return (
      <Frame>
        <Card>
          <Title>No encontramos ese movimiento.</Title>
          <Button title="Volver" onPress={finish} />
        </Card>
      </Frame>
    );
  return (
    <Frame>
      <Copy muted>
        {id
          ? "Ajusta el registro; el análisis se recalculará."
          : "Cada movimiento ayuda a entender tu mes."}
      </Copy>
      <Select
        label="Tipo"
        value={flow}
        options={[
          { label: "Gasto", value: "gasto" },
          { label: "Ingreso", value: "ingreso" },
        ]}
        onChange={(v) => {
          setFlow(v as "ingreso" | "gasto");
          setKind(v === "ingreso" ? "revenue" : "opex");
        }}
      />
      <Field
        label="Fecha (AAAA-MM-DD)"
        value={date}
        onChange={setDate}
        maxLength={10}
      />
      <Field
        label="Descripción"
        value={description}
        onChange={setDescription}
        maxLength={120}
      />
      {id && <Copy muted small>ID del movimiento: {id}</Copy>}
      <Field
        label="Categoría"
        value={category}
        onChange={setCategory}
        maxLength={40}
      />
      <Field
        label={`Importe (${dataset.currency})`}
        value={amount}
        onChange={setAmount}
        keyboard="decimal-pad"
      />
      <Select
        label="Clasificación financiera"
        value={kind}
        onChange={setKind}
        options={options.map((value) => ({
          value,
          label: financialNames[value],
        }))}
      />
      {flow === "gasto" && ["opex", "cogs", "unclassified"].includes(kind) && (
        <Select
          label="Comportamiento del coste"
          value={behavior}
          onChange={setBehavior}
          options={[
            { label: "Fijo", value: "fixed" },
            { label: "Variable", value: "variable" },
          ]}
        />
      )}
      <Copy muted small>
        Importes positivos. Usa ventas y costes netos de IVA recuperable.
        Depreciación no mueve caja y capital no se incluye en el resultado.
      </Copy>
      <ErrorText message={error} />
      <Button
        title={saving ? "Guardando…" : "Guardar movimiento"}
        disabled={saving}
        onPress={() => {
          void save();
        }}
      />
      {id && (
        <>
          <Button
            title="Archivar movimiento"
            secondary
            disabled={saving}
            onPress={() => {
              void archive();
            }}
          />
          <Copy muted small>
            Podrás restaurarlo desde Más.
          </Copy>
        </>
      )}
    </Frame>
  );
}
export function SettingsScreen() {
  const { ready, state } = useWorkspace();
  return ready ? (
    <SettingsForm key={`${workspaceKey(state)}:${state.period}`} />
  ) : (
    <Frame />
  );
}
function SettingsForm() {
  const { state, dataset, settings, cash, commit, saving } = useWorkspace();
  const [name, setName] = useState(dataset.name),
    [currency, setCurrency] = useState(dataset.currency),
    [period, setPeriod] = useState(state.period),
    [available, setAvailable] = useState(String(cash.available)),
    [target, setTarget] = useState(String(settings.savingsTarget)),
    [budget, setBudget] = useState(String(settings.expenseBudget)),
    [price, setPrice] = useState(String(settings.unitPrice));
  const fields = {
    ar: "Cuentas por cobrar",
    inventory: "Inventario",
    ap: "Cuentas por pagar",
    shortDebt: "Deuda a corto plazo",
    longDebt: "Deuda a largo plazo",
    equity: "Patrimonio",
  };
  const [balance, setBalance] = useState<Record<string, string>>(
    Object.fromEntries(
      Object.keys(fields).map((k) => [
        k,
        String(dataset.analysis.balances?.[state.period]?.[k] ?? ""),
      ]),
    ),
  );
  const [salesBudget, setSalesBudget] = useState(
      String(dataset.analysis.revenueBudgets?.[state.period] ?? ""),
    ),
    [margin, setMargin] = useState(
      dataset.analysis.targets?.netMargin == null
        ? ""
        : String(dataset.analysis.targets.netMargin * 100),
    ),
    [ratio, setRatio] = useState(
      String(dataset.analysis.limits?.currentRatio ?? ""),
    ),
    [error, setError] = useState("");
  async function save() {
    setError("");
    try {
      const values = [available, target, budget, price].map((v) =>
        Number(v.replace(",", ".")),
      );
      if (
        !isCurrencyCode(currency) ||
        !name.trim() ||
        name.length > 80 ||
        !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
        values.some((v) => !Number.isFinite(v) || Math.abs(v) > 1e12) ||
        values[1] < 0 ||
        values[1] > 100 ||
        values[2] < 0 ||
        values[3] < 0
      )
        throw new Error("Revisa el nombre, periodo y los importes.");
      const balances = Object.fromEntries(
        Object.entries(balance).map(([k, v]) => [
          k,
          v.trim() === "" ? null : Number(v.replace(",", ".")),
        ]),
      );
      if (
        Object.entries(balances).some(
          ([k, v]) =>
            v != null &&
            (!Number.isFinite(v) ||
              Math.abs(v) > 1e12 ||
              (k !== "equity" && v < 0)),
        )
      )
        throw new Error("Revisa el balance. Deja vacío lo que no conozcas.");
      const optional = (v: string) =>
          v.trim() === "" ? null : Number(v.replace(",", ".")),
        sales = optional(salesBudget),
        netMargin = optional(margin),
        minimum = optional(ratio);
      if (
        [sales, netMargin, minimum].some(
          (v) => v != null && !Number.isFinite(v),
        ) ||
        (sales != null && (sales < 0 || sales > 1e12)) ||
        (minimum != null && (minimum < 0 || minimum > 1000)) ||
        (netMargin != null && Math.abs(netMargin) > 1000)
      )
        throw new Error("Revisa el presupuesto, meta de margen y límite.");
      await commit((s) =>
        updateWorkspace({ ...s, period }, (d) => {
          const net = cashPosition(
            d.rows.filter((r) => r.date.startsWith(period)),
            0,
            currency,
          ).net;
          return {
            ...d,
            name: name.trim(),
            currency,
            finance: {
              ...d.finance,
              [period]: {
                opening: currencyMath(currency).round(values[0] - net),
                savingsTarget: values[1],
                expenseBudget: values[2],
                unitPrice: values[3],
              },
            },
            analysis: {
              ...d.analysis,
              balances: { ...d.analysis.balances, [period]: balances },
              revenueBudgets: { ...d.analysis.revenueBudgets, [period]: sales },
              targets: {
                ...d.analysis.targets,
                netMargin: netMargin == null ? null : netMargin / 100,
              },
              limits: { ...d.analysis.limits, currentRatio: minimum },
            },
          };
        }),
      );
      finish();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Frame>
      <Field
        label="Nombre del espacio"
        value={name}
        onChange={setName}
        maxLength={80}
      />
      <CurrencySelect
        value={currency}
        onChange={(v) => setCurrency(v as typeof currency)}
      />
      <Copy muted small>
        Cambiar de moneda no convierte los importes registrados.
      </Copy>
      <Field
        label="Periodo (AAAA-MM)"
        value={period}
        onChange={setPeriod}
        maxLength={7}
      />
      <Field
        label="Disponible actual"
        value={available}
        onChange={setAvailable}
        keyboard="numbers-and-punctuation"
      />
      <Field
        label="Meta de ahorro (%)"
        value={target}
        onChange={setTarget}
        keyboard="decimal-pad"
      />
      <Field
        label="Presupuesto de gastos"
        value={budget}
        onChange={setBudget}
        keyboard="decimal-pad"
      />
      {state.profile !== "personal" && (
        <>
          <Title>Más perspectiva para tu análisis.</Title>
          <Field
            label="Precio medio por unidad"
            value={price}
            onChange={setPrice}
            keyboard="decimal-pad"
          />
          <Copy muted small>
            Balance al cierre del periodo. Vacío significa dato no disponible;
            cero es un importe declarado.
          </Copy>
          {Object.entries(fields).map(([key, label]) => (
            <Field
              key={key}
              label={label}
              value={balance[key]}
              onChange={(value) =>
                setBalance((previous) => ({ ...previous, [key]: value }))
              }
              keyboard="numbers-and-punctuation"
            />
          ))}
          <Field
            label="Presupuesto de ventas"
            value={salesBudget}
            onChange={setSalesBudget}
            keyboard="decimal-pad"
          />
          <Field
            label="Meta de margen neto (%)"
            value={margin}
            onChange={setMargin}
            keyboard="numbers-and-punctuation"
          />
          <Field
            label="Razón corriente mínima"
            value={ratio}
            onChange={setRatio}
            keyboard="decimal-pad"
          />
          <Copy muted small>
            Son metas y límites tuyos; no se presentan como referencias del
            mercado ni compromisos bancarios.
          </Copy>
        </>
      )}
      <ErrorText message={error} />
      <Button
        title={saving ? "Guardando…" : "Guardar configuración"}
        disabled={saving}
        onPress={() => {
          void save();
        }}
      />
    </Frame>
  );
}
export function GoalScreen() {
  const { ready } = useWorkspace();
  return ready ? <GoalForm /> : <Frame />;
}
function GoalForm() {
  const { dataset, update, saving } = useWorkspace(),
    [name, setName] = useState(dataset.goal.name),
    [target, setTarget] = useState(String(dataset.goal.target)),
    [saved, setSaved] = useState(String(dataset.goal.saved)),
    [error, setError] = useState("");
  async function save() {
    setError("");
    try {
      const total = Number(target.replace(",", ".")),
        reserved = Number(saved.replace(",", "."));
      if (
        !name.trim() ||
        ![total, reserved].every(Number.isFinite) ||
        total <= 0 ||
        reserved < 0 ||
        total > 1e12 ||
        reserved > 1e12
      )
        throw new Error("Revisa el nombre y los importes del objetivo.");
      await update((d) => ({
        ...d,
        goal: { name: name.trim(), target: total, saved: reserved },
      }));
      delight();
      finish();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Frame>
      <Field
        label="Nombre del objetivo"
        value={name}
        onChange={setName}
        maxLength={80}
      />
      <Field
        label="Importe objetivo"
        value={target}
        onChange={setTarget}
        keyboard="decimal-pad"
      />
      <Field
        label="Dinero reservado"
        value={saved}
        onChange={setSaved}
        keyboard="decimal-pad"
      />
      <Copy muted>
        No mueve dinero ni verifica tu cuenta bancaria. Actualiza cuánto tienes
        reservado realmente.
      </Copy>
      <ErrorText message={error} />
      <Button
        title={saving ? "Guardando…" : "Guardar mi objetivo"}
        disabled={saving}
        onPress={() => {
          void save();
        }}
      />
    </Frame>
  );
}

function merge(current: Snapshot, incoming: Snapshot): Snapshot {
  const datasets = { ...current.datasets };
  for (const [key, d] of Object.entries(incoming.datasets)) {
    if (!datasets[key]) {
      datasets[key] = d;
      continue;
    }
    const existing = datasets[key],
      seen = new Set(
        existing.rows.map((r) =>
          JSON.stringify([r.date, r.description, r.category, r.type, r.amount]),
        ),
      );
    const fresh = d.rows
      .filter((r) => {
        const fingerprint = JSON.stringify([
          r.date,
          r.description,
          r.category,
          r.type,
          r.amount,
        ]);
        if (seen.has(fingerprint)) return false;
        seen.add(fingerprint);
        return true;
      })
      .map((r) => ({ ...r, id: Crypto.randomUUID() }));
    if (existing.rows.length + fresh.length > 5000)
      throw new Error(
        "La importación superaría 5.000 movimientos en un espacio.",
      );
    datasets[key] = { ...existing, rows: [...existing.rows, ...fresh] };
  }
  return { ...current, datasets };
}
export function ImportScreen() {
  const { state, commit, saving, dataScope, readRecovery } = useWorkspace();
  const [format, setFormat] = useState("csv");
  const [text, setText] = useState("");
  const [pasteVersion, setPasteVersion] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [restoreMode, setRestoreMode] = useState("replace");
  const [preview, setPreview] = useState<ReturnType<typeof inspectBackup> | null>(null);
  const [csvPreview, setCSVPreview] = useState<{ key: string; name: string; review: ReturnType<typeof reviewRows> } | null>(null);
  const clearPreview = () => { setPreview(null); setCSVPreview(null); };
  const summary = preview ? snapshotSummary(preview.state) : null;
  function review(raw: string) {
    setPreview(null); setError("");
    setPreview(inspectBackup(raw, dataScope));
  }
  async function apply() {
    setError(""); setNotice("");
    try {
      if (format === "backup") { review(text); return; }
      const d = getWorkspace(state);
      setCSVPreview({ key: workspaceKey(state), name: d.name, review: reviewRows(d, text) });
    } catch (e) { setError(errorMessage(e)); }
  }
  async function confirmCSV() {
    if (!csvPreview || saving || !csvPreview.review.ok) return;
    setError("");
    try {
      await commit(s => {
        if (workspaceKey(s) !== csvPreview.key) throw new Error("Cambió el espacio. Revisa el CSV otra vez.");
        const next = updateWorkspace(s, d => confirmImportRows(d, csvPreview.review));
        return { ...next, period: csvPreview.review.latestMonth || next.period };
      });
      setCSVPreview(null); setNotice("Movimientos guardados. Los duplicados exactos se han omitido.");
    } catch (e) { setError(errorMessage(e)); }
  }
  async function confirmBackup() {
    if (!preview || saving) return;
    setError("");
    try {
      if (restoreMode === "replace") await commit(() => preview.state, { recovery: true });
      else await commit(s => merge(s, preview.state));
      setPreview(null);
      setNotice(restoreMode === "replace" ? "Respaldo completo restaurado. Puedes revisar la copia anterior desde esta pantalla." : "Registros añadidos. Tus ajustes actuales se conservan.");
    } catch (e) { setError(errorMessage(e)); }
  }
  return <Frame>
    <Card>
      <Title>Tus datos pueden acompañarte.</Title>
      <Copy muted>CSV añade movimientos al espacio actual. Un respaldo completo recupera también los espacios, monedas, metas y configuración. Revisa su contenido antes de confirmar.</Copy>
      <Select label="Formato" value={format} onChange={value => { setFormat(value); clearPreview(); setError(""); }} options={[
        { label: "CSV de movimientos", value: "csv" }, { label: "Respaldo completo de FinFlow", value: "backup" },
      ]} />
      <Copy small muted>{format === "csv" ? "Cabecera: fecha,descripcion,categoria,tipo,importe. Fecha AAAA-MM-DD, tipo ingreso o gasto, importe positivo." : "Admite el formato portátil v2, el respaldo móvil v1 y los datos web anteriores. Hasta 4 MB; se revisan en este dispositivo."}</Copy>
      <Field key={format + pasteVersion} label="Contenido para importar" value={text} onChange={value => { setText(value); clearPreview(); }} multiline maxLength={4 * 1024 * 1024} />
      <Button title="Pegar desde el portapapeles" secondary onPress={() => {
        void Clipboard.getStringAsync().then(value => {
          if (value.length > 4 * 1024 * 1024) throw new Error("El contenido supera el límite de 4 MB.");
          setText(value); setPasteVersion(v => v + 1); clearPreview(); setNotice("Texto pegado. Revisa su contenido antes de importar.");
        }).catch(e => setError(errorMessage(e)));
      }} />
      <ErrorText message={error} />
      <Button title={saving ? "Guardando…" : format === "backup" ? "Revisar respaldo" : "Revisar CSV"} disabled={saving} onPress={() => { void apply(); }} />
      {!!notice && <Copy muted small>{notice}</Copy>}
    </Card>
    {csvPreview && <Card>
      <Title>Antes de añadir.</Title>
      <Copy>Destino: {csvPreview.name} · {csvPreview.review.currency}</Copy>
      <Copy>Filas: {csvPreview.review.total} · Nuevas: {csvPreview.review.rows.length} · Duplicadas: {csvPreview.review.duplicates} · Errores: {csvPreview.review.errors.length}</Copy>
      <Copy small muted>No se convertirán los importes. Los gastos se añaden sin clasificación financiera para que puedas revisarla.</Copy>
      {csvPreview.review.rows.slice(0, 5).map((r: { date: string; description: string; amount: number }, i: number) => <Copy small key={i}>{r.date} · {r.description} · {r.amount} {csvPreview.review.currency}</Copy>)}
      {csvPreview.review.errors.slice(0, 20).map((e: { row: number | null; message: string }, i: number) => <ErrorText key={i} message={(e.row ? `Fila ${e.row}: ` : "") + e.message} />)}
      {csvPreview.review.errors.length > 20 && <Copy small muted>Hay más errores. Corrige el archivo y vuelve a revisarlo.</Copy>}
      <Button title={saving ? "Guardando…" : "Confirmar importación"} disabled={saving || !csvPreview.review.ok || !csvPreview.review.rows.length} onPress={() => { void confirmCSV(); }} />
      <Button title="Cancelar sin cambios" secondary disabled={saving} onPress={() => setCSVPreview(null)} />
    </Card>}
    {preview && summary && <Card>
      <Title>Antes de restaurar.</Title>
      <Copy>{summary.workspaces} espacios · {summary.movements} movimientos · {summary.archived} archivados</Copy>
      <Copy muted>{summary.currencies.join(", ") || "Sin monedas guardadas"}</Copy>
      {Object.entries(preview.state.datasets).map(([key, d]) => <Copy small key={key}>{d.name} · {d.currency} · {d.rows.length} movimientos</Copy>)}
      <Copy small muted>{preview.legacy ? "Respaldo anterior sin ámbito de cuenta declarado. Comprueba que estos datos sean tuyos." : "El ámbito declarado coincide con el destino. El archivo es editable y no constituye una autorización de acceso."}</Copy>
      <Select label="Cómo importar este respaldo" value={restoreMode} onChange={setRestoreMode} options={[
        { label: "Restaurar todos los datos y ajustes", value: "replace" }, { label: "Añadir solo movimientos sin cambiar ajustes", value: "merge" },
      ]} />
      <Copy muted>{restoreMode === "replace" ? "Se sustituirán todos los espacios de este modo local o cuenta. Se conservará una copia anterior para recuperarla." : "Se añadirán movimientos a sus espacios y se crearán los que falten. Los ajustes existentes se conservan."}</Copy>
      <Button title={saving ? "Guardando…" : restoreMode === "replace" ? "Confirmar restauración completa" : "Confirmar y añadir movimientos"} disabled={saving} onPress={() => { void confirmBackup(); }} />
      <Button title="Cancelar sin cambios" secondary disabled={saving} onPress={() => setPreview(null)} />
    </Card>}
    <Card>
      <Title>Guarda un respaldo completo.</Title>
      <Copy small muted>Incluye espacios, movimientos, archivados, metas y ajustes. Se copia al portapapeles; elige dónde guardarlo y con quién compartirlo.</Copy>
      <Button title="Copiar mi respaldo" secondary onPress={() => {
        void (async () => { try { setError(""); await copy(encodeBackup(state, dataScope)); setNotice("Respaldo copiado. Guárdalo en un lugar que controles."); } catch (e) { setError(errorMessage(e)); } })();
      }} />
      <Button title="Revisar copia anterior a la restauración" secondary disabled={saving} onPress={() => {
        void readRecovery().then(raw => {
          if (!raw) throw new Error("Todavía no hay una copia anterior a una restauración.");
          setFormat("backup"); setRestoreMode("replace"); review(raw);
        }).catch(e => setError(errorMessage(e)));
      }} />
    </Card>
  </Frame>;
}

const lessons = [
  {
    title: "La caja y el beneficio",
    body: "La caja refleja cobros y pagos; el beneficio refleja un resultado. Capital y depreciación explican parte de la diferencia.",
    question: "¿Un préstamo recibido es una venta?",
    answers: [
      "Sí, porque entra dinero.",
      "No, es una entrada de financiación.",
    ],
    correct: 1,
    why: "La financiación aumenta caja sin ser una venta.",
  },
  {
    title: "Un colchón de tranquilidad",
    body: "Un fondo reservado ayuda a cubrir imprevistos. El importe adecuado depende de tus gastos y circunstancias.",
    question: "¿Para qué sirve un fondo de emergencia?",
    answers: ["Para responder a imprevistos.", "Para garantizar rendimientos."],
    correct: 0,
    why: "Su función es disponibilidad y seguridad, no garantizar ganancias.",
  },
  {
    title: "El punto de equilibrio",
    body: "Se alcanza cuando las ventas cubren los costes del modelo. La clasificación fija y variable es parte de los supuestos.",
    question: "¿Qué cambia la venta necesaria para cubrir costes?",
    answers: [
      "El margen de contribución y los costes fijos.",
      "El color del gráfico.",
    ],
    correct: 0,
    why: "Costes fijos / margen de contribución determina el equilibrio.",
  },
  {
    title: "Tiempo, coste y riesgo",
    body: "Una simulación usa tasas hipotéticas. Las comisiones, la inflación y los resultados reales pueden cambiar el valor final.",
    question: "¿Una tasa constante en un simulador es una garantía?",
    answers: ["Sí.", "No, es un supuesto."],
    correct: 1,
    why: "Un supuesto permite explorar, no predecir con certeza.",
  },
  {
    title: "Una conclusión verificable",
    body: "Una conclusión mejora cuando puedes revisar fuente, fecha, fórmula y límites. Los datos faltantes deben verse.",
    question: "¿Qué ayuda a comprobar una conclusión?",
    answers: ["Solo una puntuación.", "Sus datos, método y límites."],
    correct: 1,
    why: "La trazabilidad permite entender y corregir el resultado.",
  },
];
export function LearnScreen() {
  const { dataset, update, saving } = useWorkspace(),
    [selected, setSelected] = useState(0),
    [feedback, setFeedback] = useState(""),
    [error, setError] = useState("");
  const lesson = lessons[selected];
  async function answer(index: number) {
    setError("");
    if (index !== lesson.correct) {
      setFeedback("Prueba otra vez. Piensa en la finalidad del concepto.");
      return;
    }
    try {
      await update((d) => ({
        ...d,
        lessons: [...new Set([...d.lessons, selected])],
      }));
      setFeedback(lesson.why);
      delight();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  return (
    <Frame>
      <Title>Pequeñas lecciones. Grandes pasos.</Title>
      <Copy muted>
        {dataset.lessons.length} de 5 conceptos completados, a tu ritmo.
      </Copy>
      <Select
        label="Lección"
        value={String(selected)}
        onChange={(value) => {
          setSelected(Number(value));
          setFeedback("");
        }}
        options={lessons.map((l, i) => ({
          label: `${dataset.lessons.includes(i) ? "✓ " : ""}${i + 1}. ${l.title}`,
          value: String(i),
        }))}
      />
      <Card tint>
        <Title>{lesson.title}</Title>
        <Copy>{lesson.body}</Copy>
      </Card>
      <Card>
        <Title>{lesson.question}</Title>
        {lesson.answers.map((value, i) => (
          <Button
            key={value}
            title={value}
            secondary
            disabled={saving}
            onPress={() => {
              void answer(i);
            }}
          />
        ))}
        {!!feedback && <Copy>{feedback}</Copy>}
        <ErrorText message={error} />
      </Card>
      <Button title="Volver a mi espacio" secondary onPress={finish} />
    </Frame>
  );
}
