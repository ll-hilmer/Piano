// Gemeinsam für alle Seiten: Darstellung, Navigation mit Symbolen und Abgleich über Google Drive.
// Die Seite bindet dieses Skript direkt nach <nav id="nl-nav"> ein; es läuft sofort (Navigation ohne Flackern).
(function () {
  'use strict';
  const NL = (window.NL = window.NL || {});

  // ---------- Darstellung (Hell/Dunkel) früh setzen ----------
  try {
    let t = JSON.parse(localStorage.getItem('notenleser-theme') || 'null');
    if (!t) { const st = JSON.parse(localStorage.getItem('notenleser-v1') || '{}'); t = { choice: st.settings && st.settings.theme }; }
    if (t && (t.choice === 'light' || t.choice === 'dark')) document.documentElement.setAttribute('data-nl', t.choice);
  } catch (e) {}

  // ---------- Symbole (Linien, 24er-Raster, Farbe vom Text) ----------
  const P = {
    heute: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    ueben: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7.5 4v9h3V4M13.5 4v9h3V4M9 13v7M15 13v7"/>',
    bibliothek: '<path d="m16 6 4 14M12 6v14M8 8v12M4 4v16"/>',
    theorie: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    cloud: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
    cloudOk: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9.5 14 2 2 3.5-3.5"/>',
    cloudOff: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m3 3 18 18"/>',
    refresh: '<path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7L21 16"/><path d="M21 21v-5h-5"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    chord: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/><circle cx="9" cy="14" r="1.8"/><circle cx="9" cy="10" r="1.8"/><circle cx="15" cy="6" r="1.8"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/>',
    filter: '<path d="M3 5h18M6 12h12M10 19h4"/>'
  };
  NL.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;

  // ---------- Navigation ----------
  const PAGES = [
    { id: 'heute', label: 'Heute', href: './' },
    { id: 'ueben', label: 'Üben', href: 'ueben.html' },
    { id: 'bibliothek', label: 'Bibliothek', href: 'bibliothek.html' },
    { id: 'theorie', label: 'Theorie', href: 'theorie.html' }
  ];
  const file = (location.pathname.split('/').pop() || '').toLowerCase();
  const current = (PAGES.find(p => p.href === file) || PAGES[0]).id;
  NL.page = current;
  const nav = document.getElementById('nl-nav');
  if (nav) {
    nav.className = 'nl-nav';
    nav.setAttribute('aria-label', 'Hauptnavigation');
    nav.innerHTML = `<div class="nl-bar">
      <a class="nl-brand" href="./">Notenleser</a>
      <div class="nl-tabs">${PAGES.map(p => `<a class="nl-tab${p.id === current ? ' on' : ''}" href="${p.href}"${p.id === current ? ' aria-current="page"' : ''}>${NL.icon(p.id)}<span>${p.label}</span></a>`).join('')}</div>
      <button type="button" class="nl-sync" id="nl-sync" title="Google Drive">${NL.icon('cloudOff')}<span id="nl-sync-text">Nicht verbunden</span></button>
    </div>`;
  }

  // ---------- Google Drive ----------
  // Client-ID der eigenen Anmeldung (Google Cloud Console). Nicht geheim; kann auch auf der Startseite eingetragen werden.
  const DEFAULT_CLIENT_ID = '';
  const CFG_KEY = 'nl-drive';
  const DATA_KEYS = ['notenleser-v1', 'notenleser-theme'];
  const FILE_NAME = 'klavier-app.json';
  const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';
  const API = 'https://www.googleapis.com';
  const readJSON = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const writeJSON = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let cfg = readJSON(CFG_KEY, {});
  const saveCfg = () => writeJSON(CFG_KEY, cfg);
  NL.clientId = () => cfg.clientId || DEFAULT_CLIENT_ID;
  NL.setClientId = id => { cfg.clientId = String(id || '').trim(); saveCfg(); render(); };
  NL.redirectUri = () => new URL('./', location.href).href;
  NL.embedded = (() => { try { return window.top !== window.self; } catch (e) { return true; } })();
  NL.cfg = () => cfg;
  // Kennung dieses Geräts (für die Übungstage)
  NL.device = (() => { let d = null; try { d = localStorage.getItem('nl-device'); if (!d) { d = Math.random().toString(36).slice(2, 10); localStorage.setItem('nl-device', d); } } catch (e) { d = 'x'; } return d; })();
  NL.dayCount = v => (v && typeof v === 'object' ? Object.values(v).reduce((a, b) => a + b, 0) : v || 0);
  const tokenValid = () => cfg.token && cfg.exp && Date.now() < cfg.exp - 60000;

  // Status: off (nie verbunden) · setup (Client-ID fehlt) · ok · syncing · expired · offline · error
  let status = 'off', statusMsg = '';
  function setStatus(s, msg = '') { status = s; statusMsg = msg; render(); document.dispatchEvent(new CustomEvent('nl-status', { detail: { status, msg } })); }
  NL.status = () => ({ status, msg: statusMsg, email: cfg.email, lastSync: cfg.lastSync, folderId: cfg.folderId });

  const TEXT = { off: 'Nicht verbunden', setup: 'Nicht verbunden', ok: 'Synchron', syncing: 'Abgleich …', expired: 'Neu anmelden', offline: 'Offline', error: 'Fehler' };
  const ICON = { off: 'cloudOff', setup: 'cloudOff', ok: 'cloudOk', syncing: 'refresh', expired: 'cloud', offline: 'cloudOff', error: 'cloudOff' };
  function render() {
    const b = document.getElementById('nl-sync');
    if (!b) return;
    b.dataset.state = status;
    b.innerHTML = NL.icon(ICON[status]) + `<span id="nl-sync-text">${TEXT[status]}</span>`;
    b.title = status === 'ok' && cfg.lastSync ? `Google Drive: zuletzt abgeglichen ${new Date(cfg.lastSync).toLocaleString('de-DE')}` : statusMsg || 'Google Drive';
  }

  // Anmeldung per Weiterleitung (funktioniert auch auf dem iPad ohne Pop-up)
  NL.login = (silent = false) => {
    if (!NL.clientId() || NL.embedded) { location.href = './#konto'; return; }
    const ret = location.pathname.split('/').pop() || '';
    const p = new URLSearchParams({
      client_id: NL.clientId(), redirect_uri: NL.redirectUri(), response_type: 'token', scope: SCOPES,
      include_granted_scopes: 'true', state: (silent ? 's:' : 'i:') + ret
    });
    if (silent) p.set('prompt', 'none');
    if (cfg.email) p.set('login_hint', cfg.email);
    location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + p.toString();
  };
  NL.logout = () => {
    if (cfg.token) { try { fetch('https://oauth2.googleapis.com/revoke?token=' + encodeURIComponent(cfg.token), { method: 'POST', mode: 'no-cors' }); } catch (e) {} }
    cfg = { clientId: cfg.clientId };
    saveCfg();
    setStatus(NL.clientId() ? 'off' : 'setup');
  };

  // Rückkehr von Google: #access_token=…&expires_in=…&state=…
  (function handleReturn() {
    const h = location.hash.slice(1);
    if (!/(^|&)(access_token|error)=/.test(h)) return;
    const q = new URLSearchParams(h);
    const state = q.get('state') || '';
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (q.get('access_token')) {
      cfg.token = q.get('access_token');
      cfg.exp = Date.now() + (+q.get('expires_in') || 3600) * 1000;
      cfg.connected = true;
      saveCfg();
    } else {
      // Stille Anmeldung nicht möglich: einmal selbst bestätigen
      cfg.needLogin = true; saveCfg();
    }
    const back = state.slice(2);
    if (back && back !== (location.pathname.split('/').pop() || '')) location.replace(back);
  })();

  async function api(path, opts = {}) {
    if (!tokenValid()) { const e = new Error('expired'); e.code = 401; throw e; }
    const r = await fetch(API + path, { ...opts, headers: { Authorization: 'Bearer ' + cfg.token, ...(opts.headers || {}) } });
    if (r.status === 401) { cfg.token = null; saveCfg(); const e = new Error('expired'); e.code = 401; throw e; }
    if (!r.ok) { const e = new Error('Drive ' + r.status); e.code = r.status; throw e; }
    return r;
  }
  const q = s => encodeURIComponent(s);
  async function findDataFile() {
    if (cfg.fileId) return cfg.fileId;
    const r = await (await api(`/drive/v3/files?spaces=appDataFolder&fields=files(id)&q=${q(`name='${FILE_NAME}'`)}`)).json();
    cfg.fileId = r.files && r.files[0] ? r.files[0].id : null;
    saveCfg();
    return cfg.fileId;
  }
  async function ensureSetup() {
    if (!cfg.email) {
      const a = await (await api('/drive/v3/about?fields=user(displayName,emailAddress)')).json();
      cfg.email = a.user && a.user.emailAddress; cfg.name = a.user && a.user.displayName; saveCfg();
    }
    if (!cfg.folderId) {
      // Sichtbarer Ordner für die Noten (die App sieht nur Dateien, die sie selbst angelegt hat)
      const f = await (await api(`/drive/v3/files?fields=files(id)&q=${q("name='Klavier-App' and mimeType='application/vnd.google-apps.folder' and trashed=false")}`)).json();
      if (f.files && f.files[0]) cfg.folderId = f.files[0].id;
      else {
        const c = await (await api('/drive/v3/files?fields=id', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Klavier-App', mimeType: 'application/vnd.google-apps.folder' }) })).json();
        cfg.folderId = c.id;
      }
      saveCfg();
    }
  }

  // ---------- Zusammenführen: beide Geräte dürfen geübt haben ----------
  const maxBy = (a, b, f) => (f(a) >= f(b) ? a : b);
  function mergeStore(L, R) {
    if (!R) return L; if (!L) return R;
    const newer = (L._mod || 0) >= (R._mod || 0) ? L : R, older = newer === L ? R : L;
    const out = JSON.parse(JSON.stringify(newer));
    out.best = Math.max(L.best || 0, R.best || 0);
    out.best60 = { ...(older.best60 || {}) };
    Object.entries(newer.best60 || {}).forEach(([k, v]) => { out.best60[k] = Math.max(v, out.best60[k] || 0); });
    out.notes = { ...(older.notes || {}) };
    Object.entries(newer.notes || {}).forEach(([k, v]) => { const o = out.notes[k]; out.notes[k] = o ? maxBy(v, o, x => x.seen || 0) : v; });
    // Übungstage: je Tag und Gerät gezählt, damit sich PC und iPad addieren, ohne doppelt zu zählen
    out.days = {};
    [older.days || {}, newer.days || {}].forEach(src => Object.entries(src).forEach(([day, per]) => {
      if (typeof per !== 'object') per = { alt: per };
      const o = out.days[day] || (out.days[day] = {});
      Object.entries(per).forEach(([dev, n]) => { o[dev] = Math.max(n, o[dev] || 0); });
    }));
    if (L.path || R.path) {
      out.path = { ...((older.path) || {}) };
      Object.entries(newer.path || {}).forEach(([c, v]) => { const o = out.path[c]; out.path[c] = o ? maxBy(v, o, x => x.n || 0) : v; });
    }
    out.ptempo = { ...(older.ptempo || {}), ...(newer.ptempo || {}) };
    return out;
  }
  const mergeTheme = (L, R) => (!R ? L : !L ? R : (L.t || 0) >= (R.t || 0) ? L : R);
  NL.mergeStore = mergeStore;
  function mergeAll(local, remote) {
    return { 'notenleser-v1': mergeStore(local['notenleser-v1'], remote['notenleser-v1']), 'notenleser-theme': mergeTheme(local['notenleser-theme'], remote['notenleser-theme']) };
  }
  const readLocal = () => { const o = {}; DATA_KEYS.forEach(k => { o[k] = readJSON(k, null); }); return o; };

  let busy = null, again = false;
  NL.sync = async function sync() {
    if (busy) { again = true; return busy; }
    if (!cfg.connected || !NL.clientId()) return;
    if (!tokenValid()) { setStatus('expired', 'Die Anmeldung ist abgelaufen. Tippen, um dich neu anzumelden.'); return; }
    if (!navigator.onLine) { setStatus('offline', 'Kein Internet. Änderungen werden später abgeglichen.'); return; }
    busy = (async () => {
      setStatus('syncing');
      try {
        await ensureSetup();
        const id = await findDataFile();
        const remote = id ? ((await (await api(`/drive/v3/files/${id}?alt=media`)).json()).data || {}) : {};
        const local = readLocal();
        const merged = mergeAll(local, remote);
        const changedLocal = DATA_KEYS.some(k => JSON.stringify(merged[k]) !== JSON.stringify(local[k]));
        if (changedLocal) {
          DATA_KEYS.forEach(k => { if (merged[k] != null) writeJSON(k, merged[k]); });
          document.dispatchEvent(new CustomEvent('nl-synced'));
        }
        if (DATA_KEYS.some(k => JSON.stringify(merged[k]) !== JSON.stringify(remote[k]))) {
          const body = JSON.stringify({ v: 1, saved: new Date().toISOString(), data: merged });
          if (id) await api(`/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
          else {
            const bd = 'nl' + Math.random().toString(36).slice(2);
            const multipart = `--${bd}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: FILE_NAME, parents: ['appDataFolder'] })}\r\n`
              + `--${bd}\r\nContent-Type: application/json\r\n\r\n${body}\r\n--${bd}--`;
            const c = await (await api('/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + bd }, body: multipart })).json();
            cfg.fileId = c.id;
          }
        }
        cfg.lastSync = Date.now(); cfg.dirty = false; cfg.needLogin = false; saveCfg();
        setStatus('ok');
      } catch (e) {
        if (e.code === 401) setStatus('expired', 'Die Anmeldung ist abgelaufen. Tippen, um dich neu anzumelden.');
        else if (!navigator.onLine || e instanceof TypeError) setStatus('offline', 'Keine Verbindung zu Google Drive. Änderungen werden später abgeglichen.');
        else setStatus('error', 'Abgleich fehlgeschlagen (' + e.message + '). Versuch es später noch einmal.');
      }
    })();
    try { await busy; } finally { busy = null; }
    if (again) { again = false; return NL.sync(); }
  };

  // Seiten melden Änderungen; nach kurzer Ruhe wird hochgeladen
  let timer = 0;
  NL.changed = () => {
    if (!cfg.connected) return;
    cfg.dirty = true; saveCfg();
    clearTimeout(timer);
    timer = setTimeout(() => NL.sync(), 4000);
  };
  window.addEventListener('online', () => { if (cfg.connected) NL.sync(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && cfg.dirty) NL.sync(); });

  function init() {
    const b = document.getElementById('nl-sync');
    if (b) b.addEventListener('click', () => {
      if (status === 'expired' || (cfg.connected && !tokenValid())) NL.login(false);
      else if (cfg.connected) NL.sync();
      else location.href = './#konto';
    });
    if (!NL.clientId()) return setStatus('setup');
    if (!cfg.connected) return setStatus('off');
    if (tokenValid()) { NL.sync(); return; }
    // Beim Öffnen der Startseite still neu anmelden (einmal pro Sitzung), sonst Hinweis in der Leiste
    let tried = false;
    try { tried = sessionStorage.getItem('nl-silent') === '1'; } catch (e) {}
    if (current === 'heute' && !tried && !cfg.needLogin && !NL.embedded && navigator.onLine) {
      try { sessionStorage.setItem('nl-silent', '1'); } catch (e) {}
      NL.login(true);
    }
    else setStatus('expired', 'Die Anmeldung ist abgelaufen. Tippen, um dich neu anzumelden.');
  }
  render();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
