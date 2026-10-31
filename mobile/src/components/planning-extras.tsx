import React,{useState} from 'react';
import {router} from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import {useWorkspace} from '@/data/provider';
import {Card,Copy,Title,Row,Button,ErrorText,Select} from '@/components/ui';
import {portfolioSummary,workspaceReport} from '../../../src/workspace/portfolio.mjs';
import {emptyClient} from '../../../src/workspace/clients.mjs';
import {formatMoney} from '../../../src/workspace/currencies.mjs';
import {evaluateAlerts,saveAlertPreferences,dismissAlert,reviewAlerts} from '../../../src/workspace/alerts.mjs';
import type {Workspace} from '@/data/model';

export function ProfessionalCard() {
  const {state,commit,saving}=useWorkspace(),[notice,setNotice]=useState(''),[error,setError]=useState('');
  if(state.profile!=='advisor')return null;
  const a=portfolioSummary(state,state.period),display=(n:number|null,currency:string|null)=>n===null||!currency?'N/D':formatMoney(n,currency);
  async function select(index:number) {try{const c=a.clients.find(c=>c.index===index);if(!c)return;await commit(s=>({...s,entity:index,datasets:{...s.datasets,[c.key]:s.datasets[c.key] ?? emptyClient(c.name,c.currency ?? 'EUR',s.period)}}));router.replace('/');}catch(e){setError(e instanceof Error?e.message:'No se pudo abrir el cliente.');}}
  async function exportReport(key:string) {try{const ok=await Clipboard.setStringAsync(JSON.stringify(workspaceReport(state.datasets[key],state.period,'advisor'),null,2));if(!ok)throw new Error('No se pudo copiar el informe.');setNotice('Informe individual copiado con moneda, período y evidencia.');}catch(e){setError(e instanceof Error?e.message:'No se pudo copiar.');}}
  return <Card><Title>Tu portafolio, por moneda.</Title><Copy>{a.activeCount} activos · {a.archivedCount} archivados · {state.period}</Copy><ErrorText message={error}/><Copy small>{notice}</Copy>{a.groups.map(g=><Card key={g.currency ?? 'unknown'}><Title>{g.currency ?? 'Sin moneda declarada'}</Title><Row label="Caja" value={display(g.cash,g.currency)}/><Row label="Resultado" value={display(g.profit,g.currency)}/><Row label="Patrimonio" value={display(g.netWorth,g.currency)}/>{g.incomplete>0&&<Copy muted small>{g.incomplete} clientes con información incompleta. Subtotal de caja conocida {display(g.knownCash,g.currency)}; no es el total del grupo.</Copy>}</Card>)}{a.clients.map(c=><Card key={c.key}><Title>{c.name}{c.archived?' · Archivado':''}</Title><Copy small muted>Última evidencia: {c.evidenceDate ?? 'Sin registros fechados'} · {c.incomplete?'Información incompleta':'Datos del período disponibles'}</Copy><Row label="Caja" value={display(c.cash,c.currency)}/><Row label="Resultado" value={display(c.profit,c.currency)}/>{!c.archived&&<Button title={c.hasData?'Abrir cliente':'Abrir espacio vacío'} secondary disabled={saving} onPress={()=>void select(c.index)}/>} {c.hasData&&<Button title="Copiar informe individual" secondary onPress={()=>void exportReport(c.key)}/>}</Card>)}{a.limitations.map(t=><Copy small muted key={t}>{t}</Copy>)}</Card>;
}
export function AlertsCard({onNavigate}:{onNavigate:(destination:string)=>void}) {
  const {dataset:d,state,update,saving}=useWorkspace(),[error,setError]=useState('');
  const asOf=new Date(Date.UTC(Number(state.period.slice(0,4)),Number(state.period.slice(5,7)),0)).toISOString().slice(0,10),a=evaluateAlerts(d,{asOf,period:state.period,profile:state.profile});
  async function run(change:(d:Workspace)=>Workspace){setError('');try{await update(change);}catch(e){setError(e instanceof Error?e.message:'No se pudo guardar.');}}
  return <Card><Title>Señales con una explicación.</Title><Copy muted>Corte {asOf} · {a.newCount} señales nuevas según tu frecuencia.</Copy><Select label="Alertas locales" value={String(a.preferences.enabled)} options={[{value:'true',label:'Activadas'},{value:'false',label:'Desactivadas'}]} onChange={v=>void run(current=>saveAlertPreferences(current,{enabled:v==='true'}))}/><Select label="Frecuencia de novedades" value={a.preferences.frequency} options={[{value:'daily',label:'Diaria'},{value:'weekly',label:'Semanal'},{value:'always',label:'Cada revisión'}]} onChange={v=>void run(current=>saveAlertPreferences(current,{frequency:v}))}/><Button title="Marcar revisión del corte" secondary disabled={saving} onPress={()=>void run(current=>reviewAlerts(current,asOf))}/><ErrorText message={error}/>{a.items.map(item=><Card key={item.id}><Title>{item.title}{item.dismissed?' · Descartada':''}</Title><Copy>{item.evidence}</Copy><Button title="Ver datos y supuestos" secondary onPress={()=>onNavigate(item.destination)}/><Button title={item.dismissed?'Volver a mostrar':'Descartar esta condición'} secondary disabled={saving} onPress={()=>void run(current=>dismissAlert(current,item.id,asOf,item.dismissed))}/></Card>)}{!a.items.length&&<Copy muted>No hay señales con estas reglas y tus datos actuales.</Copy>}<Copy small muted>{a.limitations}</Copy></Card>;
}
