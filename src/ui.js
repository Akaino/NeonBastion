const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let save=loadSave(),run=null,paused=false,speed=save.speed||1,endShown=false,selNode='root';
const R=new Renderer($('#cv'));


/* ---------- icons ---------- */
function curIcon(c){const col=CUR[c].col;const p={
  s:`<path d="M10 1.5 16.5 8 11 18.5 3.5 9z" fill="${col}" fill-opacity=".25" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/>`,
  k:`<circle cx="10" cy="10" r="7" fill="${col}" fill-opacity=".18" stroke="${col}" stroke-width="1.6"/><circle cx="10" cy="10" r="2.6" fill="${col}"/>`,
  p:`<path d="M10 1.8 17.1 6v8L10 18.2 2.9 14V6z" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 1.8V18.2M2.9 6 17.1 14" stroke="${col}" stroke-width=".9" opacity=".6"/>`,
  c:`<rect x="3" y="3" width="14" height="14" rx="2" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="1.5"/><path d="M7 3V1M13 3V1M7 19v-2M13 19v-2M3 7H1M3 13H1M19 7h-2M19 13h-2" stroke="${col}" stroke-width="1.4"/><rect x="7" y="7" width="6" height="6" fill="${col}"/>`,
  m:`<path d="M10 1.5 18 6v8l-8 4.5L2 14V6z" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8h8M6 12h8M8 5.5v9M12 5.5v9" stroke="${col}" stroke-width="1" opacity=".8"/>`,
  q:`<ellipse cx="10" cy="10" rx="8.5" ry="3.4" fill="none" stroke="${col}" stroke-width="1.4" transform="rotate(30 10 10)"/><ellipse cx="10" cy="10" rx="8.5" ry="3.4" fill="none" stroke="${col}" stroke-width="1.4" transform="rotate(-30 10 10)"/><circle cx="10" cy="10" r="2.6" fill="${col}"/>`,
  d:`<path d="M10 1 12.3 7.7 19 10 12.3 12.3 10 19 7.7 12.3 1 10 7.7 7.7z" fill="${col}" fill-opacity=".3" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`}[c];
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${p}</svg>`}
const curHTML=(c,v)=>`<span class="cur" title="${CUR[c].name}">${curIcon(c)}<span>${fmtN(v)}</span></span>`;
function glyph(br){const g={b:'<path d="M12 3 20 7.5v9L12 21 4 16.5v-9z"/><path d="M12 8 16 10.3v4.4L12 17 8 14.7v-4.4z"/>',u:'<path d="M12 3 21 20H3z"/><path d="M12 10v5"/>',
  h:'<path d="M5 4h14v7c0 5-3.5 8-7 9.5C8.5 19 5 16 5 11z"/><path d="m9 11 2 2 4-4"/>',f:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  e:'<path d="M12 2 20 12 12 22 4 12z"/><path d="M4 12h16"/>',root:'<path d="M12 2 20.5 7v10L12 22 3.5 17V7z"/><circle cx="12" cy="12" r="3.5"/>'}[br];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${g}</svg>`}

/* ---------- Welten ---------- */
const WORLDS={
  1:{id:1,name:'Neon-Sektor',text:'Helden, Drohnen und Türme verteidigen den Kern gegen endlose Wellen.',nodes:NODES,br:BR,curIds:CUR_IDS,s:()=>save,st:()=>stats(save),
     with:o=>stats({...save,...o}),towerIds:TOWER_IDS,ts:()=>save.towers,unlock:id=>TOWERS[id].unlock,tlvl:towerLvlCost,Run:Run,col:'#3df5ff'},
  2:{id:2,name:'Gitterfestung',text:'Nur Türme. Jede Welle kommt aus einer angekündigten Richtung, dazwischen baust du um.',nodes:NODES2,br:BR2,curIds:CUR_IDS2,s:()=>save.w2,st:()=>stats2(save),
     with:o=>stats2({...save,w2:{...save.w2,...o}}),towerIds:TOWER_IDS2,ts:()=>save.w2.towers,unlock:id=>T2_UNLOCK[id],tlvl:towerLvlCost2,Run:Run2,col:'#ff8a3d'}};
let W=WORLDS[save.world===2&&w2Unlocked(save)?2:1];
function setWorld(id){save.world=id;W=WORLDS[id];persist();R.setTheme(id);document.documentElement.dataset.wtheme=id;selNode='root'}
/* ---------- helpers ---------- */
const persist=()=>Store.save(save);
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600)}
function banner(t,sub){const b=$('#banner');b.querySelector('b').textContent=t;b.querySelector('span').textContent=sub||'';b.classList.remove('show');void b.offsetWidth;b.classList.add('show')}
function show(id){for(const s of['hub','hud','tree','heroes','nova','towers','worlds'])$('#'+s).hidden=s!==id;if(id!=='hud'){$('#pause').hidden=true;$('#end').hidden=true}}
function renderCurs(){const ws=W.s(),h=W.curIds.map(c=>curHTML(c,ws.cur[c])).join('')+(W.id===1&&(save.nova||save.q)?curHTML('q',save.q):'');$('#hubCur').innerHTML=h;$$('[data-cur]').forEach(e=>e.innerHTML=h)}
function canPay(c,a){return (W.s().cur[c]||0)>=a}
function pay(c,a,btn){if(!canPay(c,a)){Snd.play('no');if(btn){btn.classList.remove('shake');void btn.offsetWidth;btn.classList.add('shake')}
    toast(`Dir fehlen ${fmtN(a-(W.s().cur[c]||0))} ${CUR[c].name}`);return false}
  W.s().cur[c]-=a;Snd.play('buy');persist();return true}
function costBtn(label,c,a){return `${label}<small>${curIcon(c)}${fmtN(a)}</small>`}

/* ---------- Startwelle wählen ---------- */
function startStepper(){const S=stats(save);return `<div class="stepper"><span>Gewählte Startwelle</span><button class="btn icon sm" data-sw="-1" aria-label="Früher starten">−</button><b>${S.startWave}</b><button class="btn icon sm" data-sw="1" aria-label="Später starten">+</button><small>max. ${S.startMax}</small></div>`}
function bindStepper(){$$('[data-sw]').forEach(b=>b.onclick=()=>{const S=stats(save);let v=S.startWave+(+b.dataset.sw)*2;v=clamp(v,1,S.startMax);save.startPick=v>=S.startMax?0:v;persist();
  if(!$('#tree').hidden)renderSheet();renderHub()})}
/* ---------- hub ---------- */
function renderHub(){renderCurs();const w1=W.id===1;$('#hubWorld').textContent=W.name;$('#bHeroes').hidden=!w1;$('#bWorlds').hidden=!w2Unlocked(save);
  const treeAff=Object.values(W.nodes).some(n=>n.id!=='root'&&nodeState(n).aff),heroAff=w1&&HERO_IDS.some(id=>!save.heroes[id].u&&canPay(...HEROES[id].unlock));
  $('#bTree').classList.toggle('ping',treeAff);$('#bHeroes').classList.toggle('ping',heroAff);
  {const S=stats(save),hs=$('#hubStart');if(w1&&S.startMax>1){hs.hidden=false;hs.innerHTML=startStepper();bindStepper()}else hs.hidden=true}
  $('#bTowers').classList.toggle('ping',W.towerIds.some(id=>!W.ts()[id].u&&W.unlock(id)&&canPay(...W.unlock(id))));
  const nb=$('#bNova'),qg=quantaFor(save.cycleBest,save);nb.hidden=!w1||!(save.best>=20||save.nova>0);
  nb.innerHTML=qg>0?`Supernova<small>${curIcon('q')} +${fmtN(qg)} Quanten möglich</small>`:`Supernova<small>ab Welle ${NOVA_MIN} in diesem Zyklus</small>`;nb.classList.toggle('ping',qg>0&&Object.values(PRES).some(p=>save.q+qg>=presCost(p,save.pr[p.id]||0)));const bw=W.s().best;$('#hubBest').textContent=bw?`Rekord: Welle ${bw}`:W.text;
}
function goHub(){const wasRun=!!run;run=null;paused=false;show('hub');renderHub();
  if(wasRun&&W.id===1&&!HERO_IDS.some(id=>save.heroes[id].u)&&canPay(...HEROES.klinge.unlock))setTimeout(()=>toast('Du kannst jetzt deinen ersten Helden freischalten'),400)}
