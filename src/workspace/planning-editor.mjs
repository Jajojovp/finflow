import { saveRecurrence } from './recurrences.mjs';
import { saveDebt, payDebt, simulateLoan } from './debts.mjs';
import { saveValuation } from './net-worth.mjs';
import { saveBudget } from './budgets.mjs';
import { date, fail } from './planning-contract.mjs';
import { saveDue, settleDue, linkDuePayment } from './dues.mjs';

/** @typedef {{name:string,label:string,value:string,type:string,required:boolean,options:{value:string,label:string}[]}} EditorField */
/** @typedef {{kind:string,id:string,parentId:string,title:string,note:string,fields:EditorField[]}} PlanningEditor */
const field=(name,label,value='',type='text',required=true,options=[])=>({name,label,value:String(value ?? ''),type,required,options});
const choices=entries=>entries.map(([value,label])=>({value,label}));
/** @returns {PlanningEditor} */
export function createPlanningEditor(kind, d, period, id, newId) {
  date(period+'-01');const item=(d.planning?.[kind] ?? []).find(x=>x.id===id) ?? {};
  const common={kind,id:id||newId,parentId:'',title:'',note:'Los datos se guardan solo en este espacio y en su moneda: '+d.currency+'.',fields:[]};
  if(kind==='recurrences') return {...common,title:id?'Editar recurrente':'Nuevo recurrente',fields:[
    field('description','Descripción',item.description),field('amount','Importe',item.amount ?? '', 'number'),field('category','Categoría',item.category ?? 'Otros'),
    field('type','Tipo',item.type ?? 'gasto','select',true,choices([['gasto','Gasto'],['ingreso','Ingreso']])),
    field('financialType','Clasificación',item.financialType ?? 'opex','select',true,choices([['opex','Gasto operativo'],['cogs','Coste de ventas'],['interest','Intereses'],['tax','Impuestos'],['revenue','Ventas / ingresos'],['other_income','Otros ingresos']])),
    field('behavior','Comportamiento del coste',item.behavior ?? '','select',false,choices([['','Pendiente / no aplica'],['fixed','Fijo'],['variable','Variable']])),
    field('startDate','Fecha de inicio',item.startDate ?? period+'-01','date'),field('endDate','Fecha final (opcional)',item.endDate,'date',false),
    field('frequency','Frecuencia',item.frequency ?? 'monthly','select',true,choices([['weekly','Semanal'],['monthly','Mensual'],['yearly','Anual']])),field('interval','Cada cuántos intervalos (1–12)',item.interval ?? 1,'number')],note:common.note+' La plantilla no registra pagos automáticamente. Revisa y confirma cada ocurrencia.'};
  if(kind==='debts') return {...common,title:id?'Editar deuda':'Declarar deuda',fields:[field('name','Nombre',item.name),field('principal','Capital inicial declarado',item.principal ?? '','number'),field('startDate','Fecha del saldo inicial',item.startDate ?? period+'-01','date'),field('dueDate','Vencimiento (opcional)',item.dueDate,'date',false),field('annualRate','Tasa nominal anual % (opcional)',item.annualRate,'number',false)],note:common.note+' Declarar la deuda no crea ingresos. Si recibes un desembolso, regístralo como capital en Movimientos. Los pagos ya registrados se conservan.'};
  if(kind==='payment') return {...common,id:newId,parentId:id,title:'Registrar o vincular un abono',fields:[field('date','Fecha del pago',period+'-01','date'),field('principal','Capital pagado',0,'number'),field('interest','Interés realmente pagado',0,'number'),field('fee','Comisión realmente pagada',0,'number'),field('rowIds','IDs de movimientos existentes, separados por coma (opcional)','','text',false)],note:common.note+' Sin IDs se crean movimientos separados de capital, interés y comisión. Con IDs se vinculan gastos activos de igual fecha, importes y clasificación; no se vuelven a crear.'};
  if(['assets','liabilities'].includes(kind)) return {...common,title:(id?'Editar ':'Añadir ')+(kind==='assets'?'activo':'pasivo'),fields:[field('name','Nombre',item.name),field('amount','Valor declarado',item.amount ?? '','number'),field('valuedAt','Fecha de valoración',item.valuedAt ?? period+'-01','date')],note:common.note+' No incluyas efectivo, metas de ahorro ni deudas ya registradas: se contabilizan por separado. No se consultan precios de mercado.'};
  if(kind==='budget') return {...common,title:'Presupuesto por categoría y mes',fields:[field('period','Período',period,'month'),field('category','Categoría',id ?? ''),field('limit','Límite (0 significa cero gasto previsto)',d.planning?.budgets?.[period]?.[id] ?? d.budgets?.[id] ?? '','number')],note:common.note+' Se aplica solo al mes indicado. Los límites antiguos se heredan cuando no existe uno específico.'};
  if(kind==='dues') return {...common,title:id?'Editar partida':'Nueva cuenta pendiente',fields:[field('name','Referencia / concepto',item.name),field('counterparty','Contraparte',item.counterparty),field('direction','Dirección',item.direction ?? 'receivable','select',true,choices([['receivable','Por cobrar'],['payable','Por pagar']])),field('amount','Importe total declarado',item.amount ?? '','number'),field('dueDate','Vencimiento',item.dueDate ?? period+'-01','date'),field('expectedDate','Fecha prevista si difiere del vencimiento',item.expectedDate,'date',false),field('cancelled','Estado',String(item.cancelled ?? false),'select',true,choices([['false','Activa'],['true','Anulada']])),field('cancelledAt','Fecha de anulación (si corresponde)',item.cancelledAt ?? period+'-01','date',false)],note:common.note+' La agenda no crea ingresos o gastos realizados. Anular conserva los pagos anteriores. La fecha prevista es un supuesto, no una confirmación de cobro.'};
  if(kind==='settlement') return {...common,id:newId,parentId:id,title:'Registrar / vincular cobro o pago',fields:[field('date','Fecha del nuevo movimiento',period+'-01','date'),field('amount','Importe del nuevo movimiento (sin ID)','','number',false),field('rowId','ID de un movimiento existente (opcional)','','text',false)],note:common.note+' Con un ID se usa la fecha e importe del movimiento existente, sin duplicarlo. Sin ID, confirma un importe real para crear el movimiento; los gastos quedan pendientes de clasificación.'};
  if(kind==='simulation') return {...common,title:'Simular una cuota',fields:[field('principal','Capital supuesto','','number'),field('annualRate','Tasa nominal anual supuesta %','','number'),field('months','Plazo supuesto en meses',12,'number')],note:'Escenario matemático con supuestos declarados; no modifica tus deudas ni representa una oferta de crédito.'};
  fail('No se encontró el formulario de planificación.');
}
export const editorValues=editor=>Object.fromEntries(editor.fields.map(f=>[f.name,f.value]));
export const changeEditorValue=(values,key,value)=>({...values,[key]:value,...(key==='type'?{financialType:value==='ingreso'?'revenue':'opex'}:{})});
export function applyPlanningEditor(d, editor, values) {
  const n=key=>values[key]===''||values[key]===undefined?NaN:Number(values[key]);
  if(editor.kind==='recurrences') {const old=d.planning?.recurrences?.find(x=>x.id===editor.id);return saveRecurrence(d,{...old,id:editor.id,description:values.description,amount:n('amount'),category:values.category,type:values.type,financialType:values.financialType,behavior:values.behavior ?? '',startDate:values.startDate,endDate:values.endDate || null,frequency:values.frequency,interval:n('interval')});}
  if(editor.kind==='debts') return saveDebt(d,{id:editor.id,name:values.name,principal:n('principal'),startDate:values.startDate,dueDate:values.dueDate || null,annualRate:values.annualRate===''?null:n('annualRate')});
  if(editor.kind==='payment') return payDebt(d,editor.parentId,{id:editor.id,date:values.date,principal:n('principal'),interest:n('interest'),fee:n('fee'),...(values.rowIds?.trim()?{rowIds:values.rowIds.split(',').map(x=>x.trim())}:{})});
  if(['assets','liabilities'].includes(editor.kind)) return saveValuation(d,editor.kind,{id:editor.id,name:values.name,amount:n('amount'),valuedAt:values.valuedAt});
  if(editor.kind==='budget') return saveBudget(d,values.period,values.category,n('limit'));
  if(editor.kind==='dues') return saveDue(d,{id:editor.id,name:values.name,counterparty:values.counterparty,direction:values.direction,amount:n('amount'),dueDate:values.dueDate,expectedDate:values.expectedDate || null,cancelled:values.cancelled==='true',cancelledAt:values.cancelled==='true'?values.cancelledAt:null});
  if(editor.kind==='settlement') return values.rowId?.trim()?linkDuePayment(d,editor.parentId,values.rowId.trim()):settleDue(d,editor.parentId,{id:editor.id,date:values.date,amount:n('amount')});
  fail('Este formulario no guarda datos financieros.');
}
export function evaluateLoanSimulation(values,currency) { return simulateLoan(Number(values.principal),values.annualRate===''?null:Number(values.annualRate),Number(values.months),currency); }
