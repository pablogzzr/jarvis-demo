 
(function(){
const RM=new URLSearchParams(location.search).get('motion')==='reduce'?{matches:true}:matchMedia('(prefers-reduced-motion: reduce)');
const COL=['#FF8A3D','#5EE6B0','#5AB8FF','#B49CFF'];
const REG=[['Prefrontal','Projects'],['Cortex','Areas'],['Hippocampus','Resources'],['Cerebellum','Archive']];
const LOBE=[[0,.15,1.15],[0,1.05,.05],[0,.05,-1.1],[0,-.95,-.55]];
const ORCH=[['People','#5AB8FF'],['Commitments','#FF8A3D'],['Thinking','#B49CFF'],['Upkeep','#5EE6B0']];
let AG=[], EVENTS=[];    
const OBS=p=>'obsidian://open?vault='+encodeURIComponent('Second Brain')+'&file='+encodeURIComponent(p);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0)/4294967295; }
function rnd(seed){ let x=Math.floor(seed*1e9)||1; return ()=>{ x^=x<<13; x^=x>>>17; x^=x<<5; return ((x>>>0)%1e6)/1e6; }; }
const gauss=r=>(r()+r()+r()-1.5)/1.5;
let DATA=null; const getData=()=>DATA||(DATA=fetch('/api/cerebro').then(r=>{ if(!r.ok) throw new Error(r.status===404?'the map is built with the next hourly backup':r.status); return r.json(); }).catch(e=>{ DATA=null; throw e; }));
const CSS=`
#hud{position:fixed;inset:0;z-index:60;background:#020508;color:#CFE6FF;font-family:'Geist Mono',ui-monospace,monospace;overflow:hidden;-webkit-font-smoothing:antialiased;transition:opacity .6s}
#hud.out{opacity:0}#hud.intro{cursor:pointer}
#hud canvas{position:absolute;inset:0;width:100%;height:100%;display:block}#hud canvas.fx{pointer-events:none;z-index:2}
#hud .scan{position:absolute;inset:0;pointer-events:none;z-index:3;background:repeating-linear-gradient(0deg,rgba(255,255,255,.022) 0 1px,transparent 1px 3px)}
#hud .sweep{position:absolute;left:0;right:0;height:140px;top:-140px;pointer-events:none;z-index:3;background:linear-gradient(180deg,transparent,rgba(63,200,255,.07),transparent);animation:hS 4s linear infinite}
@keyframes hS{to{top:100%}}
#hud .flash{position:absolute;inset:0;background:#E8FBFF;opacity:0;pointer-events:none;z-index:9;transition:opacity .35s}
#hud .w{position:absolute;z-index:4;opacity:0;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
#hud .w.on{opacity:1;animation:hOn .5s steps(1,end)}
#hud .w.on.fromL{animation:hOn .5s steps(1,end),hL .7s cubic-bezier(.2,1,.3,1)}#hud .w.on.fromR{animation:hOn .5s steps(1,end),hR .7s cubic-bezier(.2,1,.3,1)}
@keyframes hOn{0%{opacity:0}12%{opacity:1}22%{opacity:.15}36%{opacity:1}46%{opacity:.4}60%,100%{opacity:1}}
@keyframes hL{from{transform:translateX(-36px)}}@keyframes hR{from{transform:translateX(36px)}}
#hud .box{border:1px solid rgba(110,200,255,.22);background:linear-gradient(180deg,rgba(8,20,34,.84),rgba(4,10,18,.72));padding:10px 12px;backdrop-filter:blur(3px)}
#hud .box::before{content:"";position:absolute;top:-1px;left:-1px;width:10px;height:10px;border-top:1px solid #9FE6FF;border-left:1px solid #9FE6FF}
#hud .box::after{content:"";position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-bottom:1px solid #9FE6FF;border-right:1px solid #9FE6FF}
#hud h4{font-weight:400;color:#fff;display:flex;justify-content:space-between;margin:0 0 8px;font-size:10px;letter-spacing:.16em}#hud h4 small{color:#58728A;font-size:9px}
#hud .kv{display:flex;justify-content:space-between;padding:2px 0}#hud .kv b{color:#fff;font-weight:500;font-variant-numeric:tabular-nums}
#hud .title{top:2.6vh;left:50%;transform:translateX(-50%);font-size:clamp(17px,2vw,26px);letter-spacing:.6em;color:#fff;text-shadow:0 0 18px #3FC8FF,0 0 40px rgba(63,200,255,.45);white-space:nowrap}
#hud .title.on{animation:hOn .5s steps(1,end),hG 2.6s steps(1,end) .6s infinite}
@keyframes hG{0%,93%,100%{text-shadow:0 0 18px #3FC8FF}94%{text-shadow:3px 0 #FF4FD8,-3px 0 #3FC8FF}96%{text-shadow:-2px 0 #FF4FD8,2px 0 #5EE6B0}}
#hud .sub{top:calc(2.6vh + 34px);left:50%;transform:translateX(-50%);color:#4F8FB0;letter-spacing:.3em;font-size:9px;white-space:nowrap}
#hud .sub b{color:#5EE6B0;font-weight:400}#hud .sub b::before{content:"● ";animation:hB 1.6s infinite}@keyframes hB{50%{opacity:.2}}
#hud .search{top:calc(2.6vh + 58px);left:50%;transform:translateX(-50%);width:min(420px,40vw)}
#hud .search input{width:100%;background:rgba(4,12,22,.85);border:1px solid rgba(110,200,255,.5);color:#fff;font:inherit;font-size:11px;letter-spacing:.06em;padding:7px 12px;outline:none;text-transform:none}
#hud .search input:focus{border-color:#9FE6FF;box-shadow:0 0 18px rgba(63,200,255,.25)}
#hud .loc{top:228px;left:28px;width:250px;display:flex;justify-content:space-between;color:#58728A}#hud .loc b{color:#9FE6FF;font-weight:400}
#hud .stats{top:256px;left:28px;width:250px}
#hud .agents{top:418px;left:28px;width:250px;bottom:190px;overflow:auto}
#hud .ag{display:grid;grid-template-columns:8px 1fr 60px 22px;gap:7px;align-items:center;padding:2px 0;font-size:9.5px}
#hud .ag i{width:6px;height:6px;border-radius:50%;background:var(--c);box-shadow:0 0 6px var(--c)}#hud .ag i.bad{animation:hB 1s infinite}
#hud .ag .bar{height:3px;background:rgba(110,200,255,.12);position:relative}#hud .ag .bar u{position:absolute;inset:0 auto 0 0;background:var(--c)}
#hud .ag em{font-style:normal;color:#58728A;text-align:right}#hud .og{color:#58728A;font-size:9px;margin:6px 0 2px;letter-spacing:.18em}
#hud .clock{top:24px;right:28px;text-align:right}#hud .clock b{display:block;font-size:14px;letter-spacing:.3em;color:#fff;font-weight:400}#hud .clock span{color:#58728A}
#hud .gauges{top:72px;right:28px;width:270px;display:grid;grid-template-columns:1fr 1fr;gap:8px}
#hud .g{border:1px solid rgba(63,200,255,.3);padding:7px 9px;background:rgba(3,14,24,.6);position:relative}
#hud .g.wide{grid-column:1/-1}
#hud .g small{display:block;font-size:8.5px;letter-spacing:.18em;color:#4F8FB0}#hud .g b{font-size:20px;font-weight:400;color:#fff;letter-spacing:.02em;font-variant-numeric:tabular-nums}
#hud .g i{display:block;height:3px;background:rgba(63,200,255,.15);margin-top:4px}#hud .g i u{display:block;height:100%;width:0;background:linear-gradient(90deg,#3FC8FF,#5EE6B0);transition:width 2s cubic-bezier(.2,1,.3,1)}
#hud .events{top:330px;right:28px;width:270px;bottom:260px;overflow:hidden}
#hud .ev{display:flex;flex-direction:column;gap:3px;font-size:9.5px;text-transform:none;letter-spacing:.02em}
#hud .ev div{display:grid;grid-template-columns:44px 1fr;gap:6px;animation:hIn .4s both;color:#A9C4DB}#hud .ev div span{color:#58728A}#hud .ev div b{font-weight:500;color:var(--c)}
@keyframes hIn{from{opacity:0;transform:translateX(8px)}}
#hud .boot{left:28px;bottom:28px;width:330px;font-size:10.5px;line-height:1.85;letter-spacing:.06em;white-space:nowrap;text-shadow:0 0 8px rgba(63,200,255,.5);color:#9FE6FF;z-index:5}
#hud .boot .ok{color:#5EE6B0}#hud .boot .bad{color:#FF5A5A}#hud .boot .d{color:#2E5670}#hud .boot div:last-child::after{content:"▍";animation:hB 1s steps(1) infinite}
#hud .ctrl{left:28px;bottom:28px;width:250px;display:none}
#hud .ctrl.open{display:block}
#hud .tgs{display:grid;grid-template-columns:1fr 1fr;gap:5px}
#hud .tg{padding:4px;background:rgba(90,184,255,.06);border:1px solid rgba(110,200,255,.5);color:#9FD3FF;font:inherit;font-size:9px;letter-spacing:.14em;cursor:pointer}
#hud .tg.off{color:#58728A;border-color:rgba(110,200,255,.2);background:none}
#hud .sl{display:grid;grid-template-columns:1fr 30px;gap:4px;align-items:center;margin-top:6px;font-size:9px;color:#58728A}#hud .sl input{grid-column:1/-1;width:100%;accent-color:#5AB8FF;height:12px}
#hud .btns{left:28px;bottom:28px;display:flex;gap:6px}
#hud .hb{font:inherit;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;padding:5px 10px;background:rgba(4,12,22,.8);border:1px solid rgba(110,200,255,.45);color:#9FE6FF;cursor:pointer}
#hud .hb:hover{background:rgba(63,200,255,.15);color:#fff}
#hud .ctrl.open~.btns{bottom:262px}
#hud .time{bottom:24px;left:50%;transform:translateX(-50%);width:min(540px,calc(100vw - 720px))}
#hud .tl{display:flex;gap:4px;justify-content:center;margin-bottom:6px}#hud .tl button{font:inherit;font-size:9px;letter-spacing:.14em;padding:3px 8px;background:none;border:1px solid rgba(110,200,255,.22);color:#58728A;cursor:pointer}
#hud .tl button.on{color:#fff;border-color:#9FD3FF;background:rgba(90,184,255,.12)}
#hud .act{display:flex;align-items:flex-end;gap:2px;height:26px}#hud .act i{flex:1;background:linear-gradient(0deg,rgba(90,184,255,.25),rgba(94,230,176,.9));min-height:2px}
#hud .tlx{display:flex;justify-content:space-between;color:#58728A;font-size:8.5px;margin-top:3px}
#hud .greet{left:0;right:0;bottom:17vh;text-align:center;z-index:6;text-transform:none;letter-spacing:0}
#hud .greet .l1{font-size:clamp(30px,4.6vw,58px);color:#fff;text-shadow:0 0 26px rgba(63,200,255,.7)}#hud .greet .l1 b{color:#5EE6B0;font-weight:500}
#hud .greet .l2{margin:10px auto 0;max-width:62ch;font-size:clamp(13px,1.3vw,16px);color:#CFEFFF;min-height:1.4em}
#hud .greet .l3{margin-top:8px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#4F8FB0}
#hud .note{top:72px;right:28px;width:300px;max-height:calc(100vh - 200px);overflow:auto;text-transform:none;letter-spacing:.02em;font-size:12px;display:none;z-index:7}
#hud .note .k{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#58728A}#hud .note h3{font-size:16px;font-weight:500;color:#fff;margin:4px 0 8px;line-height:1.3}
#hud .note a,#hud .note button{display:inline-block;margin:8px 6px 0 0;font:inherit;font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#9FD3FF;border:1px solid rgba(110,200,255,.5);padding:4px 9px;background:none;cursor:pointer;text-decoration:none}
#hud .note .nb{margin-top:10px;font-size:11px;color:#9FB6CC}#hud .note .nb div{cursor:pointer;padding:2px 0}#hud .note .nb div:hover{color:#fff}
#hud .skip{top:22px;left:50%;transform:translateX(-50%);margin-top:64px;color:#2E5670;font-size:9px;letter-spacing:.2em}
#hud .x{top:20px;right:50%;transform:translateX(50%);margin-top:96px}
#hud .lab{position:absolute;z-index:4;pointer-events:none;font-size:9px;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;transform:translate(10px,-50%);text-shadow:0 0 6px #000,0 0 10px rgba(90,184,255,.6);display:none}
#hud .lab.reg{font-size:10px;letter-spacing:.2em;padding:2px 8px;border:1px solid;background:rgba(2,5,8,.6);transform:translate(-50%,-50%)}
#hud .lab.agent{transform:translate(-50%,-180%);letter-spacing:.18em}
#hud .tip{position:absolute;z-index:8;pointer-events:none;font-size:11px;padding:4px 8px;background:rgba(4,12,22,.92);border:1px solid rgba(110,200,255,.5);display:none;white-space:nowrap}
#hud .err{position:absolute;inset:0;display:none;align-items:center;justify-content:center;color:#58728A;font-size:12px;z-index:9}
#hud.intro .agents{display:none}
@media (max-height:820px){#hud .agents{display:none}}
@media (max-width:1100px){#hud .agents,#hud .stats,#hud .loc,#hud .events,#hud .time{display:none}#hud .gauges{width:220px}}
/* 2026-10-21 · the intro on his iPhone: title and clock up top clear of the notch, the boot log along the bottom, the greeting above it */
@media (max-width:640px){#hud .title{top:calc(env(safe-area-inset-top,0px) + 14px);font-size:17px;letter-spacing:.42em}
#hud .sub{top:calc(env(safe-area-inset-top,0px) + 42px);font-size:8px;letter-spacing:.2em}
#hud .clock{top:calc(env(safe-area-inset-top,0px) + 62px);right:auto;left:50%;transform:translateX(-50%);text-align:center;white-space:nowrap}#hud .clock b{font-size:12px}
#hud .gauges,#hud .search{display:none}
#hud .skip{top:calc(env(safe-area-inset-top,0px) + 92px);margin-top:0}
#hud .boot{left:16px;right:16px;width:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 16px);font-size:9.5px;line-height:1.7;white-space:normal}
#hud .greet{bottom:calc(env(safe-area-inset-bottom,0px) + 150px);padding:0 16px}#hud .greet .l1{font-size:24px}#hud .greet .l2{font-size:13px;max-width:none}#hud .greet .l3{font-size:9px;letter-spacing:.18em}
#hud .btns{left:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 16px)}#hud.intro .lab{display:none}#hud .lab.agent{font-size:8px}}
@media (prefers-reduced-motion: reduce){#hud .w.on,#hud .w.on.fromL,#hud .w.on.fromR,#hud .title.on{animation:none}#hud .sweep{display:none}}`;
let H=null;
const el=(tag,cls,html)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; };
function open(o){
  if(H) return; o=o||{}; const intro=o.mode==='intro', reduce=RM.matches; const dt=o.data||{}; AG=dt.agents||[]; EVENTS=(dt.events||[]).slice();
  const host=el('div'); host.style.cssText='position:fixed;inset:0;z-index:60'; const sr=host.attachShadow({mode:'open'}); const css=el('style'); css.textContent=CSS; sr.appendChild(css);
  const root=el('div',intro?'intro':''); root.id='hud'; root.tabIndex=-1; sr.appendChild(root);
  const gl=el('canvas','gl'), fx=el('canvas','fx'); root.append(gl,fx,el('div','scan'),el('div','sweep'));
  const W={}; const add=(k,cls,html)=>{ W[k]=el('div','w '+cls,html); root.appendChild(W[k]); return W[k]; };
  add('title','title','J.A.R.V.I.S.'); add('sub','sub',`second brain · <b>orchestrator online</b>`);
  add('clock','clock fromR','<b></b><span></span>');
  add('loc','loc fromL','<span>Boston, MA</span><b>42.36°N 71.06°W</b>');
  add('stats','box stats fromL','<h4>Second brain <small>live</small></h4><div class="st"></div>');
  add('agents','box agents fromL','<h4>Agents <small class="agn"></small></h4><div class="agl"></div>');
  add('gauges','gauges fromR','');
  add('events','box events fromR','<h4>Agent runs <small>latest</small></h4><div class="ev"></div>');
  const flash=el('div','flash'); root.appendChild(flash);
  const labels=el('div'); root.appendChild(labels); const tip=el('div','tip'); root.appendChild(tip); const err=el('div','err'); root.appendChild(err);
  if(intro){ add('boot','boot fromL',''); add('greet','greet',`<div class="l1">Good morning, <b>Pablo</b>.</div><div class="l2"></div>${o.objective?`<div class="l3">Today · ${esc(o.objective)}</div>`:''}`); add('skip','skip',matchMedia('(hover:none) and (pointer:coarse)').matches?'Tap to skip':'Esc · click to skip'); }
  else { add('search','search','<input placeholder="⌕  search notes · type a word to light them up" autocomplete="off">');
    add('time','box time','<div class="tl"></div><div class="act"></div><div class="tlx"><span class="tl0">30 days ago</span><span>notes touched per day</span><span>today</span></div>');
    add('ctrl','box ctrl',`<h4>Display</h4><div class="tgs">${['glow','labels','agents','fibers','rotate','stars'].map(k=>`<button class="tg" data-t="${k}"></button>`).join('')}</div>
      <label class="sl">glow <span class="gv">1.1</span><input type="range" class="glow" min="0" max="3" step=".1" value="1.05"></label><label class="sl">light size <span class="sv">1.0</span><input type="range" class="size" min=".4" max="2.5" step=".1" value="1"></label><label class="sl">thinking speed <span class="vv">1.0</span><input type="range" class="speed" min="0" max="3" step=".1" value="1"></label>`);
    add('btns','btns','<button class="hb" data-h="display">⚙ Display</button><button class="hb" data-h="replay">▶ Intro</button>'+(o.standalone?'':'<button class="hb" data-h="close">✕ Close'+(matchMedia('(hover:none) and (pointer:coarse)').matches?'':' · Esc')+'</button>'));
    add('note','box note',''); }
  document.body.appendChild(host); if(!o.standalone) document.body.style.overflow='hidden';
  H={o,host,sr,root,W,gl,fx,flash,labels,tip,err,intro,timers:[],raf:0,done:false,t0:performance.now(),speaking:0};
  const at=(ms,fn)=>H.timers.push(setTimeout(fn,reduce?Math.min(ms,500):ms));
  const seq=intro?[['title',80],['sub',450],['clock',600],['loc',800],['stats',1100],['gauges',1300],['agents',1600],['events',1900],['boot',700]]
                 :[['title',0],['sub',120],['clock',160],['search',220],['loc',260],['stats',320],['gauges',380],['agents',440],['events',500],['time',560],['btns',620]];
  seq.forEach(([k,ms])=>at(ms,()=>{ W[k]&&W[k].classList.add('on'); if(k==='gauges') countUp(); if(intro&&k!=='boot') blip(); }));
  tickClock(); H.clockIv=setInterval(tickClock,1000);
  if(intro){
    root.addEventListener('click',()=>finish(true));
    music(); at(0,()=>{}); hum();
    const down=(dt.total||0)-(dt.working||0), fails=EVENTS.filter(e=>e[3]==='#FF5A5A').length;
    const lines=[['Neural link','online','ok'],['Agents',`${dt.working||0} working`+(down?` · ${down} down`:''),down?'bad':'ok'],['Second brain','loading map…','ok'],['Agent runs',EVENTS.length?(fails?`${EVENTS.length} logged · ${fails} failed`:`${EVENTS.length} logged`):'no log yet',fails?'bad':'ok'],['Location','Boston, MA','ok'],['Morning run',dt.waiting?`${dt.waiting} waiting for you`:'ready','ok']];
    lines.forEach(([k,v,c],i)=>at(900+i*430,()=>{ if(k==='Second brain'&&H.S) v=H.S.notes.toLocaleString()+' notes · '+H.S.links.toLocaleString()+' links'; W.boot.insertAdjacentHTML('beforeend',`<div>${esc(k)} <span class="d">${'.'.repeat(Math.max(3,16-k.length))}</span> <span class="${c}">${esc(v)}</span></div>`); blip(); }));
    if((o.music||{}).type==='startup') at(250,startupSeq); else at(4300,()=>{ W.greet.classList.add('on'); typeLine(o.line||''); speak(); });
    H.safety=setTimeout(()=>finish(false),reduce?9000:26000);
  }
  H.key=e=>{ if(!H) return; const inQ=W.search&&sr.activeElement===W.search.firstChild;
    if(intro){ if(['Escape','Enter',' '].includes(e.key)){ e.preventDefault(); e.stopPropagation(); finish(true); } else e.stopPropagation(); return; }
    e.stopPropagation();
    if(e.key==='Escape'){ e.preventDefault(); if(inQ){ W.search.firstChild.value=''; W.search.firstChild.blur(); H.clearLit&&H.clearLit(); return; } if(H.noteOpen){ H.hideNote(); return; } if(!o.standalone) close(); return; }
    if(e.key==='/'&&!inQ){ e.preventDefault(); W.search.firstChild.focus(); } };
  addEventListener('keydown',H.key,true);
  if(!window.THREE){ err.style.display='flex'; err.textContent='Could not load the 3D library.'; return; }
  getData().then(D=>{ if(H&&!H.done) build(D); }).catch(e=>{ if(!H) return; err.style.display='flex'; err.textContent='Could not read your brain map ('+e.message+').'; });
  hud2d();
}
function tickClock(){ if(!H) return; const d=new Date(); H.W.clock.firstChild.textContent=d.toLocaleTimeString('en-GB',{timeZone:'America/New_York'}); H.W.clock.lastChild.textContent='Boston · '+d.toLocaleDateString('en-US',{timeZone:'America/New_York',weekday:'short',month:'short',day:'numeric'}); }
 
