import { currencyMath } from './currencies.mjs';
const kind = r => r.financialType || (r.type==='ingreso'?'revenue':'unclassified');
export function cashPosition(rows,opening=0,currency='EUR') {
  const {round:rounded,sum}=currencyMath(currency);
  const cashRows=rows.filter(r=>kind(r)!=='depreciation');
  const income=sum(cashRows.filter(r=>r.type==='ingreso')),expense=sum(cashRows.filter(r=>r.type==='gasto'));
  const net=rounded(income-expense);
  const savingsRows=cashRows.filter(r=>kind(r)!=='capital');
  const savingsIncome=sum(savingsRows.filter(r=>r.type==='ingreso')),savingsExpense=sum(savingsRows.filter(r=>r.type==='gasto'));
  const savingsNet=rounded(savingsIncome-savingsExpense);
  return {income,expense,net,available:rounded(opening+net),opening,rate:income>0?net/income*100:null,
    savingsIncome,savingsExpense,savingsNet,savingsRate:savingsIncome>0?savingsNet/savingsIncome*100:null};
}
export function incomeStatement(rows,currency='EUR') {
  const {round:rounded,sum}=currencyMath(currency);
  const amount=(type,flow)=>sum(rows.filter(r=>kind(r)===type&&r.type===flow));
  const revenue=amount('revenue','ingreso'),otherIncome=amount('other_income','ingreso');
  const cogs=amount('cogs','gasto'),opex=amount('opex','gasto');
  const depreciation=amount('depreciation','gasto'),interest=amount('interest','gasto'),tax=amount('tax','gasto');
  const unclassified=amount('unclassified','gasto');
  const grossProfit=rounded(revenue-cogs),ebitda=rounded(grossProfit-opex-unclassified);
  const operatingProfit=rounded(ebitda-depreciation),netProfit=rounded(operatingProfit+otherIncome-interest-tax);
  return {revenue,otherIncome,cogs,opex,depreciation,interest,tax,unclassified,grossProfit,ebitda,operatingProfit,netProfit,margin:revenue>0?netProfit/revenue*100:null};
}
export function breakEven(rows,unitPrice=0,currency='EUR') {
  const {round:rounded,sum}=currencyMath(currency);
  const revenue=incomeStatement(rows,currency).revenue;
  const costs=rows.filter(r=>r.type==='gasto'&&['cogs','opex','unclassified'].includes(kind(r)));
  const missing=costs.filter(r=>!['fixed','variable'].includes(r.behavior)||kind(r)==='unclassified');
  const fixed=sum(costs.filter(r=>r.behavior==='fixed')),variable=sum(costs.filter(r=>r.behavior==='variable'));
  const contribution=revenue>0?(revenue-variable)/revenue:null;
  const reason=missing.length?'Clasifica todos los gastos operativos como fijos o variables.':revenue<=0?'Registra ventas para calcular el margen de contribución.':contribution<=0?'El margen de contribución es cero o negativo: aumentar ventas sin cambiar costes no cubre los costes fijos.':null;
  const sales=reason?null:rounded(fixed/contribution);
  return {revenue,fixed,variable,contribution,sales,units:sales!==null&&unitPrice>0?Math.ceil(sales/unitPrice):null,safety:sales===null?null:rounded(revenue-sales),reason,missingCount:missing.length};
}
export function simulateCosts(rows,{salesChange=0,fixedReduction=0,variableReduction=0}={},currency='EUR') {
  const {round:rounded}=currencyMath(currency);
  const b=breakEven(rows,0,currency),revenue=rounded(b.revenue*(1+salesChange/100));
  const fixed=rounded(b.fixed*(1-fixedReduction/100)),variable=rounded(b.variable*(1+salesChange/100)*(1-variableReduction/100));
  return {revenue,fixed,variable,profit:b.reason?null:rounded(revenue-fixed-variable),reason:b.reason};
}
export function detectLeaks(rows,previous=[],budgets={},currency='EUR') {
  const {round:rounded,sum}=currencyMath(currency);
  const costs=rows.filter(r=>r.type==='gasto'&&!['depreciation','capital'].includes(kind(r)));
  const before=previous.filter(r=>r.type==='gasto'&&!['depreciation','capital'].includes(kind(r)));
  const findings=[],groups=new Map(),categories=Object.create(null);
  for(const r of costs){const key=JSON.stringify([r.date,r.description.trim().toLowerCase(),r.amount]);const group=groups.get(key)||[];group.push(r);groups.set(key,group);categories[r.category]=(categories[r.category]||0)+r.amount;}
  for(const group of groups.values()) if(group.length>1)findings.push({kind:'duplicate',title:'Posible cargo duplicado',category:group[0].category,description:group[0].description,amount:rounded((group.length-1)*group[0].amount),evidence:`${group.length} cargos con la misma fecha, descripción e importe.`,action:'Comprueba recibos y referencias antes de decidir si existe un duplicado.'});
  for(const [category,value] of Object.entries(categories)) {
    const baseline=sum(before.filter(r=>r.category===category));
    if(baseline>0&&value>baseline*1.2&&value-baseline>1)findings.push({kind:'spike',title:'Esta categoría creció más de un 20%',category,amount:rounded(value-baseline),baseline,current:rounded(value),percent:(value-baseline)/baseline*100,evidence:`Comparación con el mes anterior disponible: ${rounded(baseline)} → ${rounded(value)}.`,action:'Revisa si aumentó el volumen de actividad, el precio o hay gastos extraordinarios.'});
    const limit=Number(budgets[category]);
    if(Number.isFinite(limit)&&limit>0&&value>limit)findings.push({kind:'budget',title:'Presupuesto de categoría superado',category,amount:rounded(value-limit),evidence:`Gasto ${rounded(value)} frente a presupuesto ${limit}.`,action:'Revisa las partidas antes de cambiar tu presupuesto.'});
    if(/suscrip|comisi[oó]n|tarifa/i.test(category))findings.push({kind:'recurring',title:/comisi|tarifa/i.test(category)?'Comisiones que conviene revisar':'Gastos recurrentes a la vista',category,amount:rounded(value),evidence:`Importe registrado en ${category} durante el periodo.`,action:'Comprueba uso, precio y posibles alternativas. El total observado no equivale a ahorro garantizado.'});
  }
  const total=sum(costs),limit=Number(budgets.__total);
  if(limit>0&&total>limit)findings.push({kind:'budget',title:'Presupuesto mensual superado',category:'Todas',amount:rounded(total-limit),evidence:`Gastos ${total} frente al límite ${limit}.`,action:'Revisa las categorías con mayor peso para decidir dónde actuar.'});
  return findings;
}
