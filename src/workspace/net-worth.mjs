import { cashPosition } from './finance.mjs';
import { currencyMath } from './currencies.mjs';
import { debtBalance } from './debts.mjs';
import { date, amount, identifier, text, fail, upsert } from './planning-contract.mjs';

export function validateValuation(input, currency) {
  if(input.kind==='cash') fail('El efectivo se calcula desde el saldo y los movimientos; no lo añadas otra vez.');
  if(input.currency && input.currency!==currency) fail('Usa la moneda de este espacio; no hay conversión automática.');
  if(input.debtId) fail('Las deudas registradas ya se incluyen como pasivos; no las dupliques.');
  return {...input,id:identifier(input.id),name:text(input.name),amount:currencyMath(currency).round(amount(input.amount)),valuedAt:date(input.valuedAt)};
}
export function saveValuation(d, field, input) {
  if(!['assets','liabilities'].includes(field)) fail('Selecciona activo o pasivo.');
  return upsert(d,field,validateValuation(input,d.currency));
}
export function netWorth(d, asOf) {
  date(asOf);const period=asOf.slice(0,7),{round}=currencyMath(d.currency),opening=d.finance?.[period]?.opening;
  const cash=Number.isFinite(opening)?cashPosition(d.rows.filter(r=>r.date.startsWith(period)&&r.date<=asOf),opening,d.currency).available:null;
  const assets=(d.planning?.assets ?? []).filter(x=>x.valuedAt<=asOf),liabilities=(d.planning?.liabilities ?? []).filter(x=>x.valuedAt<=asOf);
  const debts=(d.planning?.debts ?? []).filter(x=>x.startDate<=asOf).map(x=>({...x,balance:debtBalance({...x,payments:x.payments.filter(p=>p.date<=asOf)},d.currency)}));
  const futureValuations=[...(d.planning?.assets ?? []),...(d.planning?.liabilities ?? [])].filter(x=>x.valuedAt>asOf);
  const assetTotal=round(assets.reduce((n,x)=>n+x.amount,0)),liabilityTotal=round(liabilities.reduce((n,x)=>n+x.amount,0)+debts.reduce((n,x)=>n+x.balance,0));
  const complete=cash!==null && !futureValuations.length;
  return {asOf,currency:d.currency,cash,assets,liabilities,debts,assetTotal,liabilityTotal,futureValuations,complete,total:complete?round(cash+assetTotal-liabilityTotal):null,knownNet:round((cash ?? 0)+assetTotal-liabilityTotal),limitations:[...(cash===null?['Falta declarar el saldo inicial del período.']:[]),...(futureValuations.length?['Hay valoraciones posteriores a la fecha consultada; se excluyen del cálculo.']:[]),'Valores declarados por el usuario, sin tasación ni cotizaciones externas. El objetivo de ahorro no se suma al efectivo.']};
}