function build(D){
  const T=THREE, h=H, N=D.nodes, L=D.links, S=D.stats, n=N.length; h.S=S;
  const W=h.W;
  W.stats.querySelector('.st').innerHTML=[['Notes',n.toLocaleString()],['Links',L.length.toLocaleString()],['New this week',S.new7],['Touched this week',S.edited7],['People',S.people],['FPS','<span class="fps">60</span>']].map(([k,v])=>`<div class="kv"><span>${k}</span><b>${v}</b></div>`).join('');
  W.agents.querySelector('.agn').textContent=AG.filter(a=>!a[3]).length+' / '+AG.length+' working';
  W.agents.querySelector('.agl').innerHTML=ORCH.map(([o,c],k)=>`<div class="og">${o}</div>`+AG.filter(a=>a[1]===k).map(a=>`<div class="ag" style="--c:${a[3]?'#FF5A5A':c}"><i class="${a[3]?'bad':''}"></i><span>${a[0]}</span><span class="bar"><u style="width:${a[2]}%"></u></span><em>${a[2]}</em></div>`).join('')).join('');
  const dt=h.o.data||{}; W.gauges.innerHTML=[['Agents online',dt.working||0,Math.max(1,dt.total||0),'/'+(dt.total||0),1],['Notes',S.notes,S.notes,''],['Links',S.links,S.links,''],['New this week',S.new7,Math.max(300,S.new7),''],...(dt.rate!=null?[['Cold reply rate',dt.rate,100,'%']]:[['People',S.people,S.people,'']])]
    .map(([k,v,m,suf,wide])=>`<div class="g ${wide?'wide':''}"><small>${k}</small><b data-to="${v}" data-suf="${suf}">0</b><i><u data-w="${Math.round(v/m*100)}"></u></i></div>`).join('');
  if(W.gauges.classList.contains('on')) countUp();
  const pushEv=e=>{ if(!h.W) return; const d=el('div'); d.style.setProperty('--c',e[3]); d.innerHTML=`<span>${esc(e[0])}</span><span><b>${esc(e[1])}</b> · ${esc(e[2])}</span>`; const box=W.events.querySelector('.ev'); box.prepend(d); while(box.children.length>16) box.lastChild.remove(); };
  const evs=EVENTS.slice(0,16).reverse(); if(!evs.length) W.events.querySelector('.ev').innerHTML='<div><span></span><span>No run logged yet.</span></div>';
  evs.forEach((e,i)=>h.timers.push(setTimeout(()=>pushEv(e),RM.matches?0:i*140)));
   
  const subC={}, P=new Float32Array(n*3);
  N.forEach((nd,i)=>{ const key=nd.f+'|'+nd.s; if(!subC[key]){ const r=rnd(hash(key)), L0=LOBE[nd.f]; subC[key]=[L0[0]+gauss(r)*.95,L0[1]+gauss(r)*.45,L0[2]+gauss(r)*.5]; }
    const c=subC[key], r=rnd(hash(nd.p)); let x=c[0]+gauss(r)*.36, y=c[1]+gauss(r)*.26, z=c[2]+gauss(r)*.26; const e=Math.sqrt((x/1.25)**2+y**2+(z/1.45)**2); if(e>1){ x/=e; y/=e; z/=e; } x+=Math.sign(x||1)*.06;
    P[i*3]=x*2.4; P[i*3+1]=y*2.4; P[i*3+2]=z*2.4; });
  const R=new T.WebGLRenderer({canvas:h.gl,antialias:true}); R.setPixelRatio(Math.min(2,devicePixelRatio)); R.setSize(innerWidth,innerHeight); R.autoClear=false;
  const scene=new T.Scene(), cam=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,200); const HOME=new T.Vector3(0,1,(h.intro?13.5:13)*(innerWidth<innerHeight?Math.min(2,.85*innerHeight/innerWidth):1));   cam.position.copy(HOME);
  let comp=null, bloom=null; try{ comp=new T.EffectComposer(R); comp.addPass(new T.RenderPass(scene,cam)); bloom=new T.UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),1.05,.5,.12); comp.addPass(bloom); }catch(_){ comp=null; }
  const world=new T.Group(); scene.add(world); const brain=new T.Group(); world.add(brain); brain.rotation.y=-.9;
  const tex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.22,'rgba(255,255,255,.8)'); gr.addColorStop(.5,'rgba(255,255,255,.18)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); return new T.CanvasTexture(c); })();
  const ptMat=()=>new T.ShaderMaterial({uniforms:{tex:{value:tex},scale:{value:innerHeight},k:{value:1}},vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:'uniform float scale; uniform float k; attribute float size; varying vec3 vC; void main(){ vC=color; vec4 mv=modelViewMatrix*vec4(position,1.); gl_PointSize=size*k*scale/-mv.z; gl_Position=projectionMatrix*mv; }',
    fragmentShader:'uniform sampler2D tex; varying vec3 vC; void main(){ vec4 t=texture2D(tex,gl_PointCoord); if(t.a<.02) discard; gl_FragColor=vec4(vC,1.)*t; }'});
  const base=new Float32Array(n*3), col=new Float32Array(n*3), size=new Float32Array(n), tc=new T.Color();
  N.forEach((nd,i)=>{ tc.set(COL[nd.f]); const fr=nd.age<=7?1.2:nd.age<=30?.85:.5; base[i*3]=tc.r*fr; base[i*3+1]=tc.g*fr; base[i*3+2]=tc.b*fr; size[i]=.07+Math.min(.62,Math.pow(nd.d,.62)*.05)+(nd.age<=7?.04:0); });
  col.set(base);
  const START=new Float32Array(n*3), sr0=rnd(.5); for(let i=0;i<n*3;i++) START[i]=(sr0()-.5)*34; const CUR=START.slice();
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(CUR,3)); g.setAttribute('color',new T.BufferAttribute(col,3)); g.setAttribute('size',new T.BufferAttribute(size,1));
  const nodeMat=ptMat(), pts=new T.Points(g,nodeMat); brain.add(pts);
  const SEG=10, curve=(a,b,t,o)=>{ const mx=(P[a*3]+P[b*3])/2, my=(P[a*3+1]+P[b*3+1])/2, mz=(P[a*3+2]+P[b*3+2])/2, bow=1.18+((a*7+b*13)%10)/40, u=1-t;
    o[0]=u*u*P[a*3]+2*u*t*mx*bow+t*t*P[b*3]; o[1]=u*u*P[a*3+1]+2*u*t*my*bow+t*t*P[b*3+1]; o[2]=u*u*P[a*3+2]+2*u*t*mz*bow+t*t*P[b*3+2]; return o; };
  const fpos=new Float32Array(L.length*SEG*6), fcol=new Float32Array(L.length*SEG*6), o1=[0,0,0], o2=[0,0,0];
  L.forEach(([a,b],k)=>{ for(let s=0;s<SEG;s++){ curve(a,b,s/SEG,o1); curve(a,b,(s+1)/SEG,o2); const q=(k*SEG+s)*6; fpos.set(o1,q); fpos.set(o2,q+3);
    for(let j=0;j<3;j++){ const ca=base[a*3+j], cb=base[b*3+j]; fcol[q+j]=(ca+(cb-ca)*s/SEG)*.42; fcol[q+3+j]=(ca+(cb-ca)*(s+1)/SEG)*.42; } } });
  const fg=new T.BufferGeometry(); fg.setAttribute('position',new T.BufferAttribute(fpos,3)); fg.setAttribute('color',new T.BufferAttribute(fcol,3));
  const fmat=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}); brain.add(new T.LineSegments(fg,fmat));
  const CN=1800, cp=new Float32Array(CN*3), cc=new Float32Array(CN*3), cs=new Float32Array(CN), cr=rnd(.77);
  for(let i=0;i<CN;i++){ const u=cr()*6.283, v=Math.acos(2*cr()-1), rr=Math.pow(cr(),.5)*.85; cp[i*3]=rr*Math.sin(v)*Math.cos(u); cp[i*3+1]=rr*Math.sin(v)*Math.sin(u); cp[i*3+2]=rr*Math.cos(v); tc.setHSL(.55+cr()*.1,.8,.6+cr()*.3); cc[i*3]=tc.r; cc[i*3+1]=tc.g; cc[i*3+2]=tc.b; cs[i]=.03+cr()*.05; }
  const cg=new T.BufferGeometry(); cg.setAttribute('position',new T.BufferAttribute(cp,3)); cg.setAttribute('color',new T.BufferAttribute(cc,3)); cg.setAttribute('size',new T.BufferAttribute(cs,1));
  const core=new T.Points(cg,ptMat()); world.add(core);
  const coreGlow=new T.Sprite(new T.SpriteMaterial({map:tex,color:0x9FD3FF,blending:T.AdditiveBlending,transparent:true,opacity:.3,depthWrite:false})); coreGlow.scale.set(2.2,2.2,1); world.add(coreGlow);
  const rings=[]; const ring=(r,arcs,color,op,tilt,speed,ticks)=>{ const grp=new T.Group(), m=new T.LineBasicMaterial({color,transparent:true,opacity:op,blending:T.AdditiveBlending,depthWrite:false});
    arcs.forEach(([a0,a1])=>{ const p=[]; for(let t=a0;t<=a1;t+=.02) p.push(new T.Vector3(Math.cos(t)*r,0,Math.sin(t)*r)); grp.add(new T.Line(new T.BufferGeometry().setFromPoints(p),m)); });
    if(ticks){ const tp=[]; for(let i=0;i<ticks;i++){ const t=i/ticks*6.283, l=i%5?.08:.2; tp.push(new T.Vector3(Math.cos(t)*r,0,Math.sin(t)*r),new T.Vector3(Math.cos(t)*(r+l),0,Math.sin(t)*(r+l))); } grp.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(tp),m)); }
    grp.rotation.x=tilt[0]; grp.rotation.z=tilt[1]; grp.scale.setScalar(.01); world.add(grp); rings.push({grp,speed}); };
  ring(5.6,[[0,1.6],[2,3.1],[3.5,5.9]],0x5AB8FF,.55,[1.32,.1],.05,120); ring(6.2,[[.4,1.1],[2.6,4.4]],0x5EE6B0,.6,[1.25,-.2],-.08,0);
  ring(4.9,[[0,6.28]],0x5AB8FF,.16,[1.45,.35],.02,72); ring(6.9,[[1,1.5],[3.2,3.5],[4.6,5.4]],0xFF8A3D,.55,[1.1,.25],.11,0);
  const agentObjs=[];
  ORCH.forEach(([o,c],k)=>{ const list=AG.filter(a=>a[1]===k), rr=4.4+k*.55, orbit=new T.Group(); orbit.rotation.x=.9+k*.18; orbit.rotation.z=(k-1.5)*.35; world.add(orbit);
    const op=[]; for(let t=0;t<=6.29;t+=.03) op.push(new T.Vector3(Math.cos(t)*rr,0,Math.sin(t)*rr)); orbit.add(new T.Line(new T.BufferGeometry().setFromPoints(op),new T.LineBasicMaterial({color:c,transparent:true,opacity:.12,blending:T.AdditiveBlending})));
    list.forEach((a,j)=>{ const bad=!!a[3], sp=new T.Sprite(new T.SpriteMaterial({map:tex,color:bad?0xFF5A5A:new T.Color(c),blending:T.AdditiveBlending,transparent:true,depthWrite:false})); sp.scale.set(.42,.42,1); orbit.add(sp);
      const lab=el('div','lab agent'); lab.style.color=bad?'#FF5A5A':c; lab.textContent=a[0]; h.labels.appendChild(lab); agentObjs.push({sp,orbit,rr,ph:j/list.length*6.283,speed:.05+k*.012,bad,lab}); }); });
  const SN=2200, sp2=new Float32Array(SN*3), sr=rnd(.31); for(let i=0;i<SN;i++){ const u=sr()*6.283, v=Math.acos(2*sr()-1), rr=25+sr()*60; sp2[i*3]=rr*Math.sin(v)*Math.cos(u); sp2[i*3+1]=rr*Math.sin(v)*Math.sin(u); sp2[i*3+2]=rr*Math.cos(v); }
  const stars=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(sp2,3)),new T.PointsMaterial({size:.08,color:0x6FA8D6,transparent:true,opacity:.7})); scene.add(stars);
  const KN=RM.matches?0:220, kp=new Float32Array(KN*3), kc=new Float32Array(KN*3), ks=new Float32Array(KN).fill(.16), sparks=[]; for(let i=0;i<KN;i++) sparks.push({k:Math.floor(Math.random()*L.length),t:Math.random(),v:.004+Math.random()*.012});
  const kg=new T.BufferGeometry(); kg.setAttribute('position',new T.BufferAttribute(kp,3)); kg.setAttribute('color',new T.BufferAttribute(kc,3)); kg.setAttribute('size',new T.BufferAttribute(ks,1)); const sparkMat=ptMat(); brain.add(new T.Points(kg,sparkMat));
  const gScene=new T.Scene(), gCam=new T.PerspectiveCamera(40,1,.1,20); gCam.position.set(0,0,5.2); const globe=new T.Group(); gScene.add(globe);
  globe.add(new T.LineSegments(new T.WireframeGeometry(new T.SphereGeometry(1.5,24,16)),new T.LineBasicMaterial({color:0x2FA8D8,transparent:true,opacity:.4})));
  const ll=(lat,lon,r=1.52)=>{ const a=(90-lat)*Math.PI/180, b=(lon+180)*Math.PI/180; return new T.Vector3(-r*Math.sin(a)*Math.cos(b),r*Math.cos(a),r*Math.sin(a)*Math.sin(b)); };
  const bos=ll(42.36,-71.06), ping=new T.Sprite(new T.SpriteMaterial({map:tex,color:0x5EE6B0,blending:T.AdditiveBlending,transparent:true})); ping.position.copy(bos); globe.add(ping);
  const arcs=[[ll(25.67,-100.31),0xFF8A3D],[ll(19.43,-99.13),0x3FC8FF]].map(([to,c])=>{ const mid=bos.clone().add(to).multiplyScalar(.5).normalize().multiplyScalar(2.1); const l=new T.Line(new T.BufferGeometry().setFromPoints(new T.QuadraticBezierCurve3(bos,mid,to).getPoints(60)),new T.LineBasicMaterial({color:c})); l.geometry.setDrawRange(0,0); globe.add(l); return l; });
  const regLabs=REG.map(([r,f],i)=>{ const e=el('div','lab reg'); e.style.color=COL[i]; e.style.borderColor=COL[i]+'99'; e.textContent=r+' · '+f; h.labels.appendChild(e); const c=[0,0,0]; let m=0; N.forEach((nd,j)=>{ if(nd.f===i){ c[0]+=P[j*3]; c[1]+=P[j*3+1]; c[2]+=P[j*3+2]; m++; } }); return {el:e,pos:new T.Vector3(c[0]/m,c[1]/m+.9,c[2]/m)}; });
  const hubLabs=[...N.keys()].sort((a,b)=>N[b].d-N[a].d).slice(0,16).map(i=>{ const e=el('div','lab'); e.textContent='● '+N[i].t.slice(0,34); e.style.color=COL[N[i].f]; h.labels.appendChild(e); return {el:e,i,pos:new T.Vector3(P[i*3],P[i*3+1],P[i*3+2])}; });
  const nb=N.map(()=>[]); L.forEach(([a,b])=>{ nb[a].push(b); nb[b].push(a); });
  let lit=null, win=Infinity; const visible=i=>N[i].born<=win; const TG={glow:true,labels:true,agents:true,fibers:true,rotate:!RM.matches,stars:true};
  const paint=()=>{ for(let i=0;i<n;i++){ const v=visible(i), on=v&&(!lit||lit.has(i)), m=!v?0:lit?(on?1.9:.06):1; col[i*3]=base[i*3]*m; col[i*3+1]=base[i*3+1]*m; col[i*3+2]=base[i*3+2]*m; } g.attributes.color.needsUpdate=true; };
  h.clearLit=()=>{ lit=null; paint(); };
  let fly=null; const look=new T.Vector3();
  if(!h.intro){
    const q=W.search.firstChild;
    q.addEventListener('input',()=>{ const s=q.value.trim().toLowerCase(); if(s.length<2){ lit=null; paint(); return; } lit=new Set(); N.forEach((nd,i)=>{ if(nd.t.toLowerCase().includes(s)||nd.s.toLowerCase().includes(s)) lit.add(i); }); paint(); });
    q.addEventListener('keydown',e=>{ if(e.key==='Enter'&&lit&&lit.size) show([...lit].sort((a,b)=>N[b].d-N[a].d)[0]); });
    const WINS=[['1W',7],['1M',30],['3M',90],['1Y',365],['ALL','Infinity'],['▶ GROW','play']]; const tl=W.time.querySelector('.tl'); tl.innerHTML=WINS.map(([l,v])=>`<button data-w="${v}" class="${v==='Infinity'?'on':''}">${l}</button>`).join('');
    tl.addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b) return; tl.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); clearInterval(h.playIv);
      if(b.dataset.w==='play'){ let d=Math.min(400,Math.max(...N.map(x=>x.born))); h.playIv=setInterval(()=>{ d-=Math.max(1,d*.05); win=d; paint(); W.time.querySelector('.tl0').textContent=d<0?'today':Math.round(d)+' days ago'; if(d<0){ clearInterval(h.playIv); win=Infinity; paint(); W.time.querySelector('.tl0').textContent='30 days ago'; } },60); }
      else { win=b.dataset.w==='Infinity'?Infinity:+b.dataset.w; paint(); } });
    const days=Array(30).fill(0); N.forEach(nd=>{ if(nd.age<30) days[29-nd.age]++; }); const mx=Math.max(...days,1); W.time.querySelector('.act').innerHTML=days.map(v=>`<i style="height:${Math.max(6,v/mx*100)}%"></i>`).join('');
    const NM={glow:'glow',labels:'labels',agents:'agents',fibers:'fibers',rotate:'rotate',stars:'stars'};
    W.ctrl.querySelectorAll('.tg').forEach(b=>{ const k=b.dataset.t, draw=()=>{ b.textContent=`[ ${NM[k]} ${TG[k]?'on':'off'} ]`; b.classList.toggle('off',!TG[k]); }; draw(); b.onclick=()=>{ TG[k]=!TG[k]; draw(); stars.visible=TG.stars; agentObjs.forEach(o=>o.orbit.visible=TG.agents); }; });
    W.ctrl.querySelector('.glow').oninput=e=>{ W.ctrl.querySelector('.gv').textContent=(+e.target.value).toFixed(1); if(bloom) bloom.strength=+e.target.value; };
    W.ctrl.querySelector('.size').oninput=e=>{ W.ctrl.querySelector('.sv').textContent=(+e.target.value).toFixed(1); nodeMat.uniforms.k.value=+e.target.value; };
    W.ctrl.querySelector('.speed').oninput=e=>{ h.speedK=+e.target.value; W.ctrl.querySelector('.vv').textContent=h.speedK.toFixed(1); };
    W.btns.addEventListener('click',e=>{ const b=e.target.closest('[data-h]'); if(!b) return; if(b.dataset.h==='display'){ W.ctrl.classList.toggle('open'); W.ctrl.classList.add('on'); } if(b.dataset.h==='close') close(); if(b.dataset.h==='replay'){ const oo=h.o; close(); setTimeout(()=>(oo.onReplay||(()=>open({mode:'intro'})))(),700); } });
    const show=i=>{ const nd=N[i]; lit=new Set([i,...nb[i]]); paint(); W.events.style.visibility='hidden'; W.gauges.style.visibility='hidden'; const c=W.note; c.style.display='block'; c.classList.add('on'); h.noteOpen=true;
      c.innerHTML=`<div class="k" style="color:${COL[nd.f]}">${REG[nd.f][0]} · ${esc(nd.s)}</div><h3>${esc(nd.t)}</h3><div class="k">${nd.d} links · touched ${nd.age===0?'today':nd.age+' days ago'}</div><a href="${OBS(nd.p)}">Open in Obsidian ↗</a><button class="cx">Close · Esc</button>${nb[i].length?`<div class="nb"><div class="k" style="margin-bottom:4px">Linked notes</div>${nb[i].slice(0,40).map(j=>`<div data-j="${j}" style="color:${COL[N[j].f]}">→ <span style="color:#CFE6FF">${esc(N[j].t)}</span></div>`).join('')}</div>`:''}`;
      c.querySelector('.cx').onclick=h.hideNote; c.querySelectorAll('[data-j]').forEach(d=>d.onclick=()=>show(+d.dataset.j));
      brain.updateMatrixWorld(); const v=new T.Vector3(P[i*3],P[i*3+1],P[i*3+2]).applyMatrix4(brain.matrixWorld); fly={to:v.clone().add(new T.Vector3(0,.4,4.2)),look:v}; };
    h.hideNote=()=>{ W.note.style.display='none'; W.events.style.visibility=''; W.gauges.style.visibility=''; h.noteOpen=false; lit=null; paint(); fly={to:HOME.clone(),look:new T.Vector3()}; };
    let drag=null, moved=0, spinV=0; const ray=new T.Raycaster(); ray.params.Points.threshold=.12; const m2=new T.Vector2();
    const pick=e=>{ m2.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1); ray.setFromCamera(m2,cam); const hh=ray.intersectObject(pts).filter(x=>visible(x.index)); return hh.length?hh[0].index:null; };
    h.gl.addEventListener('pointerdown',e=>{ drag={x:e.clientX,y:e.clientY}; moved=0; });
    h.onUp=e=>{ if(drag&&moved<5&&e.composedPath()[0]===h.gl){ const i=pick(e); if(i!=null) show(i); } drag=null; }; addEventListener('pointerup',h.onUp);
    h.onMove=e=>{ if(drag){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y; moved+=Math.abs(dx)+Math.abs(dy); world.rotation.y+=dx*.005; world.rotation.x=Math.max(-.9,Math.min(.9,world.rotation.x+dy*.004)); spinV=dx*.0008; drag={x:e.clientX,y:e.clientY}; return; }
      if(e.composedPath()[0]!==h.gl){ h.tip.style.display='none'; return; } const i=pick(e); if(i!=null){ h.tip.style.display='block'; h.tip.style.left=e.clientX+14+'px'; h.tip.style.top=e.clientY+10+'px'; h.tip.style.color=COL[N[i].f]; h.tip.textContent=N[i].t+' · '+N[i].d+' links'; h.gl.style.cursor='pointer'; } else { h.tip.style.display='none'; h.gl.style.cursor='grab'; } };
    addEventListener('pointermove',h.onMove);
    h.gl.addEventListener('wheel',e=>{ e.preventDefault(); fly=null; const d=cam.position.length(), nd=Math.max(4,Math.min(26,d+e.deltaY*.01)); cam.position.multiplyScalar(nd/d); },{passive:false});
    h.spin=()=>{ const v=spinV; spinV*=.95; return v; };
  }
  h.onResize=()=>{ cam.aspect=innerWidth/innerHeight; cam.updateProjectionMatrix(); R.setSize(innerWidth,innerHeight); comp&&comp.setSize(innerWidth,innerHeight); [nodeMat,sparkMat].forEach(m=>m.uniforms.scale.value=innerHeight); }; addEventListener('resize',h.onResize);
  const BUILD=RM.matches?1:(h.intro?3200:1800), t0=performance.now(), v3=new T.Vector3(); let settled=false, frames=0, last=t0;
  h.three={R,comp};
  const loop=now=>{ if(!H||H!==h) return; h.raf=requestAnimationFrame(loop); const t=(now-t0)/1000, sp=h.speedK??1;
    if(!settled){ const k=Math.min(1,(now-t0-(h.intro?600:0))/BUILD), e=k<=0?0:1-Math.pow(1-k,3); for(let i=0;i<n*3;i++) CUR[i]=START[i]+(P[i]-START[i])*e; g.attributes.position.needsUpdate=true; fmat.opacity=.22*Math.max(0,(k-.7)/.3); if(k>=1){ settled=true; fmat.opacity=.22; } }
    else fmat.opacity=(lit?.05:.22)*(TG.fibers?1:0);
    if(TG.rotate) world.rotation.y+=.0012*sp*(h.intro?2:1)+(h.spin?h.spin():0);
    core.rotation.y+=.004*sp; core.rotation.x+=.0015*sp; const pulse=1+Math.sin(t*1.8)*.06+(h.speaking>0?.05:0); core.scale.setScalar(pulse); coreGlow.material.opacity=.28+Math.sin(t*1.8)*.08+(h.speaking>0?.15:0);
    rings.forEach((r,i)=>{ const s=Math.min(1,Math.max(.01,(t-.6-i*.25)/.9)); r.grp.scale.setScalar(1-Math.pow(1-s,3)); r.grp.rotation.y+=r.speed*.02*sp*(1+h.speaking); });
    agentObjs.forEach(o=>{ const a=o.ph+t*o.speed*sp*.25, s=Math.min(1,Math.max(0,(t-1.2)/1)); o.sp.position.set(Math.cos(a)*o.rr*s,0,Math.sin(a)*o.rr*s); if(o.bad) o.sp.material.opacity=.5+Math.sin(t*6)*.5; });
    if(settled) for(let i=0;i<KN;i++){ const s=sparks[i]; s.t+=s.v*sp; if(s.t>1){ s.t=0; s.k=Math.floor(Math.random()*L.length); } const [a,b]=L[s.k]; curve(a,b,s.t,o1); kp[i*3]=o1[0]; kp[i*3+1]=o1[1]; kp[i*3+2]=o1[2]; tc.set(COL[N[a].f]); kc[i*3]=tc.r+.4; kc[i*3+1]=tc.g+.4; kc[i*3+2]=tc.b+.4; }
    if(KN){ kg.attributes.position.needsUpdate=true; kg.attributes.color.needsUpdate=true; }
    if(h.dive){ const k=Math.min(1,(now-h.dive)/h.diveMs); cam.position.copy(HOME).multiplyScalar(1-.95*k*k); cam.fov=48+40*k*k; cam.updateProjectionMatrix(); }
    else if(fly){ cam.position.lerp(fly.to,.06); look.lerp(fly.look,.08); if(cam.position.distanceTo(fly.to)<.02) fly=null; }
    cam.lookAt(look);
    R.clear(); if(comp&&TG.glow) comp.render(); else R.render(scene,cam);
    const gs=Math.min(1,Math.max(.01,(t-.4)/.6)); globe.scale.setScalar(gs); globe.rotation.y=-1.2+t*.25; ping.scale.setScalar(.3+Math.abs(Math.sin(t*3))*.25);
    arcs.forEach((l,i)=>l.geometry.setDrawRange(0,Math.max(0,Math.min(61,Math.floor((t-1.4-i*.5)*40)))));
    if(innerWidth>1100&&!h.dive){ const s=190, x0=28+30, y0=innerHeight-24-s-0; R.setScissorTest(true); R.setScissor(x0,innerHeight-30-s,s,s); R.setViewport(x0,innerHeight-30-s,s,s); R.render(gScene,gCam); R.setScissorTest(false); R.setViewport(0,0,innerWidth,innerHeight); }
    const proj=(pos,obj)=>{ v3.copy(pos).applyMatrix4(obj.matrixWorld).project(cam); return v3.z<1&&Math.abs(v3.x)<1.05&&Math.abs(v3.y)<1.05?[(v3.x*.5+.5)*innerWidth,(-v3.y*.5+.5)*innerHeight]:null; };
    const showL=TG.labels&&settled&&!h.dive;
    regLabs.forEach(l=>{ const p=showL&&proj(l.pos,brain); l.el.style.display=p?'block':'none'; if(p){ l.el.style.left=p[0]+'px'; l.el.style.top=p[1]+'px'; } });
    const placed=regLabs.filter(l=>l.el.style.display==='block').map(l=>[parseFloat(l.el.style.left),parseFloat(l.el.style.top),90]);
    hubLabs.forEach(l=>{ let p=showL&&!h.intro&&!lit&&visible(l.i)&&proj(l.pos,brain); if(p&&placed.some(([x,y,w])=>Math.abs(x-p[0])<w+60&&Math.abs(y-p[1])<16)) p=null; l.el.style.display=p?'block':'none'; if(p){ placed.push([p[0]+60,p[1],60]); l.el.style.left=p[0]+'px'; l.el.style.top=p[1]+'px'; } });
    agentObjs.forEach(o=>{ const p=TG.labels&&TG.agents&&t>2.2&&!h.dive&&proj(o.sp.position,o.sp.parent); o.lab.style.display=p?'block':'none'; if(p){ o.lab.style.left=p[0]+'px'; o.lab.style.top=p[1]+'px'; } });
    frames++; if(now-last>1000){ const f=h.W.stats.querySelector('.fps'); if(f) f.textContent=frames; frames=0; last=now; }
  };
  h.raf=requestAnimationFrame(loop);
}
 
