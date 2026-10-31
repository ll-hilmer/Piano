// Offline-Fähigkeit: Die App selbst (Seiten, Skripte, PDF-Anzeige) wird auf dem Gerät zwischengespeichert.
// Seiten kommen bevorzugt frisch aus dem Netz, ohne Netz aus dem Zwischenspeicher. Deine Noten liegen ohnehin auf dem Gerät.
const VERSION = '__BUILD__';
const CACHE = 'notenleser-' + VERSION;
const FONTS = 'notenleser-fonts';
const CORE = [
  './', 'index.html', 'ueben.html', 'theorie.html', 'bibliothek.html', 'shared.js', 'mitspielen.js', 'shared.css',
  'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png',
  'vendor/pdf.min.js', 'vendor/pdf.worker.min.js', 'vendor/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Google-Anmeldung und Drive nie zwischenspeichern
  if (/(^|\.)googleapis\.com$|accounts\.google\.com$/.test(url.hostname) && !/^fonts\./.test(url.hostname)) return;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') c.put(req, res.clone());
      return res;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // Seiten: frisch aus dem Netz (höchstens 4 s warten), sonst aus dem Zwischenspeicher
    e.respondWith((async () => {
      const c = await caches.open(CACHE);
      try {
        const res = await withTimeout(fetch(req), 4000);
        if (res.ok) c.put(url.pathname.endsWith('/') ? './' : req, res.clone());
        return res;
      } catch (err) {
        return (await c.match(req, { ignoreSearch: true })) || (await c.match('./')) || Response.error();
      }
    })());
    return;
  }
  // Übrige Dateien: sofort aus dem Zwischenspeicher, im Hintergrund auffrischen.
  // Mit Versionskennung (?v=…) nur genau diese Fassung – nie ein altes Skript zu einer neuen Seite.
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: !url.searchParams.has('v') });
    const fresh = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    return hit || (await fresh) || Response.error();
  }));
});
