import React, { useMemo, useState } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { listClients } from "../../../src/workspace/clients.mjs";
import { scenario } from "../../../src/workspace/core.mjs";
import { useWorkspace } from "@/data/provider";
import {
  appendDemo,
  ownData,
  profileNames,
  restoreTransaction,
  clientIndexes,
  createAdvisorClient,
  archiveAdvisorClient,
} from "@/data/model";
import {
  Button,
  Card,
  ContextLine,
  Copy,
  ErrorText,
  Field,
  Frame,
  Metric,
  Row,
  Select,
  Title,
} from "@/components/ui";
import { colors, radius, spacing, type } from "@/theme";
import AccountCard from '@/components/account-card';

const percent = (n: number | null) =>
  n == null
    ? "N/D"
    : `${n.toLocaleString("es", { maximumFractionDigits: 1 })}%`;
export function Home() {
  const { state, ready, dataset, cash, money, settings } = useWorkspace();
  if (ready && !state.onboarded) return <Redirect href="/profile" />;
  const progress = Math.min(
    100,
    Math.round((dataset.goal.saved / dataset.goal.target) * 100),
  );
  return (
    <Frame>
      <View style={{ gap: spacing.sm }}>
        <Copy muted small>
          {profileNames[state.profile].toUpperCase()}
        </Copy>
        <Title>
          {state.profile === "personal"
            ? "Todo empieza por ti."
            : "Más claridad. Más futuro."}
        </Title>
        <Copy muted>Un pequeño paso para entender mejor tus números.</Copy>
      </View>
      <ContextLine />
      <Card tint>
        <Copy muted>Disponible en caja</Copy>
        <Text
          selectable
          style={{
            fontSize: type.display,
            fontWeight: "600",
            letterSpacing: -1.2,
            color: colors.ink,
            fontVariant: ["tabular-nums"],
          }}
        >
          {dataset.finance[state.period]
            ? money(cash.available)
            : "Por configurar"}
        </Text>
        <Copy small muted>
          {dataset.finance[state.period]
            ? `Saldo inicial ${money(cash.opening)} + flujo ${money(cash.net)}`
            : `Flujo del periodo ${money(cash.net)}. Configura el saldo para conocer el disponible.`}
        </Copy>
        <Button
          title="Configurar disponible"
          secondary
          onPress={() => router.push("/settings")}
        />
      </Card>
      <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>
        <Metric label="Ingresos" value={money(cash.income)} />
        <Metric label="Gastos" value={money(cash.expense)} />
        <Metric
          label="Tasa de ahorro"
          value={percent(cash.rate)}
          caption={`Meta ${settings.savingsTarget}%`}
        />
      </View>
      <Button
        title="Añadir ingreso"
        onPress={() =>
          router.push({ pathname: "/transaction", params: { type: "ingreso" } })
        }
      />
      <Button
        title="Añadir gasto"
        secondary
        onPress={() =>
          router.push({ pathname: "/transaction", params: { type: "gasto" } })
        }
      />
      <Card>
        <Copy muted small>
          UN OBJETIVO, MÁS CERCA
        </Copy>
        <Title>{dataset.goal.name}</Title>
        <Copy>
          {money(dataset.goal.saved)} de {money(dataset.goal.target)}
        </Copy>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: progress }}
          style={{
            height: 8,
            backgroundColor: colors.mint,
            borderRadius: radius.pill,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress}%`,
              height: 8,
              backgroundColor: colors.green,
            }}
          />
        </View>
        <Copy muted small>
          {progress}% completado. Cada pequeño paso cuenta.
        </Copy>
        <Button
          title="Actualizar mi progreso"
          secondary
          onPress={() => router.push("/goal")}
        />
      </Card>
      <Card>
        <Title>¿Por dónde se va tu dinero?</Title>
        <Copy muted>
          Revisa cargos repetidos, aumentos por categoría y comisiones.
        </Copy>
        <Button
          title="Entender mis números"
          secondary
          onPress={() => router.push("/results")}
        />
      </Card>
    </Frame>
  );
}
export function Transactions() {
  const store = useWorkspace(),
    [search, setSearch] = useState(""),
    [flow, setFlow] = useState("all");
  const filtered = useMemo(
    () =>
      store.rows
        .filter(
          (r) =>
            (flow === "all" || r.type === flow) &&
            `${r.description} ${r.category}`
              .toLocaleLowerCase()
              .includes(search.toLocaleLowerCase()),
        )
        .sort((a, b) => b.date.localeCompare(a.date)),
    [store.rows, search, flow],
  );
  if (!store.ready) return <Frame />;
  return (
    <FlatList
      data={filtered}
      keyExtractor={(r) => r.id}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: spacing.xl,
        paddingBottom: spacing.xxl * 2,
        width: "100%",
        maxWidth: 720,
        alignSelf: "center",
        gap: spacing.md,
      }}
      ListHeaderComponent={
        <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
          <Copy muted>
            Cada movimiento cuenta. Toca un registro para editarlo.
          </Copy>
          <ContextLine />
          <Button
            title="Añadir movimiento"
            onPress={() => router.push("/transaction")}
          />
          <Field
            label="Buscar movimientos"
            value={search}
            onChange={setSearch}
          />
          <Select
            label="Tipo de movimiento"
            value={flow}
            onChange={setFlow}
            options={[
              { label: "Todos", value: "all" },
              { label: "Ingresos", value: "ingreso" },
              { label: "Gastos", value: "gasto" },
            ]}
          />
        </View>
      }
      ListEmptyComponent={
        <Card>
          <Title>
            {store.rows.length
              ? "No encontramos coincidencias."
              : "Haz espacio para tu primer movimiento."}
          </Title>
          <Copy muted>
            {store.rows.length
              ? "Prueba otra búsqueda o cambia el filtro."
              : "Añade un ingreso o gasto para empezar a ver tu mes."}
          </Copy>
        </Card>
      }
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Editar ${item.description}`}
          onPress={() =>
            router.push({ pathname: "/transaction", params: { id: item.id } })
          }
          style={{
            padding: spacing.lg,
            gap: spacing.sm,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.line,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              gap: spacing.md,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: type.body,
                fontWeight: "500",
                color: colors.ink,
              }}
            >
              {item.description}
            </Text>
            <Text
              selectable
              style={{
                fontSize: type.body,
                color: item.type === "ingreso" ? colors.green : colors.ink,
                fontVariant: ["tabular-nums"],
              }}
            >
              {item.type === "ingreso" ? "+" : "−"}
              {store.money(item.amount)}
            </Text>
          </View>
          <Copy muted small>
            {item.date} · {item.category} · {item.source}
          </Copy>
        </Pressable>
      )}
      ListFooterComponent={
        <Copy small muted>
          {filtered.length} movimientos en el periodo.
        </Copy>
      }
    />
  );
}
export function Results() {
  const {
    state,
    dataset,
    statement: p,
    equilibrium: b,
    analysis: a,
    leaks,
    rows,
    money,
  } = useWorkspace();
  const [view, setView] = useState("results"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const isPersonal = state.profile === "personal";
  return (
    <Frame>
      <ContextLine />
      <Copy muted>
        {isPersonal
          ? "Señales que te ayudan a revisar tus gastos."
          : "Resultados, escenarios y decisiones con evidencia."}
      </Copy>
      {!isPersonal && (
        <Select
          label="Ver análisis"
          value={view}
          onChange={setView}
          options={[
            { label: "Resultados y equilibrio", value: "results" },
            { label: "Indicadores originales", value: "indicators" },
            { label: "Proyección", value: "forecast" },
            { label: "Fugas y señales", value: "leaks" },
          ]}
        />
      )}
      {!isPersonal && view === "results" && (
        <>
          <View
            style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}
          >
            <Metric
              label="Resultado neto"
              value={money(p.netProfit)}
              caption={`Margen ${percent(p.margin)}`}
            />
            <Metric
              label="Ventas para cubrir costes"
              value={b.sales == null ? "Por completar" : money(b.sales)}
            />
          </View>
          <Card>
            <Title>Estado de resultados</Title>
            <Copy small muted>
              Gestión · base caja y clasificación declarada. Las aportaciones y
              préstamos se excluyen del resultado; la depreciación se separa de
              caja.
            </Copy>
            {[
              ["Ventas", p.revenue],
              ["− Coste de ventas", -p.cogs],
              ["Resultado bruto", p.grossProfit],
              ["− Gastos operativos", -p.opex],
              ["− Sin clasificar", -p.unclassified],
              ["EBITDA", p.ebitda],
              ["− Depreciación", -p.depreciation],
              ["EBIT", p.operatingProfit],
              ["+ Otros ingresos", p.otherIncome],
              ["− Intereses", -p.interest],
              ["− Impuestos", -p.tax],
              ["Resultado neto", p.netProfit],
            ].map(([label, value]) => (
              <Row
                key={String(label)}
                label={String(label)}
                value={money(Number(value))}
                bold={["EBITDA", "EBIT", "Resultado neto"].includes(
                  String(label),
                )}
              />
            ))}
          </Card>
          <Card>
            <Title>Tu punto de equilibrio</Title>
            <Row label="Costes fijos" value={money(b.fixed)} />
            <Row label="Costes variables" value={money(b.variable)} />
            <Row
              label="Margen de contribución"
              value={percent(
                b.contribution == null ? null : b.contribution * 100,
              )}
            />
            <Row
              label="Margen de seguridad"
              value={b.safety == null ? "N/D" : money(b.safety)}
            />
            <Copy muted small>
              Costes fijos ÷ (1 − costes variables / ventas).{" "}
              {b.reason ||
                "Mantiene constantes la estructura fija y la proporción variable."}
            </Copy>
            <Button
              title="Configurar saldo y precio medio"
              secondary
              onPress={() => router.push("/settings")}
            />
          </Card>
        </>
      )}
      {!isPersonal && view === "indicators" && (
        <>
          <Card>
            <Title>El razonamiento detrás de tus números.</Title>
            {[
              [
                "Margen bruto",
                a.current.grossMargin == null
                  ? "N/D"
                  : percent(a.current.grossMargin * 100),
              ],
              [
                "Margen neto",
                a.current.netMargin == null
                  ? "N/D"
                  : percent(a.current.netMargin * 100),
              ],
              [
                "Razón corriente",
                a.current.currentRatio == null
                  ? "N/D"
                  : a.current.currentRatio.toFixed(2),
              ],
              [
                "Capital de trabajo",
                a.current.workingCapital == null
                  ? "N/D"
                  : money(a.current.workingCapital),
              ],
              [
                "Autonomía de caja",
                a.current.runwayMonths === Infinity
                  ? "Sin consumo neto"
                  : a.current.runwayMonths == null
                    ? "N/D"
                    : `${a.current.runwayMonths} meses`,
              ],
            ].map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
            <Copy small muted>
              Indicadores del mes seleccionado. El balance pendiente se muestra
              como N/D. Autonomía = caja / consumo operativo de caja; sin
              consumo neto no garantiza liquidez futura.
            </Copy>
            <Button
              title="Completar mi balance"
              secondary
              onPress={() => router.push("/settings")}
            />
          </Card>
          <Card>
            <Title>Metas y controles</Title>
            {a.benchmarks
              .filter((r) => r.benchmark != null)
              .map((r) => (
                <Row
                  key={r.metric}
                  label="Meta de margen neto"
                  value={
                    r.company == null
                      ? "N/D"
                      : `${percent(r.company * 100)} / ${percent(r.benchmark == null ? null : r.benchmark * 100)}`
                  }
                />
              ))}
            {a.covenants.results.map((c) => (
              <Row
                key={c.id}
                label="Razón corriente mínima"
                value={
                  c.status === "passed"
                    ? "Cumple"
                    : c.status === "unknown"
                      ? "Dato pendiente"
                      : "Revisar límite"
                }
              />
            ))}
            <Copy muted small>
              {a.variance
                ? `Variación de ventas frente al presupuesto: ${money(a.variance.totalVariance)} en ${a.variance.months} mes(es).`
                : "Declara metas, balance y presupuesto en Configuración para activar estas comparaciones."}
            </Copy>
          </Card>
          <Card>
            <Title>Propuestas para tu revisión</Title>
            {a.actions.length ? (
              a.actions.map((action, index) => (
                <View key={index} style={{ gap: spacing.sm }}>
                  <Copy>
                    {
                      (
                        {
                          trigger_cash_sweep: "Revisar liquidez y reservas",
                          adjust_forecast_assumptions: "Revisar supuestos",
                          investigate_revenue_decline:
                            "Investigar la caída de ventas",
                          reallocate_budget: "Revisar presupuesto",
                          escalate_covenant_breach:
                            "Revisar límites financieros",
                        } as Record<string, string>
                      )[action.capability]
                    }
                  </Copy>
                  <Copy small muted>
                    Basada en los registros y parámetros de esta entidad. No
                    ejecuta operaciones.
                  </Copy>
                </View>
              ))
            ) : (
              <Copy muted>
                Sin propuestas activadas por las reglas y los datos disponibles.
              </Copy>
            )}
          </Card>
        </>
      )}
      {!isPersonal && view === "forecast" && (
        <>
          <Card>
            <Title>Próximos tres meses</Title>
            <Copy small muted>
              {a.continuousMonths} meses consecutivos. Tendencia y
              estacionalidad del motor original; intervalo aproximado del 95%.
              No se inventan meses ausentes.
            </Copy>
            {a.forecast.points.length ? (
              a.forecast.points.map((point) => (
                <View key={point.month}>
                  <Row label={point.month} value={money(point.value)} />
                  <Copy muted small>
                    {money(point.lower)} – {money(point.upper)}
                  </Copy>
                </View>
              ))
            ) : (
              <Copy muted>
                Añade al menos cinco meses consecutivos para proyectar.
              </Copy>
            )}
            <Copy muted small>
              {a.backtest?.available
                ? `Backtest: error absoluto medio ${a.backtest.mae===null?'N/D':money(a.backtest.mae)}; cobertura ${a.backtest.coverage ?? 'N/D'}%.`
                : "El backtest necesita ocho meses consecutivos. Un pronóstico no garantiza resultados."}
            </Copy>
          </Card>
          <Card>
            <Title>Resistencia de caja · aproximación mensual</Title>
            {a.stress ? (
              <>
                <Row
                  label="Caja inicial"
                  value={money(a.stress.startingCash)}
                />
                <Row
                  label="Caja mínima simulada"
                  value={money(a.stress.minCash)}
                />
                <Row
                  label="Caja final simulada"
                  value={money(a.stress.endingCash)}
                />
              </>
            ) : (
              <Copy muted>Configura el saldo del mes para simular.</Copy>
            )}
            <Copy small muted>
              Escenario base del motor original: mantiene ingresos y gastos del
              mes y una curva simplificada de cobro de cuatro semanas. No es un
              calendario de facturas ni contempla impagos.
            </Copy>
          </Card>
        </>
      )}
      {(isPersonal || view === "leaks") && (
        <>
          <Title>{leaks.length} señales para revisar</Title>
          {leaks.map((f, i) => (
            <Card key={i}>
              <Title>{f.title}</Title>
              <Copy>
                {f.category} · {f.amount===null?'N/D':money(f.amount)}
              </Copy>
              <Copy muted>{f.evidence}</Copy>
              <Copy muted small>
                {f.action}
              </Copy>
            </Card>
          ))}
          {!leaks.length && (
            <Card>
              <Copy muted>
                No hay señales con estas reglas. Registra movimientos y define
                un presupuesto para ampliar la revisión.
              </Copy>
            </Card>
          )}
          <Copy small muted>
            Las señales no demuestran pérdidas. Pueden solaparse y no se suman
            como ahorro garantizado.
          </Copy>
        </>
      )}
      <Button
        title="Copiar análisis con evidencia"
        secondary
        onPress={() => {
          void Clipboard.setStringAsync(
            JSON.stringify(
              {
                source: "https://github.com/Jajojovp/finflow",
                period: state.period,
                currency: dataset.currency,
                records: rows,
                analysis: a,
                parameters: dataset.analysis,
              },
              (key, value) => (value === Infinity ? "no-net-burn" : value),
              2,
            ),
          )
            .then((success) => {
              if (!success) throw new Error("No se pudo copiar.");
              setNotice(
                "Análisis copiado. Guárdalo solo donde decidas compartirlo.",
              );
            })
            .catch(() => setError("No se pudo copiar. Inténtalo de nuevo."));
        }}
      />
      <ErrorText message={error} />
      {!!notice && (
        <Copy muted small>
          {notice}
        </Copy>
      )}
    </Frame>
  );
}
export function Goals() {
  const { dataset, money } = useWorkspace(),
    [monthly, setMonthly] = useState("200"),
    [years, setYears] = useState("5"),
    [rate, setRate] = useState("3"),
    [fee, setFee] = useState("0.5"),
    [inflation, setInflation] = useState("2");
  const values = [monthly, years, rate, fee, inflation].map(Number),
    valid =
      values.every(Number.isFinite) &&
      values[0] >= 0 &&
      values[0] <= 1e9 &&
      values[1] >= 1 &&
      values[1] <= 40 &&
      values[2] >= -50 &&
      values[2] <= 50 &&
      values[3] >= 0 &&
      values[3] <= 20 &&
      values[4] >= -10 &&
      values[4] <= 50;
  const result = valid
    ? scenario(
        values[0],
        Math.round(values[1] * 12),
        ((1 + values[2] / 100) * (1 - values[3] / 100) - 1) * 100,
      )
    : null;
  return (
    <Frame>
      <Card tint>
        <Copy muted small>
          LO IMPORTANTE ES AVANZAR
        </Copy>
        <Title>{dataset.goal.name}</Title>
        <Copy>
          {money(dataset.goal.saved)} de {money(dataset.goal.target)}
        </Copy>
        <Button
          title="Editar mi objetivo"
          onPress={() => router.push("/goal")}
        />
        <Copy small muted>
          Dinero reservado declarado: no mueve ni verifica fondos.
        </Copy>
      </Card>
      <Card>
        <Title>Una posibilidad, con contexto.</Title>
        <Copy muted>
          Explora una aportación constante y revisa sus supuestos.
        </Copy>
        <Field
          label="Aportación mensual"
          value={monthly}
          onChange={setMonthly}
          keyboard="decimal-pad"
        />
        <Field
          label="Años"
          value={years}
          onChange={setYears}
          keyboard="number-pad"
        />
        <Field
          label="Tasa anual hipotética (%)"
          value={rate}
          onChange={setRate}
          keyboard="numbers-and-punctuation"
        />
        <Field
          label="Coste anual (%)"
          value={fee}
          onChange={setFee}
          keyboard="decimal-pad"
        />
        <Field
          label="Inflación anual (%)"
          value={inflation}
          onChange={setInflation}
          keyboard="numbers-and-punctuation"
        />
        {result ? (
          <>
            <Row label="Aportaciones" value={money(result.contributions)} />
            <Row
              label="Saldo nominal simulado"
              value={money(result.balance)}
              bold
            />
            <Row
              label="Valor real aproximado"
              value={money(
                result.balance / Math.pow(1 + values[4] / 100, values[1]),
              )}
            />
          </>
        ) : (
          <ErrorText message="Revisa los importes y los límites de los supuestos." />
        )}
        <Copy small muted>
          Saldo inicial cero, aportación al final de cada mes. Tasa neta anual =
          (1+tasa) × (1−coste) − 1; capitalización mensual. Tasas constantes e
          hipotéticas, sin impuestos. No predice ni garantiza rentabilidad.
        </Copy>
      </Card>
      <Button
        title="Aprender un concepto"
        secondary
        onPress={() => router.push("/learn")}
      />
    </Frame>
  );
}
export function More() {
  const { state, dataset, commit, update, saving } = useWorkspace(),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const run = (action: () => Promise<void>, message: string) => {
    setError("");
    void action()
      .then(() => setNotice(message))
      .catch((e) => setError(e.message));
  };
  return (
    <Frame>
      <AccountCard />
      <Card>
        <Copy muted small>
          {profileNames[state.profile].toUpperCase()}
        </Copy>
        <Title>{dataset.name}</Title>
        <Copy muted>Tu espacio, siempre abierto.</Copy>
        <Button
          title="Cambiar perfil"
          secondary
          onPress={() => router.push("/profile")}
        />
        {state.profile === "advisor" && (
          <>
            <Select
              label="Cliente"
              value={String(state.entity)}
              options={clientIndexes(state).map((i) => ({
                label:
                  state.datasets[`advisor-${i}`]?.name || `Cliente ${i + 1}`,
                value: String(i),
              }))}
              onChange={(v) =>
                run(
                  () => commit((s) => ({ ...s, entity: Number(v) })),
                  "Cliente seleccionado.",
                )
              }
            />
            <Button
              title="Agregar cliente"
              secondary
              disabled={saving}
              onPress={() =>
                run(() => commit(s => createAdvisorClient(s)), "Cliente creado.")
              }
            />
            <Button title="Archivar este cliente" secondary disabled={saving} onPress={() => run(() => commit(s => archiveAdvisorClient(s, s.entity, true)), "Cliente archivado. Sus datos se conservan.")} />
            {listClients(state).filter((c: { archived: boolean }) => c.archived).map((c: { index: number; name: string }) => <Button key={c.index} title={`Restaurar ${c.name}`} secondary disabled={saving} onPress={() => run(() => commit(s => archiveAdvisorClient(s, c.index, false)), "Cliente restaurado.")} />)}
          </>
        )}
        <Button
          title="Configurar mi espacio"
          secondary
          onPress={() => router.push("/settings")}
        />
        <Button title="Planificar recurrentes, deudas y patrimonio" secondary onPress={() => router.push('/planning')} />
      </Card>
      <Card>
        <Title>Tus datos, bajo tu control.</Title>
        <Copy muted small>
          La app guarda los datos en este dispositivo. La web y la app tienen
          almacenamientos separados; no hay sincronización automática.
        </Copy>
        <Button
          title="Importar o exportar datos"
          secondary
          onPress={() => router.push("/import")}
        />
        <Button
          title="Usar mis datos"
          secondary
          disabled={saving}
          onPress={() =>
            run(
              () => update(ownData),
              "Se retiraron solo los ejemplos; tus movimientos se conservaron.",
            )
          }
        />
        <Copy muted small>
          Usar mis datos retira los ejemplos, los deja recuperables y pone a
          cero el importe reservado del objetivo.
        </Copy>
        <Button
          title="Cargar ejemplos en un espacio vacío"
          secondary
          disabled={saving}
          onPress={() =>
            run(
              () =>
                update((d) =>
                  appendDemo(d, state.profile, state.period, state.entity),
                ),
              "Ejemplos cargados.",
            )
          }
        />
        {dataset.trash.length > 0 && (
          <Button
            title="Restaurar último movimiento archivado"
            secondary
            disabled={saving}
            onPress={() =>
              run(() => update(restoreTransaction), "Movimiento restaurado.")
            }
          />
        )}
      </Card>
      <Card>
        <Title>Lo que aprendes te acompaña.</Title>
        <Copy muted>{dataset.lessons.length} de 5 lecciones completadas.</Copy>
        <Button
          title="Continuar aprendiendo"
          onPress={() => router.push("/learn")}
        />
      </Card>
      <Card>
        <Title>FinFlow es abierto.</Title>
        <Copy muted>
          Tu proyecto original aporta las fórmulas, reglas y metodología. Los
          datos faltantes se muestran como N/D.
        </Copy>
        <Button
          title="Ver el proyecto original"
          secondary
          onPress={() => {
            void Linking.openURL("https://github.com/Jajojovp/finflow").catch(
              () => setError("No se pudo abrir el enlace."),
            );
          }}
        />
        <Button
          title="Abrir FinFlow en la web"
          secondary
          onPress={() => {
            void Linking.openURL("https://finflow.sysora.io/").catch(() =>
              setError("No se pudo abrir la web."),
            );
          }}
        />
      </Card>
      <ErrorText message={error} />
      {!!notice && <Copy muted>{notice}</Copy>}
    </Frame>
  );
}