function setVol(k,v){save[k]=+v;$('#'+k+'V').textContent=v>0?v+' %':'Aus';Snd.init();Snd.vol();clearTimeout(setVol.t);setVol.t=setTimeout(persist,300)}
$('#volMus').oninput=e=>setVol('volMus',e.target.value);
$('#volSfx').oninput=e=>{setVol('volSfx',e.target.value);const n=Date.now();if(!setVol.p||n-setVol.p>180){setVol.p=n;Snd.play(['tap','shoot','turret','kill'][Math.floor(n/180)%4])}};
function openSettings(){$('#settings').hidden=false;for(const k of['volMus','volSfx']){$('#'+k).value=save[k];$('#'+k+'V').textContent=save[k]>0?save[k]+' %':'Aus'}$('#bReset').textContent='Spielstand zurücksetzen';$('#bReset').dataset.arm='';$('#bReset').hidden=!!run;$('#resetInfo').hidden=!!run;devTaps=0;$('#devCode').hidden=true;updW2Btn()}
$('#bSet').onclick=openSettings;$('#bPSet').onclick=openSettings;
$('#bSetClose').onclick=()=>{$('#settings').hidden=true};
$('#bW2Test').onclick=()=>{save.w2test=!save.w2test;if(!save.w2test&&W.id===2&&!w2Unlocked(save))setWorld(1);persist();updW2Btn();renderHub()};
function updW2Btn(){const b=$('#bW2Test');b.textContent=save.w2test?'Test-Freischaltung Gitterfestung: an':'Gitterfestung testweise freischalten';b.hidden=!save.dev||!!run||(save.best||0)>=100;$('#bDevOff').hidden=!save.dev||!!run}
/* ---------- Entwicklermodus: 7× auf die Version tippen, dann Code eingeben ---------- */
let devTaps=0,devT=0;const devHash=s=>{let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return h};
$('#setVer').onclick=()=>{if(run||save.dev)return;const n=Date.now();devTaps=n-devT<2000?devTaps+1:1;devT=n;if(devTaps>=7){devTaps=0;const d=$('#devCode');d.classList.remove('shake');d.hidden=false;$('#devIn').value='';$('#devIn').focus()}};
function devTry(){const d=$('#devCode');if(d.hidden)return;if(devHash($('#devIn').value.trim())===2085854505){d.hidden=true;save.dev=true;persist();updW2Btn();Snd.play('buy');toast('Entwicklermodus aktiv')}
  else{Snd.play('no');toast('Falscher Code');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');setTimeout(()=>{d.hidden=true;d.classList.remove('shake')},350)}}
$('#bDevOk').onclick=devTry;$('#devIn').addEventListener('keydown',e=>{if(e.key==='Enter')devTry()});
$('#bDevOff').onclick=()=>{save.dev=false;persist();updW2Btn();toast('Entwicklermodus beendet')};
$('#bReset').onclick=()=>{const b=$('#bReset');if(!b.dataset.arm){b.dataset.arm='1';b.textContent='Wirklich alles löschen? Nochmal tippen';Snd.play('no');setTimeout(()=>{if(b.dataset.arm){b.dataset.arm='';b.textContent='Spielstand zurücksetzen'}},4000);return}
  save=freshSave();setWorld(1);persist();$('#settings').hidden=true;goHub();toast('Spielstand wurde zurückgesetzt')};
$('#bNova').onclick=()=>{show('nova');renderNova()};
$('#bWorlds').onclick=()=>{show('worlds');renderWorlds()};
function renderWorlds(){const un2=w2Unlocked(save),b1=w2BonusForW1(save),b2=1+.01*(save.best||0);
  $('#wlist').innerHTML=[1,2].map(id=>{const Wd=WORLDS[id],ok=id===1||un2,act=W.id===id,best=id===1?save.best:save.w2.best;
    const bonus=id===1?`Bonus aus der Gitterfestung: ×${fmtD(b1,2)} Schaden`:`Bonus aus dem Neon-Sektor: ×${fmtD(b2,2)} Turmschaden`;
    return `<article class="hcard world ${ok?'':'lock'}" style="--c:${Wd.col}"><h3>${Wd.name}</h3><p>${Wd.text}</p>
      <div class="cmp" style="--c:${Wd.col}"><div><span>Rekord</span><b>Welle ${best||0}</b></div><div><span>Weltenbonus</span><b>${bonus.split(': ')[1]}</b></div></div>
      <p class="trayinfo">${bonus.split(': ')[0]}. ${id===1?'Jede Welle Rekord in der Gitterfestung gibt hier +2 % Schaden.':'Jede Welle Rekord im Neon-Sektor gibt hier +1 % Turmschaden.'}</p>
      ${ok?(act?'<button class="btn" disabled>Aktive Welt</button>':`<button class="btn big" data-world="${id}" style="--c:${Wd.col}">Welt betreten</button>`):'<button class="btn poor" disabled>Freischaltung bei Welle 100 im Neon-Sektor</button>'}</article>`}).join('');
  $$('[data-world]').forEach(b=>b.onclick=()=>{setWorld(+b.dataset.world);Snd.play('nova');goHub();toast(`Willkommen in: ${W.name}`)})}
$('#bTree').onclick=()=>{show('tree');renderTree();treeHome()};
$('#bHeroes').onclick=()=>{show('heroes');renderHeroes()};
$$('[data-back]').forEach(b=>b.onclick=goHub);

/* ---------- run ---------- */
function startRun(){Snd.init();const S=stats(save);save.team=save.team.filter(id=>save.heroes[id]&&save.heroes[id].u).slice(0,S.slots);
  $('#bBuild').dataset.init='';$('#phaseBar').dataset.key='';
  run=new W.Run(save,{banner,sfx:n=>Snd.play(n)});if(W.id===2)save.w2.runs=(save.w2.runs||0)+1;run.hw=R.hwe;run.hh=R.hhe;paused=false;endShown=false;endBuild();
  save.runs++;persist();show('hud');buildChips();$('#bSpeed').textContent=speed+'×';
  if(save.runs===1)setTimeout(()=>toast('Tippe auf Gegner, um selbst Schaden zu machen'),2400);
  else if(W.id===1&&!save.team.length&&HERO_IDS.some(id=>save.heroes[id].u))toast('Kein Held eingesetzt. Das geht im Heldenmenü.')}
$('#bStart').onclick=startRun;
$('#bPause').onclick=()=>{if(run&&!run.over){endBuild();paused=true;$('#pause').hidden=false}};
$('#bResume').onclick=()=>{paused=false;$('#pause').hidden=true};
$('#bQuit').onclick=()=>{paused=false;$('#pause').hidden=true;if(run&&!run.over){run.quit=true;run.end()}};
$('#bSpeed').onclick=()=>{speed=speed===1?2:speed===2?4:speed===4?8:1;save.speed=speed;persist();$('#bSpeed').textContent=speed+'×'};
$('#bBack').onclick=goHub;
function showEnd(){endShown=true;$('#eTitle').textContent=run.quit?'Run beendet':'Basis zerstört';const g=run.gain,ws=W.s(),prev=ws.best||0;for(const c of W.curIds)ws.cur[c]+=Math.floor(g[c]||0);
  ws.best=Math.max(prev,run.w);ws.cycleBest=Math.max(ws.cycleBest||0,run.w);save.pending=null;persist();
  if(W.id===1&&prev<100&&run.w>=100)setTimeout(()=>toast('Neue Welt freigeschaltet: Gitterfestung'),800);
  $('#eWave').innerHTML=`<p style="margin:0;font-size:18px">Welle <b>${run.w}</b> erreicht</p>`+(run.w>prev&&prev>0?'<p class="rec" style="margin:4px 0 0">Neuer Rekord</p>':'')+`<p style="margin:4px 0 0;color:var(--muted);font-size:13px">${fmtN(run.kills)} Gegner besiegt</p>`;
  $('#eGain').innerHTML=W.curIds.map(c=>`<div class="${Math.floor(g[c])?'':'zero'}"><span class="cur">${curIcon(c)}<span>${CUR[c].name}<small>${CUR_SRC[c]}</small></span></span><b>+${fmtN(g[c])}</b></div>`).join('');
  $('#end').hidden=false}
function buildChips(){$('#hHeroes').innerHTML=run.heroes.map((h,i)=>`<div class="hchip" data-i="${i}" style="--c:${h.col}"><div class="ring" style="--p:0"><b>${h.d.name[0]}</b></div><div class="hb"><i></i></div>${h.d.name}</div>`).join('')}
function updHud(){const b=run.base,f=b.hp/b.max;$('#hWave').textContent=`Welle ${Math.max(1,run.w)}`;
  const hp=$('#hHp');hp.style.width=(f*100).toFixed(1)+'%';hp.classList.toggle('ok',f>.3);
  $('#hSh').style.width=b.shMax>0?(b.sh/b.shMax*100).toFixed(1)+'%':'0';$('#hHpT').textContent=`${fmtN(Math.ceil(b.hp))} / ${fmtN(b.max)}`+(b.ov>0?`  +${fmtN(b.ov)}`:'');
  $('#hGain').innerHTML=W.curIds.filter((c,i)=>i===0||run.gain[c]>=1).map(c=>curHTML(c,run.gain[c])).join('');
  updPhase();
  $$('#hHeroes .hchip').forEach(el=>{const h=run.heroes[+el.dataset.i];el.classList.toggle('dead',h.dead>0);
    el.querySelector('.ring').style.setProperty('--p',h.dead>0?0:Math.round(100*(1-Math.max(0,h.abT)/h.cd)));
    el.querySelector('b').textContent=h.dead>0?Math.ceil(h.dead):h.d.name[0];el.querySelector('.hb i').style.width=(h.hp/h.max*100)+'%'});
  const bo=run.en.find(e=>e.boss),bb=$('#bossBar');bb.hidden=!bo;if(bo){bb.querySelector('b').textContent='Boss · '+bo.name;bb.querySelector('i').style.width=(Math.max(0,bo.hp/bo.max)*100).toFixed(1)+'%';bb.querySelector('span').textContent=fmtN(Math.max(0,bo.hp))}
  const co=$('#combo');if(run.S.combo&&run.combo>=2&&run.comboT>0){co.textContent='Combo ×'+run.combo;co.style.opacity=1}else co.style.opacity=0}

function musicState(){if(run.over){Music.set({menu:true,E:0,W:0,danger:0,boss:false,tr:0});return}
  const b=run.base,hp=b.hp/b.max;let near=0,boss=false;for(const e of run.en){if(e.boss)boss=true;if(e.x*e.x+e.y*e.y<120*120)near++}
  const danger=clamp(Math.max((.6-hp)/.5,near/18),0,1),w=Math.max(1,run.w);
  Music.set({menu:false,W:clamp((w-1)/35,0,1),E:clamp(clamp((w-1)/35,0,1)+(boss?.2:0),0,1),danger,boss,tr:[0,2,3,5,7][Math.min(4,Math.floor(w/10))]+(W.id===2?5:0)})}
function updPhase(){const pb=$('#phaseBar');if(!run||run.world!==2||run.over){pb.hidden=true;return}pb.hidden=false;const p=run.preview,T=['swarm','brute','shooter','boss'],N={swarm:'Schwärmer',brute:'Brecher',shooter:'Schützen',boss:'Boss'};
  const dirName=a=>{const d=((a*180/PI)+360+90)%360;return['Norden','Nordosten','Osten','Südosten','Süden','Südwesten','Westen','Nordwesten'][Math.round(d/45)%8]};
  const comp=T.filter(t=>p.types[t]).map(t=>t==='boss'?'Boss':`${p.types[t]} ${N[t]}`).join(', ');
  const key=run.phase+':'+p.w;
  if(pb.dataset.key!==key){pb.dataset.key=key;
    if(run.phase==='build'){pb.className='build';pb.innerHTML=`<div><b class="pt"></b><span>Welle ${p.w} aus ${run.dirs.map(dirName).join(' und ')}: ${comp}</span><span class="pm"></span></div><button class="btn" id="bReady" style="--c:#ff8a3d">Bereit</button>`;
      $('#bReady').onclick=()=>{if(run&&run.phase==='build'){endBuild();run.startFight()}}}
    else{pb.className='fight';pb.innerHTML=`<div><span class="pf"></span></div>`}}
  const set=(s,t)=>{const el=pb.querySelector(s);if(el&&el.textContent!==t)el.textContent=t};
  if(run.phase==='build'){set('.pt',`Umbauphase · ${Math.ceil(Math.max(0,run.buildT))} s`);set('.pm',`Umbaupunkte: ${run.moves}`)}
  else set('.pf',`Welle ${p.w} läuft · ${run.en.length+run.queue.length} Gegner übrig`)}
/* ---------- input ---------- */
$('#cv').addEventListener('pointerdown',e=>{if(!run||paused||run.over||$('#hud').hidden)return;e.preventDefault();
  if(trayOpen||towerSel){endBuild();return}if(buildSel||moveT){buildDown=true;ghostAt(e);return}const [x,y]=screenToWorld(e);const T=towerAt(x,y);if(T){openTower(T);return}run.tap(x,y)});
addEventListener('resize',()=>{R.resize();if(run){run.hw=R.hwe;run.hh=R.hhe}if(!$('#tree').hidden)treeHome()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(Snd.ctx)Snd.ctx.resume().catch(()=>{});return}Snd.suspend();{if(run&&!run.over){paused=true;$('#pause').hidden=false;save.pending={world:W.id,g:Object.fromEntries(W.curIds.map(c=>[c,Math.floor(run.gain[c]||0)])),w:run.w}}persist()}});
addEventListener('contextmenu',e=>e.preventDefault());


/* ---------- before/after previews ---------- */
const fv=v=>typeof v==='string'?v:v>=100?fmtN(v):fmtD(v,Math.abs(v-Math.round(v))<.005?0:1);
const FMT={n:fv,i:v=>String(Math.round(v)),s:v=>v?fmtD(v,1)+' s':'–',x:v=>'×'+fmtD(v,2),pct:v=>fmtD(v,0)+' %',t:v=>v};
const PREV={
 b1:[['Basisleben',S=>S.baseHp,'n']],b2a:[['Schild',S=>S.baseHp*S.shieldPct,'n']],b2b:[['Reparatur pro Sekunde',S=>S.baseHp*S.regen,'n']],
 b3a:[['Geschütztürme',S=>S.turrets,'i'],['Schaden pro Schuss',S=>S.turrets?S.turretDmg:0,'n']],
 b3b:[['Schockwellen-Schaden',S=>S.pulse?S.pulseDmg:0,'n'],['Abklingzeit',S=>S.pulse?S.pulseCd:0,'s']],
 b4a:[['Geschützschaden',S=>S.turretDmg,'n']],b4b:[['Abklingzeit der Schockwelle',S=>S.pulseCd,'s']],
 b5:[['Basisleben',S=>S.baseHp,'n'],['Geschützreichweite',S=>S.turretRange,'i']],
 u1:[['Drohnen',S=>S.drones,'i']],u2a:[['Drohnenschaden',S=>S.droneDmg,'n']],u2b:[['Bauzeit pro Drohne',S=>S.droneSpawn,'s']],
 u3a:[['Drohnenleben',S=>S.droneHp,'n']],u3b:[['Drohnen',S=>S.drones,'i']],u4:[['Drohnenreichweite',S=>S.droneRange,'i'],['Waffe',S=>S.droneBeam?'Strahl':'Kanone','t']],
 u5:[['Schwere Kampfschiffe',S=>S.mother?'Ja':'Nein','t']],
 h1:[['Heldenschaden',S=>S.heroDmg,'x']],h2a:[['Heldenplätze',S=>S.slots,'i']],h2b:[['Heldenleben',S=>S.heroHp,'x']],h3a:[['Heldenplätze',S=>S.slots,'i']],
 h3b:[['Wiederbelebung',S=>S.revive,'s']],h4:[['Abklingzeit der Fähigkeiten',S=>S.abilityCd,'x']],h5:[['Heldenplätze',S=>S.slots,'i']],
 f1:[['Tippschaden',S=>S.tapDmg,'n']],f2a:[['Kritische Tipps',S=>S.tapCrit*100,'pct']],f2b:[['Tippradius',S=>S.tapR,'i']],
 f3a:[['Bonus pro Combo-Stufe',S=>S.combo*100,'pct'],['Schaden bei voller Combo',S=>S.tapDmg*(1+S.combo*25),'n']],
 f3b:[['Schaden der Überladung',S=>S.overload?S.tapDmg*(4+2*S.overload):0,'n']],f4:[['Zusätzliche Kettenziele',S=>S.chain,'i']],f5:[['Tippschaden',S=>S.tapDmg,'n']],
 e1:[['Splitter',S=>S.gS*S.gAll,'x']],e2a:[['Kerne',S=>S.gK*S.gAll,'x']],e2b:[['Startwelle',S=>S.startWave,'i']],e3a:[['Prismen',S=>S.gP*S.gAll,'x']],
 e3b:[['Elite-Gegner',S=>S.elite,'x']],
 b4c:[['Feuerrate der Geschütze',S=>S.turretRate,'x']],b5b:[['Radius der Schockwelle',S=>S.pulseR,'i']],b6:[['Basisleben',S=>S.baseHp,'n']],
 b7a:[['Schildaufladung',S=>S.shRegen,'x'],['Schild',S=>S.baseHp*S.shieldPct,'n']],b7b:[['Geschützschaden',S=>S.turretDmg,'n']],b8:[['Basisleben',S=>S.baseHp,'n']],b9:[['Erlittener Schaden',S=>S.dmgTaken*100,'pct']],
 u3c:[['Feuerrate der Drohnen',S=>S.droneRate,'x']],u4b:[['Bonus pro aktiver Drohne',S=>S.swarmInt*100,'pct']],u6:[['Drohnenschaden',S=>S.droneDmg,'n']],u7a:[['Drohnen',S=>S.drones,'i']],
 u7b:[['Drohnenschaden',S=>S.droneDmg,'n'],['Drohnenleben',S=>S.droneHp,'n']],u8:[['Drohnenschaden',S=>S.droneDmg,'n']],u9:[['Feuerrate der Drohnen',S=>S.droneRate,'x']],
 h3c:[['Angriffstempo',S=>S.heroRate,'x']],h4b:[['Krit-Chance der Helden',S=>S.heroCrit*100,'pct']],h6:[['Heldenschaden',S=>S.heroDmg,'x']],h7a:[['Heldenleben',S=>S.heroHp,'x']],
 h7b:[['Heldenschaden',S=>S.heroDmg,'x']],h8:[['Heldenschaden',S=>S.heroDmg,'x']],h9:[['Stärke der Fähigkeiten',S=>S.abilPow,'x']],
 f2c:[['Autofeuer pro Sekunde',S=>S.autoRate,'n']],f3c:[['Autofeuer-Schaden',S=>S.autoDmg,'x'],['Zielt auf Gruppen',S=>S.autoAim?'Ja':'Nein','t']],f4b:[['Tippschaden',S=>S.tapDmg,'n']],
 f6:[['Tippschaden',S=>S.tapDmg,'n']],f7:[['Autofeuer pro Sekunde',S=>S.autoRate,'n']],f8:[['Weltenbrecher alle … Tipps',S=>S.megaTap||'–','t']],
 e3c:[['Splitter',S=>S.gS*S.gAll,'x']],e4b:[['Prisma-Chance pro Elite',S=>fmtD(S.prismChance*100,1)+' %','t']],e6:[['Splitter',S=>S.gS*S.gAll,'x'],['Kerne',S=>S.gK*S.gAll,'x']],
 e7:[['Kerne',S=>S.gK*S.gAll,'x']],e7b:[['Quanten',S=>S.qMul,'x']],e4:[['Sternenstaub pro Meilenstein',S=>(1+S.gD)*S.gAll,'i']],e5:[['Alle Belohnungen',S=>S.gAll,'x']]};
const PREV2={k1:[['Kernleben',S=>S.baseHp,'n']],k2a:[['Schild',S=>S.baseHp*S.shieldPct,'n']],k2b:[['Reparatur pro Sekunde',S=>S.baseHp*S.regen,'n']],k3:[['Kerngeschütz-Schaden',S=>S.turretDmg,'n']],
 k4:[['Kernleben',S=>S.baseHp,'n']],k5:[['Erlittener Schaden',S=>S.dmgTaken*100,'pct']],w1:[['Turmschaden',S=>S.tDmg,'x']],w2a:[['Laserschaden',S=>S.tDmg*S.laserDmg,'x']],w2b:[['Raketenschaden',S=>S.tDmg*S.rocketDmg,'x']],
 w2c:[['Tesla-Schaden',S=>S.tDmg*S.teslaDmg,'x']],w3:[['Feuerrate',S=>S.tRate,'x']],w4:[['Turmschaden',S=>S.tDmg,'x']],w5:[['Reichweite',S=>S.tRange,'x']],u1:[['Radius Unterstützung',S=>S.supR,'x']],
 u2a:[['Kombinationsstärke',S=>S.comboMul,'x']],u2b:[['Einfrierdauer',S=>S.freezeMul,'x']],u3:[['Gift und Säure',S=>S.poisonMul,'x']],u4:[['Wirkung Unterstützung',S=>S.supPow,'x']],
 l1:[['Energie aus Gegnern',S=>S.energyMul,'x']],l2a:[['Umbaupunkte',S=>S.moves,'i']],l2b:[['Bauplätze',S=>S.slots2,'i']],l2c:[['Umbauphase',S=>S.buildTime,'s']],l3:[['Startenergie',S=>S.startEnergy,'i']],
 l4:[['Schaltkreise',S=>S.gC,'x']],l5:[['Matrixchips',S=>S.gM,'x']]};
function cmpRows(rows,col){return `<div class="cmp" style="--c:${col}">`+rows.map(([lab,a,b])=>{const same=b===undefined||a===b;
  return `<div><span>${lab}</span><b>${a}${same?'':`<i aria-hidden="true">→</i><em>${b}</em>`}</b></div>`}).join('')+'</div>'}

/* ---------- skill tree ---------- */
const tv=$('#tv'),tw=$('#tw');let tz=1,tx=0,ty=0;
function applyT(){tw.style.transform=`translate(${tx}px,${ty}px) scale(${tz})`}
function treeHome(){const r=tv.getBoundingClientRect();tz=clamp(Math.min(r.width,r.height)/760,.5,1);tx=r.width/2;ty=r.height/2;applyT()}
function zoomAt(f,cx,cy){const nz=clamp(tz*f,.3,1.8);f=nz/tz;tx=cx-(cx-tx)*f;ty=cy-(cy-ty)*f;tz=nz;applyT()}
function nodeState(n){if(n.id==='root')return{l:1,cls:'root max'};const N=W.s().nodes,l=N[n.id]||0,lock=!((N[n.parent]||0)>0),max=l>=n.max;
  const aff=!lock&&!max&&canPay(n.cur,nodeCost(n,l));return{l,lock,max,aff,cls:[lock?'locked':'',l>0?'owned':'',max?'max':'',aff?'afford':''].join(' ')}}
function renderTree(){renderCurs();let lines='';const NS=W.nodes,BRS=W.br,SN=W.s().nodes;
  for(const n of Object.values(NS)){if(!n.parent)continue;const p=NS[n.parent],on=(SN[n.id]||0)>0,col=BRS[n.br].col;
    lines+=`<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" stroke="${col}" stroke-width="${on?3:2}" stroke-opacity="${on?.9:.22}" ${on?`style="filter:drop-shadow(0 0 4px ${col})"`:'stroke-dasharray="5 6"'}/>`}
  let html=`<svg width="1600" height="1600" viewBox="-800 -800 1600 1600" aria-hidden="true">${lines}</svg>`;
  for(const n of Object.values(NS)){const st=nodeState(n),col=n.br?BRS[n.br].col:W.col;
    if(st.lock){html+=`<button class="node ${st.cls}${selNode===n.id?' sel':''}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;--c:${col}" aria-label="Verborgener Knoten"><span class="q">?</span></button>`;continue}
    html+=`<button class="node ${st.cls}${selNode===n.id?' sel':''}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;--c:${col}" aria-label="${n.name}">${glyph(W.id===2&&n.br?{k:'b',w:'f',u:'h',l:'e'}[n.br]:n.br||'root')}${n.id!=='root'?`<span class="lv">${st.l}/${n.max>=999?'∞':n.max}</span>`:''}<span class="nm">${n.name}</span></button>`}
  tw.innerHTML=html;renderSheet()}
function renderSheet(){const n=W.nodes[selNode]||W.nodes.root,sh=$('#sheet'),SN=W.s().nodes;
  if(n.id==='root'){sh.innerHTML=`<h3>Kern <span class="tag" style="--c:#3df5ff">Ursprung</span></h3><p>Tippe auf einen Knoten, um ihn anzusehen. Ziehen verschiebt den Baum, mit zwei Fingern zoomst du.</p><p>${W.id===1?'Innen kosten Upgrades Splitter, nach außen Kerne, Prismen und ganz außen Sternenstaub.':'Innen kosten Upgrades Schaltkreise, nach außen Matrixchips.'}</p><div class="srcs">${W.curIds.map(c=>`<div>${curIcon(c)}<span><b>${CUR[c].name}</b> ${CUR_SRC[c]}</span></div>`).join('')}</div>`.replace(/<svg /g,'<svg style="width:14px;height:14px;vertical-align:-2px" ');return}
  const st=nodeState(n),br=W.br[n.br];
  if(st.lock){const par=W.nodes[n.parent],pv=par.parent===null||(SN[par.parent]||0)>0;
    sh.innerHTML=`<h3>Verborgen <span class="tag" style="--c:${br.col}">${br.name}</span></h3><p>${pv?`Schalte zuerst „${par.name}“ frei, um diesen Knoten aufzudecken.`:'Dieser Knoten liegt noch tiefer im Dunkeln. Arbeite dich den Ast entlang vor.'}</p>`;return}
  let h=`<h3>${n.name} <span class="tag" style="--c:${br.col}">${br.name}</span></h3><p>Stufe <b>${st.l} / ${n.max>=999?'∞':n.max}</b>${st.max?' · maximal':''}</p>`;
  h+=`<p>${st.max?'':'Nach dem Kauf: '}<b>${n.fx(st.max?st.l:st.l+1)}</b></p>`;
  const S0=W.st(),S1=st.max?null:W.with({nodes:{...SN,[n.id]:st.l+1}});
  h+=cmpRows([[ 'Stufe',`${st.l}`,st.max?undefined:`${st.l+1}`],...((W.id===1?PREV:PREV2)[n.id]||[]).map(([lab,f,t])=>[lab,FMT[t](f(S0)),S1?FMT[t](f(S1)):undefined])],br.col);
  if(st.lock)h+=`<p class="hint" style="text-align:left">Schalte zuerst „${W.nodes[n.parent].name}“ frei.</p>`;
  else if(st.max)h+=`<div class="act"><button class="btn" disabled style="--c:${br.col}">Maximal ausgebaut</button></div>`;
  else{const c=nodeCost(n,st.l);h+=`<div class="act"><button class="btn ${st.aff?'':'poor'}" id="bBuy" style="--c:${br.col}">${st.l?'Verbessern':'Freischalten'} für ${curHTML(n.cur,c).replace('class="cur"','class="cur" style="margin-left:4px"')}</button></div>`}
  if(W.id===1&&n.id==='e2b'&&st.l>0)h+=startStepper();
  sh.innerHTML=h;bindStepper();const b=$('#bBuy');if(b)b.onclick=()=>{const l=SN[n.id]||0;if(pay(n.cur,nodeCost(n,l),b)){SN[n.id]=l+1;persist();renderTree();
    const el=tw.querySelector(`[data-id="${n.id}"]`);if(el){el.classList.add('pop')}}}}
const ptrs=new Map();let downNode=null,moved=0,pinch=null;
tv.addEventListener('pointerdown',e=>{if(e.target.closest('.treebtns'))return;tv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){moved=0;downNode=e.target.closest('.node')}else{downNode=null;const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)}}});
tv.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===1){moved+=Math.abs(dx)+Math.abs(dy);if(moved>6){tx+=dx;ty+=dy;applyT()}}
  else if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y),r=tv.getBoundingClientRect();zoomAt(d/pinch.d,(a.x+b.x)/2-r.left,(a.y+b.y)/2-r.top);pinch.d=d}});
