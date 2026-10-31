import test from 'node:test';
import assert from 'node:assert/strict';
import {portfolioSummary,workspaceReport} from '../src/workspace/portfolio.mjs';
import {emptyClient} from '../src/workspace/clients.mjs';
const client=(name,currency,opening)=>({...emptyClient(name,currency,'2026-10'),finance:{'2026-10':{opening}},rows:[{id:name,date:'2026-10-01',description:'Venta',category:'Ventas',type:'ingreso',financialType:'revenue',amount:100,source:'Manual'}]});
test('professional portfolio never adds CLP to USD or missing data and separates archived clients',()=>{
 const state={profile:'advisor',entity:0,datasets:{'advisor-0':client('A','CLP',100),'advisor-1':client('B','CLP',200),'advisor-2':client('C','USD',500),'advisor-3':{...client('Archivado','USD',5000),archived:true},personal:client('Privado','CLP',99999)}};
 const a=portfolioSummary(state,'2026-10');assert.equal(a.groups.find(g=>g.currency==='CLP').cash,500);assert.equal(a.groups.find(g=>g.currency==='USD').cash,600);assert.equal(a.clients.find(c=>c.index===3).archived,true);
 assert.equal(a.groups.reduce((n,g)=>n+g.clients.length,0),3);assert.throws(()=>portfolioSummary({...state,profile:'personal'},'2026-10'),/profesional/);
 const missing=structuredClone(state);delete missing.datasets['advisor-1'].finance['2026-10'];assert.equal(portfolioSummary(missing,'2026-10').groups.find(g=>g.currency==='CLP').cash,null);
});
test('client report contains only that client, period, unit, assumptions and evidence',()=>{
 const d=client('Mi cliente','CAD',100),report=workspaceReport(d,'2026-10','advisor');
 assert.equal(report.entity,'Mi cliente');assert.equal(report.currency,'CAD');assert.equal(report.period,'2026-10');assert.equal(report.statement.revenue,100);assert.equal(report.records.length,1);assert.equal(report.scheduled.weeks.length,13);
 assert.ok(report.limitations.length);assert.equal(report.remoteSharing,false);
});
