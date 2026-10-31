import test from 'node:test';
import assert from 'node:assert/strict';
import {decideSponsorship} from '../src/monetization/policy.mjs';
const context={placement:'landing_footer',topic:'financial_education'};
const config={enabled:true,allowedOrigins:['https://sponsor.example'],provider:{kind:'frame',name:'Patrocinador',title:'Educación financiera',url:'https://sponsor.example/embed'}};
test('sponsorship is off by default and requires consent and an editorial slot',()=>{
 assert.equal(decideSponsorship(context,{enabled:false},true,'https://finflow.sysora.io'),null);
 assert.equal(decideSponsorship(context,config,false,'https://finflow.sysora.io'),null);
 assert.throws(()=>decideSponsorship({...context,placement:'kpi'},config,true,'https://finflow.sysora.io'),/ubicación/);
 for(const extra of ['rows','amount','debt','currency','clientId','identity'])assert.throws(()=>decideSponsorship({...context,[extra]:'private'},config,true,'https://finflow.sysora.io'),/editorial/);
});
test('external frames have a separate allowed origin and only editorial parameters',()=>{
 const decision=decideSponsorship(context,config,true,'https://finflow.sysora.io');
 const url=new URL(decision.url);assert.deepEqual([...url.searchParams.keys()],['placement','topic']);assert.equal(url.origin,'https://sponsor.example');assert.equal(decision.sandbox,'allow-scripts');assert.equal(decision.referrerPolicy,'no-referrer');
 for(const url of ['https://finflow.sysora.io/embed','javascript:alert(1)','https://sponsor.example/embed?email=private','https://user:secret@sponsor.example/embed','http://sponsor.example/embed'])assert.throws(()=>decideSponsorship(context,{...config,provider:{...config.provider,url}},true,'https://finflow.sysora.io'));
});
test('static sponsorship does not require an SDK, cannot contain markup or a hidden destination',()=>{
 const decision=decideSponsorship(context,{...config,provider:{kind:'static',name:'Empresa',title:'Recurso patrocinado',body:'Contenido editorial general',url:'https://sponsor.example/resource'}},true,'https://finflow.sysora.io');
 assert.equal(decision.kind,'static');assert.equal(decision.url,'https://sponsor.example/resource');assert.equal(decision.payload.placement,'landing_footer');
 assert.throws(()=>decideSponsorship(context,{...config,provider:{...config.provider,title:''}},true,'https://finflow.sysora.io'),/contenido/);
});