function ptrUp(e){if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;
  if(ptrs.size===0&&downNode&&moved<=6){selNode=downNode.dataset.id;renderTree()}if(ptrs.size===0)downNode=null}
tv.addEventListener('pointerup',ptrUp);tv.addEventListener('pointercancel',ptrUp);
tv.addEventListener('click',e=>{if(e.detail===0){const n=e.target.closest('.node');if(n){selNode=n.dataset.id;renderTree();tw.querySelector(`[data-id="${selNode}"]`)?.focus()}}});
tv.addEventListener('wheel',e=>{e.preventDefault();const r=tv.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top)},{passive:false});
$('#tzIn').onclick=()=>{const r=tv.getBoundingClientRect();zoomAt(1.25,r.width/2,r.height/2)};
$('#tzOut').onclick=()=>{const r=tv.getBoundingClientRect();zoomAt(.8,r.width/2,r.height/2)};
$('#tzHome').onclick=treeHome;

/* ---------- heroes ---------- */
function renderHeroes(){renderCurs();const S=stats(save);save.team=save.team.filter(id=>save.heroes[id].u).slice(0,S.slots);
  let sl='';for(let i=0;i<4;i++){const id=save.team[i];
    if(i>=S.slots)sl+=`<div class="slot">Gesperrt<br>Skilltree</div>`;
    else if(id)sl+=`<button class="slot on" data-rm="${id}" style="--c:${HEROES[id].col}" aria-label="${HEROES[id].name} entfernen"><canvas data-h="${id}" width="80" height="80" style="width:40px;height:40px"></canvas></button>`;
    else sl+=`<div class="slot">Frei</div>`}
  $('#slots').innerHTML=sl;
  $('#hlist').innerHTML=HERO_IDS.map(id=>{const d=HEROES[id],st=save.heroes[id],lm=1+.12*(st.l-1),inT=save.team.includes(id);
    const dmg=d.dmg*lm*S.heroDmg,hp=d.hp*lm*S.heroHp,cd=d.cd*S.abilityCd*(1-.08*st.a);let act='',prev='';
    if(st.u){const lm1=1+.12*st.l,rows=[];
      if(st.l<HERO_MAX)rows.push(['<small>Aufwerten</small> Stufe',`${st.l}`,`${st.l+1}`],['Schaden',fv(dmg),fv(d.dmg*lm1*S.heroDmg)],['Leben',fv(hp),fv(d.hp*lm1*S.heroHp)]);
      if(st.a<ASC_MAX)rows.push(['<small>Aufstieg</small> Stärke',`+${st.a*35} %`,`+${(st.a+1)*35} %`],['Abklingzeit',fmtD(cd)+' s',fmtD(d.cd*S.abilityCd*(1-.08*(st.a+1)))+' s']);
      if(rows.length)prev=cmpRows(rows,d.col)}
    if(!st.u){const [c,a]=d.unlock;act=`<button class="btn ${canPay(c,a)?'':'poor'}" data-un="${id}" style="--c:${d.col}">${costBtn('Freischalten',c,a)}</button>`}
    else{act=`<button class="btn" data-tg="${id}" style="--c:${inT?'#9b98c8':d.col}">${inT?'Entfernen':'Einsetzen'}<small>${inT?'aus dem Team':save.team.length<S.slots?'ins Team':'kein Platz frei'}</small></button>`;
      if(st.l<HERO_MAX){const [c,a]=heroLvlCost(st.l);act+=`<button class="btn ${canPay(c,a)?'':'poor'}" data-lv="${id}" style="--c:${d.col}">${costBtn('Aufwerten',c,a)}</button>`}
      if(st.a<ASC_MAX){const [c,a]=heroAscCost(st.a);act+=`<button class="btn ${canPay(c,a)?'':'poor'}" data-as="${id}" style="--c:#ffe14f">${costBtn('Aufstieg',c,a)}</button>`}}
    return `<article class="hcard ${st.u?'':'lock'}" style="--c:${d.col}"><div class="hc-top"><canvas data-h="${id}" width="112" height="112"></canvas><div><h3>${d.name}</h3><small>${d.role}</small><div class="stars" aria-label="Aufstieg ${st.a} von 5">${'★'.repeat(st.a)}${'☆'.repeat(ASC_MAX-st.a)}</div></div>
      <div class="lvl">${st.u?`<small>Stufe</small><br>${st.l}<small> / ${HERO_MAX}</small>`:'<small>Gesperrt</small>'}</div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${d.text}</p>
      <div class="stats"><div>Schaden<b>${fv(dmg)}</b></div><div>Leben<b>${fv(hp)}</b></div><div>Fähigkeit<b>${fmtD(cd)} s</b></div></div>
      <div class="abil"><b>${d.abil}:</b> ${d.abilText}${st.a?` Stärke +${st.a*35} %.`:''}</div>${prev}<div class="hc-act">${act}</div></article>`}).join('');
  $$('canvas[data-h]').forEach(cv=>{const id=cv.dataset.h,c=cv.getContext('2d'),s=R.heroSprite(id,HEROES[id].col);c.clearRect(0,0,cv.width,cv.height);c.drawImage(s,0,0,cv.width,cv.height)})}
