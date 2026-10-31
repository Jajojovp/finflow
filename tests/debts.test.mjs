import test from 'node:test';
import assert from 'node:assert/strict';
import { saveDebt, debtBalance, payDebt, simulateLoan } from '../src/workspace/debts.mjs';
import { incomeStatement, cashPosition } from '../src/workspace/finance.mjs';
const blank=()=>({currency:'CLP',rows:[],trash:[]});
const loan={id:'loan',name:'Crédito',principal:1000,startDate:'2026-10-01',dueDate:'2026-12-01',annualRate:null};
const payment={id:'pay',date:'2026-10-15',principal:200,interest:20,fee:5};
test('pay principal separately from interest and fees; cash and result reconcile',()=>{
 const d=saveDebt(blank(),loan),n=payDebt(d,'loan',payment);
 assert.equal(debtBalance(n.planning.debts[0],n.currency),800); assert.equal(n.rows.length,3);
 assert.equal(n.rows.find(r=>r.amount===200).financialType,'capital');
 const statement=incomeStatement(n.rows,'CLP'); assert.equal(statement.interest,20); assert.equal(statement.opex,5);
 assert.equal(cashPosition(n.rows,1000,'CLP').available,775);
 assert.deepEqual(payDebt(n,'loan',payment),n); assert.equal(d.rows.length,0);
 assert.throws(()=>payDebt(n,'loan',{...payment,principal:100}),/identificador/);
 assert.throws(()=>payDebt(n,'loan',{...payment,id:'over',principal:801}),/saldo/);
});
test('existing payment links do not create duplicate rows and cannot be reused',()=>{
 const d=saveDebt(blank(),loan);d.rows=[{id:'existing',date:'2026-10-15',description:'Abono',category:'Deudas',type:'gasto',amount:200,financialType:'capital'}];
 const n=payDebt(d,'loan',{...payment,interest:0,fee:0,rowIds:['existing']});
 assert.equal(n.rows.length,1); assert.equal(debtBalance(n.planning.debts[0],'CLP'),800);
 assert.throws(()=>payDebt(n,'loan',{...payment,id:'reuse',interest:0,fee:0,rowIds:['existing']}),/vinculado/);
 assert.throws(()=>saveDebt(n,{...loan,principal:100}),/capital/);
});
test('unknown rates stay unknown and simulation requires explicit assumptions',()=>{
 assert.equal(saveDebt(blank(),loan).planning.debts[0].annualRate,null);
 assert.throws(()=>simulateLoan(1000,null,12,'USD'),/tasa/);
 assert.equal(simulateLoan(1200,0,12,'USD').payment,100);
 const simulated=simulateLoan(1000,12,12,'USD'); assert.equal(simulated.schedule.length,12); assert.equal(simulated.schedule.at(-1).balance,0);
 assert.equal(simulated.schedule.reduce((n,p)=>Math.round((n+p.principal)*100)/100,0),1000);
 assert.throws(()=>saveDebt(blank(),{...loan,startDate:'2026-02-30'}),/fecha/);
});
