import { formatMoney, currencyMath } from './currencies.mjs';
export const PROFILE_NAMES = { personal: 'Personal', business: 'Empresa', advisor: 'Profesional' };
export const money = formatMoney;
export function totals(rows, currency='EUR') {
  const {sum,round}=currencyMath(currency);
  const income = sum(rows.filter(r => r.type === 'ingreso'));
  const expense = sum(rows.filter(r => r.type === 'gasto'));
  const net = round(income - expense);
  return { income, expense, net, rate: income > 0 ? net / income * 100 : null };
}
export function validateTransaction(row) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(Date.parse(row.date)) || new Date(row.date).toISOString().slice(0, 10) !== row.date) throw new Error('La fecha debe ser válida y usar AAAA-MM-DD.');
  if (!row.description?.trim() || row.description.length > 200) throw new Error('Añade una descripción de hasta 200 caracteres.');
  if (!['ingreso', 'gasto'].includes(row.type)) throw new Error('El tipo debe ser ingreso o gasto.');
  if (!Number.isFinite(row.amount) || row.amount <= 0 || row.amount > 1e12) throw new Error('El importe debe ser un número positivo.');
  const amount=Number(row.amount.toFixed(4));
  if (amount<=0) throw new Error('El importe debe ser al menos 0,0001.');
  return { ...row, description: row.description.trim(), category: (row.category || 'Otros').trim().slice(0, 80), amount };
}
function cells(text, delimiter) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (c === delimiter && !quoted) { row.push(cell); cell = ''; }
    else if (c === '\n' && !quoted) { row.push(cell.replace(/\r$/, '')); if (row.some(c => c.trim())) rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (quoted) throw new Error('Hay comillas sin cerrar en el CSV.');
  row.push(cell.replace(/\r$/, '')); if (row.some(c => c.trim())) rows.push(row);
  return rows;
}
export function inspectCSV(text) {
  const clean = text.replace(/^\uFEFF/, ''); const delimiter = clean.split(/\r?\n/)[0].includes(';') ? ';' : ',';
  const [header, ...rows] = cells(clean, delimiter);
  const expected = ['fecha', 'descripcion', 'categoria', 'tipo', 'importe'];
  if (!header || header.map(c => c.trim().toLowerCase()).join() !== expected.join()) throw new Error('Cabecera requerida: fecha,descripcion,categoria,tipo,importe');
  if (!rows.length) throw new Error('El CSV no contiene movimientos.');
  if (rows.length > 5000) throw new Error('Importa un máximo de 5.000 movimientos por archivo.');
  const valid = [], errors = [];
  rows.forEach((row, index) => {
    try {
      if (row.length !== 5) throw new Error('Se esperaban 5 columnas.');
      valid.push(validateTransaction({ date: row[0].trim(), description: row[1], category: row[2], type: row[3].trim().toLowerCase(), amount: Number(row[4].trim().replace(',', '.')), source: 'CSV importado' }));
    } catch (error) { errors.push({ row: index + 2, message: error.message }); }
  });
  return { rows: valid, errors, total: rows.length };
}
export function parseCSV(text) {
  const result = inspectCSV(text);
  if (result.errors.length) throw new Error(`Fila ${result.errors[0].row}: ${result.errors[0].message}`);
  return result.rows;
}
export function scenario(monthly, months, annualRate) {
  const rate = annualRate / 100 / 12; let balance = 0;
  for (let i = 0; i < months; i++) balance = balance * (1 + rate) + monthly;
  return { balance, contributions: monthly * months, growth: balance - monthly * months };
}
export function csvExport(rows) {
  const cell = x => { const str = String(x); return '"' + (/^[=+\-@\t\r]/.test(str) ? "'" : '') + str.replaceAll('"', '""') + '"'; };
  return '\uFEFFfecha,descripcion,categoria,tipo,importe\n' + rows.map(r => [r.date,r.description,r.category,r.type,r.amount].map(cell).join(',')).join('\n');
}
