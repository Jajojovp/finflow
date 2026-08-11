import { describe, it, expect } from 'vitest';
import KPICalculator from './KPICalculator';
import { MONTHLY_FINANCIALS } from '../../data/datasets';

const snapshot = KPICalculator.fromMonthly(MONTHLY_FINANCIALS);
const totalExpenses = MONTHLY_FINANCIALS.reduce((acc, m) => acc + m.expenses, 0);
const last = MONTHLY_FINANCIALS[MONTHLY_FINANCIALS.length - 1];
const prev = MONTHLY_FINANCIALS[MONTHLY_FINANCIALS.length - 2];

describe('KPICalculator.fromMonthly — Income Statement (V3, datos reales)', () => {
  it('totalRevenue === suma de revenues = 7.284.000', () => {
    const expected = MONTHLY_FINANCIALS.reduce((acc, m) => acc + m.revenue, 0);
    expect(expected).toBe(7284000);
    expect(snapshot.totalRevenue).toBe(7284000);
  });

  it('grossProfit === totalRevenue - totalCogs = 4.516.080 (no 0.7×revenue)', () => {
    const totalCogs = MONTHLY_FINANCIALS.reduce((acc, m) => acc + m.cogs, 0);
    expect(totalCogs).toBe(2767920);
    expect(snapshot.grossProfit).toBe(7284000 - 2767920);
    expect(snapshot.grossProfit).toBe(4516080);
  });

  it('grossMargin ≈ 0.62 (±0.01)', () => {
    expect(4516080 / 7284000).toBeCloseTo(0.62, 4);
    expect(snapshot.grossMargin).toBeCloseTo(0.62, 2);
  });

  it('netIncome === totalRevenue - totalExpenses = 2.401.000', () => {
    expect(totalExpenses).toBe(4883000);
    expect(snapshot.netIncome).toBe(7284000 - 4883000);
    expect(snapshot.netIncome).toBe(2401000);
  });
});

describe('KPICalculator.fromMonthly — Balance (último mes 2025-12)', () => {
  it('currentRatio ≈ 19.99 = (cash+ar+inventory)/(ap+shortDebt)', () => {
    const currentAssets = last.cash + last.ar + last.inventory;
    const currentLiabilities = last.ap + last.shortDebt;
    expect(currentAssets).toBe(4567000);
    expect(currentLiabilities).toBe(228500);
    expect(currentAssets / currentLiabilities).toBeCloseTo(19.99, 2);
    expect(snapshot.currentRatio).toBeCloseTo(19.99, 2);
  });

  it('debtToEquity ≈ 0.18 = (currentLiabilities + longDebt)/equity', () => {
    const currentLiabilities = last.ap + last.shortDebt;
    const expected = (currentLiabilities + last.longDebt) / last.equity;
    expect(expected).toBeCloseTo(0.1816, 3);
    expect(snapshot.debtToEquity).toBeCloseTo(0.18, 2);
  });

  it('dso = (ar/revenue)×30 = 36 (±1) y dpo = (ap/expenses)×30 = 9 (±1)', () => {
    expect((last.ar / last.revenue) * 30).toBe(36);
    expect((last.ap / last.expenses) * 30).toBe(9);
    expect(snapshot.dso).toBeCloseTo(36, 0);
    expect(snapshot.dpo).toBeCloseTo(9, 0);
  });
});

describe('KPICalculator.fromMonthly — Growth / runway', () => {
  it('revenueGrowth ≈ pctChange(nov.revenue, dic.revenue) ≈ 0.0724 (±0.0005)', () => {
    const expected = (last.revenue - prev.revenue) / Math.abs(prev.revenue);
    expect(expected).toBeCloseTo(0.0724, 4);
    expect(snapshot.revenueGrowth).toBeCloseTo(0.0724, 4);
  });

  it('marginDelta en pp ≠ 0 y > 0 (utilidades crecientes)', () => {
    expect(snapshot.marginDelta).toBeDefined();
    expect(snapshot.marginDelta).not.toBe(0);
    expect(snapshot.marginDelta).toBeGreaterThan(0);
    const netMarginLast = (last.revenue - last.expenses) / last.revenue;
    const netMarginPrev = (prev.revenue - prev.expenses) / prev.revenue;
    expect(snapshot.marginDelta).toBeCloseTo((netMarginLast - netMarginPrev) * 100, 3);
  });

  it('runwayMonths finito > 10 (burn promedio 6 meses, caja última)', () => {
    expect(Number.isFinite(snapshot.runwayMonths)).toBe(true);
    expect(snapshot.runwayMonths).toBeGreaterThan(10);
    const burn = MONTHLY_FINANCIALS.slice(-6).map((m) => m.expenses - m.revenue);
    const monthlyBurn = burn.reduce((a, b) => a + b, 0) / burn.length;
    expect(monthlyBurn).toBe(-251500);
    expect(snapshot.runwayMonths).toBeCloseTo(14.1, 1);
  });
});

describe('KPICalculator.fromMonthly — Casos límite', () => {
  it('serie vacía → campos neutrales sin throw', () => {
    const empty = KPICalculator.fromMonthly([]);
    expect(empty.totalRevenue).toBe(0);
    expect(empty.netIncome).toBe(0);
    expect(empty.revenueGrowth).toBeNull();
    expect(empty.grossMargin).toBeNull();
    expect(empty.runwayMonths).toBeNull();
    expect(empty.periodStart).toBeNull();
  });

  it('fixture local con revenue 0 en mes previo → revenueGrowth null (no 0, no throw)', () => {
    const series = [
      { month: '2025-01', revenue: 0, expenses: 100, cash: 1000 },
      { month: '2025-02', revenue: 500, expenses: 100, cash: 1500 },
    ];
    const result = KPICalculator.fromMonthly(series);
    expect(result.revenueGrowth).toBeNull();
    expect(result.totalRevenue).toBe(500);
  });
});

describe('KPICalculator.fromMonthly — null-safety (D2 fail-closed)', () => {
  it('revenue presente pero cogs ausente → grossProfit null y grossMargin null (no 0, no throw)', () => {
    const series = [
      { month: '2025-01', revenue: 100000, expenses: 60000, cash: 500000 },
    ];
    const result = KPICalculator.fromMonthly(series);
    expect(result.grossProfit).toBeNull();
    expect(result.grossMargin).toBeNull();
    expect(result.totalRevenue).toBe(100000);
  });

  it('ap + shortDebt = 0 → currentRatio null (no Infinity, no 0, no throw)', () => {
    const series = [
      { month: '2025-01', revenue: 100000, expenses: 60000, cash: 500000, ar: 10000, inventory: 1000, ap: 0, shortDebt: 0 },
    ];
    const result = KPICalculator.fromMonthly(series);
    expect(Number.isFinite(result.currentRatio)).toBe(false);
    expect(result.currentRatio).toBeNull();
    expect(result.currentLiabilities).toBe(0);
  });
});