function hud2d(){
  const h=H, c=h.fx, x=c.getContext('2d'); let W0=0,H0=0; const fit=()=>{ const D=devicePixelRatio||1; c.width=innerWidth*D; c.height=innerHeight*D; x.setTransform(D,0,0,D,0,0); W0=innerWidth; H0=innerHeight; }; fit(); h.onResize2=fit; addEventListener('resize',fit);
  const cols=Array.from({length:5},()=>Array.from({length:14},()=>Math.random().toString(16).slice(2,8).toUpperCase())), wave=new Array(110).fill(0), t0=performance.now();
  const loop=now=>{ if(!H||H!==h) return; requestAnimationFrame(loop); const t=(now-t0)/1000; x.clearRect(0,0,W0,H0); x.lineWidth=1;
    if(t>1&&W0>1100){ const r=70, cx=W0-28-r-14, cy=H0-28-r-14; x.strokeStyle='rgba(63,200,255,.4)'; for(let k=1;k<=4;k++){ x.beginPath(); x.arc(cx,cy,r*k/4,0,7); x.stroke(); }
      x.beginPath(); x.moveTo(cx-r,cy); x.lineTo(cx+r,cy); x.moveTo(cx,cy-r); x.lineTo(cx,cy+r); x.stroke(); const a=t*1.6;
      if(x.createConicGradient){ const g=x.createConicGradient(a-.9,cx,cy); g.addColorStop(0,'rgba(63,200,255,0)'); g.addColorStop(.14,'rgba(63,200,255,.32)'); g.addColorStop(.15,'rgba(63,200,255,0)'); x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,7); x.fill(); }
      x.strokeStyle='#9FE6FF'; x.beginPath(); x.moveTo(cx,cy); x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); x.stroke();
      x.strokeStyle='rgba(255,138,61,.8)'; x.lineWidth=2; x.beginPath(); x.arc(cx,cy,r+8,-t*.8,-t*.8+1.2); x.stroke(); x.lineWidth=1;
      [[.3,.4],[1.9,.7],[3.6,.55],[5,.8]].forEach(([b,d],i)=>{ const p=(Math.sin(t*3+b)+1)/2; x.fillStyle=i===3?`rgba(255,90,90,${.4+p*.6})`:`rgba(94,230,176,${.4+p*.6})`; x.beginPath(); x.arc(cx+Math.cos(b)*r*d,cy+Math.sin(b)*r*d,2.4,0,7); x.fill(); });
      x.fillStyle='#4F8FB0'; x.font='9px Geist Mono, monospace'; x.fillText('SCAN · '+((h.S&&h.S.people)||0)+' PEOPLE',cx-r,cy-r-10); }
    if(t>.8){ x.font='8px Geist Mono, monospace'; for(let j=0;j<Math.floor(H0/14)-4;j++){ x.fillStyle=`rgba(63,200,255,${.1+((j+Math.floor(t*8))%9===0?.55:0)})`; x.fillText(((j*7919+Math.floor(t*6))%9973).toString(16).padStart(4,'0').toUpperCase(),W0-22,40+j*14); } }
    if(h.intro&&t>1.4&&W0>640){ x.font='9.5px Geist Mono, monospace'; cols.forEach((col,i)=>col.forEach((v,j)=>{ const y=H0-200-j*12; if(y<H0*.5) return; const fl=(Math.floor(t*12)+i*3+j)%17===0; x.fillStyle=fl?'#fff':j%5===0?'rgba(94,230,176,.5)':'rgba(63,200,255,.22)'; x.fillText(fl?Math.random().toString(16).slice(2,8).toUpperCase():v,28+i*58,y); })); }
    const amp=h.speaking>0?(9+Math.random()*15):1.5+Math.sin(t*2)*1; wave.push(amp); wave.shift();
    const ww=Math.min(520,W0*.42), x0=(W0-ww)/2, y0=h.intro?(W0<=640?H0-136:H0-46):H0-112; x.strokeStyle=h.speaking>0?'rgba(94,230,176,.95)':'rgba(94,230,176,.45)'; x.beginPath();
    wave.forEach((a,i)=>{ const px=x0+i/(wave.length-1)*ww, py=y0+Math.sin(i*.9+t*14)*a*Math.sin(i/wave.length*Math.PI); i?x.lineTo(px,py):x.moveTo(px,py); }); x.stroke();
    x.fillStyle='#2E5670'; x.font='9px Geist Mono, monospace'; x.fillText(h.speaking>0?'VOICE · SPEAKING':'VOICE · STANDBY',x0,y0+16);
    x.strokeStyle='rgba(63,200,255,.5)'; [[14,14,1,1],[W0-14,14,-1,1],[14,H0-14,1,-1],[W0-14,H0-14,-1,-1]].forEach(([a,b,sx,sy])=>{ x.beginPath(); x.moveTo(a,b+sy*22); x.lineTo(a,b); x.lineTo(a+sx*22,b); x.stroke(); });
  };
  requestAnimationFrame(loop);
}
function countUp(){ if(!H) return; H.W.gauges.querySelectorAll('.g b').forEach(b=>{ const to=+b.dataset.to, suf=b.dataset.suf, t0=performance.now(); const step=()=>{ if(!H) return; const k=Math.min(1,(performance.now()-t0)/1700), e=1-Math.pow(1-k,3); b.textContent=Math.round(to*e).toLocaleString()+suf; if(k<1) requestAnimationFrame(step); }; step(); });
  H.W.gauges.querySelectorAll('.g u').forEach(u=>requestAnimationFrame(()=>u.style.width=u.dataset.w+'%')); }
