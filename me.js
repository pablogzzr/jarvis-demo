 
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function post(url,body){ return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(async r=>{ let j={}; try{ j=await r.json(); }catch(_){} if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status)); return j; }); }
function get(url){ return fetch(url).then(async r=>{ const j=await r.json(); if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status)); return j; }); }
function toast(m,bad){ const t=$('#toast'); $('#toastMsg').textContent=m; t.classList.toggle('bad',!!bad); t.classList.add('show'); $('#live').textContent=m; clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove('show'),2600); }
const COL={'Northbeam':'#FF8A3D',"Founders' Table":'#F2C14E','Atlas Freight':'#E07AD8','Networking':'#B794F6','Admin':'#7FB2FF','Jarvis':'#5EE6B0','Deep work':'#2FD3C6','Study':'#9BE37A',
  'Classes':'#6C8CFF','Faith':'#F5E6B3','People':'#FF7A8A','Health':'#7C9A8E','Transit':'#4A5753','Personal':'#5C6B66','Other':'#3A4641',
  'Claude chat':'#3E8C74','Claude (other)':'#3E8C74','Browser':'#56606A','Phone':'#8A4F5A','Calls':'#C46A7A','Listening':'#BFA77A','Reading':'#BFA77A',
  'Documents':'#6F7F9A','Thinking aloud':'#9AA8A1'};
const col=f=>COL[f]||'#55635E';
const h1=x=>x==null?'—':(x>=10?Math.round(x):Math.round(x*10)/10);
const hhmm=m=>{ m=((m%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); };
const dur=h=>h==null?'—':(h<1?Math.max(1,Math.round(h*60))+' min':(h<48?h1(h)+' h':Math.round(h/24)+' d'));
const PER=[['7d','Last 7 days'],['semana','This week'],['pasada','Last week'],['30d','30 days']];
let D=null, K=(()=>{ try{ return localStorage.getItem('me.per')||'7d'; }catch(_){ return '7d'; } })();
const isPhone=()=>matchMedia('(max-width:760px)').matches;
async function load(){
  try{ D=await get('/api/yo'); }
  catch(e){ $('#app').innerHTML=`<p class="red">Couldn't read your time: ${esc(e.message)}</p>`; return; }
  if(!D.periodos||!D.periodos[K]) K='7d';
  if(!D.periodos||!D.periodos[K]){ $('#app').innerHTML='<p class="empty">Nothing counted yet — the counter runs the first time this page opens on the Mac.</p>'; return; }
  render();
}
let TAB=(()=>{ try{ return localStorage.getItem('me.tab')||'tiempo'; }catch(_){ return 'tiempo'; } })();
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{ TAB=b.dataset.tab; try{ localStorage.setItem('me.tab',TAB); }catch(_){} render(); });
function render(){
  if(!D) return;                                   
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===TAB));
  $('#per').style.display=TAB==='lab'?'none':'';
  if(TAB==='lab') return renderLab();
  const P=D.periodos[K], T=P.totales;
  $('#per').innerHTML=PER.map(([k,n])=>`<button role="tab" class="${k===K?'on':''}" data-k="${k}">${n}</button>`).join('');
  $('#per').querySelectorAll('button').forEach(b=>b.onclick=()=>{ K=b.dataset.k; try{ localStorage.setItem('me.per',K); }catch(_){} render(); });
  const end=new Date(P.desde+'T12:00'); end.setDate(end.getDate()+P.dias-1);
  const f=x=>x.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  $('#date').textContent=`${f(new Date(P.desde+'T12:00'))} – ${f(end)} · counted ${P.generado.slice(11,16)}`;
  $('#app').innerHTML=`
    ${theRead(D.lectura)}
    <div class="hero">${hero(P)}</div>
    <div class="grid2">
      <div class="box"><div class="legend"><span class="n">Where your time really went</span><span class="q">real vs planned</span></div>${realVsPlan(P)}</div>
      <div class="box"><div class="legend"><span class="n">How fast you answer</span><span class="q">first reply</span></div>${replies(P)}</div>
    </div>
    <div class="box"><div class="legend"><span class="n">Your ten most important messages</span><span class="q">WhatsApp · mail · LinkedIn</span></div>${topTen(P,D.lectura)}</div>
    <div class="box"><div class="legend"><span class="n">${P.dias>7?'Thirty days, day by day':'Hour by hour'}</span><span class="q">${P.dias>7?'real hours by front':'tap a calendar event to fix its front'}</span></div>${P.dias>7?thirty(P):timeline(P)}</div>
    <div class="box"><div class="legend"><span class="n">Screen Time</span><span class="q">apps · times opened</span></div>${screen(P)}</div>
    <p class="foot">Planned = your calendar. Real = one label per minute, strongest evidence first: a Granola meeting, a call, a Claude session (sorted by its title), the page in front in Chrome, the calendar, then the phone. Names and times only leave the Mac.</p>`;
  document.querySelectorAll('.ev').forEach(el=>el.onclick=e=>relabel(e,el.dataset.t,el.dataset.f));
}
 
