import test from 'node:test';
import assert from 'node:assert/strict';
import { incomeStatement, breakEven, detectLeaks, cashPosition, simulateCosts } from '../src/workspace/finance.mjs';
const row=(type,amount,financialType,behavior)=>({date:'2026-10-01',description:'X',category:'Otros',type,amount,financialType,behavior});
test('management income statement separates capital flows and noncash depreciation',()=>{
  const r=incomeStatement([row('ingreso',10000,'revenue'),row('gasto',3000,'cogs','variable'),row('gasto',2000,'opex','fixed'),row('gasto',500,'depreciation'),row('gasto',100,'interest'),row('gasto',600,'tax'),row('ingreso',9000,'capital'),row('gasto',4000,'capital')]);
  assert.equal(r.revenue,10000);assert.equal(r.grossProfit,7000);assert.equal(r.ebitda,5000);assert.equal(r.operatingProfit,4500);assert.equal(r.netProfit,3800);assert.equal(r.unclassified,0);
});
test('break-even handles contribution margin, units and missing classifications',()=>{
  const rows=[row('ingreso',10000,'revenue'),row('gasto',4000,'cogs','variable'),row('gasto',3000,'opex','fixed')];
  const r=breakEven(rows,50);assert.equal(r.sales,5000);assert.equal(r.units,100);assert.equal(r.safety,5000);
  assert.equal(breakEven([...rows,row('gasto',10,'opex')]).sales,null);
  assert.equal(breakEven([row('ingreso',100,'revenue'),row('gasto',100,'cogs','variable')]).sales,null);
  assert.equal(breakEven([]).sales,null);
});
test('cash uses opening balance but excludes noncash depreciation',()=>{
  const r=cashPosition([row('ingreso',100,'revenue'),row('gasto',20,'opex'),row('gasto',30,'depreciation')],50);
  assert.equal(r.available,130);assert.equal(r.net,80);
});

test('personal savings excludes borrowing and capital repayments while cash includes both',()=>{
  const rows=[row('ingreso',1000,'revenue'),row('ingreso',2000,'capital'),row('gasto',400,'opex'),row('gasto',300,'capital'),row('gasto',50,'depreciation')];
  const cash=cashPosition(rows,100,'CLP');
  assert.equal(cash.available,2400);assert.equal(cash.net,2300);
  assert.equal(cash.rate,2300/3000*100);
  assert.equal(cash.savingsIncome,1000);assert.equal(cash.savingsExpense,400);
  assert.equal(cash.savingsNet,600);assert.equal(cash.savingsRate,60);
  assert.equal(cashPosition([row('ingreso',2000,'capital')]).savingsRate,null);
  assert.equal(cashPosition([row('ingreso',100,'revenue'),row('gasto',150,'opex')]).savingsRate,-50);
});
test('leaks use observed evidence: duplicates, category spikes and recurrence',()=>{
  const current=[{...row('gasto',50,'opex','fixed'),id:'a',description:'Software',category:'Suscripciones'},{...row('gasto',50,'opex','fixed'),id:'b',description:'Software',category:'Suscripciones'}, {...row('gasto',300,'opex','fixed'),id:'c',category:'Servicios'}];
  const previous=[{...row('gasto',50,'opex','fixed'),category:'Suscripciones'}, {...row('gasto',100,'opex','fixed'),category:'Servicios'}];
  const findings=detectLeaks(current,previous,{});
  assert.ok(findings.some(f=>f.kind==='duplicate'&&f.amount===50));
  assert.ok(findings.some(f=>f.kind==='spike'&&f.amount===200));
  assert.ok(findings.some(f=>f.kind==='recurring'));
});
test('cost scenarios recalculate variable costs with sales and do not double count',()=>{
  const rows=[row('ingreso',10000,'revenue'),row('gasto',4000,'cogs','variable'),row('gasto',3000,'opex','fixed')];
  const result=simulateCosts(rows,{salesChange:10,fixedReduction:20,variableReduction:0});
  assert.equal(result.revenue,11000);assert.equal(result.fixed,2400);assert.equal(result.variable,4400);assert.equal(result.profit,4200);
});
