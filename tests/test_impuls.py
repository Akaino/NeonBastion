"""Impuls: löst am Zeiger in festen Abständen aus. Klicken macht keinen Schaden, die Maus bewegt den Zeiger,
der Finger zieht ihn mit und lässt ihn liegen. Taktgeber verkürzt das Intervall, Taktschlag verstärkt jeden 5. Impuls."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"f1":1},"best":5,"cycleBest":5,"runs":5,"volMus":0,"volSfx":0}
TOUCH="""([type,x,y])=>{const c=document.querySelector('#cv');c.dispatchEvent(new PointerEvent(type,{pointerType:'touch',pointerId:7,clientX:x,clientY:y,bubbles:true,cancelable:true}))}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    # Werte: Start 2 s, Taktgeber verkürzt, Schaden je Impuls sinkt, Schaden pro Sekunde steigt, Untergrenze 0,1 s
    v=pg.evaluate("()=>[0,1,36].map(l=>{const S=stats({...save,nodes:{...save.nodes,f1b:l}});return [S.impInt,S.tapDmg*S.impMul,S.tapDmg*S.impMul/S.impInt]})")
    check(abs(v[0][0]-2)<1e-9 and abs(v[1][0]-1.84)<1e-9 and abs(v[2][0]-.1)<1e-9,'Intervall 2,00 s → 1,84 s → 0,10 s: '+str([round(x[0],2) for x in v]))
    check(v[0][1]>v[1][1]>v[2][1] and v[0][2]<v[1][2]<v[2][2],'Schaden je Impuls sinkt, Schaden pro Sekunde steigt')
    check(pg.evaluate("()=>NODES.f1b.max")==36 and pg.evaluate("()=>NODES.f3a.name")=='Taktschlag','Knoten Taktgeber (36 Stufen) und Taktschlag vorhanden')
    pg.click('#bStart');pg.wait_for_timeout(400)
    # Maus bewegt den Zeiger, Klick löst keinen Impuls aus
    pg.mouse.move(250,330);pg.wait_for_timeout(100)
    pos=pg.evaluate("()=>{const r=document.querySelector('#cv').getBoundingClientRect();return [Math.round(r.left+R.w/2+run.cx*R.se),Math.round(r.top+R.h/2+run.cy*R.se)]}")
    check(abs(pos[0]-250)<=1 and abs(pos[1]-330)<=1,'Maus bewegt den Zeiger: '+str(pos))
    n0=pg.evaluate("()=>run.imps")
    for i in range(6):pg.mouse.click(250,330)
    check(pg.evaluate("()=>run.imps")-n0<=1,'sechs Klicks lösen keine zusätzlichen Impulse aus')
    # Feste Taktung: in 6,2 s bei 1× kommen 3 Impulse dazu (Toleranz für langsame Rechner)
    pg.evaluate("()=>{speed=1}");n1=pg.evaluate("()=>run.imps");t1=pg.evaluate("()=>run.t");pg.wait_for_timeout(6200)
    dn=pg.evaluate("()=>run.imps")-n1;dt=pg.evaluate("()=>run.t")-t1
    check(abs(dn-dt/2)<=1 and dn>=2,f'Impulse im 2-s-Takt: {dn} Impulse in {dt:.1f} s Spielzeit')
    pg.screenshot(path='i3_impuls.png')
    # Finger: zieht den Zeiger mit, beim Loslassen bleibt er liegen
    pg.evaluate(TOUCH,['pointerdown',120,500]);pg.evaluate(TOUCH,['pointerup',120,500]);pg.wait_for_timeout(50)
    w=lambda:pg.evaluate("()=>{const r=document.querySelector('#cv').getBoundingClientRect();return [Math.round(r.left+R.w/2+run.cx*R.se),Math.round(r.top+R.h/2+run.cy*R.se)]}")
    a=w();check(abs(a[0]-120)<=1 and abs(a[1]-500)<=1,'kurzes Antippen setzt den Zeiger direkt: '+str(a))
    # Trackpad: Wischen weit weg vom Zeiger schiebt ihn um die Strecke × 1,5; der Zeiger springt nicht unter den Finger
    pg.evaluate(TOUCH,['pointerdown',300,700]);pg.evaluate(TOUCH,['pointermove',320,700]);pg.evaluate(TOUCH,['pointermove',360,660]);pg.wait_for_timeout(50)
    a=w();check(abs(a[0]-180)<=1 and abs(a[1]-440)<=1,'Wischen schiebt den Zeiger um die Strecke × 1,5: '+str(a))
    pg.evaluate(TOUCH,['pointerup',360,660]);pg.evaluate(TOUCH,['pointermove',300,300]);pg.wait_for_timeout(50)
    a=w();check(abs(a[0]-180)<=1 and abs(a[1]-440)<=1,'nach dem Loslassen bleibt der Zeiger liegen: '+str(a))
    pg.evaluate(TOUCH,['pointerdown',40,760]);[pg.evaluate(TOUCH,['pointermove',40-i*40,760]) for i in range(1,12)];pg.evaluate(TOUCH,['pointerup',-400,760]);pg.wait_for_timeout(50)
    e=pg.evaluate("()=>[run.cx>=-run.hw-1e-6,run.cy]");check(e[0],'Zeiger bleibt im Spielfeld')
    pg.evaluate(TOUCH,['pointerdown',180,440]);pg.evaluate(TOUCH,['pointerup',180,440]);pg.wait_for_timeout(50)
    # Impuls trifft Gegner im Kreis; Taktschlag verstärkt jeden 5. Impuls; Zähler läuft auch ohne Treffer weiter
    r=pg.evaluate("""()=>{paused=true;const mk=()=>{run.en.length=0;run.spawnEnemy('brute',false,run.cx,run.cy);const e=run.en[0];e.hp=e.max=1e9;run.buildGrid();return e};
      run.S.beat=3;run.S.tapCrit=0;run.S.overload=0;run.S.megaTap=0;run.imps=0;const d=[];
      for(let i=0;i<5;i++){const e=mk();run.tap(run.cx,run.cy);d.push(Math.round(1e9-e.hp))}
      run.en.length=0;run.tap(run.cx,run.cy);const leer=run.imps;run.en.length=0;paused=false;return {d,leer,soll:run.S.tapDmg*run.S.impMul}}""")
    check(all(abs(x-r['soll'])<1 for x in r['d'][:4]) and abs(r['d'][4]-4*r['soll'])<1,'Impuls trifft im Kreis, 5. Impuls mit Taktschlag ×4: '+str(r['d']))
    check(r['leer']==6,'Zähler läuft auch ohne Treffer weiter')
    # Zeiger bleibt über den Run hinaus erhalten
    pg.click('#bPause');pg.click('#bQuit');pg.wait_for_timeout(2200);pg.click('#bBack');pg.click('#bStart');pg.wait_for_timeout(300)
    a=w();check(abs(a[0]-180)<=1 and abs(a[1]-440)<=1,'Zeiger steht im nächsten Run wieder an derselben Stelle: '+str(a))
    # Turm-Menü: nur kurzes Antippen ohne Bewegung öffnet es; aufsetzen und ziehen bewegt den Zeiger
    tp=pg.evaluate("()=>{run.energy=999;run.place('frost',-90,150);const T=run.towers[0],r=document.querySelector('#cv').getBoundingClientRect();return [Math.round(r.left+R.w/2+T.x*R.se),Math.round(r.top+R.h/2+T.y*R.se)]}")
    a0=w();pg.evaluate(TOUCH,['pointerdown',tp[0],tp[1]]);pg.evaluate(TOUCH,['pointermove',tp[0]+60,tp[1]-40]);pg.evaluate(TOUCH,['pointermove',tp[0]+80,tp[1]-40]);pg.evaluate(TOUCH,['pointerup',tp[0]+80,tp[1]-40]);pg.wait_for_timeout(80)
    a=w();check(pg.evaluate("()=>document.querySelector('#tpanel').hidden&&towerSel===null") and abs(a[0]-a0[0]-30)<=1 and abs(a[1]-a0[1])<=1,'auf Turm aufsetzen und wischen: kein Menü, Zeiger wird geschoben: '+str(a0)+' → '+str(a))
    pg.evaluate(TOUCH,['pointerdown',tp[0],tp[1]]);pg.wait_for_timeout(600);pg.evaluate(TOUCH,['pointerup',tp[0],tp[1]]);pg.wait_for_timeout(80)
    check(pg.evaluate("()=>document.querySelector('#tpanel').hidden"),'langes Halten auf dem Turm: kein Menü')
    pg.evaluate(TOUCH,['pointerdown',tp[0],tp[1]]);pg.evaluate(TOUCH,['pointerup',tp[0],tp[1]]);pg.wait_for_timeout(80)
    b2=w();check(not pg.evaluate("()=>document.querySelector('#tpanel').hidden") and b2==a,'kurzes Antippen öffnet das Turm-Menü, Zeiger bleibt liegen')
    print('\n'.join(errs) or 'no errors');b.close()
