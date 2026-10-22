 
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SAFE=/^(https?:|mailto:|obsidian:)/i;
const Q_ORDER={iu:0,in:1,nu:2,nn:3};
const Q_LABEL={iu:'important · urgent',in:'important · not urgent',nu:'urgent · not important',nn:'neither'};
const S={data:null,view:'room',focus:null,note:null,item:null,busy:false};
let th=null;
 
function toast(m,bad){ const t=$('#toast'); $('#toastMsg').textContent=m; t.classList.toggle('bad',!!bad); t.classList.add('show'); clearTimeout(th); th=setTimeout(()=>t.classList.remove('show'),bad?7000:2200); $('#live').textContent=m; }
function post(url,body){ return fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(async r=>{ let j={}; try{ j=await r.json(); }catch(_){} if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status)); return j; }); }
function get(url){ return fetch(url).then(async r=>{ const j=await r.json(); if(!r.ok||j.error) throw new Error(j.error||('HTTP '+r.status)); return j; }); }
function words(t){ return String(t||'').trim().split(/\s+/).filter(Boolean).length; }
function fmtDate(d){ return d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'}); }
 
function inl(t){
  let h=esc(t);
  h=h.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g,(_,n,a)=>`<span class="t2">${a||n}</span>`);
  h=h.replace(/\[([^\]]+)\]\(([^\s)]+)\)/g,(m,txt,url)=>{ const u=url.replace(/&amp;/g,'&'); return SAFE.test(u)?`<a href="${esc(u)}" target="_blank" rel="noopener">${txt}</a>`:txt; });
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>');
  h=h.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*\w])\*([^*\n]+)\*(?!\w)/g,'$1<em>$2</em>');
  return h; }
function mdTable(rows){ const cells=r=>r.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()); const body=rows.filter(r=>!/^\s*\|?\s*:?-{2,}/.test(r)); if(!body.length) return '';
  const [h,...rest]=body; return '<table><tr>'+cells(h).map(c=>'<th>'+inl(c)+'</th>').join('')+'</tr>'+rest.map(r=>'<tr>'+cells(r).map(c=>'<td>'+inl(c)+'</td>').join('')+'</tr>').join('')+'</table>'; }
