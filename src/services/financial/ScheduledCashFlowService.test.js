import {describe,it,expect} from 'vitest';
import { scheduledCashFlow } from './ScheduledCashFlowService';
import {saveDue,settleDue} from '../../workspace/dues.mjs';
const blank=()=>({currency:'USD',rows:[],trash:[],planning:{}});
describe('scheduled 13-week cash flow',()=>{
 it('reconciles partial receipts, actual future payments, expenses and every weekly carry',()=>{
  let d=saveDue(blank(),{id:'r',name:'A',counterparty:'Cliente',direction:'receivable',amount:1000,dueDate:'2026-11-02'});
  d=settleDue(d,'r',{id:'pre',date:'2026-10-20',amount:300});
  d=settleDue(d,'r',{id:'actual',date:'2026-11-10',amount:200});
  d=saveDue(d,{id:'p',name:'B',counterparty:'Proveedor',direction:'payable',amount:200,dueDate:'2026-11-09'});
  const a=scheduledCashFlow(d,{startDate:'2026-11-01',opening:1000,profile:'business'});
  expect(a.weeks).toHaveLength(13);expect(a.receipts).toBe(700);expect(a.payments).toBe(200);expect(a.closing).toBe(1500);
  expect(a.weeks[0].receipts).toBe(500);expect(a.weeks[1].receipts).toBe(200);
  a.weeks.forEach((w,i)=>{expect(w.closing).toBe(w.opening+w.receipts-w.payments);if(i)expect(w.opening).toBe(a.weeks[i-1].closing);});
 });
 it('overdue requires an explicit assumption and scenarios preserve the base and actual movements',()=>{
  let d=saveDue(blank(),{id:'r',name:'A',counterparty:'X',direction:'receivable',amount:100,dueDate:'2026-10-01'});
  const before=structuredClone(d),base=scheduledCashFlow(d,{startDate:'2026-11-01',opening:0,profile:'business'});
  expect(base.receipts).toBe(0);expect(base.overdue).toHaveLength(1);
  const scenario=scheduledCashFlow(d,{startDate:'2026-11-01',opening:0,profile:'business',includeOverdue:true,collectionDelayDays:14,incomeChange:10});
  expect(scenario.weeks[2].receipts).toBe(110);expect(scenario.assumptions.length).toBeGreaterThan(0);expect(d).toEqual(before);
 });
 it('unknown opening stays unavailable and scenario inputs are validated',()=>{
  expect(scheduledCashFlow(blank(),{startDate:'2026-11-01',opening:null}).closing).toBeNull();
  expect(()=>scheduledCashFlow(blank(),{startDate:'2026-02-30',opening:0})).toThrow(/fecha/);
  expect(()=>scheduledCashFlow(blank(),{startDate:'2026-11-01',opening:0,incomeChange:-101})).toThrow(/escenario/);
 });
});
