"""Zweiter Schub Gegner: Heiler, Bomber, Tarner, Störsender, Hüne."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"b1":900,"e2b":60,"b3a":2},"heroes":{"klinge":{"u":1,"l":40,"a":0}},"team":["klinge"],"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    sh=pg.evaluate("()=>Object.fromEntries([19,20,34,35,49,50,69,70,84,85].map(w=>[w,WAVE_MIX.filter(t=>waveShare(t,w)>0)]))")
    check('healer' not in sh['19'] and 'healer' in sh['20'] and 'bomber' not in sh['34'] and 'bomber' in sh['35'] and 'cloaker' not in sh['49'] and 'cloaker' in sh['50'] and 'jammer' not in sh['69'] and 'jammer' in sh['70'] and 'giant' not in sh['84'] and 'giant' in sh['85'],'Einstieg: Heiler 20, Bomber 35, Tarner 50, Störsender 70, Hüne 85')
    check(pg.evaluate("()=>['healer','bomber','cloaker','jammer','giant'].every(t=>ETYPES[t].name&&ETYPES[t].text&&CODEX_TYPES.includes(t))"),'alle fünf haben Namen, Beschreibung und einen Platz in der Enzyklopädie')
    pg.evaluate("()=>{save.startPick=90;persist()}");pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;const out={};
      const clear=()=>{run.en.length=0;run.ep.length=0;run.towers.length=0;for(const h of run.heroes){h.dead=1e9}run.drones.length=0;run.S.drones=0;run.S.turrets=0;run.base.turrets.length=0};
      const mk=(t,x,y)=>{run.spawnEnemy(t,false,x,y);const e=run.en[run.en.length-1];return e};const tick=n=>{for(let i=0;i<n;i++){run.buildGrid();run.updTowers(1/60);run.updEnemies(1/60);run.en=run.en.filter(e=>e.hp>0)}};
      // Heiler: heilt Nachbarn, nicht sich selbst, nicht außerhalb des Radius
      clear();let h=mk('healer',0,-300),a=mk('brute',40,-300),far=mk('brute',300,-300);h.sp=a.sp=far.sp=0;h.hp=h.max*.5;a.hp=a.max*.5;far.hp=far.max*.5;h.healT=0;tick(2);
      out.heil=[(a.hp/a.max-.5),(h.hp/h.max-.5),(far.hp/far.max-.5)];
      // Bomber: läuft am Helden vorbei, sprengt sich an der Basis, zählt nicht als besiegt
      clear();const hero=run.heroes[0];hero.dead=0;hero.hp=hero.max=1e12;hero.x=0;hero.y=-60;let bo=mk('bomber',0,-75);const hp0=run.base.hp,k0=run.kills;tick(120);
      out.bomber={weg:!run.en.includes(bo),schaden:hp0-run.base.hp,soll:bo.dmg,held:hero.hp===hero.max,kills:run.kills-k0};
      clear();bo=mk('bomber',0,-200);bo.sp=0;run.buildGrid();run.hitE(bo,bo.hp*2);out.bomberKill=run.killsBy.bomber||0;
      // Tarner: getarnt weder Ziel noch verwundbar; taucht nahe der Basis auf
      clear();let c=mk('cloaker',0,-300);const hpC=c.hp;run.buildGrid();run.hitE(c,1e12);out.tarn={getarnt:c.cloak,hp:c.hp===hpC,ziel:[run.nearest(0,0,9999)===null,run.threat(9999)===null]};
      c.x=0;c.y=-(CLOAK_R-5);tick(1);out.tarn.auf=!c.cloak;out.tarn.zielDanach=run.threat(9999)===c;run.buildGrid();run.hitE(c,1e12);out.tarn.tot=c.hp<=0;
      // Störsender: Türme im Umkreis fallen aus, außerhalb nicht
      clear();run.energy=1e6;run.place('frost',0,-150);run.place('frost',0,150);const T1=run.towers[0],T2=run.towers[1];let j=mk('jammer',30,-150),v1=mk('swarm',0,-140),v2=mk('swarm',0,140);j.sp=v1.sp=v2.sp=0;tick(2);
      out.jam={aus:T1.jam,an:!T2.jam,langsam:[v1.spMul,v2.spMul]};run.hitE(j,j.hp*2);tick(2);out.jam.wiederAn=!T1.jam&&v1.spMul<1;
      // Hüne: viel Leben, kein Rückstoß
      clear();const g=mk('giant',0,-200),br=mk('brute',60,-200);out.giant={hp:g.max/br.max,heavy:g.heavy};const gx=g.x,bx=br.x;run.knock(g,0,-260,40);run.knock(br,0,-260,40);out.giant.fest=g.x===gx&&g.y===-200;out.giant.brute=Math.hypot(br.x-bx,br.y+200)>30;
      return out}""")
    check(abs(r['heil'][0]-.04)<1e-6 and abs(r['heil'][1])<1e-9 and abs(r['heil'][2])<1e-9,'Heiler: Nachbar +4 % Leben, er selbst und entfernte Gegner nichts')
    b_=r['bomber'];check(b_['weg'] and abs(b_['schaden']-b_['soll'])<1e-6*b_['soll'] and b_['held'] and b_['kills']==0,'Bomber: läuft am Helden vorbei, sprengt sich an der Basis, zählt dabei nicht als besiegt')
    check(r['bomberKill']==1,'Bomber: vorher abgefangen zählt er als besiegt')
    t=r['tarn'];check(t['getarnt'] and t['hp'] and t['ziel']==[True,True] and t['auf'] and t['zielDanach'] and t['tot'],'Tarner: getarnt weder Ziel noch verwundbar, taucht nahe der Basis auf und ist dann angreifbar')
    j=r['jam'];check(j['aus'] and j['an'] and j['langsam'][0]==1 and j['langsam'][1]<1 and j['wiederAn'],'Störsender: Turm im Umkreis fällt aus, der entfernte wirkt weiter; nach seinem Tod wirkt der Turm wieder')
    g=r['giant'];check(g['hp']>7 and g['heavy'] and g['fest'] and g['brute'],f"Hüne: {g['hp']:.1f}-faches Leben eines Brechers, lässt sich nicht zurückstoßen")
    # Zeichnen: alle fünf, Tarner getarnt und sichtbar, Störsender mit Kreis und gedimmtem Turm
    pg.evaluate("""()=>{run.en.length=0;run.towers.length=0;run.energy=1e6;run.place('frost',60,-150);['healer','bomber','cloaker','jammer','giant'].forEach((t,i)=>{run.spawnEnemy(t,false,-140+i*70,-230);run.en[i].sp=0});run.spawnEnemy('cloaker',false,0,-300);run.en[5].sp=0;run.en[2].cloak=false;paused=false}""")
    pg.wait_for_timeout(500);pg.screenshot(path='g2_gegner.png')
    check(pg.evaluate("()=>run.towers[0].jam===true&&run.en[5].cloak===true"),'im laufenden Spiel: Turm neben dem Störsender ist aus, ferner Tarner bleibt getarnt')
    print('\n'.join(errs) or 'no errors');b.close()
