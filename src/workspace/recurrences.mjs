import { validateTransaction } from './core.mjs';
import { currencyMath } from './currencies.mjs';
import { identifier, date, fail, upsert, addRows, addDays } from './planning-contract.mjs';

export function validateRecurrence(input, currency) {
  const startDate = date(input.startDate), endDate = input.endDate ? date(input.endDate) : null;
  if (!['weekly','monthly','yearly'].includes(input.frequency)) fail('Selecciona frecuencia semanal, mensual o anual.');
  if (!Number.isInteger(input.interval) || input.interval < 1 || input.interval > 12) fail('El intervalo debe ser de 1 a 12.');
  if (endDate && endDate < startDate) fail('La fecha final no puede preceder al inicio.');
  const financialType = input.financialType ?? (input.type === 'ingreso' ? 'revenue' : 'opex');
  const allowed = input.type === 'ingreso' ? ['revenue','other_income'] : ['opex','cogs','interest','tax','unclassified'];
  if (!allowed.includes(financialType)) fail('Clasifica el recurrente; registra capital y préstamos en Deudas.');
  if (input.paused !== undefined && typeof input.paused !== 'boolean') fail('Revisa el estado del recurrente.');
  const row = validateTransaction({...input, date:startDate, amount:currencyMath(currency).round(input.amount)});
  return {...input, id:identifier(input.id), description:row.description,category:row.category,type:row.type,amount:row.amount,financialType,startDate,endDate,paused:input.paused ?? false};
}
export function saveRecurrence(d, input) { return upsert(d, 'recurrences', validateRecurrence(input, d.currency)); }
function occurrenceDate(r, index) {
  if (r.frequency === 'weekly') return addDays(r.startDate, index * r.interval * 7);
  const original = new Date(r.startDate), months = index * r.interval * (r.frequency === 'yearly' ? 12 : 1);
  const first = new Date(r.startDate); first.setUTCDate(1); first.setUTCMonth(first.getUTCMonth() + months);
  const last = new Date(first); last.setUTCMonth(last.getUTCMonth() + 1); last.setUTCDate(0);
  first.setUTCDate(Math.min(original.getUTCDate(), last.getUTCDate()));
  return first.toISOString().slice(0,10);
}
export function recurrenceOccurrences(d, from, through) {
  date(from); date(through);
  if (through < from || Date.parse(through) - Date.parse(from) > 3660 * 86400000) fail('Revisa el intervalo de consulta (máximo diez años).');
  const recorded = new Set([...d.rows, ...(d.trash ?? [])].map(r=>r.id)), result = [];
  for (const raw of d.planning?.recurrences ?? []) {
    const r = validateRecurrence(raw, d.currency); if (r.paused) continue;
    const span = r.frequency === 'weekly' ? (Date.parse(from)-Date.parse(r.startDate))/604800000 : (Number(from.slice(0,4))-Number(r.startDate.slice(0,4)))*12+Number(from.slice(5,7))-Number(r.startDate.slice(5,7));
    const divisor = r.interval * (r.frequency === 'yearly' ? 12 : 1);
    for(let i=Math.max(0,Math.floor(span/divisor)-1);;i++) {
      const day=occurrenceDate(r,i); if(day>through || (r.endDate && day>r.endDate)) break;
      if(day<from) continue;
      const id=`rec:${r.id}:${day}`;
      result.push({id,recurrenceId:r.id,date:day,description:r.description,type:r.type,category:r.category,amount:r.amount,financialType:r.financialType,behavior:r.behavior ?? '',source:'Recurrente confirmado',confirmed:recorded.has(id)});
      if(result.length>5000) fail('Reduce el intervalo: hay más de 5.000 ocurrencias.');
    }
  }
  return result.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function confirmOccurrence(d, id, day) {
  const occurrence = recurrenceOccurrences(d,day,day).find(x=>x.recurrenceId===id);
  if(!occurrence) fail('La fecha no corresponde a una ocurrencia activa.');
  if(occurrence.confirmed) return d;
  const {confirmed:_, ...row}=occurrence;
  return addRows(d,[row]);
}
