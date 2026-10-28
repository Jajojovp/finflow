import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseAction } from '../public/descargar/release.mjs';
const origin = 'https://finflow.sysora.io';
const apk = {status:'available',url:'/downloads/finflow-1.0.0.apk',version:'1.0.0',sha256:'a'.repeat(64),certificateSha256:'b'.repeat(64),bytes:1234};
test('only a complete signed APK release can enable downloading', () => {
  assert.equal(releaseAction('android', apk, origin), origin + apk.url);
  for (const change of [{status:'pending'}, {sha256:null}, {certificateSha256:null}, {bytes:0}, {version:'unknown'}]) assert.equal(releaseAction('android',{...apk,...change},origin),null);
});
test('download URLs reject other hosts, protocols and paths', () => {
  for (const url of ['https://evil.example/finflow.apk','javascript:alert(1)','http://finflow.sysora.io/downloads/finflow-1.0.0.apk','/downloads/../app.apk','/downloads/finflow-1.0.0.apk?redirect=evil']) assert.equal(releaseAction('android',{...apk,url},origin),null);
});
test('iOS channels are Apple URLs and pending releases never become links', () => {
  assert.equal(releaseAction('ios',{status:'available',url:'https://testflight.apple.com/join/abcd1234'},origin),'https://testflight.apple.com/join/abcd1234');
  assert.equal(releaseAction('ios',{status:'available',url:'https://testflight.apple.com.evil.example/join/a'},origin),null);
  assert.equal(releaseAction('ios',{status:'pending',url:'https://testflight.apple.com/join/a'},origin),null);
});