function typeLine(t){ const e=H.W.greet.querySelector('.l2'); let i=0; const step=()=>{ if(!H) return; e.textContent=t.slice(0,++i); if(i<t.length) H.timers.push(setTimeout(step,22)); }; step(); }
 
function music(){ const m=H.o.music||{type:'score'}; if(m.type==='startup') return;
  if(m.type==='file'&&m.url){ const a=new Audio(m.url); a.volume=0; H.file=a; a.play().then(()=>{ const iv=setInterval(()=>{ if(!H||H.done||!H.file){ clearInterval(iv); return; } a.volume=Math.min(.8,a.volume+.1); if(a.volume>=.8) clearInterval(iv); },60); }).catch(()=>{ H.file=null; score(); }); }
  else if(m.type!=='off') H.timers.push(setTimeout(score,0)); }
function ctx(){ if(H.ac) return H.ac; try{ const C=window.AudioContext||window.webkitAudioContext; const sh=window.__jac&&window.__jac.state!=='closed'; const c=sh?window.__jac:new C(), g=c.createGain(); if(c.resume) c.resume(); g.connect(c.destination); H.ac={c,g,shared:sh}; }catch(_){ H.ac=null; } return H.ac; }
function hum(){ const a=ctx(); if(!a) return; try{ const o=a.c.createOscillator(), f=a.c.createBiquadFilter(), g=a.c.createGain(); o.type='sawtooth'; o.frequency.value=48; f.type='lowpass'; f.frequency.value=200; g.gain.value=0; o.connect(f); f.connect(g); g.connect(a.g); o.start(); g.gain.setTargetAtTime(.03,a.c.currentTime,.5); H.humG=g; }catch(_){} }
function blip(){ const a=H&&H.intro&&ctx(); if(!a) return; try{ const o=a.c.createOscillator(), g=a.c.createGain(), t=a.c.currentTime; o.type='square'; o.frequency.value=1100+Math.random()*500; g.gain.value=.0001; o.connect(g); g.connect(a.g); g.gain.exponentialRampToValueAtTime(.02,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+.06); o.start(t); o.stop(t+.07); }catch(_){} }
function score(){ const a=ctx(); if(!a||!H) return; try{ const c=a.c, out=c.createGain(); out.gain.value=.9; out.connect(a.g); H.sc=out; const t0=c.currentTime+.05;
  const nb=c.createBuffer(1,c.sampleRate*6,c.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const nz=c.createBufferSource(); nz.buffer=nb; const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=6; bp.frequency.setValueAtTime(200,t0); bp.frequency.exponentialRampToValueAtTime(5000,t0+4.2);
  const ng=c.createGain(); ng.gain.setValueAtTime(.0001,t0); ng.gain.exponentialRampToValueAtTime(.12,t0+4); ng.gain.exponentialRampToValueAtTime(.0001,t0+4.6); nz.connect(bp); bp.connect(ng); ng.connect(out); nz.start(t0); nz.stop(t0+5);
  const hit=(t,f,v)=>{ const o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(f*2,t); o.frequency.exponentialRampToValueAtTime(f,t+.12); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+1.2); o.connect(g); g.connect(out); o.start(t); o.stop(t+1.3); };
  [0,.45,1.3,4.3].forEach((t,i)=>hit(t0+t,i===3?41:55,i===3?.7:.45));
  const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.setValueAtTime(300,t0); lp.frequency.linearRampToValueAtTime(2200,t0+4.2); lp.Q.value=8; const ag=c.createGain(); ag.gain.value=.11; lp.connect(ag); ag.connect(out);
  const notes=[110,164.8,220,261.6,220,164.8,110,130.8], step=60/112/2; for(let i=0;i<64;i++){ const t=t0+1.3+i*step, o=c.createOscillator(), g=c.createGain(); o.type='sawtooth'; o.frequency.value=notes[i%8]*(i>=24&&i%16>11?1.5:1); g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.9,t+.01); g.gain.exponentialRampToValueAtTime(.0001,t+step*.9); o.connect(g); g.connect(lp); o.start(t); o.stop(t+step); }
  [220,261.6,329.6,493.9].forEach(f=>{ const o=c.createOscillator(), g=c.createGain(); o.type='triangle'; o.frequency.value=f; g.gain.setValueAtTime(.0001,t0+4.3); g.gain.exponentialRampToValueAtTime(.045,t0+5.5); g.gain.setTargetAtTime(.0001,t0+12,1.5); o.connect(g); g.connect(out); o.start(t0+4.3); o.stop(t0+20); }); }catch(_){} }
