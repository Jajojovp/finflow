import { currencyMath } from './currencies.mjs';
import { amount, date, text, identifier, fail, upsert, addRows, linkedRowIds } from './planning-contract.mjs';

export function debtBalance(debt, currency) { return currencyMath(currency).round(debt.principal - (debt.payments ?? []).reduce((n,p)=>n+p.principal,0)); }
export function validateDebt(input, currency) {
  const {round}=currencyMath(currency), principal=round(amount(input.principal,{positive:true})), payments=input.payments ?? [];
  if(!principal) fail('Revisa el capital en la precisión de esta moneda.');
  const startDate=date(input.startDate), dueDate=input.dueDate ? date(input.dueDate) : null;
  if(dueDate && dueDate<startDate) fail('El vencimiento no puede preceder al inicio.');
  const annualRate=input.annualRate ?? null;
  if(annualRate!==null && (!Number.isFinite(annualRate)||annualRate<0||annualRate>1000)) fail('Revisa la tasa anual declarada.');
  if(!Array.isArray(payments)||payments.length>500) fail('Cada deuda admite hasta 500 pagos.');
  const ids=new Set();
  for(const p of payments) {
    identifier(p.id); date(p.date); if(p.date<startDate) fail('El pago no puede preceder al inicio de la deuda.');
    for(const k of ['principal','interest','fee']) amount(p[k]);
    if(ids.has(p.id)||!Array.isArray(p.rowIds)||!p.rowIds.length||p.rowIds.length>3||p.rowIds.some(id=>typeof id!=='string')) fail('Revisa los identificadores y vínculos de pagos.');
    ids.add(p.id);
  }
  if(round(payments.reduce((n,p)=>n+p.principal,0))>principal) fail('El capital inicial no puede ser inferior al capital pagado.');
  return {...input,id:identifier(input.id),name:text(input.name),principal,startDate,dueDate,annualRate,payments};
}
export function saveDebt(d, input) {
  const existing=d.planning?.debts?.find(x=>x.id===input.id);
  return upsert(d,'debts',validateDebt({...input,payments:existing?.payments ?? []},d.currency));
}
export function unlinkDebtPayment(d,debtId,paymentId) {
  const debt=d.planning?.debts?.find(x=>x.id===debtId);if(!debt)fail('No se encontró la deuda.');
  return upsert(d,'debts',{...debt,payments:debt.payments.filter(p=>p.id!==paymentId)});
}
export function payDebt(d, debtId, input) {
  const debt=d.planning?.debts?.find(x=>x.id===debtId); if(!debt) fail('No se encontró la deuda.');
  const {round,sum}=currencyMath(d.currency), p={id:identifier(input.id),date:date(input.date),principal:round(amount(input.principal)),interest:round(amount(input.interest)),fee:round(amount(input.fee))};
  const previous=debt.payments.find(x=>x.id===p.id);
  if(previous) {
    if(['date','principal','interest','fee'].some(k=>previous[k]!==p[k])||(input.rowIds && JSON.stringify(input.rowIds)!==JSON.stringify(previous.rowIds))) fail('El identificador del pago ya corresponde a otro abono.');
    return d;
  }
  if(p.date<debt.startDate||round(p.principal+p.interest+p.fee)<=0) fail('Revisa la fecha y el importe del pago.');
  if(p.principal>debtBalance(debt,d.currency)) fail('El capital pagado excede el saldo pendiente.');
  const parts=[['principal','capital'],['interest','interest'],['fee','opex']].filter(([key])=>p[key]>0);
  let next=d;
  if(input.rowIds) {
    if(!Array.isArray(input.rowIds)||new Set(input.rowIds).size!==input.rowIds.length||!input.rowIds.length||input.rowIds.length>3) fail('Revisa los movimientos a vincular.');
    const linked=linkedRowIds(d); if(input.rowIds.some(id=>linked.has(id))) fail('El movimiento ya está vinculado a un pago.');
    const rows=input.rowIds.map(id=>d.rows.find(r=>r.id===id));
    if(rows.some(r=>!r||r.type!=='gasto'||r.date!==p.date||!parts.some(([,kind])=>kind===r.financialType))) fail('Los movimientos deben ser gastos activos de la misma fecha y clasificación.');
    for(const [key,kind] of parts) if(sum(rows.filter(r=>r.financialType===kind))!==p[key]) fail('Los importes de capital, interés y comisión no coinciden.');
    p.rowIds=[...input.rowIds];
  } else {
    const rows=parts.map(([key,kind])=>({id:`debt:${p.id}:${key}`,date:p.date,description:`${debt.name} · ${key==='principal'?'capital':key==='interest'?'interés':'comisión'}`.slice(0,200),category:'Deudas',type:'gasto',amount:p[key],financialType:kind,behavior:'',source:'Pago de deuda',debtId}));
    next=addRows(d,rows); p.rowIds=rows.map(r=>r.id);
  }
  return upsert(next,'debts',validateDebt({...debt,payments:[...debt.payments,p]},d.currency));
}
export function simulateLoan(principal, annualRate, months, currency) {
  amount(principal,{positive:true});
  if(!Number.isFinite(annualRate)||annualRate<0||annualRate>1000) fail('Indica una tasa anual supuesta, entre 0 y 1.000%.');
  if(!Number.isInteger(months)||months<1||months>600) fail('Indica un plazo de 1 a 600 meses.');
  const {round}=currencyMath(currency), rate=annualRate/1200;
  const payment=round(rate ? principal*rate/(1-Math.pow(1+rate,-months)) : principal/months);
  let balance=round(principal); const schedule=[];
  for(let i=1;i<=months && balance>0;i++) {
    const interest=round(balance*rate), capital=i===months?balance:Math.min(balance,Math.max(0,round(payment-interest)));
    balance=round(balance-capital); schedule.push({number:i,principal:capital,interest,payment:round(capital+interest),balance});
  }
  return {payment,schedule,totalInterest:round(schedule.reduce((n,p)=>n+p.interest,0)),assumption:'Simulación a tasa nominal anual dividida entre doce; cuotas redondeadas, última cuota ajustada. Sin seguros, comisiones ni condiciones contractuales.'};
}
