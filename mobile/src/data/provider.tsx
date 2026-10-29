import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { analyzeWorkspace } from "../../../src/services/financial/WorkspaceAnalysis";
import {
  cashPosition,
  incomeStatement,
  breakEven,
  detectLeaks,
} from "../../../src/workspace/finance.mjs";
import { money } from "../../../src/workspace/core.mjs";
import { storage } from "./storage";
import {
  decodeBackup,
  encodeBackup,
  emptySettings,
  getWorkspace,
  initialState,
  updateWorkspace,
  type Snapshot,
  type Workspace,
} from "./model";

type Store = {
  state: Snapshot;
  ready: boolean;
  saving: boolean;
  error: string;
  retry: () => void;
  commit: (change: (s: Snapshot) => Snapshot) => Promise<void>;
  update: (change: (d: Workspace) => Workspace) => Promise<void>;
};
const Context = createContext<Store | null>(null);

export function FinflowProvider({ children, storageKey = 'finflow-mobile-v1' }: { children: React.ReactNode; storageKey?: string }) {
  const [state, setState] = useState(initialState),
    [ready, setReady] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const current = useRef(state),
    locked = useRef(false);
  const load = useCallback(async () => {
    setError("");
    setReady(false);
    try {
      const saved = await storage.read(storageKey);
      const next = saved ? decodeBackup(saved) : initialState();
      current.current = next;
      setState(next);
      setReady(true);
    } catch {
      setError(
        "No pudimos abrir tus datos. Puedes reintentar; el archivo guardado se conserva.",
      );
    }
  }, [storageKey]);
  useEffect(() => {
    void load();
  }, [load]);
  const commit = useCallback(async (change: (s: Snapshot) => Snapshot) => {
    if (locked.current)
      throw new Error("Espera a que termine el guardado actual.");
    locked.current = true;
    setSaving(true);
    try {
      const next = change(current.current);
      await storage.write(encodeBackup(next), storageKey);
      current.current = next;
      setState(next);
    } catch (e) {
      throw new Error(
        e instanceof Error
          ? e.message
          : "No se pudo guardar. Tu formulario se conserva para reintentar.",
      );
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }, [storageKey]);
  const update = useCallback(
    (change: (d: Workspace) => Workspace) =>
      commit((s) => updateWorkspace(s, change)),
    [commit],
  );
  return (
    <Context
      value={{
        state,
        ready,
        saving,
        error,
        retry: () => {
          void load();
        },
        commit,
        update,
      }}
    >
      {children}
    </Context>
  );
}
export function useFinflow() {
  const value = use(Context);
  if (!value) throw new Error("FinFlow necesita su proveedor de datos.");
  return value;
}
export function useWorkspace() {
  const store = useFinflow(),
    { state } = store;
  const dataset = useMemo(() => getWorkspace(state), [state]);
  const rows = useMemo(
    () => dataset.rows.filter((r) => r.date.startsWith(state.period)),
    [dataset, state.period],
  );
  const settings = dataset.finance[state.period] || emptySettings();
  const previous = useMemo(() => {
    const d = new Date(`${state.period}-01T00:00:00Z`);
    d.setUTCMonth(d.getUTCMonth() - 1);
    return dataset.rows.filter((r) =>
      r.date.startsWith(d.toISOString().slice(0, 7)),
    );
  }, [dataset, state.period]);
  const analysis = useMemo(
    () => analyzeWorkspace(dataset, state.period),
    [dataset, state.period],
  );
  return {
    ...store,
    dataset,
    rows,
    settings,
    analysis,
    cash: cashPosition(rows, settings.opening),
    statement: incomeStatement(rows),
    equilibrium: breakEven(rows, settings.unitPrice),
    leaks: detectLeaks(rows, previous, {
      ...dataset.budgets,
      __total: settings.expenseBudget,
    }),
    money: (n: number) => money(n, dataset.currency),
  };
}
