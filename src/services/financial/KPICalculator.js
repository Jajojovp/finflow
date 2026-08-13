/**
 * KPICalculator — deterministic financial engine (FASE 0).
 * Derives headline KPIs from a monthly financial series using the V3 formulas
 * defined in `docs/superpowers/specs/finflow-v3-architecture.spec.md` §7.1
 * (Income Statement) and §7.4 (cash/risk ratios), with the balance-sheet
 * section per §7.2.
 *
 * Null propagation (spec §2 D2 fail-closed): missing data yields `null`,
 * never an invented 0 or a placeholder multiplier. Ratios depend on their
 * components: any null component propagates.
 *
 * Returns plain objects so results are easy to test and serialize.
 */

import MathUtils from '../core/MathUtils';

/** Returns `value` when it is a finite number, otherwise `null`. */
const fin = (value) => (Number.isFinite(value) ? value : null);

/** Sums values, returning `null` when any component is not a number. */
const sumOrNull = (values) => {
  if (values.some((v) => v == null)) return null;
  return values.reduce((acc, v) => acc + v, 0);
};

/** Returns `a - b`, or `null` when either side is not calculable. */
const subOrNull = (a, b) => (a != null && b != null ? a - b : null);

/** Safe division delegating to MathUtils.safeDivide; null if not calculable. */
const divide = (num, den) => (num != null && den != null ? MathUtils.safeDivide(num, den) : null);

/** Neutral snapshot returned for an empty or undefined series. */
function emptySnapshot() {
  return {
    // §7.1 Income Statement
    totalRevenue: 0,
    totalExpenses: 0,
    netIncome: 0,
    totalCogs: null,
    grossProfit: null,
    grossMargin: null,
    totalOpex: 0,
    totalDaa: 0,
    ebit: null,
    operatingMargin: null,
    ebitda: null,
    totalInterest: 0,
    totalTax: 0,
    netMargin: null,
    revenueGrowth: null,
    marginDelta: null,
    // §7.4 Cash / risk
    cashPosition: 0,
    monthlyBurn: 0,
    runwayMonths: null,
    // §7.2 Balance (último mes)
    currentAssets: null,
    currentLiabilities: null,
    currentRatio: null,
    quickRatio: null,
    workingCapital: null,
    debtToEquity: null,
    // §7.4 Cash conversion
    dso: null,
    dpo: null,
    periodStart: null,
    periodEnd: null,
  };
}