$('#heroes').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const S=stats(save);
  if(b.dataset.rm){save.team=save.team.filter(x=>x!==b.dataset.rm);persist();renderHeroes();return}
  const id=b.dataset.un||b.dataset.tg||b.dataset.lv||b.dataset.as;if(!id)return;const st=save.heroes[id],d=HEROES[id];
  if(b.dataset.un){if(pay(d.unlock[0],d.unlock[1],b)){st.u=1;if(save.team.length<S.slots)save.team.push(id);persist();renderHeroes();toast(`${d.name} ist freigeschaltet`)}}
  else if(b.dataset.tg){if(save.team.includes(id))save.team=save.team.filter(x=>x!==id);else if(save.team.length<S.slots)save.team.push(id);
    else{Snd.play('no');toast('Alle Plätze belegt. Mehr Plätze gibt es im Skilltree.');return}persist();renderHeroes()}
  else if(b.dataset.lv){const [c,a]=heroLvlCost(st.l);if(pay(c,a,b)){st.l++;persist();renderHeroes()}}
  else if(b.dataset.as){const [c,a]=heroAscCost(st.a);if(pay(c,a,b)){st.a++;persist();renderHeroes();toast(`${d.name} ist aufgestiegen`)}}});

/* ---------- Türme im Run: Bauen, Aufwerten, Verschieben, Abbauen ---------- */
// Solange gebaut oder ein Turm bearbeitet wird, ist das Spiel pausiert.
let buildSel=null,trayOpen=false,buildDown=false,moveT=null,towerSel=null;
const buildPaused=()=>!!(trayOpen||buildSel||moveT||towerSel);
const BOLT='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';
function towerFxRows(id,l){const ts=run&&run.towerStats?run.towerStats(id,l):(W.id===2?Run2.prototype.towerStats.call({S:stats2(save)},id,l):{r:TOWERS[id].r(l),fx:TOWERS[id].fx(l)}),f=ts.fx,r=ts.r;
  if(id==='laser')return[['Schaden pro Sekunde',fmtN(f.dps)],['Reichweite',String(r)]];
  if(id==='rocket')return[['Schaden pro Rakete',fmtN(f.dmg)],['Explosionsradius',String(f.splash)],['Reichweite',String(r)]];
  if(id==='tesla')return[['Schaden pro Blitz',fmtN(f.dmg)],['Ziele',String(f.chain+1)],['Reichweite',String(r)]];
  if(id==='frost')return[['Verlangsamung',fmtD(f.slow*100,0)+' %'],['Radius',String(r)]];
  if(id==='weak')return[['Gegner nehmen',`+${fmtD((f.vuln-1)*100,0)} % Schaden`],['Gegner verursachen',`−${fmtD((1-f.weak)*100,0)} % Schaden`],['Radius',String(r)]];
  return[['Einfrieren für',fmtD(f.dur,1)+' s'],['Alle',fmtD(f.cd,1)+' s'],['Radius',String(r)]]}
