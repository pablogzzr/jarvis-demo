/* Jarvis — public demo shim.
   The real panel talks to a small server on Pablo's Mac that reads his second brain. This file stands in for
   that server: every /api/... call is answered from the invented data in data/, decisions change an in-memory
   copy (kept for this browser tab), and the clock is pinned to the demo's Thursday morning. Nothing is sent. */
(function(){
  'use strict';
  const BASE = new URL('.', document.currentScript ? document.currentScript.src : location.href).href;
  const KEY = 'jarvis-demo-state-v1';
  const VER = 'a1aade31';

  /* ── the clock: Thursday 22 Oct 2026, 08:10 in Boston, moving forward in real time ── */
  const DEMO_START = Date.UTC(2026, 9, 22, 12, 10, 0);   /* 08:10 EDT */
  const RealDate = Date, realNow = RealDate.now(), OFFSET = DEMO_START - realNow;
  function DemoDate(...a){
    if(!(this instanceof DemoDate)) return new DemoDate(...a).toString();
    return a.length ? new RealDate(...a) : new RealDate(RealDate.now() + OFFSET);
  }
  DemoDate.prototype = RealDate.prototype;
  DemoDate.now = () => RealDate.now() + OFFSET;
  DemoDate.parse = RealDate.parse; DemoDate.UTC = RealDate.UTC;
  Object.setPrototypeOf(DemoDate, RealDate);
  window.Date = DemoDate;

  /* ── the data ── */
  const FILES = { datos:'data/datos.json', cerebro:'data/E_brain.json', corridas:'data/H_runs.json', yo:'data/F_me.json',
                  sala:'data/G_study.json', snotas:'data/G_study_nota.json', notas:'data/E_notas.json', prep:'data/E_prep.json' };
  const cache = {};
  const realFetch = window.fetch.bind(window);
  function get(name){
    if(!cache[name]) cache[name] = realFetch(BASE + FILES[name] + '?v=' + VER).then(r => r.ok ? r.json() : {}).catch(() => ({}));
    return cache[name];
  }
  /* a reset wipes what the panel saved for itself before it starts again (it saves on the way out too) */
  try{ if(sessionStorage.getItem('jarvis-demo-wipe')){ const seen = localStorage.getItem('jarvis-demo-tour-seen'); localStorage.clear(); if(seen) localStorage.setItem('jarvis-demo-tour-seen', seen); sessionStorage.clear(); } }catch(_){}
  let state = null;
  try{ state = JSON.parse(sessionStorage.getItem(KEY) || 'null'); }catch(_){}
  function save(){ try{ sessionStorage.setItem(KEY, JSON.stringify(state)); }catch(_){} }
  async function datos(){
    if(!state){ state = { datos: await get('datos') }; save(); }
    return state.datos;
  }

  /* find every object in the data whose raw line matches, so a decision moves its row out of "open" */
  function walk(v, fn){ if(Array.isArray(v)) v.forEach(x => walk(x, fn)); else if(v && typeof v === 'object'){ fn(v); Object.values(v).forEach(x => walk(x, fn)); } }
  function decide(d, crudo, estado){
    let hit = null;
    if(crudo) walk(d, o => { if(!hit && o.crudo === crudo){ hit = o; } });
    if(hit){ hit.estado = estado; save(); }
    return hit;
  }

  const json = (obj, status) => new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } });
  const qs = u => Object.fromEntries(new URL(u, location.href).searchParams);

  async function answer(url, opt){
    const u = new URL(url, location.href), path = u.pathname.replace(/^.*?\/api\//, '/api/'), method = (opt && opt.method || 'GET').toUpperCase();
    let body = {}; try{ body = opt && opt.body ? JSON.parse(opt.body) : {}; }catch(_){}
    if(method === 'GET'){
      if(path === '/api/datos') return json(await datos());
      if(path === '/api/cerebro') return json(await get('cerebro'));
      if(path === '/api/corridas') return json(await get('corridas'));
      if(path === '/api/yo') return json(await get('yo'));
      if(path === '/api/estudio/sala'){ if(!state || !state.sala){ await datos(); state.sala = await get('sala'); save(); } return json(state.sala); }
      if(path === '/api/estudio/nota'){ const n = (await get('snotas'))[qs(url).id]; return n ? json(n) : json({ error: 'not in the demo' }, 404); }
      if(path === '/api/nota'){ const k = qs(url).nombre, n = (await get('notas'))[k] || (await get('prep'))[k]; return n ? json(n) : json({ error: 'not in the demo' }, 404); }
      if(path === '/api/linkedin/boceto') return json({ error: 'not in the demo' }, 404);
      return json({ error: 'not in the demo' }, 404);
    }
    /* POST — every decision is accepted and kept in this tab only */
    const d = await datos();
    if(path === '/api/marcar' && state.sala && Array.isArray(state.sala.items)){ const it = state.sala.items.find(x => x.crudo === body.crudo); if(it){ state.sala.items = state.sala.items.filter(x => x !== it); save(); } }
    if(path === '/api/yo/respuesta'){ const h = new Date(); return json({ ok: true, hoy: { [body.pregunta]: [{ hora: String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0'), valor: body.valor }] } }); }
    if(path === '/api/estudio/tarjetas') return json({ ok: true, hechas: [{ titulo: 'Your new flashcard', categoria: 'Study', proximo: '2026-10-23' }] });
    if(path === '/api/aprendizaje/tarjeta'){ decide(d, body.crudo, 'decidida'); return json({ ok: true, crudo: body.crudo, dias: 3 }); }
    if(path === '/api/correlo' && body.solo_copiar) return json({ ok: true, donde: 'portapapeles' });
    if(path === '/api/marcar' || path === '/api/aprendizaje/gusto') decide(d, body.crudo, body.marca === ' ' || body.marca === '' ? 'pendiente' : 'decidida');
    else if(path === '/api/comentar' || path === '/api/quien') decide(d, body.crudo, 'decidida');
    else if(path === '/api/despues'){ walk(d, o => { if(o.id === body.id && o.estado === 'pendiente') o.estado = body.deshacer ? 'pendiente' : 'despues'; }); save(); }
    else if(path === '/api/correlo') demoNote('In the real Jarvis this opens a Claude session with this prompt.');
    else if(/todoist|linkedin\/nuevo|grupo\/nuevo|registro\/mio|semana|trimestre|manana/.test(path)) {}
    return json({ ok: true, demo: true, crudo: body.crudo });
  }

  window.fetch = function(input, opt){
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if(/\/api\//.test(url) && new URL(url, location.href).origin === location.origin) return answer(url, opt);
    return realFetch(input, opt);
  };

  /* "Reset the demo" — back to the untouched morning */
  window.jarvisDemoReset = function(){
    /* the panel saves its morning on the way out, so stop every write first, then wipe */
    const set = Storage.prototype.setItem; Storage.prototype.setItem = function(){};
    try{ const seen = localStorage.getItem('jarvis-demo-tour-seen'); localStorage.clear(); sessionStorage.clear(); if(seen) set.call(localStorage, 'jarvis-demo-tour-seen', seen); }catch(_){}
    location.reload();
  };

  /* a small bottom note for actions that would leave the browser in the real Jarvis */
  function demoNote(text){
    let n = document.getElementById('demo-note');
    if(!n){ n = document.createElement('div'); n.id = 'demo-note'; document.body.appendChild(n); }
    n.textContent = text; n.className = 'show'; clearTimeout(n._t); n._t = setTimeout(() => n.className = '', 3200);
  }
  window.jarvisDemoNote = demoNote;
  /* registered before the panel's own keys, so the tour can take Esc and the arrows while it is open */
  window.addEventListener('keydown', e => { if(window.__tourKey) window.__tourKey(e); }, true);

  /* links into Pablo's own apps (Obsidian, Word, WhatsApp, Claude) have nothing behind them here */
  const APP = /^(obsidian|ms-word|whatsapp|claude|things|todoist|shortcuts):/i;
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if(a && APP.test(a.getAttribute('href'))){ e.preventDefault(); e.stopPropagation(); demoNote('In the real Jarvis this opens ' + a.getAttribute('href').split(':')[0] + ' on Pablo\'s Mac.'); }
  }, true);
  const realAssign = location.assign.bind(location);
  window.open = (orig => (u, ...r) => { if(u && APP.test(String(u))){ demoNote('In the real Jarvis this opens an app on Pablo\'s Mac.'); return null; } return orig(u, ...r); })(window.open.bind(window));
})();
