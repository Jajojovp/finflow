export const AUTH_ORIGIN = 'https://finflow.sysora.io';
export function accountUser(value) {
  if (!value || typeof value.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.id) || typeof value.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) || value.email.length > 254 || typeof value.name !== 'string' || value.name.length > 120) return null;
  return { id: value.id, email: value.email, name: value.name };
}
export function accountStorageKey(base, user) {
  const valid = accountUser(user);
  return valid ? `${base}:google:${valid.id}` : base;
}
export function nativeLoginUrl(value) {
  if (typeof value !== 'string') return null;
  const match = /^https:\/\/finflow\.sysora\.io\/auth\/index\.php\?action=login&attempt=[A-Za-z0-9_-]{43}$/.exec(value);
  return match && match[0] === value ? value : null;
}
// Match the server's fixed handoff contract, including on React Native versions
// whose built-in URL implementation handles only HTTP authorities.
export function nativeReturnCode(value, expectedAttempt) {
  if (typeof value !== 'string') return null;
  const match = /^finflow:\/\/account\/?\?attempt=([A-Za-z0-9_-]{43})&code=([A-Za-z0-9_-]{43})$/.exec(value);
  return match && match[0] === value && match[1] === expectedAttempt ? match[2] : null;
}
