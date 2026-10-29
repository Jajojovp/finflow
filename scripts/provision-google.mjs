// Local provisioning helper. Credentials stay in the owner's private directory.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
const privateDir = path.join(os.homedir(), '.finflow/google');
const clientPath = path.join(privateDir, 'client.json');
const setupPath = path.join(privateDir, 'setup.json');
const origin = 'https://finflow.sysora.io';
if (process.argv[2] === 'prepare') {
  const client = JSON.parse(await fs.readFile(clientPath, 'utf8'));
  if (client.project_id !== 'finflow-513111' || !/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client.client_id) || typeof client.client_secret !== 'string' || client.client_secret.length < 16) throw new Error('Unexpected OAuth configuration');
  let setup;
  try { setup = JSON.parse(await fs.readFile(setupPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; setup = { token: crypto.randomBytes(32).toString('base64url') }; await fs.writeFile(setupPath, JSON.stringify(setup), { mode: 0o600, flag: 'wx' }); }
  const template = await fs.readFile('scripts/provision-google.template.php', 'utf8');
  await fs.writeFile('dist/auth/setup.php', template.replace('__SETUP_HASH__', crypto.createHash('sha256').update(setup.token).digest('hex')));
  console.log('One-use provisioning artifact prepared. No Google secret is in the archive.');
} else if (process.argv[2] === 'apply') {
  const client = JSON.parse(await fs.readFile(clientPath, 'utf8'));
  const setup = JSON.parse(await fs.readFile(setupPath, 'utf8'));
  const response = await fetch(origin + '/auth/setup.php', { method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json', 'X-Setup-Token': setup.token }, body: JSON.stringify(client), signal: AbortSignal.timeout(30000) });
  if (!response.ok || (await response.json()).configured !== true) throw new Error(`Provisioning did not complete (${response.status}); existing credentials will not be replaced.`);
  const check = await fetch(origin + '/auth/index.php?action=session', { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!check.ok || (await check.json()).configured !== true) throw new Error('Authentication configuration could not be verified');
  console.log('Google authentication configured and verified on the canonical server.');
} else throw new Error('Use prepare after building, or apply after deploying.');