function screenToWorld(e){const r=$('#cv').getBoundingClientRect();return[(e.clientX-r.left-R.w/2)/R.se,(e.clientY-r.top-R.h/2)/R.se]}
function setPauseBadge(){const on=buildPaused()&&run&&!run.over;$('#buildPause').hidden=!on}
function updBuildBtn(){if(!run)return;const b=$('#bBuild'),free=run.towers.length<run.towerSlots();
  if(!b.dataset.init){b.innerHTML=`<span>Bauen</span><small>${BOLT}<i></i></small>`;b.dataset.init='1'}
  const ei=b.querySelector('i'),et=fmtN(run.energy);if(ei.textContent!==et)ei.textContent=et;
  const cheap=free&&W.towerIds.some(id=>W.ts()[id].u&&run.energy>=run.buildCost(id));b.classList.toggle('ping',cheap&&!buildPaused())}
function endBuild(){trayOpen=false;buildSel=null;moveT=null;towerSel=null;buildDown=false;R.ghost=null;R.selTower=null;
  $('#tray').hidden=true;$('#tpanel').hidden=true;$('#buildHint').hidden=true;setPauseBadge();updBuildBtn()}
function openTray(){if(!run||run.over)return;endBuild();trayOpen=true;renderTray();$('#tray').hidden=false;setPauseBadge()}
function renderTray(){const n=run.towers.length,max=run.towerSlots();
  $('#trayHead').innerHTML=`<b>Turm bauen</b><span>${n} / ${max} Plätze</span><span class="en">${BOLT}${fmtN(run.energy)}</span>`;
  $('#trayList').innerHTML=W.towerIds.filter(id=>W.ts()[id].u).map(id=>{const T=TOWERS[id],c=run.buildCost(id),ok=run.energy>=c&&n<max;
    return `<button class="btn tcard ${ok?'':'poor'}" data-bt="${id}" style="--c:${T.col}"><canvas data-t="${id}" width="72" height="72"></canvas><b>${T.name.replace('-Turm','')}</b><small>${BOLT}${fmtN(c)}</small></button>`}).join('')||'<p class="hint">Noch kein Turm freigeschaltet.</p>';
  $$('#trayList canvas[data-t]').forEach(cv=>{const id=cv.dataset.t;cv.getContext('2d').drawImage(R.towerSprite(id,TOWERS[id].col),0,0,72,72)})}
