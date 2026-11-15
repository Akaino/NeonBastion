/* Schattenbaum für die gesamte Oberfläche (alles außer dem Spielfeld).
   Hintergrund (15.11.2026, beim Nutzer in Safari gemessen und mit Perf.aus('frz') bestätigt): Ein fremdes Skript im Browser beobachtet die Seite und arbeitet nach jeder Änderung
   am Dokument einmal pro Sekunde 50 bis 150 ms lang – das waren die Ruckler im Sekundentakt, im Run durch die laufende Anzeige, in den Menüs durch jeden Kauf.
   Änderungen innerhalb eines Schattenbaums sieht ein solcher Beobachter nicht. Deshalb ziehen beim Start alle Bildschirme in einen Schattenbaum um; die Stilregeln der Seite
   werden hineinkopiert (Regeln, die am <html>-Element hängen, werden auf den Träger #ui umgeschrieben). $ und $$ suchen in beiden Bäumen. */
const UI=(()=>{const app=document.querySelector('#app'),host=document.createElement('div');host.id='ui';const root=host.attachShadow({mode:'open'}),st=document.querySelector('style');
  if(st){const c=st.cloneNode(true);c.textContent=c.textContent.replace(/:root(\[data-wtheme="\d"\])/g,':host($1)').replace(/html\.onlycv body \*/g,':host(.onlycv) *').replace(/html\.(\w+) /g,':host(.$1) ');root.appendChild(c)}
  const kids=[...app.children].filter(e=>e.id!=='cv');app.appendChild(host);for(const e of kids)root.appendChild(e);return root})();
const $=s=>document.querySelector(s)||UI.querySelector(s),$$=s=>[...document.querySelectorAll(s),...UI.querySelectorAll(s)];
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
function setWorld(id){save.world=id;W=WORLDS[id];persist();R.setTheme(id);document.documentElement.dataset.wtheme=id;UI.host.dataset.wtheme=id;selNode='root'}
/* ---------- helpers ---------- */
/*DEV{*//* Leistungsmessung (Testhilfe): hält jedes Bild fest, das länger als HITCH_MS dauert, und was in dieser Lücke gerechnet wurde.
   Die Lücke zwischen zwei Bildern enthält die Arbeit des vorigen Bildes, deshalb wird dessen Aufteilung notiert. „Rest“ ist Zeit außerhalb des Spiels (Browser, System). */
const HITCH_MS=28;
const Perf={on:false,fr:[],hit:[],t0:0,mus:0,sv:0,pw:null,lastUi:0,
  /* Ursachensuche: schaltet nacheinander einzelne Teile ab und zählt je Abschnitt die Ruckler. Zeigt, ob Zeichnen, Ton, Animationen oder gar nichts davon schuld ist. */
  scanRes:null,scanT:0,noDraw:false,freeze:false,
  /* Schalter für die Ursachensuche, auch von Hand in der JavaScript-Konsole bedienbar:
     Perf.live()        zeigt alle 5 s in der Konsole, wie viele Ruckler es gab (noch einmal aufrufen beendet es)
     Perf.aus('inp')    schaltet etwas ab, Perf.an('inp') wieder an. Mögliche Namen: frz inp tim fnt fx ani cvo ton leer
     Perf.aus()         zeigt die Liste der Namen mit Erklärung */
  NAMEN:{frz:'Anzeigen eingefroren (kein Text ändert sich)',inp:'Eingabefelder entfernt',tim:'Zeitgeber aus (Musik, Aufräumen)',fnt:'Systemschrift statt Spielschrift',fx:'Leuchteffekte aus',ani:'Animationen aus',cvo:'nur das Spielfeld sichtbar',ton:'Ton angehalten',leer:'Seite leer, nichts wird gezeichnet'},
  sw(){if(this._P)return this._P;
    // Jeder Abschnitt schaltet genau eine Sache ab und danach wieder an. Gesucht ist, was die Spielseite hat und eine leere Seite nicht.
    let ins=[],mt=0,tt=0;const H=document.documentElement,cls=(n,on)=>{H.classList.toggle(n,!!on);UI.host.classList.toggle(n,!!on)},au=on=>{if(Snd.ctx)(on?Snd.ctx.resume():Snd.ctx.suspend()).catch(()=>{})};
    return this._P={frz:[()=>{this.freeze=true},()=>{this.freeze=false}],
      inp:[()=>{ins=[...$$('input,textarea,select')].map(e=>[e,e.parentNode,e.nextSibling]);for(const x of ins)x[0].remove()},()=>{for(const [e,pa,nx] of ins)pa.insertBefore(e,nx&&nx.parentNode===pa?nx:null);ins=[]}],
      tim:[()=>{mt=Music.timer;clearInterval(mt);Music.timer=null;tt=Track.timer;clearInterval(tt);Track.timer=null},()=>{if(mt){Music.timer=null;Music.start()}if(tt)Track.timer=setInterval(()=>Track.sweep(),500)}],
      fnt:[()=>cls('nofont',1),()=>cls('nofont',0)],
      fx:[()=>cls('nofx',1),()=>cls('nofx',0)],
      ani:[()=>cls('noanim',1),()=>cls('noanim',0)],
      cvo:[()=>cls('onlycv',1),()=>cls('onlycv',0)],
      ton:[()=>au(false),()=>au(true)],
      leer:[()=>{this.noDraw=true;H.classList.add('blank')},()=>{this.noDraw=false;H.classList.remove('blank')}]}},

  aus(k){if(!this.NAMEN[k]){console.log(Object.entries(this.NAMEN).map(([a,b])=>a.padEnd(5)+b).join('\n'));return}this.off=this.off||{};if(this.off[k])return k+' ist schon aus';this.off[k]=1;this.sw()[k][0]();return 'aus: '+this.NAMEN[k]},
  an(k){if(k===undefined){for(const x of Object.keys(this.off||{}))this.an(x);return 'alles wieder an'}if(!this.off||!this.off[k])return k+' ist an';delete this.off[k];this.sw()[k][1]();return 'an: '+this.NAMEN[k]},
  live(sec=5){if(this.liveT){clearInterval(this.liveT);this.liveT=0;return 'Anzeige beendet'}if(!this.on)this.start();let n0=this.fr.length;
    this.liveT=setInterval(()=>{const f=this.fr.slice(n0);n0=this.fr.length;const h=f.filter(v=>v>HITCH_MS&&v<5000);console.log('Ruckler in '+sec+' s: '+h.length+(h.length?', längster '+Math.round(Math.max(...h))+' ms':'')+(Object.keys(this.off||{}).length?'   [aus: '+Object.keys(this.off).join(', ')+']':''))},sec*1000);return 'Anzeige läuft, alle '+sec+' s eine Zeile'},
  scan(sec=8){if(this.scanT)return;const cv=R.cv,pf=$('#perf'),au=on=>{if(Snd.ctx)(on?Snd.ctx.resume():Snd.ctx.suspend()).catch(()=>{})},H=document.documentElement;
    const P=this.sw();
    const one=(name,k)=>[this.NAMEN[k],P[k][0],P[k][1]],ks=Object.keys(P);
    const ph=[['alles an',()=>{},()=>{}],one('Anzeigen eingefroren (kein Text ändert sich)','frz'),one('Eingabefelder entfernt','inp'),one('Zeitgeber aus (Musik, Aufräumen)','tim'),
      one('Systemschrift statt Spielschrift','fnt'),one('Leuchteffekte aus','fx'),one('Animationen aus','ani'),one('nur das Spielfeld sichtbar','cvo'),one('Ton angehalten','ton'),one('Seite leer, nichts wird gezeichnet','leer'),
      ['alles zusammen',()=>{for(const k of ks)P[k][0]()},()=>{for(const k of ks.slice().reverse())P[k][1]()}],['alles an (Kontrolle)',()=>{},()=>{}]];
    if(!this.on)this.start();this.scanRes=[];let i=0;
    const next=()=>{if(i>0){const p=ph[i-1],f=this.fr.slice(this.scanN+40),hits=f.filter(v=>v>HITCH_MS&&v<5000);p[2]();this.scanRes.push({name:p[0],n:f.length,hits:hits.length,max:f.length?Math.max(...f):0,sec})}
      if(i>=ph.length){this.scanT=0;toast('Ursachensuche fertig');$('#bDev').onclick();return}
      ph[i][1]();this.scanN=this.fr.length;i++;this.scanT=setTimeout(next,sec*1000)};
    next()},
  scanText(){if(!this.scanRes||!this.scanRes.length)return'';let o='\nUrsachensuche (je Abschnitt '+this.scanRes[0].sec+' s)\n';
    for(const r of this.scanRes)o+='  '+r.name.padEnd(46)+String(r.hits).padStart(3)+' Ruckler, '+r.n+' Bilder, längstes '+Math.round(r.max)+' ms\n';return o},
  start(){this.on=true;this.fr=[];this.hit=[];this.t0=performance.now();this.mus=this.sv=0;this.pw=null;$('#perf').hidden=false;$('#perf').textContent='Messung läuft …'},
  stop(){this.on=false;$('#perf').hidden=true},
  frame(now,raw,work){const mus=this.mus,sv=this.sv,pw=this.pw;this.mus=this.sv=0;this.pw=work;
    if(this.fr.length<60000)this.fr.push(raw);
    if(raw>HITCH_MS&&raw<5000&&pw&&this.hit.length<400)this.hit.push({t:(now-this.t0)/1000,raw,st:pw.st,hud:pw.hud,draw:pw.draw,mus,sv,ns:pw.ns,en:pw.en,w:pw.w,sp:pw.sp});
    if(now-this.lastUi>500&&!this.freeze){this.lastUi=now;const n=Math.min(this.fr.length,60);let s=0;for(let i=this.fr.length-n;i<this.fr.length;i++)s+=this.fr[i];const h=this.hit[this.hit.length-1];
      $('#perf').textContent=(n?Math.round(1000*n/s):0)+' Bilder/s · Ruckler '+this.hit.length+(h?'\nletzter '+Math.round(h.raw)+' ms: Spiel '+(h.st+h.hud+h.draw+h.mus).toFixed(0)+', Rest '+Math.max(0,h.raw-h.st-h.hud-h.draw-h.mus).toFixed(0):'')}},
  report(){const f=this.fr.slice().sort((a,b)=>a-b),n=f.length,q=p=>n?f[Math.min(n-1,Math.floor(n*p))].toFixed(1):'–',H=this.hit,f1=v=>v.toFixed(1).padStart(6);
    let gap=0;for(let i=1;i<H.length;i++)gap+=H[i].t-H[i-1].t;
    let o='Neon Bastion Leistungsmessung '+VERSION+(STAGE?' '+STAGE:'')+'\n'+navigator.userAgent+'\nFenster '+innerWidth+'×'+innerHeight+', Pixelverhältnis '+(window.devicePixelRatio||1)+', Leinwand '+R.cv.width+'×'+R.cv.height+
      '\nDauer '+((performance.now()-this.t0)/1000).toFixed(0)+' s, '+n+' Bilder, Median '+q(.5)+' ms, 99 %: '+q(.99)+' ms, längstes '+q(1)+' ms'+
      '\nRuckler (Bild über '+HITCH_MS+' ms): '+H.length+(H.length>1?', mittlerer Abstand '+(gap/(H.length-1)).toFixed(1)+' s':'')+
      '\n\n  Zeit   Bild  Logik Anzeig Zeichn  Musik Speich   Rest | Schritte Gegner Welle Tempo\n';
    for(const h of H.slice(-60))o+=f1(h.t)+f1(h.raw)+f1(h.st)+f1(h.hud)+f1(h.draw)+f1(h.mus)+f1(h.sv)+f1(Math.max(0,h.raw-h.st-h.hud-h.draw-h.mus))+' | '+h.ns+' '+h.en+' '+h.w+' '+h.sp+'×\n';
    return o+this.scanText()+'\nAlle Angaben in Millisekunden. Speichern ist in Logik enthalten. Rest = Zeit außerhalb des Spiels (Browser, System).\n'}};
