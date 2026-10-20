// Mitspielen: fallende Noten wie bei Synthesia, aus der MIDI-Datei eines Stücks.
// Am E-Piano (Web-MIDI in Chrome und Edge) wartet der Wartemodus, bis die richtigen Töne gespielt sind;
// „Im Tempo“ läuft weiter und zählt Treffer; „Anhören“ spielt alles vor. Die andere Hand kann die App übernehmen.
// Die Bibliothek öffnet es mit NLPlay.open({ key, title, sub, buffer, onReplace, onRemove, onPractice }).
(() => {
  'use strict';
  const NAMES = ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'B', 'H'];
  const BLACK = [0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0];
  const isBlack = p => BLACK[p % 12] === 1;
  const LOOK = 3.2;    // so viele Sekunden (echte Zeit) sind die Noten im Voraus zu sehen
  const EARLY = 1.0;   // Wartemodus: so viele Sekunden vor der Linie darf der Ton schon kommen
  const WIN = 0.22;    // Im Tempo: so viel zu früh oder zu spät zählt noch als Treffer
  const HR = '#5b82ff', HL = '#36c28a', OK = '#43d17f', BAD = '#ff5d57';
  const $ = id => document.getElementById(id);
  const lowerBound = (arr, t) => { let a = 0, b = arr.length; while (a < b) { const m = (a + b) >> 1; if (arr[m].t < t) a = m + 1; else b = m; } return a; };

  // ---------- MIDI-Datei lesen ----------
  function parse(buf) {
    const d = new DataView(buf);
    let o = 0;
    const str = n => { let s = ''; for (let i = 0; i < n && o + i < d.byteLength; i++) s += String.fromCharCode(d.getUint8(o + i)); return s; };
    const vlq = () => { let v = 0, b; do { b = d.getUint8(o++); v = v * 128 + (b & 0x7f); } while (b & 0x80); return v; };
    if (d.byteLength < 14 || str(4) !== 'MThd') throw new Error('Das ist keine MIDI-Datei.');
    const ntr = d.getUint16(10), div = d.getUint16(12);
    o = 8 + d.getUint32(4);
    const tpq = div & 0x8000 ? 0 : div;
    const tps = div & 0x8000 ? (256 - (div >> 8)) * (div & 0xff) : 0;   // seltene SMPTE-Zeitbasis: Ticks je Sekunde
    const tempos = [], sigs = [], keys = [], tracks = [];
    try {
      for (let t = 0; t < ntr && o + 8 <= d.byteLength; t++) {
        const id = str(4), end = Math.min(o + 8 + d.getUint32(o + 4), d.byteLength);
        o += 8;
        if (id !== 'MTrk') { o = end; continue; }
        let tick = 0, run = 0, name = '';
        const open = {}, notes = [];
        while (o < end) {
          tick += vlq();
          let st = d.getUint8(o);
          if (st & 0x80) { o++; if (st < 0xf0) run = st; } else if (run) st = run; else break;
          if (st === 0xff) {
            const type = d.getUint8(o++), l = vlq();
            if (type === 0x51 && l >= 3) tempos.push({ tick, us: (d.getUint8(o) << 16) | (d.getUint8(o + 1) << 8) | d.getUint8(o + 2) });
            else if (type === 0x58 && l >= 2) sigs.push({ tick, n: d.getUint8(o), dd: 2 ** d.getUint8(o + 1) });
            else if (type === 0x59 && l >= 2) keys.push({ tick, sf: (d.getUint8(o) << 24) >> 24 });
            else if (type === 0x03) name = str(l);
            o += l;
            if (type === 0x2f) break;
            continue;
          }
          if (st === 0xf0 || st === 0xf7) { o += vlq(); continue; }
          const hi = st & 0xf0, ch = st & 0x0f;
          if (hi === 0xc0 || hi === 0xd0) { o += 1; continue; }
          const a = d.getUint8(o), b = d.getUint8(o + 1);
          o += 2;
          const k = ch * 128 + a;
          if (hi === 0x90 && b > 0) (open[k] = open[k] || []).push({ tick, v: b });
          else if (hi === 0x80 || hi === 0x90) {
            const q = open[k];
            if (q && q.length) { const s = q.shift(); if (ch !== 9) notes.push({ p: a, ch, t0: s.tick, t1: tick, v: s.v }); }
          }
        }
        for (const k in open) for (const s of open[k]) if ((k >> 7) !== 9) notes.push({ p: k & 127, ch: k >> 7, t0: s.tick, t1: Math.max(tick, s.tick + 1), v: s.v });
        o = end;
        tracks.push({ name, notes });
      }
    } catch (e) { if (!tracks.length) throw new Error('Die MIDI-Datei ist beschädigt.'); }
    // Ticks in Sekunden (Tempowechsel aus allen Spuren)
    tempos.sort((a, b) => a.tick - b.tick);
    const map = [{ tick: 0, sec: 0, spt: tps ? 1 / tps : 0.5 / tpq }];
    if (!tps) for (const tp of tempos) {
      const m = map[map.length - 1], spt = tp.us / 1e6 / tpq;
      if (tp.tick === m.tick) m.spt = spt;
      else map.push({ tick: tp.tick, sec: m.sec + (tp.tick - m.tick) * m.spt, spt });
    }
    const toSec = tick => { let i = map.length - 1; while (i > 0 && map[i].tick > tick) i--; return map[i].sec + (tick - map[i].tick) * map[i].spt; };
    // Hände: zwei Spuren (so speichert MuseScore Klaviernoten) → die höhere ist rechts; sonst Trennung beim eingestrichenen C
    let groups = tracks.filter(t => t.notes.length).map(t => t.notes);
    if (groups.length === 1) { const by = {}; for (const n of groups[0]) (by[n.ch] = by[n.ch] || []).push(n); groups = Object.values(by); }
    const avg = g => g.reduce((s, n) => s + n.p, 0) / g.length;
    if (groups.length === 2) { const [r, l] = groups.slice().sort((x, y) => avg(y) - avg(x)); r.forEach(n => { n.ht = 'R'; }); l.forEach(n => { n.ht = 'L'; }); }
    const raw = groups.flat();
    if (!raw.length) throw new Error('In dieser MIDI-Datei sind keine Noten.');
    const notes = raw.map(n => {
      const t = toSec(n.t0);
      return { t, d: Math.max(0.06, toSec(n.t1) - t), p: n.p, v: n.v, ht: n.ht || null, hp: n.p >= 60 ? 'R' : 'L', tick: n.t0, dt: n.t1 - n.t0 };
    }).sort((a, b) => a.t - b.t || a.p - b.p);
    // Takte aus den Taktangaben (ohne Angabe: 4/4)
    const endTick = Math.max(...raw.map(n => n.t1));
    const bars = [], barTicks = [], tq = tpq || Math.round(tps / 2) || 480;
    let sg = [{ tick: 0, n: 4, dd: 4 }];
    if (tps) { for (let s = 0; s <= toSec(endTick); s += 2) { bars.push(s); barTicks.push(Math.round(s * tps)); } }
    else {
      sigs.sort((a, b) => a.tick - b.tick);
      sg = sigs.length && sigs[0].tick === 0 ? sigs : [{ tick: 0, n: 4, dd: 4 }, ...sigs];
      let tick = 0, si = 0;
      while (tick <= endTick && bars.length < 5000) {
        while (si + 1 < sg.length && sg[si + 1].tick <= tick) si++;
        bars.push(toSec(tick)); barTicks.push(tick);
        tick += Math.max(1, Math.round(sg[si].n * tpq * 4 / sg[si].dd));
        const nx = sg[si + 1];
        if (nx && nx.tick < tick) tick = nx.tick;
      }
    }
    const barOf = t => { let a = 0, b = bars.length - 1; while (a < b) { const m = (a + b + 1) >> 1; if (bars[m] <= t + 1e-6) a = m; else b = m - 1; } return a; };
    notes.forEach(n => { n.bar = barOf(n.t); });
    const sig0 = sigs.find(s => s.tick === 0) || { n: 4, dd: 4 };
    // Balken-Gruppen: im 6/8-, 9/8- und 12/8-Takt je drei Achtel, sonst je Viertel
    const beatOf = tick => {
      let bi = 0; while (bi + 1 < barTicks.length && barTicks[bi + 1] <= tick) bi++;
      let si = 0; while (si + 1 < sg.length && sg[si + 1].tick <= tick) si++;
      const len = sg[si].dd === 8 && sg[si].n % 3 === 0 ? tq * 1.5 : tq;
      return bi * 1000 + Math.floor((tick - barTicks[bi]) / len);
    };
    // Tonart: aus der Datei oder geschätzt (die Dur-Tonart, zu der die meisten Töne passen)
    let key = keys.length ? Math.max(-7, Math.min(7, keys[0].sf)) : null;
    if (key === null) {
      const w = new Array(12).fill(0); raw.forEach(n => { w[n.p % 12] += n.t1 - n.t0; });
      const MAJ = [0, 2, 4, 5, 7, 9, 11];
      let best = Infinity;
      for (const sf of [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6]) {
        const tonic = ((sf * 7) % 12 + 12) % 12, out = w.reduce((s, x, pc) => s + (MAJ.includes((pc - tonic + 12) % 12) ? 0 : x), 0);
        if (out < best * 0.97) { best = out; key = sf; }
      }
    }
    return {
      notes, bars, barOf, end: Math.max(...notes.map(n => n.t + n.d)), first: notes[0].t,
      bpm: Math.round(60 / (map[0].spt * (tpq || 480))), sig: `${sig0.n}/${sig0.dd}`,
      twoTracks: groups.length === 2, tracks: tracks.filter(t => t.notes.length).length, tpq: tq, key, beatOf
    };
  }

  // ---------- Klang für Begleitung und „Anhören“ ----------
  const Synth = (() => {
    let ac = null, master = null, voices = [];
    const ctx = () => {
      if (!ac) {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain();
        const comp = ac.createDynamicsCompressor();
        master.connect(comp); comp.connect(ac.destination);
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    return {
      volume(v) { ctx(); master.gain.value = v * 0.9; },
      play(p, dur, vel = 80) {
        const a = ctx(), t = a.currentTime, f = 440 * 2 ** ((p - 69) / 12);
        const len = Math.min(Math.max(dur, 0.15), 5), peak = 0.06 + 0.12 * (vel / 127);
        const g = a.createGain(), lp = a.createBiquadFilter(), o1 = a.createOscillator(), o2 = a.createOscillator(), g2 = a.createGain();
        lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 7);
        o1.type = 'triangle'; o1.frequency.value = f;
        o2.type = 'sine'; o2.frequency.value = f * 2; g2.gain.value = 0.3;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.006);
        g.gain.setTargetAtTime(peak * 0.25, t + 0.01, 0.45);
        g.gain.setTargetAtTime(0, t + len, 0.07);
        o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(master);
        o1.start(t); o2.start(t); o1.stop(t + len + 0.6); o2.stop(t + len + 0.6);
        voices.push({ g, end: t + len + 0.6 });
        voices = voices.filter(v => v.end > t);
      },
      stop() {
        if (!ac) return;
        const t = ac.currentTime;
        for (const v of voices) { v.g.gain.cancelScheduledValues(t); v.g.gain.setTargetAtTime(0, t, 0.04); }
        voices = [];
      }
    };
  })();

  // ---------- Zustand ----------
  const DEF = { hands: 'both', mode: 'wait', tempo: 0.7, accomp: true, names: true, split: 'auto', vol: 0.6, view: 'falling' };
  const CFG_KEY = 'nl-play';
  const cfgAll = () => { try { return JSON.parse(localStorage.getItem(CFG_KEY) || '{}'); } catch (e) { return {}; } };
  const writeCfg = f => { const a = cfgAll(); f(a); try { localStorage.setItem(CFG_KEY, JSON.stringify(a)); } catch (e) {} };
  let C = { ...DEF };
  const S = {
    song: null, opts: null, key: '', events: [], pn: [], pos: 0, playing: false, waiting: false, evi: 0, ni: 0, mi: 0, last: 0, raf: 0,
    down: new Map(), lit: new Map(), stats: null, loop: null, pass: 0, counted: 0, prev: null, prevAt: 0, result: false, kb: null, geo: null, status: '', midi: null, wake: null
  };
  const saveCfg = () => writeCfg(a => { a[S.key] = { ...(a[S.key] || {}), cfg: C }; });
  const practiced = n => C.mode !== 'listen' && (C.hands === 'both' || n.h === C.hands);
  const newStats = () => ({ ok: 0, bad: 0, hit: 0, miss: 0, wait: 0, bars: {} });
  const barStat = b => S.stats.bars[b] || (S.stats.bars[b] = { bad: 0, miss: 0, wait: 0 });
  const range = () => {
    const sg = S.song;
    if (S.loop) return [sg.bars[S.loop.a], S.loop.b + 1 < sg.bars.length ? sg.bars[S.loop.b + 1] : sg.end];
    return [Math.min(0, sg.first), sg.end];
  };
  const lead = () => 1.2 * C.tempo;

  function prepare() {
    for (const n of S.song.notes) n.h = C.split === 'pitch' ? n.hp : (n.ht || n.hp);
    // Akkorde der geübten Hand(en): im Wartemodus geht es weiter, wenn alle Töne eines Akkords gespielt sind
    const ev = [];
    for (const n of S.song.notes) {
      if (!practiced(n)) continue;
      const e = ev[ev.length - 1];
      if (e && n.t - e.t < 0.04) { e.notes.push(n); e.need.add(n.p); }
      else ev.push({ t: n.t, bar: n.bar, notes: [n], need: new Set([n.p]), got: new Set(), done: false });
    }
    S.events = ev;
    S.pn = S.song.notes.filter(practiced);
    engrave();
    S.stats = newStats();
    resetFrom(S.pos);
  }
  function resetFrom(pos) {
    S.pos = pos; S.waiting = false; S.prev = null;
    for (const e of S.events) { e.done = e.t < pos - 1e-4; e.got.clear(); }
    S.evi = S.events.findIndex(e => !e.done);
    if (S.evi < 0) S.evi = S.events.length;
    for (const n of S.song.notes) if (n.t >= pos - 1e-4) n.res = null;
    S.ni = lowerBound(S.song.notes, pos);
    S.mi = lowerBound(S.pn, pos - WIN * C.tempo);
  }

  // ---------- Ablauf ----------
  function play() {
    if (!S.song) return;
    hideResult();
    const [, b] = range();
    if (S.pos >= b) restart();
    S.playing = true; S.last = 0;
    Synth.volume(C.vol);
    keepAwake();
    ui();
  }
  function pause() { S.playing = false; Synth.stop(); ui(); }
  function restart() {
    const [a] = range();
    S.playing = false; Synth.stop(); hideResult();
    S.stats = newStats(); S.pass = 0;
    resetFrom(a - lead());
    ui();
  }
  function seekBar(i) {
    const sg = S.song;
    i = Math.max(0, Math.min(sg.bars.length - 1, i));
    Synth.stop(); hideResult();
    resetFrom(sg.bars[i] - (i === 0 ? lead() : 0.4 * C.tempo));
  }
  function frame(now) {
    S.raf = requestAnimationFrame(frame);
    const dt = S.last ? Math.min(0.1, (now - S.last) / 1000) : 0;
    S.last = now;
    if (S.playing && S.song) step(dt, now);
    draw(now);
  }
  function step(dt, now) {
    const sg = S.song, [, b] = range();
    let next = S.pos + dt * C.tempo;
    S.waiting = false;
    const ev = C.mode === 'wait' ? S.events[S.evi] : null;
    if (ev && next >= ev.t) { next = ev.t; S.waiting = true; S.stats.wait += dt; barStat(ev.bar).wait += dt; }
    // Begleitung (und beim Anhören alles): Ton, sobald die Note die Linie erreicht
    const lim = S.waiting ? next - 1e-4 : next;
    while (S.ni < sg.notes.length && sg.notes[S.ni].t <= lim) {
      const n = sg.notes[S.ni++];
      if (n.t < S.pos - 0.05 || practiced(n)) continue;
      if (C.mode === 'listen' || C.accomp) Synth.play(n.p, n.d / C.tempo, n.v);
      S.lit.set(n.p, { until: now + Math.max(120, n.d / C.tempo * 1000), h: n.h });
    }
    // Im Tempo: nicht gespielte Töne zählen als verpasst
    if (C.mode === 'tempo') {
      const w = WIN * C.tempo;
      while (S.mi < S.pn.length && S.pn[S.mi].t + w < next) {
        const n = S.pn[S.mi++];
        if (n.t < S.pos - w - 0.05 || n.t >= b) continue;
        if (!n.res) { n.res = 'miss'; S.stats.miss++; barStat(n.bar).miss++; }
      }
    }
    S.pos = next;
    if (S.loop && S.pos >= b) loopWrap();
    else if (!S.loop && S.pos >= sg.end + 0.3 * C.tempo) finish();
  }
  function pct() {
    const s = S.stats;
    if (C.mode === 'tempo') { const total = s.hit + s.miss; return total ? Math.round(100 * s.hit / total) : null; }
    if (C.mode === 'wait') { const total = s.ok + s.bad; return total ? Math.round(100 * s.ok / total) : null; }
    return null;
  }
  function loopWrap() {
    S.pass++;
    const q = pct();
    S.passNote = q === null ? '' : `Durchgang ${S.pass}: ${q} % richtig`;
    S.stats = newStats();
    resetFrom(range()[0] - 0.8 * C.tempo);
  }
  function finish() {
    S.playing = false; Synth.stop();
    if (C.mode === 'listen') { restart(); return; }
    const s = S.stats, q = pct();
    const worst = Object.entries(s.bars).map(([b, x]) => [+b, x.bad + x.miss + (x.wait > 1.5 ? x.wait / 2 : 0)])
      .filter(x => x[1] >= 1).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]).sort((a, b) => a - b);
    const k = C.mode + '-' + C.hands;
    let best = 0;
    writeCfg(a => { const e = a[S.key] = a[S.key] || {}; e.best = e.best || {}; best = e.best[k] || 0; if (q !== null && q > best) e.best[k] = q; });
    const hands = { both: 'beide Hände', R: 'rechte Hand', L: 'linke Hand' }[C.hands];
    const lines = C.mode === 'wait'
      ? [`${s.ok} Töne richtig, ${s.bad} ${s.bad === 1 ? 'falscher' : 'falsche'}`]
      : [`${s.hit} von ${s.hit + s.miss} Tönen getroffen`, s.bad ? `${s.bad} ${s.bad === 1 ? 'falscher Ton' : 'falsche Töne'} dazwischen` : ''];
    const box = $('pl-result');
    box.innerHTML = `<div role="dialog" aria-labelledby="pl-rh">
      <h2 id="pl-rh">${q === 100 ? 'Fehlerfrei!' : 'Geschafft!'}</h2>
      <div class="pl-big">${q === null ? '–' : q + ' %'}</div>
      <p class="hint">${C.mode === 'wait' ? 'Wartemodus' : 'Im Tempo'} · ${hands} · ${Math.round(C.tempo * 100)} % Tempo${q !== null && q > best && best ? ` · neuer Bestwert (vorher ${best} %)` : best && q !== null && q <= best ? ` · Bestwert ${best} %` : ''}</p>
      ${lines.filter(Boolean).map(l => `<p>${l}</p>`).join('')}
      ${worst.length ? `<p>Am schwierigsten: Takt ${worst.map(b => b + 1).join(', ')}</p>` : ''}
      <div class="actions">${worst.length ? `<button type="button" class="btn" id="pl-rloop">Takt ${worst[0] + 1}${worst[0] + 1 < S.song.bars.length ? '–' + (worst[0] + 2) : ''} üben</button>` : ''}<span class="spacer"></span><button type="button" class="btn primary" id="pl-ragain">Nochmal</button></div>
    </div>`;
    box.hidden = false; S.result = true;
    $('pl-ragain').addEventListener('click', () => { restart(); if (C.mode === 'tempo') play(); });
    if (worst.length) $('pl-rloop').addEventListener('click', () => { setLoop(worst[0], Math.min(S.song.bars.length - 1, worst[0] + 1)); restart(); });
    ui();
  }
  function hideResult() { $('pl-result').hidden = true; S.result = false; }

  // ---------- E-Piano ----------
  function noteOn(p) {
    if (!S.song || !$('player').open) return;
    let ok = false, started = false;
    if (C.mode === 'listen') { S.down.set(p, ''); return; }
    if (!S.playing) {
      if (C.mode !== 'wait' || S.result) { S.down.set(p, ''); return; }
      play(); started = true;             // im Wartemodus geht es mit dem ersten Ton los
    }
    if (C.mode === 'wait') {
      const ev = S.events[S.evi];
      if (ev && ev.need.has(p) && !ev.got.has(p) && (started || S.pos >= ev.t - EARLY * C.tempo)) {
        ev.got.add(p); ok = true;
        if ([...ev.need].every(x => ev.got.has(x))) { ev.done = true; S.evi++; S.prev = ev; S.prevAt = performance.now(); ev.notes.forEach(n => { n.res = 'hit'; }); }
      } else if ((ev && ev.got.has(p)) || (S.prev && S.prev.need.has(p) && performance.now() - S.prevAt < 400)) { S.down.set(p, 'ok'); return; }
    } else {
      const w = WIN * C.tempo;
      let best = null;
      for (let i = lowerBound(S.pn, S.pos - w); i < S.pn.length && S.pn[i].t <= S.pos + w; i++) {
        const n = S.pn[i];
        if (n.p === p && !n.res && (!best || Math.abs(n.t - S.pos) < Math.abs(best.t - S.pos))) best = n;
      }
      if (best) { best.res = 'hit'; S.stats.hit++; ok = true; }
    }
    S.down.set(p, ok ? 'ok' : 'bad');
    if (ok) { S.stats.ok++; if (++S.counted === 12 && S.opts.onPractice) S.opts.onPractice(); }
    else { S.stats.bad++; barStat(S.song.barOf(Math.max(0, S.pos))).bad++; }
  }
  function noteOff(p) { S.down.delete(p); }
  function onMidi(e) {
    const [s, a, b] = e.data, hi = s & 0xf0;
    if (hi === 0x90 && b > 0) noteOn(a);
    else if (hi === 0x80 || hi === 0x90) noteOff(a);
  }
  function bindMidi() {
    const ins = [...S.midi.inputs.values()];
    ins.forEach(i => { i.onmidimessage = onMidi; });
    const on = ins.filter(i => i.state === 'connected');
    midiChip(on.length ? 'ok' : 'none', on.map(i => i.name).join(', '));
  }
  async function connectMidi() {
    if (!navigator.requestMIDIAccess) { midiChip('unsupported'); return; }
    try { S.midi = await navigator.requestMIDIAccess(); S.midi.onstatechange = bindMidi; bindMidi(); }
    catch (e) { midiChip('denied'); }
  }
  function midiChip(state, name = '') {
    const b = $('pl-midi');
    b.classList.toggle('ok', state === 'ok');
    b.textContent = { ok: 'E-Piano verbunden', none: 'Kein E-Piano gefunden', unsupported: 'Ohne E-Piano', denied: 'E-Piano nicht erlaubt', off: 'E-Piano verbinden' }[state];
    b.title = state === 'ok' ? name
      : state === 'unsupported' ? 'Dieser Browser kann kein MIDI (z. B. am iPad). Zuhören und Zusehen geht trotzdem; zum Mitspielen am PC Chrome oder Edge nutzen.'
      : state === 'none' ? 'Schließ dein E-Piano per USB an. Es wird dann von selbst erkannt.'
      : state === 'denied' ? 'Der Browser hat den MIDI-Zugriff nicht erlaubt. Über das Schloss-Symbol in der Adressleiste kannst du ihn erlauben.' : '';
    S.midiState = state;
  }

  // ---------- Zeichnen ----------
  function keyboardRange() {
    let lo = Math.min(...S.song.notes.map(n => n.p)), hi = Math.max(...S.song.notes.map(n => n.p));
    lo -= lo % 12; hi += 11 - hi % 12;
    while (hi - lo + 1 < 36) { if (lo >= 33) lo -= 12; if (hi - lo + 1 < 36 && hi <= 96) hi += 12; if (lo < 33 && hi > 96) break; }
    return { lo: Math.max(21, lo), hi: Math.min(108, hi) };
  }
  function geometry(w) {
    if (S.geo && S.geo.w === w) return S.geo;
    const { lo, hi } = S.kb, whites = [];
    for (let p = lo; p <= hi; p++) if (!isBlack(p)) whites.push(p);
    const ww = w / whites.length, bw = ww * 0.62, x = {}, wd = {};
    whites.forEach((p, i) => { x[p] = i * ww; wd[p] = ww; });
    for (let p = lo; p <= hi; p++) if (isBlack(p)) { x[p] = x[p - 1] + ww - bw / 2; wd[p] = bw; }
    return (S.geo = { w, ww, bw, x, wd, whites });
  }
  function rrect(g, x, y, w, h, r) {
    g.beginPath();
    if (g.roundRect) g.roundRect(x, y, w, h, Math.min(r, h / 2, w / 2)); else g.rect(x, y, w, h);
    g.fill();
  }
  // Was als Nächstes zu spielen ist: Taste → Hand
  function expected() {
    const exp = new Map();
    if (C.mode === 'wait') { const ev = S.events[S.evi]; if (ev && ev.t - S.pos < 1.5 * C.tempo) for (const n of ev.notes) if (!ev.got.has(n.p)) exp.set(n.p, n.h); }
    return exp;
  }
  function draw(now) {
    const cv = $('pl-canvas');
    if (!cv || !$('player').open) return;
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1, w = r.width, h = r.height;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = '#10131f'; g.fillRect(0, 0, w, h);
    if (!S.song) return;
    const K = geometry(w), sheet = C.view === 'sheet';
    const kbH = Math.max(64, Math.min(sheet ? 130 : 150, h * (sheet ? 0.24 : 0.22), K.ww * 5.6)), hy = h - kbH;
    const exp = expected();
    if (sheet) drawSheet(g, w, hy, now); else drawFalling(g, w, hy, K);
    drawKeys(g, K, w, hy, kbH, exp, now);
    status(exp);
  }
  function drawFalling(g, w, hy, K) {
    const sg = S.song, pps = hy / (LOOK * C.tempo);
    const yAt = t => hy - (t - S.pos) * pps;
    // Orientierung: Linie bei jedem C
    g.fillStyle = 'rgba(255,255,255,.06)';
    for (const p of K.whites) if (p % 12 === 0) g.fillRect(K.x[p], 0, 1, hy);
    // Schleife
    if (S.loop) {
      const [a, b] = range(), ya = Math.min(hy, yAt(a)), yb = Math.max(0, yAt(b));
      if (ya > yb) { g.fillStyle = 'rgba(143,162,255,.07)'; g.fillRect(0, yb, w, ya - yb); }
    }
    // Taktstriche mit Taktnummer
    g.font = '600 11px Figtree, system-ui, sans-serif'; g.textAlign = 'left';
    for (let i = 0; i < sg.bars.length; i++) {
      const y = yAt(sg.bars[i]);
      if (y > hy) continue;
      if (y < -14) break;
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, y, w, 1);
      g.fillStyle = 'rgba(255,255,255,.5)'; g.fillText(String(i + 1), 5, y - 4);
    }
    // Noten
    const top = S.pos + hy / pps;
    for (let i = lowerBound(sg.notes, S.pos - 8); i < sg.notes.length && sg.notes[i].t <= top; i++) {
      const n = sg.notes[i], yb = yAt(n.t), yt = yAt(n.t + n.d);
      if (yt >= hy) continue;
      const bk = isBlack(n.p), x = K.x[n.p] + (bk ? 0.5 : 1.5), nw = K.wd[n.p] - (bk ? 1 : 3);
      if (x === undefined || isNaN(x)) continue;
      const mine = practiced(n) || C.mode === 'listen';
      const y1 = Math.min(yb, hy), y0 = Math.max(yt, -4);
      g.globalAlpha = !mine ? 0.32 : n.res === 'hit' ? 0.5 : 1;
      g.fillStyle = n.res === 'miss' ? BAD : n.h === 'L' ? HL : HR;
      rrect(g, x, y0, nw, Math.max(3, y1 - y0), 5);
      if (bk) { g.fillStyle = 'rgba(0,0,0,.22)'; rrect(g, x, y0, nw, Math.max(3, y1 - y0), 5); }
      if (C.names && mine && y1 - y0 >= 15) {
        const name = NAMES[n.p % 12];
        g.font = `700 ${nw >= 20 ? 12 : 10}px Figtree, system-ui, sans-serif`;
        if (g.measureText(name).width <= nw - 2) { g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(name, x + nw / 2, y1 - 5); g.textAlign = 'left'; }
      }
      g.globalAlpha = 1;
    }
    // Trefferlinie
    g.fillStyle = S.waiting ? 'rgba(255,214,102,.95)' : 'rgba(143,162,255,.85)';
    g.fillRect(0, hy - 2, w, 3);
  }
  // Tastatur
  function drawKeys(g, K, w, hy, kbH, exp, now) {
    const keyCol = (p, bk) => {
      const d = S.down.get(p);
      if (d !== undefined) return d === 'bad' ? BAD : d === 'ok' ? OK : (bk ? '#5d6690' : '#aab4dc');
      const l = S.lit.get(p);
      if (l && l.until > now) return l.h === 'L' ? HL : HR;
      if (exp.has(p)) return exp.get(p) === 'L' ? (bk ? '#1f7a56' : '#bfeedb') : (bk ? '#3550b8' : '#cbd6ff');
      return bk ? '#1b1e2b' : '#f4f5f8';
    };
    g.fillStyle = '#0b0d16'; g.fillRect(0, hy + 1, w, kbH);
    for (const p of K.whites) {
      g.fillStyle = keyCol(p, false);
      rrect(g, K.x[p] + 0.6, hy + 2, K.ww - 1.2, kbH - 3, 4);
      if (p % 12 === 0 && K.ww >= 13) { g.fillStyle = '#8a8fa3'; g.font = '600 10px Figtree, system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('C' + (p / 12 - 1), K.x[p] + K.ww / 2, hy + kbH - 7); g.textAlign = 'left'; }
    }
    for (let p = S.kb.lo; p <= S.kb.hi; p++) if (isBlack(p)) { g.fillStyle = keyCol(p, true); rrect(g, K.x[p], hy + 1, K.bw, kbH * 0.62, 3); }
  }
  function status(exp) {
    const sg = S.song, bar = sg.barOf(Math.max(0, S.pos)) + 1, s = S.stats;
    let t = `Takt ${Math.min(bar, sg.bars.length)} / ${sg.bars.length}`;
    if (C.mode === 'wait') t += ` · ✓ ${s.ok} · ✗ ${s.bad}`;
    if (C.mode === 'tempo') t += ` · ✓ ${s.hit} · verpasst ${s.miss}${s.bad ? ` · ✗ ${s.bad}` : ''}`;
    if (S.passNote && S.loop) t += ` · ${S.passNote}`;
    if (S.waiting && exp.size) t += ` · Spiele: ${[...exp.keys()].sort((a, b) => a - b).map(p => NAMES[p % 12]).join(' ')}`;
    if (!S.playing && !S.result) t += C.mode === 'wait' ? (S.midiState === 'ok' ? ' · Leertaste oder erster Ton startet' : ' · Leertaste startet') : ' · Leertaste startet';
    if (t !== S.status) { S.status = t; $('pl-status').textContent = t; }
    const seek = $('pl-seek');
    if (document.activeElement !== seek) seek.value = Math.min(bar, sg.bars.length) - 1;
  }

  // ---------- Notenblatt (wie bei Flowkey): die Noten laufen von rechts unter der Spiellinie durch ----------
  // Schlüssel und Vorzeichen: dieselben Umrisse wie auf der Übungsseite (Schrift-Einheiten, 1000 = vier Linienabstände)
  const TREBLE_PATH = 'M314 801Q300 854 291.0 906.0Q282 958 282 1012Q282 1059 288.5 1100.5Q295 1142 307 1177Q320 1217 341.0 1252.5Q362 1288 385.5 1311.0Q409 1334 427 1334Q451 1334 493 1249Q514 1206 524.0 1156.0Q534 1106 534 1049Q534 978 515.0 907.5Q496 837 459.5 775.0Q423 713 372 666L407 498Q422 500 432.0 501.0Q442 502 447 502Q508 502 556.0 467.5Q604 433 632.5 377.0Q661 321 661 254Q661 177 621.5 115.5Q582 54 503 25Q508 8 532 -117Q538 -147 541.0 -164.5Q544 -182 545.0 -195.0Q546 -208 546 -225Q546 -275 521.5 -314.5Q497 -354 455.5 -376.0Q414 -398 363 -398Q311 -398 271.0 -378.5Q231 -359 208.0 -324.5Q185 -290 185 -245Q185 -197 211.5 -165.0Q238 -133 287 -133Q329 -133 355.5 -163.5Q382 -194 382 -236Q382 -272 357.0 -299.0Q332 -326 292 -326H282Q308 -365 364 -365Q433 -365 472.0 -320.0Q511 -275 511 -205Q511 -188 507.0 -159.5Q503 -131 493 -91Q483 -51 477.5 -25.0Q472 1 470 12Q436 2 390 2Q304 2 222 52Q142 102 96.0 184.0Q50 266 50 361Q50 451 91 530Q132 609 192.5 675.0Q253 741 314 801ZM341 826Q364 838 390.0 870.5Q416 903 440.0 945.0Q464 987 479.0 1029.5Q494 1072 494 1106Q494 1142 483.0 1163.0Q472 1184 445 1184Q421 1184 398.5 1162.0Q376 1140 358.5 1103.5Q341 1067 331.0 1022.0Q321 977 321 930Q321 898 327.5 872.0Q334 846 341 826ZM398 379Q371 373 347.0 353.5Q323 334 308.5 306.5Q294 279 294 248Q294 223 307.0 196.5Q320 170 339 154Q352 142 365 136Q380 129 380 123Q380 120 370 117Q332 126 301.5 151.0Q271 176 253.5 211.5Q236 247 236 287Q236 330 253.5 370.0Q271 410 302.5 442.0Q334 474 374 490L345 641Q229 547 174.5 456.5Q120 366 120 277Q120 212 154.0 156.0Q188 100 247.0 65.5Q306 31 380 31Q400 31 420.5 35.0Q441 39 464 45ZM495 55Q593 97 593 227Q593 270 571.0 305.5Q549 341 512.0 362.0Q475 383 429 383Z';
  const BASS_PATH = 'M50 123Q216 231 288 301Q336 348 373.0 408.5Q410 469 431.5 536.0Q453 603 453 669Q453 728 435.0 773.5Q417 819 383.0 845.0Q349 871 302 871Q284 871 264.5 867.0Q245 863 224 855Q181 839 158.0 813.5Q135 788 135 765Q135 756 143.0 752.0Q151 748 158 748Q168 748 183 752Q190 754 196.5 755.0Q203 756 210 756Q248 756 272.0 733.5Q296 711 296 674Q296 638 266.0 612.0Q236 586 195 586Q146 586 111.0 617.0Q76 648 76 697Q76 756 109.0 802.0Q142 848 198.5 874.0Q255 900 324 900Q400 900 460.0 867.0Q520 834 555.5 776.5Q591 719 591 646Q591 551 538 464Q511 419 476.5 379.0Q442 339 389.0 297.5Q336 256 256.0 208.0Q176 160 57 101ZM687 809Q710 809 726.0 793.0Q742 777 742 754Q742 731 726.0 715.5Q710 700 687 700Q664 700 648.0 715.5Q632 731 632 754Q632 777 648.0 793.0Q664 809 687 809ZM687 589Q710 589 726.0 573.0Q742 557 742 534Q742 511 726.0 495.5Q710 480 687 480Q664 480 648.0 495.5Q632 511 632 534Q632 557 648.0 573.0Q664 589 687 589Z';
  const ACC_GLYPH = {
    '0':  { d: 'M226 316V-221H195V-9L50 -46V486H83V279ZM197 84V212L81 183V56Z', right: 226, mid: 132 },
    '1':  { d: 'M97 46V189L50 177V277L97 290V486H128V298L195 314V509H226V322L275 333V234L226 220V77L275 89V-14L226 -26V-214H195V-34L128 -52V-247H97V-59L50 -71V32ZM195 70V214L128 197V54Z', right: 275, mid: 131 },
    '-1': { d: 'M50 615H81V225Q118 262 165 262Q197 262 223.0 240.5Q249 219 249 178Q249 146 230.0 119.0Q211 92 179 65L110 6Q91 -10 76.0 -25.5Q61 -41 50 -55ZM81 12Q107 40 125.0 63.5Q143 87 153 105Q164 124 169.5 140.0Q175 156 175 170Q175 198 162.0 210.5Q149 223 134 223Q118 223 102.5 211.5Q87 200 81 180Z', right: 249, mid: 95 }
  };
  const KEY_STEPS = { sharp: [38, 35, 39, 36, 33, 37, 34], flat: [34, 37, 33, 36, 32, 35, 31] };
  const SHARP_ORDER = [3, 0, 4, 1, 5, 2, 6], FLAT_ORDER = [6, 2, 5, 1, 4, 0, 3];   // F C G D A E H  |  B E A D G C F
  const SPELL_SHARP = [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [3, 0], [3, 1], [4, 0], [4, 1], [5, 0], [5, 1], [6, 0]];
  const SPELL_FLAT = [[0, 0], [1, -1], [1, 0], [2, -1], [2, 0], [3, 0], [4, -1], [4, 0], [5, -1], [5, 0], [6, -1], [6, 0]];
  const VALUES = [[4, 'w'], [3, 'h.'], [2, 'h'], [1.5, 'q.'], [1, 'q'], [0.75, 'e.'], [0.5, 'e'], [0.25, 's']];
  const PAPER = '#fbfaf6', INK = '#1a1d2b', GRAY = '#a3a8ba';
  const BOTTOM = { treble: 30, bass: 18 }, MIDLINE = { treble: 34, bass: 22 };
  let glyphs = null;
  const glyph = d => (glyphs = glyphs || {})[d] || (glyphs[d] = new Path2D(d));

  // Aus den MIDI-Tönen Notenschrift machen: Schreibweise nach Tonart, Vorzeichen je Takt, Notenwerte, Balken
  function engrave() {
    const sg = S.song, tpq = sg.tpq, sf = sg.key;
    const keyAcc = [0, 0, 0, 0, 0, 0, 0];
    (sf > 0 ? SHARP_ORDER : FLAT_ORDER).slice(0, Math.abs(sf)).forEach(l => { keyAcc[l] = sf > 0 ? 1 : -1; });
    const spell = p => { const [l, a] = (sf < 0 ? SPELL_FLAT : SPELL_SHARP)[p % 12]; return { step: (Math.floor(p / 12) - 1) * 7 + l, acc: a, letter: l }; };
    const chords = [];
    for (const staff of ['treble', 'bass']) {
      let cur = null;
      for (const n of sg.notes) {
        if ((n.h === 'R') !== (staff === 'treble')) continue;
        if (cur && n.t - cur.t < 0.03) cur.notes.push(n);
        else chords.push(cur = { t: n.t, tick: n.tick, staff, notes: [n] });
      }
    }
    chords.sort((a, b) => a.t - b.t);
    const state = {};
    let bar = -1;
    for (const c of chords) {
      const b = sg.barOf(c.t);
      if (b !== bar) { for (const k in state) delete state[k]; bar = b; }
      c.heads = c.notes.map(n => {
        const s = spell(n.p), k = c.staff + s.step, was = k in state ? state[k] : keyAcc[s.letter];
        state[k] = s.acc;
        return { n, step: s.step, acc: s.acc, show: s.acc !== was };
      }).sort((a, b) => a.step - b.step);
      const beats = Math.max(...c.notes.map(n => n.dt)) / tpq;
      let best = VALUES[0];
      for (const v of VALUES) if (Math.abs(Math.log(beats / v[0])) < Math.abs(Math.log(beats / best[0]))) best = v;
      c.val = best[0]; c.dot = best[1].endsWith('.');
      c.hollow = c.val >= 2; c.stem = c.val < 4; c.flags = c.val <= 0.375 ? 2 : c.val <= 0.75 ? 1 : 0;
      const lo = c.heads[0].step, hi = c.heads[c.heads.length - 1].step;
      c.up = (lo + hi) / 2 < MIDLINE[c.staff];
      c.beam = null;
    }
    // Balken: aufeinanderfolgende Achtel und Sechzehntel innerhalb eines Schlags
    for (const staff of ['treble', 'bass']) {
      let grp = [];
      const flush = () => {
        if (grp.length >= 2) {
          const steps = grp.flatMap(c => c.heads.map(h => h.step)), up = steps.reduce((a, b) => a + b, 0) / steps.length < MIDLINE[staff];
          const g = grp; g.forEach(c => { c.beam = g; c.up = up; });
        }
        grp = [];
      };
      for (const c of chords) {
        if (c.staff !== staff) continue;
        if (!c.flags) { flush(); continue; }
        c.bt = sg.beatOf(c.tick);
        const prev = grp[grp.length - 1];
        if (prev && (c.bt !== prev.bt || c.tick - prev.tick > prev.val * tpq * 1.3 + 5)) flush();
        grp.push(c);
      }
      flush();
    }
    // Abstand: die kürzesten üblichen Notenabstände bekommen genug Platz
    const iois = [];
    for (let i = 1; i < chords.length; i++) { const d = (chords[i].tick - chords[i - 1].tick) / tpq; if (d > 0.05) iois.push(d); }
    iois.sort((a, b) => a - b);
    const minIoi = iois.length ? iois[Math.floor(iois.length * 0.1)] : 1;
    S.spb = Math.max(4.5, Math.min(10, 2.8 / minIoi));   // Linienabstände je Schlag
    S.chords = chords;
  }
  function drawSheet(g, w, hy, now) {
    const sg = S.song, sf = sg.key, nk = Math.abs(sf);
    g.fillStyle = PAPER; g.fillRect(0, 0, w, hy);
    const sp = Math.max(7, Math.min(18, hy / 22, w / 45));   // Linienabstand: so groß, wie der Platz erlaubt
    const top = Math.max(4.5 * sp, (hy - 15 * sp) / 2);
    const bot = { treble: top + 4 * sp, bass: top + 15 * sp };
    const yOf = (staff, step) => bot[staff] - (step - BOTTOM[staff]) * sp / 2;
    const Kf = sp * 4 / 1000;
    const x0 = 0.8 * sp, keyGap = (sf > 0 ? 0.96 : 0.82) * sp;
    const tsX = x0 + 4 * sp + nk * keyGap + 0.5 * sp, left = tsX + 2.4 * sp;
    const playX = left + Math.max(3 * sp, (w - left) * 0.2);
    const pxs = S.spb * sp * sg.bpm / 60;
    const xAt = t => playX + (t - S.pos) * pxs;
    const sysTop = bot.treble - 4 * sp, sysH = bot.bass - sysTop;
    const lines = (xa, xb) => { g.fillStyle = INK; for (const st of ['treble', 'bass']) for (let i = 0; i < 5; i++) g.fillRect(xa, Math.round(bot[st] - i * sp) - 0.5, xb - xa, 1); };
    lines(left, w);
    // Spiellinie
    g.fillStyle = S.waiting ? 'rgba(240,180,40,.18)' : 'rgba(91,130,255,.12)';
    g.fillRect(playX - 1.1 * sp, sysTop - 3 * sp, 2.2 * sp, sysH + 6 * sp);
    g.fillStyle = S.waiting ? 'rgba(230,160,20,.95)' : 'rgba(70,110,240,.9)';
    g.fillRect(playX - 1, sysTop - 3 * sp, 2, sysH + 6 * sp);
    // Taktstriche und Taktnummern
    g.font = `600 ${Math.round(sp * 0.95)}px Figtree, system-ui, sans-serif`; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    for (let i = 0; i < sg.bars.length; i++) {
      const x = xAt(sg.bars[i]) - 0.9 * sp;
      if (x < left - 2 || i === 0) continue;
      if (x > w + 2) break;
      g.fillStyle = INK; g.fillRect(Math.round(x), sysTop, 1.3, sysH);
      if (i) { g.fillStyle = '#8a8fa3'; g.fillText(String(i + 1), x + 2, sysTop - 1.1 * sp); }
    }
    // Hervorhebung: was gerade dran ist
    const cur = new Set();
    if (C.mode === 'wait') { const ev = S.events[S.evi]; if (ev && ev.t - S.pos < 1.5 * C.tempo) ev.notes.forEach(n => { if (!ev.got.has(n.p)) cur.add(n); }); }
    else if (C.mode === 'tempo') { const wd = WIN * C.tempo; for (let i = lowerBound(S.pn, S.pos - wd); i < S.pn.length && S.pn[i].t <= S.pos + wd; i++) if (!S.pn[i].res) cur.add(S.pn[i]); }
    else for (let i = lowerBound(sg.notes, S.pos - 6); i < sg.notes.length && sg.notes[i].t <= S.pos; i++) if (sg.notes[i].t + sg.notes[i].d > S.pos) cur.add(sg.notes[i]);
    const colOf = n => {
      if (C.mode !== 'listen' && !practiced(n)) return cur.has(n) ? (n.h === 'L' ? '#7fcfae' : '#9db3ff') : GRAY;
      if (n.res === 'hit') return '#1f9d55';
      if (n.res === 'miss') return '#d6453f';
      if (cur.has(n)) return n.h === 'L' ? '#13945f' : '#2f55e4';
      return INK;
    };
    const rx = 0.64 * sp, ry = 0.45 * sp;
    const v0 = S.pos - (playX - left) / pxs - 2, v1 = S.pos + (w - playX) / pxs + 0.5;
    const tipOf = c => {
      const ys = c.heads.map(hd => yOf(c.staff, hd.step));
      return c.up ? Math.min(...ys) - 3.4 * sp : Math.max(...ys) + 3.4 * sp;
    };
    const beamY = grp => (grp[0].up ? Math.min(...grp.map(tipOf)) : Math.max(...grp.map(tipOf)));
    const stemX = c => xAt(c.t) + (c.up ? rx * 0.92 : -rx * 0.92);
    for (let i = lowerBound(S.chords, v0); i < S.chords.length && S.chords[i].t <= v1; i++) {
      const c = S.chords[i], x = xAt(c.t), st = c.staff;
      const stemCol = c.notes.every(n => C.mode !== 'listen' && !practiced(n)) ? GRAY : INK;
      // Sekunde im Akkord: ein Kopf rückt auf die andere Seite des Halses
      const shifted = new Set();
      for (let k = 1; k < c.heads.length; k++) if (c.heads[k].step - c.heads[k - 1].step === 1 && !shifted.has(c.heads[k - 1])) shifted.add(c.up ? c.heads[k] : c.heads[k - 1]);
      // Hilfslinien
      g.fillStyle = stemCol;
      const lo = c.heads[0].step, hi = c.heads[c.heads.length - 1].step, b0 = BOTTOM[st];
      for (let s2 = b0 - 2; s2 >= lo; s2 -= 2) g.fillRect(x - 1.05 * rx - (shifted.size && !c.up ? 1.8 * rx : 0), yOf(st, s2) - 0.5, 2.1 * rx + (shifted.size ? 1.8 * rx : 0), 1.2);
      for (let s2 = b0 + 10; s2 <= hi; s2 += 2) g.fillRect(x - 1.05 * rx - (shifted.size && !c.up ? 1.8 * rx : 0), yOf(st, s2) - 0.5, 2.1 * rx + (shifted.size ? 1.8 * rx : 0), 1.2);
      // Vorzeichen in Spalten von oben nach unten
      const placed = [];
      [...c.heads].filter(hd => hd.show).sort((a, b) => b.step - a.step).forEach(hd => {
        let col = 0;
        while (placed.some(p => p.col === col && Math.abs(p.step - hd.step) < 6)) col++;
        placed.push({ step: hd.step, col });
        const gl = ACC_GLYPH[String(hd.acc)], right = x - rx - 0.35 * sp - col * 0.95 * sp - (shifted.size && !c.up ? 1.8 * rx : 0);
        g.save(); g.fillStyle = colOf(hd.n); g.translate(right - gl.right * Kf, yOf(st, hd.step) + gl.mid * Kf); g.scale(Kf, -Kf); g.fill(glyph(gl.d)); g.restore();
      });
      // Köpfe, Punkte, Namen
      for (const hd of c.heads) {
        const hx = shifted.has(hd) ? x + (c.up ? 1.8 * rx : -1.8 * rx) : x, y = yOf(st, hd.step), col = colOf(hd.n);
        g.beginPath(); g.ellipse(hx, y, rx, ry, -0.38, 0, Math.PI * 2);
        if (c.hollow) { g.fillStyle = PAPER; g.fill(); g.lineWidth = Math.max(1.3, sp * 0.16); g.strokeStyle = col; g.stroke(); }
        else { g.fillStyle = col; g.fill(); }
        if (c.dot) { g.beginPath(); g.arc(hx + 1.75 * rx, y - ((hd.step - BOTTOM[st]) % 2 === 0 ? sp / 2 : 0), sp * 0.17, 0, Math.PI * 2); g.fillStyle = col; g.fill(); }
        if (C.names && (practiced(hd.n) || C.mode === 'listen')) {
          g.font = `700 ${Math.round(sp * 0.82)}px Figtree, system-ui, sans-serif`; g.fillStyle = col === INK ? '#6b7088' : col; g.textBaseline = 'middle';
          g.fillText(NAMES[hd.n.p % 12], hx + 1.25 * rx + (c.dot ? 0.6 * sp : 0) + (c.up && !shifted.has(hd) && shifted.size ? 1.8 * rx : 0), y);
          g.textBaseline = 'alphabetic';
        }
      }
      // Hals, Fähnchen, Balken
      if (c.stem) {
        const sx = stemX(c), ys = c.heads.map(hd => yOf(st, hd.step));
        const from = c.up ? Math.max(...ys) : Math.min(...ys), tip = c.beam ? beamY(c.beam) : tipOf(c);
        g.fillStyle = stemCol; g.fillRect(sx - 0.6, Math.min(from, tip), 1.3, Math.abs(tip - from));
        if (c.flags && !c.beam) {
          const dir = c.up ? 1 : -1;
          g.strokeStyle = stemCol; g.lineWidth = Math.max(1.4, sp * 0.22);
          for (let f = 0; f < c.flags; f++) {
            const ty = tip + f * 0.8 * sp * dir;
            g.beginPath(); g.moveTo(sx, ty); g.bezierCurveTo(sx + 0.15 * sp, ty + 1.1 * sp * dir, sx + 1.25 * sp, ty + 1.5 * sp * dir, sx + 0.85 * sp, ty + 2.9 * sp * dir); g.stroke();
          }
        }
        if (c.beam) {
          const k = c.beam.indexOf(c), nx = c.beam[k + 1];
          if (nx) {
            const by = beamY(c.beam), th = Math.max(2.5, sp * 0.48), dir = c.up ? 1 : -1, x2 = stemX(nx);
            g.fillStyle = stemCol;
            g.fillRect(sx - 0.6, c.up ? by : by - th, x2 - sx + 1.3, th);
            if (c.flags > 1 && nx.flags > 1) g.fillRect(sx - 0.6, (c.up ? by : by - th) + 0.78 * sp * dir, x2 - sx + 1.3, th);
            else if (c.flags > 1 && (k === 0 || c.beam[k - 1].flags < 2)) g.fillRect(sx - 0.6, (c.up ? by : by - th) + 0.78 * sp * dir, Math.min(1.1 * sp, (x2 - sx) / 2), th);
          } else if (c.flags > 1 && c.beam[k - 1].flags < 2) {
            const by = beamY(c.beam), th = Math.max(2.5, sp * 0.48), dir = c.up ? 1 : -1;
            g.fillStyle = stemCol; g.fillRect(sx - Math.min(1.1 * sp, (sx - stemX(c.beam[k - 1])) / 2), (c.up ? by : by - th) + 0.78 * sp * dir, Math.min(1.1 * sp, (sx - stemX(c.beam[k - 1])) / 2) + 0.7, th);
          }
        }
      }
    }
    // Fester Anfang links: Klammer, Schlüssel, Tonart, Taktart
    const fade = g.createLinearGradient(left, 0, left + 2.5 * sp, 0);
    fade.addColorStop(0, PAPER); fade.addColorStop(1, 'rgba(251,250,246,0)');
    g.fillStyle = PAPER; g.fillRect(0, 0, left, hy);
    g.fillStyle = fade; g.fillRect(left, 0, 2.5 * sp, hy);
    lines(x0, left);
    g.fillStyle = INK; g.fillRect(x0, sysTop, 1.5, sysH);
    g.save(); g.translate(x0 + 0.3 * sp, bot.treble); g.scale(Kf, -Kf); g.fill(glyph(TREBLE_PATH)); g.restore();
    g.save(); g.translate(x0 + 0.45 * sp, bot.bass - 106 * Kf); g.scale(Kf, -Kf); g.fill(glyph(BASS_PATH)); g.restore();
    const kind = sf > 0 ? 'sharp' : 'flat', kg = ACC_GLYPH[sf > 0 ? '1' : '-1'];
    for (const st of ['treble', 'bass']) KEY_STEPS[kind].slice(0, nk).forEach((step, i) => {
      g.save(); g.translate(x0 + 4 * sp + i * keyGap - 50 * Kf, yOf(st, st === 'treble' ? step : step - 14) + kg.mid * Kf); g.scale(Kf, -Kf); g.fill(glyph(kg.d)); g.restore();
    });
    const [tn, td] = sg.sig.split('/');
    g.font = `800 ${Math.round(sp * 2.1)}px Georgia, "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK;
    for (const st of ['treble', 'bass']) { g.fillText(tn, tsX + 0.9 * sp, bot[st] - 3 * sp); g.fillText(td, tsX + 0.9 * sp, bot[st] - sp); }
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }

  // ---------- Bedienung ----------
  const segHtml = (name, opts, cur) => opts.map(([v, l]) => `<input type="radio" name="${name}" id="${name}-${v}" value="${v}" ${String(v) === String(cur) ? 'checked' : ''}><label for="${name}-${v}">${l}</label>`).join('');
  function ui() {
    $('pl-play').textContent = S.playing ? 'Pause' : 'Start';
    $('pl-play').setAttribute('aria-pressed', S.playing);
    $('pl-tval').textContent = `${Math.round(C.tempo * 100)} %${S.song ? ` · ♩ ${Math.round(S.song.bpm * C.tempo)}` : ''}`;
    $('pl-loop').setAttribute('aria-pressed', !!S.loop);
    $('pl-loopbox').hidden = !S.loop;
    if (S.loop) { $('pl-la').value = S.loop.a + 1; $('pl-lb').value = S.loop.b + 1; }
  }
  function setLoop(a, b) {
    const n = S.song.bars.length;
    a = Math.max(0, Math.min(n - 1, a)); b = Math.max(a, Math.min(n - 1, b));
    S.loop = { a, b }; S.pass = 0; S.passNote = '';
    ui();
  }
  function setOpt(k, v) {
    const was = S.playing;
    C[k] = v; saveCfg();
    if (k === 'tempo') { ui(); return; }
    if (k === 'view') { try { localStorage.setItem('nl-play-view', v); } catch (e) {} return; }
    if (k === 'vol') { Synth.volume(v); return; }
    if (k === 'names' || k === 'accomp' || k === 'view') return;
    $('pl-hint').hidden = true;
    pause();
    prepare();
    if (was && C.mode !== 'wait') play();
    ui();
  }
  let built = false;
  function build() {
    if (built) return;
    built = true;
    $('pl-view').innerHTML = segHtml('plv', [['falling', 'Tasten'], ['sheet', 'Noten']], C.view);
    $('pl-view').addEventListener('change', e => setOpt('view', e.target.value));
    $('pl-hands').innerHTML = segHtml('plh', [['L', 'Links'], ['both', 'Beide'], ['R', 'Rechts']], C.hands);
    $('pl-mode').innerHTML = segHtml('plm', [['wait', 'Warten'], ['tempo', 'Im Tempo'], ['listen', 'Anhören']], C.mode);
    $('pl-split').innerHTML = segHtml('pls', [['auto', 'Automatisch'], ['pitch', 'Trennung bei C4']], C.split);
    $('pl-hands').addEventListener('change', e => setOpt('hands', e.target.value));
    $('pl-mode').addEventListener('change', e => setOpt('mode', e.target.value));
    $('pl-split').addEventListener('change', e => setOpt('split', e.target.value));
    $('pl-names').addEventListener('change', e => setOpt('names', e.target.checked));
    $('pl-accomp').addEventListener('change', e => setOpt('accomp', e.target.checked));
    $('pl-vol').addEventListener('input', e => setOpt('vol', +e.target.value));
    $('pl-play').addEventListener('click', () => (S.playing ? pause() : play()));
    $('pl-restart').addEventListener('click', restart);
    $('pl-tdown').addEventListener('click', () => setOpt('tempo', Math.max(0.25, Math.round((C.tempo - 0.05) * 100) / 100)));
    $('pl-tup').addEventListener('click', () => setOpt('tempo', Math.min(1.5, Math.round((C.tempo + 0.05) * 100) / 100)));
    $('pl-loop').addEventListener('click', () => {
      if (S.loop) { S.loop = null; ui(); return; }
      const b = S.song.barOf(Math.max(0, S.pos));
      setLoop(b, b + 1);
      if (!S.playing) restart();
    });
    const loopIn = () => setLoop((+$('pl-la').value || 1) - 1, (+$('pl-lb').value || 1) - 1);
    $('pl-la').addEventListener('change', () => { loopIn(); restart(); });
    $('pl-lb').addEventListener('change', () => { loopIn(); restart(); });
    $('pl-seek').addEventListener('input', e => seekBar(+e.target.value));
    $('pl-midi').addEventListener('click', () => { if (S.midiState !== 'ok') connectMidi(); });
    $('pl-opts').addEventListener('click', () => { const p = $('pl-panel'); p.hidden = !p.hidden; $('pl-opts').setAttribute('aria-expanded', !p.hidden); });
    $('pl-close').addEventListener('click', () => $('player').close());
    $('pl-replace').addEventListener('click', () => S.opts.onReplace && S.opts.onReplace());
    $('pl-remove').addEventListener('click', () => {
      const b = $('pl-remove');
      if (!b.classList.contains('armed')) { b.classList.add('armed'); b.textContent = 'Wirklich entfernen?'; setTimeout(() => { b.classList.remove('armed'); b.textContent = 'MIDI-Datei entfernen'; }, 3500); return; }
      $('player').close();
      S.opts.onRemove && S.opts.onRemove();
    });
    $('pl-stage').addEventListener('pointerdown', e => { if (e.target.closest('.vpanel, .pl-result')) return; $('pl-panel').hidden = true; });
    $('player').addEventListener('close', () => {
      pause();
      cancelAnimationFrame(S.raf);
      S.down.clear();
      if (S.wake) { S.wake.release().catch(() => {}); S.wake = null; }
      S.opts && S.opts.onClose && S.opts.onClose();
    });
    document.addEventListener('keydown', e => {
      if (!$('player').open || e.target.matches('input[type=number], input[type=text], select, textarea')) return;
      if (e.key === ' ') { e.preventDefault(); S.playing ? pause() : play(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); seekBar(S.song.barOf(Math.max(0, S.pos)) + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); seekBar(S.song.barOf(Math.max(0, S.pos)) - 1); }
      else if (e.key === 'Home') { e.preventDefault(); restart(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible' && S.playing) pause(); });
  }
  async function keepAwake() {
    try { if (!S.wake && 'wakeLock' in navigator && document.visibilityState === 'visible') { S.wake = await navigator.wakeLock.request('screen'); S.wake.addEventListener('release', () => { S.wake = null; }); } } catch (e) {}
  }

  async function open(opts) {
    const song = parse(opts.buffer);   // wirft eine verständliche Meldung, wenn die Datei nicht passt
    S.opts = opts; S.key = opts.key; S.song = song;
    let lastView = 'falling';
    try { lastView = localStorage.getItem('nl-play-view') || 'falling'; } catch (e) {}
    C = { ...DEF, view: lastView, ...((cfgAll()[opts.key] || {}).cfg || {}) };
    build();
    S.kb = keyboardRange(); S.geo = null; S.loop = null; S.pass = 0; S.passNote = ''; S.counted = 0; S.status = '';
    S.down.clear(); S.lit.clear(); hideResult();
    $('pl-title').innerHTML = '';
    $('pl-title').append(opts.title || 'Mitspielen');
    if (opts.sub) { const sm = document.createElement('small'); sm.textContent = opts.sub; $('pl-title').append(sm); }
    ['plh', 'plm', 'pls', 'plv'].forEach(n => document.querySelectorAll(`input[name="${n}"]`).forEach(r => { r.checked = r.value === { plh: C.hands, plm: C.mode, pls: C.split, plv: C.view }[n]; }));
    $('pl-names').checked = C.names; $('pl-accomp').checked = C.accomp; $('pl-vol').value = C.vol;
    $('pl-seek').max = song.bars.length - 1;
    $('pl-info').textContent = `${song.notes.length} Töne, ${song.bars.length} Takte, ${song.sig}-Takt, Tempo ♩ ${song.bpm}. `
      + (song.twoTracks ? 'Zwei Spuren erkannt: die höhere ist die rechte, die tiefere die linke Hand.' : 'Hände werden beim eingestrichenen C (C4) getrennt.');
    $('pl-panel').hidden = true;
    S.pos = song.first - lead();
    prepare();
    $('player').showModal();
    ui();
    S.last = 0;
    cancelAnimationFrame(S.raf);
    S.raf = requestAnimationFrame(frame);
    if (!navigator.requestMIDIAccess) midiChip('unsupported');
    else if (S.midi) bindMidi();
    else {
      midiChip('off');
      try { const st = await navigator.permissions.query({ name: 'midi' }); if (st.state === 'granted') connectMidi(); } catch (e) {}
    }
    const hint = $('pl-hint');
    hint.textContent = S.midiState === 'unsupported'
      ? 'Ohne E-Piano kannst du zuhören und zusehen. Zum Mitspielen am PC Chrome oder Edge mit angeschlossenem E-Piano nutzen.'
      : C.mode === 'wait' ? 'Wartemodus: Es geht weiter, sobald du die richtigen Töne spielst.' : 'Leertaste: Start und Pause · Pfeiltasten: Takt vor und zurück';
    hint.hidden = false;
    clearTimeout(S.hintT); S.hintT = setTimeout(() => { hint.hidden = true; }, 5000);
  }

  window.NLPlay = { open, parse, test: { noteOn, noteOff, S, get C() { return C; } } };
})();
