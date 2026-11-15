"""Basis: sichtbare Anbauten je nach Basis-Upgrades und Zerfall, wenn die Basis fällt (nicht beim Abbruch)."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
GAME='file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
FULL="{b1:50,b2a:5,b2b:8,b3a:4,b3b:3,b4a:5,b4c:1,b4b:1,b5:1,b5b:1,b6:3,b7a:1,b7b:1,b8:1,b9:1,f2c:3,f3c:1,f7:1}"
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300)
    l0=pg.evaluate("()=>R.baseLook(save.nodes)")
    check(not any(l0.values()),'ohne Upgrades keine Anbauten')
    l=pg.evaluate("()=>[R.baseLook({b1:9}).plates,R.baseLook({b1:10}).plates,R.baseLook({b1:25}).plates,R.baseLook({b1:50}).plates,R.baseLook({f2c:1}).guns,R.baseLook({f2c:1,f7:1}).guns,R.baseLook({b4a:1}).cal,R.baseLook({b4a:5}).cal]")
    check(l==[0,1,2,3,3,6,1,2],'Stufen der Anbauten: '+str(l))
    pg.screenshot(path='bo1_hub_ohne.png',clip={'x':95,'y':250,'width':200,'height':200})
    pg.evaluate("()=>{Object.assign(save.nodes,%s);persist()}"%FULL);pg.reload();pg.wait_for_timeout(500)
    lf=pg.evaluate("()=>R.baseLook(save.nodes)")
    check(all(lf.values()),'voll ausgebaut: alle Anbauten an')
    n0=pg.evaluate("()=>R.sp.size");pg.wait_for_timeout(600)
    check(pg.evaluate("()=>[...R.sp.keys()].filter(k=>k.startsWith('kit')).length")==1 and pg.evaluate("()=>R.sp.size")==n0,'Anbauten sind ein gecachtes Sprite, es entstehen keine neuen je Bild')
    pg.screenshot(path='bo2_hub_voll.png')
    pg.click('#bStart');pg.wait_for_timeout(1200)
    pg.evaluate("()=>{run.en.length=0;run.queue&&(run.queue.length=0)}");pg.wait_for_timeout(200);pg.screenshot(path='bo3_run_voll.png')
    # Basis fällt: erst Flackern, dann Explosion und Trümmer, Endbildschirm erst danach
    pg.evaluate("()=>{run.base.sh=0;run.base.hp=0;run.end()}")
    check(pg.evaluate("()=>run.over&&!run.boomed"),'Basis gefallen, Explosion steht noch aus')
    pg.wait_for_timeout(150);pg.screenshot(path='bo4_flackern.png')
    pg.wait_for_timeout(450);check(pg.evaluate("()=>run.boomed&&run.rings.length>=2"),'Explosion nach 0,35 s');pg.screenshot(path='bo5_explosion.png')
    check(pg.evaluate("()=>$('#end').hidden"),'Endbildschirm wartet auf den Zerfall')
    pg.wait_for_timeout(500);pg.screenshot(path='bo6_truemmer.png')
    pg.wait_for_timeout(1700);check(not pg.evaluate("()=>$('#end').hidden"),'Endbildschirm erscheint')
    # Abbruch: kein Zerfall
    pg.reload();pg.wait_for_timeout(400);pg.click('#bStart');pg.wait_for_timeout(600);pg.click('#bPause');pg.click('#bQuit');pg.wait_for_timeout(100)
    check(pg.evaluate("()=>run.over&&run.quit&&run.boomed"),'Abbruch: Basis zerfällt nicht')
    print('\n'.join(errs) or 'no errors');b.close()
