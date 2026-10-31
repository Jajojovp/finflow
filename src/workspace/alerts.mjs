import {budgetSummary} from './budgets.mjs';
import {dueStatus} from './dues.mjs';
import {recurrenceOccurrences} from './recurrences.mjs';
import {debtBalance} from './debts.mjs';
import {scheduledCashFlow} from '../services/financial/ScheduledCashFlowService.js';
import {scheduleDefaults,scheduleOptions} from './schedule-view.mjs';
import {date,addDays,changePlan,fail} from './planning-contract.mjs';

export function validateAlertPreferences(preferences) {
  if(!preferences||typeof preferences!=='object'||Array.isArray(preferences)||typeof preferences.enabled!=='boolean'||!['daily','weekly','always'].includes(preferences.frequency)) fail('Revisa las preferencias de alertas.');
  if(preferences.lastReviewed) date(preferences.lastReviewed);
  const dismissed=preferences.dismissed ?? {};
  if(!dismissed||typeof dismissed!=='object'||Array.isArray(dismissed)||Object.keys(dismissed).length>1000) fail('Revisa las alertas descartadas.');
  for(const [id,day] of Object.entries(dismissed)){if(id.length>240||!id)fail('Hay una alerta descartada inválida.');date(day);}
}
export function saveAlertPreferences(d, values) {
  const next={enabled:true,frequency:'daily',dismissed:{},...d.planning?.alerts,...values};validateAlertPreferences(next);return changePlan(d,'alerts',next);
}
export function dismissAlert(d,id,day,undo=false) {
  date(day);if(typeof id!=='string'||!id||id.length>240) fail('No se encontró la alerta.');
  const dismissed={...d.planning?.alerts?.dismissed};if(undo)delete dismissed[id];else dismissed[id]=day;
  const entries=Object.entries(dismissed).sort((a,b)=>a[1].localeCompare(b[1])).slice(-1000);
  return saveAlertPreferences(d,{dismissed:Object.fromEntries(entries)});
}
export function reviewAlerts(d,day) {date(day);return saveAlertPreferences(d,{lastReviewed:day});}
export function evaluateAlerts(d,{asOf,period,profile='personal'}) {
  date(asOf);date(period+'-01');
  const preferences={enabled:true,frequency:'daily',dismissed:{},lastReviewed:null,...d.planning?.alerts};validateAlertPreferences(preferences);
  const items=[];
  const add=(kind,key,title,evidence,destination)=>{const id=kind+':'+key;items.push({id,kind,title,evidence,destination,dismissed:Object.hasOwn(preferences.dismissed,id)});};
  if(preferences.enabled) {
    for(const b of budgetSummary(d,period).filter(b=>b.over>0)) add('budget',`${period}:${b.category}:${b.actual}:${b.limit}`,'Presupuesto superado: '+b.category,`Gasto ${b.actual} ${d.currency}; límite ${b.limit}; exceso ${b.over}. Mes ${period}.`,'budgets');
    if(profile!=='personal')for(const due of d.planning?.dues ?? []) {
      const status=dueStatus(d,due,asOf);if(status.cancelled||status.outstanding<=0)continue;
      if(due.dueDate<=addDays(asOf,7))add(status.overdue?'overdue':'due',`${due.id}:${due.dueDate}:${status.outstanding}`,`${status.overdue?'Partida vencida':'Próximo vencimiento'}: ${due.name}`,`Contraparte ${due.counterparty}; vence ${due.dueDate}; pendiente ${status.outstanding} ${d.currency}.`,'dues');
    }
    for(const loan of d.planning?.debts ?? []) {
      const balance=debtBalance({...loan,payments:loan.payments.filter(p=>p.date<=asOf)},d.currency);
      if(balance>0&&loan.dueDate&&loan.dueDate<=addDays(asOf,7))add('debt',`${loan.id}:${loan.dueDate}:${balance}`,'Revisa el vencimiento de '+loan.name,`Capital pendiente ${balance} ${d.currency}; vencimiento declarado ${loan.dueDate}. Intereses futuros no inferidos.`,'debts');
    }
    for(const r of recurrenceOccurrences(d,asOf,addDays(asOf,7)).filter(r=>!r.confirmed))add('recurrence',r.id,'Próximo recurrente: '+r.description,`${r.date} · ${r.type} · ${r.amount} ${d.currency}. Requiere tu confirmación; aún no es un movimiento.`,'recurrences');
    const defaults=scheduleOptions(scheduleDefaults(d,period,profile)),flow=scheduledCashFlow(d,defaults);
    if(flow.minCash!==null&&flow.minCash<0)add('cash',`${period}:${flow.minCash}`,'La caja programada requiere revisión',`Caja mínima prevista ${flow.minCash} ${d.currency}, desde ${flow.startDate}. Consulta partidas y supuestos antes de decidir.`,'cash');
  }
  const elapsed=preferences.lastReviewed?(Date.parse(asOf)-Date.parse(preferences.lastReviewed))/86400000:Infinity;
  const due=preferences.frequency==='always'||elapsed>=(preferences.frequency==='weekly'?7:1);
  return {asOf,period,items,newCount:due?items.filter(x=>!x.dismissed).length:0,preferences,delivery:'in-app-local',limitations:'Alertas locales basadas en datos declarados. No envían correo, notificaciones push ni ejecutan operaciones.'};
}
