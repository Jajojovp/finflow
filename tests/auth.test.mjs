import test from 'node:test';
import assert from 'node:assert/strict';
import { accountUser, accountStorageKey, nativeLoginUrl } from '../src/workspace/auth-contract.mjs';
const user = { id: '123456789', email: 'test@example.com', name: 'Prueba' };
test('Google identities cannot control local storage paths or carry extra properties', () => {
  assert.deepEqual(accountUser({ ...user, token: 'never-copy' }), user);
  for (const value of [null, { ...user, id: '../guest' }, { ...user, id: '' }, { ...user, email: 'wrong' }, { ...user, name: 'x'.repeat(121) }]) assert.equal(accountUser(value), null);
});
test('guest and each Google account retain independent local workspaces', () => {
  assert.equal(accountStorageKey('finflow-open-v1', null), 'finflow-open-v1');
  assert.equal(accountStorageKey('finflow-open-v1', user), 'finflow-open-v1:google:123456789');
  assert.notEqual(accountStorageKey('finflow-open-v1', user), accountStorageKey('finflow-open-v1', { ...user, id: '987654321' }));
});
test('native sign-in opens only the canonical login with one valid attempt', () => {
  const valid = 'https://finflow.sysora.io/auth/index.php?action=login&attempt=' + 'a'.repeat(43);
  assert.equal(nativeLoginUrl(valid), valid);
  for (const url of [valid.replace('https:', 'http:'), valid.replace('finflow.sysora.io', 'evil.example'), valid + '&redirect=evil', valid + '#fragment', valid.replace('attempt=aaa', 'attempt=aa/')]) assert.equal(nativeLoginUrl(url), null);
});
