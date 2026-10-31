import { inspectCSV, validateTransaction } from './core.mjs';
import { utf8Bytes } from './snapshot.mjs';
const fingerprint = r => JSON.stringify([r.date, r.description, r.category, r.type, r.amount]);
function unique(rows, existing) {
  const seen = new Set(existing.map(fingerprint));
  return rows.filter(row => { const key = fingerprint(row); if (seen.has(key)) return false; seen.add(key); return true; });
}
export function reviewImport(text, destination) {
  const result = { ok: false, currency: destination.currency, total: 0, rows: [], errors: [], duplicates: 0, latestMonth: null };
  try {
    if (typeof text !== 'string' || utf8Bytes(text) > 2 * 1024 * 1024) throw new Error('El CSV debe ocupar menos de 2 MB.');
    const parsed = inspectCSV(text);
    result.total = parsed.total; result.errors = parsed.errors;
    result.rows = unique(parsed.rows, destination.rows);
    result.duplicates = parsed.rows.length - result.rows.length;
    result.latestMonth = result.rows.map(r => r.date.slice(0, 7)).sort().at(-1) ?? null;
    if (destination.rows.length + result.rows.length > 5000) result.errors.push({ row: null, message: 'El espacio admite hasta 5.000 movimientos.' });
    result.ok = !result.errors.length;
  } catch (error) { result.errors.push({ row: null, message: error.message }); }
  return result;
}
export function applyImport(review, destination, makeId = i => `csv-${Date.now()}-${i}`) {
  if (!review.ok || review.errors.length) throw new Error('Corrige todas las filas y vuelve a revisar el archivo antes de importar.');
  if (review.currency !== destination.currency) throw new Error('Cambió la moneda del destino. Revisa el archivo de nuevo.');
  const fresh = unique(review.rows.map(validateTransaction), destination.rows);
  if (destination.rows.length + fresh.length > 5000) throw new Error('El espacio admite hasta 5.000 movimientos.');
  const ids = new Set([...destination.rows, ...(destination.trash ?? [])].map(r => r.id));
  const rows = fresh.map((r, i) => {
    const base = makeId(i); let id = base, suffix = 1;
    while (ids.has(id)) id = `${base}-${suffix++}`;
    ids.add(id);
    return { ...r, id, financialType: r.type === 'ingreso' ? 'revenue' : 'unclassified', source: 'CSV importado' };
  });
  return { ...destination, rows: [...destination.rows, ...rows] };
}
