import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSnapshot, decodeSnapshot } from '../src/workspace/snapshot.mjs';
import { emptyClient } from '../src/workspace/clients.mjs';
import { saveDebt, payDebt } from '../src/workspace/debts.mjs';
import { saveRecurrence } from '../src/workspace/recurrences.mjs';
import { saveBudget } from '../src/workspace/budgets.mjs';
test('planning survives cross-platform backup; broken payment links and malformed schedules fail closed',()=>{
 let d=saveDebt(emptyClient('X','KWD','2026-10'),{id:'l',name:'Préstamo',principal:1000,startDate:'2026-10-01'});
 d=payDebt(d,'l',{id:'p',date:'2026-10-10',principal:100,interest:1.234,fee:0});
 d=saveRecurrence(d,{id:'r',description:'Internet',amount:15.123,type:'gasto',category:'Servicios',startDate:'2026-10-31',frequency:'monthly',interval:1});
 d=saveBudget(d,'2026-10','Servicios',50.123);
 const s={profile:'personal',entity:0,period:'2026-10',datasets:{personal:d}};
 const decoded=decodeSnapshot(encodeSnapshot(s),{scope:'local'}).state;
 assert.deepEqual(decoded.datasets.personal.planning,d.planning);
 const broken=structuredClone(s);broken.datasets.personal.rows=[];assert.throws(()=>encodeSnapshot(broken),/pago/);
 const invalid=structuredClone(s);invalid.datasets.personal.planning.recurrences[0].interval=0;assert.throws(()=>encodeSnapshot(invalid),/intervalo/);
});
