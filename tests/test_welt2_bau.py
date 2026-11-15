# Gitterfestung (seit 0.35.0): Im Baumodus zeigt das Feld, wo kein Turm stehen darf; es gibt keinen Impuls.
# Der Neon-Sektor bleibt davon unberührt (Vorgabe: Keine Änderung einer Welt darf eine andere Welt verändern).
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','beta','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
def stand(world):
    return {"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1},"heroes":{"klinge":{"u":1,"l":3,"a":0},"schuetzin":{"u":0,"l":1,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},"team":["klinge"],
            "towers":{"frost":{"u":1,"l":2},"weak":{"u":1,"l":1},"cryo":{"u":0,"l":1}},"best":30,"cycleBest":30,"runs":5,"volMus":0,"volSfx":0,"world":world}
# Farbe des Feldes an einer Weltstelle: Summe der Farbkanäle
PIX="""([x,y])=>{const c=$('#cv'),r=c.getBoundingClientRect(),k=c.width/r.width,d=c.getContext('2d').getImageData(Math.round((R.w/2+x*R.se)*k),Math.round((R.h/2+y*R.se)*k),1,1).data;return [d[0],d[1],d[2]]}"""
def seite(b,world):
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-beta',"+json.dumps(json.dumps(stand(world)))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400);return pg
def klick(pg,x,y):
    p=pg.evaluate("([x,y])=>{const r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+x*R.se,r.top+R.h/2+y*R.se]}",[x,y]);pg.mouse.click(p[0],p[1])
with sync_playwright() as p:
    b=p.chromium.launch();errs=[]
    # ----- Gitterfestung -----
    pg=seite(b,2);pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    check(pg.evaluate("()=>W.id")==2,'Spielstand startet in der Gitterfestung')
    pg.click('#bStart');pg.wait_for_timeout(700)
    check(pg.evaluate("()=>run.world===2&&run.noImpulse===true"),'Gitterfestung: Run ohne Impuls')
    check(pg.evaluate("()=>R.buildMode")==False,'außerhalb des Baumodus keine Sperrzonen')
    rand0=pg.evaluate(PIX,[52,0])
    pg.evaluate("()=>{run.energy=5000}");pg.click('#bBuild');pg.wait_for_timeout(200)
    typ=pg.evaluate("()=>$('[data-bt]').dataset.bt");pg.click('[data-bt="'+typ+'"]');pg.wait_for_timeout(250)
    check(pg.evaluate("()=>R.buildMode")==True,'Baumodus: Grafik zeigt die Sperrzonen')
    rand1=pg.evaluate(PIX,[52,0])
    check(sum(rand1)>sum(rand0)+25,'Baumodus: Sperrbereich um die Basis ist eingefärbt '+str(rand0)+' → '+str(rand1))
    pg.screenshot(path='w2bau1.png')
    check(pg.evaluate("()=>[run.placeBlock(0,40),run.placeBlock(0,57),run.placeBlock(0,59),run.placeBlock(9999,0)]")==['base','base','','edge'],'Gründe: zu nah an der Basis, frei, außerhalb des Felds')
    # Antippen im Sperrbereich: kein Turm, verständliche Meldung, Baumodus bleibt
    klick(pg,30,30);pg.wait_for_timeout(250)
    check(pg.evaluate("()=>run.towers.length")==0 and 'Zu nah an der Basis' in pg.inner_text('#toast') and pg.evaluate("()=>R.buildMode"),'Antippen neben der Basis: kein Turm, Meldung „Zu nah an der Basis“')
    klick(pg,0,-110);pg.wait_for_timeout(250)
    check(pg.evaluate("()=>run.towers.length")==1 and pg.evaluate("()=>R.buildMode")==False,'Außerhalb des Sperrbereichs wird gebaut, die Anzeige verschwindet')
    check(pg.evaluate("()=>run.placeBlock(run.towers[0].x+10,run.towers[0].y)")=='tower','Grund: zu nah an einem anderen Turm')
    pg.click('#bBuild');pg.wait_for_timeout(200);pg.click('[data-bt="'+typ+'"]');pg.wait_for_timeout(150)
    klick(pg,10,-110);pg.wait_for_timeout(250)
    check('Zu nah an einem anderen Turm' in pg.inner_text('#toast') and pg.evaluate("()=>run.towers.length")==1,'Antippen neben einem Turm: Meldung „Zu nah an einem anderen Turm“')
    pg.screenshot(path='w2bau2.png')
    pg.evaluate("()=>endBuild()")
    # kein Impuls: Zeiger bewegen, Welle laufen lassen – kein Impuls wird gezählt, kein Ring gezeichnet
    pg.evaluate("()=>{run.base.hp=run.base.max=1e12;if(run.phase==='build')run.buildT=0}")
    for i in range(6):pg.mouse.move(120+i*20,300+i*10);pg.wait_for_timeout(400)
    check(pg.evaluate("()=>run.imps")==0 and pg.evaluate("()=>run.w>=1"),'Gitterfestung: in laufender Welle wird kein Impuls ausgelöst')
    pg.close()
    # ----- Neon-Sektor: unverändert -----
    pg=seite(b,1);pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.click('#bStart');pg.wait_for_timeout(700)
    check(pg.evaluate("()=>run.world===1&&!run.noImpulse"),'Neon-Sektor: Impuls bleibt')
    pg.evaluate("()=>{run.energy=5000;run.base.hp=run.base.max=1e12}");pg.click('#bBuild');pg.wait_for_timeout(200);pg.click('[data-bt="frost"]');pg.wait_for_timeout(250)
    check(pg.evaluate("()=>R.buildMode")==False,'Neon-Sektor: keine Sperrzonen-Anzeige (Welt 1 bleibt, wie sie ist)')
    klick(pg,30,30);pg.wait_for_timeout(250)
    check('Hier kann kein Turm stehen' in pg.inner_text('#toast') and pg.evaluate("()=>run.towers.length")==0,'Neon-Sektor: Meldung wie bisher')
    pg.evaluate("()=>endBuild()");pg.wait_for_timeout(2600)
    check(pg.evaluate("()=>run.imps")>=1,'Neon-Sektor: Impulse lösen weiter aus')
    print('\n'.join(errs) or 'no errors');b.close()
