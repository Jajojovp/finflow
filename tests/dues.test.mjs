import test from 'node:test';
import assert from 'node:assert/strict';
import { saveDue, dueStatus, settleDue, linkDuePayment } from '../src/workspace/dues.mjs';
const blank=()=>({currency:'USD',rows:[],trash:[]});
const invoice={id:'inv',name:'Factura A',counterparty:'Cliente A',direction:'receivable',amount:1000,dueDate:'2026-10-10'};
test('partial settlement changes real cash only once; overdue, future and cancelled stay explicit',()=>{
 const d=saveDue(blank(),invoice),n=settleDue(d,'inv',{id:'pay',date:'2026-10-12',amount:300});
 assert.equal(d.rows.length,0);assert.equal(n.rows.length,1);assert.equal(dueStatus(n,n.planning.dues[0],'2026-10-31').outstanding,700);
 assert.equal(dueStatus(n,n.planning.dues[0],'2026-10-11').outstanding,1000);
 assert.equal(dueStatus(n,n.planning.dues[0],'2026-10-31').status,'partial-overdue');
 assert.deepEqual(settleDue(n,'inv',{id:'pay',date:'2026-10-12',amount:300}),n);
 assert.throws(()=>settleDue(n,'inv',{id:'extra',date:'2026-10-12',amount:701}),/saldo/);
 const cancelled=saveDue(n,{...n.planning.dues[0],cancelled:true,cancelledAt:'2026-10-20'});
 assert.equal(dueStatus(cancelled,cancelled.planning.dues[0],'2026-10-31').status,'cancelled');assert.equal(cancelled.rows.length,1);
 assert.throws(()=>settleDue(cancelled,'inv',{id:'c',date:'2026-10-31',amount:1}),/anulada/);
});
test('linking existing cash does not duplicate income and cannot cross obligations',()=>{
 let d=saveDue(blank(),invoice); d.rows=[{id:'receipt',date:'2026-10-05',description:'Cobro',category:'Ventas',type:'ingreso',financialType:'revenue',amount:500}];
 d=linkDuePayment(d,'inv','receipt');assert.equal(d.rows.length,1);assert.equal(dueStatus(d,d.planning.dues[0],'2026-10-31').outstanding,500);
 assert.deepEqual(linkDuePayment(d,'inv','receipt'),d);
 d=saveDue(d,{...invoice,id:'other'});assert.throws(()=>linkDuePayment(d,'other','receipt'),/vinculado/);
 assert.throws(()=>saveDue(d,{...invoice,amount:499}),/pagado/);
 assert.throws(()=>saveDue(d,{...invoice,direction:'payable'}),/dirección/);
});
