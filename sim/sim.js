#!/usr/bin/env node
// Neon Bastion – Balancing-Simulation
//   node sim.js                       Karriere-Simulation (Zeit bis Welle 25/50/75/100)
//   node sim.js upgrades --at 25,50   Upgrade-Messung an Kontrollpunkten
//   node sim.js aeste                 Ast-Vergleich: jede Kombination der fünf Skilltree-Äste
//   node sim.js probe --at 45,70      Probe am festen Spielstand: wenige Runs statt ganzer Karriere
// Alle Optionen: node sim.js --hilfe
const {Worker,isMainThread,parentPort,workerData}=require('worker_threads');
const os=require('os'),fs=require('fs'),path=require('path');
const bot=require('./bot2.js');

if(!isMainThread){
  parentPort.on('message',msg=>{
    if(msg.type==='career'){const res=bot.simulate(msg.opt,row=>parentPort.postMessage({type:'row',row}));parentPort.postMessage({type:'done',res})}
    else if(msg.type==='bench'){parentPort.postMessage({type:'bench',id:msg.id,res:bot.benchmark(msg.job)})}
    else if(msg.type==='probe'){parentPort.postMessage({type:'probe',res:bot.probe(msg.job)})}});
  return}

/* ---------- Optionen ---------- */
const argv=process.argv.slice(2),mode=argv[0]&&!argv[0].startsWith('--')?argv[0]:'karriere';
const arg=(k,d)=>{const i=argv.indexOf('--'+k);return i>=0?argv[i+1]:d};
if(argv.includes('--hilfe')||argv.includes('--help')){console.log(`
Neon Bastion – Balancing-Simulation

  node sim.js [karriere|upgrades|aeste|probe] [Optionen]

Karriere (Standard): komplette Spielerkarriere, bis Welle --ziel
  --seeds 4          Anzahl paralleler Simulationen (verschiedene Zufallswerte)
  --ziel 100         Zielwelle
  --maxruns 600      Abbruch nach so vielen Runs
  --stunden 300      Abbruch nach so vielen Stunden Spielzeit (1x)
  --zeiger ruht      Zeiger für den Impuls: ruht (liegt knapp über der Basis, Idle-Spieler), zielt (folgt alle 0,25 s der dichtesten Gruppe, aktiver Spieler), aus (kein Impuls)
  --pause 20         Sekunden, die ein Mensch zwischen zwei Runs in Menüs verbringt
  --stall 4          Supernova, wenn der Rekord so viele Runs nicht steigt

Upgrades: misst, wie viele Wellen ein Upgrade bringt
  --at 25,50         Kontrollpunkte (Rekord-Welle), an denen gemessen wird
  --stufen 5         So viele Stufen werden pro Upgrade testweise hinzugefügt
  --wiederholungen 4 Test-Runs pro Upgrade (mit verschiedenen Zufallswerten)

Ast-Vergleich (aeste): Karriere mit jeder Kombination erlaubter Skilltree-Äste, gleiche Spielzeit für alle
  --seeds 3          Durchläufe je Kombination
  --stunden 2        Spielzeit (1×) je Durchlauf
  --groesse 1,2,3,4,5  nur Kombinationen mit so vielen Ästen
  --tuerme an        an oder aus: darf der Bot Türme freischalten und aufwerten

Probe (probe): derselbe Spielstand spielt wenige Runs, wahlweise gegen zwei Fassungen des Spielcodes
  --at 25,45,70      Rekorde, bei denen ein Spielstand genommen wird (einmal erspielt, dann aufbewahrt)
  --runs 10          Runs je Spielstand und Fassung
  --gegen ORDNER     zweiter src-Ordner zum Vergleich, z. B. nach „git worktree add /tmp/alt v0.14.1“ der Ordner /tmp/alt/src
  --neu              Spielstände neu erspielen

Allgemein
  --kerne N          Anzahl Prozessorkerne (Standard: alle außer einem)
  --dt 0.05          Simulationsschritt in Sekunden (kleiner = genauer, langsamer)
  --ausgabe ergebnisse   Ordner für CSV- und Markdown-Dateien
`);process.exit(0)}
const CORES=Math.max(1,+arg('kerne',Math.max(1,os.cpus().length-1)));
const OUT=arg('ausgabe',path.join(__dirname,'ergebnisse'));fs.mkdirSync(OUT,{recursive:true});
const base={zeiger:arg('zeiger','ruht'),dt:+arg('dt',.05),maxRunSec:4000,stallRuns:+arg('stall',4),milestones:[25,50,75,100,150,200]};
const fmtT=s=>{s=Math.round(s);const h=Math.floor(s/3600),m=Math.round((s%3600)/60);return h?`${h} h ${m} min`:`${m} min`};
const median=a=>{const b=a.slice().sort((x,y)=>x-y);return b.length?b[Math.floor((b.length-1)/2)]:NaN};
const t0=Date.now(),wall=()=>fmtT((Date.now()-t0)/1000);

