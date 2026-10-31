import { listClients } from './clients.mjs';
import { currencyOptions } from './currencies.mjs';
export function showClientTools({ getState, create, archive, restore, select, modal }) {
  modal(`<span class="overline">TU CARTERA LOCAL</span><h2>Un espacio para cada cliente.</h2><p>Cada cliente conserva sus movimientos, moneda y configuración. Archivar lo oculta del selector y permite recuperarlo aquí.</p><form id="client-create-form"><label class="field">Nombre del nuevo cliente<input name="name" required maxlength="80" autocomplete="off"></label><label class="field">Moneda del nuevo cliente<select name="currency" id="client-currency"></select></label><button class="button primary" type="submit">Crear cliente vacío</button></form><p id="client-error" class="field-error" role="alert"></p><h3>Clientes activos</h3><div id="client-active-list"></div><h3>Archivados</h3><div id="client-archived-list"></div>`);
  const root = document.querySelector('#dialog-content'); let busy = false;
  const currency = root.querySelector('#client-currency');
  currency.replaceChildren(...currencyOptions.map(c => { const option = document.createElement('option'); option.value = c.code; option.textContent = `${c.code} · ${c.name}`; return option; }));
  currency.value = getState().datasets[`advisor-${getState().entity}`]?.currency ?? 'EUR';
  function draw() {
    const clients = listClients(getState());
    for (const archived of [false, true]) {
      const list = root.querySelector(archived ? '#client-archived-list' : '#client-active-list');
      list.replaceChildren(...clients.filter(c => c.archived === archived).map(c => {
        const line = document.createElement('div'); line.className = 'heading-actions';
        const label = document.createElement('p'); label.textContent = `${c.name} · ${c.currency}`; line.append(label);
        const button = (text, action) => { const b = document.createElement('button'); b.className = 'button small secondary'; b.type = 'button'; b.textContent = text; b.dataset.clientAction = action; b.dataset.clientIndex = c.index; line.append(b); };
        if (archived) button('Restaurar cliente', 'restore');
        else { button('Abrir cliente', 'select'); button('Archivar cliente', 'archive'); }
        return line;
      }));
      if (!list.childNodes.length) { const p = document.createElement('p'); p.textContent = 'No hay clientes archivados.'; list.append(p); }
    }
  }
  async function run(action, close = false) {
    if (busy) return; busy = true;
    root.querySelector('#client-error').textContent = '';
    root.querySelectorAll('button,input,select').forEach(el => { el.disabled = true; });
    try { await action(); if (close) root.closest('dialog').close(); else draw(); }
    catch (error) { root.querySelector('#client-error').textContent = error.message; }
    finally { busy = false; root.querySelectorAll('button,input,select').forEach(el => { el.disabled = false; }); }
  }
  root.querySelector('#client-create-form').addEventListener('submit', event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    void run(() => create({ name: data.get('name'), currency: data.get('currency') }), true);
  });
  root.addEventListener('click', event => {
    const b = event.target.closest('[data-client-action]'); if (!b) return;
    const index = Number(b.dataset.clientIndex), action = b.dataset.clientAction;
    void run(() => ({ archive, restore, select })[action](index), action === 'select');
  });
  draw();
}
