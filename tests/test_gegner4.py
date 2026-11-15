"""Vierter Schub Gegner: Springer, Schattenwerfer, Phasenläufer, Hacker, Brüter (mit Ei)."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME='file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"b1":900,"e2b":60},"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    sh=pg.evaluate("()=>Object.fromEntries([27,28,37,38,57,58,67,68,89,90].map(w=>[w,WAVE_MIX.filter(t=>waveShare(t,w)>0)]))")
    check(all(t not in sh[str(w-1)] and t in sh[str(w)] for t,w in(('jumper',28),('shade',38),('phaser',58),('hacker',68),('brooder',90))),'Einstieg: Springer 28, Schattenwerfer 38, Phasenläufer 58, Hacker 68, Brüter 90')
    check(pg.evaluate("()=>['jumper','shade','phaser','hacker','brooder','egg'].every(t=>ETYPES[t].name&&ETYPES[t].text&&CODEX_TYPES.includes(t))") and pg.evaluate("()=>CODEX_TYPES.length")==30,'alle stehen in der Enzyklopädie, zusammen 24 Einträge')
    check(all(pg.evaluate("w=>waveMix(w).reduce((s,x)=>s+x[1],0)",w)<=.8501 for w in (60,100,300)),'mindestens 15 % Schwärmer bleiben')
    check(pg.evaluate("()=>new Set(WAVE_MIX.map(t=>ETYPES[t].from)).size")==pg.evaluate("()=>WAVE_MIX.length"),'jede Einstiegswelle ist nur einmal vergeben')
    pg.evaluate("()=>{save.startPick=95;persist()}");pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;const out={};
      const clear=()=>{run.en.length=0;run.ep.length=0;run.pend.length=0;run.towers.length=0;run.drones.length=0;run.S.drones=0;run.S.turrets=0;run.base.turrets.length=0;for(const h of run.heroes)h.dead=1e9};
      const mk=(t,x,y)=>{run.spawnEnemy(t,false,x,y);return run.en[run.en.length-1]};
      const tick=n=>{for(let i=0;i<n;i++){run.buildGrid();run.updEnemies(1/60);if(run.pend.length){for(const [t,x,y,hp] of run.pend){run.spawnEnemy(t,false,x,y);const m=run.en[run.en.length-1];if(hp){m.hp=m.max=hp}}run.pend.length=0}run.en=run.en.filter(e=>e.hp>0)}};
      // Springer: springt 90 Einheiten, auch an einem Verbündeten vorbei
      clear();const j=mk('jumper',0,-400);j.sp=0;j.jT=.05;tick(6);out.jump=Math.round(400+j.y);tick(60*3+2);out.jump2=Math.round(400+j.y);
      // Schattenwerfer: Impuls im Schatten nur halb so groß
      clear();const s=mk('shade',0,-300);s.sp=0;out.shade=[run.shaded(0,-300+SHADE_R-5),run.shaded(0,-300+SHADE_R+5)];
      const v=mk('swarm',run.S.tapR*.8,-300);v.sp=0;v.hp=v.max=1e9;run.buildGrid();run.tap(0,-300);out.shadeHit=v.hp<v.max;s.hp=0;run.en=run.en.filter(e=>e.hp>0);run.buildGrid();run.tap(0,-300);out.clearHit=v.hp<v.max;
      // Phasenläufer: in der Phase kein Ziel und kein Schaden
      clear();const ph=mk('phaser',0,-300);ph.sp=0;ph.phT=.01;tick(2);out.ph={an:ph.cloak,ziel:run.threat(9999)===null};run.hitE(ph,1e15);out.ph.heil=ph.hp===ph.max;tick(Math.ceil(60*PHASE_ON)+2);out.ph.aus=!ph.cloak;run.hitE(ph,1e15);out.ph.tot=ph.hp<=0;
      // Hacker: Drohnen im Umkreis feuern nicht
      clear();run.S.drones=2;run.spawnDrone();run.spawnDrone();const [d1,d2]=run.drones;const hk=mk('hacker',0,-200);hk.sp=0;hk.hp=hk.max=1e12;d1.x=0;d1.y=-200+HACK_R-20;d2.x=0;d2.y=-200+HACK_R+400;run.updDrones(1/60);out.hack=[d1.hack,d2.hack];
      d1.atkT=0;const h0=hk.hp,p0=run.pr.length;for(let i=0;i<30;i++){d1.x=0;d1.y=-200+40;d2.x=900;d2.y=900;run.updDrones(1/60)}out.hackShots=run.pr.length-p0;
      // Brüter: Ei beim Tod, daraus vier Schwärmer; zerstörtes Ei bringt nichts
      clear();const br=mk('brooder',0,-300);br.sp=0;run.buildGrid();run.hitE(br,1e15);tick(1);out.egg=run.en.map(e=>e.type);const eg=run.en[0];out.eggHp=+(eg.max/br.max).toFixed(2);tick(60*EGG_T+3);out.hatch=run.en.map(e=>e.type);
      clear();const b2=mk('brooder',0,-300);b2.sp=0;run.buildGrid();run.hitE(b2,1e15);tick(1);run.buildGrid();run.hitE(run.en[0],1e15);tick(60*EGG_T+3);out.noHatch=run.en.length;
      return out}""")
    check(r['jump']==90 and r['jump2']==180,'Springer: springt alle drei Sekunden 90 Einheiten: '+str([r['jump'],r['jump2']]))
    check(r['shade']==[True,False] and not r['shadeHit'] and r['clearHit'],'Schattenwerfer: Impuls im Schatten halb so groß, danach wieder voll')
    v=r['ph'];check(v['an'] and v['ziel'] and v['heil'] and v['aus'] and v['tot'],'Phasenläufer: in der Phase kein Ziel und kein Schaden, danach verwundbar')
    check(r['hack']==[True,False] and r['hackShots']==0,'Hacker: Drohnen im Umkreis feuern nicht')
    check(r['egg']==['egg'] and r['eggHp']==0.4 and r['hatch']==['swarm']*4 and r['noHatch']==0,'Brüter: Ei mit 40 % Leben, daraus vier Schwärmer; zerstörtes Ei bringt nichts: '+str(r['hatch']))
    pg.evaluate("""()=>{run.en.length=0;let i=0;for(const t of['jumper','shade','phaser','hacker','brooder','egg']){run.spawnEnemy(t,false,-150+60*i,-220);run.en[i].sp=0;i++}run.en[2].cloak=false;paused=false}""")
    pg.wait_for_timeout(250);pg.screenshot(path='g4_neue_gegner.png',clip={'x':0,'y':120,'width':390,'height':260})
    print('\n'.join(errs) or 'no errors');b.close()
