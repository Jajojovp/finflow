import { currencyMath } from '../../workspace/currencies.mjs';
import { date, addDays, fail } from '../../workspace/planning-contract.mjs';
import { dueStatus } from '../../workspace/dues.mjs';
import { recurrenceOccurrences } from '../../workspace/recurrences.mjs';
import { debtBalance } from '../../workspace/debts.mjs';

/** Agenda determinista: las partidas explican cada semana; no modifica el espacio. */
export function scheduledCashFlow(d, options={}) {
  const startDate=date(options.startDate),through=addDays(startDate,90),{round}=currencyMath(d.currency);
  const profile=options.profile ?? 'business',includeOverdue=options.includeOverdue ?? false;
  const collectionDelayDays=options.collectionDelayDays ?? 0,incomeChange=options.incomeChange ?? 0,costChange=options.costChange ?? 0;
  if(!['personal','business','advisor'].includes(profile)||typeof includeOverdue!=='boolean'||!Number.isInteger(collectionDelayDays)||collectionDelayDays<0||collectionDelayDays>365||[incomeChange,costChange].some(v=>!Number.isFinite(v)||v< -100||v>1000)) fail('Revisa los supuestos del escenario.');
  if(options.opening!==undefined&&options.opening!==null&&(!Number.isFinite(options.opening)||Math.abs(options.opening)>1e12)) fail('Revisa el saldo inicial del escenario.');
  const items=[],overdue=[],excluded=[],limitations=[];
  function planned(item) {
    let day=item.date;
    if(day<startDate) {overdue.push({...item});if(!includeOverdue)return;day=startDate;}
    if(item.direction==='income') day=addDays(day,collectionDelayDays);
    const multiplier=1+(item.direction==='income'?incomeChange:costChange)/100;
    const next={...item,date:day,originalAmount:item.amount,amount:round(item.amount*multiplier),observed:false};
    if(day>through) excluded.push(next);else items.push(next);
  }
  // Registros realizados dentro del intervalo se incluyen una vez y no se alteran por escenarios.
  for(const r of d.rows.filter(r=>r.date>=startDate&&r.date<=through&&r.financialType!=='depreciation')) {
    items.push({id:'movement:'+r.id,sourceId:r.id,source:'movement',name:r.description,date:r.date,direction:r.type==='ingreso'?'income':'expense',amount:r.amount,originalAmount:r.amount,observed:true});
  }
  if(profile!=='personal') {
    for(const due of d.planning?.dues ?? []) {
      const status=dueStatus(d,due,through);if(status.cancelled||status.outstanding<=0)continue;
      planned({id:'due:'+due.id,sourceId:due.id,source:'due',name:due.name+' · '+due.counterparty,date:due.expectedDate ?? due.dueDate,direction:due.direction==='receivable'?'income':'expense',amount:status.outstanding});
    }
    limitations.push('Empresa y asesor: previsión basada en la agenda de partidas, además de los movimientos ya registrados; las plantillas personales no se suman a esta agenda.');
  } else {
    for(const r of recurrenceOccurrences(d,startDate,through).filter(r=>!r.confirmed)) planned({id:r.id,sourceId:r.recurrenceId,source:'recurrence',name:r.description,date:r.date,direction:r.type==='ingreso'?'income':'expense',amount:r.amount});
    for(const loan of d.planning?.debts ?? []) {
      const balance=debtBalance({...loan,payments:loan.payments.filter(p=>p.date<=through)},d.currency);
      if(balance<=0)continue;
      if(!loan.dueDate){limitations.push('Deuda sin vencimiento: '+loan.name);continue;}
      planned({id:'debt:'+loan.id,sourceId:loan.id,source:'debt',name:loan.name+' · capital pendiente',date:loan.dueDate,direction:'expense',amount:balance});
      limitations.push('Deuda '+loan.name+': solo se incluye el capital pendiente; no se inventan cuotas, intereses ni comisiones futuras.');
    }
  }
  let balance=Number.isFinite(options.opening)?round(options.opening):null;
  const opening=balance,weeks=[];
  for(let i=0;i<13;i++) {
    const from=addDays(startDate,i*7),to=addDays(from,6),entries=items.filter(p=>p.date>=from&&p.date<=to);
    const total=direction=>round(entries.filter(p=>p.direction===direction).reduce((n,p)=>n+p.amount,0));
    const receipts=total('income'),payments=total('expense'),closing=balance===null?null:round(balance+receipts-payments);
    weeks.push({number:i+1,from,to,opening:balance,receipts,payments,closing,items:entries});balance=closing;
  }
  const assumptions=['Saldo inicial declarado para el comienzo del intervalo; no se infiere de otro mes.','Los movimientos registrados se incluyen una vez y conservan sus fechas e importes.',includeOverdue?'Supuesto explícito: pendientes vencidos en la primera fecha del intervalo.':'Vencidos sin fecha prevista futura excluidos del flujo.',`Escenario: atraso de cobros ${collectionDelayDays} días; ingresos previstos ${incomeChange}%; costes previstos ${costChange}%.`];
  return {startDate,through,currency:d.currency,profile,opening,weeks,items,overdue,excluded,assumptions,limitations,receipts:round(weeks.reduce((n,w)=>n+w.receipts,0)),payments:round(weeks.reduce((n,w)=>n+w.payments,0)),closing:balance,minCash:opening===null?null:Math.min(opening,...weeks.map(w=>w.closing)),scenario:{collectionDelayDays,incomeChange,costChange,includeOverdue}};
}
export default { scheduledCashFlow };
