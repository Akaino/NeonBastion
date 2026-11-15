"""Neue Helden: Kopfjäger (dreifacher Schaden gegen Elite, Hüne, Boss; Fangschuss) und Ingenieurin (mehr Energie, Verstärker)."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME='file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
old={"v":2,"cur":{"s":0,"k":50,"p":10,"d":0},"nodes":{"root":1,"b1":900,"e2b":60,"h1":1},"heroes":{"klinge":{"u":1,"l":7,"a":1},"schuetzin":{"u":0,"l":1,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},"team":["klinge"],"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(old))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    h=pg.evaluate("()=>save.heroes")
    check(h['klinge']=={'u':1,'l':7,'a':1} and h['kopfjaeger']=={'u':0,'l':1,'a':0} and h['ingenieurin']=={'u':0,'l':1,'a':0} and pg.evaluate("()=>HERO_IDS.length")==6,'alter Spielstand: bisherige Helden bleiben, zwei neue kommen gesperrt dazu')
    pg.click('#bHeroes');pg.wait_for_timeout(200);txt=pg.inner_text('#heroes')
    check('Kopfjäger' in txt and 'Ingenieurin' in txt and 'Fangschuss' in txt and 'Verstärker' in txt,'beide stehen im Helden-Menü')
    pg.screenshot(path='he1_menue.png',full_page=True)
    pg.evaluate("()=>{for(const id of['kopfjaeger','ingenieurin'])save.heroes[id]={u:1,l:5,a:0};save.team=['kopfjaeger','ingenieurin'];save.startPick=95;persist();goHub()}")
    check(pg.evaluate("()=>stats(save).slots")>=1,'Plätze vorhanden')
    pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;run.energy=1e9;run.S.heroCrit=0;if(run.heroes.length<2)run.heroes.push(run.makeHero('ingenieurin',1,2));const out={team:run.heroes.map(h=>h.id)};
      const clear=()=>{run.en.length=0;run.ep.length=0;run.pr.length=0;run.pend.length=0;run.towers.length=0;run.drones.length=0;run.S.drones=0;run.S.turrets=0;run.base.turrets.length=0};
      const mk=(t,x,y,el)=>{run.spawnEnemy(t,!!el,x,y);const e=run.en[run.en.length-1];e.sp=0;e.sh=0;e.hp=e.max=1e15;return e};
      const K=run.heroes.find(h=>h.id==='kopfjaeger'),I=run.heroes.find(h=>h.id==='ingenieurin');if(!K||!I)return out;
      const tick=n=>{for(let i=0;i<n;i++){run.buildGrid();run.updTowers(1/60);run.updHeroes(1/60);run.updProj(1/60)}};
      // Kopfjäger wählt das große Ziel, auch wenn ein kleiner Gegner näher ist
      clear();I.dead=1e9;K.x=0;K.y=-60;K.abT=99;K.atkT=0;K.tg=null;const sm=mk('brute',110,-90),el=mk('brute',0,-260,true);tick(120);out.pick=[sm.hp===sm.max,el.hp<el.max];
      // dreifacher Schaden gegen Elite; Fangschuss zwölffach
      clear();K.x=0;K.y=-60;K.abT=99;K.atkT=0;K.tg=null;const n1=mk('brute',0,-200);tick(40);const dn=n1.max-n1.hp;
      clear();K.x=0;K.y=-60;K.abT=99;K.atkT=0;K.tg=null;const e1=mk('brute',0,-200,true);tick(40);const de=e1.max-e1.hp;out.mul=+(de/dn).toFixed(2);
      clear();K.x=0;K.y=-60;K.abT=0;K.atkT=9;K.tg=null;const n2=mk('brute',0,-200);tick(2);out.shot=+((n2.max-n2.hp)/dn/K.pow).toFixed(2);out.cd=K.abT>11;
      // Ingenieurin: 25 % mehr Energie, solange sie lebt
      clear();K.dead=1e9;I.dead=0;I.hp=I.max;I.x=0;I.y=60;I.abT=99;tick(2);const v1=mk('brute',300,300);run.energy=0;run.kill(v1);const eOn=run.energy;
      I.dead=1e9;run.t+=1;const v2=mk('brute',300,300);run.energy=0;run.kill(v2);out.energy=+(eOn/run.energy).toFixed(2);
      // Verstärker: Gegner im Turmradius nehmen 30 % mehr Schaden, andere nicht
      clear();I.dead=0;I.hp=I.max;I.x=0;I.y=60;I.abT=0;I.tg=null;run.energy=1e9;run.place('frost',0,-200);const a=mk('brute',0,-200),c=mk('brute',300,300);tick(2);out.amp=[+a.vuln.toFixed(2),c.vuln,run.ampT>5];
      for(let i=0;i<60*6+5;i++){run.buildGrid();run.updTowers(1/60)}out.ampEnd=a.vuln;
      return out}""")
    check(r['team']==['kopfjaeger','ingenieurin'],'beide stehen im Team: '+str(r['team']))
    check(r.get('pick')==[True,True],'Kopfjäger nimmt das Elite-Ziel statt des näheren Gegners')
    check(r.get('mul')==3.0 and abs(r.get('shot')-12)<.05 and r.get('cd'),'dreifacher Schaden gegen Elite, Fangschuss zwölffach: '+str([r.get('mul'),r.get('shot')]))
    check(r.get('energy')==1.25,'Ingenieurin: 25 % mehr Energie, solange sie lebt: '+str(r.get('energy')))
    check(r.get('amp')==[1.3,1,True] and r.get('ampEnd')==1,'Verstärker: +30 % Schaden im Turmradius für sechs Sekunden: '+str(r.get('amp')))
    pg.evaluate("()=>{run.en.length=0;for(const h of run.heroes){h.dead=0;h.hp=h.max}run.heroes[0].x=-50;run.heroes[0].y=-80;run.heroes[1].x=50;run.heroes[1].y=-80;paused=false}")
    pg.wait_for_timeout(200);pg.screenshot(path='he2_im_run.png',clip={'x':95,'y':280,'width':200,'height':160})
    print('\n'.join(errs) or 'no errors');b.close()
