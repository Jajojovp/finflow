import test from 'node:test';
import assert from 'node:assert/strict';
import { saveValuation, netWorth } from '../src/workspace/net-worth.mjs';
import { saveDebt, payDebt } from '../src/workspace/debts.mjs';
test('cash counted once, dated assets and debt principal reconcile without goal duplication',()=>{
 let d={currency:'CLP',rows:[{id:'i',date:'2026-10-01',type:'ingreso',amount:500}],finance:{'2026-10':{opening:100}},goal:{saved:200},budgets:{}};
 d=saveDebt(d,{id:'debt',name:'Crédito',principal:100,startDate:'2026-10-01'});
 d=saveValuation(d,'assets',{id:'car',name:'Auto',amount:1000,valuedAt:'2026-10-20'});
 d=saveValuation(d,'liabilities',{id:'other',name:'Pasivo no registrado en Deudas',amount:50,valuedAt:'2026-10-20'});
 assert.equal(netWorth(d,'2026-10-31').total,1450);assert.equal(netWorth(d,'2026-10-31').cash,600);
 const paid=payDebt(d,'debt',{id:'p',date:'2026-10-25',principal:25,interest:0,fee:0});
 assert.equal(netWorth(paid,'2026-10-31').total,1450);assert.equal(netWorth(paid,'2026-10-21').total,1450);
});
test('missing cash and future valuations remain explicit, cash items and foreign units are rejected',()=>{
 const d=saveValuation({currency:'USD',rows:[],finance:{}},'assets',{id:'a',name:'Equipo',amount:100,valuedAt:'2026-11-01'});
 const n=netWorth(d,'2026-10-31');assert.equal(n.total,null);assert.equal(n.cash,null);assert.equal(n.futureValuations.length,1);
 assert.throws(()=>saveValuation(d,'assets',{id:'b',name:'Cash',amount:1,valuedAt:'2026-10-31',kind:'cash'}),/efectivo/);
 assert.throws(()=>saveValuation(d,'assets',{id:'b',name:'CLP',amount:1,valuedAt:'2026-10-31',currency:'CLP'}),/moneda/);
});