const persist=()=>{if(!Perf.on){Store.save(save);return}const a=performance.now();Store.save(save);Perf.sv+=performance.now()-a};/*}DEV*//*REL{const Perf={on:false,noDraw:false};const persist=()=>Store.save(save);}REL*/
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2600)}
function banner(t,sub){const b=$('#banner');b.querySelector('b').textContent=t;b.querySelector('span').textContent=sub||'';b.classList.remove('show');void b.offsetWidth;b.classList.add('show')}
// Menüs werden bei jedem Öffnen neu aufgebaut. Verlässt man sie, wird ihr Inhalt geleert: Die Seite bleibt klein (rund 350 statt über 2.000 Elemente),
// das hält Werbeblocker, die jede Sekunde die ganze Seite absuchen, kurz (gemessen beim Nutzer: 45 bis 145 ms Hänger je Sekunde mit „AdBlock for Safari“).
const DYN={tree:['#tw','#sheet'],heroes:['#hlist','#slots'],nova:['#novaList','#novaTop'],towers:['#tlist','#tslots'],worlds:['#wlist'],codex:['#clist'],achv:['#alist'],fleet:['#flist','#fbar']};
function show(id){for(const s of['hub','hud','tree','heroes','nova','towers','worlds','codex','achv','fleet']){const el=$('#'+s);if(s!==id&&!el.hidden&&DYN[s])for(const q of DYN[s]){const c=$(q);if(c)c.textContent=''}el.hidden=s!==id}if(id!=='hud'){$('#pause').hidden=true;$('#end').hidden=true}}
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
function renderHub(){renderCurs();const w1=W.id===1;$('#hubWorld').textContent=W.name;$('#bHeroes').hidden=!w1;$('#bFleet').hidden=!w1;$('#bWorlds').hidden=!w2Unlocked(save);
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
function openSettings(){$('#settings').hidden=false;for(const k of['volMus','volSfx']){$('#'+k).value=save[k];$('#'+k+'V').textContent=save[k]>0?save[k]+' %':'Aus'}$('#bReset').textContent='Spielstand zurücksetzen';$('#bReset').dataset.arm='';$('#bReset').hidden=!!run;$('#resetInfo').hidden=!!run;/*DEV{*/devTaps=0;$('#devCode').hidden=true;updW2Btn();/*}DEV*/const lc=$('#bLiveCopy');lc.hidden=!IS_BETA||!!run;lc.dataset.arm='';lc.textContent='Live-Spielstand übernehmen'}
/* Nur in der Beta: Kopie des echten Spielstands holen. Geschrieben wird ausschließlich in den Beta-Spielstand. */
$('#bLiveCopy').onclick=()=>{const b=$('#bLiveCopy');let t=null;try{t=localStorage.getItem(LIVE_KEY)}catch(e){}
  if(!t){Snd.play('no');toast('Auf diesem Gerät gibt es keinen Live-Spielstand');return}
  if(!b.dataset.arm){b.dataset.arm='1';b.textContent=STAGE+'-Spielstand ersetzen? Nochmal tippen';setTimeout(()=>{if(b.dataset.arm){b.dataset.arm='';b.textContent='Live-Spielstand übernehmen'}},4000);return}
  try{const o=JSON.parse(t);o.pending=null;Store.save(o);save=loadSave()}catch(e){Snd.play('no');toast('Der Live-Spielstand ist nicht lesbar');return}
  location.reload()};
$('#bSet').onclick=openSettings;$('#bPSet').onclick=openSettings;
$('#bSetClose').onclick=()=>{$('#settings').hidden=true};
/*DEV{*/$('#bW2Test').onclick=()=>{save.w2test=!save.w2test;if(!save.w2test&&W.id===2&&!w2Unlocked(save))setWorld(1);persist();updW2Btn();renderHub()};
function updW2Btn(){const b=$('#bW2Test');b.textContent=save.w2test?'Test-Freischaltung Gitterfestung: an':'Gitterfestung testweise freischalten';b.hidden=!save.dev||!!run||(save.best||0)>=100;$('#bDevOff').hidden=!save.dev||!!run;$('#bDev').hidden=!save.dev}
/* ---------- Testhilfen im Entwicklermodus: Ressourcen, Rekord, Startwelle, schillernde Gegner, Leistungsmessung ---------- */
function renderDev(){const ws=W.s(),w1=W.id===1,S=w1?stats(save):null,ids=W.curIds.concat(w1?['q']:[]),val=c=>c==='q'?save.q||0:ws.cur[c]||0;
  const btn=(a,l)=>`<button type="button" ${a}>${l}</button>`;let h='';
  if(!run){h+=`<h3>Ressourcen · ${W.name}</h3>`+ids.map(c=>`<div class="drow"><span class="cur">${curIcon(c)}<span>${CUR[c].name}</span></span><b>${fmtN(val(c))}</b><span class="dbtn">${btn(`data-dc="${c}" data-op="k"`,'+1 Tsd.')}${btn(`data-dc="${c}" data-op="m"`,'+1 Mio.')}${btn(`data-dc="${c}" data-op="x"`,'×100')}${btn(`data-dc="${c}" data-op="0"`,'0')}</span></div>`).join('');
    h+=`<h3>Fortschritt</h3><div class="drow"><span>Rekordwelle</span><b>${ws.best||0}</b><span class="dbtn">${[-25,-5,5,25].map(d=>btn(`data-db="${d}"`,(d>0?'+':'−')+Math.abs(d))).join('')}</span></div>`;
    if(w1)h+=`<div class="drow"><span>Startwelle</span><b>${save.devStart||'normal ('+S.startWave+')'}</b><span class="dbtn">${[-10,-1,1,10].map(d=>btn(`data-ds="${d}"`,(d>0?'+':'−')+Math.abs(d))).join('')}${btn('data-ds="0"','normal')}</span></div>`}
  else h+='<p>Ressourcen, Rekord und Startwelle lassen sich nur außerhalb eines Runs ändern.</p>';
  h+=`<h3>Im Run</h3>`+(w1?`<button type="button" class="dwide${save.devShiny?' on':''}" data-dt="devShiny">Schillernder Gegner in jeder Welle: ${save.devShiny?'an':'aus'}</button>`:'')+
    (w1?`<button type="button" class="dwide${save.devDrop?' on':''}" data-dt="devDrop">Abwurf in jeder Welle: ${save.devDrop?'an':'aus'}</button>`:'')+
    `<button type="button" class="dwide${save.devPerf?' on':''}" data-dt="devPerf">Leistungsmessung: ${save.devPerf?'an':'aus'}</button>`+
    (save.devPerf?`<button type="button" class="dwide" data-dp="copy">Messung kopieren (${Perf.hit.length} Ruckler)</button><button type="button" class="dwide" data-dp="clear">Messung neu beginnen</button>`:'')+
    `<button type="button" class="dwide" data-dp="scan">Ursachensuche starten (etwa 2 Minuten, Bild und Ton setzen zwischendurch aus)</button>`+(Perf.scanRes&&Perf.scanRes.length&&!Perf.scanT?`<button type="button" class="dwide" data-dp="copy">Ergebnis kopieren</button><p style="white-space:pre;font:11px/1.4 ui-monospace,Menlo,monospace;overflow-x:auto">${Perf.scanText()}</p>`:'')+
    `<p>Die Testhilfen ändern den Spielstand dieser Seite${STAGE?' ('+STAGE+')':''} und gelten nur, solange der Entwicklermodus an ist.</p>`;
  $('#devBody').innerHTML=h}
$('#bDev').onclick=()=>{$('#devOut').hidden=true;renderDev();$('#dev').hidden=false};
$('#bDevClose').onclick=()=>{$('#dev').hidden=true;persist();if(!run)renderHub();updW2Btn()};
$('#devBody').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!save.dev)return;const d=b.dataset,ws=W.s();
  if(d.dc&&!run){const q=d.dc==='q',v=q?save.q||0:ws.cur[d.dc]||0,n=d.op==='k'?v+1e3:d.op==='m'?v+1e6:d.op==='x'?Math.max(100,v*100):0;if(q)save.q=n;else ws.cur[d.dc]=n}
  else if(d.db&&!run){ws.best=clamp((ws.best||0)+(+d.db),0,999);ws.cycleBest=ws.best}
  else if(d.ds&&!run){save.devStart=+d.ds?clamp((save.devStart||stats(save).startWave)+(+d.ds),1,999):0}
  else if(d.dt){save[d.dt]=!save[d.dt];if(d.dt==='devPerf')save.devPerf?Perf.start():Perf.stop()}
  else if(d.dp==='clear')Perf.start();
  else if(d.dp==='scan'){save.devPerf=true;persist();$('#dev').hidden=true;$('#settings').hidden=true;Perf.scan();return}
  else if(d.dp==='copy'){const t=Perf.report(),o=$('#devOut'),fail=()=>{o.hidden=false;o.value=t;o.focus();o.select();toast('Text steht unten, bitte markieren und kopieren')};
    try{navigator.clipboard.writeText(t).then(()=>toast('Messung kopiert'),fail)}catch(err){fail()}return}
  else return;
  Snd.play('buy');persist();renderDev()});
