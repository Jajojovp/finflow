import { parseCSV, validateTransaction } from "../../../src/workspace/core.mjs";
import { CURRENCIES, isCurrencyCode } from "../../../src/workspace/currencies.mjs";

export type Profile = "personal" | "business" | "advisor";
export type Currency = (typeof CURRENCIES)[number]["code"];
export type Transaction = {
  id: string;
  date: string;
  description: string;
  category: string;
  type: "ingreso" | "gasto";
  amount: number;
  financialType: string;
  behavior?: string;
  source: string;
};
export type MonthSettings = {
  opening: number;
  savingsTarget: number;
  expenseBudget: number;
  unitPrice: number;
};
export type Workspace = {
  name: string;
  currency: Currency;
  rows: Transaction[];
  trash: Transaction[];
  goal: { name: string; target: number; saved: number };
  lessons: number[];
  finance: Record<string, MonthSettings>;
  budgets: Record<string, number>;
  analysis: {
    balances?: Record<string, Record<string, number | null>>;
    targets?: Record<string, number | null>;
    limits?: Record<string, number | null>;
    revenueBudgets?: Record<string, number | null>;
    decisions?: Record<string, unknown>;
  };
};
export type Snapshot = {
  version: 1;
  onboarded: boolean;
  profile: Profile;
  entity: number;
  period: string;
  datasets: Record<string, Workspace>;
};
export const profileNames = {
  personal: "Personal",
  business: "Empresa",
  advisor: "Asesor / profesional",
};
export const currencies: Currency[] = CURRENCIES.map(entry => entry.code);
export const financialNames: Record<string, string> = {
  revenue: "Ventas / ingresos",
  other_income: "Otros ingresos",
  capital: "Capital / préstamo / activo",
  opex: "Gasto operativo",
  cogs: "Coste de ventas",
  depreciation: "Depreciación / amortización",
  interest: "Intereses",
  tax: "Impuestos sobre resultados",
  unclassified: "Sin clasificar",
};
export const emptySettings = (): MonthSettings => ({
  opening: 0,
  savingsTarget: 20,
  expenseBudget: 0,
  unitPrice: 0,
});
const validMonth = (s: unknown): s is string =>
  typeof s === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
const amount = (n: unknown) =>
  typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 1e12;

