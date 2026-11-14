// Neon Bastion – Simulations-Bot (Neon-Sektor, ohne Tippen)
// Lädt den originalen Spielcode aus ./game und spielt komplette Karrieren oder einzelne Test-Runs.
const fs=require('fs'),vm=require('vm'),path=require('path');

function seededRandom(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
const SRC=['core.js','core2.js','game.js','game2.js'].map(f=>fs.readFileSync(path.join(__dirname,'..','src',f),'utf8')).join('\n');
const SCRIPT=new vm.Script(SRC+';Object.assign(this,{Run,freshSave,NODES,nodeCost,heroLvlCost,stats,HEROES,PRES,presCost,quantaFor,TOWERS,TOWER_IDS,towerLvlCost,slotCost,SLOT_EXTRA,HERO_MAX,TOWER_MAX});');
function loadGame(seed){const M=Object.create(Math);M.random=seededRandom(seed);
  const ctx={console,Math:M,Set,Map,Array,Object,JSON,Number,String,Infinity,NaN,isFinite,parseInt,parseFloat};vm.createContext(ctx);SCRIPT.runInContext(ctx);return ctx}
const clone=o=>JSON.parse(JSON.stringify(o));
const WEIGHT={s:1,k:40,p:400,d:4000,q:1};

// Zielender Zeiger: wie ein aufmerksamer Spieler alle 0,25 s auf die Stelle ziehen, an der der Impuls die meisten Gegner trifft.
// Bei Gleichstand gewinnt die Gruppe, die der Basis am nächsten ist. Ohne Gegner bleibt der Zeiger liegen.
function aimPointer(r){const en=r.en,n=en.length;if(!n)return;const R=r.S.tapR,step=Math.max(1,Math.floor(n/40));let best=null,bn=0,bd=Infinity;
  for(let i=0;i<n;i+=step){const e=en[i];if(e.hp<=0)continue;const d=Math.sqrt(e.x*e.x+e.y*e.y);if(d>420)continue;let c=0;
    r.query(e.x,e.y,R+40,o=>{const dx=o.x-e.x,dy=o.y-e.y;if(Math.sqrt(dx*dx+dy*dy)<R+o.r)c++});
    if(c>bn||(c===bn&&d<bd)){bn=c;bd=d;best=e}}
  if(best){r.cx=best.x;r.cy=best.y}}

// Einen Run spielen. Türme werden automatisch gebaut, Tippen gibt es nicht.
function playRun(X,save,opt){const r=new X.Run(save,{});r.headless=opt.headless!==false;r.hw=330;r.hh=700;r.noImpulse=opt.zeiger==='aus';const aimS=opt.zeiger==='zielt';let aimT=0;const ang=[.8,2.4,4,5.5,1.6,3.2];let ti=0;
  const types=X.TOWER_IDS.filter(t=>save.towers[t].u),pref=['weak','frost','cryo'].filter(t=>types.includes(t));
  while(!r.over&&r.t<opt.maxRunSec){r.step(opt.dt);
    if(aimS&&(aimT-=opt.dt)<=0){aimT=.25;aimPointer(r)}
    if(pref.length&&ti<r.towerSlots()){const ty=pref[ti%pref.length];if(r.energy>=r.buildCost(ty)&&r.place(ty,Math.cos(ang[ti])*110,Math.sin(ang[ti])*110))ti++}}
  return r}

// Liste aller Kaufoptionen (id, Währung, Kosten, Anwenden)
// opt.aeste: erlaubte Äste als Buchstabenfolge (b Basis, u Einheiten, h Helden, f Fokus, e Ertrag); fehlt die Angabe, ist alles erlaubt.
// Helden (Freischalten, Stufen, Aufstieg) gehören zum Helden-Ast. opt.tuerme==='aus' sperrt Turm-Käufe.
const allowBr=(opt,br)=>!opt||opt.aeste==null||opt.aeste.includes(br);
function options(X,save,opt){const S=X.stats(save),o=[],heroes=allowBr(opt,'h'),towers=!opt||opt.tuerme!=='aus';
  for(const n of Object.values(X.NODES)){if(n.id==='root'||!allowBr(opt,n.br))continue;const l=save.nodes[n.id]||0;if(l>=n.max||!(save.nodes[n.parent]>0))continue;
    if(n.id==='e2b'&&l>=Math.floor((save.best||0)/2))continue;
    o.push({id:n.id,name:n.name,cur:n.cur,cost:X.nodeCost(n,l),apply:()=>save.nodes[n.id]=l+1})}
  if(heroes)for(const id of save.team){const h=save.heroes[id];if(h.a<5)o.push({id:'aufstieg:'+id,name:'Aufstieg '+X.HEROES[id].name,cur:'p',cost:(h.a+1)*2,apply:()=>h.a++});
    if(h.l<X.HERO_MAX){const [cu,a]=X.heroLvlCost(h.l);o.push({id:'held:'+id,name:'Stufe '+X.HEROES[id].name,cur:cu,cost:a,apply:()=>h.l++})}}
  if(towers)for(const id of X.TOWER_IDS){const t=save.towers[id];if(t.u&&t.l<X.TOWER_MAX){const [cu,a]=X.towerLvlCost(t.l);o.push({id:'turm:'+id,name:'Startstufe '+X.TOWERS[id].name,cur:cu,cost:a,apply:()=>t.l++})}}
  if(towers&&(save.tslots||0)<X.SLOT_EXTRA){const [cu,a]=X.slotCost(save.tslots||0);o.push({id:'bauplatz',name:'Bauplatz',cur:cu,cost:a,apply:()=>save.tslots=(save.tslots||0)+1})}
  return o}
function unlocks(X,save,spend,opt){
  if(allowBr(opt,'h'))for(const id in X.HEROES){const h=save.heroes[id];if(!h.u){const [cu,a]=X.HEROES[id].unlock;if(save.cur[cu]>=a){save.cur[cu]-=a;h.u=1;track(spend,'frei:'+id,'Held '+X.HEROES[id].name,cu,a)}}}
  if(!opt||opt.tuerme!=='aus')for(const id of X.TOWER_IDS){const t=save.towers[id];if(!t.u&&X.TOWERS[id].unlock){const [cu,a]=X.TOWERS[id].unlock;if(save.cur[cu]>=a){save.cur[cu]-=a;t.u=1;track(spend,'frei:'+id,X.TOWERS[id].name,cu,a)}}}}
function track(spend,id,name,cur,cost){const e=spend[id]||(spend[id]={id,name,levels:0,s:0,k:0,p:0,d:0,q:0});e.levels++;e[cur]+=cost}

function buy(X,save,spend,opt){for(let c=0;c<20000;c++){unlocks(X,save,spend,opt);const S=X.stats(save);
  save.team=Object.keys(X.HEROES).filter(id=>save.heroes[id].u).slice(0,S.slots);
  const o=options(X,save,opt).sort((a,b)=>a.cost*WEIGHT[a.cur]-b.cost*WEIGHT[b.cur]);let done=false;
  for(const op of o){const c=Math.ceil(op.cost);if(save.cur[op.cur]>=c){save.cur[op.cur]-=c;op.apply();track(spend,op.id,op.name,op.cur,c);done=true;break}}
  if(!done)break}}
function buyPrestige(X,save,spend){for(let c=0;c<2000;c++){const o=Object.values(X.PRES).filter(p=>(save.pr[p.id]||0)<p.max).map(p=>[X.presCost(p,save.pr[p.id]||0)*(p.id==='dmg'||p.id==='hp'?.6:1),p]);
  if(!o.length)break;o.sort((a,b)=>a[0]-b[0]);const p=o[0][1],real=X.presCost(p,save.pr[p.id]||0);if(save.q<real)break;save.q-=real;save.pr[p.id]=(save.pr[p.id]||0)+1;track(spend,'nova:'+p.id,'Supernova: '+p.name,'q',real)}}
function supernova(X,save){const g=X.quantaFor(save.cycleBest,save);save.q+=g;save.nova=(save.nova||0)+1;save.cur={s:0,k:0,p:0,d:0};save.nodes={root:1};
  for(const id in save.heroes){save.heroes[id].l=1;save.heroes[id].a=0}for(const id of X.TOWER_IDS)save.towers[id].l=1;
  const L=save.pr.legacy||0;if(L)for(const n of Object.values(X.NODES))if(n.cur==='s')save.nodes[n.id]=Math.min(n.max,L);
  const st=save.pr.start||0;if(st){save.cur.s=200*Math.pow(3,st-1);save.cur.k=st*5}save.cycleBest=0;return g}

// Komplette Karriere simulieren
function simulate(opt,onRun){const X=loadGame(opt.seed),save=X.freshSave(),spend={},snaps={},ms={};let T=0,stall=0,cyc=1,runs=0;
  while(runs<opt.maxRuns&&T<opt.maxGameHours*3600){
    const S0=X.stats(save),pick=Math.max(1,Math.min(S0.startMax,(save.cycleBest||0)-10));save.startPick=pick>=S0.startMax?0:pick;
    const r=playRun(X,save,opt);runs++;T+=r.t;for(const c of ['s','k','p','d'])save.cur[c]+=Math.floor(r.gain[c]);
    if(r.w>save.cycleBest){save.cycleBest=r.w;stall=0}else stall++;save.best=Math.max(save.best,r.w);buy(X,save,spend,opt);
    const row={seed:opt.seed,run:runs,cycle:cyc,wave:r.w,startWave:X.stats(save).startWave,runSec:Math.round(r.t),totalMin:+(T/60).toFixed(1),best:save.best,cycleBest:save.cycleBest,
      s:Math.floor(r.gain.s),k:Math.floor(r.gain.k),p:Math.floor(r.gain.p),d:Math.floor(r.gain.d),treeLevels:Object.entries(save.nodes).reduce((a,[k,v])=>a+(k==='root'?0:v),0),heroes:save.team.length,supernovas:save.nova||0,event:''};
    for(const m of opt.milestones)if(!ms[m]&&save.best>=m){ms[m]={totalSec:T,runs,cycle:cyc,supernovas:save.nova||0};row.event+=`Welle ${m} erreicht; `}
    for(const m of (opt.snapshotsAt||[]))if(!snaps[m]&&save.best>=m)snaps[m]=clone(save);
    if(stall>=opt.stallRuns&&save.cycleBest>=25){const g=supernova(X,save);buyPrestige(X,save,spend);row.event+=`Supernova ${cyc} (+${g} Quanten); `;cyc++;stall=0}
    onRun&&onRun(row);if(save.best>=opt.target&&!(opt.snapshotsAt||[]).some(m=>!snaps[m]))break}
  return{seed:opt.seed,runs,totalSec:T,best:save.best,supernovas:save.nova||0,milestones:ms,spend,snapshots:snaps}}

// Einzelner Test-Run für die Upgrade-Messung: Spielstand + Änderung, gleicher Zufalls-Startwert
function benchmark(job){const X=loadGame(job.seed),save=clone(job.save);
  if(job.mod){const m=job.mod;
    if(m.kind==='node'){const n=X.NODES[m.id];save.nodes[m.id]=Math.min(n.max,(save.nodes[m.id]||0)+m.n)}
    else if(m.kind==='held'){const h=save.heroes[m.id];h.l=Math.min(X.HERO_MAX,h.l+m.n)}
    else if(m.kind==='aufstieg'){const h=save.heroes[m.id];h.a=Math.min(5,h.a+m.n)}
    else if(m.kind==='turm'){const t=save.towers[m.id];t.l=Math.min(X.TOWER_MAX,t.l+m.n)}
    else if(m.kind==='bauplatz'){save.tslots=Math.min(X.SLOT_EXTRA,(save.tslots||0)+m.n)}}
  const S=X.stats(save);save.team=Object.keys(X.HEROES).filter(id=>save.heroes[id].u).slice(0,S.slots);save.startPick=1;
  const r=playRun(X,save,job.opt);return{wave:r.w,sec:r.t}}

// Kandidaten für die Upgrade-Messung inklusive Kosten der zusätzlichen Stufen
function candidates(save,N){const X=loadGame(1),out=[];
  const costOf=(fn,from,n)=>{const c={s:0,k:0,p:0,d:0};for(let i=0;i<n;i++){const [cu,a]=fn(from+i);c[cu]+=a}return c};
  for(const n of Object.values(X.NODES)){if(n.id==='root'||!(save.nodes[n.parent]>0))continue;const l=save.nodes[n.id]||0;const k=Math.min(n.max>=999?N:n.max-l,n.max===1?1:N);if(k<=0)continue;
    out.push({mod:{kind:'node',id:n.id,n:k},name:n.name,cost:costOf(i=>[n.cur,X.nodeCost(n,i)],l,k)})}
  for(const id of Object.keys(X.HEROES)){const h=save.heroes[id];if(!h.u)continue;const k=Math.min(N,X.HERO_MAX-h.l);
    if(k>0)out.push({mod:{kind:'held',id,n:k},name:'Stufe '+X.HEROES[id].name,cost:costOf(i=>X.heroLvlCost(i),h.l,k)});
    if(h.a<5)out.push({mod:{kind:'aufstieg',id,n:1},name:'Aufstieg '+X.HEROES[id].name,cost:{s:0,k:0,p:(h.a+1)*2,d:0}})}
  for(const id of X.TOWER_IDS){const t=save.towers[id];if(!t.u)continue;const k=Math.min(N,X.TOWER_MAX-t.l);if(k>0)out.push({mod:{kind:'turm',id,n:k},name:'Startstufe '+X.TOWERS[id].name,cost:costOf(i=>X.towerLvlCost(i),t.l,k)})}
  if((save.tslots||0)<X.SLOT_EXTRA)out.push({mod:{kind:'bauplatz',id:'',n:1},name:'Bauplatz',cost:(()=>{const [cu,a]=X.slotCost(save.tslots||0);const c={s:0,k:0,p:0,d:0};c[cu]=a;return c})()});
  return out}
module.exports={simulate,benchmark,candidates,WEIGHT};
