import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const [archive,destination]=process.argv.slice(2);
if(!archive||!destination||!/^[a-zA-Z0-9_.-]+\.zip$/.test(destination))throw new Error('Supply an archive and a ZIP destination name.');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');process.stdin.resume();
console.log('Ready for upload credential JSON on stdin (input is hidden).');
let input='';
process.stdin.on('data',async chunk=>{
 if(chunk.includes('\u0003'))process.exit(130);
 input+=chunk;if(!/[\r\n]/.test(input))return;
 process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);
 try{
  const c=JSON.parse(input.trim());input='';
  if(new URL(c.url).protocol!=='https:'||!c.auth_key||!c.rest_auth_key)throw new Error('Invalid upload credentials.');
  const bytes=await readFile(archive),url=c.url.replace(/\/$/,'')+'/'+destination+'?override=true';
  const headers={'X-Auth':c.auth_key,'X-Auth-Rest':c.rest_auth_key,'Tus-Resumable':'1.0.0','Upload-Offset':'0'};
  const created=await fetch(url,{method:'POST',redirect:'error',headers:{...headers,'Upload-Length':String(bytes.length)}});
  if(created.status!==201)throw new Error(`Upload create returned HTTP ${created.status}.`);
  const chunkSize=8*1024*1024;
  for(let offset=0;offset<bytes.length;offset+=chunkSize){
   const end=Math.min(offset+chunkSize,bytes.length);
   const patched=await fetch(url,{method:'PATCH',redirect:'error',headers:{...headers,'Upload-Offset':String(offset),'Content-Type':'application/offset+octet-stream'},body:bytes.subarray(offset,end)});
   if(patched.status!==204||Number(patched.headers.get('Upload-Offset'))!==end)throw new Error(`Upload verification failed (HTTP ${patched.status}).`);
   console.log(JSON.stringify({uploadedBytes:end,totalBytes:bytes.length}));
  }
  console.log(JSON.stringify({uploaded:destination,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),status:'verified'}));
  process.exit(0);
 }catch(error){console.error(error.message.replace(/https?:\/\/\S+/g,'[endpoint]'));process.exit(1);}
});
