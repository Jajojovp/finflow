import { isCurrencyCode } from './currencies.mjs';
const legacyNames = ['Estudio Norte', 'Taller Oliva', 'Café Alameda'];
export function listClients(state) {
  const indexes = new Set([0, 1, 2, state.entity, ...Object.keys(state.datasets).filter(k => /^advisor-(\d|[1-9]\d)$/.test(k)).map(k => Number(k.slice(8)))]);
  return [...indexes].sort((a, b) => a - b).map(index => {
    const key = `advisor-${index}`, d = state.datasets[key];
    return { index, key, name: d?.name ?? legacyNames[index] ?? `Cliente ${index + 1}`, currency: d?.currency ?? 'EUR', archived: d?.archived === true };
  });
}
export function emptyClient(name, currency, period) {
  return { name, currency, rows: [], trash: [], goal: { name: 'Reserva operativa', target: 50000, saved: 0 }, lessons: [], finance: { [period]: { opening: 0, savingsTarget: 20, expenseBudget: 0, unitPrice: 0 } }, budgets: {}, analysis: {}, lastMonth: period };
}
/**
 * @param state Estado completo; se conservan sus campos adicionales.
 * @param {{ name?: string, currency?: string }} [options]
 */
export function createClient(state, options = {}) {
  const { name, currency = 'EUR' } = options;
  if (state.profile !== 'advisor') throw new Error('Selecciona el perfil profesional para crear un cliente.');
  const index = Math.max(...listClients(state).map(c => c.index)) + 1;
  if (index > 99) throw new Error('Este espacio local admite hasta 100 clientes.');
  const checked = name === undefined ? `Cliente ${index + 1}` : typeof name === 'string' ? name.trim() : '';
  if (!checked || checked.length > 80) throw new Error('Añade un nombre de hasta 80 caracteres.');
  if (!isCurrencyCode(currency)) throw new Error('Selecciona una moneda válida.');
  const period = state.period ?? state.month;
  return { ...state, entity: index, datasets: { ...state.datasets, [`advisor-${index}`]: emptyClient(checked, currency, period) } };
}
export function setClientArchived(state, index, archived) {
  if (state.profile !== 'advisor' || typeof archived !== 'boolean') throw new Error('Selecciona el perfil profesional para gestionar clientes.');
  const clients = listClients(state), client = clients.find(c => c.index === index);
  if (!client) throw new Error('No se encontró el cliente.');
  const active = clients.filter(c => !c.archived && c.index !== index);
  if (archived && !active.length) throw new Error('Conserva al menos un cliente activo. Puedes crear otro antes de archivar este.');
  const previous = state.datasets[client.key] ?? emptyClient(client.name, client.currency, state.period ?? state.month);
  return { ...state, entity: archived && state.entity === index ? active[0].index : state.entity, datasets: { ...state.datasets, [client.key]: { ...previous, archived } } };
}
