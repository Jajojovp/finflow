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
  try {
    const url = new URL(value);
    return url.origin === AUTH_ORIGIN && !url.username && !url.password && url.pathname === '/auth/index.php' && url.searchParams.get('action') === 'login' && /^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('attempt') || '') && [...url.searchParams.keys()].length === 2 && !url.hash ? url.href : null;
  } catch { return null; }
}