/* ---------- Worker-Pool ---------- */
function pool(n){const ws=[],queue=[],busy=new Set();let onIdle=null;
  for(let i=0;i<n;i++){const w=new Worker(__filename);ws.push(w)}
  return{ws,run(msg,handler){return new Promise(res=>{queue.push({msg,handler,res});pump()})},close(){ws.forEach(w=>w.terminate())}};
  function pump(){for(const w of ws){if(busy.has(w)||!queue.length)continue;const job=queue.shift();busy.add(w);
    const on=m=>{if(m.type==='row'){job.handler&&job.handler(m.row);return}w.off('message',on);busy.delete(w);job.res(m);pump()};w.on('message',on);w.postMessage(job.msg)}}}

/* ---------- Karriere ---------- */
async function karriere(){const seeds=+arg('seeds',Math.min(CORES,4)),target=+arg('ziel',100),overhead=+arg('pause',20);
  const opt={...base,target,maxRuns:+arg('maxruns',600),maxGameHours:+arg('stunden',300)};
  console.log(`Karriere-Simulation: ${seeds} Durchläufe parallel auf ${CORES} Kernen, Ziel Welle ${target}, Zeiger: ${base.zeiger}\n`);
  const csv=fs.createWriteStream(path.join(OUT,'karriere_runs.csv'));let head=false;
  const P=pool(Math.min(CORES,seeds));
  const results=await Promise.all(Array.from({length:seeds},(_,i)=>P.run({type:'career',opt:{...opt,seed:i+1}},row=>{
    if(!head){csv.write(Object.keys(row).join(';')+'\n');head=true}csv.write(Object.values(row).join(';')+'\n');
    console.log(`[${wall()}] Seed ${row.seed} | Run ${String(row.run).padStart(3)} | Zyklus ${row.cycle} | Welle ${String(row.wave).padStart(3)} (Start ${row.startWave}) | Rekord ${row.best} | ${fmtT(row.totalMin*60)} Spielzeit${row.event?' | '+row.event:''}`)}).then(m=>m.res)));
  P.close();csv.end();
  // Auswertung
  let md=`# Karriere-Simulation (Zeiger: ${base.zeiger})\n\nErstellt: ${new Date().toLocaleString('de-DE')} · ${seeds} Durchläufe · Ziel Welle ${target} · Rechenzeit ${wall()}\n\n`;
  md+=`Die Spielzeit ist die reine Zeit in Runs bei 1×. Für die „Menschzeit“ wird sie durch die Geschwindigkeit geteilt und pro Run ${overhead} s für Menüs addiert.\n\n`;
  md+=`| Meilenstein | erreicht in | Runs (Median) | Supernovas (Median) | Spielzeit 1× (Median) | Mensch bei 1× | Mensch bei 4× | Mensch bei 8× |\n|---|---|---|---|---|---|---|---|\n`;
  for(const m of base.milestones){const hits=results.map(r=>r.milestones[m]).filter(Boolean);if(!hits.length){md+=`| Welle ${m} | 0 von ${seeds} | – | – | – | – | – | – |\n`;continue}
    const sec=median(hits.map(h=>h.totalSec)),runs=median(hits.map(h=>h.runs)),nov=median(hits.map(h=>h.supernovas));
    md+=`| Welle ${m} | ${hits.length} von ${seeds} | ${runs} | ${nov} | ${fmtT(sec)} | ${fmtT(sec+runs*overhead)} | ${fmtT(sec/4+runs*overhead)} | ${fmtT(sec/8+runs*overhead)} |\n`}
  md+=`\n## Ergebnis je Durchlauf\n\n| Seed | Runs | Rekord | Supernovas | Spielzeit 1× |\n|---|---|---|---|---|\n`;
  for(const r of results)md+=`| ${r.seed} | ${r.runs} | ${r.best} | ${r.supernovas} | ${fmtT(r.totalSec)} |\n`;
  // Ausgaben je Upgrade
  const agg={};for(const r of results)for(const e of Object.values(r.spend)){const a=agg[e.id]||(agg[e.id]={id:e.id,name:e.name,levels:0,w:0,s:0,k:0,p:0,d:0,q:0});a.levels+=e.levels;for(const c of ['s','k','p','d','q'])a[c]+=e[c];a.w+=['s','k','p','d'].reduce((x,c)=>x+e[c]*bot.WEIGHT[c],0)}
  const totW=Object.values(agg).reduce((x,a)=>x+a.w,0)||1,list=Object.values(agg).sort((a,b)=>b.w-a.w);
  md+=`\n## Wofür der Bot seine Währungen ausgegeben hat\n\nAnteil = gewichtete Ausgaben (1 Kern = 40 Splitter, 1 Prisma = 400, 1 Sternenstaub = 4000). Stufen = gekaufte Stufen über alle Durchläufe.\n\n| Upgrade | Anteil | Stufen | Splitter | Kerne | Prismen | Sternenstaub | Quanten |\n|---|---|---|---|---|---|---|---|\n`;
  for(const a of list)md+=`| ${a.name} | ${(a.w/totW*100).toFixed(1)} % | ${a.levels} | ${Math.round(a.s)} | ${Math.round(a.k)} | ${Math.round(a.p)} | ${Math.round(a.d)} | ${Math.round(a.q)} |\n`;
  fs.writeFileSync(path.join(OUT,'karriere_zusammenfassung.md'),md);
  console.log('\n'+md.split('\n## Ergebnis')[0]);console.log(`Vollständige Auswertung: ${path.join(OUT,'karriere_zusammenfassung.md')}\nAlle Runs: ${path.join(OUT,'karriere_runs.csv')}`)}

