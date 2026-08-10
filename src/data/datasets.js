/**
 * Sample financial datasets for FinFlow.
 * Shape: monthly time series of revenue, expenses, cash position,
 * plus optional budget targets and industry benchmark references.
 *
 * NOTE: All amounts are in USD. Replace with real data sources in production.
 */

export const MONTHLY_FINANCIALS = [
  { month: '2025-01', revenue: 420000, expenses: 310000, cash: 1250000, budget: 410000 },
  { month: '2025-02', revenue: 445000, expenses: 325000, cash: 1370000, budget: 430000 },
  { month: '2025-03', revenue: 510000, expenses: 360000, cash: 1520000, budget: 480000 },
  { month: '2025-04', revenue: 495000, expenses: 355000, cash: 1660000, budget: 500000 },
  { month: '2025-05', revenue: 560000, expenses: 390000, cash: 1830000, budget: 540000 },
  { month: '2025-06', revenue: 612000, expenses: 410000, cash: 2032000, budget: 580000 },
  { month: '2025-07', revenue: 598000, expenses: 415000, cash: 2215000, budget: 600000 },
  { month: '2025-08', revenue: 654000, expenses: 432000, cash: 2437000, budget: 620000 },
  { month: '2025-09', revenue: 690000, expenses: 448000, cash: 2679000, budget: 650000 },
  { month: '2025-10', revenue: 725000, expenses: 465000, cash: 2939000, budget: 690000 },
  { month: '2025-11', revenue: 760000, expenses: 478000, cash: 3221000, budget: 720000 },
  { month: '2025-12', revenue: 815000, expenses: 495000, cash: 3541000, budget: 760000 },
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