$('#bBuild').onclick=()=>{trayOpen?endBuild():openTray()};
$('#bTrayClose').onclick=endBuild;
$('#trayList').addEventListener('click',e=>{const b=e.target.closest('[data-bt]');if(!b)return;const id=b.dataset.bt,c=run.buildCost(id);
  if(run.towers.length>=run.towerSlots()){Snd.play('no');toast('Alle Bauplätze belegt. Mehr gibt es im Turm-Menü.');return}
  if(run.energy<c){Snd.play('no');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast(`Dir fehlen ${fmtN(c-run.energy)} Energie`);return}
  trayOpen=false;$('#tray').hidden=true;buildSel=id;$('#buildHint').hidden=false;$('#buildHintT').textContent=`Tippe aufs Spielfeld, um den ${TOWERS[id].name} zu platzieren`;setPauseBadge()});
$('#bBuildCancel').onclick=()=>{const t=moveT;endBuild();if(t)openTower(t)};
function ghostAt(e){const [x,y]=screenToWorld(e),T=moveT,type=T?T.type:buildSel,l=T?T.l:W.ts()[type].l;R.ghost={type,x,y,r:run.towerStats(type,l).r,ok:run.canPlace(x,y,T)}}
/* Turm-Menü im Run */
function openTower(T){endBuild();towerSel=T;R.selTower=T;renderTpanel();$('#tpanel').hidden=false;setPauseBadge()}
function renderTpanel(){const T=towerSel,D=TOWERS[T.type],max=T.l>=TOWER_MAX,c=max?0:run.upCost(T),nx=max?null:towerFxRows(T.type,T.l+1);
  const rows=[['Stufe',String(T.l),max?undefined:String(T.l+1)],...towerFxRows(T.type,T.l).map(([a,b],i)=>[a,b,nx?nx[i][1]:undefined])];
  $('#tpanel').innerHTML=`<div class="tp-head" style="--c:${D.col}"><canvas width="64" height="64"></canvas><div><b>${D.name}</b><small>${D.text}</small></div><span class="en">${BOLT}${fmtN(run.energy)}</span></div>
    ${cmpRows(rows,D.col)}${(()=>{const cs=[...new Set(run.towers.filter(o=>o!==T&&hyp(o.x-T.x,o.y-T.y)<o.r+T.r).map(o=>comboOf(T.type,o.type)).filter(Boolean))];return cs.length?`<div class="combos">${cs.map(cb=>`<span style="--c:${cb.col}"><b>${cb.name}</b> ${cb.text}</span>`).join('')}</div>`:'<p class="trayinfo">Überschneide den Radius mit anderen Türmen für Kombinationseffekte.</p>'})()}
    <div class="tp-act">${max?'<button class="btn" disabled>Maximal ausgebaut</button>':`<button class="btn ${run.energy>=c?'':'poor'}" id="tpUp" style="--c:${D.col}">Aufwerten<small>${BOLT}${fmtN(c)}</small></button>`}
      <button class="btn ${run.world===2&&(run.phase!=='build'||run.moves<=0)?'poor':''}" id="tpMove" style="--c:#9b98c8">Verschieben<small>${run.world===2?(run.phase==='build'?`1 Umbaupunkt · noch ${run.moves}`:'nur in der Umbauphase'):'kostenlos'}</small></button>
      <button class="btn" id="tpSell" style="--c:#ff4f6d">Abbauen<small>${BOLT}+${fmtN(run.refund(T))}</small></button></div>
    <button class="btn" id="tpClose" style="--c:var(--muted)">Weiterspielen</button>`;
  $('#tpanel canvas').getContext('2d').drawImage(R.towerSprite(T.type,D.col),0,0,64,64);
  const up=$('#tpUp');if(up)up.onclick=()=>{if(run.upgradeTower(T)){renderTpanel();updBuildBtn()}else{Snd.play('no');up.classList.remove('shake');void up.offsetWidth;up.classList.add('shake');toast(`Dir fehlen ${fmtN(run.upCost(T)-run.energy)} Energie`)}};
  $('#tpMove').onclick=()=>{if(run.world===2&&(run.phase!=='build'||run.moves<=0)){Snd.play('no');toast(run.phase!=='build'?'Verschieben geht nur in der Umbauphase':'Keine Umbaupunkte mehr in dieser Pause');return}towerSel=null;$('#tpanel').hidden=true;moveT=T;R.selTower=T;$('#buildHint').hidden=false;$('#buildHintT').textContent='Tippe auf den neuen Platz für den Turm';setPauseBadge()};
  $('#tpSell').onclick=()=>{run.sellTower(T);endBuild()};
  $('#tpClose').onclick=endBuild}