/* ---------- Upgrade-Messung ---------- */
async function upgrades(){const at=String(arg('at','25,50')).split(',').map(Number),N=+arg('stufen',5),REP=+arg('wiederholungen',4);
  console.log(`Upgrade-Messung an Rekord-Welle ${at.join(', ')} · +${N} Stufen pro Upgrade · ${REP} Test-Runs je Upgrade · ${CORES} Kerne\n`);
  const P=pool(CORES);
  console.log('Schritt 1: Spielstände für die Kontrollpunkte erspielen …');
  const {res:car}=await P.run({type:'career',opt:{...base,seed:1,target:Math.max(...at),maxRuns:+arg('maxruns',600),maxGameHours:+arg('stunden',300),snapshotsAt:at}},
    row=>{if(row.event)console.log(`  [${wall()}] Run ${row.run} · Rekord ${row.best} · ${row.event}`)});
  for(const m of at){const save=car.snapshots[m];if(!save){console.log(`Welle ${m} wurde nicht erreicht, übersprungen.`);continue}
    const cands=bot.candidates(save,N),jobs=[];console.log(`\nSchritt 2 (Welle ${m}): ${cands.length} Upgrades × ${REP} Runs + Vergleich …`);
    const opt={...base};let done=0;const total=(cands.length+1)*REP;
    const runSet=mod=>Promise.all(Array.from({length:REP},(_,i)=>P.run({type:'bench',id:0,job:{save,mod,seed:1000+i,opt}}).then(x=>{done++;if(done%20===0)process.stdout.write(`  ${done}/${total} Test-Runs (${wall()})\n`);return x.res.wave})));
    const baseW=await runSet(null),b0=baseW.reduce((a,b)=>a+b,0)/REP;
    const rows=await Promise.all(cands.map(async c=>{const ws=await runSet(c.mod),avg=ws.reduce((a,b)=>a+b,0)/REP,w=['s','k','p','d'].reduce((x,k)=>x+c.cost[k]*bot.WEIGHT[k],0);
      return{name:c.name,stufen:c.mod.n,delta:avg-b0,waves:ws.join('/'),cost:c.cost,eff:w>0?(avg-b0)/w*1000:0}}));
    rows.sort((a,b)=>b.delta-a.delta);
    const cs=c=>['s','k','p','d'].filter(k=>c[k]).map(k=>`${Math.round(c[k])} ${({s:'Splitter',k:'Kerne',p:'Prismen',d:'Sternenstaub'})[k]}`).join(' + ')||'–';
    let md=`# Upgrade-Messung bei Rekord-Welle ${m}\n\nErstellt: ${new Date().toLocaleString('de-DE')} · Vergleichs-Runs ohne Änderung: Ø Welle ${b0.toFixed(1)} (${baseW.join('/')}) · jeweils ${REP} Test-Runs ab Welle 1, ohne Tippen\n\n`;
    md+=`„Effizienz“ = zusätzliche Wellen pro 1.000 gewichteter Kosten (1 Kern = 40 Splitter, 1 Prisma = 400). Hohe Werte bedeuten: billig und stark, eher zu stark. Werte um 0: Upgrade wirkt kaum.\n\n`;
    md+=`| Upgrade | + Stufen | Δ Wellen | Test-Runs | Kosten | Effizienz |\n|---|---|---|---|---|---|\n`;
    for(const r of rows)md+=`| ${r.name} | ${r.stufen} | ${r.delta>=0?'+':''}${r.delta.toFixed(1)} | ${r.waves} | ${cs(r.cost)} | ${r.eff.toFixed(2)} |\n`;
    fs.writeFileSync(path.join(OUT,`upgrades_welle${m}.md`),md);
    fs.writeFileSync(path.join(OUT,`upgrades_welle${m}.csv`),'upgrade;stufen;delta_wellen;tests;splitter;kerne;prismen;sternenstaub;effizienz\n'+rows.map(r=>[r.name,r.stufen,r.delta.toFixed(2),r.waves,r.cost.s,r.cost.k,r.cost.p,r.cost.d,r.eff.toFixed(3)].join(';')).join('\n'));
    console.log('\n'+md.split('\n').slice(0,4+Math.min(rows.length,15)+3).join('\n'));console.log(`… vollständig in ${path.join(OUT,`upgrades_welle${m}.md`)}`)}
  P.close()}

