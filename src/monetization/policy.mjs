const placements=['landing_footer','learning_resources'];
const topics=['financial_education','open_source_tools'];
const fail=message=>{throw new Error(message);};
export function decideSponsorship(context,config,consent,origin) {
  if(config?.enabled!==true||consent!==true)return null;
  if(!context||Object.keys(context).length!==2||Object.keys(context).some(k=>!['placement','topic'].includes(k)))fail('El contexto solo admite ubicación y tema editorial.');
  if(!placements.includes(context.placement)||!topics.includes(context.topic))fail('La ubicación o tema no admite patrocinio.');
  const p=config.provider;
  if(!p||!['static','frame'].includes(p.kind)||typeof p.name!=='string'||!p.name.trim()||p.name.length>80||typeof p.title!=='string'||!p.title.trim()||p.title.length>120||(p.body!==undefined&&(typeof p.body!=='string'||p.body.length>400)))fail('Revisa el contenido público del patrocinio.');
  let target;try{target=new URL(p.url);}catch{fail('El destino del patrocinio no es válido.');}
  if(target.protocol!=='https:'||target.username||target.password||target.search||target.hash||!Array.isArray(config.allowedOrigins)||!config.allowedOrigins.includes(target.origin))fail('El destino debe ser HTTPS, autorizado y sin credenciales ni parámetros ocultos.');
  if(p.kind==='frame'&&target.origin===origin)fail('El proveedor externo debe estar en un origen separado del financiero.');
  const payload={placement:context.placement,topic:context.topic};
  if(p.kind==='frame'){target.searchParams.set('placement',payload.placement);target.searchParams.set('topic',payload.topic);}
  return {kind:p.kind,name:p.name,title:p.title,body:p.body ?? '',url:target.href,payload,sandbox:'allow-scripts',referrerPolicy:'no-referrer'};
}
