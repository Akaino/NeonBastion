# Gitterfestung (seit 0.36.0): eigene Gegnertabelle, feste Wellen, Bosse allein mit Begleiteinheiten, Doppelboss alle 25 Wellen,
# Angreifer betäuben Türme für 5 s. Der Neon-Sektor bleibt davon unberührt.
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','beta','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
stand={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1},"best":30,"cycleBest":30,"runs":5,"volMus":0,"volSfx":0,"world":2}
# Ein Run der Gitterfestung ohne Oberfläche: mk() baut ihn, st(n) rechnet n Sekunden
PRE="""()=>{window.mk=(w)=>{const s=freshSave();for(const t in s.w2.towers){s.w2.towers[t].u=1;s.w2.towers[t].l=5};s.w2.nodes.l2b=4;const r=new Run2(s,{});r.headless=true;r.hw=330;r.hh=700;r.energy=1e7;r.base.hp=r.base.max=1e15;r.queue=[];r.phase='fight';r.spawnT=1e9;r.w=w||40;window.r=r;return r};
window.st=(sec)=>{for(let i=0;i<Math.round(sec/0.05);i++)r.step(0.05)};
window.far=(type,x,y)=>{r.spawnEnemy(type,false,x,y);const e=r.en[r.en.length-1];e.hp=e.max=1e12;return e};window.halt=()=>{const e=far('brute',300,650);e.sp=0;e.stop=0}}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-beta',"+json.dumps(json.dumps(stand))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400);pg.evaluate(PRE)
    ev=pg.evaluate
    # ----- eigene Gegnertabelle -----
    check(ev("()=>!ETYPES2.shade&&!ETYPES2.magnet&&!!ETYPES2.sabo&&!ETYPES.sabo&&ETYPES2!==ETYPES&&ETYPES2.swarm!==ETYPES.swarm"),'Gitterfestung hat eine eigene Gegnertabelle: ohne Schattenwerfer und Magnet, mit Saboteur')
    check(ev("()=>{const a=new Run(freshSave(),{}),b=mk();return a.ET===ETYPES&&b.ET===ETYPES2&&b.noImpulse&&!a.noImpulse}"),'Neon-Sektor nutzt seine Tabelle, Gitterfestung ihre')
    check(ev("()=>{const v=ETYPES.swarm.hp;ETYPES2.swarm.hp=99;const ok=ETYPES.swarm.hp===v;ETYPES2.swarm.hp=v;return ok}"),'Werte der Gitterfestung ändern den Neon-Sektor nicht')
    check(ev("()=>WAVE_MIX2.every(t=>ETYPES2[t]&&ETYPES2[t].from>0)&&WAVE_MIX2.length===26"),'26 besondere Gegnerarten in der Wellenmischung')
    # ----- feste Wellen -----
    check(ev("()=>[1,7,12,33,47,80,120].every(w=>JSON.stringify(wave2(w))===JSON.stringify(wave2(w)))"),'Wellen stehen fest: gleiche Nummer, gleiche Welle')
    check(ev("()=>{const a=mk(1),b=mk(1);a.w=46;b.w=46;a.prepareWave();b.prepareWave();return JSON.stringify(a.queue)===JSON.stringify(b.queue)&&JSON.stringify(a.dirs)===JSON.stringify(b.dirs)&&a.queue.length>60}"),'zwei Runs bekommen dieselbe Welle 47 aus derselben Richtung')
    w=ev("()=>wave2(47)");check(len(w['types'])>=10 and w['types']['swarm']>=8 and sum(w['types'].values())==len(w['list']),'Welle 47 mischt viele Arten, der Rest sind Schwärmer '+str(w['types']))
    check(ev("()=>wave2(1).list.every(x=>x.type==='swarm')&&wave2(5).types.brute>0&&!wave2(14).types.sprinter&&wave2(15).types.sprinter>0"),'Arten steigen bei ihrer Einstiegswelle ein')
    check(ev("()=>{const a=wave2(12),b=wave2(13);return a.dirs.length===2&&b.dirs.length===1}"),'jede dritte Welle ab 12 kommt aus zwei Richtungen')
    # ----- Bosse -----
    check(ev("()=>[10,20,30,40].every(w=>{const x=wave2(w);return x.boss&&!x.twin&&x.list.length===1&&x.list[0].type==='boss'})"),'Boss alle 10 Wellen, allein')
    check(ev("()=>[25,50,75,100].every(w=>{const x=wave2(w);return x.twin&&x.list.length===2&&x.dirs.length===2&&Math.abs(Math.abs(x.dirs[1]-x.dirs[0])-Math.PI)<1e-9})"),'Doppelboss auf 25, 50, 75, 100 von gegenüberliegenden Seiten')
    ev("()=>{mk(1);r.w=9;r.phase='build';r.prepareWave();r.place('laser',0,-100);r.place('rocket',100,0);r.startFight()}")
    ev("()=>st(2)");check(ev("()=>r.en.length===1&&r.en[0].boss&&r.queue.length===0"),'Welle 10: nur der Boss betritt das Feld')
    ev("()=>{r.en[0].hp=r.en[0].max=1e12;st(7)}")
    check(ev("()=>r.en.filter(e=>e.type==='swarm').length>=4&&!r.charge"),'Boss schickt Kanonenfutter vor')
    ev("()=>{window.seen=0;for(let i=0;i<200;i++){r.step(0.05);if(r.en.some(e=>e.type==='sabo'))seen++}}")
    check(ev("()=>seen>0"),'Boss schickt Saboteure vor')
    ev("()=>st(25)");check(ev("()=>!r.charge"),'kein Sturmangriff, solange der Boss lebt')
    hp=ev("()=>{mk(1);r.w=9;r.prepareWave();r.spawnEnemy('boss',false,0,-600);const a=r.en[0].max;mk(1);r.w=24;r.prepareWave();r.spawnEnemy('boss',false,0,-600);const b=r.en[0].max;return [a,b,r.hpScale(10),r.hpScale(25),1+10*.03,1+25*.03]}")
    check(abs(hp[1]/hp[3]/hp[5]-0.75*hp[0]/hp[2]/hp[4])<1e-6*hp[0],'Doppelboss: jeder Boss hat 75 % des Bosslebens')
    # ----- Betäubung -----
    ev("()=>{mk();r.place('laser',0,-400);window.T=r.towers[0];window.e=far('brute',0,-450);e.sp=0}")
    ev("()=>st(1)");h0=ev("()=>e.hp");ev("()=>st(1)");check(ev("()=>e.hp")<h0,'wacher Laser-Turm trifft')
    ev("()=>{r.stunTower(T,5);st(0.1)}");h1=ev("()=>e.hp");ev("()=>st(3)")
    check(ev("()=>e.hp")==h1 and ev("()=>T.jam===true&&T.stun>1.5&&T.stun<2.1"),'betäubter Turm feuert nicht, Betäubung läuft ab')
    ev("()=>st(2.5)");check(ev("()=>e.hp")<h1 and ev("()=>!T.jam&&!(T.stun>0)"),'nach 5 s feuert er wieder')
    ev("()=>{r.stunTower(T,5);r.stunTower(T,2)}");check(ev("()=>T.stun")==5,'kürzere Betäubung verkürzt eine laufende nicht')
    # Unterstützungsturm wirkt betäubt nicht
    ev("()=>{mk();r.place('frost',0,-100);window.T=r.towers[0];window.e=far('brute',0,-130);e.sp=0;st(0.2)}")
    a=ev("()=>e.spMul");ev("()=>{r.stunTower(T,5);st(0.2)}");check(a<1 and ev("()=>e.spMul")==1,'betäubter Frost-Turm verlangsamt nicht')
    # Saboteur
    ev("()=>{mk();r.place('laser',0,-100);r.place('rocket',120,0);window.T=r.towers[0];r.spawnEnemy('sabo',false,0,-260);window.s=r.en[0];s.hp=s.max=1e12;halt();st(2.5)}")
    check(ev("()=>T.stun>3&&!r.en.includes(s)&&!(r.towers[1].stun>0)"),'Saboteur läuft zum nächsten Turm, betäubt ihn für 5 s und vergeht')
    ev("()=>{mk();r.spawnEnemy('sabo',false,0,-200);window.s=r.en[0];s.hp=s.max=1e12;const h=r.base.hp;st(4);window.dh=h-r.base.hp}")
    check(ev("()=>dh>0"),'ohne Türme greift der Saboteur den Kern an')
    # Mörser, Scharfschütze, Hacker, Spiegel
    ev("()=>{mk();r.place('laser',0,-100);window.T=r.towers[0];window.e=far('mortar',0,-300);st(6)}")
    check(ev("()=>T.stun>0||T.stun0===5"),'Mörser: Granate auf den Turm betäubt ihn')
    ev("()=>{mk();r.place('laser',0,-100);r.place('frost',100,0);r.towers[1].l=9;window.e=far('sniper',0,-262);e.stop=270;st(3.6)}")
    check(ev("()=>r.towers[1].stun>3&&!(r.towers[0].stun>0)"),'Scharfschütze betäubt den Turm mit der höchsten Stufe')
    ev("()=>{mk();r.place('frost',0,-100);window.T=r.towers[0];window.e=far('hacker',0,-250);e.sp=0;e.hk=0.2;st(0.5)}")
    check(ev("()=>T.stun>4"),'Hacker betäubt den nächsten Turm in Reichweite')
    ev("()=>{e.x=0;e.y=-600;T.stun=0;e.hk=0.1;st(1)}");check(ev("()=>!(T.stun>0)"),'Hacker außer Reichweite betäubt nicht')
    ev("()=>{mk();r.place('frost',0,-100);window.T=r.towers[0];window.e=far('mirror',0,-250);e.sp=0;r.t=10;r.hitE(e,5,{})}")
    check(ev("()=>T.stun")==2,'Spiegel: Treffer betäubt den nächsten Turm kurz')
    ev("()=>{T.stun=0;r.hitE(e,5,{})}");check(ev("()=>!(T.stun>0)"),'Spiegel: nicht öfter als alle 4 s')
    # Giftwolke
    ev("()=>{mk();r.place('laser',0,-100);window.T=r.towers[0];r.zones.push({kind:'gas',x:0,y:-100,r:70,t:3,t0:3,col:'#8cff4f'});halt();st(1)}")
    check(ev("()=>T.jam===true"),'Turm in einer Giftwolke fällt aus');ev("()=>st(3)");check(ev("()=>!T.jam"),'… und arbeitet weiter, wenn sie verzogen ist')
    # Titan und Vortex
    ev("()=>{mk();r.place('laser',0,-100);r.place('rocket',0,300);window.e=far('boss',0,-200);e.name='Titan';r.bossAbility(e,10,[])}")
    check(ev("()=>r.towers[0].stun===5&&!(r.towers[1].stun>0)"),'Titan „Erdstoß“ betäubt Türme im Umkreis für 5 s')
    ev("()=>{mk();r.place('laser',0,-100);window.e=far('boss',0,-300);e.name='Vortex';r.bossAbility(e,10,[])}")
    check(ev("()=>r.towers[0].stun")==2.5,'Vortex „Sog“ betäubt Türme im größeren Umkreis kürzer')
    # Umbauphase räumt auf
    ev("()=>{mk();r.place('laser',0,-100);r.stunTower(r.towers[0],5);r.zones.push({kind:'gas',x:0,y:0,r:70,t:3,t0:3});r.en.length=0;r.updWaves(0.05)}")
    check(ev("()=>r.phase==='build'&&!(r.towers[0].stun>0)&&r.zones.length===0"),'neue Umbauphase: Betäubungen und Wolken sind weg')
    # ----- im Spiel: Vorschau und Anzeige -----
    pg.click('#bStart');pg.wait_for_timeout(700)
    t=pg.inner_text('#phaseBar');check('Welle 1 aus' in t and '9× Schwärmer' in t,'Vorschau nennt die feste Welle: '+t.replace('\n',' ')[:70])
    ev("()=>{run.w=9;run.prepareWave();$('#phaseBar').dataset.key='';updPhase()}")
    check('Boss, schickt Einheiten vor' in pg.inner_text('#phaseBar'),'Vorschau der Bosswelle')
    ev("()=>{run.w=24;run.prepareWave();$('#phaseBar').dataset.key='';updPhase()}")
    check('Doppelboss' in pg.inner_text('#phaseBar'),'Vorschau des Doppelbosses')
    ev("()=>{run.w=46;run.prepareWave();$('#phaseBar').dataset.key='';updPhase()}")
    t=pg.inner_text('#phaseBar');check('weitere Arten' in t and '×' in t,'Vorschau fasst viele Arten zusammen: '+t.replace('\n',' ')[:110])
    ev("()=>{run.energy=1e6;run.place('laser',0,-100);run.place('frost',90,0);run.stunTower(run.towers[0],5);run.spawnEnemy('sabo',false,-80,-160);run.en[0].sp=0}")
    pg.wait_for_timeout(500);pg.screenshot(path='w2gegner1.png')
    check(ev("()=>run.towers[0].stun>0"),'betäubter Turm im laufenden Spiel')
    # ----- Neon-Sektor unverändert -----
    check(ev("()=>{const s=freshSave();s.towers.frost.u=1;const a=new Run(s,{});a.headless=true;a.hw=330;a.hh=700;a.energy=1e6;a.place('frost',0,-110);a.nextWave();a.spawnEnemy('boss',false,0,-300);const e=a.en[a.en.length-1];e.hp=e.max=1e12;e.sumT=0.01;const n=a.en.length;a.updEnemies(0.05);return a.en.length===n+3&&a.en.slice(-3).every(x=>x.type==='swarm')&&e.sumT===4&&!a.stunTower&&a.en.every(x=>x.own===false)}"),'Neon-Sektor: Boss ruft weiter alle 4 s drei Schwärmer, keine Betäubung, kein Saboteur')
    check(ev("()=>WAVE_MIX.includes('shade')&&WAVE_MIX.includes('magnet')&&WAVE_MIX.length===28"),'Neon-Sektor: Wellenmischung unverändert (28 Arten)')
    print('\n'.join(errs) or 'no errors');b.close()