/* ---------- Ast-Vergleich ---------- */
// Spielt die Karriere mit jeder Kombination erlaubter Skilltree-Äste und vergleicht, wie weit man in gleicher Spielzeit kommt.
async function aeste(){const seeds=+arg('seeds',3),hours=+arg('stunden',2),sizes=String(arg('groesse','1,2,3,4,5')).split(',').map(Number),tuerme=arg('tuerme','an');
  const BR={b:'Basis',u:'Einheiten',h:'Helden',f:'Fokus',e:'Ertrag'},ids=Object.keys(BR),combos=[''];
  for(let m=1;m<32;m++){const c=ids.filter((_,i)=>m>>i&1);if(sizes.includes(c.length))combos.push(c.join(''))}
  combos.sort((a,b)=>a.length-b.length||ids.indexOf(a[0])-ids.indexOf(b[0])||a.localeCompare(b));
  const name=c=>c?[...c].map(x=>BR[x]).join(' + '):'kein Ast';
  console.log(`Ast-Vergleich: ${combos.length} Kombinationen × ${seeds} Seeds, je ${hours} h Spielzeit, Zeiger: ${base.zeiger}, Türme: ${tuerme}, ${CORES} Kerne\n`);
  const P=pool(CORES),res={};let done=0;const total=combos.length*seeds;
  await Promise.all(combos.flatMap(c=>Array.from({length:seeds},(_,i)=>P.run({type:'career',opt:{...base,seed:i+1,target:9999,maxRuns:+arg('maxruns',2000),maxGameHours:hours,aeste:c,tuerme}}).then(m=>{
    (res[c]||(res[c]=[])).push(m.res);done++;if(res[c].length===seeds)console.log(`[${wall()}] ${String(done).padStart(3)}/${total} · ${name(c).padEnd(52)} Rekord ${res[c].map(r=>r.best).sort((a,b)=>a-b).join('/')}`)}))));
  P.close();
  const med=(c,f)=>median(res[c].map(f)),best=c=>med(c,r=>r.best),sg=x=>(+x>=0?'+':'')+x;
  let md=`# Ast-Vergleich\n\nErstellt: ${new Date().toLocaleString('de-DE')} · ${seeds} Seeds je Kombination · ${hours} h Spielzeit (1×) je Durchlauf · Zeiger: ${base.zeiger} · Türme: ${tuerme} · Rechenzeit ${wall()}\n\n`;
  md+=`Der Bot darf nur Knoten der genannten Äste kaufen. Helden (Freischalten, Stufen, Aufstieg) zählen zum Helden-Ast. Supernova und Quanten-Upgrades sind immer erlaubt. „Rekord“ ist die höchste Welle nach ${hours} h Spielzeit.\n\n`;
  md+=`| Äste | Anzahl | Rekord (Median) | Rekord je Seed | Runs | Supernovas |\n|---|---|---|---|---|---|\n`;
  for(const c of combos)md+=`| ${name(c)} | ${c.length} | ${best(c)} | ${res[c].map(r=>r.best).sort((a,b)=>a-b).join(' / ')} | ${med(c,r=>r.runs)} | ${med(c,r=>r.supernovas)} |\n`;
  md+=`\n## Beitrag je Ast\n\nMittlerer Gewinn an Wellen, wenn der Ast zu einer Kombination hinzukommt. „allein“ = gegenüber gar keinem Ast, „als letzter“ = wenn er als fünfter zu den vier anderen kommt.\n\n| Ast | allein | Ø über alle Kombinationen | als letzter |\n|---|---|---|---|\n`;
  for(const b of ids){const d=[];for(const c of combos){if(c.includes(b))continue;const w=ids.filter(x=>x===b||c.includes(x)).join('');if(res[w])d.push(best(w)-best(c))}
    const rest=ids.filter(x=>x!==b).join(''),all=ids.join('');
    md+=`| ${BR[b]} | ${res[b]?sg(best(b)-best('')):'–'} | ${d.length?sg((d.reduce((a,x)=>a+x,0)/d.length).toFixed(1)):'–'} | ${res[rest]&&res[all]?sg(best(all)-best(rest)):'–'} |\n`}
  fs.writeFileSync(path.join(OUT,'aeste.md'),md);
  fs.writeFileSync(path.join(OUT,'aeste.csv'),'aeste;anzahl;seed;rekord;runs;supernovas;spielzeit_min\n'+combos.flatMap(c=>res[c].map(r=>[name(c),c.length,r.seed,r.best,r.runs,r.supernovas,(r.totalSec/60).toFixed(0)].join(';'))).join('\n'));
  console.log('\n'+md);console.log(`Gespeichert in ${path.join(OUT,'aeste.md')}`)}