/* ---------- Entwicklermodus: 7× auf die Version tippen, dann Code eingeben ---------- */
let devTaps=0,devT=0;const devHash=s=>{let h=5381;for(const c of s)h=(h*33^c.charCodeAt(0))>>>0;return h};
$('#setVer').onclick=()=>{if(run||save.dev)return;const n=Date.now();devTaps=n-devT<2000?devTaps+1:1;devT=n;if(devTaps>=7){devTaps=0;const d=$('#devCode');d.classList.remove('shake');d.hidden=false;$('#devIn').value='';$('#devIn').focus()}};
function devTry(){const d=$('#devCode');if(d.hidden)return;if(devHash($('#devIn').value.trim())===2085854505){d.hidden=true;save.dev=true;persist();updW2Btn();Snd.play('buy');toast('Entwicklermodus aktiv')}
  else{Snd.play('no');toast('Falscher Code');d.classList.remove('shake');void d.offsetWidth;d.classList.add('shake');setTimeout(()=>{d.hidden=true;d.classList.remove('shake')},350)}}
$('#bDevOk').onclick=devTry;$('#devIn').addEventListener('keydown',e=>{if(e.key==='Enter')devTry()});
$('#bDevOff').onclick=()=>{save.dev=false;Perf.stop();persist();updW2Btn();toast('Entwicklermodus beendet')};/*}DEV*/
$('#bReset').onclick=()=>{const b=$('#bReset');if(!b.dataset.arm){b.dataset.arm='1';b.textContent='Wirklich alles löschen? Nochmal tippen';Snd.play('no');setTimeout(()=>{if(b.dataset.arm){b.dataset.arm='';b.textContent='Spielstand zurücksetzen'}},4000);return}
  save=freshSave();setWorld(1);persist();$('#settings').hidden=true;goHub();toast('Spielstand wurde zurückgesetzt')};
$('#bNova').onclick=()=>{show('nova');renderNova()};
$('#bWorlds').onclick=()=>{show('worlds');renderWorlds()};
function futureWorlds(){let rows='';for(let id=3;id<=WORLD_MAX;id++){const w=worldUnlockWave(id);rows+=`<div><span>Welt ${id}</span><b>${(save.best||0)>=w?'erreicht · in Arbeit':`ab Welle ${w}`}</b></div>`}
  return `<article class="hcard world lock" style="--c:#c7b8ff"><h3>Weitere Welten</h3><p>Alle 100 Wellen im Neon-Sektor öffnet sich eine neue Welt. Die Welten 3 bis ${WORLD_MAX} sind noch in Arbeit.</p><div class="cmp" style="--c:#c7b8ff">${rows}</div></article>`}
function renderWorlds(){const un2=w2Unlocked(save),b1=w2BonusForW1(save),b2=1+.01*(save.best||0);
  $('#wlist').innerHTML=[1,2].map(id=>{const Wd=WORLDS[id],ok=id===1||un2,act=W.id===id,best=id===1?save.best:save.w2.best;
    const bonus=id===1?`Bonus aus der Gitterfestung: ×${fmtD(b1,2)} Schaden`:`Bonus aus dem Neon-Sektor: ×${fmtD(b2,2)} Turmschaden`;
    return `<article class="hcard world ${ok?'':'lock'}" style="--c:${Wd.col}"><h3>${Wd.name}</h3><p>${Wd.text}</p>
      <div class="cmp" style="--c:${Wd.col}"><div><span>Rekord</span><b>Welle ${best||0}</b></div><div><span>Weltenbonus</span><b>${bonus.split(': ')[1]}</b></div></div>
      <p class="trayinfo">${bonus.split(': ')[0]}. ${id===1?'Jede Welle Rekord in der Gitterfestung gibt hier +2 % Schaden.':'Jede Welle Rekord im Neon-Sektor gibt hier +1 % Turmschaden.'}</p>
      ${ok?(act?'<button class="btn" disabled>Aktive Welt</button>':`<button class="btn big" data-world="${id}" style="--c:${Wd.col}">Welt betreten</button>`):`<button class="btn poor" disabled>Freischaltung bei Welle ${worldUnlockWave(id)} im Neon-Sektor</button>`}</article>`}).join('')+futureWorlds();
  $$('[data-world]').forEach(b=>b.onclick=()=>{setWorld(+b.dataset.world);Snd.play('nova');goHub();toast(`Willkommen in: ${W.name}`)})}
