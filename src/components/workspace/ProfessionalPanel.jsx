import React from 'react';
import {portfolioSummary,workspaceReport} from '../../workspace/portfolio.mjs';
import {formatMoney} from '../../workspace/currencies.mjs';

export function exportWorkspaceReport(d,period,profile) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(workspaceReport(d,period,profile),null,2)],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=`finflow-informe-${period}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function ProfessionalPanel({state,period,onSelectClient}) {
  const portfolio=portfolioSummary(state,period),display=(n,code)=>n===null||!code?'N/D':formatMoney(n,code);
  return <section className="panel"><h2>Tu portafolio, por moneda.</h2><p>{portfolio.activeCount} clientes activos · {portfolio.archivedCount} archivados · período {period}</p>{portfolio.groups.map(g=><section className="planning-item" key={g.currency ?? 'unknown'}><h3>{g.currency || 'Moneda aún sin declarar'}</h3><p>Caja: <b>{display(g.cash,g.currency)}</b> · Resultado: {display(g.profit,g.currency)} · Patrimonio: {display(g.netWorth,g.currency)}</p>{g.incomplete>0&&<p className="scenario-note">{g.incomplete} clientes con información incompleta. Subtotal de caja conocida: {display(g.knownCash,g.currency)}; no representa el total del grupo.</p>}</section>)}<h3>Clientes y evidencia</h3>{portfolio.clients.map(c=><article key={c.key} className="planning-item"><h3>{c.name} {c.archived?'· Archivado':''}</h3><p>{c.currency || 'Sin moneda declarada'} · Última fecha con evidencia: {c.evidenceDate || 'Sin registros fechados'} · {c.incomplete?'Información incompleta':'Datos del período disponibles'}</p><p>Caja {display(c.cash,c.currency)} · Resultado {display(c.profit,c.currency)} · Patrimonio {display(c.netWorth,c.currency)}</p>{!c.archived&&<button className="button secondary small" onClick={()=>onSelectClient(c.index)}>{c.hasData?'Abrir cliente':'Abrir espacio vacío'}</button>} {c.hasData&&<button className="button secondary small" onClick={()=>exportWorkspaceReport(state.datasets[c.key],period,'advisor')}>Exportar informe individual</button>}</article>)}{portfolio.limitations.map(t=><p key={t} className="scenario-note">{t}</p>)}</section>;
}
