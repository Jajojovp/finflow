import { reviewImport } from './import-review.mjs';

export function showCSVTools({ getDestination, apply, modal, toast }) {
  const destination = getDestination();
  modal(`<span class="overline">IMPORTACIÓN LOCAL</span><h2>Revisa antes de añadir.</h2><p id="csv-destination"></p><p>Cabecera: <code>fecha,descripcion,categoria,tipo,importe</code>. Hasta 5.000 filas y 2 MB. El archivo se revisa en este dispositivo.</p><label class="field">Archivo CSV<input id="csv-review-file" type="file" accept=".csv,text/csv"></label><section id="csv-review" hidden><h3 id="csv-summary"></h3><p id="csv-period"></p><ul id="csv-samples"></ul><p>Los duplicados exactos se omiten. Los gastos se añaden sin clasificación financiera: puedes revisarla en Movimientos.</p></section><p id="csv-review-error" class="field-error" role="alert"></p><div class="heading-actions"><button id="csv-review-cancel" class="button secondary">Cancelar sin cambios</button><button id="csv-review-confirm" class="button primary" disabled>Confirmar importación</button></div>`);
  const $ = selector => document.querySelector(selector);
  const root = $('#dialog-content'), fileInput = $('#csv-review-file'), confirm = $('#csv-review-confirm'), cancel = $('#csv-review-cancel');
  $('#csv-destination').textContent = `Destino: ${destination.name} · ${destination.currency}. No se convertirán los importes.`;
  let pending = null, generation = 0, busy = false;
  const message = error => { $('#csv-review-error').textContent = error?.message ?? ''; };
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0], request = ++generation;
    pending = null; confirm.disabled = true; $('#csv-review').hidden = true; message(null);
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('El CSV debe ocupar menos de 2 MB.');
      const raw = await file.text();
      if (request !== generation || !fileInput.isConnected) return;
      pending = reviewImport(raw, destination);
      $('#csv-summary').textContent = `Filas: ${pending.total} · Nuevas: ${pending.rows.length} · Duplicadas: ${pending.duplicates} · Errores: ${pending.errors.length}`;
      $('#csv-period').textContent = pending.latestMonth ? `Último periodo del lote: ${pending.latestMonth}` : 'Sin movimientos nuevos.';
      $('#csv-samples').replaceChildren(...pending.rows.slice(0, 5).map(row => {
        const li = document.createElement('li'); li.textContent = `${row.date} · ${row.description} · ${row.type} · ${row.amount} ${destination.currency}`; return li;
      }));
      $('#csv-review').hidden = false;
      if (!pending.ok) message(new Error(pending.errors.slice(0, 20).map(e => `${e.row ? 'Fila ' + e.row + ': ' : ''}${e.message}`).join(' · ') + (pending.errors.length > 20 ? ' · Hay más errores. Corrige el archivo y vuelve a revisarlo.' : '')));
      confirm.disabled = !pending.ok || !pending.rows.length;
    } catch (error) { if (request === generation && fileInput.isConnected) message(error); }
  });
  cancel.addEventListener('click', () => { if (!busy) { generation++; pending = null; root.closest('dialog').close(); } });
  confirm.addEventListener('click', async () => {
    if (busy || !pending?.ok) return;
    busy = true; confirm.disabled = cancel.disabled = fileInput.disabled = true; message(null);
    try {
      if (getDestination().key !== destination.key) throw new Error('Cambió el espacio de destino. Cierra y vuelve a revisar el CSV.');
      const added = await apply(pending, destination.key);
      pending = null; root.closest('dialog').close(); toast(`${added} movimientos importados. Los duplicados se han omitido.`);
    } catch (error) { message(error); confirm.disabled = false; }
    finally { busy = false; cancel.disabled = fileInput.disabled = false; }
  });
}