/* ---------- Flotte: Drohnenklassen freischalten, aufwerten und ihre Verteilung einstellen ---------- */
const fleetOn=id=>droneUnlocked(save,id);
const fleetSum=()=>DRONE_IDS.reduce((s,id)=>s+(fleetOn(id)?save.fleet[id].p:0),0);
function renderFleet(){renderCurs();const S=stats(save),sum=fleetSum(),F=save.fleet;
  $('#fbar').innerHTML=`<div class="slotinfo"><b>${S.drones}</b> Drohnen gleichzeitig · <b>${sum} %</b> verteilt${sum<100?`, ${100-sum} % frei`:''}</div><div class="fdist" aria-hidden="true">${DRONE_IDS.filter(id=>fleetOn(id)&&F[id].p>0).map(id=>`<i style="width:${F[id].p}%;background:${DRONES[id].col}"></i>`).join('')}</div>${sum?(sum<100?'<p class="hint">Gebaut wird im Verhältnis der eingestellten Anteile.</p>':''):'<p class="hint">Nichts verteilt. Die Basis baut dann nur Jäger.</p>'}`;
  $('#flist').innerHTML=DRONE_IDS.map(id=>{const D=DRONES[id],st=F[id],un=fleetOn(id),lm=droneLm(st.l),lm1=droneLm(st.l+1),rep=id==='repair';let act='',prev='',share='';
    const stat=rep?`<div>Basis pro Sekunde<b>${fmtD(REPAIR_BASE*repairMul(st.l)*100,2)} %</b></div><div>Verbündete<b>${fmtD(REPAIR_ALLY*repairMul(st.l)*100,1)} %</b></div><div>Leben<b>${fv(S.droneHp*lm*D.hp)}</b></div>`
      :`<div>Schaden<b>${fv(S.droneDmg*lm*D.dmg)}${D.shots?' × '+D.shots:''}</b></div><div>Leben<b>${fv(S.droneHp*lm*D.hp)}</b></div><div>Tempo<b>${D.sp}</b></div>`;
    if(un){if(st.l<DRONE_MAX){const rows=[['<small>Aufwerten</small> Stufe',`${st.l}`,`${st.l+1}`]];
        if(rep)rows.push(['Basis pro Sekunde',fmtD(REPAIR_BASE*repairMul(st.l)*100,2)+' %',fmtD(REPAIR_BASE*repairMul(st.l+1)*100,2)+' %']);else rows.push(['Schaden',fv(S.droneDmg*lm*D.dmg),fv(S.droneDmg*lm1*D.dmg)]);
        rows.push(['Leben',fv(S.droneHp*lm*D.hp),fv(S.droneHp*lm1*D.hp)]);prev=cmpRows(rows,D.col);
        const [c,a]=droneLvlCost(st.l);act=`<button class="btn ${canPay(c,a)?'':'poor'}" data-fl="${id}" style="--c:${D.col}">${costBtn('Aufwerten',c,a)}</button>`}
      else act='<button class="btn" disabled>Maximal ausgebaut</button>';
      share=`<div class="fshare"><span>Anteil an der Flotte</span><span style="display:flex;align-items:center;gap:8px"><button class="btn icon sm" data-fp="${id}:-5" aria-label="Anteil ${D.name} verringern">−</button><b>${st.p} %</b><button class="btn icon sm" data-fp="${id}:5" aria-label="Anteil ${D.name} erhöhen">+</button></span></div>`}
    else if(typeof D.unlock==='string')act=`<button class="btn poor" disabled>Im Skilltree: „${NODES[D.unlock].name}“</button>`;
    else{const [c,a]=D.unlock;act=`<button class="btn ${canPay(c,a)?'':'poor'}" data-fu="${id}" style="--c:${D.col}">${costBtn('Freischalten',c,a)}</button>`}
    return `<article class="hcard ${un?'':'lock'}" style="--c:${D.col}"><div class="hc-top"><canvas data-d="${id}" width="112" height="112"></canvas><div><h3>${D.name}</h3><small>${D.role}</small></div>
      <div class="lvl">${un?`<small>Stufe</small><br>${st.l}<small> / ${DRONE_MAX}</small>`:'<small>Gesperrt</small>'}</div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${D.text}</p><div class="stats">${stat}</div>${share}${prev}<div class="hc-act">${act}</div></article>`}).join('');
  $$('#flist canvas[data-d]').forEach(cv=>{const id=cv.dataset.d,c=cv.getContext('2d'),s=R.droneSprite(id);c.clearRect(0,0,112,112);c.drawImage(s,16,16,80,80)})}
$('#fleet').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const F=save.fleet;
  if(b.dataset.fp){const [id,d]=b.dataset.fp.split(':'),st=F[id];
    // Anteile werden nie automatisch umverteilt (Vorgabe des Nutzers): Plus geht nur, solange noch Prozente frei sind, Minus bis 0. Summe höchstens 100.
    const free=100-fleetSum(),step=+d>0?Math.min(+d,free):-Math.min(-d,st.p);
    if(+d>0&&free<=0){Snd.play('no');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast('Schon 100 % verteilt. Verringere erst eine andere Klasse.');return}
    st.p+=step;
    persist();renderFleet();return}
  if(b.dataset.fu){const id=b.dataset.fu,D=DRONES[id];if(pay(D.unlock[0],D.unlock[1],b)){F[id].u=1;F[id].p=0;persist();renderFleet();toast(`${D.name} ist freigeschaltet. Stell den Anteil ein.`)}return}
  if(b.dataset.fl){const id=b.dataset.fl,st=F[id],[c,a]=droneLvlCost(st.l);if(pay(c,a,b)){st.l++;persist();renderFleet()}}});
$('#bFleet').onclick=()=>{show('fleet');renderFleet()};

/* ---------- Enzyklopädie: was man besiegt hat, getrennt nach Gegnern und Bossen ---------- */
const CODEX_TYPES=['swarm','brute','shooter','sprinter','healer','queen','shield','bomber','ram','splitter','mite','cloaker','tank','siege','revenant','jammer','commander','giant','jumper','shade','phaser','hacker','brooder','egg','thief','mortar','gas','sniper','mirror','pair'];
function renderCodex(){const K=save.kills||{},n=t=>K[t]||0;let h='<h3 class="sect">Gegner</h3>';
  const card=(known,col,cv,name,sub,text,count,extra)=>`<article class="hcard ${known?'':'lock'}" style="--c:${known?col:'#5f5c8c'}"><div class="hc-top">${known?cv:'<div class="unk">?</div>'}<div><h3>${known?name:'Unbekannt'}</h3><small>${sub}</small>${extra||''}</div>${known?`<div class="lvl"><small>Besiegt</small><br>${fmtN(count)}</div>`:''}</div><p style="margin:0;color:var(--muted);font-size:13px">${known?text:'Noch nicht besiegt.'}</p></article>`;
  for(const t of CODEX_TYPES){const T=ETYPES[t],k=n(t),sh=n('shiny:'+t);
    h+=card(k>0,T.col,`<canvas data-e="${t}" width="112" height="112"></canvas>`,T.name,t==='mite'?(k?'entsteht aus Spaltern':'Herkunft unbekannt'):`ab Welle ${T.from||1}`,T.text,k,sh?`<div class="shiny">✦ Schillernd besiegt${sh>1?' ×'+fmtN(sh):''}</div>`:'')}
  h+=card(n('elite')>0,'#ffe14f','<canvas data-e="elite" width="112" height="112"></canvas>','Elite','jede Art, ab Welle 1','Jeder Gegner kann als Elite erscheinen: fünffaches Leben, doppelter Schaden, mehr Beute.',n('elite'));
  h+='<h3 class="sect">Bosse</h3>';
  for(const name of BOSS_NAMES){const B=BOSS_KINDS[name],k=n('boss:'+name);
    h+=card(k>0,ETYPES.boss.col,`<canvas data-e="boss" width="112" height="112"></canvas>`,name,'Boss · alle 10 Wellen',`<b style="color:var(--ink);font-weight:600">${B.abil}:</b> ${B.text}`,k)}
  h+=card(n('twin')>0,'#ff6b84','<canvas data-e="twin" width="112" height="112"></canvas>','Doppelboss','alle 25 Wellen','Zwei Bosse verschiedener Art greifen von gegenüberliegenden Seiten an.',n('twin'));
  $('#clist').innerHTML=h;
  $$('#clist canvas[data-e]').forEach(cv=>{const t=cv.dataset.e,c=cv.getContext('2d'),dr=(type,r,col,x,y,w)=>{const s=R.enemySprite(type,r,col);c.drawImage(s,x,y,w,w)};
    if(t==='elite'){dr('brute',20,ETYPES.brute.col,14,14,84);const s=R.eliteRing(20);c.drawImage(s,6,6,100,100)}
    else if(t==='twin'){dr('boss',24,ETYPES.boss.col,0,18,72);dr('boss',24,ETYPES.boss.col,40,22,72)}
    else if(t==='boss')dr('boss',24,ETYPES.boss.col,4,4,104);
    else dr(t,20,ETYPES[t].col,6,6,100)})}
