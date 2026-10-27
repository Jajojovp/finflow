import { describe, it, expect } from 'vitest';
import { buildMonthlySeries, analyzeWorkspace } from './WorkspaceAnalysis';
import KPICalculator from './KPICalculator';

const row = (date, amount, type, financialType, extra = {}) => ({ date, amount, type, financialType, ...extra });
const rows = [row('2026-10-01',10000,'ingreso','revenue'),row('2026-10-02',4000,'gasto','cogs'),row('2026-10-03',3000,'gasto','opex')];

describe('WorkspaceAnalysis — original engines with entered records', () => {
  it('does not create a zero observation for an empty selected month', () => {
    const a=analyzeWorkspace({rows},'2026-11');
    expect(a.series).toHaveLength(1);
    expect(a.current.cashPosition).toBeNull();
    expect(a.forecast.points).toHaveLength(0);
  });
  it('reconciles cash, capital, depreciation and other income separately', () => {
    const data={rows:[...rows,row('2026-10-04',500,'gasto','depreciation'),row('2026-10-05',2000,'ingreso','capital'),row('2026-10-06',200,'ingreso','other_income')],finance:{'2026-10':{opening:1000}}};
    const a=analyzeWorkspace(data,'2026-10');
    expect(a.current.totalRevenue).toBe(10000);
    expect(a.current.netIncome).toBe(2700);
    expect(a.current.ebitda).toBe(3000);
    expect(a.current.cashPosition).toBe(6200);
    expect(a.flows[0].net).toBe(5200);
    expect(a.current.currentRatio).toBeNull();
  });
  it('uses only the selected month for headline ratios and does not leak future records', () => {
    const a=analyzeWorkspace({rows:[...rows,row('2026-11-01',999999,'ingreso','revenue')]},'2026-10');
    expect(a.series).toHaveLength(1);
    expect(a.current.netMargin).toBe(.3);
    expect(a.current.cashPosition).toBeNull();
  });
  it('does not bridge missing months or pretend missing history is zero', () => {
    const data={rows:['01','02','04','05','06','07'].map((m,i)=>row(`2026-${m}-01`,100+i*10,'ingreso','revenue'))};
    expect(buildMonthlySeries(data,'2026-07')).toHaveLength(6);
    expect(analyzeWorkspace(data,'2026-07').forecast.points).toHaveLength(0);
  });
  it('uses original forecast and backtest on consecutive entered observations', () => {
    const data={rows:Array.from({length:8},(_,i)=>row(`2026-${String(i+1).padStart(2,'0')}-01`,1000+i*100,'ingreso','revenue'))};
    const a=analyzeWorkspace(data,'2026-08');
    expect(a.forecast.points[0]).toMatchObject({month:'2026-09',value:1800});
    expect(a.backtest.mae).toBe(0);
  });
  it('evaluates declared balances, targets, limits and revenue budgets without demo benchmarks', () => {
    const data={rows,finance:{'2026-10':{opening:1000}},analysis:{balances:{'2026-10':{ar:2000,inventory:1000,ap:1000,shortDebt:1000,longDebt:500,equity:10000}},targets:{netMargin:.25},limits:{currentRatio:4},revenueBudgets:{'2026-10':9000}}};
    const a=analyzeWorkspace(data,'2026-10');
    expect(a.current.currentRatio).toBe(3.5);
    expect(a.benchmarks.find(r=>r.metric==='netMargin').gap).toBeCloseTo(.05);
    expect(a.covenants.results[0].status).toBe('breach');
    expect(a.variance.totalVariance).toBe(1000);
    expect(a.actions.some(r=>r.capability==='escalate_covenant_breach')).toBe(true);
  });
  it('propagates missing cost components instead of silently summing them as zero', () => {
    const k=KPICalculator.fromMonthly([{month:'2026-01',revenue:100,expenses:50,cogs:20},{month:'2026-02',revenue:100,expenses:50}]);
    expect(k.totalCogs).toBeNull();
  });
});

describe('runway financial regression', () => {
  it('divides cash by positive cash consumption and gives infinity without consumption', () => {
    expect(KPICalculator.fromMonthly([{month:'2026-10',revenue:100,expenses:150,cash:300}]).runwayMonths).toBe(6);
    expect(KPICalculator.fromMonthly([{month:'2026-10',revenue:150,expenses:100,cash:300}]).runwayMonths).toBe(Infinity);
  });
});
