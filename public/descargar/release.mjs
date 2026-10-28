export function releaseAction(platform, entry, origin) {
  if (entry?.status !== 'available') return null;
  try {
    const url = new URL(entry.url, origin);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (platform === 'android') {
      if (url.origin !== origin || !/^\/downloads\/finflow-[\d.]+\.apk$/.test(url.pathname) || url.search || url.hash || !/^[a-f0-9]{64}$/.test(entry.sha256) || !/^[a-f0-9]{64}$/.test(entry.certificateSha256) || !Number.isSafeInteger(entry.bytes) || entry.bytes <= 0 || !/^\d+\.\d+\.\d+$/.test(entry.version)) return null;
    } else if (platform === 'ios') {
      if (!['testflight.apple.com', 'apps.apple.com'].includes(url.hostname)) return null;
    } else return null;
    return url.href;
  } catch { return null; }
}
