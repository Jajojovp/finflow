/**
 * QA visual / a11y / perf para la landing FinFlow v3 Dark Luxe.
 *
 * Uso:
 *   node docs/qa/run/playwright-landing.cjs
 *
 * El script levanta `vite preview` en un child process controlado, corre
 * los escenarios con Chromium (Playwright cacheado por npx, sin tocar
 * package.json) y vuelca:
 *   - docs/qa/run/out/playwright-results.json   (maquina)
 *   - docs/qa/run/out/preview.log                (log del preview)
 *   - docs/qa/run/out/run.log                    (log del harness)
 *   - docs/qa/screenshots/*.png                  (evidencia visual)
 *
 * No usa axe-core (no instalado); hace chequeos a11y manuales accionables.
 */

'use strict';

const { createRequire } = require('module');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

// Resuelve Playwright desde el cache de npx sin tocar package.json.
const NPM_CACHE = process.env.NPM_CONFIG_CACHE || 'C:\\Users\\jairo\\AppData\\Local\\npm-cache';
const PW_CANDIDATES = [
  path.join(NPM_CACHE, '_npx', 'e41f203b7505f1fb', 'node_modules', 'playwright'),
  path.join(NPM_CACHE, '_npx', '9833c18b2d85bc59', 'node_modules', 'playwright'),
];
let playwrightPath = null;
for (const c of PW_CANDIDATES) {
  if (fs.existsSync(path.join(c, 'package.json'))) { playwrightPath = c; break; }
}
if (!playwrightPath) {
  throw new Error('No se encontro playwright cacheado por npx en ' + NPM_CACHE);
}
const requireFromHere = createRequire(__filename);
const { chromium } = requireFromHere(playwrightPath);

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const OUT_DIR = path.join(__dirname, 'out');
const SHOTS_DIR = path.join(REPO_ROOT, 'docs', 'qa', 'screenshots');
const PORT = process.env.PREVIEW_PORT || '4173';
const BASE_URL = `http://localhost:${PORT}/`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(SHOTS_DIR, { recursive: true });

const runLog = fs.createWriteStream(path.join(OUT_DIR, 'run.log'), { flags: 'w' });
function logLine(msg) {
  const ts = new Date().toISOString();
  const line = `[${ts}] ${msg}`;
  console.log(line);
  runLog.write(line + os.EOL);
}

function spawnPreview() {
  const previewLog = fs.createWriteStream(path.join(OUT_DIR, 'preview.log'), { flags: 'w' });
  const child = spawn(
    process.execPath,
    [path.join(REPO_ROOT, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--port', PORT, '--strictPort'],
    { cwd: REPO_ROOT, windowsHide: true }
  );
  child.stdout.on('data', (d) => previewLog.write(d));
  child.stderr.on('data', (d) => previewLog.write(d));
  child.on('exit', (code) => logLine(`preview exited code=${code}`));
  return child;
}

async function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 2000);
      const res = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok || res.status === 404) {
        logLine(`preview respondio status=${res.status}`);
        return true;
      }
    } catch (_) { /* todavia no */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

const VIEWPORTS = [
  { label: 'mobile-iphone-se', width: 375, height: 812 },
  { label: 'tablet-ipad', width: 768, height: 1024 },
  { label: 'laptop', width: 1024, height: 768 },
  { label: 'desktop', width: 1440, height: 900 },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function readPerf(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    return {
      ttfb: Math.round(nav.responseStart || 0),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
      loadEventEnd: Math.round(nav.loadEventEnd || 0),
      transferSize: nav.transferSize || 0,
      encodedBodySize: nav.encodedBodySize || 0,
      lcp: Math.round(window.__lcp || 0),
      lcpInfo: window.__lcpInfo || null,
      lcpEntries: window.__lcpEntries || [],
      clsAvgFixed: Number((window.__cls || 0).toFixed(4)),
      inpMax: Math.round(window.__inpMax || 0),
    };
  });
}

