/* Jarvis — public demo walkthrough.
   An action-driven tour: the visitor clicks the real buttons, and each step moves on when the panel actually
   changes. The highlight follows its target every frame (scroll, resize, panels sliding in), and the card is
   placed on the side that never covers what it is pointing at. Chapters: the morning, levels 01–03, and
   what sits behind the panel. Esc pauses; the badge's Tour button resumes or replays any chapter. */
(function(){
  'use strict';
  const MAIN = !!document.getElementById('app');
  const SEEN = 'jarvis-demo-tour-seen', POS = 'jarvis-demo-tour-pos', DONE = 'jarvis-demo-tour-done';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r) => (r || document).querySelector(s);
  const store = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(_){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} }
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function waitFor(fn, ms = 6000){ const t0 = Date.now(); for(;;){ let v; try{ v = fn(); }catch(_){} if(v) return v; if(Date.now() - t0 > ms) return null; await sleep(80); } }

  /* ── what the panel looks like right now ── */
  const P = {
    sheetOpen: () => !!$('#sheet.show'),
    sheetTitle: () => ($('#shTitle') || {}).textContent || '',
    started: () => !!$('#app .box.tier'),
    level: () => { const a = $('#app .box.tier.active'); const m = a && a.textContent.trim().match(/^0?(\d)/); return m ? +m[1] : 0; },
    brainOpen: () => !!(window.JarvisHUD && window.JarvisHUD.isOpen),
    firstRow: () => $('#sheet .row:not(.done):not(.handled)') || $('#sheet .row'),
    call: (name, ...a) => { try{ return typeof window[name] === 'function' ? window[name](...a) : undefined; }catch(_){} }
  };
  async function calm(){ if(P.brainOpen()) P.call('closeBrain'); if(P.sheetOpen()) P.call('closeSheet'); await waitFor(() => !P.sheetOpen() && !P.brainOpen(), 2000); }
  async function toStart(){ await calm(); if(!$('#go')) P.call('startPage'); await waitFor(() => $('#go'), 3000); window.scrollTo(0, 0); }
  async function toLevel(n){
    await calm();
    if(!P.started()){ const g = $('#go'); if(g) g.click(); await waitFor(P.started, 4000); }
    if(P.level() !== n){ const b = $(`[data-goto="${n}"]`); if(b) b.click(); await waitFor(() => P.level() === n, 3000); }
    window.scrollTo(0, 0); await sleep(250);
  }
  function rowGone(){ let k = null; return { start(){ const r = P.firstRow(); k = r && r.dataset.k; }, done(){ if(!k) return !P.sheetOpen(); const r = document.querySelector(`#sheet .row[data-k="${CSS.escape(k)}"]`); return !r || !P.sheetOpen() || r.classList.contains('done') || r.classList.contains('handled') || r.getBoundingClientRect().height < 4; } }; }

  /* ── the tour ── */
  const CH = [
    { id: 'morning', name: 'Your morning', prep: toStart },
    { id: 'l1', name: 'Level 01 · Urgent + important', prep: () => toLevel(1) },
    { id: 'l2', name: 'Level 02 · Important', prep: () => toLevel(2) },
    { id: 'l3', name: 'Level 03 · Nice to have', prep: () => toLevel(3) },
    { id: 'behind', name: 'Behind the panel', prep: async () => { await calm(); if(!P.started()) await toStart(); window.scrollTo(0, 0); } }
  ];
  const r1 = rowGone(), r2 = rowGone(), r3 = rowGone();
  const tileOf = sel => { const b = $(sel); return b && (b.closest('.tile') || b); };
  const okFirst = () => { const r = P.firstRow(), b = r && r.querySelector('[data-act="ok"]'); if(b) b.click(); };
  const STEPS = [
    { ch: 'morning', kind: 'modal', title: 'This is Jarvis',
      body: "Pablo González's AI chief of staff. Overnight, about fifty agents read his mail, meetings, calendar and notes. In the morning this page shows him only what needs his judgment. Everything here is an invented week, and nothing you click is sent.",
      primary: 'Take the tour · 3 min', secondary: 'Explore on my own' },
    { ch: 'morning', el: '#app .tl', title: 'Only what is different today',
      body: 'One-off meetings, a birthday, a deadline. Routine classes and the gym stay off. Each line says who, why, and what to bring.' },
    { ch: 'morning', el: '#app .obj', title: 'Quarter → week → today',
      body: "The quarter's quests, this week's three objectives, and the one thing that makes today a win. Pablo writes these himself, and the agents plan around them." },
    { ch: 'morning', el: () => { const g = $('#go'); return g && g.parentElement; }, act: true, title: 'Two ways in',
      body: '<b>Start with intro</b> plays the Jarvis boot sequence (about 25 seconds, sound on). <b>Start the run</b> goes straight in. Click one.',
      until: () => P.level() === 1 && !P.brainOpen(), park: true, waitHide: true, doIt: () => { parked = true; W.hidden = true; $('#go') && $('#go').click(); } },

    { ch: 'l1', el: () => tileOf('[data-panel="prep"]'), act: true, title: 'Level 01: what cannot wait',
      body: 'Three tiles: meeting prep, deadlines, and promises he owes. Open <b>Meeting prep</b>.',
      until: () => P.sheetOpen() && /prep/i.test(P.sheetTitle()), doIt: () => $('[data-panel="prep"]').click() },
    { ch: 'l1', el: () => { const r = P.firstRow(); return r && (r.querySelector('.btns') || r); }, place: 'side', act: true, title: 'A brief for every meeting',
      body: 'An agent wrote the brief above overnight: who they are, what they want, what to ask. Mark it <b>Useful</b><span class="tw-kb"> (or press A)</span>. The agents learn from every yes and no.',
      start: () => r1.start(), until: () => r1.done(), doIt: okFirst },
    { ch: 'l1', el: '#shClose', act: true, title: 'One down', body: 'Close the panel to get back to the level.',
      until: () => !P.sheetOpen(), doIt: () => P.call('closeSheet') },
    { ch: 'l1', el: '#app .box.tier.active [data-goto="2"]', act: true, title: 'On to level 02', body: 'Pablo clears a level, then presses <b>Check 01</b>. For the demo, click <b>Skip to 02</b>. Whatever stays open waits for tomorrow.',
      until: () => P.level() === 2, waitHide: true, doIt: () => $('#app .box.tier.active [data-goto="2"]').click() },

    { ch: 'l2', el: () => tileOf('[data-panel="cold"]'), act: true, title: 'Level 02: people',
      body: 'Who was who in meetings, new people, warm follow-ups, LinkedIn. Open <b>Cold outreach</b>.',
      until: () => P.sheetOpen() && /cold/i.test(P.sheetTitle()), doIt: () => $('[data-panel="cold"]').click() },
    { ch: 'l2', el: () => { const r = P.firstRow(); return r && (r.querySelector('.btns') || r); }, place: 'side', act: true, title: 'A first message, already drafted',
      body: 'Above: someone worth meeting, and the first note an agent wrote in his voice. <b>Approve</b> it. In the real Jarvis it becomes a Gmail draft, and Pablo always presses Send himself.',
      start: () => r2.start(), until: () => r2.done(), doIt: okFirst },
    { ch: 'l2', el: '#shClose', act: true, title: 'Back to the level', body: 'Close the panel.', until: () => !P.sheetOpen(), doIt: () => P.call('closeSheet') },
    { ch: 'l2', el: '#app .box.tier.active [data-goto="3"]', act: true, title: 'On to level 03', body: 'Click <b>Skip to 03</b>.',
      until: () => P.level() === 3, waitHide: true, doIt: () => $('#app .box.tier.active [data-goto="3"]').click() },

    { ch: 'l3', el: () => tileOf('[data-panel="thinking"]'), act: true, title: 'Level 03: getting better',
      body: "Today's lesson, his council, notes on how he communicated. Open <b>Everything to learn</b>.",
      until: () => P.sheetOpen() && /learn/i.test(P.sheetTitle()), doIt: () => $('[data-panel="thinking"]').click() },
    { ch: 'l3', el: () => { const r = P.firstRow(); return r && (r.querySelector('.btns') || r); }, place: 'side', act: true, title: 'The lesson of the day',
      body: 'Above: a lesson picked from the books he read, for the problem he has today. If it helps, mark it <b>Useful</b>.',
      start: () => r3.start(), until: () => r3.done(), doIt: okFirst },
    { ch: 'l3', el: '#shClose', act: true, title: 'Almost there', body: 'Close the panel.', until: () => !P.sheetOpen(), doIt: () => P.call('closeSheet') },
    { ch: 'l3', el: '[data-close="3"]', title: 'The end of the morning', body: 'When all three levels are checked, the morning is done: about fifteen minutes, and the agents have their answers for tonight.' },

    { ch: 'behind', el: '#agentsBtn', act: true, title: 'The agents behind it',
      body: 'Click to meet them, grouped by the goal each one serves.', until: () => P.sheetOpen() && /agent/i.test(P.sheetTitle()), doIt: () => $('#agentsBtn').click() },
    { ch: 'behind', kind: 'float', corner: 'tr', top: 70, title: 'Fifty agents, four goals',
      body: 'Commitments, People, Thinking, Upkeep. Each agent has a trust score that rises when Pablo accepts its work unedited. Click one to see what it does.',
      primary: 'Close the agents', onPrimary: () => P.call('closeSheet'), until: () => !P.sheetOpen() },
    { ch: 'behind', el: '[data-brain]', act: true, title: 'The second brain',
      body: 'Every note lives as plain text in four folders. Click <b>Your brain</b>.', until: P.brainOpen, park: true, waitHide: true, doIt: () => $('[data-brain]').click() },
    { ch: 'behind', kind: 'float', title: 'Every note and every link', delay: 1600,
      body: 'Drag to turn it, scroll to zoom, click a dot to read the note.',
      primary: 'Back to the panel', onPrimary: () => P.call('closeBrain'), until: () => !P.brainOpen() },
    { ch: 'behind', kind: 'modal', title: "That's Jarvis",
      body: 'Two more pages sit top right: <b>Study</b>, the queue of things he wants to learn, and <b>Me</b>, where the week really went. <span class="tw-kb">Press <b>⌘K</b> for every command. </span> Replay any part from <b>Tour</b> in the corner, and <b>Reset</b> brings the morning back.',
      primary: 'Done', secondary: 'Open Study', onSecondary: () => { location.href = 'estudio.html'; }, last: true }
  ];
  STEPS.forEach((s, i) => { s.i = i; s.chi = CH.findIndex(c => c.id === s.ch); });
  const inCh = s => STEPS.filter(x => x.ch === s.ch);

  /* ── styles ── */
  const css = `
  :root{--tg:#5EE6B0;--tbg:#0f1311;--tline:#2a332e;--ttx:#e8ece9;--tmu:#9aa59f}
  #demo-badge{position:fixed;left:16px;bottom:16px;z-index:2147482990;display:flex;gap:6px;align-items:center;font:500 11px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
  #demo-badge span{color:#0a0c0b;background:var(--tg);padding:7px 9px;border-radius:6px}
  #demo-badge button,#demo-badge a{font:inherit;color:var(--ttx);background:rgba(15,19,17,.94);border:1px solid var(--tline);border-radius:6px;padding:6px 9px;cursor:pointer;text-decoration:none}
  #demo-badge button:hover,#demo-badge a:hover,#demo-badge button:focus-visible{border-color:var(--tg);color:var(--tg);outline:none}
  @media (hover:none) and (pointer:coarse){#demo-badge{bottom:calc(84px + env(safe-area-inset-bottom));left:12px}}
  #demo-note{position:fixed;left:50%;bottom:70px;transform:translate(-50%,12px);opacity:0;transition:.25s;z-index:2147483600;max-width:min(520px,calc(100vw - 32px));font:12px/1.5 'Geist Mono',ui-monospace,monospace;color:var(--ttx);background:var(--tbg);border:1px solid var(--tg);border-radius:8px;padding:10px 14px;pointer-events:none}
  #demo-note.show{opacity:1;transform:translate(-50%,0)}
  #tw{position:fixed;inset:0;z-index:2147483000;pointer-events:none}
  #tw[hidden]{display:none}
  #tw .tw-shade{position:fixed;inset:0;background:rgba(3,5,4,.62);opacity:0;transition:opacity .2s}
  #tw .tw-blk{position:fixed;pointer-events:auto;background:transparent;display:none}
  #tw .tw-hole{position:fixed;display:none;border-radius:10px;box-shadow:0 0 0 9999px rgba(3,5,4,.62);outline:2px solid var(--tg);pointer-events:none}
  #tw.tw-act .tw-hole{animation:tw-pulse 1.8s ease-out infinite}
  @keyframes tw-pulse{0%{box-shadow:0 0 0 9999px rgba(3,5,4,.62),0 0 0 0 rgba(94,230,176,.55)}70%{box-shadow:0 0 0 9999px rgba(3,5,4,.62),0 0 0 12px rgba(94,230,176,0)}100%{box-shadow:0 0 0 9999px rgba(3,5,4,.62),0 0 0 0 rgba(94,230,176,0)}}
  #tw .tw-hole.tw-glide{transition:left .28s cubic-bezier(.2,.8,.2,1),top .28s cubic-bezier(.2,.8,.2,1),width .28s cubic-bezier(.2,.8,.2,1),height .28s cubic-bezier(.2,.8,.2,1)}
  #tw .tw-card{display:block;margin:0;text-align:left;text-transform:none;letter-spacing:0;box-sizing:border-box;position:fixed;left:0;top:0;width:min(360px,calc(100vw - 24px));pointer-events:auto;background:var(--tbg);border:1px solid var(--tline);border-radius:12px;padding:16px 16px 12px;color:var(--ttx);font:13px/1.55 'Geist Mono',ui-monospace,monospace;box-shadow:0 18px 50px rgba(0,0,0,.55);will-change:transform;opacity:0;transition:opacity .18s}
  #tw .tw-card.tw-on{opacity:1}
  #tw .tw-card.tw-glide{transition:opacity .18s,transform .28s cubic-bezier(.2,.8,.2,1)}
  #tw .tw-card.tw-modal{width:min(440px,calc(100vw - 32px));padding:22px 22px 16px}
  #tw .tw-card .tw-arrow{position:absolute;width:12px;height:12px;background:var(--tbg);border:1px solid var(--tline);transform:rotate(45deg)}
  #tw .tw-card .tw-k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tg);margin-bottom:6px;display:flex;justify-content:space-between;gap:8px}
  #tw .tw-card .tw-k i{font-style:normal;color:var(--tmu)}
  #tw .tw-card *{box-sizing:border-box}#tw .tw-card h3{display:block;text-transform:none;font-size:15px;font-weight:500;margin:0 0 6px;color:#fff;letter-spacing:0}
  #tw .tw-card.tw-modal h3{font-size:19px}
  #tw .tw-card p{display:block;font-size:13px;line-height:1.55;text-transform:none;letter-spacing:0;margin:0 0 12px;color:#c3ccc7}
  #tw .tw-card p b{color:#fff;font-weight:500}
  #tw .tw-card .tw-bar{height:2px;background:var(--tline);border-radius:2px;margin:0 0 12px;overflow:hidden}
  #tw .tw-card .tw-bar i{display:block;height:100%;background:var(--tg);transition:width .3s}
  #tw .tw-card .tw-ft{display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap}
  #tw .tw-card .tw-ft .tw-l,#tw .tw-card .tw-ft .tw-r{display:flex;gap:6px;align-items:center}
  #tw .tw-card button{font:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:8px 11px;cursor:pointer;border:1px solid var(--tline);background:none;color:#c3ccc7}
  #tw .tw-card button:hover{border-color:#4b5751;color:#fff}
  #tw .tw-card button:focus-visible{outline:2px solid var(--tg);outline-offset:2px}
  #tw .tw-card button.tw-go{background:var(--tg);color:#0a0c0b;border-color:var(--tg)}
  #tw .tw-card button.tw-link{border:none;padding:8px 4px;color:var(--tmu)}
  #tw .tw-card .tw-you{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--tg);display:flex;align-items:center;gap:7px}
  #tw .tw-card .tw-you::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--tg);animation:tw-dot 1.2s ease-in-out infinite}
  @keyframes tw-dot{50%{opacity:.25}}
  #tw .tw-card.tw-nudge{animation:tw-nudge .35s}
  @keyframes tw-nudge{25%{translate:-5px 0}75%{translate:5px 0}}
  #tw .tw-card .tw-lost{display:none;margin:-4px 0 10px;font-size:11px;color:#ffd18a}
  #tw .tw-card.tw-away .tw-lost{display:block}
  #tw-menu{position:fixed;left:16px;bottom:56px;z-index:2147483100;width:min(300px,calc(100vw - 32px));background:var(--tbg);border:1px solid var(--tline);border-radius:10px;padding:8px;font:12px/1.4 'Geist Mono',ui-monospace,monospace;color:var(--ttx);box-shadow:0 18px 50px rgba(0,0,0,.55)}
  #tw-menu .h{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tmu);padding:6px 8px}
  #tw-menu button{display:flex;width:100%;justify-content:space-between;gap:8px;font:inherit;text-align:left;color:var(--ttx);background:none;border:none;border-radius:6px;padding:9px 8px;cursor:pointer}
  #tw-menu button:hover,#tw-menu button:focus-visible{background:#18201c;outline:none}
  #tw-menu button em{font-style:normal;color:var(--tg)}
  @media (hover:none) and (pointer:coarse){#tw-menu{bottom:calc(124px + env(safe-area-inset-bottom))}}
  @media (prefers-reduced-motion: reduce){#tw .tw-hole,#tw .tw-card,#tw .tw-hole.tw-glide,#tw .tw-card.tw-glide{transition:none!important;animation:none!important}}
  @media (hover:none) and (pointer:coarse){.tw-kb{display:none}}
  .tw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ── the layer ── */
  let parked = false, dockTop = 0, stepT = 0, W, shade, hole, card, live, cur = null, el = null, raf = 0, token = 0, lastKey = '', hidden = false;
  function build(){
    W = document.createElement('div'); W.id = 'tw'; W.hidden = true;
    W.innerHTML = `<div class="tw-shade"></div><div class="tw-hole"></div>
      <div class="tw-card" role="dialog" aria-modal="false" aria-labelledby="tw-t" aria-describedby="tw-b"></div><div class="tw-sr" aria-live="polite"></div>`;
    document.body.appendChild(W);
    shade = $('.tw-shade', W); hole = $('.tw-hole', W); card = $('.tw-card', W); live = $('.tw-sr', W);
    card.addEventListener('click', onCard);
  }

  /* stray clicks: while a step is open only the card, the corner badge and (on "your turn" steps) the target
     take clicks. A guard on the document, not a layer, so the wheel and touch scrolling keep working. */
  function guard(e){
    if(!cur || !W || W.hidden || hidden) return;
    const t = e.target;
    if(card.contains(t) || (t.closest && t.closest('#demo-badge, #tw-menu, #demo-note'))) return;
    if(cur.kind === 'float') return;
    if(cur.act && el && el.contains(t)){ if(cur.park && e.type === 'click'){ parked = true; W.hidden = true; } return; }
    e.preventDefault(); e.stopImmediatePropagation(); if(e.type === 'click') nudge();
  }
  ['pointerdown', 'mousedown', 'click', 'dblclick'].forEach(ev => document.addEventListener(ev, guard, true));
  function nudge(){ card.classList.remove('tw-nudge'); void card.offsetWidth; card.classList.add('tw-nudge'); }
  const box = (b, x, y, w, h) => { if(w > 0 && h > 0) Object.assign(b.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', display: 'block' }); else b.style.display = 'none'; };

  function render(){
    const s = cur, list = inCh(s), k = list.indexOf(s) + 1, ch = CH[s.chi];
    const pct = Math.round(100 * (s.i + 1) / STEPS.length);
    const prev = STEPS[s.i - 1], canBack = prev && prev.ch === s.ch && !prev.act && !prev.kind && !s.act && !s.kind;
    const right = s.act
      ? `<span class="tw-you">Your turn</span><button class="tw-link" data-do>Do it for me</button>`
      : `${s.secondary ? `<button data-sec>${s.secondary}</button>` : ''}<button class="tw-go" data-next>${s.primary || 'Next'}</button>`;
    card.className = 'tw-card' + (s.kind === 'modal' ? ' tw-modal' : '');
    card.innerHTML = `<div class="tw-arrow" hidden></div><div class="tw-k"><span>${ch.name}</span><i>${k} / ${list.length}</i></div>
      <h3 id="tw-t">${s.title}</h3><p id="tw-b">${s.body}</p><div class="tw-lost">It scrolled out of view. <button class="tw-link" data-find>Show me</button></div>
      <div class="tw-bar"><i style="width:${pct}%"></i></div>
      <div class="tw-ft"><div class="tw-l">${canBack ? '<button data-back>Back</button>' : ''}${s.last ? '' : '<button class="tw-link" data-x>Skip tour</button>'}</div><div class="tw-r">${right}</div></div>`;
    live.textContent = `${ch.name}, step ${k} of ${list.length}. ${s.title}.`;
    W.classList.toggle('tw-act', !!s.act);
  }

  function onCard(e){
    const t = e.target.closest('button'); if(!t || !cur) return;
    if(t.hasAttribute('data-next')){ if(cur.onPrimary) cur.onPrimary(); if(!cur.until) next(); }
    else if(t.hasAttribute('data-sec')){ if(cur.onSecondary) cur.onSecondary(); else stop(true); }
    else if(t.hasAttribute('data-back')) go(cur.i - 1);
    else if(t.hasAttribute('data-x')) stop(false);
    else if(t.hasAttribute('data-do')){ if(cur.doIt) cur.doIt(); }
    else if(t.hasAttribute('data-find')){ if(el) el.scrollIntoView({ block: 'center', behavior: RM.matches ? 'auto' : 'smooth' }); }
  }

  function resolve(){ const s = cur; if(!s || !s.el) return null; try{ const x = typeof s.el === 'function' ? s.el() : $(s.el); return x && x.isConnected && x.getClientRects().length ? x : null; }catch(_){ return null; } }

  /* the card goes where it fits without touching the target: below, above, right, left, then the emptiest corner */
  function place(r, vw, vh){
    const G = 16, M = 12, pad = 8, full = Math.min(card.classList.contains('tw-modal') ? 440 : 360, vw - 24);
    const size = w => { card.style.width = w + 'px'; return [card.offsetWidth, card.offsetHeight]; };
    let [cw, chh] = size(full);
    if(!r && cur.kind === 'float'){
      [cw, chh] = size(Math.min(320, vw - 24));
      const c = cur.corner || 'bc', top = cur.top || 84;
      return { x: c === 'tr' ? vw - cw - M - 8 : (vw - cw) / 2, y: c === 'tr' ? top : vh - chh - 20, side: null };
    }
    if(!r) return { x: (vw - cw) / 2, y: Math.max(M, (vh - chh) / 2), side: null };
    const T = { l: r.left - pad, t: r.top - pad, r: r.right + pad, b: r.bottom + pad };
    const hits = (x, y, w, h) => !(x + w <= T.l || x >= T.r || y + h <= T.t || y >= T.b);
    const inside = (x, y, w, h) => x >= M - .5 && y >= M - .5 && x + w <= vw - M + .5 && y + h <= vh - M + .5;
    const clamp = (v, lo, hi) => Math.min(Math.max(lo, v), hi);
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const vertical = () => { for(const side of ['bottom', 'top']){
      const x = clamp(cx - cw / 2, M, vw - cw - M), y = side === 'bottom' ? T.b + G : T.t - G - chh;
      if(inside(x, y, cw, chh) && !hits(x, y, cw, chh)) return { x, y, side }; } return null; };
    const beside = () => { const room = { right: vw - M - (T.r + G), left: T.l - G - M };
      for(const side of ['right', 'left'].sort((a, b) => room[b] - room[a])){
        if(room[side] < 250) continue;
        const [w, h] = size(Math.min(full, room[side]));
        const x = side === 'right' ? T.r + G : T.l - G - w, y = clamp(cy - h / 2, M, vh - h - M);
        if(inside(x, y, w, h) && !hits(x, y, w, h)) return { x, y, side };
      } [cw, chh] = size(full); return null; };
    /* below or above at full width, or beside it (narrowed to fit); steps that talk about what is above go beside first */
    const got = cur.place === 'side' ? (beside() || vertical()) : (vertical() || beside());
    if(got) return got;
    [cw, chh] = size(full);
    /* a corner it doesn't touch, then the strip above or below it that has the most room */
    for(const c of [{ x: vw - cw - M, y: vh - chh - M }, { x: M, y: vh - chh - M }, { x: vw - cw - M, y: M }, { x: M, y: M }])
      if(!hits(c.x, c.y, cw, chh)) return { ...c, side: null };
    /* nothing fits (a tall section, a phone): dock to the bottom edge and let the highlight stop above the card */
    const [w, h] = size(vw - 2 * M);
    return { x: M, y: vh - h - M, side: null, dock: true };
  }

  function frame(){ raf = requestAnimationFrame(frame); tick(); }
  /* every frame, and on every scroll or resize too (some browsers slow frames down while scrolling) */
  function tick(){
    if(parked){ let ok = false; try{ ok = cur && cur.until(); }catch(_){} if(ok){ parked = false; W.hidden = false; advance(); } return; }
    if(!cur || hidden) return;
    if(cur.until){ let ok = false; try{ ok = cur.until(); }catch(_){} if(ok){ advance(); return; } }
    const vw = innerWidth, vh = innerHeight, modal = cur.kind === 'modal';
    if(cur.el){
      const x = resolve();
      if(x !== el){ el = x; if(el) reveal(el); }
      if(!el){ W.style.visibility = 'hidden'; return; }
    }
    W.style.visibility = '';
    let r = null, away = false;
    if(el){
      const b = el.getBoundingClientRect(); away = b.bottom < 8 || b.top > vh - 8;
      const top = Math.max(b.top, -20), bot = Math.min(b.bottom, vh + 20); r = { left: b.left, right: b.right, width: b.width, top, bottom: bot, height: bot - top };
    }
    if(away && Date.now() - stepT < 1400){ W.style.visibility = 'hidden'; return; }
    shade.style.opacity = modal || away ? 1 : 0;
    if(r && !away){ const p = 6, bottom = dockTop ? Math.min(r.bottom + p, dockTop - 10) : r.bottom + p; box(hole, r.left - p, r.top - p, r.width + p * 2, bottom - (r.top - p)); }
    else hole.style.display = 'none';
    card.classList.toggle('tw-away', away);
    const key = (r && !away ? [r.left, r.top, r.width, r.height].map(Math.round).join() : 'none') + '|' + vw + 'x' + vh + '|' + card.offsetHeight;
    if(key !== lastKey){
      lastKey = key;
      const pos = place(r && !away ? r : null, vw, vh);
      dockTop = pos.dock ? pos.y : 0;
      card.style.transform = `translate(${Math.round(pos.x)}px,${Math.round(pos.y)}px)`;
      const a = $('.tw-arrow', card);
      if(pos.side && r){
        a.hidden = false; const cw = card.offsetWidth, chh = card.offsetHeight;
        const ax = Math.min(Math.max(14, r.left + r.width / 2 - pos.x - 6), cw - 26), ay = Math.min(Math.max(14, r.top + r.height / 2 - pos.y - 6), chh - 26);
        a.removeAttribute('style');
        Object.assign(a.style, pos.side === 'bottom' ? { left: ax + 'px', top: '-7px', borderRight: 'none', borderBottom: 'none' } :
          pos.side === 'top' ? { left: ax + 'px', top: (chh - 6) + 'px', borderLeft: 'none', borderTop: 'none' } :
          pos.side === 'right' ? { left: '-7px', top: ay + 'px', borderRight: 'none', borderTop: 'none' } :
          { left: (cw - 6) + 'px', top: ay + 'px', borderLeft: 'none', borderBottom: 'none' });
      }else a.hidden = true;
      card.classList.add('tw-on');
    }
  }

  /* bring the target into view only when it isn't fully visible */
  function reveal(x){
    const fully = () => { const r = x.getBoundingClientRect(); return r.top >= 60 && r.bottom <= innerHeight - 60; };
    if(fully()) return;
    const r = x.getBoundingClientRect(), block = r.height > innerHeight * .55 ? 'start' : 'center';
    x.style.scrollMarginTop = '72px'; x.style.scrollMarginBottom = '24px';
    x.scrollIntoView({ block, inline: 'nearest', behavior: RM.matches || document.hidden ? 'auto' : 'smooth' });
    /* a smooth scroll can be dropped (background tab, another scroll in progress): make sure it landed */
    setTimeout(() => { if(x.isConnected && cur && el === x){ const b = x.getBoundingClientRect(); if(b.bottom < 40 || b.top > innerHeight - 40) x.scrollIntoView({ block, inline: 'nearest' }); } }, 900);
  }
  function glide(){ [hole, card].forEach(n => n.classList.add('tw-glide')); clearTimeout(glide.t); glide.t = setTimeout(() => [hole, card].forEach(n => n.classList.remove('tw-glide')), 420); }

  function markDone(ch){ const d = store.get(DONE, []); if(!d.includes(ch)) store.set(DONE, [...d, ch]); }
  async function go(i, opts = {}){
    const my = ++token;
    if(i < 0 || i >= STEPS.length){ stop(true); return; }
    const s = STEPS[i];
    if(!W) build();
    parked = false; W.hidden = false; hidden = true; cur = null; card.classList.remove('tw-on');
    if(opts.prep) await CH[s.chi].prep();
    if(my !== token) return;
    if(s.delay) await sleep(s.delay);
    if(my !== token) return;
    cur = s; el = null; lastKey = ''; dockTop = 0; stepT = Date.now();
    store.set(POS, i);
    if(s.start) s.start();
    render(); glide();
    if(s.el){ const x = await waitFor(resolve, s.act ? 8000 : 4000); if(my !== token) return; if(!x && !s.act){ next(); return; } }
    hidden = false;
    if(!raf) frame();
    if(!s.act){ const f = card.querySelector('[data-next]'); if(f) f.focus({ preventScroll: true }); }
  }
  async function advance(){
    const s = cur, my = token; cur = null;
    if(s.waitHide){ W.style.visibility = 'hidden'; await sleep(450); }
    if(my !== token) return;
    const n = STEPS[s.i + 1]; if(!n || n.ch !== s.ch) markDone(s.ch);
    go(s.i + 1);
  }
  function next(){
    if(!cur) return; const s = cur;
    const n = STEPS[s.i + 1]; if(!n || n.ch !== s.ch) markDone(s.ch);
    if(s.last){ stop(true); return; }
    go(s.i + 1);
  }
  function stop(finished){
    parked = false; token++; cur = null; el = null; cancelAnimationFrame(raf); raf = 0;
    if(W){ W.hidden = true; card.classList.remove('tw-on'); }
    store.set(SEEN, 1); if(finished) store.set(POS, 0);
    badgeLabel();
  }

  /* keys: demo.js registers this ahead of the panel's own, so Esc and the arrows reach the tour first */
  function key(e){
    if(!cur || !W || W.hidden || parked) return;
    if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); stop(false); return; }
    if(cur.act) return;
    if(e.key === 'ArrowRight' && !cur.until){ e.preventDefault(); e.stopImmediatePropagation(); next(); return; }
    if(e.key === 'ArrowLeft'){ const p = STEPS[cur.i - 1]; e.preventDefault(); e.stopImmediatePropagation(); if(p && p.ch === cur.ch && !p.act && !p.kind && !cur.kind) go(cur.i - 1); return; }
    if(e.key === 'Enter' && card.contains(document.activeElement)){ e.preventDefault(); e.stopImmediatePropagation(); document.activeElement.click(); return; }
    if(cur.kind === 'modal' && e.key !== 'Tab') e.stopImmediatePropagation();
  }
  window.__tourKey = key;
  addEventListener('resize', () => { lastKey = ''; tick(); });
  addEventListener('scroll', () => tick(), { capture: true, passive: true });
  setInterval(() => { if(cur && (!hidden || parked)) tick(); }, 250);

  /* ── the corner badge and the chapter menu ── */
  let menu = null, badgeBtn = null;
  const resumable = () => { const p = store.get(POS, 0); return p > 0 && p < STEPS.length - 1 ? p : 0; };
  function badgeLabel(){ if(badgeBtn) badgeBtn.textContent = resumable() ? 'Resume tour' : 'Tour'; }
  function closeMenu(){ if(menu){ menu.remove(); menu = null; } }
  function openMenu(){
    if(menu) return closeMenu();
    const done = store.get(DONE, []);
    menu = document.createElement('div'); menu.id = 'tw-menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = `<div class="h">Walkthrough</div>${resumable() ? '<button data-res role="menuitem">Resume where you left off <em>→</em></button>' : ''}
      ${CH.map((c, j) => `<button data-ch="${j}" role="menuitem">${String(j + 1).padStart(2, '0')} · ${c.name}<em>${done.includes(c.id) ? '✓' : ''}</em></button>`).join('')}`;
    menu.addEventListener('click', e => {
      const b = e.target.closest('button'); if(!b) return; closeMenu();
      if(b.hasAttribute('data-res')) go(resumable(), { prep: true });
      else { const j = +b.dataset.ch; go(STEPS.findIndex(s => s.chi === j && (j > 0 || s.i > 0)), { prep: true }); }
    });
    document.body.appendChild(menu); const f = menu.querySelector('button'); if(f) f.focus();
  }
  document.addEventListener('click', e => { if(menu && !menu.contains(e.target) && !(badgeBtn && badgeBtn.contains(e.target))) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if(menu && e.key === 'Escape'){ closeMenu(); e.stopPropagation(); } }, true);

  function badge(){
    const b = document.createElement('div'); b.id = 'demo-badge';
    b.innerHTML = `<span>Demo · invented data</span>${MAIN ? '<button data-tour aria-haspopup="menu">Tour</button>' : '<a href="index.html">← Jarvis</a>'}<button data-reset title="Bring the morning back">Reset</button>`;
    b.addEventListener('click', e => {
      if(e.target.closest('[data-tour]')) openMenu();
      if(e.target.closest('[data-reset]')){ store.set(POS, 0); store.set(DONE, []); window.jarvisDemoReset && window.jarvisDemoReset(); }
    });
    document.body.appendChild(b); badgeBtn = $('[data-tour]', b); badgeLabel();
  }

  window.jarvisTour = { state: () => ({ i: cur && cur.i, hidden, token, el: !!el, vis: W && W.style.visibility }), start: () => go(0, { prep: true }), go: i => go(i, { prep: true }), stop: () => stop(false), steps: STEPS, chapters: CH };

  function ready(){
    badge();
    if(!MAIN || store.get(SEEN, 0)) return;
    waitFor(() => $('#go') || $('#app .box'), 8000).then(() => setTimeout(() => go(0, { prep: true }), 500));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