/* Eingabe aufs Spielfeld */
$('#cv').addEventListener('pointermove',e=>{if((buildSel||moveT)&&run&&(buildDown||e.pointerType==='mouse'))ghostAt(e)});
$('#cv').addEventListener('pointerup',e=>{if(!(buildSel||moveT)||!buildDown)return;buildDown=false;const [x,y]=screenToWorld(e);
  if(moveT){const T=moveT;if(run.moveTower(T,x,y)){endBuild();openTower(T)}else{Snd.play('no');toast('Hier kann der Turm nicht stehen');if(e.pointerType!=='mouse')R.ghost=null}return}
  if(run.place(buildSel,x,y)){endBuild()}else{Snd.play('no');toast(run.canPlace(x,y)?'Nicht genug Energie':'Hier kann kein Turm stehen');if(e.pointerType!=='mouse')R.ghost=null}});
function towerAt(x,y){let best=null,bd=(26/R.zoom)**2;for(const T of run.towers){const d=(T.x-x)**2+(T.y-y)**2;if(d<bd){bd=d;best=T}}return best}

/* ---------- Türme: Menü ---------- */
function renderTowers(){renderCurs();const ex=save.tslots||0,TS=W.ts();
  let sl=`<div class="slotinfo"><b>${W.id===1?SLOT_BASE+ex:stats2(save).slots2}</b> Bauplätze pro Run${W.id===2?' · mehr über „Bauplätze“ im Skilltree':''}</div>`;
  if(W.id===1&&ex<SLOT_EXTRA){const [c,a]=slotCost(ex);sl+=`<button class="btn ${canPay(c,a)?'':'poor'}" id="bSlot" style="--c:#ff4fd8">${costBtn('Bauplatz kaufen',c,a)}</button>`}
  $('#tslots').innerHTML=sl;
  $('#tlist').innerHTML=W.towerIds.map(id=>{const T=TOWERS[id],st=TS[id];let act='',rows;
    if(!st.u){const [c,a]=W.unlock(id);act=`<button class="btn ${canPay(c,a)?'':'poor'}" data-tu="${id}" style="--c:${T.col}">${costBtn('Freischalten',c,a)}</button>`;rows=towerFxRows(id,st.l).map(([a,b])=>[a,b])}
    else{const nx=st.l<TOWER_MAX?towerFxRows(id,st.l+1):null;rows=[['Startstufe',String(st.l),nx?String(st.l+1):undefined],...towerFxRows(id,st.l).map(([a,b],i)=>[a,b,nx?nx[i][1]:undefined])];
      if(st.l<TOWER_MAX){const [c,a]=W.tlvl(st.l);act=`<button class="btn ${canPay(c,a)?'':'poor'}" data-tl="${id}" style="--c:${T.col}">${costBtn('Aufwerten',c,a)}</button>`}
      else act='<button class="btn" disabled>Maximal ausgebaut</button>'}
    return `<article class="hcard ${st.u?'':'lock'}" style="--c:${T.col}"><div class="hc-top"><canvas data-t="${id}" width="112" height="112"></canvas><div><h3>${T.name}</h3><small>${st.u?`Startstufe ${st.l} / ${TOWER_MAX}`:'Gesperrt'} · Bauen kostet ${fmtN(T.cost)} Energie</small></div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${T.text}</p>${cmpRows(rows,T.col)}<div class="hc-act">${act}</div></article>`}).join('');
  $('#tlist').insertAdjacentHTML('beforeend',`<article class="hcard" style="--c:#c7b8ff"><h3 style="margin:0">Kombinationen</h3><p style="margin:0;color:var(--muted);font-size:13px">Überschneiden sich die Radien mehrerer Türme, addieren sich ihre Effekte (maximal drei Türme). In den Überschneidungen entstehen zusätzliche Effekte, bei drei gleichen Türmen 50 % stärker.</p><div class="combos">${COMBOS.filter(cb=>W.id===2||cb.bit).map(cb=>{const ok=cb.need.every(t=>TS[t]&&TS[t].u);return `<span style="--c:${cb.col}" class="${ok?'':'off'}"><b>${cb.name}</b> <em>${cb.need.map(t=>TOWERS[t].name.replace('-Turm','')).join(' + ')}</em> ${ok?cb.text:'Noch nicht verfügbar.'}</span>`}).join('')}</div></article>`);
  $$('#tlist canvas[data-t]').forEach(cv=>{const id=cv.dataset.t,s=R.towerSprite(id,TOWERS[id].col);const c=cv.getContext('2d');c.clearRect(0,0,112,112);c.drawImage(s,0,0,112,112)});
  const bs=$('#bSlot');if(bs)bs.onclick=()=>{const [c,a]=slotCost(save.tslots||0);if(pay(c,a,bs)){save.tslots=(save.tslots||0)+1;persist();renderTowers();toast('Neuer Bauplatz')}}}