export const KPICalculator = {
  /**
   * Build a KPI snapshot from a monthly financial series.
   * @param {Array<{month:string, revenue:number, expenses:number, cash:number,
   *   cogs?:number, opex?:number, daa?:number, interest?:number, tax?:number,
   *   ar?:number, inventory?:number, ap?:number, shortDebt?:number, longDebt?:number,
   *   equity?:number}>} series
   * @returns {object} snapshot (ver JSDoc por campo en el return)
   */
  fromMonthly(series) {
    const data = (series || []).filter((d) => d && Number.isFinite(d.revenue));
    if (data.length === 0) {
      return emptySnapshot();
    }

    const last = data[data.length - 1];
    const prev = data[data.length - 2];

    // ── §7.1 Income Statement ────────────────────────────────────────────
    /** Σ revenue del período. */
    const totalRevenue = MathUtils.sum(data.map((d) => d.revenue));
    /** Σ expenses del período (cogs + opex + daa + interest + tax). */
    const totalExpenses = MathUtils.sum(data.map((d) => d.expenses));
    /** §7.1 Net Income = Revenue − Expenses. */
    const netIncome = totalRevenue - totalExpenses;

    /** §7.1 COGS agregado; null si la serie no tiene dato de cogs. */
    const cogsValues = data.map((d) => d.cogs);
    const hasCogs = cogsValues.some((v) => Number.isFinite(v));
    const totalCogs = hasCogs ? MathUtils.sum(cogsValues) : null;
    /** §7.1 Gross Profit = Revenue − COGS; null si COGS es null. */
    const grossProfit = totalCogs == null ? null : totalRevenue - totalCogs;
    /** §7.1 Gross Margin = Gross Profit / Revenue; null si no calculable. */
    const grossMargin = divide(grossProfit, totalRevenue);

    /** §7.1 OpEx = Σ cuentas expense no COGS ni D&A. */
    const totalOpex = MathUtils.sum(data.map((d) => d.opex));
    /** §7.1 D&A = Σ cuentas is_daa. */
    const totalDaa = MathUtils.sum(data.map((d) => d.daa));
    /** §7.1 EBIT = Gross Profit − OpEx − D&A; null si Gross Profit es null. */
    const ebit = grossProfit == null ? null : grossProfit - totalOpex - totalDaa;
    /** §7.1 Operating Margin = EBIT / Revenue; null si no calculable. */
    const operatingMargin = divide(ebit, totalRevenue);
    /** §7.1 EBITDA = EBIT + D&A; null si EBIT es null. */
    const ebitda = ebit == null ? null : ebit + totalDaa;

    /** §7.1 Interest Expense agregado. */
    const totalInterest = MathUtils.sum(data.map((d) => d.interest));
    /** §7.1 Tax Expense agregado. */
    const totalTax = MathUtils.sum(data.map((d) => d.tax));
    /**
     * §7.1 Net Margin = Net Income / Revenue (agregado del período completo).
     * Diferencia con marginDelta: netMargin es el margen promedio del período,
     * mientras que marginDelta es la variación month-over-month en puntos porcentuales.
     */
    const netMargin = divide(netIncome, totalRevenue);

    /** §7.1 Revenue Growth = pctChange(prev, last); null si no hay prev o prev=0. */
    const revenueGrowth = prev ? MathUtils.pctChange(prev.revenue, last.revenue) : null;

    /** §7.1 Net margin del último período (netIncome/revenue del mes). */
    const netMarginLast = last.revenue > 0 ? (last.revenue - last.expenses) / last.revenue : null;
    /** §7.1 Net margin del período anterior (si existe). */
    const netMarginPrev = prev && prev.revenue > 0 ? (prev.revenue - prev.expenses) / prev.revenue : null;
    /** §7.1 Margin Delta en puntos porcentuales = (netMargin_last − netMargin_prev) × 100. */
    const marginDelta = netMarginLast != null && netMarginPrev != null
      ? (netMarginLast - netMarginPrev) * 100
      : null;

    // ── §7.4 Cash / runway ───────────────────────────────────────────────
    /** §7.4 Caja al cierre del último período. */
    const cashPosition = fin(last.cash);
    /** §7.4 Net burn mensual promedio = mean(últimos 6 de expenses − revenue). */
    const monthlyBurn = MathUtils.mean(data.slice(-6).map((d) => d.expenses - d.revenue));
    /**
     * §7.4 Runway en meses (1 decimal).
     * - Negativo o zero burn: retorna Infinity (empresa rentable — no hay preocupación de runway).
     * - Burn positivo: cash / |burn|.
     * - null si falta cash o burn no es calculable.
     * La UI debe interpretar Infinity como "Profitable — no runway concern".
     */
    const runwayMonths = monthlyBurn < 0 && Number.isFinite(cashPosition)
      ? MathUtils.round(cashPosition / Math.abs(monthlyBurn), 1)
      : monthlyBurn >= 0 && cashPosition != null
        ? Infinity
        : null;

    // ── §7.2 Balance (posicional, al cierre del último mes) ──────────────
    const lastCash = fin(last.cash);
    const lastAr = fin(last.ar);
    const lastInventory = fin(last.inventory);
    const lastAp = fin(last.ap);
    const lastShortDebt = fin(last.shortDebt);
    const lastLongDebt = fin(last.longDebt);
    const lastEquity = fin(last.equity);
    const lastRevenue = fin(last.revenue);
    const lastExpenses = fin(last.expenses);

    /** §7.2 Current Assets = cash + ar + inventory; null si falta componente. */
    const currentAssets = sumOrNull([lastCash, lastAr, lastInventory]);
    /** §7.2 Current Liabilities = ap + shortDebt; null si falta componente. */
    const currentLiabilities = sumOrNull([lastAp, lastShortDebt]);
    /** §7.2 Current Ratio = Current Assets / Current Liabilities; null si no calculable. */
    const currentRatio = divide(currentAssets, currentLiabilities);
    /** §7.2 Quick Ratio = (Current Assets − Inventory) / Current Liabilities. */
    const quickRatio = divide(subOrNull(currentAssets, lastInventory), currentLiabilities);
    /** §7.2 Working Capital = Current Assets − Current Liabilities. */
    const workingCapital = subOrNull(currentAssets, currentLiabilities);
    /** §7.2 Debt-to-Equity = (Current Liab + Long-Term Debt) / Equity. */
    const debtToEquity = divide(sumOrNull([currentLiabilities, lastLongDebt]), lastEquity);

    // ── §7.4 Cash conversion ─────────────────────────────────────────────
    /** §7.4 DSO = (AR / Revenue) × 30 días. */
    const dso = lastAr != null && lastRevenue > 0 ? MathUtils.safeDivide(lastAr, lastRevenue) * 30 : null;
    /** §7.4 DPO = (AP / Expenses) × 30 días. */
    const dpo = lastAp != null && lastExpenses > 0 ? MathUtils.safeDivide(lastAp, lastExpenses) * 30 : null;

    return {
      // §7.1 Income Statement
      /** §7.1 Σ revenue del período. */
      totalRevenue,
      /** §7.1 Σ expenses del período. */
      totalExpenses,
      /** §7.1 Net Income = Revenue − Expenses. */
      netIncome,
      /** §7.1 Σ cogs; null si la serie no tiene dato de cogs. */
      totalCogs,
      /** §7.1 Gross Profit = Revenue − COGS; null si COGS null. */
      grossProfit,
      /** §7.1 Gross Margin = Gross Profit / Revenue; null si no calculable. */
      grossMargin,
      /** §7.1 Σ opex (expenses no COGS ni D&A). */
      totalOpex,
      /** §7.1 Σ daa (depreciación y amortización). */
      totalDaa,
      /** §7.1 EBIT = Gross Profit − OpEx − D&A; null si Gross Profit null. */
      ebit,
      /** §7.1 Operating Margin = EBIT / Revenue; null si no calculable. */
      operatingMargin,
      /** §7.1 EBITDA = EBIT + D&A; null si EBIT null. */
      ebitda,
      /** §7.1 Σ interest. */
      totalInterest,
      /** §7.1 Σ tax. */
      totalTax,
      /** §7.1 Net Margin = Net Income / Revenue; null si no calculable. */
      netMargin,
      /** §7.1 Revenue Growth (decimal, 0.07 = 7%); null si prev=0 o sin prev. */
      revenueGrowth,
      /** §7.1 Margin Delta en puntos porcentuales; null si no calculable. */
      marginDelta,
      // §7.4 Cash / runway
      /** §7.4 Caja al cierre del último período. */
      cashPosition,
      /** §7.4 Net burn promedio (últimos 6 meses, expenses − revenue). */
      monthlyBurn,
      /** §7.4 Runway en meses (1 decimal); null si no aplica. */
      runwayMonths,
      // §7.2 Balance (último mes)
      /** §7.2 Current Assets = cash + ar + inventory. */
      currentAssets,
      /** §7.2 Current Liabilities = ap + shortDebt. */
      currentLiabilities,
      /** §7.2 Current Ratio = Current Assets / Current Liabilities. */
      currentRatio,
      /** §7.2 Quick Ratio = (Current Assets − Inventory) / Current Liabilities. */
      quickRatio,
      /** §7.2 Working Capital = Current Assets − Current Liabilities. */
      workingCapital,
      /** §7.2 Debt-to-Equity = (Current Liab + Long-Term Debt) / Equity. */
      debtToEquity,
      // §7.4 Cash conversion
      /** §7.4 DSO días = (AR / Revenue) × 30. */
      dso,
      /** §7.4 DPO días = (AP / Expenses) × 30. */
      dpo,
      periodStart: data[0].month,
      periodEnd: last.month,
    };
  },

  /** Neutral snapshot para series vacías (compatibilidad con V2). */
  _empty() {
    return emptySnapshot();
  },
};

export default KPICalculator;
