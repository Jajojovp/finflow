import { cashPosition } from './finance.mjs';
import { addDays, date,numericInput } from './planning-contract.mjs';

export function scheduleDefaults(d,period,profile) {
  date(period+'-01');const end=new Date(Date.UTC(Number(period.slice(0,4)),Number(period.slice(5,7)),0)).toISOString().slice(0,10),opening=d.finance?.[period]?.opening;
  const cash=Number.isFinite(opening)?cashPosition(d.rows.filter(r=>r.date.startsWith(period)),opening,d.currency).available:null;
  return {profile,startDate:addDays(end,1),opening:cash===null?'':String(cash),collectionDelayDays:'0',incomeChange:'0',costChange:'0',includeOverdue:'false'};
}
export function scheduleOptions(values) {
  return {profile:values.profile,startDate:values.startDate,opening:values.opening.trim()===''?null:numericInput(values.opening),collectionDelayDays:numericInput(values.collectionDelayDays),incomeChange:numericInput(values.incomeChange),costChange:numericInput(values.costChange),includeOverdue:values.includeOverdue==='true'};
}
export const scheduledFields=[{key:'startDate',label:'Inicio del intervalo',type:'date'},{key:'opening',label:'Caja inicial en esa fecha (vacío: desconocida)',type:'number'},{key:'collectionDelayDays',label:'Atraso supuesto de cobros (días)',type:'number'},{key:'incomeChange',label:'Cambio de ingresos previstos (%)',type:'number'},{key:'costChange',label:'Cambio de costes previstos (%)',type:'number'}];
