import { releaseAction } from './release.mjs';

function showRelease(platform, entry) {
  const href = releaseAction(platform, entry, location.origin);
  if (!href) return;
  const box = document.getElementById(`${platform}-release`);
  const status = document.createElement('span');
  status.className = 'status available';
  status.textContent = platform === 'android' ? `Android · v${entry.version}` : 'App iOS disponible';
  const link = document.createElement('a');
  link.className = 'button'; link.href = href;
  link.textContent = platform === 'android' ? 'Descargar APK de Android ↓' : 'Abrir distribución de Apple ↗';
  if (platform === 'android') link.download = `finflow-${entry.version}.apk`;
  const meta = document.createElement('p'); meta.className = 'artifact-meta';
  meta.textContent = platform === 'android' ? `${(entry.bytes / 1024 / 1024).toFixed(1)} MB · Firma verificada · SHA-256 del archivo:` : 'Instala desde el canal oficial de Apple.';
  if (platform === 'android') { const checksum = document.createElement('code'); checksum.textContent = entry.sha256; meta.append(checksum); }
  box.replaceChildren(status, meta, link);
}
try {
  const response = await fetch('./releases.json', { cache: 'no-store' });
  if (response.ok) { const data = await response.json(); showRelease('android', data.android); showRelease('ios', data.ios); }
} catch { /* The initial HTML keeps pending states and working web links. */ }

let installPrompt;
const install = document.getElementById('install-web');
window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); installPrompt = event; install.hidden = false; });
install.addEventListener('click', async () => {
  if (!installPrompt) return;
  try { await installPrompt.prompt(); const result = await installPrompt.userChoice; if (result.outcome === 'accepted') install.hidden = true; }
  finally { installPrompt = null; install.hidden = true; }
});
window.addEventListener('appinstalled', () => { install.hidden = true; installPrompt = null; });
if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.from('.intro > *', { y: 16, opacity: 0, stagger: .06, duration: .6, ease: 'power3.out' });
  gsap.from('.platform', { y: 20, opacity: 0, stagger: .08, duration: .65, delay: .15, ease: 'power3.out' });
}