function theRead(L){
  if(!L||!L.insights||!L.insights.length) return `<div class="read"><div class="kick up"><span>This week's read</span></div><div class="box" style="margin:0"><p class="empty">Every Sunday I read your week against your focus and leave three insights and one move here. The first one comes this Sunday.</p></div></div>`;
  const m=L.movida||{};
  return `<div class="read"><div class="kick up"><span>The read · week of ${esc(L.semana)}</span><span>written ${esc(L.escrita||'')}</span></div>
    <div class="ins">${L.insights.slice(0,3).map((x,i)=>`<div class="in"><span class="n">${i+1}</span><div class="t">${esc(x.titulo)}</div>${x.dato?`<div class="d">${esc(x.dato)}</div>`:''}<div class="w">${esc(x.por_que||'')}</div></div>`).join('')}</div>
    ${m.que?`<div class="move"><div class="k">YOUR MOVE FOR NEXT WEEK</div><div class="h">${esc(m.que)}</div>
      <div class="g"><div><em>When</em>${esc(m.cuando||'—')}</div><div><em>Where</em>${esc(m.donde||'—')}</div><div><em>Doing</em>${esc(m.hacer||'—')}</div><div><em>Why</em>${esc(m.por_que||'—')}</div></div></div>`:''}
  </div>`;
}
 