function duck(k){ try{ if(H.sc) H.sc.gain.setTargetAtTime(.9*k,H.ac.c.currentTime,.25); if(H.file) H.file.volume=.8*k; }catch(_){} }
function speak(){ const text='Good morning, Pablo. '+(H.o.line||'');
  if(!('speechSynthesis' in window)){ H.timers.push(setTimeout(()=>finish(false),3500+text.length*55)); return; }
  const go=()=>{ if(!H) return; try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text), vs=speechSynthesis.getVoices(), v=vs.find(v=>/Daniel/.test(v.name))||vs.find(v=>v.lang==='en-GB')||vs.find(v=>/^en/.test(v.lang)); if(v) u.voice=v; u.rate=.98; u.pitch=.88;
      u.onstart=()=>{ if(H){ H.speaking=1; duck(.38); } }; u.onend=u.onerror=()=>{ if(!H) return; H.speaking=0; duck(1); H.timers.push(setTimeout(()=>finish(false),1100)); };
      H.utter=u; speechSynthesis.speak(u);
      const watch=setInterval(()=>{ if(!H){ clearInterval(watch); return; } if(!speechSynthesis.speaking&&!speechSynthesis.pending&&H.speaking!==-1&&performance.now()-H.t0>7000){ clearInterval(watch); H.speaking=-1; H.timers.push(setTimeout(()=>finish(false),1100)); } },400); H.timers.push(watch);
    }catch(_){ H.timers.push(setTimeout(()=>finish(false),4000)); } };
  if(speechSynthesis.getVoices().length) go(); else { let f=false; const once=()=>{ if(f) return; f=true; go(); }; speechSynthesis.addEventListener('voiceschanged',once,{once:true}); H.timers.push(setTimeout(once,700)); } }
 
