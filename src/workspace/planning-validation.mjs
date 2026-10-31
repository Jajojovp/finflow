import { validateRecurrence } from './recurrences.mjs';
import { validateDebt } from './debts.mjs';
import { validateValuation } from './net-worth.mjs';
import { amount, date, fail, linkedRowIds } from './planning-contract.mjs';
import { currencyMath } from './currencies.mjs';

export function validatePlanning(d) {
  const plan=d.planning;if(plan===undefined) return;
  if(!plan||typeof plan!=='object'||Array.isArray(plan)) fail('Revisa los datos de planificación.');
  for(const [field,validator] of [['recurrences',validateRecurrence],['debts',validateDebt],['assets',validateValuation],['liabilities',validateValuation]]) {
    if(plan[field]===undefined) continue;
    const items=plan[field];if(!Array.isArray(items)||items.length>500||new Set(items.map(x=>x?.id)).size!==items.length) fail(`Revisa los registros de ${field}; hay identificadores repetidos o demasiados registros.`);
    for(const item of items) { if(!item||typeof item!=='object') fail('Hay un registro de planificación inválido.');validator(item,d.currency); }
  }
  if(plan.budgets!==undefined) {
    if(!plan.budgets||typeof plan.budgets!=='object'||Array.isArray(plan.budgets)||Object.keys(plan.budgets).length>600) fail('Revisa los presupuestos por período.');
    for(const [period,categories] of Object.entries(plan.budgets)) {
      date(period+'-01');if(!categories||typeof categories!=='object'||Array.isArray(categories)||Object.keys(categories).length>500) fail('Revisa las categorías presupuestadas.');
      for(const [category,limit] of Object.entries(categories)) { if(!category.trim()||category.length>80||['__proto__','constructor','prototype'].includes(category)) fail('Revisa la categoría del presupuesto.');amount(limit); }
    }
  }
  const used=new Set(),{sum}=currencyMath(d.currency);
  for(const debt of plan.debts ?? []) for(const payment of debt.payments ?? []) {
    const rows=payment.rowIds.map(id=>d.rows.find(r=>r.id===id));
    if(rows.some((r,i)=>!r||used.has(payment.rowIds[i])||r.type!=='gasto'||r.date!==payment.date||!['capital','interest','opex'].includes(r.financialType))) fail('Un pago de deuda tiene movimientos ausentes, archivados o ya vinculados.');
    for(const [key,kind] of [['principal','capital'],['interest','interest'],['fee','opex']]) if(sum(rows.filter(r=>r.financialType===kind))!==payment[key]) fail('El pago de deuda no concilia con sus movimientos.');
    for(const id of payment.rowIds) { if(used.has(id)) fail('Un movimiento no puede vincularse dos veces.');used.add(id); }
  }
  if(used.size>linkedRowIds(d).size) fail('Revisa los vínculos de pagos.');
}