/* ---------- Probe am festen Spielstand ---------- */
// Schnelle Antwort auf „macht diese Änderung das Spiel an dieser Stelle schwerer oder leichter?“:
// Spielstände bei bestimmten Rekorden werden einmal erspielt und aufbewahrt, danach treten sie in wenigen Runs gegen den Spielcode an.
// Mit --gegen <Ordner> spielt derselbe Spielstand zusätzlich gegen den Spielcode aus einem anderen src-Ordner (z. B. einem älteren Stand).
async function probe(){const at=String(arg('at','25,45,70')).split(',').map(Number),REP=+arg('runs',10),other=arg('gegen',null),dir=path.join(__dirname,'ergebnisse','staende');
  fs.mkdirSync(dir,{recursive:true});const file=m=>path.join(dir,`stand_${m}.json`),need=at.filter(m=>argv.includes('--neu')||!fs.existsSync(file(m)));
  const P=pool(CORES);
  if(need.length){console.log(`Spielstände für Rekord ${need.join(', ')} werden erspielt (einmalig, danach aus ${path.relative(process.cwd(),dir)}/) …`);
    const {res:car}=await P.run({type:'career',opt:{...base,zeiger:'ruht',seed:1,target:Math.max(...need),maxRuns:+arg('maxruns',600),maxGameHours:+arg('stunden',300),snapshotsAt:need}},
      row=>{if(row.event)console.log(`  [${wall()}] Run ${row.run} · Rekord ${row.best} · ${row.event}`)});
    for(const m of need)if(car.snapshots[m])fs.writeFileSync(file(m),JSON.stringify(car.snapshots[m]));else console.log(`  Rekord ${m} wurde nicht erreicht.`)}
  const vars=[['aktueller Stand',null]];if(other)vars.push(['Vergleich: '+other,path.resolve(other)]);
  let md=`# Probe am festen Spielstand\n\nErstellt: ${new Date().toLocaleString('de-DE')} · ${REP} Runs je Zeile · Zeiger: ${base.zeiger} · Start jeweils 10 Wellen unter dem Rekord\n\n| Spielstand | Variante | Ø Welle | niedrigste – höchste | Ø Run-Dauer |\n|---|---|---|---|---|\n`;
  for(const m of at){if(!fs.existsSync(file(m)))continue;const save=JSON.parse(fs.readFileSync(file(m),'utf8'));
    const out=await Promise.all(vars.map(([name,src])=>Promise.all(Array.from({length:REP},(_,i)=>P.run({type:'probe',job:{save,seed:1000+i,src,opt:{...base}}}).then(x=>x.res)))));
    out.forEach((rs,vi)=>{const w=rs.map(r=>r.wave),avg=w.reduce((a,b)=>a+b,0)/w.length;
      md+=`| Rekord ${save.best} | ${vars[vi][0]} | ${avg.toFixed(1)} | ${Math.min(...w)} – ${Math.max(...w)} | ${fmtT(rs.reduce((a,r)=>a+r.sec,0)/rs.length)} |\n`})}
  P.close();md+=`\nRechenzeit ${wall()}.\n`;fs.writeFileSync(path.join(OUT,'probe.md'),md);console.log('\n'+md)}

({upgrades,aeste,probe}[mode]||karriere)().catch(e=>{console.error(e);process.exit(1)});
