import {listClients} from './clients.mjs';
import {currencyMath} from './currencies.mjs';
import {cashPosition,incomeStatement,breakEven} from './finance.mjs';
import {netWorth} from './net-worth.mjs';
import {budgetSummary} from './budgets.mjs';
import {dueStatus} from './dues.mjs';
import {scheduledCashFlow} from '../services/financial/ScheduledCashFlowService.js';
import {date,fail,addDays} from './planning-contract.mjs';

const endOfMonth=period=>new Date(Date.UTC(Number(period.slice(0,4)),Number(period.slice(5,7)),0)).toISOString().slice(0,10);
export function workspaceReport(d, period, profile='business') {
  date(period+'-01');const asOf=endOfMonth(period),records=d.rows.filter(r=>r.date.startsWith(period)),opening=d.finance?.[period]?.opening;
  const cash=Number.isFinite(opening)?cashPosition(records,opening,d.currency):null;
  const statement=records.length?incomeStatement(records,d.currency):null;
  return {entity:d.name,profile,period,currency:d.currency,asOf,generatedAt:new Date().toISOString(),methodologySource:'https://github.com/Jajojovp/finflow',remoteSharing:false,cash,statement,breakEven:breakEven(records,d.finance?.[period]?.unitPrice ?? 0,d.currency),netWorth:netWorth(d,asOf),budgets:budgetSummary(d,period),dues:(d.planning?.dues ?? []).map(due=>({...due,...dueStatus(d,due,asOf)})),scheduled:scheduledCashFlow(d,{startDate:addDays(asOf,1),opening:cash?.available ?? null,profile}),records,parameters:{finance:d.finance?.[period] ?? null,categoryBudgets:d.planning?.budgets?.[period] ?? null},limitations:['Gestión con base en movimientos clasificados; no es un libro mayor de doble entrada ni contabilidad de devengo.','Moneda declarada, sin conversión de divisas ni cotizaciones externas.','Exportar genera un archivo local: no envía datos ni concede acceso remoto.',...(!records.length?['Sin movimientos del período; el resultado no se presenta como cero.']:[]),...(!cash?['Falta saldo inicial del período.']:[])]};
}
export function portfolioSummary(state, period) {
  if(state.profile!=='advisor') fail('Selecciona el perfil profesional para consultar el portafolio.');date(period+'-01');
  const clients=listClients(state).map(c=>{
    const d=state.datasets[c.key];if(!d)return {...c,currency:null,hasData:false,cash:null,profit:null,netWorth:null,evidenceDate:null,incomplete:true};
    const asOf=endOfMonth(period),records=d.rows.filter(r=>r.date.startsWith(period)),opening=d.finance?.[period]?.opening;
    const cash=Number.isFinite(opening)?cashPosition(records,opening,d.currency).available:null,profit=records.length?incomeStatement(records,d.currency).netProfit:null,worth=netWorth(d,asOf);
    const evidence=[...d.rows.filter(r=>r.date<=asOf).map(r=>r.date),...(d.planning?.assets ?? []).filter(a=>a.valuedAt<=asOf).map(a=>a.valuedAt),...(d.planning?.liabilities ?? []).filter(a=>a.valuedAt<=asOf).map(a=>a.valuedAt)].sort().at(-1) ?? null;
    return {...c,hasData:true,cash,profit,netWorth:worth.total,evidenceDate:evidence,incomplete:cash===null||profit===null||!worth.complete};
  });
  const codes=[...new Set(clients.filter(c=>!c.archived).map(c=>c.currency))];
  const groups=codes.map(currency=>{
    const members=clients.filter(c=>!c.archived&&c.currency===currency),round=currencyMath(currency ?? 'EUR').round;
    const value=key=>members.some(c=>c[key]===null)?null:round(members.reduce((n,c)=>n+c[key],0));
    const known=key=>round(members.reduce((n,c)=>n+(c[key] ?? 0),0));
    return {currency,clients:members,cash:value('cash'),profit:value('profit'),netWorth:value('netWorth'),knownCash:known('cash'),knownProfit:known('profit'),incomplete:members.filter(c=>c.incomplete).length};
  });
  return {period,groups,clients,activeCount:clients.filter(c=>!c.archived).length,archivedCount:clients.filter(c=>c.archived).length,limitations:['Totales separados por moneda; no existe un total convertido.','Clientes locales de esta identidad; no se accede a cuentas reales de terceros.','Con datos incompletos el total se muestra desconocido; los subtotales conocidos no representan todos los clientes.']};
}