function spark(vals,color){
  const v=vals.map(x=>x==null?0:x), mx=Math.max(1,...v), n=v.length; if(n<2) return '<svg></svg>';
  const pts=v.map((x,i)=>[(i/(n-1))*100, 30-(x/mx)*26]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  const last=pts[n-1];
  return `<svg viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L100 34 L0 34 Z" fill="${color}" opacity=".08"/><path d="${d}" fill="none" stroke="${color}" stroke-width="1.4" vector-effect="non-scaling-stroke"/><circle cx="${last[0]}" cy="${last[1]}" r="2.2" fill="${color}"/></svg>`;
}
function hero(P){
  const T=P.totales, H=(D.historia||[]).map(w=>w.totales), m=P.mensajes||{};
  const wa=(m.por_canal||[]).find(c=>c.canal==='WhatsApp'), ml=(m.por_canal||[]).find(c=>c.canal==='mail');
  const cell=(cls,k,v,unit,d,key,color)=>`<div class="stat ${cls}"><div class="k">${k}</div><div class="v">${v}<small>${unit}</small></div><div class="d">${d}</div>${spark(H.map(t=>t[key]),color)}<div class="foot" style="margin:2px 0 0">last ${H.length} weeks</div></div>`;
  return cell('main','Real hours on your fronts',h1(T.horas_real_foco),'h',`your calendar planned ${h1(T.horas_plan_foco)} h · ${esc((P.declarados||[]).join(', '))}`,'horas_real_foco','#5EE6B0')
    +cell('','Big blocks that happened',T.bloques_reales,'',`${h1(T.horas_bloques_reales)} h in stretches of 90+ min on your fronts`,'horas_bloques_reales','#2FD3C6')
    +cell('','Phone',T.telefono_dia_h==null?'—':h1(T.telefono_dia_h),T.telefono_dia_h==null?'':'h/day',T.pickups_dia==null?'Screen Time not connected':`${T.pickups_dia} pickups a day`,'telefono_dia_h','#FF7A8A')
    +cell('','First reply',dur(T.mediana_respuesta_h),'',`median · WhatsApp ${dur(wa&&wa.mediana_h)} · mail ${dur(ml&&ml.mediana_h)}`,'mediana_respuesta_h','#F2C14E');
}
 
function realVsPlan(P){
  const fr=P.frentes.filter(f=>f.real>=0.3||f.planeado>=0.3), mx=Math.max(1,...fr.map(f=>Math.max(f.real,f.planeado)));
  const dec=fr.filter(f=>f.declarado), rest=fr.filter(f=>!f.declarado);
  const row=(f,i)=>`<div class="rp ${f.declarado?'dec':''}"><span class="nm" title="${esc(f.frente)}">${esc(f.frente)}</span><div class="bars"><i style="width:${f.real/mx*100}%;background:${col(f.frente)}"></i><i class="pl" style="width:${f.planeado/mx*100}%"></i></div><span class="h"><b>${h1(f.real)} h</b> · plan ${h1(f.planeado)}</span></div>`;
  const unknown=P.frentes.filter(f=>['Claude chat','Browser','Phone','Documents'].includes(f.frente)).reduce((a,f)=>a+f.real,0);
  return `<div class="keyrp"><span><i style="background:var(--mint)"></i>real</span><span><i style="background:var(--line-2);height:3px"></i>planned (calendar)</span><span class="mint">● your declared fronts</span></div>
    ${dec.map(row).join('')}<div style="height:10px"></div>${rest.map((f,i)=>row(f,i+dec.length)).join('')}
    ${unknown>=1?`<p class="foot">${h1(unknown)} h is screen time I can't place on a front (Claude chats, unlabeled pages, phone). The Sunday read uses what you told me to place it.</p>`:''}`;
}
 
function replies(P){
  const m=P.mensajes||{}; const ch=(m.por_canal||[]).filter(c=>c.total), fr=(m.por_franja||[]);
  const mx=Math.max(1,...ch.map(c=>c.mediana_h||0),...fr.map(c=>c.mediana_h||0));
  const color=h=>h==null?'var(--faint)':(h<=1?'var(--mint)':(h<=12?'var(--amber)':'var(--red)'));
  const bar=(label,h,sub)=>`<div class="rc"><span>${esc(label)}</span><div class="b"><b style="width:${h==null?0:Math.max(2,Math.sqrt(h/mx)*100)}%;background:${color(h)}"></b></div><span class="v">${dur(h)}<span class="mu" style="font-size:10px"> ${sub}</span></span></div>`;
  return `<div class="chart-t">By app · median</div>${ch.map(c=>bar(c.canal,c.mediana_h,`${c.respondidos}/${c.total}`)).join('')}
    <div class="chart-t">By when they wrote you</div>${fr.map(c=>bar({Night:'Night 0–6',Morning:'Morning 6–12',Afternoon:'Afternoon 12–18',Evening:'Evening 18–24'}[c.franja]||c.franja,c.mediana_h,c.n?`n=${c.n}`:'')).join('')}
    <p class="foot">${m.total||0} messages from people · ${m.sin_respuesta||0} still without your reply${m.whatsapp!=='ok'?' · WhatsApp unreadable this run':''}. LinkedIn has no times yet — it shows up in the ten below.</p>`;
}
function clockBar(h){ const w=h==null?100:Math.min(100,Math.sqrt(h/48)*100), c=h==null?'var(--red)':(h<=1?'var(--mint)':(h<=12?'var(--amber)':'var(--red)')); return `<span class="clock"><b style="width:${w}%;background:${c}"></b></span>`; }
function topTen(P,L){
  if(L&&L.mensajes&&L.mensajes.length)
    return `<div class="sub">Picked in the read of the week of ${esc(L.semana)} — the ones that mattered most for your fronts and your people.</div>`+
      L.mensajes.slice(0,10).map(m=>`<div class="msg"><div><span class="who">${esc(m.de)} <span class="mu">· ${esc(m.canal||'')}</span></span><span class="sj">${esc(m.sobre||m.asunto||'')}</span>${m.por_que?`<span class="why">${esc(m.por_que)}</span>`:''}${clockBar(m.horas)}</div><span class="t ${m.horas==null?'red':''}">${m.horas==null?'not yet':dur(m.horas)}</span></div>`).join('');
  const c=((P.mensajes||{}).candidatos||[]).slice(0,10);
  if(!c.length) return '<p class="empty">Nobody wrote you in this period.</p>';
  return `<div class="sub">Sunday's read picks your ten. Until then: people in your CRM first, then the longest waits.</div>`+
    c.map(m=>`<div class="msg"><div><span class="who">${esc(m.de)} <span class="mu">· ${esc(m.canal)}</span></span><span class="sj">${esc(m.sobre||(m.mensajes>1?m.mensajes+' messages':'1 message'))} · ${esc(m.cuando.slice(5))}</span>${clockBar(m.horas)}</div><span class="t ${m.horas==null?'red':''}">${m.horas==null?'open '+dur(m.abierto_h):dur(m.horas)}</span></div>`).join('');
}
 
function timeline(P){
  const H=isPhone()?16:24, A=7*60, Z=24*60, px=m=>(Math.max(A,Math.min(Z,m))-A)/60*H, hgt=(Z-A)/60*H;
  const today=new Date().toISOString().slice(0,10);
  let ax=''; for(let h=8;h<24;h+=2) ax+=`<span style="top:${px(h*60)}px">${String(h).padStart(2,'0')}</span>`;
  let out=`<div class="week" style="--h:${H}px"><div></div>${P.dias_detalle.map(d=>`<div class="hd ${d.dia===today?'today':''}">${d.nombre.toUpperCase()}<b>${+d.dia.slice(8)}</b></div>`).join('')}
    <div class="ax" style="height:${hgt}px">${ax}</div>`;
  for(const d of P.dias_detalle){
    let c='';
    (d.bloques||[]).forEach(b=>{ c+=`<div class="free" style="top:${px(b.ini)}px;height:${px(b.ini+b.min)-px(b.ini)}px;right:0;border:1px solid ${col(b.frente)};background:none;z-index:2;pointer-events:none" title="Big block · ${esc(b.frente)} · ${b.min} min"></div>`; });
    d.eventos.filter(e=>e.frente!=='Alarms').forEach(e=>{ const t=px(e.ini), h=Math.max(3,px(e.fin)-t);
      c+=`<div class="ev" data-t="${esc(e.titulo)}" data-f="${esc(e.frente)}" style="top:${t}px;height:${h}px;background:${col(e.frente)}" title="${hhmm(e.ini)}–${hhmm(e.fin)} · ${esc(e.titulo)} · ${esc(e.frente)}">${h>=18?esc(e.titulo):''}</div>`; });
    (d.claude||[]).forEach(s=>{ c+=`<div class="cl" style="top:${px(s.ini)}px;height:${Math.max(2,px(s.ini+s.min)-px(s.ini))}px;background:${col(s.frente)}" title="Claude · ${esc(s.frente)} · ${hhmm(s.ini)} · ${s.min} min"></div>`; });
    (d.juntas||[]).forEach(j=>{ c+=`<div class="gr" style="top:${px(j.ini)}px;height:${Math.max(2,px(j.ini+j.min)-px(j.ini))}px" title="${esc(j.titulo)} · ${j.min} min"></div>`; });
    out+=`<div class="col ${d.futuro?'fut':''}" style="height:${hgt}px">${c}</div>`;
  }
  return out+`</div><div class="key"><span><i style="background:#6C8CFF"></i>Calendar (planned), by front</span><span><i style="background:var(--mint)"></i>Claude session, colored by its front</span><span><i style="background:var(--amber)"></i>Meeting (Granola)</span><span><i style="border:1px solid var(--mint)"></i>A big block that happened</span></div>`;
}
 
function thirty(P){
  const days=P.dias_detalle, order=P.frentes.map(f=>f.frente), mx=Math.max(1,...days.map(d=>Object.values(d.real||{}).reduce((a,b)=>a+b,0)));
  const bars=days.map(d=>{ const r=d.real||{}; return `<div class="c" title="${esc(d.dia)} · ${h1(Object.values(r).reduce((a,b)=>a+b,0))} h">${order.filter(f=>r[f]).map(f=>`<i style="height:${r[f]/mx*100}%;background:${col(f)}" title="${esc(d.dia)} · ${esc(f)} ${h1(r[f])} h"></i>`).join('')}</div>`; }).join('');
  const lab=days.map((d,i)=>`<span>${i%5===0?+d.dia.slice(8):''}</span>`).join('');
  const top=P.frentes.filter(f=>f.declarado);
  return `<div class="days">${bars}</div><div class="dl">${lab}</div><div class="key">${top.map(f=>`<span><i style="background:${col(f.frente)}"></i>${esc(f.frente)} ${h1(f.real)} h</span>`).join('')}<span class="mu">${P.bloques.length} big blocks in 30 days</span></div>`;
}
 
function screen(P){
  const p=P.pantalla||{}, eq=p.equipos||{}, names=Object.keys(eq);
  if(!names.length) return `<p class="empty">Screen Time isn't connected on this run.</p>`;
  return `<div class="grid2" style="gap:28px">`+names.map(n=>{ const e=eq[n], mx=Math.max(1,...e.apps.map(a=>a.min));
    return `<div><div class="sub"><b class="t2">${esc(n)}</b> · ${h1(e.minutos/60)} h (${h1(e.por_dia_h)} h a day) · ${n==='iPhone'?`${Math.round(e.despertares/e.dias)} pickups a day`:`${e.despertares} screen wakes`}</div>`+e.apps.map(a=>`<div class="app"><div>${esc(a.app)}<div class="bar"><b style="width:${a.min/mx*100}%"></b></div></div><span class="n">${a.min<60?a.min+' min':h1(a.min/60)+' h'}</span><span class="n">${a.veces}×</span></div>`).join('')+`</div>`; }).join('')+`</div>`;
}
 
const SCI={strong:'Strong science',moderate:'Moderate science',weak:'Weak science'};
function preguntasDeHoy(L){
  const morning=+L.hora.slice(0,2)<12, out=[];
  (L.tarjetas||[]).forEach(t=>(t.preguntas||[]).forEach(q=>{
    if(q.cuando==='morning'&&!morning&&!(L.hoy[q.id]||[]).length) return;
    const n=(L.hoy[q.id]||[]).length, last=(L.hoy[q.id]||[]).slice(-1)[0];
    const recent=last&&((+L.hora.slice(0,2)*60+ +L.hora.slice(3))-(+last.hora.slice(0,2)*60+ +last.hora.slice(3)))<120;
    out.push({q,t,n,done:n>=(q.max_dia||1)||recent,last});
  }));
  return out.slice(0,5);
}
function renderLab(){
  const L=D.lab||{}, dat=L.datos||{}, rs=dat.resumen_sueno||{};
  $('#date').textContent='Questions about you, answered only when your data can';
  const qs=preguntasDeHoy(L);
  const qbox=qs.length?`<div class="box"><div class="legend"><span class="n">Today's questions</span><span class="q">optional · one tap · skip any</span></div><div class="qs-today">${qs.map(({q,n,done,last})=>`<div class="q"><div class="tx">${esc(q.texto)}<small>${done?`answered${last?' at '+esc(last.hora):''} · thanks`:(n?`${n} of ${q.max_dia} today`:'')}</small></div><div class="scale">${q.escala.map((w,i)=>`<button data-q="${esc(q.id)}" data-v="${i+1}" class="${last&&+last.valor===i+1&&done?'done':''}" ${done?'disabled':''}><b>${i+1}</b>${esc(w)}</button>`).join('')}</div></div>`).join('')}</div></div>`:'';
  const ev=id=>((dat.evaluaciones||[]).find(e=>e.id===id)||{});
  const fmt=(v,u)=>v==null?'—':(u==='h'?h1(v)+' h':(u==='min'?Math.round(v)+' min':h1(v)+(u?' '+u:'')));
  const sign=(v,u)=>(v>0?'+':v<0?'−':'')+fmt(Math.abs(v),u);
  const exps=(L.tarjetas||[]);
  const clear=exps.filter(t=>ev(t.id).estado==='claro').length;
  const head=`<div class="read"><div class="kick up"><span>${exps.length} experiments · ${dat.fuentes?dat.fuentes.dias:0} days of your data since ${esc((dat.fuentes&&dat.fuentes.dias_desde)||'')}</span><span>${clear} clear so far</span></div>
    <p class="t2" style="font-size:13px;max-width:90ch">Each one compares your own days with each other — your low third against your high third — with weekday effects removed and the bar raised for testing ${exps.length} things at once. "Clear" means unlikely to be luck; everything else stays open until more days come in. Nothing here asks you anything.</p></div>`;
  const card=t=>{ const e=ev(t.id), lvl=t.ciencia&&t.ciencia.nivel;
    if(t.tipo==='perfil') return `<div class="card"><div class="top"><h3>${esc(t.titulo)}</h3><span class="chip ${esc(lvl)}">${SCI[lvl]||''}</span></div>${t.id==='perfil-teclado'?keyboard(dat.perfil_teclado||{}):t.id==='perfil-terminados'?finishes(dat.perfil_terminados||{}):profile(dat.perfil||{})}${t.cita?`<p class="t2" style="margin-top:10px"><q>${esc(t.cita)}</q> <span class="mu">— ${esc(t.fuente||'')}</span></p>`:''}${t.veredicto?`<div class="verdict">${esc(t.veredicto)}</div>`:''}<div class="cols3" style="grid-template-columns:1fr 1fr"><div><em>What science says</em>${esc(t.ciencia.resumen)}</div><div><em>You</em>${esc(t.tu||'')}</div></div></div>`;
    const st=e.estado==='claro'?['Clear in your data','strong']:(e.estado==='pocos-datos'?['Not enough days yet','weak']:['No clear difference yet','weak']);
    const p=t.predictor||{};
    const rows=(e.resultados||[]).map(r=>{ const c=r.comparacion, mx=Math.max(1e-9,Math.abs(r.media_bajo||0),Math.abs(r.media_alto||0));
      return `<div class="exp-r ${r.claro?'on':''}"><div class="nm">${esc(r.nombre)}</div>
        <div class="db"><span class="lab">${esc(p.bajo||'low')}</span><i style="width:${Math.max(2,(r.media_bajo||0)/mx*100)}%"></i><b>${fmt(r.media_bajo,r.unidad)}</b></div>
        <div class="db hi"><span class="lab">${esc(p.alto||'high')}</span><i style="width:${Math.max(2,(r.media_alto||0)/mx*100)}%"></i><b>${fmt(r.media_alto,r.unidad)}</b></div>
        <div class="df">${c?`Difference, weekday removed: <b>${sign(c.dif,r.unidad)}</b> <span class="mu">(95%: ${sign(c.ic[0],r.unidad)} to ${sign(c.ic[1],r.unidad)})</span>${r.claro?' · <span class="mint">clear</span>':' · <span class="mu">could be chance</span>'}`:'<span class="mu">too few days in a group</span>'}</div></div>`; }).join('');
    return `<div class="card"><div class="top"><h3>${esc(t.titulo)}</h3><span style="display:flex;gap:6px;flex-wrap:wrap"><span class="chip ${st[1]==='strong'?'strong':''}">${st[0]}</span><span class="chip ${esc(lvl)}">${SCI[lvl]||''}</span></span></div>
      <div class="prog-l" style="margin-top:6px">${e.n||0} days · ${esc(p.bajo||'low')}: ${e.n_bajo||0} days (avg ${fmt(e.media_pred_bajo,p.unidad)}) · ${esc(p.alto||'high')}: ${e.n_alto||0} days (avg ${fmt(e.media_pred_alto,p.unidad)})</div>
      ${t.id==='sueno-siguiente-dia'?sleepChart(dat):''}
      <div class="exp">${rows}</div>
      ${t.veredicto?`<div class="verdict">${esc(t.veredicto)}</div>`:''}
      <div class="cols3">${t.cita?`<div><em>Your words</em><q>${esc(t.cita)}</q><br><span class="mu">${esc(t.fuente||'')}</span></div>`:'<div><em>Why test it</em>'+esc(p.nombre||'')+'</div>'}<div><em>What science says</em>${esc(t.ciencia&&t.ciencia.resumen)}</div><div><em>You</em>${esc(t.tu||'')}</div></div></div>`; };
  const ordered=exps.slice().sort((a,b)=>(ev(b.id).estado==='claro')-(ev(a.id).estado==='claro')||(a.tipo==='perfil')-(b.tipo==='perfil'));
  $('#app').innerHTML=qbox+head+ordered.map(card).join('')+`<p class="foot">Nights are screen-off nights (the longest stretch with no phone, Mac, Claude or WhatsApp), not measured sleep. "That day" comparisons can run both ways — a busy day causes both. ${esc(dat.generado?'Counted '+dat.generado.slice(11,16):'')}</p>`;
  document.querySelectorAll('.scale button').forEach(b=>b.onclick=async()=>{ try{ const r=await post('/api/yo/respuesta',{pregunta:b.dataset.q,valor:b.dataset.v}); D.lab.hoy=r.hoy; toast('Saved'); renderLab(); }catch(e){ toast(e.message,true); } });
  document.querySelectorAll('[data-turn]').forEach(b=>b.onclick=async()=>{ const v=$('#turn-'+b.dataset.turn).value; try{ await post('/api/yo/respuesta',{pregunta:'turno-'+b.dataset.turn,valor:v}); toast('Saved — the next read uses it'); }catch(e){ toast(e.message,true); } });
}
function hourBars(vals,fmtv,label,peor){
  const mx=Math.max(1e-9,...vals.map(v=>v||0)), top=vals.map((v,i)=>[v||0,i]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]);
  return `<div class="chart-t">${label}</div><div class="hours">${vals.map((v,i)=>`<div title="${String(i).padStart(2,'0')}:00 · ${v==null?'too few':fmtv(v)}"><i style="height:${(v||0)/mx*100}%;${top.includes(i)?(peor?'background:var(--amber)':'background:var(--mint)'):''}"></i><span>${i%3===0?i:''}</span></div>`).join('')}</div>`;
}
function keyboard(K){
  const h=K.por_hora||[], c=K.noche_vs_dia;
  return hourBars(h.map(x=>x.n),v=>v+' prompts',`Prompts you typed, by hour · ${K.prompts||0} since Sep 23`)
    +hourBars(h.map(x=>x.typo_pct),v=>v+'% typos','Typo rate by hour (hours with 10+ prompts) · lower is sharper · sloppiest hours in amber',true)
    +`<div class="exp"><div class="exp-r"><div class="nm">Same day, night (20:00–02:00) vs day (10:00–18:00) · ${K.dias_pareados||0} days with both</div>
      <div class="db"><span class="lab">day</span><i style="width:${Math.min(100,(K.typo_dia_pct||0)*6)}%"></i><b>${K.typo_dia_pct==null?'—':K.typo_dia_pct+'%'}</b></div>
      <div class="db hi"><span class="lab">night</span><i style="width:${Math.min(100,(K.typo_noche_pct||0)*6)}%"></i><b>${K.typo_noche_pct==null?'—':K.typo_noche_pct+'%'}</b></div>
      <div class="df">${c?`Night minus day: <b>${c.dif>0?'+':''}${c.dif} pts</b> <span class="mu">(95%: ${c.ic[0]} to ${c.ic[1]})</span>`:'<span class="mu">too few days with both</span>'}</div></div></div>`;
}
function finishes(F){
  return hourBars(F.por_hora||[],v=>v+' finished',`Things finished, by hour · ${F.todoist||0} Todoist tasks closed + ${F.cambios||0} changes to your brain`);
}
function profile(P){
  const h=P.por_hora_min||[], mx=Math.max(1,...h), w=P.por_dia_semana_h||[], mw=Math.max(1,...w.map(x=>x||0)), names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const top=h.map((v,i)=>[v,i]).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]).sort((a,b)=>a-b);
  return `<div class="chart-t">Minutes of Claude work on your fronts, by hour of day · peaks ${top.map(x=>String(x).padStart(2,'0')+':00').join(', ')}</div>
    <div class="hours">${h.map((v,i)=>`<div title="${String(i).padStart(2,'0')}:00 · ${v} min"><i style="height:${v/mx*100}%;${top.includes(i)?'background:var(--mint)':''}"></i><span>${i%3===0?i:''}</span></div>`).join('')}</div>
    <div class="chart-t">Real hours on your fronts, average by weekday</div>
    ${w.map((v,i)=>`<div class="rc"><span>${names[i]}</span><div class="b"><b style="width:${(v||0)/mw*100}%;background:${v===mw?'var(--mint)':'#3E8C74'}"></b></div><span class="v">${v==null?'—':h1(v)+' h'}</span></div>`).join('')}`;
}
function sleepChart(dat){
  const ns=(dat.noches||[]).slice(-21); if(!ns.length) return '';
  const H=isPhone()?150:190, A=-360, Z=900;                      
  const m=h=>{ let x=+h.slice(0,2)*60+ +h.slice(3); if(x>=1080) x-=1440; return x; };
  const y=x=>(Math.max(A,Math.min(Z,x))-A)/(Z-A)*H;
  const ax=[-360,-180,0,180,360,540,720].map(x=>`<span style="top:${y(x)}px">${String(((x+1440)%1440)/60).padStart(2,'0')}:00</span>`).join('');
  return `<div class="nights" style="--H:${H}px"><div class="ax">${ax}</div><div class="plot">${ns.map(n=>{ const a=m(n.acostar), b=m(n.despertar); return `<div class="n" title="${esc(n.noche)} · ${esc(n.acostar)} → ${esc(n.despertar)} · ${h1(n.horas)} h"><i class="${n.horas<7?'short':''}" style="top:${y(a)}px;height:${Math.max(3,y(b)-y(a))}px"></i></div>`; }).join('')}</div>
    <div class="lb">${ns.map((n,i)=>`<span>${i%3===0?+n.noche.slice(8):''}</span>`).join('')}</div></div>`;
}
function relabel(ev,titulo,frente){
  const p=$('#pop'), r=ev.target.getBoundingClientRect();
  p.innerHTML=`<div class="ti">${esc(titulo)}<br><span class="mu">now: ${esc(frente)} — belongs to…</span></div><div class="ch">${(D.frentes||[]).filter(f=>f!==frente).map(f=>`<button data-f="${esc(f)}" style="border-left:3px solid ${col(f)}">${esc(f)}</button>`).join('')}</div>`;
  p.style.left=Math.min(innerWidth-290,r.left)+'px'; p.style.top=Math.min(innerHeight-160,r.bottom+6)+'px'; p.classList.add('show');
  p.querySelectorAll('button').forEach(b=>b.onclick=async()=>{ p.classList.remove('show');
    try{ await post('/api/yo/frente',{titulo,frente:b.dataset.f}); toast(`“${titulo}” → ${b.dataset.f}, from now on`); D=await get('/api/yo'); render(); }
    catch(e){ toast(e.message,true); } });
  ev.stopPropagation();
}
document.addEventListener('click',e=>{ if(!e.target.closest('#pop')) $('#pop').classList.remove('show'); });
document.addEventListener('keydown',e=>{ if(e.target.closest('input,textarea')) return;
  if(e.key==='Escape'){ if($('#pop').classList.contains('show')) $('#pop').classList.remove('show'); else location.href="index.html"; }
  const i=PER.findIndex(p=>p[0]===K);
  if(e.key==='ArrowLeft'&&i>0){ K=PER[i-1][0]; render(); } if(e.key==='ArrowRight'&&i<PER.length-1){ K=PER[i+1][0]; render(); } });
load();
