import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateAlerts,dismissAlert,reviewAlerts,saveAlertPreferences} from '../src/workspace/alerts.mjs';
import {saveDue} from '../src/workspace/dues.mjs';
import {saveBudget} from '../src/workspace/budgets.mjs';
const blank=()=>({currency:'CLP',rows:[],finance:{'2026-10':{opening:0}},budgets:{},planning:{}});
test('alerts are local, explainable, dismissible by condition, and do not mutate or duplicate',()=>{
 let d=saveDue(blank(),{id:'a',name:'Factura vencida',counterparty:'Cliente',direction:'receivable',amount:100,dueDate:'2026-10-01'});
 d=saveBudget(d,'2026-10','Comida',50);d.rows=[{id:'e',date:'2026-10-02',type:'gasto',amount:100,category:'Comida',financialType:'opex'}];
 const before=structuredClone(d),a=evaluateAlerts(d,{asOf:'2026-10-31',period:'2026-10',profile:'business'});
 assert.ok(a.items.some(x=>x.kind==='overdue'));assert.ok(a.items.some(x=>x.kind==='budget'));assert.ok(a.items.every(x=>x.evidence&&x.destination));assert.equal(new Set(a.items.map(x=>x.id)).size,a.items.length);assert.deepEqual(d,before);
 const id=a.items.find(x=>x.kind==='budget').id;d=dismissAlert(d,id,'2026-10-31');assert.equal(evaluateAlerts(d,{asOf:'2026-10-31',period:'2026-10',profile:'business'}).items.find(x=>x.id===id).dismissed,true);
 d.rows[0].amount=101;assert.ok(evaluateAlerts(d,{asOf:'2026-10-31',period:'2026-10',profile:'business'}).items.some(x=>x.kind==='budget'&&!x.dismissed));
});
test('review frequency affects new badges, while disabled alerts produce no items or external work',()=>{
 let d=saveDue(blank(),{id:'a',name:'Factura',counterparty:'X',direction:'payable',amount:100,dueDate:'2026-10-01'});
 d=saveAlertPreferences(d,{enabled:true,frequency:'weekly'});d=reviewAlerts(d,'2026-10-31');
 const a=evaluateAlerts(d,{asOf:'2026-11-01',period:'2026-10',profile:'business'});assert.ok(a.items.length);assert.equal(a.newCount,0);assert.equal(a.delivery,'in-app-local');
 d=saveAlertPreferences(d,{enabled:false,frequency:'daily'});assert.deepEqual(evaluateAlerts(d,{asOf:'2026-11-01',period:'2026-10',profile:'business'}).items,[]);
});
