export interface MonthlyFinancial {
  month: string;
  revenue: number;
  expenses: number;
  cash?: number | null;
  cogs?: number | null;
  opex?: number | null;
  daa?: number | null;
  interest?: number | null;
  tax?: number | null;
  otherIncome?: number;
  cashBurn?: number;
  cashNet?: number;
  ar?: number | null;
  inventory?: number | null;
  ap?: number | null;
  shortDebt?: number | null;
  longDebt?: number | null;
  equity?: number | null;
}
export interface KPISnapshot {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  totalOtherIncome?: number;
  totalCogs: number | null;
  grossProfit: number | null;
  grossMargin: number | null;
  totalOpex: number;
  totalDaa: number;
  ebit: number | null;
  operatingMargin: number | null;
  ebitda: number | null;
  totalInterest: number;
  totalTax: number;
  netMargin: number | null;
  revenueGrowth: number | null;
  marginDelta: number | null;
  cashPosition: number | null;
  monthlyBurn: number;
  runwayMonths: number | null;
  currentAssets: number | null;
  currentLiabilities: number | null;
  currentRatio: number | null;
  quickRatio: number | null;
  workingCapital: number | null;
  debtToEquity: number | null;
  dso: number | null;
  dpo: number | null;
  periodStart: string | null;
  periodEnd: string | null;
}
export const KPICalculator: {
  fromMonthly(series?: MonthlyFinancial[] | null): KPISnapshot;
  _empty(): KPISnapshot;
};
export default KPICalculator;