export function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
export function initialState(period = currentMonth()): Snapshot {
  return {
    version: 1,
    onboarded: false,
    profile: "personal",
    entity: 0,
    period,
    datasets: {},
  };
}
export function workspaceKey(s: Pick<Snapshot, "profile" | "entity">) {
  return s.profile === "advisor" ? `advisor-${s.entity}` : s.profile;
}
export function clientIndexes(s: Snapshot) {
  return [
    ...new Set([
      0,
      1,
      2,
      s.entity,
      ...Object.keys(s.datasets)
        .filter((k) => /^advisor-\d+$/.test(k))
        .map((k) => Number(k.slice(8))),
    ]),
  ].sort((a, b) => a - b);
}
export function createAdvisorClient(s: Snapshot): Snapshot {
  if (s.profile !== "advisor")
    throw new Error("Selecciona el perfil asesor para crear un cliente.");
  const entity = Math.max(...clientIndexes(s)) + 1;
  if (entity > 99)
    throw new Error("Este espacio local admite hasta 100 clientes.");
  return {
    ...s,
    entity,
    datasets: {
      ...s.datasets,
      [`advisor-${entity}`]: emptyWorkspace("advisor", s.period, entity),
    },
  };
}
export function emptyWorkspace(
  profile: Profile,
  period: string,
  entity = 0,
): Workspace {
  return {
    name:
      profile === "personal"
        ? "Mi espacio personal"
        : profile === "business"
          ? "Mi empresa"
          : `Cliente ${entity + 1}`,
    currency: "EUR",
    rows: [],
    trash: [],
    goal: {
      name:
        profile === "personal"
          ? "Mi fondo de tranquilidad"
          : "Reserva operativa",
      target: profile === "personal" ? 5000 : 50000,
      saved: 0,
    },
    lessons: [],
    finance: { [period]: emptySettings() },
    budgets: {},
    analysis: {},
  };
}
export function getWorkspace(s: Snapshot): Workspace {
  return (
    s.datasets[workspaceKey(s)] || emptyWorkspace(s.profile, s.period, s.entity)
  );
}
export function updateWorkspace(
  s: Snapshot,
  change: (d: Workspace) => Workspace,
): Snapshot {
  const next = change(JSON.parse(JSON.stringify(getWorkspace(s))) as Workspace);
  if (next.rows.length > 5000)
    throw new Error(
      "El espacio admite hasta 5.000 movimientos. Exporta un respaldo antes de ampliar el historial.",
    );
  return { ...s, datasets: { ...s.datasets, [workspaceKey(s)]: next } };
}
export function makeTransaction(
  input: Record<string, unknown>,
  id: string,
): Transaction {
  const row = validateTransaction(input);
  const allowed =
    row.type === "ingreso"
      ? ["revenue", "other_income", "capital"]
      : [
          "opex",
          "cogs",
          "depreciation",
          "interest",
          "tax",
          "capital",
          "unclassified",
        ];
  const financialType = String(
    input.financialType ||
      (row.type === "ingreso" ? "revenue" : "unclassified"),
  );
  if (!allowed.includes(financialType))
    throw new Error("La clasificación no corresponde al tipo de movimiento.");
  const behavior = ["fixed", "variable"].includes(String(input.behavior))
    ? String(input.behavior)
    : "";
  return {
    ...row,
    id,
    financialType,
    behavior,
    source:
      typeof input.source === "string" ? input.source.slice(0, 40) : "Manual",
  } as Transaction;
}
export function demoWorkspace(
  profile: Profile,
  period: string,
  entity = 0,
): Workspace {
  const d = emptyWorkspace(profile, period, entity),
    business = profile !== "personal";
  d.name =
    profile === "personal"
      ? "Mi espacio personal"
      : profile === "business"
        ? "Estudio Norte"
        : `Cliente ${entity + 1}`;
  const income = business ? 52000 : 4200,
    expenses = business
      ? [17000, 8500, 2700, 1200, 5300, 3700]
      : [1100, 450, 180, 129, 621, 480];
  const categories = business
    ? [
        "Equipo",
        "Proveedores",
        "Servicios",
        "Suscripciones",
        "Marketing",
        "Operaciones",
      ]
    : [
        "Vivienda",
        "Compra",
        "Servicios",
        "Suscripciones",
        "Ocio",
        "Transporte",
      ];
  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(`${period}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - offset);
    const month = date.toISOString().slice(0, 7),
      factor = 1 - offset * 0.035;
    d.rows.push(
      makeTransaction(
        {
          date: month + "-01",
          description: business
            ? "Ingresos por servicios"
            : "Nómina y proyectos",
          category: business ? "Ventas" : "Trabajo",
          type: "ingreso",
          amount: Math.round(income * factor),
          financialType: "revenue",
          source: "Datos de ejemplo",
        },
        `demo-${profile}-${entity}-${month}-income`,
      ),
    );
    expenses.forEach((value, i) =>
      d.rows.push(
        makeTransaction(
          {
            date: `${month}-${String([2, 5, 10, 15, 20, 24][i]).padStart(2, "0")}`,
            description: categories[i],
            category: categories[i],
            type: "gasto",
            amount: Math.round(value * factor * 100) / 100,
            financialType: business && i === 1 ? "cogs" : "opex",
            behavior: [1, 4, 5].includes(i) ? "variable" : "fixed",
            source: "Datos de ejemplo",
          },
          `demo-${profile}-${entity}-${month}-${i}`,
        ),
      ),
    );
  }
  d.goal.saved = business ? 27000 : 2600;
  d.finance[period].unitPrice = business ? 50 : 0;
  return d;
}
export function archiveTransaction(d: Workspace, id: string): Workspace {
  const row = d.rows.find((r) => r.id === id);
  return row
    ? {
        ...d,
        rows: d.rows.filter((r) => r.id !== id),
        trash: [...d.trash, row],
      }
    : d;
}
export function restoreTransaction(d: Workspace): Workspace {
  const last = d.trash.at(-1);
  return last
    ? {
        ...d,
        rows: d.rows.some((r) => r.id === last.id) ? d.rows : [...d.rows, last],
        trash: d.trash.slice(0, -1),
      }
    : d;
}
export function ownData(d: Workspace): Workspace {
  return {
    ...d,
    rows: d.rows.filter((r) => r.source !== "Datos de ejemplo"),
    trash: [
      ...d.trash,
      ...d.rows.filter((r) => r.source === "Datos de ejemplo"),
    ],
    goal: { ...d.goal, saved: 0 },
  };
}
export function appendDemo(
  d: Workspace,
  profile: Profile,
  period: string,
  entity: number,
): Workspace {
  if (d.rows.length)
    throw new Error(
      "El espacio debe estar vacío para cargar ejemplos. Puedes cambiar de perfil o cliente.",
    );
  const identifiers = new Set(d.trash.map((r) => r.id));
  const rows = demoWorkspace(profile, period, entity).rows.map((r) => {
    let id = r.id,
      suffix = 1;
    while (identifiers.has(id)) id = `${r.id}-${suffix++}`;
    identifiers.add(id);
    return { ...r, id };
  });
  return { ...d, rows };
}
export function importRows(d: Workspace, csv: string): Workspace {
  if (csv.length > 2 * 1024 * 1024)
    throw new Error("El CSV debe ocupar menos de 2 MB.");
  const parsed = parseCSV(csv),
    fingerprint = (
      r: Pick<
        Transaction,
        "date" | "description" | "category" | "type" | "amount"
      >,
    ) => JSON.stringify([r.date, r.description, r.category, r.type, r.amount]);
  const seen = new Set(d.rows.map(fingerprint)),
    fresh: Transaction[] = [];
  const identifiers = new Set([...d.rows, ...d.trash].map((r) => r.id));
  parsed.forEach((r: Record<string, unknown>, i: number) => {
    const base = `csv-${Date.now()}-${i}`;
    let id = base,
      suffix = 1;
    while (identifiers.has(id)) id = `${base}-${suffix++}`;
    const row = makeTransaction({ ...r, source: "CSV" }, id);
    const key = fingerprint(row);
    if (!seen.has(key)) {
      seen.add(key);
      identifiers.add(id);
      fresh.push(row);
    }
  });
  if (d.rows.length + fresh.length > 5000)
    throw new Error("El espacio admite hasta 5.000 movimientos.");
  return { ...d, rows: [...d.rows, ...fresh] };
}
export function encodeBackup(s: Snapshot) {
  for (const d of Object.values(s.datasets)) {
    if (d.rows.length > 5000 || d.trash.length > 5000)
      throw new Error(
        "El espacio admite hasta 5.000 movimientos activos y 5.000 archivados. No se ha modificado el guardado anterior.",
      );
  }
  const encoded = JSON.stringify(
    {
      format: "finflow-mobile-v1",
      exportedAt: new Date().toISOString(),
      state: s,
    },
    null,
    2,
  );
  if (encoded.length > 4 * 1024 * 1024)
    throw new Error(
      "El espacio local supera el límite de respaldo de 4 MB. Exporta y divide tu historial antes de añadir más datos.",
    );
  return encoded;
}
export function decodeBackup(raw: string): Snapshot {
  if (raw.length > 4 * 1024 * 1024)
    throw new Error("El respaldo debe ocupar menos de 4 MB.");
  const parsed = JSON.parse(raw),
    s = parsed?.state;
  if (
    parsed.format !== "finflow-mobile-v1" ||
    s?.version !== 1 ||
    !["personal", "business", "advisor"].includes(s?.profile) ||
    !validMonth(s?.period) ||
    !Number.isInteger(s?.entity) ||
    s.entity < 0 ||
    s.entity > 99 ||
    !s.datasets ||
    typeof s.datasets !== "object"
  )
    throw new Error("El respaldo no tiene el formato de FinFlow móvil.");
  const datasets: Record<string, Workspace> = {};
  for (const [key, value] of Object.entries(s.datasets)) {
    if (!/^(personal|business|advisor-(\d|[1-9]\d))$/.test(key))
      throw new Error("El respaldo contiene un espacio desconocido.");
    const d = value as Workspace;
    if (
      !d ||
      typeof d.name !== "string" ||
      d.name.length > 80 ||
      !isCurrencyCode(d.currency) ||
      !Array.isArray(d.rows) ||
      d.rows.length > 5000 ||
      !Array.isArray(d.trash) ||
      d.trash.length > 5000 ||
      !d.goal ||
      !amount(d.goal.target) ||
      d.goal.target <= 0 ||
      !amount(d.goal.saved) ||
      typeof d.goal.name !== "string" ||
      d.goal.name.length > 80
    )
      throw new Error(
        "Revisa los movimientos, moneda y objetivos del respaldo.",
      );
    const finance: Record<string, MonthSettings> = {};
    for (const [month, v] of Object.entries(d.finance || {})) {
      if (
        !validMonth(month) ||
        !v ||
        !Number.isFinite(v.opening) ||
        Math.abs(v.opening) > 1e12 ||
        !amount(v.expenseBudget) ||
        !amount(v.unitPrice) ||
        !Number.isFinite(v.savingsTarget) ||
        v.savingsTarget < 0 ||
        v.savingsTarget > 100
      )
        throw new Error("Hay parámetros mensuales inválidos en el respaldo.");
      finance[month] = {
        opening: v.opening,
        savingsTarget: v.savingsTarget,
        expenseBudget: v.expenseBudget,
        unitPrice: v.unitPrice,
      };
    }
    const ids = new Set<string>();
    const rows = d.rows.map((r, i) => {
      const id =
        typeof r.id === "string" && r.id.length <= 100 ? r.id : `import-${i}`;
      if (ids.has(id))
        throw new Error("El respaldo contiene identificadores repetidos.");
      ids.add(id);
      return makeTransaction(r, id);
    });
    datasets[key] = {
      ...d,
      name: d.name.trim(),
      rows,
      trash: d.trash.map((r, i) =>
        makeTransaction(r, typeof r.id === "string" ? r.id : `trash-${i}`),
      ),
      finance,
      lessons: Array.isArray(d.lessons)
        ? d.lessons.filter((i) => Number.isInteger(i) && i >= 0 && i < 5)
        : [],
      budgets: d.budgets || {},
      analysis: d.analysis && typeof d.analysis === "object" ? d.analysis : {},
    };
  }
  return {
    version: 1,
    onboarded: !!s.onboarded,
    profile: s.profile,
    entity: s.entity,
    period: s.period,
    datasets,
  };
}
