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
    filter: '<path d="M3 5h18M6 12h12M10 19h4"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    highlighter: '<path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/>',
    eraser: '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    text: '<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-6-2.3l-3.6-3.6a2 2 0 0 1 2.8-2.8L7 15"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
    move: '<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>'
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
  const DATA_KEYS = ['notenleser-v1', 'notenleser-theme', 'nl-library'];
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
  NL.ready = () => !!(cfg.connected && NL.clientId() && tokenValid() && navigator.onLine);
  NL.api = (...a) => api(...a);
  NL.ensureSetup = () => ensureSetup().then(() => cfg.folderId);
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

  // ---------- Repertoire: Wiederholungsplan, Stück des Tages, Übungstage ----------
  const DAY = 86400000;
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const startOfDay = (t = Date.now()) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  NL.dayKey = dayKey;
  NL.lib = {
    read: () => { const l = readJSON('nl-library', null) || {}; l.pieces = l.pieces || {}; return l; },
    write: l => { l._mod = Date.now(); writeJSON('nl-library', l); NL.changed(); }
  };
  // Übungstag vermerken (zählt für Serie und Kalender), auch wenn nur aus eigenen Noten gespielt wurde
  NL.markPractice = (n = 1) => {
    const st = readJSON('notenleser-v1', {}) || {};
    st.days = st.days || {};
    const d = st.days[dayKey()] = typeof st.days[dayKey()] === 'object' ? st.days[dayKey()] : {};
    d[NL.device] = (d[NL.device] || 0) + n;
    st._mod = Date.now();
    writeJSON('notenleser-v1', st);
    NL.changed();
  };
  const RATE = { good: 'Lief gut', shaky: 'Holprig', forgot: 'Vergessen' };
  NL.rep = {
    RATE,
    // Im Plan: was sitzt oder holprig ist („Offen“ und „Lerne ich“ nicht), sofern nicht pausiert
    inPlan: p => !p.deleted && (p.status === 'sure' || p.status === 'shaky') && !(p.rep && p.rep.paused),
    // Noch nie bewertet: ab dem Tag nach dem Hinzufügen fällig (bloßes Ansehen verschiebt nichts)
    due: p => (p.rep && p.rep.due) || startOfDay((p.added || Date.now()) + DAY),
    daysUntil: p => Math.round((startOfDay(NL.rep.due(p)) - startOfDay()) / DAY),
    dueText(p) {
      const n = NL.rep.daysUntil(p);
      return n < -1 ? `seit ${-n} Tagen fällig` : n === -1 ? 'seit gestern fällig' : n === 0 ? 'heute fällig' : n === 1 ? 'morgen fällig' : `in ${n} Tagen fällig`;
    },
    // Bewertung: gut = Abstand verdoppeln, holprig = halbieren, vergessen = morgen wieder
    rate(p, r) {
      const rp = p.rep = p.rep || {};
      const prev = rp.interval || Math.max(3, Math.min(30, Math.round((Date.now() - (p.added || Date.now())) / DAY)));
      rp.interval = r === 'good' ? Math.min(120, Math.max(4, Math.round(prev * 2))) : r === 'shaky' ? Math.min(14, Math.max(2, Math.round(prev / 2))) : 1;
      rp.due = startOfDay() + rp.interval * DAY;
      rp.last = Date.now();
      rp.count = (rp.count || 0) + 1;
      rp.hist = [...(rp.hist || []), { d: dayKey(), r }].slice(-12);
      const lastTwo = rp.hist.slice(-2).map(h => h.r);
      if (p.status === 'open') p.status = 'learn';          // zum ersten Mal gespielt: jetzt wird gelernt
      else if (r === 'forgot' || (r === 'shaky' && p.status === 'sure')) p.status = 'shaky';
      else if (r === 'good' && lastTwo.length === 2 && lastTwo.every(x => x === 'good') && p.status !== 'learn') p.status = 'sure';
      p.opened = Date.now();
      p.updated = Date.now();
      return rp.interval;
    },
    ratedToday: p => !!(p.rep && p.rep.hist && p.rep.hist.some(h => h.d === dayKey())),
    // Fällige zuerst; holprige und lange überfällige häufiger, etwas Zufall gegen Eintönigkeit
    ranked(lib, exclude = []) {
      return Object.values(lib.pieces).filter(p => NL.rep.inPlan(p) && !exclude.includes(p.id))
        .map(p => ({ p, score: -NL.rep.daysUntil(p) + (p.status === 'shaky' ? 3 : 0) + Math.random() * 1.5 - (NL.rep.ratedToday(p) ? 50 : 0) }))
        .sort((a, b) => b.score - a.score).map(x => x.p);
    },
    // Stück des Tages: einmal pro Tag gewählt und auf allen Geräten gleich
    daily(lib, reroll = false) {
      const today = dayKey(), d = lib.daily;
      const valid = d && d.date === today && lib.pieces[d.id] && NL.rep.inPlan(lib.pieces[d.id]);
      if (valid && !reroll) return lib.pieces[d.id];
      const skip = reroll && d && d.date === today ? [...(d.skipped || []), d.id] : [];
      const pick = NL.rep.ranked(lib, skip)[0] || (skip.length ? NL.rep.ranked(lib)[0] : null);
      lib.daily = pick ? { date: today, id: pick.id, t: Date.now(), skipped: skip } : null;
      NL.lib.write(lib);
      return pick;
    }
  };
  // Deckblatt eines Stücks aus dem Gerätespeicher der Bibliothek
  NL.thumb = id => new Promise(res => {
    try {
      const r = indexedDB.open('notenleser', 2);
      r.onupgradeneeded = () => ['files', 'thumbs', 'annots'].forEach(n => { if (!r.result.objectStoreNames.contains(n)) r.result.createObjectStore(n); });
      r.onerror = () => res(null);
      r.onsuccess = () => {
        try {
          const g = r.result.transaction('thumbs').objectStore('thumbs').get(id);
          g.onsuccess = () => res(g.result ? URL.createObjectURL(g.result) : null);
          g.onerror = () => res(null);
        } catch (e) { res(null); }
      };
    } catch (e) { res(null); }
  });
  // Serie: Tage in Folge mit Übung; ein ausgelassener Tag pro Woche (Mo–So) wird von einem Joker überbrückt
  NL.streak = days => {
    const has = d => NL.dayCount(days[dayKey(d)]) > 0;
    const wk = d => { const m = new Date(d); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return dayKey(m); };
    const d = new Date(); d.setHours(12, 0, 0, 0);
    const used = {};
    let streak = 0, pending = null;                   // ein Joker zählt erst, wenn davor wieder geübt wurde
    if (!has(d)) d.setDate(d.getDate() - 1);          // heute zählt erst, wenn geübt wurde
    for (let i = 0; i < 800; i++) {
      if (has(d)) { streak++; if (pending) { used[pending[0]] = pending[1]; pending = null; } }
      else if (!pending && !used[wk(d)]) pending = [wk(d), dayKey(d)];
      else break;
      d.setDate(d.getDate() - 1);
    }
    const thisWeek = wk(new Date());
    return { streak, jokerUsed: used[thisWeek] || null, jokers: used };
  };

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
  // Bibliothek: je Stück gewinnt die zuletzt geänderte Fassung; Gelöschtes bleibt als Vermerk erhalten
  function mergeLibrary(L, R) {
    if (!R) return L; if (!L) return R;
    const pieces = { ...(R.pieces || {}) };
    Object.entries(L.pieces || {}).forEach(([id, p]) => { const o = pieces[id]; if (!o || (p.updated || 0) >= (o.updated || 0)) pieces[id] = p; });
    // Stück des Tages: die zuletzt gesetzte Wahl gilt auf allen Geräten
    const daily = !L.daily ? R.daily : !R.daily ? L.daily : (L.daily.t || 0) >= (R.daily.t || 0) ? L.daily : R.daily;
    return { pieces, daily, _mod: Math.max(L._mod || 0, R._mod || 0) };
  }
  NL.mergeLibrary = mergeLibrary;
  function mergeAll(local, remote) {
    return {
      'notenleser-v1': mergeStore(local['notenleser-v1'], remote['notenleser-v1']),
      'notenleser-theme': mergeTheme(local['notenleser-theme'], remote['notenleser-theme']),
      'nl-library': mergeLibrary(local['nl-library'], remote['nl-library'])
    };
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

  // ---------- Fokus-Timer ----------
  // Läuft seitenübergreifend: gespeichert wird nur, wann er endet ({ dur, end } bzw. pausiert { dur, left, paused }).
  // Am Ende ein sanfter Dreiklang; die Einheit zählt für die Übe-Serie.
  const TKEY = 'nl-timer';
  const T = { els: [], iv: 0, ac: null };
  const tState = () => readJSON(TKEY, null);
  const tLeft = s => (!s || s.done ? 0 : s.paused ? s.left : Math.max(0, s.end - Date.now()));
  const tFmt = ms => { const x = Math.ceil(ms / 1000); return `${Math.floor(x / 60)}:${String(x % 60).padStart(2, '0')}`; };
  const tMin = s => Math.round(s.dur / 60000);
  function tWrite(st) { if (st) writeJSON(TKEY, st); else { try { localStorage.removeItem(TKEY); } catch (e) {} } tRender(); }
  function tUnlock() { try { T.ac = T.ac || new (window.AudioContext || window.webkitAudioContext)(); if (T.ac.state === 'suspended') T.ac.resume(); } catch (e) {} }
  function tChime() {
    tUnlock();
    if (!T.ac) return;
    const t0 = T.ac.currentTime + 0.05;
    [[1046.5, 0], [1318.5, 0.2], [1568, 0.4]].forEach(([f, d]) => {
      const o = T.ac.createOscillator(), g = T.ac.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t0 + d); g.gain.linearRampToValueAtTime(0.16, t0 + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 1.8);
      o.connect(g); g.connect(T.ac.destination); o.start(t0 + d); o.stop(t0 + d + 1.9);
    });
  }
  // Auf dem iPad darf Ton erst nach einer Berührung der Seite kommen: dabei schon vorbereiten
  document.addEventListener('pointerdown', () => { if (tState()) tUnlock(); }, { capture: true, passive: true });
  window.addEventListener('storage', e => { if (e.key === TKEY) tRender(); });
  function tFinish(st) {
    writeJSON(TKEY, { dur: st.dur, done: st.end });
    NL.markPractice(1);
    if (Date.now() - st.end < 20000) tChime();
    T.els.forEach(el => { if (el.kind === 'pill') el.open = true; });
    tRender();
    document.dispatchEvent(new CustomEvent('nl-timer-done'));
  }
  function tTick() {
    const st = tState();
    if (st && !st.done && !st.paused && st.end <= Date.now()) { tFinish(st); return; }
    if (st && st.done && Date.now() - st.done > 10 * 60000) { tWrite(null); return; }   // Erfolgsmeldung nach 10 Minuten wieder weg
    const left = tLeft(st), pc = st && !st.done ? Math.min(100, 100 * (1 - left / st.dur)) : 0;
    T.els.forEach(el => {
      el.box.querySelectorAll('[data-t]').forEach(x => { x.textContent = tFmt(left); });
      el.box.querySelectorAll('[data-p]').forEach(x => { x.style.width = pc + '%'; });
      el.box.querySelectorAll('.nlt-pill.run').forEach(x => x.style.setProperty('--p', pc + '%'));
    });
  }
  const tBtn = (a, label, pri = false, extra = '') => `<button type="button" class="nlt-btn${pri ? ' pri' : ''}" data-a="${a}" ${extra}>${label}</button>`;
  const tChoices = (rec = 15) => `<div class="nlt-row">${[5, 10, 15, 20].map(m => tBtn('start', `${m} Min.`, m === rec, `data-min="${m}"`)).join('')}</div>`;
  function tControls(st) {
    return `<div class="nlt-row">${st.paused ? tBtn('resume', 'Weiter', true) : tBtn('pause', 'Pause')}${tBtn('add', '+5 Min.')}${tBtn('stop', 'Beenden')}</div>`;
  }
  function tRenderOne(el) {
    const st = tState(), mode = !st ? 'idle' : st.done ? 'done' : st.paused ? 'paused' : 'run';
    if (el.kind === 'card') {
      el.box.innerHTML = mode === 'idle'
        ? `<p class="nlt-sub">Konzentriert spielen, ohne auf die Uhr zu schauen. Der Timer läuft weiter, wenn du in die Bibliothek oder zu den Übungen wechselst.</p>${tChoices()}`
        : mode === 'done'
          ? `<div class="nlt-big nlt-ok">✓ ${tMin(st)} Minuten geschafft</div><p class="nlt-sub">Zählt für deine Übe-Serie.</p><div class="nlt-row">${tBtn('start', `Nochmal ${tMin(st)} Min.`, true, `data-min="${tMin(st)}"`)}${tBtn('stop', 'OK')}</div>`
          : `<div class="nlt-big"><span data-t></span>${mode === 'paused' ? ' <small>pausiert</small>' : ''}</div><div class="nlt-bar"><i data-p></i></div>${tControls(st)}`;
    } else {
      el.box.hidden = mode === 'idle' && !el.idle;
      if (mode === 'idle' && !el.idle) el.open = false;
      const pill = mode === 'idle'
        ? `<button type="button" class="nlt-pill" data-a="toggle" aria-expanded="${!!el.open}" title="Fokus-Timer">${NL.icon('clock')}<span>Timer</span></button>`
        : mode === 'done'
          ? `<button type="button" class="nlt-pill done" data-a="toggle" aria-expanded="${!!el.open}">✓ Geschafft</button>`
          : `<button type="button" class="nlt-pill run" data-a="toggle" aria-expanded="${!!el.open}" aria-label="Fokus-Timer${mode === 'paused' ? ', pausiert' : ''}">${NL.icon('clock')}<span data-t></span>${mode === 'paused' ? '<span class="nlt-ps">II</span>' : ''}</button>`;
      const pop = !el.open ? '' : `<div class="nlt-pop" role="dialog" aria-label="Fokus-Timer">${
        mode === 'idle' ? `<b class="nlt-title">Fokus-Timer</b><p class="nlt-sub">Wie lange willst du konzentriert üben?</p>${tChoices()}`
        : mode === 'done' ? `<b class="nlt-title">✓ ${tMin(st)} Minuten geschafft!</b><p class="nlt-sub">Zählt für deine Übe-Serie.</p><div class="nlt-row">${tBtn('start', `Nochmal ${tMin(st)} Min.`, true, `data-min="${tMin(st)}"`)}${tBtn('stop', 'OK')}</div>`
        : `<b class="nlt-title">Fokus: noch <span data-t></span>${mode === 'paused' ? ' (pausiert)' : ''}</b>${tControls(st)}`}</div>`;
      el.box.innerHTML = pill + pop;
    }
  }
  function tRender() { T.els.forEach(tRenderOne); tTick(); }
  function tAction(el, b) {
    const st = tState(), a = b.dataset.a;
    b.blur();
    if (a === 'toggle') { el.open = !el.open; tRenderOne(el); tTick(); return; }
    if (a === 'start') { tUnlock(); const m = +b.dataset.min; T.els.forEach(x => { x.open = false; }); tWrite({ dur: m * 60000, end: Date.now() + m * 60000 }); return; }
    if (a === 'pause' && st && !st.paused && !st.done) tWrite({ dur: st.dur, left: tLeft(st), paused: true });
    if (a === 'resume' && st && st.paused) tWrite({ dur: st.dur, end: Date.now() + st.left });
    if (a === 'add' && st && !st.done) { st.dur += 300000; if (st.paused) st.left += 300000; else st.end += 300000; tWrite(st); }
    if (a === 'stop') { T.els.forEach(x => { x.open = false; }); tWrite(null); }
  }
  // kind: 'card' (große Karte, z. B. auf „Heute“) oder 'pill' (kleiner Knopf; idle: auch zeigen, wenn kein Timer läuft)
  NL.timer = {
    mount(box, { kind = 'pill', idle = false } = {}) {
      const el = { box, kind, idle, open: false };
      T.els.push(el);
      box.classList.add('nlt', kind === 'card' ? 'nlt-card' : 'nlt-wrap');
      box.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && box.contains(b)) tAction(el, b); });
      if (!T.iv) {
        T.iv = setInterval(tTick, 500);
        document.addEventListener('pointerdown', e => { T.els.forEach(x => { if (x.open && !x.box.contains(e.target)) { x.open = false; tRenderOne(x); tTick(); } }); });
      }
      tRenderOne(el); tTick();
      return el;
    },
    // schwebender Knopf unten links (nur sichtbar, solange ein Timer läuft)
    float() { const d = document.createElement('div'); d.className = 'nlt-float'; document.body.append(d); return NL.timer.mount(d); },
    state: tState
  };

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
  // Offline: App auf dem Gerät zwischenspeichern (nur auf der eigenen Webseite, nicht in einer Vorschau)
  if ('serviceWorker' in navigator && !NL.embedded && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    try { navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
    // Neue Version direkt nach dem Öffnen übernommen: einmal neu laden, damit alles zusammenpasst
    // (nur in den ersten Sekunden und wenn gerade nichts geöffnet ist)
    const t0 = Date.now(), hadCtl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadCtl || Date.now() - t0 > 15000 || document.querySelector('dialog[open]')) return;
      try { if (sessionStorage.getItem('nl-reloaded') === '1') return; sessionStorage.setItem('nl-reloaded', '1'); } catch (e) { return; }
      location.reload();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