$('#tlist').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.tu||b.dataset.tl;if(!id)return;const st=W.ts()[id],T=TOWERS[id];
  if(b.dataset.tu){const ul=W.unlock(id);if(pay(ul[0],ul[1],b)){st.u=1;persist();renderTowers();toast(`${T.name} ist freigeschaltet`)}}
  else{const [c,a]=W.tlvl(st.l);if(pay(c,a,b)){st.l++;persist();renderTowers()}}});
$('#bTowers').onclick=()=>{show('towers');renderTowers()};

/* ---------- supernova (prestige) ---------- */
function renderNova(){renderCurs();const qg=quantaFor(save.cycleBest,save),cb=save.cycleBest||0;
  let next='';if(cb<NOVA_MIN)next=`Erreiche Welle ${NOVA_MIN}, um deine Supernova zu zünden.`;else{let w=cb+1;while(quantaFor(w,save)<=qg&&w<cb+30)w++;next=`Bei Welle ${w} wären es ${fmtN(quantaFor(w,save))} Quanten.`}
  $('#novaTop').innerHTML=`<div class="novabig">${curIcon('q')}<b>+${fmtN(qg)}</b><span>Quanten</span></div>
    <p>Höchste Welle in diesem Zyklus: <b>${cb}</b>. ${next}</p>
    <div class="resets"><p><span>Wird zurückgesetzt:</span> Skilltree, Währungen, Helden- und Turmstufen</p><p><span>Bleibt erhalten:</span> freigeschaltete Helden und Türme, Bauplätze, Rekord, Quanten und Quanten-Upgrades</p></div>
    <button class="btn big ${qg>0?'':'poor'}" id="bNovaGo" style="--c:#c7b8ff">Supernova zünden</button>`;
  const b=$('#bNovaGo');b.onclick=()=>{if(qg<=0){Snd.play('no');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast(`Die Supernova braucht mindestens Welle ${NOVA_MIN}`);return}
    if(!b.dataset.arm){b.dataset.arm='1';b.textContent='Wirklich zünden? Nochmal tippen';setTimeout(()=>{if(b.isConnected&&b.dataset.arm){b.dataset.arm='';b.textContent='Supernova zünden'}},4000);return}
    supernova()};
  $('#novaList').innerHTML=Object.values(PRES).map(p=>{const l=save.pr[p.id]||0,max=l>=p.max,c=max?0:presCost(p,l);
    const S0=stats(save),S1=max?null:stats({...save,pr:{...save.pr,[p.id]:l+1}});const rows=[['Stufe',`${l}`,max?undefined:`${l+1}`]];
    const pv={dmg:[['Klinge-Schaden',S=>fv(S.heroDmg*HEROES.klinge.dmg)],['Tippschaden',S=>fv(S.tapDmg)],['Drohnenschaden',S=>fv(S.droneDmg)]],hp:[['Basisleben',S=>fv(S.baseHp)]],
      gain:[['Splitter',S=>'×'+fmtD(S.gS,2)],['Kerne',S=>'×'+fmtD(S.gK,2)],['Prismen',S=>'×'+fmtD(S.gP,2)]],
      hero:[['Heldenschaden',S=>'×'+fmtD(S.heroDmg,2)],['Heldenleben',S=>'×'+fmtD(S.heroHp,2)]],drone:[['Drohnen',S=>String(S.drones)]]}[p.id]||[];
    for(const [lab,f] of pv)rows.push([lab,f(S0),S1?f(S1):undefined]);
    if(p.id==='qgain')rows.push(['Quanten jetzt',fmtN(qg),max?undefined:fmtN(quantaFor(cb,{pr:{...save.pr,qgain:l+1}}))]);
    if(p.id==='legacy')rows.push(['Startstufe der Knoten',String(l),max?undefined:String(l+1)]);
    if(p.id==='start')rows.push(['Start-Splitter',l?fmtN(200*Math.pow(3,l-1)):'0',max?undefined:fmtN(200*Math.pow(3,l))],['Start-Kerne',String(l*5),max?undefined:String((l+1)*5)]);
    return `<article class="hcard" style="--c:#c7b8ff"><div class="hc-top"><div><h3>${p.name}</h3><small>Stufe ${l} / ${p.max}</small></div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${max?'':'Nach dem Kauf: '}<b style="color:var(--ink);font-weight:600">${p.fx(max?l:l+1)}</b></p>${cmpRows(rows,'#c7b8ff')}
      <div class="hc-act">${max?'<button class="btn" disabled>Maximal ausgebaut</button>':`<button class="btn ${save.q>=c?'':'poor'}" data-pr="${p.id}" style="--c:#c7b8ff">${costBtn('Kaufen','q',c)}</button>`}</div></article>`}).join('')}
$('#novaList').addEventListener('click',e=>{const b=e.target.closest('[data-pr]');if(!b)return;const p=PRES[b.dataset.pr],l=save.pr[p.id]||0,c=presCost(p,l);
  if(save.q<c){Snd.play('no');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast(`Dir fehlen ${fmtN(c-save.q)} Quanten`);return}
  save.q-=c;save.pr[p.id]=l+1;Snd.play('buy');persist();renderNova()});
function supernova(){const g=quantaFor(save.cycleBest,save);if(g<=0)return;save.q+=g;save.nova=(save.nova||0)+1;
  save.cur={s:0,k:0,p:0,d:0};save.nodes={root:1};for(const id of HERO_IDS){save.heroes[id].l=1;save.heroes[id].a=0}for(const id of TOWER_IDS)save.towers[id].l=1;
  const L=save.pr.legacy||0;if(L)for(const n of Object.values(NODES))if(n.cur==='s')save.nodes[n.id]=Math.min(n.max,L);
  const st=save.pr.start||0;if(st){save.cur.s=200*Math.pow(3,st-1);save.cur.k=st*5}
  save.cycleBest=0;save.team=save.team.slice(0,stats(save).slots);persist();
  const f=$('#flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');Snd.play('nova');
  renderNova();toast(`Supernova! +${fmtN(g)} Quanten`)}

/* ---------- boot + loop ---------- */
if(save.pending&&save.pending.g){const ps=save.pending.world===2?save.w2:save;for(const c in save.pending.g)ps.cur[c]=(ps.cur[c]||0)+(save.pending.g[c]||0);ps.best=Math.max(ps.best||0,save.pending.w||0);ps.cycleBest=Math.max(ps.cycleBest||0,save.pending.w||0);save.pending=null;persist();
  setTimeout(()=>toast('Belohnungen aus deinem letzten Run wurden gutgeschrieben'),600)}
R.setTheme(W.id);document.documentElement.dataset.wtheme=W.id;
$$('.ver').forEach(e=>e.textContent='Version '+VERSION);save.ver=VERSION;
goHub();
let last=performance.now(),acc=0,hudT=0,pendT=0;
function loop(now){const dt=Math.min(.1,(now-last)/1000);last=now;
  if(run&&!paused&&run.world===2&&!buildPaused())run.tickBuild(dt);
  if(run&&!paused){run.hw=R.hwe;run.hh=R.hhe;acc+=buildPaused()?0:dt*speed;let n=0;while(acc>=1/60&&n<20){run.step(1/60);acc-=1/60;n++}if(n>=20)acc=0;
    if(run.over&&buildPaused())endBuild();
    if(run.over&&run.overT>1.6&&!endShown)showEnd();
    pendT+=dt;if(pendT>2&&!run.over){pendT=0;save.pending={world:W.id,g:Object.fromEntries(W.curIds.map(c=>[c,Math.floor(run.gain[c]||0)])),w:run.w};persist()}
    hudT+=dt;if(hudT>.1){hudT=0;updHud();updBuildBtn();musicState()}}
  else if(!run)Music.set({menu:true,E:0,W:0,danger:0,boss:false,tr:W.id===2?5:0});
  if($('#tree').hidden&&$('#heroes').hidden&&$('#nova').hidden&&$('#towers').hidden)R.frame(run,paused?0:run&&buildPaused()?dt*.15:dt*(run?speed:1));
  requestAnimationFrame(loop)}
requestAnimationFrame(loop);