$('#bCodex').onclick=()=>{show('codex');renderCodex()};

/* ---------- Erfolge: jeweils Bronze, Silber, Gold. Rein zum Sammeln, ohne Belohnung. ---------- */
const achKills=s=>{const K=s.kills||{};let n=K.boss||0;for(const t of CODEX_TYPES)n+=K[t]||0;return n};
const achK=t=>s=>(s.kills&&s.kills[t])||0;
const ACH=[
 {id:'welle',name:'Verteidiger',text:'Höchste erreichte Welle im Neon-Sektor',val:s=>s.best||0,tiers:[25,100,300]},
 {id:'kills',name:'Jäger',text:'Besiegte Gegner insgesamt',val:achKills,tiers:[1000,100000,10000000]},
 {id:'boss',name:'Bossjäger',text:'Besiegte Bosse',val:achK('boss'),tiers:[10,100,1000]},
 {id:'twin',name:'Zwillingstöter',text:'Besiegte Doppelbosse',val:achK('twin'),tiers:[1,25,250]},
 {id:'elite',name:'Elitejäger',text:'Besiegte Elite-Gegner',val:achK('elite'),tiers:[50,2000,50000]},
 {id:'arten',name:'Artenkenner',text:'Verschiedene Gegnerarten besiegt',val:s=>CODEX_TYPES.filter(t=>achK(t)(s)>0).length,tiers:[3,6,CODEX_TYPES.length]},
 {id:'bossarten',name:'Bosskenner',text:'Verschiedene Boss-Arten besiegt',val:s=>BOSS_NAMES.filter(b=>achK('boss:'+b)(s)>0).length,tiers:[2,4,BOSS_NAMES.length]},
 {id:'sprinter',name:'Sprinterfänger',text:'Besiegte Sprinter',val:achK('sprinter'),tiers:[100,5000,100000]},
 {id:'schild',name:'Schildbrecher',text:'Besiegte Schildträger',val:achK('shield'),tiers:[25,1000,25000]},
 {id:'spalter',name:'Kernspalter',text:'Besiegte Spalter',val:achK('splitter'),tiers:[25,1000,25000]},
 {id:'belagerer',name:'Belagerungsbrecher',text:'Besiegte Belagerer',val:achK('siege'),tiers:[10,500,10000]},
 {id:'heiler',name:'Heilerjäger',text:'Besiegte Heiler',val:achK('healer'),tiers:[25,1000,25000]},
 {id:'bomber',name:'Bombenentschärfer',text:'Bomber vor der Basis abgefangen',val:achK('bomber'),tiers:[25,1000,25000]},
 {id:'abwurf',name:'Glücksgriff',text:'Abwürfe mit dem Impuls ausgelöst',val:s=>s.dropsUsed||0,tiers:[5,100,2000]},
 {id:'koenigin',name:'Königsmörder',text:'Besiegte Schwarmköniginnen',val:achK('queen'),tiers:[10,500,10000]},
 {id:'tarner',name:'Enttarner',text:'Besiegte Tarner',val:achK('cloaker'),tiers:[25,1000,25000]},
 {id:'huene',name:'Riesentöter',text:'Besiegte Hünen',val:achK('giant'),tiers:[5,250,5000]},
 {id:'ei',name:'Nesträuber',text:'Eier zerstört, bevor etwas schlüpft',val:achK('egg'),tiers:[10,500,10000]},
 {id:'dieb',name:'Diebesfänger',text:'Diebe vor der Basis abgefangen',val:achK('thief'),tiers:[25,1000,25000]},
 {id:'helden',name:'Heldenriege',text:'Freigeschaltete Helden',val:s=>HERO_IDS.filter(id=>s.heroes[id]&&s.heroes[id].u).length,tiers:[2,4,HERO_IDS.length]},
 {id:'flotte',name:'Flottenadmiral',text:'Freigeschaltete Drohnenklassen',val:s=>DRONE_IDS.filter(id=>droneUnlocked(s,id)).length,tiers:[2,4,DRONE_IDS.length]},
 {id:'tuerme',name:'Baumeister',text:'Freigeschaltete Türme im Neon-Sektor',val:s=>TOWER_IDS.filter(id=>s.towers[id]&&s.towers[id].u).length,tiers:[2,4,TOWER_IDS.length]},
 {id:'baum',name:'Baumpfleger',text:'Knoten im Skilltree des Neon-Sektors mit mindestens einer Stufe',val:s=>Object.keys(s.nodes||{}).filter(k=>k!=='root'&&s.nodes[k]>0&&NODES[k]).length,tiers:[10,40,Object.keys(NODES).length-1]},
 {id:'runs',name:'Ausdauer',text:'Gespielte Runs',val:s=>s.runs||0,tiers:[25,500,5000]},
 {id:'nova',name:'Sternentod',text:'Gezündete Supernovas',val:s=>s.nova||0,tiers:[1,25,250]},
 {id:'gitter',name:'Weltenwanderer',text:'Höchste erreichte Welle in der Gitterfestung',val:s=>(s.w2&&s.w2.best)||0,tiers:[10,50,150]},
 {id:'shiny',name:'Erstes Schillern',text:'Einen schillernden Gegner besiegt',val:s=>{const K=s.kills||{};return Object.keys(K).some(k=>k.startsWith('shiny:')&&K[k]>0)?1:0},tiers:[1]}];
const MEDALS=[['Bronze','#d08a4e'],['Silber','#c8d2e6'],['Gold','#ffe14f']];
const achTier=a=>{const v=a.val(save);return a.tiers.filter(t=>v>=t).length};
// Einzel-Erfolge mit nur einer Stufe zählen als Gold
const achMedal=(a,i)=>MEDALS[a.tiers.length===1?2:i];
function achCheck(){const A=save.ach||(save.ach={});let msg=null,n=0;for(const a of ACH){const t=achTier(a);if(t>(A[a.id]||0)){A[a.id]=t;n++;msg=`Erfolg: ${a.name} (${achMedal(a,t-1)[0]})`}}if(n){persist();toast(n>1?`${n} neue Erfolge`:msg);Snd.play('abil')}}
// Ein Erfolg bleibt verdeckt (kein Name, keine Beschreibung, keine Schwellen), bis seine erste Stufe erreicht ist. Danach sind auch die weiteren Stufen sichtbar.
function renderAchv(){let got=0,all=0,open=0;const cards=ACH.map(a=>{const v=a.val(save),t=achTier(a),next=a.tiers[t],prev=t?a.tiers[t-1]:0;got+=t;all+=a.tiers.length;
    if(!t)return '<article class="hcard lock" style="--c:#5f5c8c"><div class="hc-top"><div class="unk">?</div><div><h3>Verborgener Erfolg</h3><small>Noch nicht freigeschaltet</small></div></div></article>';open++;
    const meds=a.tiers.map((_,i)=>{const [nm,col]=achMedal(a,i);return `<span class="medal ${i<t?'on':''}" style="--m:${col}" title="${nm}: ${fmtN(a.tiers[i])}" aria-label="${nm} ${i<t?'erreicht':'offen'}">${nm[0]}</span>`}).join('');
    const col=t?achMedal(a,t-1)[1]:'#5f5c8c',pct=next?clamp((v-prev)/(next-prev),0,1)*100:100;
    return `<article class="hcard" style="--c:${col}"><div class="hc-top"><div><h3>${a.name}</h3><small>${a.text}</small></div><div class="medals">${meds}</div></div>
      <div class="prog"><i style="width:${pct.toFixed(1)}%"></i></div><div class="progt"><span>${next?`Nächste Stufe: ${achMedal(a,t)[0]}`:'Alle Stufen erreicht'}</span><b>${fmtN(v)}${next?' / '+fmtN(next):''}</b></div></article>`}).join('');
  $('#alist').innerHTML=`<article class="hcard" style="--c:#ffe14f"><div class="hc-top"><div><h3>${got} von ${all} Medaillen</h3><small>${open} von ${ACH.length} Erfolgen entdeckt. Erfolge sind zum Sammeln da und bringen keinen Vorteil im Spiel.</small></div></div><div class="prog"><i style="width:${(got/all*100).toFixed(1)}%"></i></div></article>`+cards}
