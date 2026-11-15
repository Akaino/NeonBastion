"""Flotte: fünf Drohnenklassen, Freischalten, Stufen, prozentuale Verteilung und ihr Verhalten im Run."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
# alter Spielstand ohne Flotte, aber mit „Mutterschiff“
save={"v":2,"cur":{"s":100000,"k":500,"p":50,"d":0},"nodes":{"root":1,"u1":10,"u2a":5,"u3a":5,"u4":1,"u5":1,"b1":900,"e2b":60},"best":150,"cycleBest":40,"runs":5,"volMus":0,"volSfx":0,"nova":1,"q":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    check(pg.evaluate("()=>DRONE_IDS.join()")=='jaeger,abfang,schwarm,repair,kreuzer','fünf Klassen: Jäger, Abfänger, Schwarm, Reparaturdrohne, Kreuzer')
    f=pg.evaluate("()=>save.fleet");check(f['jaeger']['p']==80 and f['kreuzer']['p']==20 and pg.evaluate("()=>droneUnlocked(save,'kreuzer')&&!droneUnlocked(save,'abfang')"),'alter Spielstand mit „Mutterschiff“: Kreuzer freigeschaltet, 80 % Jäger und 20 % Kreuzer')
    check(pg.evaluate("()=>!droneUnlocked({...freshSave()},'kreuzer')&&freshSave().fleet.jaeger.p===100"),'frischer Spielstand: nur Jäger, Kreuzer erst über den Skilltree')
    check(pg.is_visible('#bFleet') and pg.evaluate("()=>document.querySelector('.hubfoot').getBoundingClientRect().bottom<=innerHeight"),'Hub zeigt den Knopf „Flotte“, alles passt auf den Bildschirm')
    pg.click('#bFleet');pg.wait_for_timeout(200)
    c=pg.evaluate("()=>({karten:document.querySelectorAll('#flist .hcard').length,zu:document.querySelectorAll('#flist .hcard.lock').length,balken:document.querySelectorAll('#fbar .fdist i').length,text:document.querySelector('#flist').innerText})")
    check(c['karten']==5 and c['zu']==3 and c['balken']==2 and all(n in c['text'] for n in ['Jäger','Abfänger','Schwarm','Reparaturdrohne','Kreuzer']),'Flotten-Menü: fünf Karten, drei gesperrt, Verteilungsbalken mit zwei Anteilen')
    pg.screenshot(path='f1_flotte.png')
    # Freischalten kostet; die neue Klasse startet mit 0 %, nichts wird automatisch umverteilt
    k0=pg.evaluate("()=>save.cur.k");pg.click('[data-fu="abfang"]');pg.wait_for_timeout(150)
    f=pg.evaluate("()=>save.fleet");check(f['abfang']['u']==1 and pg.evaluate("()=>save.cur.k")==k0-8 and [f[i]['p'] for i in ('jaeger','abfang','kreuzer')]==[80,0,20],'Abfänger freigeschaltet für 8 Kerne, startet mit 0 %, die anderen bleiben: '+str([f[i]['p'] for i in ('jaeger','abfang','kreuzer')]))
    # Plus geht nur mit freien Prozenten; nichts wird automatisch angepasst
    pg.click('[data-fp="abfang:5"]');pg.wait_for_timeout(100)
    f=pg.evaluate("()=>save.fleet");check([f[i]['p'] for i in ('jaeger','abfang','kreuzer')]==[80,0,20] and 'Schon 100 % verteilt' in pg.inner_text('#toast'),'bei 100 % verteilt lässt sich nichts erhöhen, Hinweis erscheint')
    [pg.click('[data-fp="jaeger:-5"]') for i in range(4)];pg.click('[data-fp="abfang:5"]');pg.click('[data-fp="abfang:5"]');pg.wait_for_timeout(100)
    f=pg.evaluate("()=>save.fleet");ps=[f[i]['p'] for i in ('jaeger','abfang','kreuzer')]
    check(ps==[60,10,20] and '90 %' in pg.inner_text('#fbar') and '10 % frei' in pg.inner_text('#fbar') and 'Anteil an der Flotte' in pg.inner_text('#flist'),'Verringern macht Prozente frei, die Anzeige nennt verteilt und frei: '+str(ps))
    for cls in ('jaeger','abfang','kreuzer'):
        for i in range(20):pg.click('[data-fp="%s:-5"]'%cls)
    f=pg.evaluate("()=>save.fleet");check(all(f[i]['p']==0 for i in ('jaeger','abfang','kreuzer')) and 'nur Jäger' in pg.inner_text('#fbar'),'alle Klassen lassen sich auf 0 % stellen, dann baut die Basis nur Jäger')
    for cls,n in (('jaeger',4),('abfang',4),('kreuzer',4)):
        for i in range(n):pg.click('[data-fp="%s:5"]'%cls)
    f=pg.evaluate("()=>save.fleet");check([f[i]['p'] for i in ('jaeger','abfang','kreuzer')]==[20,20,20],'in 5er-Schritten gleichmäßig einstellbar: je 20 %')
    pg.evaluate("()=>{save.fleet.jaeger.p=40;save.fleet.abfang.p=40;save.fleet.kreuzer.p=20;persist();renderFleet()}")
    # Aufwerten: Vorher-Nachher, kostet Splitter, Stufe steigt
    s0=pg.evaluate("()=>save.cur.s");t=pg.inner_text('#flist .hcard:first-child');pg.click('[data-fl="jaeger"]');pg.wait_for_timeout(100)
    check('Aufwerten' in t and '→' in t and pg.evaluate("()=>save.fleet.jaeger.l")==2 and pg.evaluate("()=>save.cur.s")<s0,'Aufwerten zeigt Vorher-Nachher, kostet Splitter und erhöht die Stufe')
    pg.screenshot(path='f2_flotte_verteilung.png');pg.click('#fleet [data-back]')
    # Im Run: gebaut wird im eingestellten Verhältnis, Klassen verhalten sich wie beschrieben
    pg.evaluate("()=>{const F=save.fleet;for(const id of DRONE_IDS){F[id].u=1;F[id].l=1}F.jaeger.p=40;F.abfang.p=20;F.schwarm.p=20;F.repair.p=10;F.kreuzer.p=10;save.startPick=1;persist()}")
    pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;run.en.length=0;const out={};
      for(let i=0;i<30;i++)run.spawnDrone();const n={};for(const d of run.drones)n[d.cls]=(n[d.cls]||0)+1;out.mix=n;
      const by=c=>run.drones.find(d=>d.cls===c),j=by('jaeger');out.kreuzer=[by('kreuzer').dmg/j.dmg,by('kreuzer').max/j.max,by('kreuzer').big];out.schwarm=by('schwarm').shots;out.rep=by('repair').dmg;
      // Stufen wirken auf Schaden und Leben
      save.fleet.jaeger.l=11;run.drones.length=0;run.dcount={};run.droneIdx=0;run.spawnDrone();out.stufe=run.drones[0].dmg/j.dmg;save.fleet.jaeger.l=1;
      // Abfänger wählt den Bomber, obwohl ein Schwärmer näher ist; der Jäger nimmt den näheren
      const pick=cls=>{run.drones.length=0;run.en.length=0;run.pr.length=0;run.dcount={};run.droneIdx=0;const F=save.fleet,alt={};for(const id of DRONE_IDS){alt[id]=F[id].p;F[id].p=id===cls?100:0}run.spawnDrone();for(const id of DRONE_IDS)F[id].p=alt[id];
        const d=run.drones[0];d.x=0;d.y=-60;run.spawnEnemy('swarm',false,0,-90);run.spawnEnemy('bomber',false,0,-180);for(const e of run.en){e.sp=0;e.hp=e.max=1e15}run.S.droneBeam=true;d.atkT=0;run.updDrones(1/60);
        return {bomber:run.en[1].hp<run.en[1].max,schwarm:run.en[0].hp<run.en[0].max}};
      out.abf=pick('abfang');out.jae=pick('jaeger');
      // Schwarm trifft dreimal pro Salve: nimmt einem Schildträger drei Ladungen
      run.drones.length=0;run.en.length=0;run.dcount={};run.droneIdx=0;{const F=save.fleet,alt={};for(const id of DRONE_IDS){alt[id]=F[id].p;F[id].p=id==='schwarm'?100:0}run.spawnDrone();for(const id of DRONE_IDS)F[id].p=alt[id]}
      {const d=run.drones[0];d.x=0;d.y=-60;run.spawnEnemy('shield',false,0,-90);const e=run.en[0];e.sp=0;const s0=e.sh;d.atkT=0;run.updDrones(1/60);out.schild=s0-e.sh}
      // Reparaturdrohne heilt die Basis, greift nicht an
      run.drones.length=0;run.en.length=0;run.dcount={};run.droneIdx=0;{const F=save.fleet,alt={};for(const id of DRONE_IDS){alt[id]=F[id].p;F[id].p=id==='repair'?100:0}run.spawnDrone();for(const id of DRONE_IDS)F[id].p=alt[id]}
      {const d=run.drones[0];run.base.max=1000;run.base.hp=500;run.spawnEnemy('swarm',false,20,-40);const e=run.en[0];e.sp=0;e.hp=e.max=1e15;e.atkT=1e9;d.healT=0;run.updDrones(1/60);out.heil=run.base.hp-500;out.repKampf=e.hp<e.max;run.base.max=run.base.hp=1e15}
      // Kreuzer: Flächenschaden
      run.drones.length=0;run.en.length=0;run.dcount={};run.droneIdx=0;{const F=save.fleet,alt={};for(const id of DRONE_IDS){alt[id]=F[id].p;F[id].p=id==='kreuzer'?100:0}run.spawnDrone();for(const id of DRONE_IDS)F[id].p=alt[id]}
      {const d=run.drones[0];d.x=0;d.y=-60;run.spawnEnemy('brute',false,0,-100);run.spawnEnemy('brute',false,20,-110);for(const e of run.en){e.sp=0;e.hp=e.max=1e15}run.buildGrid();d.atkT=0;run.updDrones(1/60);out.flaeche=run.en.filter(e=>e.hp<e.max).length}
      return out}""")
    check(r['mix']=={'jaeger':12,'abfang':6,'schwarm':6,'repair':3,'kreuzer':3},'30 Drohnen im Verhältnis 40/20/20/10/10: '+json.dumps(r['mix']))
    check(r['kreuzer']==[4,4,True] and r['schwarm']==3 and r['rep']==0,'Kreuzer vierfach stark und zäh, Schwarm drei Schüsse pro Salve, Reparaturdrohne ohne Schaden')
    check(abs(r['stufe']-pg.evaluate('()=>droneLm(11)'))<1e-9 and abs(pg.evaluate('()=>droneLm(11)')-(1+10*pg.evaluate('()=>DRONE_LV')))<1e-9,'Stufe 11 gibt zehnmal den Stufenbonus gegenüber Stufe 1')
    check(r['abf']=={'bomber':True,'schwarm':False} and r['jae']=={'bomber':False,'schwarm':True},'Abfänger nimmt den Bomber, der Jäger den näheren Schwärmer')
    check(r['schild']==3,'Schwarm nimmt einem Schildträger drei Ladungen pro Salve')
    check(abs(r['heil']-1.5)<1e-6 and not r['repKampf'],'Reparaturdrohne repariert 0,15 % des Basislebens pro Sekunde und greift nicht an')
    check(r['flaeche']==2,'Kreuzer trifft mehrere Gegner im Umkreis')
    pg.evaluate("()=>{run.drones.length=0;run.dcount={};run.droneIdx=0;for(let i=0;i<10;i++){run.spawnDrone();const d=run.drones[i];d.x=-150+i*33;d.y=-160}paused=false}");pg.wait_for_timeout(250);pg.screenshot(path='f3_drohnen.png')
    # Supernova setzt Stufen zurück, Freischaltung und Verteilung bleiben
    pg.evaluate("()=>{run.quit=true;run.end()}");pg.wait_for_timeout(2200);pg.click('#bBack')
    pg.evaluate("()=>{save.fleet.jaeger.l=9;save.cycleBest=40;supernova()}")
    f=pg.evaluate("()=>save.fleet");check(f['jaeger']['l']==1 and f['abfang']['u']==1 and f['jaeger']['p']==40,'Supernova setzt Stufen zurück, Freischaltung und Verteilung bleiben')
    print('\n'.join(errs) or 'no errors');b.close()
