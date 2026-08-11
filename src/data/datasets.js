/**
 * Sample financial datasets for FinFlow.
 * Shape: monthly time series of revenue, expenses, cash position,
 * plus optional budget targets and industry benchmark references.
 *
 * NOTE: All amounts are in USD. Replace with real data sources in production.
 *
 * FASE 0 (spec §7.1/§7.2): cada mes ampliado con P&L desglosado
 * (cogs, opex, daa, interest, tax) y balance (ar, inventory, ap,
 * shortDebt, longDebt, equity, fixedAssets).
 *
 * Reglas de coherencia (SaaS, revenue 420k → 815k creciente):
 * - cogs   ≈ revenue * 0.38
 * - opex   = expenses - cogs - daa - interest - tax  (positivo en todos los meses)
 * - daa    creciente 15k → 24k
 * - interest ≈ 5.4k–6.0k, decreciente con longDebt
 * - tax    ≈ 25% de (revenue - expenses) cuando es positivo
 * - ar     ≈ revenue * 1.2 (≈36 días DSO)
 * - ap     ≈ expenses * 0.3
 * - longDebt 600k → 480k (pago ≈10k/mes)
 * - equity = capital inicial (1.500.000) + utilidades retenidas acumuladas
 *
 * BALANCE QUE CUADRA (invariante §7.2):
 *   cash + ar + inventory + fixedAssets === ap + shortDebt + longDebt + equity
 *   (fixedAssets se calcula como residuo para cumplir la identidad contable)
 */

export const MONTHLY_FINANCIALS = [
  {
    month: '2025-01', revenue: 420000, expenses: 310000, cash: 1250000, budget: 410000,
    cogs: 159600, opex: 101900, daa: 15000, interest: 6000, tax: 27500,
    ar: 504000, inventory: 30000, ap: 93000, shortDebt: 80000, longDebt: 600000,
    equity: 1610000, fixedAssets: 599000,
  },
  {
    month: '2025-02', revenue: 445000, expenses: 325000, cash: 1370000, budget: 430000,
    cogs: 169100, opex: 104150, daa: 15800, interest: 5950, tax: 30000,
    ar: 534000, inventory: 32000, ap: 97500, shortDebt: 80000, longDebt: 590000,
    equity: 1730000, fixedAssets: 561500,
  },
  {
    month: '2025-03', revenue: 510000, expenses: 360000, cash: 1520000, budget: 480000,
    cogs: 193800, opex: 106200, daa: 16600, interest: 5900, tax: 37500,
    ar: 612000, inventory: 34000, ap: 108000, shortDebt: 80000, longDebt: 580000,
    equity: 1880000, fixedAssets: 482000,
  },
  {
    month: '2025-04', revenue: 495000, expenses: 355000, cash: 1660000, budget: 500000,
    cogs: 188100, opex: 108650, daa: 17400, interest: 5850, tax: 35000,
    ar: 594000, inventory: 33000, ap: 106500, shortDebt: 80000, longDebt: 570000,
    equity: 2020000, fixedAssets: 489500,
  },
  {
    month: '2025-05', revenue: 560000, expenses: 390000, cash: 1830000, budget: 540000,
    cogs: 212800, opex: 110700, daa: 18200, interest: 5800, tax: 42500,
    ar: 672000, inventory: 36000, ap: 117000, shortDebt: 80000, longDebt: 560000,
    equity: 2190000, fixedAssets: 409000,
  },
  {
    month: '2025-06', revenue: 612000, expenses: 410000, cash: 2032000, budget: 580000,
    cogs: 232560, opex: 102190, daa: 19000, interest: 5750, tax: 50500,
    ar: 734400, inventory: 38000, ap: 123000, shortDebt: 80000, longDebt: 550000,
    equity: 2392000, fixedAssets: 340600,
  },
  {
    month: '2025-07', revenue: 598000, expenses: 415000, cash: 2215000, budget: 600000,
    cogs: 227240, opex: 116510, daa: 19800, interest: 5700, tax: 45750,
    ar: 717600, inventory: 39000, ap: 124500, shortDebt: 80000, longDebt: 540000,
    equity: 2575000, fixedAssets: 347900,
  },
  {
    month: '2025-08', revenue: 654000, expenses: 432000, cash: 2437000, budget: 620000,
    cogs: 248520, opex: 101730, daa: 20600, interest: 5650, tax: 55500,
    ar: 784800, inventory: 40000, ap: 129600, shortDebt: 80000, longDebt: 530000,
    equity: 2797000, fixedAssets: 274800,
  },
  {
    month: '2025-09', revenue: 690000, expenses: 448000, cash: 2679000, budget: 650000,
    cogs: 262200, opex: 98300, daa: 21400, interest: 5600, tax: 60500,
    ar: 828000, inventory: 42000, ap: 134400, shortDebt: 80000, longDebt: 520000,
    equity: 3039000, fixedAssets: 224400,
  },
  {
    month: '2025-10', revenue: 725000, expenses: 465000, cash: 2939000, budget: 690000,
    cogs: 275500, opex: 96750, daa: 22200, interest: 5550, tax: 65000,
    ar: 870000, inventory: 44000, ap: 139500, shortDebt: 80000, longDebt: 510000,
    equity: 3299000, fixedAssets: 175500,
  },
  {
    month: '2025-11', revenue: 760000, expenses: 478000, cash: 3221000, budget: 720000,
    cogs: 288800, opex: 90200, daa: 23000, interest: 5500, tax: 70500,
    ar: 912000, inventory: 46000, ap: 143400, shortDebt: 80000, longDebt: 495000,
    equity: 3581000, fixedAssets: 120400,
  },
  {
    month: '2025-12', revenue: 815000, expenses: 495000, cash: 3541000, budget: 760000,
    cogs: 309700, opex: 76050, daa: 23800, interest: 5450, tax: 80000,
    ar: 978000, inventory: 48000, ap: 148500, shortDebt: 80000, longDebt: 480000,
    equity: 3901000, fixedAssets: 42500,
  },
];

export const INDUSTRY_BENCHMARKS = {
  grossMargin: 0.52,
  netMargin: 0.18,
  currentRatio: 1.8,
  debtToEquity: 0.6,
  cashRunway: 12,
  revenueGrowth: 0.15,
  operatingMargin: 0.22,
  customerAcquisitionCost: 850,
  lifetimeValue: 12500,
};

export const COVENANTS = [
  { id: 'c1', name: 'Minimum Cash', metric: 'cash', operator: '>=', threshold: 1500000, severity: 'critical' },
  { id: 'c2', name: 'Debt-to-Equity', metric: 'debtToEquity', operator: '<=', threshold: 1.0, severity: 'warning' },
  { id: 'c3', name: 'Current Ratio', metric: 'currentRatio', operator: '>=', threshold: 1.5, severity: 'warning' },
  { id: 'c4', name: 'Revenue Growth', metric: 'revenueGrowth', operator: '>=', threshold: 0.1, severity: 'info' },
];

export const COMPANY_PROFILE = {
  name: 'Acme Corp',
  industry: 'SaaS',
  currency: 'USD',
  fiscalYearStart: '2025-01',
  reportingFrequency: 'monthly',
};

export default {
  MONTHLY_FINANCIALS,
  INDUSTRY_BENCHMARKS,
  COVENANTS,
  COMPANY_PROFILE,
};