async function startupSeq(){ const h=H, m=h.o.music, a=ctx(); if(!a) return speak();
  const C={greetEnd:2.68, closeFrom:9.04, voiceEnd:10.5, diveAt:15.2};
  let buf=null; try{ const r=await fetch(m.url); buf=await a.c.decodeAudioData(await r.arrayBuffer()); }catch(_){}
  if(!H||H!==h||h.done) return;
  const greet=()=>{ h.W.greet.querySelector('.l1').innerHTML='Welcome back, <b>Pablo</b>.'; h.W.greet.classList.add('on'); };
  if(!buf){   const el=new Audio(m.url); h.file=el; el.play().catch(()=>{}); h.speaking=1; h.timers.push(setTimeout(greet,350)); el.onended=()=>finish(false); h.timers.push(setTimeout(()=>finish(false),19000)); return; }
  const out=a.c.createGain(); out.gain.value=1; out.connect(a.g); h.sc=out; h.srcs=[];
  const play=(off,dur)=>{ const s=a.c.createBufferSource(); s.buffer=buf; s.connect(out); s.start(a.c.currentTime+.02,off,dur); h.srcs.push(s); return s; };
  h.speaking=1; h.timers.push(setTimeout(greet,350));
  if(m.whole){ play(0,buf.duration); h.timers.push(setTimeout(()=>{ if(H===h) typeLine(h.o.line||''); },2900));
    h.timers.push(setTimeout(()=>{ if(H===h) h.speaking=0; },C.voiceEnd*1000)); h.timers.push(setTimeout(()=>finish(false,true),C.diveAt*1000)); return; }
  const s1=play(0,C.greetEnd);
  s1.onended=()=>{ if(!H||H!==h||h.done) return; h.speaking=0;
    sayLine(h.o.line||'',()=>{ if(!H||H!==h||h.done) return; h.speaking=1; play(C.closeFrom,buf.duration-C.closeFrom);
      h.timers.push(setTimeout(()=>{ if(H===h) h.speaking=0; },(C.voiceEnd-C.closeFrom)*1000));
      h.timers.push(setTimeout(()=>finish(false,true),(C.diveAt-C.closeFrom)*1000)); }); };
}
function sayLine(text,done){ const h=H; let fired=false; const next=()=>{ if(fired) return; fired=true; h.speaking=0; setTimeout(done,180); };
  const typed=h.W.greet.querySelector('.l2'); if(!text){ next(); return; }
  if(!('speechSynthesis' in window)){ typeLine(text); h.timers.push(setTimeout(next,1200+text.length*60)); return; }
  try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text), vs=speechSynthesis.getVoices(), v=vs.find(v=>/Daniel/.test(v.name))||vs.find(v=>v.lang==='en-GB')||vs.find(v=>/^en/.test(v.lang)); if(v) u.voice=v; u.rate=.96; u.pitch=.82;
    u.onstart=()=>{ if(H===h){ h.speaking=1; typeLine(text); } }; u.onend=u.onerror=next; speechSynthesis.speak(u);
    h.timers.push(setTimeout(next,2500+text.length*95));    
  }catch(_){ next(); } }
 
