import KPICalculator from './KPICalculator';
import CashFlowService from './CashFlowService';
import ForecastingService from './ForecastingService';
import AnomalyService from './AnomalyService';
import BenchmarkService from './BenchmarkService';
import CovenantService from './CovenantService';
import VarianceService from './VarianceService';
import AgentOrchestrator, { CAPABILITIES } from '../agent/AgentOrchestrator';

const total = rows => rows.reduce((s,r)=>s+Math.round(r.amount*100),0)/100;
const kind = r => r.financialType || (r.type === 'ingreso' ? 'revenue' : 'unclassified');
const numeric = value => Number.isFinite(value) ? value : null;
const monthIndex = month => Number(month.slice(0,4))*12+Number(month.slice(5,7));

/** Adapter only: all headline ratios are calculated by the original services. */
export function buildMonthlySeries(dataset, through) {
  const valid=(dataset.rows||[]).filter(r=>/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(r.date)&&r.date.slice(0,7)<=through&&Number.isFinite(r.amount)&&r.amount>=0&&['ingreso','gasto'].includes(r.type));
  const months=[...new Set(valid.map(r=>r.date.slice(0,7)))].sort();
  let previous=null;
  return months.map(month=>{
    const rows=valid.filter(r=>r.date.startsWith(month));
    const amount=(k,type)=>total(rows.filter(r=>kind(r)===k&&r.type===type));
    const revenue=amount('revenue','ingreso'),otherIncome=amount('other_income','ingreso');
    const cogs=amount('cogs','gasto'),opex=amount('opex','gasto')+amount('unclassified','gasto');
    const daa=amount('depreciation','gasto'),interest=amount('interest','gasto'),tax=amount('tax','gasto');
    const expenses=cogs+opex+daa+interest+tax;
    const cashNet=total(rows.filter(r=>r.type==='ingreso'))-total(rows.filter(r=>r.type==='gasto'&&kind(r)!=='depreciation'));
    const explicit=dataset.finance?.[month]?.opening;
    const opening=Number.isFinite(explicit)?explicit:previous&&monthIndex(month)-monthIndex(previous.month)===1?previous.cash:null;
    const closing=opening==null?null:Math.round((opening+cashNet)*100)/100;
    const balance=dataset.analysis?.balances?.[month]||{};
    const point={month,revenue,otherIncome,expenses,cogs,opex,daa,interest,tax,cash:closing,cashNet,
      cashBurn:expenses-daa-revenue-otherIncome,
      ar:numeric(balance.ar),inventory:numeric(balance.inventory),ap:numeric(balance.ap),shortDebt:numeric(balance.shortDebt),longDebt:numeric(balance.longDebt),equity:numeric(balance.equity),
      budget:numeric(dataset.analysis?.revenueBudgets?.[month])};
    previous=point;
    return point;
  });
}

export function analyzeWorkspace(dataset, month, stressOptions={}) {
  const series=buildMonthlySeries(dataset,month),latest=series.at(-1),last=latest?.month===month?latest:null;
  const current=last?KPICalculator.fromMonthly([last]):{...KPICalculator.fromMonthly([]),cashPosition:null};
  const historical=KPICalculator.fromMonthly(series);
  // Forecast indices represent equally spaced months: use only the contiguous tail.
  let start=series.length-1;
  while(start>0&&monthIndex(series[start].month)-monthIndex(series[start-1].month)===1) start--;
  const continuous=last?series.slice(start):[];
  const forecast=ForecastingService.forecast(continuous,{horizon:3});
  const backtest=continuous.length>=8?ForecastingService.backtest(continuous,{horizon:3}):null;
  const targetEntries=Object.entries(dataset.analysis?.targets||{}).filter(([,v])=>Number.isFinite(v));
  const benchmarks=BenchmarkService.compare(series,current,Object.fromEntries(targetEntries));
  const limits=dataset.analysis?.limits||{};
  const definitions=Object.entries(limits).filter(([,v])=>Number.isFinite(v)).map(([metric,threshold])=>({id:metric,name:metric,metric,threshold,operator:'>=',severity:'critical'}));
  const covenants=CovenantService.evaluate(last,definitions,current);
  const capabilities=Object.values(CAPABILITIES);
  const proposed=AgentOrchestrator.propose({series:continuous,covenants:definitions,capabilities}).actions;
  // Contract limits apply to the selected month, not aggregate historic margins.
  const actions=proposed.filter(a=>a.capability!==CAPABILITIES.ESCALATE_COVENANT);
  if(covenants.breaches.length) actions.push({capability:CAPABILITIES.ESCALATE_COVENANT,data:{breaches:covenants.breaches},evidence:covenants.breaches,status:'proposed'});
  // Stress is an operating scenario: capital movements and noncash charges do not recur.
  const cashSeries=series.map(p=>({...p,revenue:p.revenue+p.otherIncome,expenses:p.expenses-p.daa}));
  const stress=last?.cash!=null?CashFlowService.stressTest(cashSeries,stressOptions):null;
  return {series,current,historical,forecast,backtest,continuousMonths:continuous.length,
    flows:CashFlowService.monthlyNetFlow(series),anomalies:AnomalyService.detect(continuous),
    benchmarks,covenants,variance:VarianceService.summary(series),stress,actions};
}
