import { describe, it, expect, vi } from "vitest";
import {
  initialState,
  workspaceKey,
  getWorkspace,
  demoWorkspace,
  updateWorkspace,
  makeTransaction,
  archiveTransaction,
  restoreTransaction,
  importRows,
  decodeBackup,
  encodeBackup,
  createAdvisorClient,
  appendDemo,
} from "./model";
import {
  cashPosition,
  incomeStatement,
  breakEven,
} from "../../../src/workspace/finance.mjs";
import { analyzeWorkspace } from "../../../src/services/financial/WorkspaceAnalysis";

describe("FinFlow mobile shared financial data", () => {
  it("rejects saving an archive that exceeds the reload limit", () => {
    const s = initialState("2026-10");
    const d = getWorkspace(s);
    d.trash = Array.from({ length: 5001 }, (_, i) =>
      makeTransaction(
        {
          date: "2026-10-01",
          description: "Archive",
          category: "Work",
          type: "ingreso",
          amount: 1,
        },
        `old-${i}`,
      ),
    );
    expect(() => encodeBackup(updateWorkspace(s, () => d))).toThrow();
  });
  it("can restore an edited example after reloading fresh examples", () => {
    const d = demoWorkspace("personal", "2026-10");
    const archived = { ...d.rows[0], description: "My edited example" };
    const fresh = appendDemo(
      { ...d, rows: [], trash: [archived] },
      "personal",
      "2026-10",
      0,
    );
    expect(
      restoreTransaction(fresh).rows.some(
        (r) => r.description === archived.description,
      ),
    ).toBe(true);
  });
  it("keeps IDs unique when two CSV imports share the same timestamp", () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(100);
    try {
      const d = getWorkspace(initialState("2026-10"));
      const a = importRows(
        d,
        "fecha,descripcion,categoria,tipo,importe\n2026-10-01,First,Trabajo,ingreso,10",
      );
      const b = importRows(
        a,
        "fecha,descripcion,categoria,tipo,importe\n2026-10-02,Second,Trabajo,ingreso,20",
      );
      expect(new Set(b.rows.map((r) => r.id)).size).toBe(2);
      expect(
        decodeBackup(
          encodeBackup(updateWorkspace(initialState("2026-10"), () => b)),
        ).datasets.personal.rows,
      ).toHaveLength(2);
    } finally {
      clock.mockRestore();
    }
  });
  it("preserves archived user records and settings when loading examples", () => {
    let d = getWorkspace(initialState("2026-10"));
    d = {
      ...d,
      name: "My client",
      trash: [
        makeTransaction(
          {
            date: "2026-10-01",
            description: "Archived",
            category: "Work",
            type: "ingreso",
            amount: 10,
          },
          "original",
        ),
      ],
    };
    const demo = appendDemo(d, "personal", "2026-10", 0);
    expect(demo.name).toBe("My client");
    expect(demo.trash).toHaveLength(1);
    expect(restoreTransaction(demo).rows.some((r) => r.id === "original")).toBe(
      true,
    );
  });
  it("rejects a snapshot that could not be opened again after saving", () => {
    const state = updateWorkspace(initialState("2026-10"), (d) => ({
      ...d,
      analysis: { decisions: { oversized: "x".repeat(4 * 1024 * 1024) } },
    }));
    expect(() => encodeBackup(state)).toThrow();
  });
  it("creates an advisor client without overwriting the existing spaces", () => {
    const s = { ...initialState("2026-10"), profile: "advisor" as const };
    const next = createAdvisorClient(s);
    expect(next.entity).toBe(3);
    expect(getWorkspace(next).name).toBe("Cliente 4");
    expect(s.datasets).toEqual({});
    expect(decodeBackup(encodeBackup(next)).entity).toBe(3);
  });
  it("separates all three profiles and advisor entities", () => {
    let s = initialState("2026-10");
    s = updateWorkspace(s, (d) => ({ ...d, name: "Personal only" }));
    expect(getWorkspace({ ...s, profile: "business" }).name).not.toBe(
      "Personal only",
    );
    expect(workspaceKey({ ...s, profile: "advisor", entity: 0 })).not.toBe(
      workspaceKey({ ...s, profile: "advisor", entity: 1 }),
    );
  });
  it("feeds entered records into the original engine without duplicating formulas", () => {
    let s = { ...initialState("2026-10"), profile: "business" as const };
    s = updateWorkspace(s, (d) => ({
      ...d,
      rows: [
        makeTransaction(
          {
            date: "2026-10-01",
            description: "Sales",
            category: "Ventas",
            type: "ingreso",
            amount: 10000,
            financialType: "revenue",
          },
          "a",
        ),
        makeTransaction(
          {
            date: "2026-10-02",
            description: "Direct cost",
            category: "Proveedores",
            type: "gasto",
            amount: 4000,
            financialType: "cogs",
            behavior: "variable",
          },
          "b",
        ),
        makeTransaction(
          {
            date: "2026-10-03",
            description: "Rent",
            category: "Alquiler",
            type: "gasto",
            amount: 3000,
            financialType: "opex",
            behavior: "fixed",
          },
          "c",
        ),
      ],
    }));
    const d = getWorkspace(s);
    expect(cashPosition(d.rows, 2000).available).toBe(5000);
    expect(incomeStatement(d.rows).netProfit).toBe(3000);
    expect(breakEven(d.rows, 50).sales).toBe(5000);
    expect(analyzeWorkspace(d, s.period).current.netMargin).toBe(0.3);
  });
  it("rejects invalid dates, negative amounts and incompatible classifications", () => {
    const input = {
      date: "2026-02-30",
      description: "Test",
      category: "Test",
      type: "gasto",
      amount: 10,
    };
    expect(() => makeTransaction(input, "a")).toThrow();
    expect(() =>
      makeTransaction({ ...input, date: "2026-10-01", amount: -1 }, "a"),
    ).toThrow();
    expect(() =>
      makeTransaction(
        { ...input, date: "2026-10-01", financialType: "revenue" },
        "a",
      ),
    ).toThrow();
  });
  it("archives and restores a row and preserves the rest of the workspace", () => {
    const d = demoWorkspace("business", "2026-10", 0),
      row = d.rows[0];
    const archived = archiveTransaction(d, row.id);
    expect(archived.rows).toHaveLength(d.rows.length - 1);
    expect(archived.trash).toHaveLength(1);
    expect(restoreTransaction(archived).rows).toContainEqual(row);
  });
  it("imports CSV atomically, deduplicates exact records and rejects corrupt backups", () => {
    const d = getWorkspace(initialState("2026-10"));
    const csv =
      "fecha,descripcion,categoria,tipo,importe\n2026-10-01,Salary,Trabajo,ingreso,1000";
    const once = importRows(d, csv);
    expect(once.rows).toHaveLength(1);
    expect(importRows(once, csv).rows).toHaveLength(1);
    expect(() =>
      importRows(d, csv + "\n2026-10-02,Bad,Test,gasto,-3"),
    ).toThrow();
    const s = updateWorkspace(initialState("2026-10"), () => once);
    expect(decodeBackup(encodeBackup(s)).datasets.personal.rows).toHaveLength(
      1,
    );
    expect(() =>
      decodeBackup('{"format":"finflow-mobile-v1","state":{"datasets":{}}}'),
    ).toThrow();
  });
});
