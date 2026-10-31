import test from 'node:test';
import assert from 'node:assert/strict';
import { saveBudget, budgetSummary } from '../src/workspace/budgets.mjs';
const row=(id,date,amount,financialType='opex')=>({id,date,amount,financialType,type:'gasto',category:'Comida'});
test('period budgets inherit old limits but preserve explicit zero and compare prior month',()=>{
 const d={currency:'USD',budgets:{Comida:100},rows:[row('a','2026-09-01',50),row('b','2026-10-01',80),row('capital','2026-10-01',500,'capital')]};
 const n=saveBudget(d,'2026-10','Comida',0),r=budgetSummary(n,'2026-10').find(x=>x.category==='Comida');
 assert.equal(r.limit,0);assert.equal(r.actual,80);assert.equal(r.previous,50);assert.equal(r.changePercent,60);assert.equal(r.over,80);assert.equal(d.planning,undefined);
 assert.equal(budgetSummary(n,'2026-11').find(x=>x.category==='Comida').limit,100);
});
test('missing history and previous zero do not invent percentages; currency precision retained',()=>{
 const d={currency:'CLP',budgets:{},rows:[row('a','2026-10-01',80)]};
 assert.equal(budgetSummary(d,'2026-10')[0].previous,null);assert.equal(budgetSummary(d,'2026-10')[0].changePercent,null);
 assert.throws(()=>saveBudget(d,'2026-13','Comida',1),/fecha/); assert.throws(()=>saveBudget(d,'2026-10','__proto__',1),/categoría/);
 assert.equal(budgetSummary(saveBudget(d,'2026-10','Comida',90.3),'2026-10')[0].limit,90.3);
});
