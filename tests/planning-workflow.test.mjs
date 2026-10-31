import test from 'node:test';
import assert from 'node:assert/strict';
import {IDBFactory} from 'fake-indexeddb';
import {openWorkspaceStorage} from '../src/workspace/storage.mjs';
import {emptyClient} from '../src/workspace/clients.mjs';
import {createPlanningEditor,editorValues,changeEditorValue,applyPlanningEditor} from '../src/workspace/planning-editor.mjs';
import {confirmOccurrence} from '../src/workspace/recurrences.mjs';
import {workspaceReport} from '../src/workspace/portfolio.mjs';
import {encodeSnapshot,decodeSnapshot} from '../src/workspace/snapshot.mjs';
import {evaluateAlerts} from '../src/workspace/alerts.mjs';

test('forms to storage to backup: recurring, debt, invoice, budget and wealth reconcile together',async()=>{
 let d=emptyClient('Mi empresa','CLP','2026-10');d.finance['2026-10'].opening=1000;
 function submit(kind,id,values,reference='') {const e=createPlanningEditor(kind,d,'2026-10',reference,id);d=applyPlanningEditor(d,e,{...editorValues(e),...values});}
 submit('recurrences','rec',{description:'Internet',category:'Servicios',amount:'100',type:'gasto',financialType:'opex',startDate:'2026-10-01'});
 d=confirmOccurrence(d,'rec','2026-10-01');d=confirmOccurrence(d,'rec','2026-10-01');
 submit('debts','loan',{name:'Préstamo',principal:'1000',startDate:'2026-10-01'});
 submit('payment','pay',{date:'2026-10-02',principal:'200',interest:'10',fee:'5'},'loan');
 submit('assets','asset',{name:'Equipo',amount:'500',valuedAt:'2026-10-01'});
 submit('liabilities','liability',{name:'Otra obligación',amount:'50',valuedAt:'2026-10-01'});
 submit('budget','b',{period:'2026-10',category:'Servicios',limit:'50'});
 submit('dues','invoice',{name:'Factura A',counterparty:'Cliente',direction:'receivable',amount:'1000',dueDate:'2026-11-01',expectedDate:''});
 submit('settlement','receipt',{date:'2026-10-04',amount:'300',rowId:''},'invoice');
 const report=workspaceReport(d,'2026-10','business');assert.equal(report.cash.available,985);assert.equal(report.statement.netProfit,185);assert.equal(report.netWorth.total,635);assert.equal(report.scheduled.closing,1685);assert.ok(evaluateAlerts(d,{asOf:'2026-10-31',period:'2026-10',profile:'business'}).items.some(a=>a.kind==='budget'));
 const state={profile:'business',entity:0,period:'2026-10',datasets:{business:d}},options={indexedDB:new IDBFactory(),legacyStorage:{getItem:()=>null},key:'finflow-open-v1',initialState:state};
 const store=await openWorkspaceStorage(options);await store.save(state);store.close();
 const reopened=await openWorkspaceStorage(options);assert.deepEqual(reopened.read().datasets.business.planning,d.planning);
 const mobile=decodeSnapshot(encodeSnapshot(reopened.read(),{source:'web',scope:'local'})).state;assert.equal(workspaceReport(mobile.datasets.business,'2026-10','business').netWorth.total,635);
 const corrupt=structuredClone(state);corrupt.datasets.business.rows=corrupt.datasets.business.rows.filter(r=>r.id!=='debt:pay:principal');await assert.rejects(reopened.save(corrupt),/pago/);assert.equal(reopened.read().datasets.business.rows.length,d.rows.length);reopened.close();
});
test('both form renderers receive the same safe type change and invalid values cannot commit',()=>{
 const d=emptyClient('Personal','KWD','2026-10'),e=createPlanningEditor('recurrences',d,'2026-10','','r');
 const values=changeEditorValue(editorValues(e),'type','ingreso');assert.equal(values.financialType,'revenue');
 assert.throws(()=>applyPlanningEditor(d,e,{...values,description:'Salario',amount:'Infinity'}),/importe/);
 assert.deepEqual(d.rows,[]);
});
