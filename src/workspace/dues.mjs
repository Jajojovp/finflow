import { currencyMath } from './currencies.mjs';
import { date, text, identifier, amount, fail, upsert, addRows, linkedRowIds } from './planning-contract.mjs';
export const dueStatusLabel = status => ({cancelled:'Anulada',settled:'Saldada',partial:'Parcial','partial-overdue':'Parcial y vencida',overdue:'Vencida',pending:'Pendiente'})[status] ?? 'Por revisar';

export function validateDue(input, currency) {
  if(!['receivable','payable'].includes(input.direction)) fail('Selecciona cuenta por cobrar o por pagar.');
  const paymentRowIds=input.paymentRowIds ?? [];
  if(!Array.isArray(paymentRowIds)||paymentRowIds.length>500||paymentRowIds.some(x=>typeof x!=='string'||!x||x.length>100)||new Set(paymentRowIds).size!==paymentRowIds.length) fail('Revisa los vínculos de pagos de la partida.');
  if(input.cancelled!==undefined && typeof input.cancelled!=='boolean') fail('Revisa la anulación de la partida.');
  const cancelled=input.cancelled ?? false,cancelledAt=cancelled?date(input.cancelledAt):null;
  return {...input,id:identifier(input.id),name:text(input.name),counterparty:text(input.counterparty,'la contraparte'),amount:currencyMath(currency).round(amount(input.amount,{positive:true})),dueDate:date(input.dueDate),expectedDate:input.expectedDate?date(input.expectedDate):null,cancelled,cancelledAt,paymentRowIds};
}
export function dueStatus(d, due, asOf) {
  date(asOf);const {round,sum}=currencyMath(d.currency);
  const payments=due.paymentRowIds.map(id=>d.rows.find(r=>r.id===id)).filter(Boolean), paid=sum(payments.filter(r=>r.date<=asOf)),outstanding=round(due.amount-paid);
  const cancelled=due.cancelled && due.cancelledAt<=asOf,overdue=due.dueDate<asOf&&outstanding>0;
  return {paid,outstanding,status:cancelled?'cancelled':outstanding<=0?'settled':paid>0?(overdue?'partial-overdue':'partial'):(overdue?'overdue':'pending'),overdue,cancelled,payments};
}
function paymentRows(d,due) {
  const type=due.direction==='receivable'?'ingreso':'gasto';
  const rows=due.paymentRowIds.map(id=>d.rows.find(r=>r.id===id));
  if(rows.some(r=>!r||r.type!==type||['capital','depreciation'].includes(r.financialType))) fail('Los movimientos de la partida deben estar activos y coincidir con su dirección; capital y depreciación no son pagos de facturas.');
  return rows;
}
export function saveDue(d, input) {
  const old=d.planning?.dues?.find(x=>x.id===input.id),due=validateDue({...old,...input,paymentRowIds:old?.paymentRowIds ?? []},d.currency);
  if(old?.paymentRowIds.length && due.direction!==old.direction) fail('No cambies la dirección de una partida con pagos vinculados.');
  if(currencyMath(d.currency).sum(paymentRows(d,due))>due.amount) fail('El importe no puede ser inferior al total ya pagado.');
  return upsert(d,'dues',due);
}
export function linkDuePayment(d, dueId, rowId) {
  const due=d.planning?.dues?.find(x=>x.id===dueId);if(!due) fail('No se encontró la partida.');
  if(due.paymentRowIds.includes(rowId)) return d;
  if(due.cancelled) fail('La partida está anulada; reactívala antes de vincular pagos.');
  if(linkedRowIds(d).has(rowId)) fail('El movimiento ya está vinculado a otra partida o deuda.');
  const row=d.rows.find(r=>r.id===rowId);if(!row) fail('Selecciona un movimiento activo del mismo espacio.');
  const nextDue={...due,paymentRowIds:[...due.paymentRowIds,rowId]};paymentRows(d,nextDue);
  const {sum,round}=currencyMath(d.currency);if(sum(paymentRows(d,nextDue))>round(due.amount)) fail('El pago excede el saldo pendiente de la partida.');
  return upsert(d,'dues',nextDue);
}
export function settleDue(d, dueId, input) {
  const due=d.planning?.dues?.find(x=>x.id===dueId);if(!due) fail('No se encontró la partida.');
  const id='due:'+identifier(input.id),day=date(input.date),value=currencyMath(d.currency).round(amount(input.amount,{positive:true}));
  const existing=d.rows.find(r=>r.id===id);
  if(existing && due.paymentRowIds.includes(id) && existing.date===day && existing.amount===value) return d;
  if(existing) fail('El identificador del pago ya está utilizado.');
  if(due.cancelled) fail('La partida está anulada; reactívala antes de registrar pagos.');
  const status=dueStatus(d,due,'9999-12-31');if(value>status.outstanding) fail('El pago excede el saldo pendiente.');
  const type=due.direction==='receivable'?'ingreso':'gasto';
  const next=addRows(d,[{id,date:day,description:`${due.name} · ${due.counterparty}`.slice(0,200),type,category:type==='ingreso'?'Ventas':'Proveedores',amount:value,financialType:type==='ingreso'?'revenue':'unclassified',source:'Pago de partida',dueId}]);
  return linkDuePayment(next,dueId,id);
}
export function unlinkDuePayment(d, dueId, rowId) {
  const due=d.planning?.dues?.find(x=>x.id===dueId);if(!due) fail('No se encontró la partida.');
  return upsert(d,'dues',{...due,paymentRowIds:due.paymentRowIds.filter(id=>id!==rowId)});
}
export function validateDueLinks(d) {
  const used=new Set((d.planning?.debts ?? []).flatMap(x=>x.payments.flatMap(p=>p.rowIds)));
  for(const due of d.planning?.dues ?? []) {
    const rows=paymentRows(d,due);if(currencyMath(d.currency).sum(rows)>due.amount) fail('Los pagos superan el importe de la partida.');
    for(const id of due.paymentRowIds){if(used.has(id)) fail('Un movimiento no puede vincularse dos veces.');used.add(id);}
  }
}
