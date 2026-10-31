import {SPONSOR_CONFIG} from './config.mjs';
import {decideSponsorship} from './policy.mjs';
const CONSENT_KEY='finflow-sponsor-consent';
const make=(tag,text)=>{const el=document.createElement(tag);if(text)el.textContent=text;return el;};
export function clearSponsorSlots(){for(const slot of document.querySelectorAll('[data-sponsor-placement]')){slot.replaceChildren();slot.hidden=true;}}
export function mountSponsorSlot(placement,config=SPONSOR_CONFIG) {
  clearSponsorSlots();if(config.enabled!==true||!['landing_footer','learning_resources'].includes(placement))return;
  const root=document.querySelector(`[data-sponsor-placement="${placement}"]`);if(!root)return;
  let consent;try{consent=localStorage.getItem(CONSENT_KEY);}catch{return;}
  root.hidden=false;
  function remember(value){try{localStorage.setItem(CONSENT_KEY,value);}catch{root.hidden=true;return;}mountSponsorSlot(placement,config);}
  if(consent!=='allow') {
    root.append(make('small','Patrocinios opcionales'),make('p',consent==='deny'?'Los patrocinios están ocultos.':'Puedes ver contenido patrocinado identificado. No utiliza tus movimientos, identidad ni clientes. Un proveedor externo solo se carga si lo aceptas.'));
    const allow=make('button','Mostrar patrocinios');allow.className='button secondary small';allow.onclick=()=>remember('allow');root.append(allow);
    if(consent!=='deny'){const deny=make('button','Ahora no');deny.className='button secondary small';deny.onclick=()=>remember('deny');root.append(deny);}
    return;
  }
  try {
    const decision=decideSponsorship({placement,topic:'financial_education'},config,true,location.origin);
    if(!decision){root.hidden=true;return;}
    root.append(make('small','Patrocinado · '+decision.name));
    if(decision.kind==='static') {
      root.append(make('h3',decision.title),make('p',decision.body));
      const link=make('a','Ver recurso patrocinado ↗');link.href=decision.url;link.target='_blank';link.rel='noopener noreferrer sponsored';root.append(link);
    } else {
      const frame=make('iframe');frame.title='Publicidad · '+decision.title;frame.setAttribute('sandbox',decision.sandbox);frame.referrerPolicy=decision.referrerPolicy;frame.setAttribute('allow',"camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; clipboard-read 'none'; clipboard-write 'none'");frame.loading='lazy';frame.width='100%';frame.height='180';frame.src=decision.url;frame.onerror=()=>frame.replaceWith(make('p','El patrocinio no está disponible. FinFlow sigue funcionando.'));root.append(frame);
    }
    const hide=make('button','Ocultar patrocinios');hide.className='text-button';hide.onclick=()=>remember('deny');root.append(hide);
  } catch {root.replaceChildren(make('p','Patrocinio no disponible.'));}
}
