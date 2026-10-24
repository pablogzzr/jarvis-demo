/* Jarvis — public demo walkthrough.
   Every step has Next (Enter): it opens or closes whatever the step needs by itself, so the visitor never has
   to hunt for a button; clicking the highlighted thing works too. The highlight follows its target as the page
   scrolls, and the card goes where it never covers what it points at. The tour crosses pages (the panel,
   Study, Me) and picks up where it left off. Esc pauses; the badge's Tour button resumes or replays a chapter. */
(function(){
  'use strict';
  const PATH = location.pathname;
  const PAGE = /estudio(\.html)?$/.test(PATH) ? 'estudio' : /\/me(\.html)?$/.test(PATH) ? 'me' : /agentes/.test(PATH) ? 'agentes' : 'main';
  const FILE = { main: 'index.html', estudio: 'estudio.html', me: 'me.html' };
  const SEEN = 'jarvis-demo-tour-seen', POS = 'jarvis-demo-tour-pos', DONE = 'jarvis-demo-tour-done', HOP = 'jarvis-demo-tour-hop';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = (s, r) => (r || document).querySelector(s);
  const store = {
    get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(_){ return d; } },
    set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(_){} }
  };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function waitFor(fn, ms = 6000){ const t0 = Date.now(); for(;;){ let v; try{ v = fn(); }catch(_){} if(v) return v; if(Date.now() - t0 > ms) return null; await sleep(80); } }

  /* ── the panel, as the tour needs it ── */
  const P = {
    sheetOpen: () => !!$('#sheet.show'),
    sheetTitle: () => ($('#shTitle') || {}).textContent || '',
    started: () => !!$('#app .box.tier'),
    level: () => { const a = $('#app .box.tier.active'); const m = a && a.textContent.trim().match(/^0?(\d)/); return m ? +m[1] : 0; },
    brainOpen: () => !!(window.JarvisHUD && window.JarvisHUD.isOpen),
    firstRow: () => $('#sheet .row:not(.done):not(.handled)') || $('#sheet .row'),
    call: (name, ...a) => { try{ return typeof window[name] === 'function' ? window[name](...a) : undefined; }catch(_){} }
  };
  const SHEET = { prep: /prep/i, due: /due/i, commit: /promise/i, cold: /cold/i, people: /people/i, thinking: /learn/i, events: /event/i, world: /agent/i };
  const tileOf = sel => { const b = $(sel); return b && (b.closest('.tile') || b); };
  /* bring the panel to the state a step shows: start page or a level, with one side panel open or none */
  async function state({ level = null, sheet = null } = {}){
    if(PAGE !== 'main') return;
    if(P.brainOpen()) P.call('closeBrain');
    if(P.sheetOpen() && !(sheet && SHEET[sheet].test(P.sheetTitle()))){ P.call('closeSheet'); await waitFor(() => !P.sheetOpen(), 1500); }
    if(level === 0){ if(!$('#go')){ P.call('startPage'); await waitFor(() => $('#go'), 3000); } }
    else if(level){
      if(!P.started()){ const g = $('#go'); if(g) g.click(); await waitFor(P.started, 4000); }
      if(P.level() !== level){ const b = $(`#app [data-goto="${level}"]`); if(b) b.click(); await waitFor(() => P.level() === level, 3000); }
    }
    if(sheet && !P.sheetOpen()){
      if(sheet === 'world') P.call('openSheet', 'world', true);
      else { const b = $(`[data-panel="${sheet}"]`); if(b) b.click(); else P.call('openSheet', sheet, true); }
      await waitFor(P.sheetOpen, 2500); await sleep(250);
    }
  }
  const openSheetUntil = k => () => P.sheetOpen() && SHEET[k].test(P.sheetTitle());

  /* ── the tour ── */
  const CH = [
    { id: 'morning', name: 'Your morning' },
    { id: 'l1', name: 'Level 01 · Urgent + important' },
    { id: 'l2', name: 'Level 02 · Important' },
    { id: 'l3', name: 'Level 03 · Nice to have' },
    { id: 'agents', name: 'The agents' },
    { id: 'study', name: 'Study' },
    { id: 'me', name: 'Me' }
  ];
  const L = n => () => state({ level: n }), LS = (n, s) => () => state({ level: n, sheet: s });
  const row = () => P.firstRow();
  const STEPS = [
    { ch: 'morning', kind: 'modal', ensure: L(0), title: 'This is Jarvis',
      body: "Pablo González's AI chief of staff. Overnight, 36 agents read his mail, meetings, calendar and notes. In the morning this page shows him only what needs his judgment. Everything here is an invented week, and nothing you click is sent.",
      next: 'Take the tour', secondary: 'Explore on my own' },
    { ch: 'morning', ensure: L(0), el: '#app .tl', title: 'Only what is different today',
      body: 'One-off meetings, a birthday, a deadline. Routine classes and the gym stay off. Each line says who, why, and what to bring.' },
    { ch: 'morning', ensure: L(0), el: '#app .obj', title: 'Quarter → week → today',
      body: "The quarter's quests, this week's three objectives, and the one thing that makes today a win. Pablo writes these himself; the agents plan around them." },
    { ch: 'morning', ensure: L(0), el: () => { const g = $('#go'); return g && g.parentElement; }, title: 'Two ways in',
      body: '<b>Start with intro</b> plays the Jarvis boot sequence with Back in Black, sound on. <b>Next</b> goes straight to the run.',
      action: () => { const g = $('#go'); if(g) g.click(); }, until: () => P.level() === 1 && !P.brainOpen(), park: '#goIntro' },

    { ch: 'l1', ensure: L(1), el: '#app .box.tier.active', title: 'Level 01: what cannot wait',
      body: "The morning runs in three levels. This one holds only what can't slip today: meeting preps, class deadlines, and promises he owes. Let's open each one." },
    { ch: 'l1', ensure: L(1), el: () => tileOf('[data-panel="prep"]'), title: 'Meeting prep',
      body: 'Every meeting in the next three days, with a brief already written.', action: LS(1, 'prep'), until: openSheetUntil('prep') },
    { ch: 'l1', ensure: LS(1, 'prep'), el: row, place: 'side', margin: 200, title: 'A brief for every meeting',
      body: 'Written overnight: who they are, what they want, what to ask, the one outcome. Pablo marks it <b>Useful</b> or not, and the agents learn from both.' },
    { ch: 'l1', ensure: L(1), el: () => tileOf('[data-panel="due"]'), title: 'Due soon',
      body: 'Class deliverables due today or tomorrow, read from his course site, each with a link to the assignment.' },
    { ch: 'l1', ensure: L(1), el: () => tileOf('[data-panel="commit"]'), title: 'Promises and replies',
      body: 'What people are waiting on from him, what he promised, and what he is waiting on from others. Pulled from his mail, WhatsApp and meetings.' },

    { ch: 'l2', ensure: L(2), el: '#app .box.tier.active', title: 'Level 02: people',
      body: 'Who was who in yesterday\'s meetings, new people to remember, warm follow-ups, first messages to strangers, and LinkedIn.' },
    { ch: 'l2', ensure: L(2), el: () => tileOf('[data-panel="cold"]'), title: 'Cold outreach',
      body: 'An agent finds people worth meeting and drafts the first message.', action: LS(2, 'cold'), until: openSheetUntil('cold') },
    { ch: 'l2', ensure: LS(2, 'cold'), el: row, place: 'side', margin: 200, title: 'A first message, already drafted',
      body: 'Who they are, why now, and the note in his voice. Approving it leaves a draft in his mail. Pablo always presses Send himself.' },
    { ch: 'l2', ensure: L(2), el: () => tileOf('[data-panel="people"]'), title: 'New people',
      body: 'People he met this week who are not in his contacts yet. One tap adds them, with how they met.' },

    { ch: 'l3', ensure: L(3), el: '#app .box.tier.active', title: 'Level 03: getting better',
      body: 'Events worth going to, and everything to learn today: a lesson, his council, notes on how he communicated.' },
    { ch: 'l3', ensure: L(3), el: () => tileOf('[data-panel="thinking"]'), title: 'Everything to learn',
      body: 'Lessons, flashcards and coaching, in one panel.', action: LS(3, 'thinking'), until: openSheetUntil('thinking') },
    { ch: 'l3', ensure: LS(3, 'thinking'), el: row, place: 'side', margin: 200, title: 'The lesson of the day',
      body: 'Picked from books he read, for the problem he has today. If it helps, he marks it Useful.' },
    { ch: 'l3', ensure: L(3), el: () => tileOf('[data-panel="events"]'), title: 'Events',
      body: 'Talks and meetups in Boston that fit his goals, each with the reason it fits. Going or not, one tap.' },

    { ch: 'agents', ensure: () => state({}), el: '#agentsBtn', title: 'The agents behind it',
      body: '36 automatic jobs: 32 ran fine this morning, 4 need a look.', action: () => state({ sheet: 'world' }), until: openSheetUntil('world') },
    { ch: 'agents', ensure: () => state({ sheet: 'world' }), kind: 'float', corner: 'tr', top: 112, title: '36 agents, four goals',
      body: 'Grouped by the goal they serve: commitments, people, thinking, upkeep. Each one earns trust when Pablo accepts its work unedited. Click any agent to see what it does.' },
    { ch: 'agents', ensure: () => state({}), el: 'a[href*="estudio"]', title: 'Study',
      body: 'Next, the study room: the queue of things he wants to learn.' },

    { ch: 'study', page: 'estudio', el: '#room section.box.active', title: 'The next pick',
      body: "One thing to study now, chosen by what's urgent and important. A link, a paper or a video becomes a short note with the takeaway on top." },
    { ch: 'study', page: 'estudio', el: () => { const s = $('#room .sq'); return s && s.closest('section'); }, title: 'The queue',
      body: 'Everything waiting, sorted into four boxes by urgent and important.' },
    { ch: 'study', page: 'estudio', el: '#room aside section.box', title: 'Tracks',
      body: 'Longer paths he is working through, one concept at a time. What he learns turns into flashcards that come back on a schedule.' },

    { ch: 'me', page: 'me', el: '#app .read', title: 'The Sunday read',
      body: 'Every Sunday, three things the week\'s data says about where his time went, and one move for next week.' },
    { ch: 'me', page: 'me', el: '#app .hero', title: 'The numbers',
      body: 'Real hours on his projects against what the calendar planned, big blocks of focus, phone time, and how fast he answers.' },
    { ch: 'me', page: 'me', el: '#tabs', title: 'The Lab',
      body: 'Experiments on himself: sleep against the next day, meetings against focus. Only claims the data supports.' },
    { ch: 'me', page: 'me', kind: 'modal', title: "That's Jarvis",
      body: 'Replay any part from <b>Tour</b> in the corner, and <b>Reset</b> brings the morning back. Built by Pablo González with Claude.',
      next: 'Back to Jarvis', secondary: 'Stay here', onNext: () => { location.href = 'index.html'; }, last: true }
  ];
  STEPS.forEach((s, i) => { s.i = i; s.chi = CH.findIndex(c => c.id === s.ch); s.page = s.page || 'main'; });
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
  #tw .tw-hole{position:fixed;display:none;border-radius:10px;box-shadow:0 0 0 9999px rgba(3,5,4,.62);outline:2px solid var(--tg);pointer-events:none}
  #tw .tw-hole.tw-glide{transition:left .28s cubic-bezier(.2,.8,.2,1),top .28s cubic-bezier(.2,.8,.2,1),width .28s cubic-bezier(.2,.8,.2,1),height .28s cubic-bezier(.2,.8,.2,1)}
  #tw .tw-card{display:block;margin:0;text-align:left;text-transform:none;letter-spacing:0;box-sizing:border-box;position:fixed;left:0;top:0;width:min(360px,calc(100vw - 24px));pointer-events:auto;background:var(--tbg);border:1px solid var(--tline);border-radius:12px;padding:16px 16px 12px;color:var(--ttx);font:13px/1.55 'Geist Mono',ui-monospace,monospace;box-shadow:0 18px 50px rgba(0,0,0,.55);will-change:transform;opacity:0;transition:opacity .18s}
  #tw .tw-card.tw-on{opacity:1}
  #tw .tw-card.tw-glide{transition:opacity .18s,transform .28s cubic-bezier(.2,.8,.2,1)}
  #tw .tw-card.tw-modal{padding:22px 22px 16px}
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
  #tw .tw-card button{font:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:8px 11px;cursor:pointer;border:1px solid var(--tline);background:none;color:#c3ccc7;display:inline-flex;align-items:center;gap:8px}
  #tw .tw-card button:hover{border-color:#4b5751;color:#fff}
  #tw .tw-card button:focus-visible{outline:2px solid var(--tg);outline-offset:2px}
  #tw .tw-card button.tw-go{background:var(--tg);color:#0a0c0b;border-color:var(--tg)}
  #tw .tw-card button.tw-link{border:none;padding:8px 4px;color:var(--tmu)}
  #tw .tw-card button kbd{font:inherit;font-size:10px;border:1px solid rgba(0,0,0,.28);border-radius:3px;padding:0 4px;line-height:15px}
  #tw .tw-card.tw-nudge{animation:tw-nudge .35s}
  @keyframes tw-nudge{25%{translate:-5px 0}75%{translate:5px 0}}
  #tw .tw-card .tw-lost{display:none;margin:-4px 0 10px;font-size:11px;color:#ffd18a}
  #tw .tw-card.tw-away .tw-lost{display:block}
  #tw-menu{position:fixed;left:16px;bottom:56px;z-index:2147483100;width:min(300px,calc(100vw - 32px));background:var(--tbg);border:1px solid var(--tline);border-radius:10px;padding:8px;font:12px/1.4 'Geist Mono',ui-monospace,monospace;color:var(--ttx);box-shadow:0 18px 50px rgba(0,0,0,.55)}
  #tw-menu .h{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tmu);padding:6px 8px}
  #tw-menu button{display:flex;width:100%;justify-content:space-between;gap:8px;font:inherit;text-align:left;color:var(--ttx);background:none;border:none;border-radius:6px;padding:9px 8px;cursor:pointer}
  #tw-menu button:hover,#tw-menu button:focus-visible{background:#18201c;outline:none}
  #tw-menu button em{font-style:normal;color:var(--tg)}
  @media (hover:none) and (pointer:coarse){#tw-menu{bottom:calc(124px + env(safe-area-inset-bottom))}.tw-kb,#tw .tw-card button kbd{display:none}}
  @media (prefers-reduced-motion: reduce){#tw .tw-hole,#tw .tw-card,#tw .tw-hole.tw-glide,#tw .tw-card.tw-glide{transition:none!important;animation:none!important}}
  .tw-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ── the layer ── */
  let W, shade, hole, card, live, cur = null, el = null, raf = 0, token = 0, lastKey = '', hidden = false, parked = false, dockTop = 0, stepT = 0, busy = false;
  function build(){
    W = document.createElement('div'); W.id = 'tw'; W.hidden = true;
    W.innerHTML = `<div class="tw-shade"></div><div class="tw-hole"></div>
      <div class="tw-card" role="dialog" aria-modal="false" aria-labelledby="tw-t" aria-describedby="tw-b"></div><div class="tw-sr" aria-live="polite"></div>`;
    document.body.appendChild(W);
    shade = $('.tw-shade', W); hole = $('.tw-hole', W); card = $('.tw-card', W); live = $('.tw-sr', W);
    card.addEventListener('click', onCard);
  }
  function nudge(){ card.classList.remove('tw-nudge'); void card.offsetWidth; card.classList.add('tw-nudge'); }
  const box = (b, x, y, w, h) => { if(w > 0 && h > 0) Object.assign(b.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px', display: 'block' }); else b.style.display = 'none'; };

  /* stray clicks: while a step is open, the card, the corner badge and the highlighted thing take clicks;
     anything else just nudges the card. A guard on the document, not a layer, so scrolling keeps working. */
  function guard(e){
    if(!cur || !W || W.hidden || hidden || parked) return;
    const t = e.target;
    if(card.contains(t) || (t.closest && t.closest('#demo-badge, #tw-menu, #demo-note'))) return;
    if(cur.kind === 'float') return;
    if(el && el.contains(t)){ if(cur.park && t.closest && t.closest(cur.park) && e.type === 'click'){ parked = true; W.hidden = true; } return; }
    e.preventDefault(); e.stopImmediatePropagation(); if(e.type === 'click') nudge();
  }
  ['pointerdown', 'mousedown', 'click', 'dblclick'].forEach(ev => document.addEventListener(ev, guard, true));

  function render(){
    const s = cur, list = inCh(s), k = list.indexOf(s) + 1, ch = CH[s.chi];
    const pct = Math.round(100 * (s.i + 1) / STEPS.length);
    const prev = STEPS[s.i - 1], canBack = prev && prev.page === PAGE && s.kind !== 'modal';
    card.className = 'tw-card' + (s.kind === 'modal' ? ' tw-modal' : '');
    card.innerHTML = `<div class="tw-arrow" hidden></div><div class="tw-k"><span>${ch.name}</span><i>${k} / ${list.length}</i></div>
      <h3 id="tw-t">${s.title}</h3><p id="tw-b">${s.body}</p><div class="tw-lost">It scrolled out of view. <button class="tw-link" data-find>Show me</button></div>
      <div class="tw-bar"><i style="width:${pct}%"></i></div>
      <div class="tw-ft"><div class="tw-l">${canBack ? '<button data-back>Back</button>' : ''}${s.last || s.secondary ? '' : '<button class="tw-link" data-x>Skip tour</button>'}</div>
      <div class="tw-r">${s.secondary ? `<button data-sec>${s.secondary}</button>` : ''}<button class="tw-go" data-next>${s.next || 'Next'} <kbd>↵</kbd></button></div></div>`;
    live.textContent = `${ch.name}, step ${k} of ${list.length}. ${s.title}.`;
  }

  function onCard(e){
    const t = e.target.closest('button'); if(!t || !cur) return;
    if(t.hasAttribute('data-next')) next();
    else if(t.hasAttribute('data-sec')){ if(cur.onSecondary) cur.onSecondary(); else stop(true); }
    else if(t.hasAttribute('data-back')) go(cur.i - 1);
    else if(t.hasAttribute('data-x')) stop(false);
    else if(t.hasAttribute('data-find')){ if(el) el.scrollIntoView({ block: 'center', behavior: RM.matches ? 'auto' : 'smooth' }); }
  }

  function resolve(){ const s = cur; if(!s || !s.el) return null; try{ const x = typeof s.el === 'function' ? s.el() : $(s.el); return x && x.isConnected && x.getClientRects().length ? x : null; }catch(_){ return null; } }

  /* the card goes where it never touches the target: below or above, beside it (narrowed to fit), a free
     corner; when nothing fits (a tall section, a phone) it docks to the bottom and the highlight stops above it */
  function place(r, vw, vh){
    const G = 16, M = 12, pad = 8, full = Math.min(cur.kind === 'modal' ? 440 : 360, vw - 24);
    const size = w => { card.style.width = w + 'px'; return [card.offsetWidth, card.offsetHeight]; };
    let [cw, chh] = size(full);
    if(!r && cur.kind === 'float'){
      [cw, chh] = size(Math.min(320, vw - 24));
      return { x: cur.corner === 'tr' ? vw - cw - M - 8 : (vw - cw) / 2, y: cur.corner === 'tr' ? (cur.top || 84) : vh - chh - 20, side: null };
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
    const got = cur.place === 'side' ? (beside() || vertical()) : (vertical() || beside());
    if(got) return got;
    for(const c of [{ x: vw - cw - M, y: vh - chh - M }, { x: M, y: vh - chh - M }, { x: vw - cw - M, y: M }, { x: M, y: M }])
      if(!hits(c.x, c.y, cw, chh)) return { ...c, side: null };
    const [, h] = size(vw - 2 * M);
    return { x: M, y: vh - h - M, side: null, dock: true };
  }

  function frame(){ raf = requestAnimationFrame(frame); tick(); }
  /* every frame, and on every scroll or resize too (some browsers slow frames down while scrolling) */
  function tick(){
    if(parked){ let ok = false; try{ ok = cur && cur.until(); }catch(_){} if(ok){ parked = false; W.hidden = false; advance(); } return; }
    if(!cur || hidden) return;
    if(cur.until && !busy){ let ok = false; try{ ok = cur.until(); }catch(_){} if(ok){ advance(); return; } }
    const vw = innerWidth, vh = innerHeight, modal = cur.kind === 'modal';
    if(cur.el){
      const x = resolve();
      if(x !== el){ el = x; if(el) reveal(el); }
      if(!el){ W.style.visibility = 'hidden'; return; }
    }
    let r = null, away = false;
    if(el){
      const b = el.getBoundingClientRect(); away = b.bottom < 8 || b.top > vh - 8;
      const top = Math.max(b.top, -20), bot = Math.min(b.bottom, vh + 20); r = { left: b.left, right: b.right, width: b.width, top, bottom: bot, height: bot - top };
    }
    if(away && Date.now() - stepT < 1400){ W.style.visibility = 'hidden'; return; }
    W.style.visibility = '';
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

  /* bring the target into view only when it isn't; a tall one is shown from its top (below any panel header) */
  function reveal(x){
    const m = cur.margin || 72, fully = () => { const r = x.getBoundingClientRect(); return r.top >= Math.min(m, 60) && r.bottom <= innerHeight - 40; };
    if(fully()) return;
    const r = x.getBoundingClientRect(), block = r.height > innerHeight * .55 ? 'start' : 'center';
    x.style.scrollMarginTop = m + 'px'; x.style.scrollMarginBottom = '24px';
    x.scrollIntoView({ block, inline: 'nearest', behavior: RM.matches || document.hidden ? 'auto' : 'smooth' });
    setTimeout(() => { if(x.isConnected && cur && el === x){ const b = x.getBoundingClientRect(); if(b.bottom < 40 || b.top > innerHeight - 40) x.scrollIntoView({ block, inline: 'nearest' }); } }, 900);
  }
  function glide(){ [hole, card].forEach(n => n.classList.add('tw-glide')); clearTimeout(glide.t); glide.t = setTimeout(() => [hole, card].forEach(n => n.classList.remove('tw-glide')), 420); }

  function markDone(ch){ const d = store.get(DONE, []); if(!d.includes(ch)) store.set(DONE, [...d, ch]); }
  async function go(i, dir = 1){
    const my = ++token;
    if(i < 0 || i >= STEPS.length){ stop(true); return; }
    const s = STEPS[i];
    store.set(POS, i);
    if(s.page !== PAGE){ try{ sessionStorage.setItem(HOP, String(i)); }catch(_){} location.href = FILE[s.page] || 'index.html'; return; }
    if(!W) build();
    parked = false; busy = false; W.hidden = false; hidden = true; cur = null; card.classList.remove('tw-on'); W.style.visibility = 'hidden';
    if(s.ensure) await s.ensure();
    if(my !== token) return;
    cur = s; el = null; lastKey = ''; dockTop = 0; stepT = Date.now();
    render(); glide();
    if(s.el){ const x = await waitFor(resolve, 4000); if(my !== token) return; if(!x){ go(i + dir, dir); return; } }
    hidden = false;
    if(!raf) frame();
    tick();
    const f = card.querySelector('[data-next]'); if(f) f.focus({ preventScroll: true });
  }
  /* the visitor did the step themselves (opened the panel, started the run): move on */
  async function advance(){
    const s = cur, my = token; cur = null;
    await sleep(350); if(my !== token) return;
    const n = STEPS[s.i + 1]; if(!n || n.ch !== s.ch) markDone(s.ch);
    go(s.i + 1);
  }
  /* Next: do what the step needs (open a panel, start the run), then move on */
  async function next(){
    if(!cur || busy) return; const s = cur;
    const n = STEPS[s.i + 1]; if(!n || n.ch !== s.ch) markDone(s.ch);
    if(s.onNext){ stop(true); s.onNext(); return; }
    if(s.last){ stop(true); return; }
    if(s.action){ busy = true; W.style.visibility = 'hidden'; try{ await s.action(); }catch(_){} busy = false; if(cur !== s) return; }
    go(s.i + 1);
  }
  function stop(finished){
    parked = false; token++; cur = null; el = null; cancelAnimationFrame(raf); raf = 0;
    if(W){ W.hidden = true; card.classList.remove('tw-on'); }
    store.set(SEEN, 1); if(finished) store.set(POS, 0);
    badgeLabel();
  }

  /* keys: demo.js registers this ahead of the panel's own, so Esc, Enter and the arrows reach the tour first */
  function key(e){
    if(!cur || !W || W.hidden || parked) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement || {}).tagName || '') && !card.contains(document.activeElement);
    if(e.key === 'Escape'){ e.preventDefault(); e.stopImmediatePropagation(); stop(false); return; }
    if(typing) return;
    if(e.key === 'Enter' || e.key === 'ArrowRight'){
      e.preventDefault(); e.stopImmediatePropagation();
      const a = document.activeElement; if(e.key === 'Enter' && a && card.contains(a) && a.tagName === 'BUTTON' && !a.hasAttribute('data-next')) a.click(); else next();
      return;
    }
    if(e.key === 'ArrowLeft'){ e.preventDefault(); e.stopImmediatePropagation(); const p = STEPS[cur.i - 1]; if(p && p.page === PAGE && cur.kind !== 'modal') go(cur.i - 1, -1); return; }
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
      if(b.hasAttribute('data-res')) go(resumable());
      else { const j = +b.dataset.ch; go(STEPS.findIndex(s => s.chi === j && (j > 0 || s.i > 0))); }
    });
    document.body.appendChild(menu); const f = menu.querySelector('button'); if(f) f.focus();
  }
  document.addEventListener('click', e => { if(menu && !menu.contains(e.target) && !(badgeBtn && badgeBtn.contains(e.target))) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if(menu && e.key === 'Escape'){ closeMenu(); e.stopPropagation(); } }, true);

  function badge(){
    const b = document.createElement('div'); b.id = 'demo-badge';
    b.innerHTML = `<span>Demo · invented data</span><button data-tour aria-haspopup="menu">Tour</button>${PAGE === 'main' ? '' : '<a href="index.html">← Jarvis</a>'}<button data-reset title="Bring the morning back">Reset</button>`;
    b.addEventListener('click', e => {
      if(e.target.closest('[data-tour]')) openMenu();
      if(e.target.closest('[data-reset]')){ store.set(POS, 0); store.set(DONE, []); if(PAGE === 'main' && window.jarvisDemoReset) window.jarvisDemoReset(); else { try{ sessionStorage.removeItem('jarvis-demo-state-v1'); }catch(_){} location.href = 'index.html'; } }
    });
    document.body.appendChild(b); badgeBtn = $('[data-tour]', b); badgeLabel();
  }

  window.jarvisTour = { state: () => ({ i: cur && cur.i, hidden, parked, el: !!el }), start: () => go(0), go: i => go(i), stop: () => stop(false), steps: STEPS, chapters: CH };

  function ready(){
    badge();
    let hop = null; try{ hop = sessionStorage.getItem(HOP); sessionStorage.removeItem(HOP); }catch(_){}
    const ready0 = () => waitFor(() => PAGE === 'main' ? ($('#go') || $('#app .box')) : PAGE === 'estudio' ? $('#room section') : $('#app .read, #app .hero'), 8000);
    if(hop != null){ ready0().then(() => setTimeout(() => go(+hop), 300)); return; }
    if(PAGE !== 'main' || store.get(SEEN, 0)) return;
    ready0().then(() => setTimeout(() => go(0), 500));
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
