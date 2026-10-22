/* Jarvis — public demo walkthrough: a badge on every page and a short guided tour on the main one. */
(function(){
  'use strict';
  const MAIN = !!document.getElementById('app');
  const SEEN = 'jarvis-demo-tour-seen';

  const css = `
  #demo-badge{position:fixed;left:16px;bottom:16px;z-index:9998;display:flex;gap:6px;align-items:center;font:500 11px/1 'Geist Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
  #demo-badge span{color:#0a0c0b;background:#5EE6B0;padding:7px 9px;border-radius:6px}
  #demo-badge button,#demo-badge a{font:inherit;color:#e8ece9;background:rgba(18,22,20,.92);border:1px solid #2c3430;border-radius:6px;padding:6px 9px;cursor:pointer;text-decoration:none}
  #demo-badge button:hover,#demo-badge a:hover{border-color:#5EE6B0;color:#5EE6B0}
  @media (hover:none) and (pointer:coarse){#demo-badge{bottom:calc(84px + env(safe-area-inset-bottom));left:12px}}
  #demo-note{position:fixed;left:50%;bottom:70px;transform:translate(-50%,12px);opacity:0;transition:.25s;z-index:9999;max-width:min(520px,calc(100vw - 32px));font:12px/1.5 'Geist Mono',ui-monospace,monospace;color:#e8ece9;background:#121614;border:1px solid #5EE6B0;border-radius:8px;padding:10px 14px;pointer-events:none}
  #demo-note.show{opacity:1;transform:translate(-50%,0)}
  #tour-hole{position:fixed;z-index:10000;border-radius:10px;box-shadow:0 0 0 9999px rgba(4,6,5,.72),0 0 0 2px #5EE6B0;transition:all .35s cubic-bezier(.2,.8,.2,1);pointer-events:none}
  #tour-card{position:fixed;z-index:10001;width:min(380px,calc(100vw - 32px));background:#101412;border:1px solid #2c3430;border-radius:12px;padding:18px 18px 14px;color:#e8ece9;font:13px/1.6 'Geist Mono',ui-monospace,monospace;box-shadow:0 20px 60px rgba(0,0,0,.5);transition:top .35s,left .35s}
  #tour-card .k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#5EE6B0;margin-bottom:6px}
  #tour-card h3{font-size:16px;font-weight:500;margin:0 0 8px;color:#fff}
  #tour-card p{margin:0 0 12px;color:#b9c2bd}
  #tour-card .trow{display:flex;gap:8px;justify-content:space-between;align-items:center}
  #tour-card button{font:inherit;font-size:11px;letter-spacing:.08em;text-transform:uppercase;border-radius:6px;padding:8px 12px;cursor:pointer;border:1px solid #2c3430;background:none;color:#b9c2bd}
  #tour-card button.go{background:#5EE6B0;color:#0a0c0b;border-color:#5EE6B0}
  #tour-card .dots{display:flex;gap:4px}#tour-card .dots i{width:6px;height:6px;border-radius:3px;background:#2c3430}#tour-card .dots i.on{background:#5EE6B0}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const STEPS = [
    { t: 'Welcome', h: 'This is Jarvis', p: "Pablo González's personal AI chief of staff. Every night a set of agents reads his mail, meetings, calendar, tasks and notes, and every morning this page shows him only what needs his judgment. Everything you see here is an invented week, so click anything: nothing is sent and nothing is saved." },
    { sel: '.hello h1', t: 'Morning', h: 'One page, every morning', p: 'Pablo opens this with coffee. The dots under the greeting are the mornings he finished it. The goal is to get to "Morning complete" in about fifteen minutes.' },
    { sel: '#app .tl', t: 'Today', h: 'Your day, already briefed', p: "Overnight an agent reads the calendar, mail and tasks and writes the day the way a good chief of staff would: who each meeting is with, what they want, what to bring. Birthdays and deadlines included." },
    { sel: '#app .obj', t: 'Goals', h: 'Quarter, week, today', p: "The quarter's quests, the week's three objectives, and the one thing that would make today a win. Pablo writes these himself; the agents plan around them." },
    { sel: '#go', t: 'Decide', h: 'Start the run', p: 'This walks through everything the agents drafted overnight, one level at a time: meeting preps, follow-ups, promises, a lesson, coach notes. ✓ approves, ✕ drops it, and the agents learn from both. Try it after the tour; Z undoes.' },
    { sel: '#agentsBtn', t: 'Agents', h: 'The agents behind it', p: 'About fifty agents grouped into orchestrators: Commitments, People, Thinking, Maintenance. Each one has a trust score that rises when Pablo accepts its work without edits.' },
    { sel: '[data-brain]', t: 'Brain', h: 'The second brain', p: 'Every note lives in plain text in four folders: Projects, Areas, Resources, Archive. This opens a 3D map of the notes and the links between them.' },
    { sel: 'a[href*="estudio"]', t: 'Study', h: 'The study room', p: 'Things he wants to learn: links, papers, videos, each reduced to a short note with the takeaway, plus flashcards that come back on a spaced schedule.' },
    { sel: 'a[href*="me.html"]', t: 'Me', h: 'Where the week went', p: "His time by project, checked against what he said his focus was. The signal to watch is the gap between the declared focus and the real calendar." },
    { t: 'Keyboard', h: 'Everything is one key away', p: 'Press ⌘K (Ctrl K) for every command, ? for shortcuts, G then a letter to jump (G B brain, G S study, G M me). On a phone, use the bar at the bottom.' },
    { t: 'Your turn', h: 'Click around', p: 'Approve a few rows, open the agents, fly through the brain. "Reset" in the bottom-left corner brings the morning back. Built by Pablo González with Claude.' }
  ];

  let i = 0, hole, card;
  function place(){
    const s = STEPS[i], el = s.sel && [...document.querySelectorAll(s.sel)].find(e => e.getBoundingClientRect().width > 0);
    const vw = innerWidth, vh = innerHeight;
    if(el){
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const r = el.getBoundingClientRect(), pad = 8;
      Object.assign(hole.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + pad * 2 + 'px', height: Math.min(r.height, vh * .6) + pad * 2 + 'px', opacity: 1 });
      const cw = card.offsetWidth, ch = card.offsetHeight;
      let top = r.bottom + 18; if(top + ch > vh - 16) top = Math.max(16, r.top - ch - 18);
      if(top + ch > vh - 16) top = vh - ch - 16;
      card.style.top = top + 'px'; card.style.left = Math.min(Math.max(16, r.left), vw - cw - 16) + 'px';
    }else{
      Object.assign(hole.style, { left: vw / 2 + 'px', top: vh / 2 + 'px', width: '0px', height: '0px' });
      card.style.top = Math.max(16, vh / 2 - card.offsetHeight / 2) + 'px'; card.style.left = (vw - card.offsetWidth) / 2 + 'px';
    }
  }
  function draw(){
    const s = STEPS[i];
    card.innerHTML = `<div class="k">${s.t} · ${i + 1} of ${STEPS.length}</div><h3>${s.h}</h3><p>${s.p}</p>
      <div class="trow"><button data-x>${i === STEPS.length - 1 ? 'Close' : 'Skip'}</button><div class="dots">${STEPS.map((_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
      <span>${i ? '<button data-b>Back</button> ' : ''}<button class="go" data-n>${i === STEPS.length - 1 ? 'Start' : 'Next'}</button></span></div>`;
    place();
  }
  function stop(){ hole && hole.remove(); card && card.remove(); hole = card = null; window.__tourKey = null; try{ localStorage.setItem(SEEN, '1'); }catch(_){} }
  function key(e){
    if(e.key === 'Escape'){ e.stopImmediatePropagation(); e.preventDefault(); stop(); }
    else if(e.key === 'ArrowRight' || e.key === 'Enter'){ e.stopImmediatePropagation(); e.preventDefault(); next(); }
    else if(e.key === 'ArrowLeft'){ e.stopImmediatePropagation(); e.preventDefault(); if(i){ i--; draw(); } }
    else e.stopImmediatePropagation();
  }
  function next(){ if(i < STEPS.length - 1){ i++; draw(); } else stop(); }
  function start(){
    if(card) return; i = 0;
    hole = document.createElement('div'); hole.id = 'tour-hole';
    card = document.createElement('div'); card.id = 'tour-card'; card.setAttribute('role', 'dialog');
    document.body.append(hole, card);
    card.addEventListener('click', e => { if(e.target.closest('[data-n]')) next(); else if(e.target.closest('[data-b]')){ i--; draw(); } else if(e.target.closest('[data-x]')) stop(); });
    window.__tourKey = key;
    draw();
  }
  addEventListener('resize', () => card && place());
  window.jarvisTour = start;

  function badge(){
    const b = document.createElement('div'); b.id = 'demo-badge';
    b.innerHTML = `<span>Demo · invented data</span>${MAIN ? '<button data-tour>Tour</button>' : '<a href="index.html">← Jarvis</a>'}<button data-reset>Reset</button>`;
    b.addEventListener('click', e => { if(e.target.closest('[data-tour]')) start(); if(e.target.closest('[data-reset]')) window.jarvisDemoReset && window.jarvisDemoReset(); });
    document.body.appendChild(b);
  }
  function ready(){
    badge();
    if(!MAIN) return;
    let seen = false; try{ seen = !!localStorage.getItem(SEEN); }catch(_){}
    if(seen) return;
    /* wait for the board to draw (it reads its data first) */
    const t0 = Date.now(), iv = setInterval(() => {
      if(document.querySelector('#go, #app .box') || Date.now() - t0 > 6000){ clearInterval(iv); setTimeout(start, 600); }
    }, 200);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
