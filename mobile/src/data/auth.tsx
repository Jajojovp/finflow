import React, { createContext, use, useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import * as Crypto from 'expo-crypto';
import { AUTH_ORIGIN, accountUser, nativeLoginUrl, nativeReturnCode } from '../../../src/workspace/auth-contract.mjs';

export type Account = { id: string; name: string; email: string };
type Session = { user: Account; token: string; expires: number };
type Auth = { user: Account | null; busy: boolean; error: string; login: () => Promise<void>; logout: () => Promise<void>; cancel: () => void };
const Context = createContext<Auth | null>(null);
async function request(action: string, body: object, signal?: AbortSignal, token?: string) {
  const requestController = new AbortController();
  const cancel = () => requestController.abort();
  signal?.addEventListener('abort', cancel);
  if (signal?.aborted) cancel();
  const timer = setTimeout(cancel, 20000);
  try {
    const response = await fetch(`${AUTH_ORIGIN}/auth/index.php?action=${action}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body), signal: requestController.signal,
    });
    const value = await response.json();
    if (!response.ok) throw new Error(typeof value.error === 'string' ? value.error : 'No pudimos completar el acceso.');
    return value;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}
function browserReturn(attempt: string, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const done = (error?: Error, code?: string) => {
      if (settled) return; settled = true; clearTimeout(timer); listener.remove(); signal.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(code!);
    };
    const abort = () => done(new Error('Acceso cancelado.'));
    const listener = Linking.addEventListener('url', ({ url: value }) => {
      const code = nativeReturnCode(value, attempt);
      if (code) done(undefined, code);
    });
    const timer = setTimeout(() => done(new Error('El acceso caducó. Vuelve a intentarlo.')), 300000);
    signal.addEventListener('abort', abort);
    if (signal.aborted) abort();
  });
}
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null);
  const cancel = () => { controller.current?.abort(); controller.current = null; setBusy(false); };
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => { setSession(null); setError('La sesión caducó. Tus datos se conservan; vuelve a entrar para abrir tu espacio.'); }, Math.max(0, session.expires * 1000 - Date.now()));
    return () => clearTimeout(timer);
  }, [session]);
  const login = async () => {
    if (controller.current) return;
    const current = new AbortController(); controller.current = current; setBusy(true); setError('');
    try {
      const bytes = await Crypto.getRandomBytesAsync(32);
      const verifier = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
      const challenge = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const attempt = await request('begin-native', { challenge }, current.signal);
      const url = nativeLoginUrl(attempt.url);
      if (!url || typeof attempt.id !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(attempt.id) || !url.endsWith(`attempt=${attempt.id}`)) throw new Error('El servidor devolvió un acceso inválido.');
      const returned = browserReturn(attempt.id, current.signal);
      // Attach a handler immediately so cancellation while opening cannot leave
      // an unhandled rejection or an orphaned browser listener.
      const completion = returned.then(code => ({ code }), error => ({ error }));
      try { await Linking.openURL(url); } catch (error) { current.abort(); setError('No pudimos abrir el navegador. Revisa tu navegador predeterminado y reintenta.'); throw error; }
      const handoff = await completion;
      if ('error' in handoff) throw handoff.error;
      const result = await request('complete-native', { id: attempt.id, verifier, code: handoff.code }, current.signal);
      const user = accountUser(result.user);
      if (!user || !/^[A-Za-z0-9_-]{43}$/.test(result.token || '') || !Number.isFinite(result.expires) || result.expires * 1000 <= Date.now()) throw new Error('La sesión recibida no es válida.');
      if (!current.signal.aborted) setSession({ user, token: result.token, expires: result.expires });
    } catch (e) {
      if (!current.signal.aborted) setError(e instanceof Error ? e.message : 'No pudimos conectar con Google.');
    } finally {
      if (controller.current === current) { controller.current = null; setBusy(false); }
    }
  };
  const logout = async () => {
    if (!session) return;
    setBusy(true); setError('');
    try {
      await request('native-logout', {}, undefined, session.token);
      setSession(null);
    } catch { setError('No pudimos cerrar la sesión. Reintenta con conexión.'); }
    finally { setBusy(false); }
  };
  return <Context value={{ user: session?.user || null, busy, error, login, logout, cancel }}>{children}</Context>;
}
export function useAuth() { const value = use(Context); if (!value) throw new Error('Proveedor de cuenta ausente.'); return value; }