$('#bAchv').onclick=()=>{show('achv');renderAchv()};
$('#bTree').onclick=()=>{show('tree');renderTree();treeHome()};
$('#bHeroes').onclick=()=>{show('heroes');renderHeroes()};
$$('[data-back]').forEach(b=>b.onclick=goHub);

/* ---------- run ---------- */
function startRun(){Snd.init();const S=stats(save);save.team=save.team.filter(id=>save.heroes[id]&&save.heroes[id].u).slice(0,S.slots);
  $('#bBuild').dataset.init='';$('#phaseBar').dataset.key='';
  run=new W.Run(save,{banner,sfx:n=>Snd.play(n)});if(W.id===2)save.w2.runs=(save.w2.runs||0)+1;run.hw=R.hwe;run.hh=R.hhe;if(aimPos){run.cx=clamp(aimPos[0],-run.hw,run.hw);run.cy=clamp(aimPos[1],-run.hh,run.hh)}aimDown=false;paused=false;endShown=false;endBuild();
  save.runs++;persist();show('hud');buildChips();$('#bSpeed').textContent=speed+'×';
  if(save.runs===1)setTimeout(()=>toast(matchMedia('(pointer:coarse)').matches?'Wische irgendwo über das Feld, um den Kreis zu schieben. Tippen setzt ihn direkt.':'Dein Impuls trifft alles im Kreis. Führe ihn mit der Maus auf die Gegner.'),2400);
  else if(W.id===1&&!save.team.length&&HERO_IDS.some(id=>save.heroes[id].u))toast('Kein Held eingesetzt. Das geht im Heldenmenü.')}
$('#bStart').onclick=startRun;
$('#bPause').onclick=()=>{if(run&&!run.over){endBuild();paused=true;$('#pause').hidden=false}};
$('#bResume').onclick=()=>{paused=false;$('#pause').hidden=true};
$('#bQuit').onclick=()=>{paused=false;$('#pause').hidden=true;if(run&&!run.over){run.quit=true;run.end()}};
$('#bSpeed').onclick=()=>{speed=speed===1?2:speed===2?4:speed===4?8:1;save.speed=speed;persist();$('#bSpeed').textContent=speed+'×'};
$('#bBack').onclick=goHub;
function showEnd(){endShown=true;if(W.id===1){save.dropsUsed=(save.dropsUsed||0)+(run.dropN||0);const K=save.kills||(save.kills={});for(const t in run.killsBy)K[t]=(K[t]||0)+run.killsBy[t]}setTimeout(achCheck,1200);$('#eTitle').textContent=run.quit?'Run beendet':'Basis zerstört';const g=run.gain,ws=W.s(),prev=ws.best||0;for(const c of W.curIds)ws.cur[c]+=Math.floor(g[c]||0);
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
  const bs=run.en.filter(e=>e.boss&&e.hp>0),bb=$('#bossBar');bb.hidden=!bs.length;
  if(bs.length){let hp=0,mx=0;for(const e of bs){hp+=Math.max(0,e.hp);mx+=e.max}
    // beim Doppelboss zählt der Balken beide zusammen; ist einer besiegt, bleibt sein Anteil leer
    if(run.twin)mx=Math.max(mx,run.twinMax=Math.max(run.twinMax||0,mx));
    bb.querySelector('b').textContent=(run.twin?'Doppelboss · ':'Boss · ')+bs.map(e=>e.name).join(' & ');bb.querySelector('i').style.width=(hp/mx*100).toFixed(1)+'%';bb.querySelector('span').textContent=fmtN(hp)}
}

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
  if(trayOpen||towerSel){endBuild();return}if(buildSel||moveT){buildDown=true;ghostAt(e);return}const [x,y]=screenToWorld(e);const T=towerAt(x,y);aimDown=true;aimDrag=false;aimStart=aimLast=[e.clientX,e.clientY];
  // Auf einem Turm: erst beim Loslassen entscheiden. Kurzes Antippen ohne Bewegung öffnet das Menü, Ziehen bewegt den Impuls-Zeiger.
  if(T){towerTap={T,x:e.clientX,y:e.clientY,t:performance.now()};return}towerTap=null;if(e.pointerType==='mouse')aimAt(e)});
/* Zeiger für den Impuls. Klicken macht keinen Schaden mehr.
   Maus: der Zeiger folgt ihr direkt.
   Finger: wie ein Trackpad – Wischen irgendwo auf dem Feld schiebt den Zeiger um die gewischte Strecke × AIM_GAIN, damit der Finger nichts verdeckt.
   Kurzes Antippen ohne Bewegung setzt ihn direkt an die Stelle. Beim Loslassen bleibt er liegen. */
let aimDown=false,aimDrag=false,aimStart=null,aimLast=null,aimPos=null,towerTap=null;const TAP_MOVE=8,TAP_MS=400,AIM_GAIN=1.5;
function aimBy(dx,dy){if(!run||run.over)return;run.cx=clamp(run.cx+dx/R.se*AIM_GAIN,-run.hw,run.hw);run.cy=clamp(run.cy+dy/R.se*AIM_GAIN,-run.hh,run.hh);aimPos=[run.cx,run.cy]}
function aimAt(e){if(!run||run.over)return;const [x,y]=screenToWorld(e);run.cx=clamp(x,-run.hw,run.hw);run.cy=clamp(y,-run.hh,run.hh);aimPos=[run.cx,run.cy]}
$('#cv').addEventListener('pointermove',e=>{if(!run||paused||buildSel||moveT||trayOpen||towerSel||$('#hud').hidden)return;if(towerTap){if(Math.abs(e.clientX-towerTap.x)+Math.abs(e.clientY-towerTap.y)<=TAP_MOVE)return;towerTap=null}
  if(e.pointerType==='mouse'){aimAt(e);return}if(!aimDown)return;
  if(!aimDrag){if(Math.abs(e.clientX-aimStart[0])+Math.abs(e.clientY-aimStart[1])<=TAP_MOVE)return;aimDrag=true;aimLast=[e.clientX,e.clientY];return}
  aimBy(e.clientX-aimLast[0],e.clientY-aimLast[1]);aimLast=[e.clientX,e.clientY]});
$('#cv').addEventListener('pointerup',e=>{const tt=towerTap;towerTap=null;
  if(tt){if(run&&!run.over&&!paused&&performance.now()-tt.t<=TAP_MS&&run.towers.includes(tt.T))openTower(tt.T);return}
  if(aimDown&&!aimDrag&&e.pointerType!=='mouse'&&run&&!paused&&!buildSel&&!moveT&&!trayOpen&&!towerSel)aimAt(e)});
for(const ev of['pointerup','pointercancel'])addEventListener(ev,()=>{aimDown=false;towerTap=null});
addEventListener('resize',()=>{R.resize();if(run){run.hw=R.hwe;run.hh=R.hhe}if(!$('#tree').hidden)treeHome()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(Snd.ctx)Snd.ctx.resume().catch(()=>{});return}Snd.suspend();{if(run&&!run.over){paused=true;$('#pause').hidden=false;save.pending={world:W.id,g:Object.fromEntries(W.curIds.map(c=>[c,Math.floor(run.gain[c]||0)])),w:run.w}}persist()}});
addEventListener('contextmenu',e=>e.preventDefault());