function finish(skipped,keepSound){ if(!H||H.done||!H.intro) return; const h=H; h.done=true; if(skipped){ try{ speechSynthesis.cancel(); }catch(_){} try{ (h.srcs||[]).forEach(s=>s.stop()); }catch(_){} }
  h.diveMs=skipped?420:1100; h.dive=performance.now(); h.speaking=0;
  try{ if(!keepSound) h.sc&&h.sc.gain.setTargetAtTime(0,h.ac.c.currentTime,.35); h.humG&&h.humG.gain.setTargetAtTime(0,h.ac.c.currentTime,.2); }catch(_){}
  if(h.file){ const a=h.file, iv=setInterval(()=>{ a.volume=Math.max(0,a.volume-.08); if(a.volume<=0){ a.pause(); clearInterval(iv); } },80); }
  setTimeout(()=>{ h.flash.style.opacity='.85'; },h.diveMs*.7);  
  setTimeout(()=>{ try{ h.o.onDone&&h.o.onDone(skipped); }catch(e){ console.error(e); } h.root.classList.add('out'); },h.diveMs+80);
  setTimeout(()=>teardown(h),h.diveMs+700); }
function close(){ if(!H||H.intro) return finish(true); const h=H; h.root.classList.add('out'); h.done=true; setTimeout(()=>{ teardown(h); try{ h.o.onClose&&h.o.onClose(); }catch(_){} },450); }
function teardown(h){ cancelAnimationFrame(h.raf); h.timers.forEach(t=>{ clearTimeout(t); clearInterval(t); }); clearTimeout(h.safety); clearInterval(h.clockIv); clearInterval(h.evIv); clearInterval(h.playIv);
  removeEventListener('keydown',h.key,true); h.onUp&&removeEventListener('pointerup',h.onUp); h.onMove&&removeEventListener('pointermove',h.onMove); h.onResize&&removeEventListener('resize',h.onResize); h.onResize2&&removeEventListener('resize',h.onResize2);
  try{ h.three&&h.three.R.dispose(); h.three&&h.three.R.forceContextLoss(); }catch(_){} try{ h.ac&&(h.ac.shared?h.ac.g.disconnect():h.ac.c.close()); }catch(_){} if(h.file){ try{ h.file.pause(); }catch(_){} }
  h.host.remove(); if(!h.o.standalone) document.body.style.overflow=''; if(H===h) H=null; }
window.JarvisHUD={open,close,finish:()=>finish(true),get isOpen(){ return !!H; },get mode(){ return H&&(H.intro?'intro':'explore'); }};
})();