async function injectPerfCollector(page) {
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__lcpInfo = null;
    window.__lcpEntries = [];
    window.__cls = 0;
    window.__inpMax = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const el = e.element;
          const info = {
            startTime: Math.round(e.startTime),
            size: e.size,
            url: e.url || null,
            tag: el ? el.tagName.toLowerCase() : null,
            className: el ? (el.className || '').toString().slice(0, 80) : null,
            rect: el ? (() => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })() : null,
          };
          window.__lcpEntries.push(info);
          if (e.startTime > window.__lcp) {
            window.__lcp = e.startTime;
            window.__lcpInfo = info;
          }
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        const inc = list.getEntries().reduce((s, e) => s + (e.hadRecentInput ? 0 : e.value), 0);
        window.__cls += inc;
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.interactionId && e.duration > window.__inpMax) window.__inpMax = e.duration;
        }
      }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
    } catch (_) { /* observadores no disponibles */ }
  });
}

async function main() {
  logLine(`playwrightPath=${playwrightPath}`);
  logLine(`repoRoot=${REPO_ROOT}`);
  logLine(`baseUrl=${BASE_URL}`);

  const previewChild = spawnPreview();
  logLine(`preview pid=${previewChild.pid}`);
  const ok = await waitForServer(BASE_URL, 30000);
  if (!ok) {
    logLine('ERROR: preview no respondio en 30s; abortando.');
    previewChild.kill('SIGKILL');
    process.exitCode = 3;
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const results = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, viewports: {}, anchors: {}, routes: {}, reducedMotion: null, keyboard: null, axe: 'NOT_RUN' };

  try {
    // ---- por viewport ----
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        reducedMotion: 'no-preference',
      });
      const page = await ctx.newPage();
      await injectPerfCollector(page);
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

      const t0 = Date.now();
      const resp = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      const navMs = Date.now() - t0;

      // estabiliza animaciones / fonts
      await sleep(1500);

      const overflow = await page.evaluate(() => ({
        scrollW: document.documentElement.scrollWidth,
        clientW: document.documentElement.clientWidth,
        bodyScrollW: document.body.scrollWidth,
        scrollH: document.documentElement.scrollHeight,
      }));
      const a11y = await page.evaluate(() => {
        const main = document.querySelector('main');
        const h1 = document.querySelectorAll('h1');
        const h1Text = Array.from(h1).map((e) => e.textContent.trim()).join(' | ').slice(0, 200);
        const headings = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map((h) => h.tagName + ':' + (h.textContent || '').trim().slice(0, 60));
        const navLandmark = document.querySelector('header nav[aria-label]');
        const navLabel = navLandmark ? navLandmark.getAttribute('aria-label') : null;
        const navLinks = Array.from(document.querySelectorAll('header a, header button')).map((el) => ({
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          href: el.getAttribute('href') || null,
        }));
        const interWithoutName = Array.from(document.querySelectorAll('a,button,[role="button"],[role="link"]')).filter((el) => {
          const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('title') || '').trim();
          return name.length === 0;
        }).length;
        const heroVideo = document.querySelector('section video');
        const toggleBtn = document.querySelector('header button[aria-label="Toggle menu"]');
        return {
          hasMain: Boolean(main),
          h1Count: h1.length,
          h1Text,
          headingLevels: headings.length,
          navLandmarkLabel: navLabel,
          navInteractive: navLinks,
          interactiveWithoutName: interWithoutName,
          hasVideo: Boolean(heroVideo),
          videoReadyState: heroVideo ? heroVideo.readyState : null,
          videoPaused: heroVideo ? heroVideo.paused : null,
          hasToggle: Boolean(toggleBtn),
          toggleVisible: toggleBtn ? toggleBtn.offsetParent !== null : null,
        };
      });

      //截图 viewport + full page
      const shotViewport = path.join(SHOTS_DIR, `landing-${vp.label}-${vp.width}x${vp.height}.png`);
      const shotFull = path.join(SHOTS_DIR, `landing-${vp.label}-${vp.width}x${vp.height}-full.png`);
      await page.screenshot({ path: shotViewport, fullPage: false });
      await page.screenshot({ path: shotFull, fullPage: true });

      const perf = await readPerf(page);

      results.viewports[vp.label] = {
        width: vp.width,
        height: vp.height,
        navMs,
        status: resp ? resp.status() : null,
        overflowX: overflow.scrollW - overflow.clientW,
        fullScrollH: overflow.scrollH,
        consoleErrors: errors,
        a11y,
        perf,
        screenshots: { viewport: path.basename(shotViewport), full: path.basename(shotFull) },
      };
      logLine(`viewport ${vp.label} ${vp.width}x${vp.height}: nav=${navMs}ms overflowX=${overflow.scrollW - overflow.clientW} video=${a11y.hasVideo} h1=${a11y.h1Count}`);
      await ctx.close();
    }

    // ---- anchors #features / #how-it-works ----
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(1000);
      for (const id of ['features', 'how-it-works']) {
        const r = await page.evaluate((id) => {
          const el = document.getElementById(id);
          if (!el) return { found: false };
          const before = el.getBoundingClientRect().top + window.scrollY;
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          const after = el.getBoundingClientRect();
          return {
            found: true,
            tag: el.tagName,
            offsetTopBefore: Math.round(before),
            visibleTopAfter: Math.round(after.top),
            inViewport: after.top >= 0 && after.top < window.innerHeight,
          };
        }, id);
        // ademas, clicar el enlace real <a href="#id"> y confirmar hash + scroll
        const clickRes = { attempted: false };
        try {
          const linkHandle = await page.$(`a[href="#${id}"]`);
          if (linkHandle) {
            clickRes.attempted = true;
            await linkHandle.click();
            await sleep(600);
            clickRes.after = await page.evaluate(() => ({
              hash: location.hash,
              scrollY: window.scrollY,
            }));
            const target = await page.evaluate((id) => {
              const el = document.getElementById(id);
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { top: Math.round(r.top), inViewport: r.top >= 0 && r.top < window.innerHeight };
            }, id);
            clickRes.targetAfterClick = target;
          }
        } catch (e) { clickRes.error = String(e); }
        results.anchors[id] = { ...r, click: clickRes };
        logLine(`anchor #${id}: ${JSON.stringify(results.anchors[id])}`);
      }
      await ctx.close();
    }

    // ---- link /dashboard (router) ----
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(800);
      // Click on first /dashboard link (the "Open app" CTA). Some are <a href="/dashboard">, some are <Link to>.
      const dashLinks = await page.$$eval('a[href="/dashboard"]', (els) => els.map((e) => ({ label: (e.textContent || '').trim().slice(0, 30), visible: e.offsetParent !== null })));
      // find first visible
      const visibleIdx = dashLinks.findIndex((d) => d.visible);
      results.routes.dashboard = { foundLinks: dashLinks, clickedIdx: visibleIdx, errorsBefore: errors.slice() };
      if (visibleIdx >= 0) {
        const links = await page.$$('a[href="/dashboard"]');
        await links[visibleIdx].click();
        await page.waitForURL(/\/dashboard/, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
        await sleep(800);
        const after = await page.evaluate(() => ({
          url: location.href,
          hasMain: Boolean(document.querySelector('main') || document.querySelector('[role="main"]')),
          title: document.title,
          bodyText: (document.body.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
        }));
        results.routes.dashboard.after = after;
        results.routes.dashboard.errorsAfter = errors.slice();
        await page.screenshot({ path: path.join(SHOTS_DIR, 'route-dashboard-1440x900.png') });
      } else {
        results.routes.dashboard.error = 'No se encontro /dashboard link visible';
      }
      logLine(`route /dashboard: url=${results.routes.dashboard.after ? results.routes.dashboard.after.url : 'N/A'} errors=${errors.length}`);
      await ctx.close();
    }

    // ---- teclado / foco ----
    {
      const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'no-preference' });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(800);
      const trace = [];
      let escapesBeforeClose = null;
      let escapeClosedMenu = null;
      let trapHit = false;
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        const info = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el) return { tag: null };
          const cs = window.getComputedStyle(el);
          const visibleOutline =
            cs.outlineStyle !== 'none' &&
            cs.outlineWidth !== '0px' &&
            cs.outlineColor.indexOf('rgba(0, 0, 0, 0)') === -1;
          // Tailwind `ring-*` implementa el anillo con box-shadow luego de
          // `outline-none`; hay que inspeccionar ambos para no dar falsos negativos.
          const visibleRingBox = cs.boxShadow !== 'none' && cs.boxShadow.indexOf('ring') === -1
            ? cs.boxShadow.includes('rgb(245, 197, 24)') ||
              cs.boxShadow.toLowerCase().includes('#f5c31d') ||
              /\b0px 0px 0px 2px rgb\(245, 197, 24\)/.test(cs.boxShadow) ||
              cs.boxShadow.includes('245, 197, 24')
            : false;
          return {
            tag: el.tagName.toLowerCase(),
            label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
            href: el.getAttribute('href'),
            offsetParent: el.offsetParent !== null,
            outlineStyle: cs.outlineStyle,
            outlineWidth: cs.outlineWidth,
            outlineColor: cs.outlineColor,
            boxShadow: cs.boxShadow.slice(0, 60),
            hasVisibleOutline: visibleOutline,
            hasVisibleRingBox: visibleRingBox,
            hasVisibleFocus: visibleOutline || visibleRingBox,
          };
        });
        trace.push(info);
        if (info.tag === 'body' && i > 0) trapHit = false; // wrap esperado en Tab
      }
      // mobile menu: enfocar toggle, activar, esperar render de React, medir abierto
      const toggleBefore = await page.$eval('header button[aria-label="Toggle menu"]', (el) => el.offsetParent !== null).catch(() => false);
      await page.focus('header button[aria-label="Toggle menu"]');
      await page.click('header button[aria-label="Toggle menu"]');
      await sleep(600);
      const afterOpen = await page.evaluate(() => {
        const menu = document.getElementById('landing-mobile-menu');
        const btn = document.querySelector('header button[aria-label="Toggle menu"]');
        return {
          menuVisible: menu ? menu.offsetParent !== null : false,
          expanded: btn ? btn.getAttribute('aria-expanded') : null,
          menuLinks: menu ? Array.from(menu.querySelectorAll('a,button')).map((a) => (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 30)) : [],
        };
      });
      await page.screenshot({ path: path.join(SHOTS_DIR, 'mobile-menu-open-375x812.png'), fullPage: false });
      // Escape deberia cerrar el panel
      await page.keyboard.press('Escape');
      await sleep(600);
      const afterEscape = await page.evaluate(() => {
        const menu = document.getElementById('landing-mobile-menu');
        const btn = document.querySelector('header button[aria-label="Toggle menu"]');
        return {
          menuVisible: menu ? menu.offsetParent !== null : false,
          expanded: btn ? btn.getAttribute('aria-expanded') : null,
        };
      });
      // cierre explicito con boton (control positivo)
      await page.click('header button[aria-label="Toggle menu"]');
      await sleep(600);
      const afterToggleClose = await page.evaluate(() => {
        const menu = document.getElementById('landing-mobile-menu');
        const btn = document.querySelector('header button[aria-label="Toggle menu"]');
        return {
          menuVisible: menu ? menu.offsetParent !== null : (!menu ? null : false),
          expanded: btn ? btn.getAttribute('aria-expanded') : null,
          menuPresent: Boolean(menu),
        };
      });
      results.keyboard = { focusTrace: trace, trapHit, toggleBefore, afterOpen, afterEscape, afterToggleClose };
      logLine(`keyboard: trace=${trace.length} afterOpen=${JSON.stringify(afterOpen)} afterEscape=${JSON.stringify(afterEscape)} afterToggleClose=${JSON.stringify(afterToggleClose)}`);
      await ctx.close();
    }

    // ---- reduced-motion (video se oculta, fallback solido) ----
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      const page = await ctx.newPage();
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await sleep(1000);
      const rmInfo = await page.evaluate(() => {
        const matchMQ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const heroVideo = document.querySelector('section video');
        const heroSection = document.querySelector('section');
        const cs = heroSection ? window.getComputedStyle(heroSection) : null;
        return {
          matchesReducedMotion: matchMQ,
          hasVideo: Boolean(heroVideo),
          heroBgColor: cs ? cs.backgroundColor : null,
          heroBackground: cs ? cs.backgroundImage.slice(0, 80) : null,
        };
      });
      results.reducedMotion = rmInfo;
      await page.screenshot({ path: path.join(SHOTS_DIR, 'reduced-motion-landing-1440x900.png'), fullPage: false });
      logLine(`reducedMotion: ${JSON.stringify(rmInfo)}`);
      await ctx.close();
    }

    fs.writeFileSync(path.join(OUT_DIR, 'playwright-results.json'), JSON.stringify(results, null, 2));
    logLine(`resultados escritos en ${path.join(OUT_DIR, 'playwright-results.json')}`);
  } catch (err) {
    logLine('ERROR harness: ' + (err && err.stack ? err.stack : String(err)));
    process.exitCode = 4;
    fs.writeFileSync(path.join(OUT_DIR, 'playwright-results.json'), JSON.stringify({ ...results, error: String(err) }, null, 2));
  } finally {
    await browser.close();
    previewChild.kill('SIGKILL');
    runLog.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});