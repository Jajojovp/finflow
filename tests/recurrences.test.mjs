import test from 'node:test';
import assert from 'node:assert/strict';
import { saveRecurrence, recurrenceOccurrences, confirmOccurrence } from '../src/workspace/recurrences.mjs';
const empty = () => ({ currency:'CLP', rows:[], trash:[] });
const input = {id:'rent', description:'Arriendo', amount:500, category:'Vivienda', type:'gasto', financialType:'opex', startDate:'2024-01-31', frequency:'monthly', interval:1};
test('day 31 clamps each month without drifting and respects leap years', () => {
  const d = saveRecurrence(empty(), input);
  assert.deepEqual(recurrenceOccurrences(d, '2024-02-01', '2024-04-30').map(x => x.date), ['2024-02-29','2024-03-31','2024-04-30']);
  const annual = saveRecurrence(empty(), {...input,startDate:'2024-02-29',frequency:'yearly'});
  assert.equal(recurrenceOccurrences(annual,'2025-01-01','2025-12-31')[0].date,'2025-02-28');
});
test('confirm is explicit, idempotent even in trash, and does not mutate template', () => {
  const d = saveRecurrence(empty(), input), next = confirmOccurrence(d,'rent','2024-02-29');
  assert.equal(d.rows.length,0); assert.equal(next.rows.length,1); assert.equal(next.rows[0].financialType,'opex');
  assert.deepEqual(confirmOccurrence(next,'rent','2024-02-29'),next);
  const archived = {...next,rows:[],trash:next.rows}; assert.deepEqual(confirmOccurrence(archived,'rent','2024-02-29'),archived);
  assert.throws(() => confirmOccurrence(d,'rent','2024-02-28'), /ocurrencia/);
});
test('paused, ended, interval and invalid schedules are handled without writes', () => {
  const d = saveRecurrence(empty(), {...input,frequency:'weekly',interval:2,endDate:'2024-02-20'});
  assert.deepEqual(recurrenceOccurrences(d,'2024-02-01','2024-03-01').map(x=>x.date),['2024-02-14']);
  assert.equal(recurrenceOccurrences(saveRecurrence(d,{...d.planning.recurrences[0],paused:true}),'2024-01-01','2024-04-30').length,0);
  assert.throws(()=>saveRecurrence(d,{...input,interval:0}),/intervalo/);
  assert.throws(()=>saveRecurrence(d,{...input,startDate:'2026-02-30'}),/fecha/);
  assert.throws(()=>saveRecurrence(d,{...input,financialType:'capital'}),/capital/);
});
