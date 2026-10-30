import { decodeSnapshot, encodeSnapshot, snapshotSummary, MAX_BACKUP_BYTES } from './snapshot.mjs';

export function showDataTools({ getState, scope, restore, readRecovery, modal, download, toast }) {
  modal(`<span class="overline">TUS DATOS, CONTIGO</span><h2>Respalda tu espacio.</h2><p>Un respaldo completo guarda todos tus espacios, movimientos, metas, monedas y configuración. El CSV sigue disponible para llevar solo movimientos.</p><button class="button secondary" id="backup-export">Descargar respaldo completo ↓</button><label class="field" style="margin-top:24px">Revisar un respaldo<input id="backup-file" type="file" accept=".json,application/json,text/plain"></label><p class="scenario-note">Hasta 4 MB. El archivo se revisa en este dispositivo; no se envía a un servidor.</p><button class="text-button" id="backup-recovery">Revisar copia anterior a la última restauración</button><p id="backup-error" role="alert"></p><section id="backup-preview" hidden><h3>Antes de restaurar</h3><p id="backup-summary"></p><ul id="backup-spaces"></ul><p id="backup-origin" class="scenario-note"></p><p>La restauración completa sustituye los espacios guardados de ${scope === 'local' ? 'este modo local' : 'esta cuenta'}. Se conservará una copia anterior para recuperarla desde aquí.</p><label class="field"><span><input type="checkbox" id="backup-confirm"> Confirmo que quiero restaurar estos datos completos.</span></label><div class="heading-actions"><button class="button primary" id="backup-apply" disabled>Restaurar respaldo completo</button><button class="button secondary" id="backup-cancel">Cancelar</button></div></section>`);
  const root = document.querySelector('#dialog-content');
  const find = id => root.querySelector('#' + id);
  let pending = null, busy = false;
  const quantity = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const clear = () => { pending = null; find('backup-preview').hidden = true; find('backup-confirm').checked = false; find('backup-apply').disabled = true; };
  function preview(raw) {
    clear(); find('backup-error').textContent = '';
    const decoded = decodeSnapshot(raw, { scope });
    const summary = snapshotSummary(decoded.state);
    find('backup-summary').textContent = `${quantity(summary.workspaces, 'espacio')} · ${quantity(summary.movements, 'movimiento')} · ${quantity(summary.archived, 'archivado')} · ${summary.currencies.join(', ') || 'sin monedas guardadas'}`;
    find('backup-spaces').replaceChildren(...Object.values(decoded.state.datasets).map(d => {
      const item = document.createElement('li');
      item.textContent = `${d.name} · ${d.currency} · ${quantity(d.rows.length, 'movimiento')}`;
      return item;
    }));
    find('backup-origin').textContent = decoded.legacy ? 'Respaldo anterior sin ámbito de cuenta declarado. Revisa que estos datos sean tuyos antes de confirmar.' : 'Origen: ' + (decoded.source === 'web' ? 'web' : 'app móvil') + '. El ámbito coincide con el destino; el archivo no es una credencial ni una autorización.';
    pending = decoded.state;
    find('backup-preview').hidden = false;
  }
  find('backup-export').onclick = () => {
    try { download(`finflow-respaldo-${new Date().toISOString().slice(0, 10)}.json`, encodeSnapshot(getState(), { source: 'web', scope }), 'application/json;charset=utf-8'); }
    catch (e) { find('backup-error').textContent = e.message; }
  };
  find('backup-file').onchange = async event => {
    clear();
    try {
      const file = event.target.files[0];
      if (file) { if (file.size > MAX_BACKUP_BYTES) throw new Error('El respaldo supera el límite de 4 MB.'); preview(await file.text()); }
    } catch (e) { find('backup-error').textContent = e.message; }
    finally { event.target.value = ''; }
  };
  find('backup-recovery').onclick = async () => {
    try { const raw = await readRecovery(); if (!raw) throw new Error('Todavía no hay una copia anterior a una restauración.'); preview(raw); }
    catch (e) { find('backup-error').textContent = e.message; }
  };
  find('backup-confirm').onchange = event => { find('backup-apply').disabled = !event.target.checked || !pending; };
  find('backup-cancel').onclick = clear;
  find('backup-apply').onclick = async () => {
    if (busy || !pending || !find('backup-confirm').checked) return;
    busy = true; for (const id of ['backup-apply', 'backup-file', 'backup-recovery', 'backup-cancel']) find(id).disabled = true;
    try { await restore(pending); pending = null; document.querySelector('#detail-dialog').close(); toast('Respaldo completo restaurado. Puedes recuperar la copia anterior desde Mis datos.'); }
    catch (e) { find('backup-error').textContent = e.message; find('backup-apply').disabled = false; }
    finally { busy = false; for (const id of ['backup-file', 'backup-recovery', 'backup-cancel']) find(id).disabled = false; }
  };
}
