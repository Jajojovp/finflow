import { currencyMath } from './currencies.mjs';
import { amount, date, text, fail, changePlan, priorMonth } from './planning-contract.mjs';
import {detectLeaks} from './finance.mjs';
export const effectiveBudgets=(d,period)=>({...d.budgets,...d.planning?.budgets?.[period]});
export function workspaceLeaks(d,period) {
  const specific=d.planning?.budgets?.[period] ?? {},previous=priorMonth(period);
  const findings=detectLeaks(d.rows.filter(r=>r.date.startsWith(period)),d.rows.filter(r=>r.date.startsWith(previous)),{...effectiveBudgets(d,period),__total:d.finance?.[period]?.expenseBudget ?? 0},d.currency).filter(f=>f.kind!=='budget'||!Object.hasOwn(specific,f.category));
  return [...findings,...budgetSummary(d,period).filter(b=>b.over>0&&Object.hasOwn(specific,b.category)).map(b=>({kind:'budget',title:'Presupuesto del mes superado',category:b.category,amount:b.over,evidence:`${period}: gasto ${b.actual} ${d.currency}; límite explícito ${b.limit}. Capital y depreciación excluidos.`,action:'Revisa las partidas del período antes de modificar el límite.'}))];
}

export function saveBudget(d, period, category, limit) {
  date(period+'-01'); const key=text(category,'la categoría',80);
  if(['__proto__','constructor','prototype'].includes(key)) fail('La categoría contiene un nombre reservado.');
  const value=currencyMath(d.currency).round(amount(limit));
  return changePlan(d,'budgets',{...d.planning?.budgets,[period]:{...d.planning?.budgets?.[period],[key]:value}});
}
export function budgetSummary(d, period) {
  date(period+'-01'); const previousPeriod=priorMonth(period), {round,sum}=currencyMath(d.currency);
  const costs=d.rows.filter(r=>r.type==='gasto'&&!['capital','depreciation'].includes(r.financialType));
  const current=costs.filter(r=>r.date.startsWith(period)),previous=costs.filter(r=>r.date.startsWith(previousPeriod));
  const hasPrevious=d.rows.some(r=>r.date.startsWith(previousPeriod));
  const specific=d.planning?.budgets?.[period] ?? {},old=d.budgets ?? {};
  const categories=[...new Set([...Object.keys(old),...Object.keys(specific),...current.map(r=>r.category),...previous.map(r=>r.category)])].sort();
  return categories.map(category=>{
    const explicit=Object.hasOwn(specific,category), limit=explicit?specific[category]:old[category]>0?old[category]:null;
    const actual=sum(current.filter(r=>r.category===category)),before=hasPrevious?sum(previous.filter(r=>r.category===category)):null;
    return {category,period,previousPeriod,actual,limit,source:explicit?'period':'inherited',previous:before,change:before===null?null:round(actual-before),changePercent:before>0?(actual-before)/before*100:null,remaining:limit===null?null:round(limit-actual),over:limit===null?null:Math.max(0,round(actual-limit))};
  });
}
