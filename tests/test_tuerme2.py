"""Hilfstürme: Stör-Turm nimmt Gegnern die Fähigkeiten, Markier-Turm verstärkt den Impuls."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=web(os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
old={"v":2,"cur":{"s":0,"k":30,"p":5,"d":0},"nodes":{"root":1,"b1":900,"e2b":60},"towers":{"frost":{"u":1,"l":3},"weak":{"u":1,"l":2},"cryo":{"u":0,"l":1}},"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(old))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    t=pg.evaluate("()=>save.towers")
    check(t['frost']=={'u':1,'l':3} and t['mute']=={'u':0,'l':1} and t['mark']=={'u':0,'l':1},'alter Spielstand: bisherige Türme bleiben, neue kommen gesperrt dazu')
    check(pg.evaluate("()=>TOWER_IDS.join()")=='frost,weak,cryo,mute,mark' and pg.evaluate("()=>TOWER_IDS2.join()")=='laser,rocket,tesla,frost,weak,cryo','Welt 1 hat fünf Türme, Welt 2 unverändert')
    pg.click('#bTowers');pg.wait_for_timeout(200)
    txt=pg.inner_text('#towers')
    check('Stör-Turm' in txt and 'Markier-Turm' in txt,'beide stehen im Turm-Menü')
    pg.screenshot(path='tu1_menue.png',full_page=True)
    pg.evaluate("()=>{save.towers.mute.u=1;save.towers.mark.u=1;save.towers.mark.l=5;save.startPick=95;persist();goHub()}");pg.wait_for_timeout(100)
    pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;run.energy=1e9;const out={};
      const clear=()=>{run.en.length=0;run.ep.length=0;run.pend.length=0;run.towers.length=0;run.drones.length=0;run.S.drones=0;run.S.turrets=0;run.base.turrets.length=0;for(const h of run.heroes)h.dead=1e9};
      const mk=(t,x,y)=>{run.spawnEnemy(t,false,x,y);const e=run.en[run.en.length-1];e.sp=0;return e};
      const tick=n=>{for(let i=0;i<n;i++){run.buildGrid();run.updTowers(1/60);run.updDrones(1/60);run.updEnemies(1/60);if(run.pend.length){for(const [t,x,y,hp] of run.pend){run.spawnEnemy(t,false,x,y)}run.pend.length=0}run.en=run.en.filter(e=>e.hp>0)}};
      // Stör-Turm: Königin, Heiler, Springer, Phasenläufer, Tarner, Schattenwerfer, Kommandant
      clear();out.placed=run.place('mute',0,-200);const T=run.towers[0];out.r=T.r;
      const q=mk('queen',0,-200),q2=mk('queen',0,300);tick(60*QUEEN_CD+10);out.queen=run.en.filter(e=>e.type==='swarm').length;
      clear();run.place('mute',0,-200);const j=mk('jumper',20,-200);j.jT=.01;const ph=mk('phaser',-20,-200);ph.phT=.01;const cl=mk('cloaker',0,-230);const sh=mk('shade',0,-170);tick(5);
      out.mute={jump:Math.round(j.y),phase:ph.cloak,cloak:cl.cloak,shade:run.shaded(0,-170),flag:j.mute};
      const far=mk('shade',0,300);tick(2);out.shadeFar=run.shaded(0,300);
      clear();run.place('mute',0,-200);const bo=mk('boss',0,-200);tick(2);out.boss=bo.mute;
      // Störsender schaltet den Stör-Turm nicht ab; im Stör-Radius verliert er selbst die Wirkung
      clear();run.place('mute',0,-200);run.place('frost',60,-200);const jm=mk('jammer',30,-200);tick(2);out.jamIn=[run.towers[0].jam,run.towers[1].jam];
      clear();run.place('mute',0,-200);run.place('frost',170,-200);const jm2=mk('jammer',230,-200);tick(2);out.jamOut=[run.towers[0].jam,run.towers[1].jam];
      // Markier-Turm: Impuls trifft markierte Gegner stärker, anderer Schaden bleibt gleich
      clear();run.place('mark',0,-200);const M=run.towers[0];out.mark=M.fx.mark;const a=mk('brute',0,-200),c=mk('brute',0,300);a.hp=a.max=c.hp=c.max=1e12;tick(2);out.flag=[a.mark,c.mark];
      run.S.tapCrit=0;run.buildGrid();run.tap(0,-200);run.tap(0,300);out.ratio=+((a.max-a.hp)/(c.max-c.hp)).toFixed(2);
      a.hp=a.max;run.hitE(a,1000);out.other=a.max-a.hp;
      const bs=mk('boss',0,-200);tick(2);out.bossMark=bs.mark;
      return out}""")
    check(r['placed'] and r['r']==87,'Stör-Turm lässt sich bauen, Radius 87')
    check(r['queen']==2,'Schwarmkönigin im Stör-Radius brütet nicht, die ferne schon: '+str(r['queen']))
    m=r['mute'];check(m['flag'] and m['jump']==-200 and not m['phase'] and not m['cloak'] and not m['shade'],'Springer springt nicht, Phasenläufer und Tarner sind sichtbar, Schattenwerfer wirft keinen Schatten: '+str(m))
    check(r['shadeFar'] and not r['boss'],'außerhalb wirkt er nicht, Bosse sind nicht betroffen')
    check(r['jamIn']==[False,False] and r['jamOut']==[False,True],'Störsender: im Stör-Radius wirkungslos, außerhalb schaltet er andere Türme ab, den Stör-Turm nie: '+str([r['jamIn'],r['jamOut']]))
    check(r['mark']==1.75 and r['flag']==[1.75,1] and r['ratio']==1.75 and r['other']==1000 and r['bossMark']==1.75,'Markier-Turm Stufe 5: Impuls ×1,75 auf Markierte und Bosse, anderer Schaden unverändert: '+str([r['ratio'],r['other']]))
    pg.evaluate("()=>{run.en.length=0;run.towers.length=0;run.place('mute',-90,-150);run.place('mark',90,-150);for(let i=0;i<5;i++){run.spawnEnemy('brute',false,60+i*15,-190+i*20);run.en[i].sp=0}paused=false}")
    pg.wait_for_timeout(300);pg.screenshot(path='tu2_im_run.png',timeout=8000)
    print('\n'.join(errs) or 'no errors');b.close()
