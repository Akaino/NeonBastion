"""Boss-Arten: jede lädt ihre Fähigkeit sichtbar auf (Boss steht still, Anzeige mit Namen) und löst sie dann aus."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"b1":600,"e2b":60,"h2b":30,"u1":3},"heroes":{"klinge":{"u":1,"l":40,"a":0}},"team":["klinge"],"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
# Einen Boss der gewünschten Art neben einen Helden stellen, aufladen lassen und die Wirkung messen
PROBE="""kind=>{run.en.length=0;run.ep.length=0;run.queue.length=0;run.rushT=0;run.base.max=run.base.hp=1e15;const h=run.heroes[0];h.dead=0;h.max=h.hp=1e12;h.x=0;h.y=-120;
  run.spawnEnemy('boss',false,0,-200);const e=run.en[run.en.length-1];e.name=kind;e.hp=e.max=1e15;e.abT=0;e.sumT=1e9;e.sp=20;
  run.spawnEnemy('swarm',false,300,0);const sw=run.en[run.en.length-1];sw.hp=sw.max=1e15;
  const K=BOSS_KINDS[kind],out={kind,abil:K.abil};
  const tick=()=>{run.buildGrid();run.updEnemies(1/60);if(run.rushT>0)run.rushT-=1/60};
  tick();out.laedt=e.cast>0;out.label=bossLabel(e);const y0=e.y;for(let i=0;i<30;i++)tick();out.stehtStill=Math.abs(e.y-y0)<1e-9;
  h.x=0;h.y=-120;h.hp=h.max;const hy=h.y,n0=run.en.length,ep0=run.ep.length;
  for(let i=0;i<60*4&&e.cast>0;i++){h.x=0;h.y=-120;tick()}
  out.ausgeloest=e.cast===0;out.heldSchaden=h.max-h.hp>0;out.heldWeg=h.y-hy;out.neue=run.en.length-n0;out.geschoss=run.ep.slice(ep0).some(q=>q.big&&q.dmg>e.dmg*2.9);
  out.flut=run.rushT>0;const x0=sw.x;tick();out.tempo=(x0-sw.x)/(sw.sp/60);
  const hp=e.hp;run.hitE(e,1000);out.schaden=hp-e.hp;out.pause=e.abT>5;return out}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300);pg.click('#bStart');pg.wait_for_timeout(300);pg.evaluate("()=>{paused=true;run.noImpulse=true}")
    check(pg.evaluate("()=>Object.keys(BOSS_KINDS).join()")=='Titan,Koloss,Nemesis,Vortex,Hydra,Leviathan' and pg.evaluate("()=>Object.values(BOSS_KINDS).every(k=>k.abil&&k.text&&k.charge>=2&&k.cd>k.charge)"),'sechs Boss-Arten mit Fähigkeit, Beschreibung und Aufladezeit')
    R={k:pg.evaluate(PROBE,k) for k in ['Titan','Koloss','Nemesis','Vortex','Hydra','Leviathan']}
    check(all(r['laedt'] and r['stehtStill'] and r['ausgeloest'] and r['pause'] for r in R.values()),'jede Art lädt auf, steht dabei still, löst aus und pausiert danach')
    check(all(r['label']==f"BOSS · {k} · {r['abil']}" for k,r in R.items()),'Anzeige nennt die Fähigkeit: '+R['Titan']['label'])
    check(R['Titan']['heldSchaden'] and R['Titan']['heldWeg']>50,f"Titan – Erdstoß: Held verletzt und {R['Titan']['heldWeg']:.0f} Einheiten zurückgeworfen")
    check(abs(R['Koloss']['schaden']-200)<1e-6 and abs(R['Titan']['schaden']-1000)<1e-6,'Koloss – Panzerung: nimmt 80 % weniger Schaden')
    check(R['Nemesis']['geschoss'],'Nemesis – Vernichter: schweres Geschoss mit dreifachem Schaden auf die Basis')
    check(R['Vortex']['heldSchaden'] and R['Vortex']['heldWeg']<-30,f"Vortex – Sog: Held verletzt und {-R['Vortex']['heldWeg']:.0f} Einheiten herangezogen")
    check(R['Hydra']['neue']==8,'Hydra – Brut: acht Schwärmer auf einen Schlag')
    check(R['Leviathan']['flut'] and abs(R['Leviathan']['tempo']-1.5)<.3 and abs(R['Titan']['tempo']-1)<.3,f"Leviathan – Flut: Gegner {R['Leviathan']['tempo']:.2f}-mal so schnell")
    check(all(not r['flut'] for k,r in R.items() if k!='Leviathan') and all(r['neue']==0 for k,r in R.items() if k!='Hydra'),'jede Fähigkeit wirkt nur bei ihrer Art')
    # Anzeige im Spiel: Ring und Name während des Aufladens
    pg.evaluate("()=>{run.en.length=0;run.spawnEnemy('boss',false,0,-150);const e=run.en[0];e.name='Titan';e.hp=e.max=1e15;e.sp=0;e.abT=0;e.sumT=1e9;run.base.hp=run.base.max;paused=false}")
    pg.wait_for_timeout(1300);pg.screenshot(path='bf1_aufladen.png')
    check(pg.evaluate("()=>run.en[0].cast>0&&bossLabel(run.en[0])")=='BOSS · Titan · Erdstoß','im laufenden Spiel lädt der Boss sichtbar auf')
    # Zählung je Boss-Art für die Enzyklopädie
    k=pg.evaluate("()=>{const e=run.en[0];run.hitE(e,e.hp*2);return run.killsBy}")
    check(k.get('boss')==1 and k.get('boss:Titan')==1,'besiegte Bosse werden je Art gezählt: '+json.dumps(k))
    print('\n'.join(errs) or 'no errors');b.close()