function md(t){
  t=String(t||'').replace(/<!--[\s\S]*?-->/g,''); const L=t.split('\n'); let out='', list=null, para=[];
  const flushP=()=>{ if(para.length){ out+='<p>'+inl(para.join(' '))+'</p>'; para=[]; } };
  const closeL=()=>{ if(list){ out+='</'+list+'>'; list=null; } };
  for(let i=0;i<L.length;i++){ const l=L[i]; let m;
    if(/^\s*$/.test(l)){ flushP(); closeL(); continue; }
    if((m=l.match(/^(#{1,4})\s+(.*)/))){ flushP(); closeL(); const n=m[1].length; out+=`<h${n}>${inl(m[2])}</h${n}>`; continue; }
    if(/^\s*(---|\*\*\*)\s*$/.test(l)){ flushP(); closeL(); out+='<hr>'; continue; }
    if((m=l.match(/^>\s?(.*)/))){ flushP(); closeL(); out+='<blockquote>'+inl(m[1])+'</blockquote>'; continue; }
    if(/^\s*\|/.test(l)){ flushP(); closeL(); const rows=[]; while(i<L.length&&/^\s*\|/.test(L[i])) rows.push(L[i++]); i--; out+=mdTable(rows); continue; }
    if((m=l.match(/^\s*[-*]\s+(?:\[(.)\]\s+)?(.*)/))){ flushP(); if(list!=='ul'){ closeL(); out+='<ul>'; list='ul'; } out+='<li>'+(m[1]?(m[1]==='x'?'✓ ':m[1]==='-'?'✕ ':''):'')+inl(m[2])+'</li>'; continue; }
    if((m=l.match(/^\s*\d+[.)]\s+(.*)/))){ flushP(); if(list!=='ol'){ closeL(); out+='<ol>'; list='ol'; } out+='<li>'+inl(m[1])+'</li>'; continue; }
    if(list&&/^\s{2,}\S/.test(l)){ out=out.replace(/<\/li>$/,' '+inl(l.trim())+'</li>'); continue; }
    closeL(); para.push(l.trim()); }
  flushP(); closeL(); return out; }
 
function sections(text){ const out={}; let cur='_'; out[cur]=[]; String(text||'').split('\n').forEach(l=>{ const m=l.match(/^##\s+(.*)/); if(m){ cur=m[1].trim().toLowerCase(); out[cur]=[]; } else out[cur].push(l); }); Object.keys(out).forEach(k=>out[k]=out[k].join('\n').trim()); return out; }
 
function openItems(){ return (S.data?S.data.items:[]).filter(i=>i.estado==='pendiente'); }
function nextPick(){ const o=openItems().slice().sort((a,b)=>(Q_ORDER[a.cuadrante]??4)-(Q_ORDER[b.cuadrante]??4)||a.linea-b.linea); return o[0]||null; }
function segs(total,on,half){ let h='<div class="seg">'; for(let i=0;i<total;i++) h+=`<i class="${i<on?'on':i<on+(half||0)?'half':''}"></i>`; return h+'</div>'; }
function rowHtml(it){ const mt=[]; if(it.suyo_envio) mt.push('<span class="you">you sent it</span>'); if(it.suyo) mt.push('<span class="placed">placed by you</span>'); if(it.fecha) mt.push(esc(it.fecha));
  return `<div class="row${S.focus===it.id?' focus':''}" data-id="${esc(it.id)}" tabindex="0" role="button"><div class="ic">${esc(it.icono||'·')}</div><div><div class="tt">${esc(it.titulo)}</div>${it.por_que?`<div class="why">${esc(it.por_que)}</div>`:''}${mt.length?`<div class="mt">${mt.join('<span class="mu">·</span>')}</div>`:''}</div><div class="time">${esc(it.tiempo||'')}</div></div>`; }
function renderRoom(){
  const d=S.data, open=openItems(), pick=nextPick();
  if(pick&&!open.some(i=>i.id===S.focus)) S.focus=pick.id;
  const byQ={iu:[],in:[],nu:[],nn:[]}; open.forEach(i=>(byQ[i.cuadrante]||byQ.nn).push(i));
  const tracks=(d.pistas||[]).map(p=>{ const on=p.aprendidos||0, half=p.con_fila!=null?Math.max(0,p.con_fila-on):0; return `<div class="pista"><div class="nm"><b>${esc(p.nombre)}</b><span class="mu">${on} of ${p.total} learned${p.con_fila!=null?` · ${p.con_fila} on the board`:''}</span></div>${segs(p.total,on,half)}</div>`; }).join('');
  let html=`<div class="grid"><div>
    <section class="box active"><div class="legend"><span class="n">Your next pick</span></div>
      ${pick?`<div class="next"><div class="t">${esc(pick.icono)} ${esc(pick.titulo)}</div>${pick.por_que?`<div class="why">${esc(pick.por_que)}</div>`:''}<div class="meta"><span>${esc(Q_LABEL[pick.cuadrante]||'')}</span>${pick.tiempo?`<span>${esc(pick.tiempo)}</span>`:''}${pick.suyo_envio?'<span class="mint">you sent it</span>':''}</div><div class="acts"><button class="b big" data-open="${esc(pick.id)}">Open it<span class="kchip" style="color:var(--bg);border-color:rgba(0,0,0,.3)">↵</span></button></div></div>`
            :'<div class="empty">The queue is empty. Say "add this to my study queue" in any chat.</div>'}
    </section>
    <section class="box"><div class="legend"><span class="n">The queue</span><span class="mu">${open.length} open</span></div>
      <div class="sq">${['iu','in','nu','nn'].map(q=>byQ[q].length?`<h3><span class="ax">${q[0]==='i'?'<span class="amb">important</span>':'not important'}</span><span class="ax">×</span><span class="ax">${q[1]==='u'?'<span class="amb">urgent</span>':'not urgent'}</span><span class="mu">${byQ[q].length}</span></h3><div class="rows">${byQ[q].map(rowHtml).join('')}</div>`:'').join('')||'<div class="empty">Nothing open.</div>'}</div>
    </section></div>
    <aside><section class="box"><div class="legend"><span class="n">Your tracks</span></div>${tracks||'<div class="empty">No track yet.</div>'}</section>
    <section class="box"><div class="legend"><span class="n">So far</span></div><div class="counts"><span><b>${d.aprendidos}</b> learned</span><span><b>${d.no_utiles}</b> not useful</span><span><b>${d.abiertos}</b> open</span></div>
      <div class="mu" style="font-size:11px;margin-top:10px">Keys: J K move · ↵ open · L learned · X not useful · R copy the go-deeper prompt · Esc back</div></section></aside></div>`;
  $('#room').innerHTML=html; $('#room').style.display=''; $('#reader').style.display='none'; $('#btnBack').style.display='none'; $('#bar').innerHTML=pick?`<button class="b big" data-open="${esc(pick.id)}">Open your next pick</button>`:''; }
 
function openCard(id){ if(S.busy) return; const it=(S.data.items||[]).find(i=>i.id===id); if(!it) return; S.busy=true; toast('Opening the note…');
  get('/api/estudio/nota?id='+encodeURIComponent(id)).then(n=>{ S.busy=false; S.item=n.fila||it; S.note=n; S.view='before'; renderBefore(); }).catch(e=>{ S.busy=false; toast(e.message,true); }); }
function head(){ const it=S.item; return `<div class="rd-head"><div><div class="kick">${esc(Q_LABEL[it.cuadrante]||'study')}${it.tiempo?' · '+esc(it.tiempo):''}${it.suyo_envio?' · you sent it':''}</div><h2>${esc(it.icono)} ${esc(it.titulo)}</h2>${it.por_que?`<div class="why">${esc(it.por_que)}</div>`:''}<div class="path">${esc(S.note.ruta||'')}</div></div></div>`; }
function showReader(){ $('#room').style.display='none'; $('#reader').style.display='block'; $('#btnBack').style.display=''; window.scrollTo({top:0,behavior:'auto'}); }
function renderBefore(){
  const sec=sections(S.note.texto); const q=sec['think about this first']||'';
  $('#reader').innerHTML=head()+`<section class="box active"><div class="legend"><span class="n">Before reading</span></div><div class="stage">
    <div class="q"><em>Write what you already know or think. Nobody grades it; it goes into the note under your words.</em>${q?md(q):'<p class="mu">This note has no question yet. Write what you expect to find.</p>'}</div>
    <textarea id="before" placeholder="In your words…"></textarea>
    <div class="acts"><button class="b big" data-act="before-save">Save and read<span class="kchip" style="color:var(--bg);border-color:rgba(0,0,0,.3)">⌘↵</span></button><button class="b" data-act="before-skip">Skip, just read</button><span class="hint">Recalling first is what makes the reading stick.</span></div></div></section>`;
  showReader(); $('#bar').innerHTML=`<button class="b big" data-act="before-save">Save and read</button><button class="b" data-act="before-skip">Skip</button>`; setTimeout(()=>$('#before').focus(),30); }
function saveBefore(){ const t=$('#before').value.trim(); if(!t) return renderRead(); if(S.busy) return; S.busy=true;
  post('/api/estudio/pensar',{nota:S.note.ruta,texto:t,cuando:'antes'}).then(()=>{ S.busy=false; S.note.texto=S.note.texto.replace(/(## Lo que pensó Pablo[^\n]*\n)/,'$1\n**Before reading · now**\n'+t+'\n'); toast('Saved into the note.'); renderRead(); }).catch(e=>{ S.busy=false; toast(e.message,true); }); }
function renderRead(){
  S.view='read'; const sec=sections(S.note.texto); const mine=sec['lo que pensó pablo']||'';
  const body=S.note.texto.replace(/^#\s.*\n/m,'');
  $('#reader').innerHTML=head()+`<div class="rd-grid"><article class="note">${md(body)}${S.note.cortada?'<p class="mu">(the note was cut — it is very long)</p>':''}</article>
    <aside class="side"><section class="box active"><div class="legend"><span class="n">When you finish</span></div><div class="acts">
      <button class="b ok" data-act="learned">✓ Learned<span class="kchip">L</span></button>
      <button class="b no" data-act="useless">Not useful<span class="kchip">X</span></button>
      <button class="b go" data-act="deeper" ${S.item.correlo?'':'disabled'}>Copy the go-deeper prompt<span class="kchip">R</span></button>
      <a class="b" href="${esc(S.note.obsidian||'#')}">Open in Obsidian ↗</a></div></section>
      <section class="box"><div class="legend"><span class="n">Your words so far</span></div><div class="mine">${mine?md(mine):'<span class="mu">Nothing yet. They appear here when you write before reading or when you mark it learned.</span>'}</div></section></aside></div>`;
  showReader(); $('#bar').innerHTML=`<button class="b ok" data-act="learned">✓ Learned</button><button class="b no" data-act="useless">Not useful</button><button class="b go" data-act="deeper" ${S.item.correlo?'':'disabled'}>Go deeper</button>`; }
function renderClose(){
  S.view='close'; const terms=S.note.terminos||[];
  $('#reader').innerHTML=head()+`<section class="box active"><div class="legend"><span class="n">In your words</span></div><div class="stage">
    <div class="q"><em>Three to eight lines, your words, your language. What is the mechanism, and where does it break? This is what makes it yours; it goes into the note.</em></div>
    <textarea id="close" placeholder="What I learned…" style="min-height:150px"></textarea>
    <div class="hint" id="closeHint">At least 40 words.</div></div></section>
    <section class="box"><div class="legend"><span class="n">Into your flashcards</span><span class="mu">born for tomorrow · category Study</span></div>
    ${terms.length?`<div class="cards">${terms.map((t,i)=>`<label class="card"><input type="checkbox" data-card="${i}" checked><div><div class="p">${esc(t.p)}</div><div class="r">${esc(t.r)}</div></div></label>`).join('')}</div><div class="hint" style="margin-top:8px">Untick what you don't want to remember. They flip term ↔ meaning in the deck like the rest.</div>`:'<div class="empty">This note has no "The words" section, so no cards. Add your own from Jarvis if you want one.</div>'}
    </section>
    <div class="stage"><div class="acts"><button class="b big" data-act="close-save">Save, add the cards, mark learned<span class="kchip" style="color:var(--bg);border-color:rgba(0,0,0,.3)">⌘↵</span></button><button class="b" data-act="close-back">Back to the note</button></div></div>`;
  showReader(); $('#bar').innerHTML=`<button class="b big" data-act="close-save">Save and mark learned</button><button class="b" data-act="close-back">Back</button>`;
  const ta=$('#close'); ta.oninput=()=>{ const n=words(ta.value); $('#closeHint').textContent=n<40?`At least 40 words · ${n} so far`:`${n} words ✓`; }; setTimeout(()=>ta.focus(),30); document.querySelectorAll('.card').forEach(c=>{ c.querySelector('input').onchange=e=>c.classList.toggle('off',!e.target.checked); }); }
function mark(marca){ const it=S.item; return post('/api/marcar',{trabajo:'estudio',linea:it.linea,crudo:it.crudo,marca,decision_id:'est-'+marca+'-'+it.id+'-'+Date.now()}); }
function doUseless(){ if(S.busy) return; S.busy=true; mark('-').then(()=>{ S.busy=false; toast('Marked not useful. It leaves the board.'); backToRoom(true); }).catch(e=>{ S.busy=false; toast(e.message,true); }); }
function doDeeper(){ if(!S.item.correlo) return toast('This row has no go-deeper prompt.',true); post('/api/correlo',{prompt:S.item.correlo,solo_copiar:true}).then(j=>toast(j.donde==='mac'?'Sent to your Mac.':'The go-deeper prompt is on your clipboard · paste it into Claude.')).catch(e=>toast(e.message,true)); }
function doClose(){
  if(S.busy) return; const t=$('#close').value.trim(); if(words(t)<40){ toast('A few more words — at least 40.',true); $('#close').focus(); return; }
  const picked=[...document.querySelectorAll('[data-card]:checked')].map(c=>S.note.terminos[+c.dataset.card]);
  S.busy=true; toast('Saving…');
  post('/api/estudio/pensar',{nota:S.note.ruta,texto:t,cuando:'aprendido'})
    .then(()=>picked.length?post('/api/estudio/tarjetas',{tarjetas:picked,nota:S.note.ruta}):{hechas:[]})
    .then(j=>mark('x').then(()=>j))
    .then(j=>{ S.busy=false; toast(`Learned · your words are in the note${j.hechas&&j.hechas.length?` · ${j.hechas.length} card${j.hechas.length>1?'s':''} in your deck for tomorrow`:''}.`); backToRoom(true); })
    .catch(e=>{ S.busy=false; toast(e.message+' — nothing was marked; try again.',true); }); }
function backToRoom(reload){ S.view='room'; S.note=null; S.item=null; if(reload) load(); else renderRoom(); window.scrollTo({top:0}); }
 
function load(){ return get('/api/estudio/sala').then(d=>{ S.data=d; if(S.view==='room') renderRoom(); }).catch(e=>{ $('#room').innerHTML=`<p class="red">Couldn't read your queue: ${esc(e.message)}</p>`; }); }
document.addEventListener('click',e=>{
  const o=e.target.closest('[data-open]'); if(o) return openCard(o.dataset.open);
  const r=e.target.closest('.row[data-id]'); if(r){ S.focus=r.dataset.id; return openCard(r.dataset.id); }
  const a=e.target.closest('[data-act]'); if(!a) return; const k=a.dataset.act;
  if(k==='before-save') return saveBefore(); if(k==='before-skip') return renderRead();
  if(k==='learned') return renderClose(); if(k==='useless') return doUseless(); if(k==='deeper') return doDeeper();
  if(k==='close-save') return doClose(); if(k==='close-back') return renderRead(); });
$('#btnBack').onclick=()=>backToRoom(false);
document.addEventListener('keydown',e=>{
  const inBox=/^(TEXTAREA|INPUT)$/.test((e.target.tagName||''));
  if(inBox){ if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){ e.preventDefault(); if(S.view==='before') saveBefore(); else if(S.view==='close') doClose(); } return; }
  if(e.metaKey||e.ctrlKey||e.altKey) return; const k=e.key.toLowerCase();
  if(k==='escape'){ if(S.view==='close') return renderRead(); if(S.view!=='room') return backToRoom(false); return; }
  if(S.view==='room'){ const ids=[...document.querySelectorAll('.row[data-id]')].map(r=>r.dataset.id); if(!ids.length) return; let i=ids.indexOf(S.focus);
    if(k==='j'||k==='arrowdown'){ e.preventDefault(); S.focus=ids[Math.min(ids.length-1,i+1)]; renderRoom(); const el=document.querySelector('.row.focus'); if(el) el.scrollIntoView({block:'nearest'}); }
    else if(k==='k'||k==='arrowup'){ e.preventDefault(); S.focus=ids[Math.max(0,i-1)]; renderRoom(); const el=document.querySelector('.row.focus'); if(el) el.scrollIntoView({block:'nearest'}); }
    else if(k==='enter'){ e.preventDefault(); openCard(S.focus||ids[0]); }
    return; }
  if(S.view==='read'){ if(k==='l') return renderClose(); if(k==='x') return doUseless(); if(k==='r') return doDeeper(); } });
$('#date').textContent=fmtDate(new Date());
load(); setInterval(()=>{ if(S.view==='room'&&!S.busy) load(); },60000);