/* ---------- before/after previews ---------- */
const fv=v=>typeof v==='string'?v:v>=100?fmtN(v):fmtD(v,Math.abs(v-Math.round(v))<.005?0:1);
const FMT={n:fv,i:v=>String(Math.round(v)),s:v=>v?fmtD(v,1)+' s':'–',x:v=>'×'+fmtD(v,2),pct:v=>fmtD(v,0)+' %',t:v=>v};
const PREV={
 b1:[['Basisleben',S=>S.baseHp,'n'],['Schaden pro Geschütz- und Autofeuer-Schuss',S=>S.turretDmg,'n']],b2a:[['Schild',S=>S.baseHp*S.shieldPct,'n']],b2b:[['Reparatur pro Sekunde',S=>S.baseHp*S.regen,'n']],
 b3a:[['Geschütztürme',S=>S.turrets,'i'],['Schaden pro Schuss',S=>S.turrets?S.turretDmg:0,'n']],
 b3b:[['Schockwellen-Schaden',S=>S.pulse?S.pulseDmg:0,'n'],['Anteil am Gegnerleben',S=>fmtD(S.pulsePct*100,1)+' %','t'],['Abklingzeit',S=>S.pulse?S.pulseCd:0,'s']],
 b4a:[['Schaden pro Geschütz- und Autofeuer-Schuss',S=>S.turretDmg,'n']],b4b:[['Abklingzeit der Schockwelle',S=>S.pulseCd,'s']],
 b5:[['Basisleben',S=>S.baseHp,'n'],['Geschützreichweite',S=>S.turretRange,'i']],
 u1:[['Drohnen',S=>S.drones,'i']],u2a:[['Drohnenschaden',S=>S.droneDmg,'n']],u2b:[['Bauzeit pro Drohne',S=>S.droneSpawn,'s']],
 u3a:[['Drohnenleben',S=>S.droneHp,'n']],u3b:[['Drohnen',S=>S.drones,'i']],u4:[['Drohnenreichweite',S=>S.droneRange,'i'],['Waffe',S=>S.droneBeam?'Strahl':'Kanone','t']],
 u5:[['Schwere Kampfschiffe',S=>S.mother?'Ja':'Nein','t']],
 h1:[['Heldenschaden',S=>S.heroDmg,'x']],h2a:[['Heldenplätze',S=>S.slots,'i']],h2b:[['Heldenleben',S=>S.heroHp,'x']],h3a:[['Heldenplätze',S=>S.slots,'i']],
 h3b:[['Wiederbelebung',S=>S.revive,'s']],h4:[['Abklingzeit der Fähigkeiten',S=>S.abilityCd,'x']],h5:[['Heldenplätze',S=>S.slots,'i']],
 f1:[['Schaden pro Impuls',S=>S.tapDmg*S.impMul,'n']],f2a:[['Kritische Impulse',S=>S.tapCrit*100,'pct']],f2b:[['Impulsradius',S=>S.tapR,'i']],
 f1b:[['Impuls alle',S=>fmtD(S.impInt,2)+' s','t'],['Schaden pro Impuls',S=>S.tapDmg*S.impMul,'n'],['Impulsschaden pro Sekunde',S=>S.tapDmg*S.impMul/S.impInt,'n']],
 f3a:[['Schaden jedes 5. Impulses',S=>S.beat?S.tapDmg*S.impMul*(1+S.beat):0,'n']],
 f3b:[['Schaden der Überladung',S=>S.overload?S.tapDmg*S.impMul*(4+2*S.overload):0,'n']],f4:[['Zusätzliche Kettenziele',S=>S.chain,'i']],f5:[['Schaden pro Impuls',S=>S.tapDmg*S.impMul,'n']],
 e1:[['Splitter',S=>S.gS*S.gAll,'x']],e2a:[['Kerne',S=>S.gK*S.gAll,'x']],e2b:[['Startwelle',S=>S.startWave,'i']],e3a:[['Prismen',S=>S.gP*S.gAll,'x']],
 e3b:[['Elite-Gegner',S=>S.elite,'x']],
 b4c:[['Feuerrate der Geschütze',S=>S.turretRate,'x']],b5b:[['Radius der Schockwelle',S=>S.pulseR,'i']],b6:[['Basisleben',S=>S.baseHp,'n']],
 b7a:[['Schildaufladung',S=>S.shRegen,'x'],['Schild',S=>S.baseHp*S.shieldPct,'n']],b7b:[['Schaden pro Geschütz- und Autofeuer-Schuss',S=>S.turretDmg,'n']],b8:[['Basisleben',S=>S.baseHp,'n']],b9:[['Erlittener Schaden',S=>S.dmgTaken*100,'pct']],
 u3c:[['Feuerrate der Drohnen',S=>S.droneRate,'x']],u4b:[['Bonus pro aktiver Drohne',S=>S.swarmInt*100,'pct']],u6:[['Drohnenschaden',S=>S.droneDmg,'n'],['Drohnenleben',S=>S.droneHp,'n']],u7a:[['Drohnen',S=>S.drones,'i']],
 u7b:[['Drohnenschaden',S=>S.droneDmg,'n'],['Drohnenleben',S=>S.droneHp,'n']],u8:[['Drohnenschaden',S=>S.droneDmg,'n'],['Drohnenleben',S=>S.droneHp,'n']],u9:[['Feuerrate der Drohnen',S=>S.droneRate,'x']],
 h3c:[['Angriffstempo',S=>S.heroRate,'x']],h4b:[['Krit-Chance der Helden',S=>S.heroCrit*100,'pct']],h6:[['Heldenschaden',S=>S.heroDmg,'x']],h7a:[['Heldenleben',S=>S.heroHp,'x']],
 h7b:[['Heldenschaden',S=>S.heroDmg,'x']],h8:[['Heldenschaden',S=>S.heroDmg,'x']],h9:[['Stärke der Fähigkeiten',S=>S.abilPow,'x']],
 f2c:[['Autofeuer pro Sekunde',S=>S.autoRate,'n'],['Schaden pro Schuss',S=>S.autoRate?S.turretDmg*S.autoDmg:0,'n']],f3c:[['Schaden pro Schuss',S=>S.turretDmg*S.autoDmg,'n'],['Zielt auf Gruppen',S=>S.autoAim?'Ja':'Nein','t']],f4b:[['Schaden pro Impuls',S=>S.tapDmg*S.impMul,'n']],
 f6:[['Schaden pro Impuls',S=>S.tapDmg*S.impMul,'n']],f7:[['Autofeuer pro Sekunde',S=>S.autoRate,'n']],
 h5c:[['Klinge-Schaden',S=>S.heroDmg*S.heroSelf*HEROES.klinge.dmg,'n']],
 b5c:[['Schaden pro Geschütz- und Autofeuer-Schuss',S=>S.turretDmg,'n'],['Schaden der Schockwelle',S=>S.pulseDmg,'n']],u5c:[['Drohnenschaden',S=>S.droneDmg,'n']],
 b6b:[['Schaden durch Geschosse',S=>S.rangedRes*100,'pct']],b8b:[['Geschützreichweite',S=>S.turretRange,'i']],u5b:[['Reparatur der Drohnen pro Sekunde',S=>S.droneRegen*100,'pct']],u8b:[['Tempo der Drohnen',S=>S.droneSp,'x']],
 h5b:[['Heilung der Helden pro Sekunde',S=>S.heroRegen*100,'pct']],h8b:[['Heldenplätze',S=>S.slots,'i']],f5b:[['Impulsschaden gegen Elite und Bosse',S=>1+S.impBig,'x']],
 f7b:[['Impulsradius im Schatten',S=>S.tapR*S.shadeMul,'i']],e4c:[['Energie aus Gegnern',S=>S.energyGain,'x']],f8:[['Weltenbrecher alle … Impulse',S=>S.megaTap||'–','t']],
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
function nodeState(n){if(n.id==='root')return{l:1,cls:'root max'};const N=W.s().nodes,l=N[n.id]||0,lock=!((N[n.parent]||0)>0)&&!l,max=l>=n.max;   // bereits gekaufte Knoten bleiben sichtbar, auch wenn sich ihr Vorgänger geändert hat
  const aff=!lock&&!max&&canPay(n.cur,nodeCost(n,l));return{l,lock,max,aff,cls:[lock?'locked':'',l>0?'owned':'',max?'max':'',aff?'afford':''].join(' ')}}
// Hintergrund des Skilltrees: ein farbiger Sektor je Ast mit dem Astnamen an einer Sektorgrenze, Ringe für die Tiefe, feines Punktraster.
// Rein dekorativ und statisch (ein SVG, keine Animation pro Frame).
function treeBackdrop(){const BRS=W.br,ids=Object.keys(BRS),half=PI/ids.length,ND=Object.values(W.nodes),maxD=Math.ceil(Math.max(...ND.map(n=>n.depth)))+1,RR=118*(maxD+.8),f=v=>v.toFixed(1);
  let s=`<defs><pattern id="tdots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#aab6ff" fill-opacity=".13"/><circle cx="21" cy="21" r=".8" fill="#aab6ff" fill-opacity=".08"/></pattern></defs><circle r="${f(RR)}" fill="url(#tdots)"/>`;
  for(const id of ids){const B=BRS[id],a=B.a*PI/180,a0=a-half,a1=a+half,x0=Math.cos(a0)*RR,y0=Math.sin(a0)*RR,x1=Math.cos(a1)*RR,y1=Math.sin(a1)*RR;
    s+=`<path d="M0 0L${f(x0)} ${f(y0)}A${f(RR)} ${f(RR)} 0 0 1 ${f(x1)} ${f(y1)}Z" fill="${B.col}" fill-opacity=".05"/><line x1="0" y1="0" x2="${f(x0)}" y2="${f(y0)}" stroke="#ffffff" stroke-opacity=".07" stroke-dasharray="3 9"/>`;
    // Astname: einmal, parallel zu einer Grenze des eigenen Sektors, knapp innerhalb davon. Welche Grenze, steht in ls.
    const side=B.ls||1,t=a+side*half,R1=118*2.75,off=24,nx=Math.cos(t-side*PI/2),ny=Math.sin(t-side*PI/2),x=Math.cos(t)*R1+nx*off,y=Math.sin(t)*R1+ny*off;
    let rot=t*180/PI;if(Math.cos(t)<-1e-6)rot+=180;
    s+=`<text class="brname" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" text-anchor="middle" dominant-baseline="middle" fill="${B.col}" fill-opacity=".5" font-size="34">${B.name.toUpperCase()}</text>`}
  for(let d=1;d<=maxD;d++)s+=`<circle r="${118*d}" fill="none" stroke="#ffffff" stroke-opacity="${d%3===0?.09:.05}" stroke-dasharray="${d%3===0?'none':'2 10'}"/>`;
  return s+`<circle r="58" fill="none" stroke="${W.col}" stroke-opacity=".35" stroke-width="1.5"/><circle r="74" fill="none" stroke="${W.col}" stroke-opacity=".15" stroke-dasharray="4 8"/>`}
function renderTree(){renderCurs();let lines='';const NS=W.nodes,BRS=W.br,SN=W.s().nodes;
  for(const n of Object.values(NS)){if(!n.parent)continue;const p=NS[n.parent],on=(SN[n.id]||0)>0,col=BRS[n.br].col;
    lines+=`<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" stroke="${col}" stroke-width="${on?3:2}" stroke-opacity="${on?.9:.22}" ${on?`style="filter:drop-shadow(0 0 4px ${col})"`:'stroke-dasharray="5 6"'}/>`}
  let html=`<svg width="1600" height="1600" viewBox="-800 -800 1600 1600" aria-hidden="true">${treeBackdrop()}${lines}</svg>`;
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
  if(id==='mute')return[['Wirkung','Fähigkeiten aus'],['Radius',String(r)]];
  if(id==='mark')return[['Impulsschaden','+'+fmtD((f.mark-1)*100,0)+' %'],['Radius',String(r)]];
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
    <div class="resets"><p><span>Wird zurückgesetzt:</span> Skilltree, Währungen, Helden-, Flotten- und Turmstufen</p><p><span>Bleibt erhalten:</span> freigeschaltete Helden, Drohnenklassen und Türme, die Verteilung der Flotte, Bauplätze, Rekord, Quanten und Quanten-Upgrades</p></div>
    <button class="btn big ${qg>0?'':'poor'}" id="bNovaGo" style="--c:#c7b8ff">Supernova zünden</button>`;
  const b=$('#bNovaGo');b.onclick=()=>{if(qg<=0){Snd.play('no');b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');toast(`Die Supernova braucht mindestens Welle ${NOVA_MIN}`);return}
    if(!b.dataset.arm){b.dataset.arm='1';b.textContent='Wirklich zünden? Nochmal tippen';setTimeout(()=>{if(b.isConnected&&b.dataset.arm){b.dataset.arm='';b.textContent='Supernova zünden'}},4000);return}
    supernova()};
  $('#novaList').innerHTML=Object.values(PRES).map(p=>{const l=save.pr[p.id]||0,max=l>=p.max,c=max?0:presCost(p,l);
    const S0=stats(save),S1=max?null:stats({...save,pr:{...save.pr,[p.id]:l+1}});const rows=[['Stufe',`${l}`,max?undefined:`${l+1}`]];
    const pv={dmg:[['Klinge-Schaden',S=>fv(S.heroDmg*HEROES.klinge.dmg)],['Schaden pro Impuls',S=>fv(S.tapDmg*S.impMul)],['Drohnenschaden',S=>fv(S.droneDmg)]],hp:[['Basisleben',S=>fv(S.baseHp)]],
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
  save.cur={s:0,k:0,p:0,d:0};save.nodes={root:1};for(const id of HERO_IDS){save.heroes[id].l=1;save.heroes[id].a=0}for(const id of TOWER_IDS)save.towers[id].l=1;for(const id of DRONE_IDS)save.fleet[id].l=1;
  const L=save.pr.legacy||0;if(L)for(const n of Object.values(NODES))if(n.cur==='s')save.nodes[n.id]=Math.min(n.max,L);
  const st=save.pr.start||0;if(st){save.cur.s=200*Math.pow(3,st-1);save.cur.k=st*5}
  save.cycleBest=0;save.team=save.team.slice(0,stats(save).slots);persist();
  const f=$('#flash');f.classList.remove('go');void f.offsetWidth;f.classList.add('go');Snd.play('nova');
  renderNova();toast(`Supernova! +${fmtN(g)} Quanten`)}

/* ---------- boot + loop ---------- */
if(save.pending&&save.pending.g){const ps=save.pending.world===2?save.w2:save;for(const c in save.pending.g)ps.cur[c]=(ps.cur[c]||0)+(save.pending.g[c]||0);ps.best=Math.max(ps.best||0,save.pending.w||0);ps.cycleBest=Math.max(ps.cycleBest||0,save.pending.w||0);save.pending=null;persist();
  setTimeout(()=>toast('Belohnungen aus deinem letzten Run wurden gutgeschrieben'),600)}
R.setTheme(W.id);document.documentElement.dataset.wtheme=W.id;UI.host.dataset.wtheme=W.id;
$$('.ver').forEach(e=>e.textContent='Version '+VERSION+(STAGE?' '+STAGE:''));save.ver=VERSION;
if(!save.ach){save.ach={};for(const a of ACH)save.ach[a.id]=achTier(a);persist()}
goHub();
/*DEV{*/{const mt=Music.tick.bind(Music);Music.tick=()=>{if(!Perf.on)return mt();const a=performance.now();mt();Perf.mus+=performance.now()-a}}
if(save.dev&&save.devPerf)Perf.start();/*}DEV*/
let last=performance.now(),acc=0,hudT=0,pendT=0;
function loop(now){const raw=now-last,dt=Math.min(.1,raw/1000);last=now;const pf=Perf.on,p0=pf?performance.now():0;let p1=p0,p2=p0,ns=0;
  if(run&&!paused&&run.world===2&&!buildPaused())run.tickBuild(dt);
  if(run&&!paused){run.hw=R.hwe;run.hh=R.hhe;acc+=buildPaused()?0:dt*speed;let n=0;while(acc>=1/60&&n<20){run.step(1/60);acc-=1/60;n++}if(n>=20)acc=0;ns=n;
    if(run.over&&buildPaused())endBuild();
    if(run.over&&run.overT>(run.quit?1.2:2.3)&&!endShown)showEnd();
    pendT+=dt;if(pendT>2&&!run.over){pendT=0;save.pending={world:W.id,g:Object.fromEntries(W.curIds.map(c=>[c,Math.floor(run.gain[c]||0)])),w:run.w};persist()}
    if(pf)p1=performance.now();
    hudT+=dt;if(hudT>.1&&!Perf.freeze){hudT=0;updHud();updBuildBtn();musicState()}}
  else if(!run)Music.set({menu:true,E:0,W:0,danger:0,boss:false,tr:W.id===2?5:0});
  if(pf)p2=performance.now();
  if($('#tree').hidden&&$('#heroes').hidden&&$('#nova').hidden&&$('#towers').hidden&&$('#codex').hidden&&$('#achv').hidden&&$('#fleet').hidden&&!Perf.noDraw)R.frame(run,paused?0:run&&buildPaused()?dt*.15:dt*(run?speed:1));
  if(pf)Perf.frame(now,raw,{st:p1-p0,hud:Math.max(0,p2-p1),draw:performance.now()-p2,ns,en:run?run.en.length:0,w:run?run.w:0,sp:speed});
  requestAnimationFrame(loop)}
requestAnimationFrame(loop);
