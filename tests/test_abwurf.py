"""Abwürfe: nur der Impuls zerstört sie (5 Treffer hintereinander), daneben setzt zurück, Frist 3 s, fünf Boni."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
GAME='file://'+os.path.join(os.path.dirname(HERE),'dist','web','beta','index.html')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300)
    pg.evaluate("()=>{save.dev=true;save.devDrop=true;persist()}");pg.reload();pg.wait_for_timeout(300)
    pg.click('#bStart');pg.wait_for_timeout(1500)
    check(pg.evaluate("()=>run.en.filter(e=>e.drop).length+run.queue.filter(q=>q.drop).length+run.drops.length")==1 if pg.evaluate("()=>!!run.queue") else pg.evaluate("()=>run.en.some(e=>e.drop)||run.drops.length>0"),'Testhilfe: genau ein Gegner der Welle trägt einen Abwurf')
    # ab hier steht das Spiel, die Logik wird von Hand geschaltet
    pg.evaluate("()=>{paused=true;run.noImpulse=true;run.en.length=0;run.drops.length=0;run.cx=120;run.cy=0}")
    r=pg.evaluate("""()=>{const o={};run.spawnDrop(120,0,'dmg');const d=run.drops[0];
      for(let i=0;i<4;i++)run.tap(120,0);o.h4=d.hits;run.tap(-150,200);o.miss=d.hits;
      for(let i=0;i<40;i++)run.step(.05);o.life2=+d.life.toFixed(2);run.tap(120,0);o.reset=d.life;o.h1=d.hits;
      for(let i=0;i<4;i++)run.tap(120,0);o.left=run.drops.length;o.buff=run.buff.dmg;o.n=run.dropN;
      run.spawnEnemy('brute',false,200,0);const e=run.en[run.en.length-1];e.sh=0;e.max=e.hp=1000;run.hitE(e,100);o.dmg2=1000-e.hp;
      for(let i=0;i<102;i++)run.step(.05);e.hp=1000;const x=e.x;run.hitE(e,100);o.dmg1=1000-e.hp;o.buffEnd=run.buff.dmg<=0;
      run.spawnDrop(120,0,'gain');for(let i=0;i<62;i++)run.step(.05);o.gone=run.drops.length;
      run.en.length=0;run.spawnDrop(120,0,'bomb');run.spawnEnemy('brute',false,180,0);run.spawnEnemy('brute',false,-250,0);const n=run.en[0],f=run.en[1];run.step(.001);n.sh=f.sh=0;n.hp=n.max;f.hp=f.max;
      for(let i=0;i<5;i++)run.tap(120,0);o.bomb=+(1-n.hp/n.max).toFixed(2);o.far=f.hp===f.max;
      run.base.hp=run.base.max*.5;run.spawnDrop(120,0,'repair');for(let i=0;i<5;i++)run.tap(120,0);run.en.length=0;for(let i=0;i<100;i++)run.step(.05);o.rep=+(run.base.hp/run.base.max).toFixed(2);
      run.spawnDrop(120,0,'haste');for(let i=0;i<5;i++)run.tap(120,0);run.noImpulse=false;const a=run.imps;for(let i=0;i<80;i++)run.step(.05);o.imps=run.imps-a;run.noImpulse=true;
      run.spawnDrop(120,0,'gain');for(let i=0;i<5;i++)run.tap(120,0);run.spawnEnemy('swarm',false,300,0);const g0=run.gain.s;run.kill(run.en[run.en.length-1]);const g2=run.gain.s-g0;
      run.buff.gain=0;run.spawnEnemy('swarm',false,300,0);const g1=run.gain.s;run.kill(run.en[run.en.length-1]);o.gain=+(g2/(run.gain.s-g1)).toFixed(2);
      run.drops.length=0;run.spawnDrop(0,0,'bomb');o.off=Math.round(Math.hypot(run.drops[0].x,run.drops[0].y));return o}""")
    check(r['h4']==4 and r['miss']==0,'vier Treffer zählen, ein Impuls daneben setzt auf 0: '+str([r['h4'],r['miss']]))
    check(r['life2']==1.0 and r['reset']==3 and r['h1']==1,'Frist läuft ab und wird vom Treffer zurückgesetzt: '+str([r['life2'],r['reset']]))
    check(r['left']==0 and r['buff']==5 and r['n']==1,'fünf Treffer hintereinander lösen den Bonus aus')
    check(r['dmg2']==200 and r['dmg1']==100 and r['buffEnd'],'doppelter Schaden wirkt 5 s: '+str([r['dmg2'],r['dmg1']]))
    check(r['gone']==0,'ohne Treffer verschwindet der Abwurf nach 3 s')
    check(r['bomb']==0.4 and r['far'],'Bombe nimmt nahen Gegnern 40 % und lässt ferne in Ruhe: '+str(r['bomb']))
    check(r['rep']==0.8,'Reparatur gibt der Basis 30 % zurück: '+str(r['rep']))
    check(r['imps']==4,'schneller Impuls: 4 statt 2 Impulse in 4 s: '+str(r['imps']))
    check(r['gain']==2.0,'Splitterregen verdoppelt Splitter: '+str(r['gain']))
    check(r['off']==70,'Abwurf liegt nie auf der Basis: '+str(r['off']))
    pg.evaluate("()=>{run.drops.length=0;run.spawnDrop(110,-60,'bomb');run.spawnDrop(-90,80,'haste');run.spawnDrop(100,140,'repair');run.spawnDrop(-110,-120,'dmg');run.spawnDrop(0,-190,'gain');run.drops[1].hits=3;run.buff.dmg=4;run.buff.gain=2;paused=false;run.cx=-90;run.cy=80}")
    pg.wait_for_timeout(400);pg.screenshot(path='ab1_abwuerfe.png')
    print('\n'.join(errs) or 'no errors');b.close()
