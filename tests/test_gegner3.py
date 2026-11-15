"""Dritter Schub Gegner: Schwarmkönigin, Rammbock, Panzer, Wiedergänger, Kommandant."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
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
    sh=pg.evaluate("()=>Object.fromEntries([24,25,39,40,54,55,64,65,79,80].map(w=>[w,WAVE_MIX.filter(t=>waveShare(t,w)>0)]))")
    check('queen' not in sh['24'] and 'queen' in sh['25'] and 'ram' not in sh['39'] and 'ram' in sh['40'] and 'tank' not in sh['54'] and 'tank' in sh['55'] and 'revenant' not in sh['64'] and 'revenant' in sh['65'] and 'commander' not in sh['79'] and 'commander' in sh['80'],'Einstieg: Schwarmkönigin 25, Rammbock 40, Panzer 55, Wiedergänger 65, Kommandant 80')
    check(pg.evaluate("()=>['queen','ram','tank','revenant','commander'].every(t=>ETYPES[t].name&&ETYPES[t].text&&CODEX_TYPES.includes(t))") and pg.evaluate("()=>CODEX_TYPES.length")==30,'alle fünf stehen in der Enzyklopädie, zusammen 18 Gegnerarten')
    check(all(pg.evaluate("w=>waveMix(w).reduce((s,x)=>s+x[1],0)",w)<=.8501 for w in (60,100,300)),'auch mit 16 besonderen Typen bleiben mindestens 15 % Schwärmer')
    pg.evaluate("()=>{save.startPick=90;persist()}");pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;const out={};
      const clear=()=>{run.en.length=0;run.ep.length=0;run.pend.length=0;run.towers.length=0;run.drones.length=0;run.S.drones=0;run.S.turrets=0;run.base.turrets.length=0;for(const h of run.heroes)h.dead=1e9};
      const mk=(t,x,y)=>{run.spawnEnemy(t,false,x,y);return run.en[run.en.length-1]};
      const tick=n=>{for(let i=0;i<n;i++){run.buildGrid();run.updEnemies(1/60);if(run.pend.length){for(const [t,x,y,hp] of run.pend){run.spawnEnemy(t,false,x,y);const m=run.en[run.en.length-1];if(hp){m.hp=m.max=hp}}run.pend.length=0}run.en=run.en.filter(e=>e.hp>0)}};
      // Schwarmkönigin: alle drei Sekunden zwei Schwärmer
      clear();const q=mk('queen',0,-300);q.sp=0;tick(60*6+5);out.brut=run.en.filter(e=>e.type==='swarm').length;
      // Rammbock: wird schneller
      clear();const ra=mk('ram',0,-500);const x0=ra.y;tick(60);const v1=ra.y-x0;const x1=ra.y;tick(60*4);const y4=ra.y;tick(60);out.ram=[(ra.y-y4)/v1,ra.acc];
      // Panzer: kein Treffer nimmt mehr als 12 %
      clear();const t=mk('tank',0,-300);run.buildGrid();run.hitE(t,1e15);out.tank=1-t.hp/t.max;for(let i=0;i<7;i++)run.hitE(t,1e15);out.tank8=t.hp>0;run.hitE(t,1e15);out.tank9=t.hp<=0;
      // Wiedergänger: steht einmal wieder auf, am Boden unverwundbar und kein Ziel
      clear();const v=mk('revenant',0,-300);v.sp=0;const k0=run.kills;run.buildGrid();run.hitE(v,1e15);out.rev={lebt:v.hp>0,halb:v.hp/v.max,kills:run.kills-k0,ziel:run.threat(9999)===null};run.hitE(v,1e15);out.rev.unverwundbar=v.hp>0;
      tick(Math.ceil(60*REV_DOWN)+2);out.rev.auf=!v.cloak&&v.down===0&&run.threat(9999)===v;run.buildGrid();run.hitE(v,1e15);out.rev.tot=v.hp<=0;out.rev.killsDanach=run.kills-k0;
      // Kommandant: Gegner in seinem Umkreis schneller und stärker, er selbst und entfernte nicht
      clear();const c=mk('commander',0,-300),n1=mk('brute',40,-300),n2=mk('brute',400,-300);c.sp=0;n1.sp=n2.sp=30;const a1=Math.hypot(n1.x,n1.y),a2=Math.hypot(n2.x,n2.y);tick(60);
      out.cmd=[(a1-Math.hypot(n1.x,n1.y))/30,(a2-Math.hypot(n2.x,n2.y))/30];
      return out}""")
    check(r['brut']==4,'Schwarmkönigin: vier Schwärmer in sechs Sekunden')
    check(r['ram'][0]>1.8 and r['ram'][1]>2,f"Rammbock: nach fünf Sekunden {r['ram'][0]:.1f}-mal so schnell wie am Anfang")
    check(abs(r['tank']-.12)<1e-9 and r['tank8'] and r['tank9'],'Panzer: ein beliebig starker Treffer nimmt 12 %, erst der neunte bringt ihn zu Fall')
    v=r['rev'];check(v['lebt'] and abs(v['halb']-.5)<1e-9 and v['kills']==0 and v['ziel'] and v['unverwundbar'] and v['auf'] and v['tot'] and v['killsDanach']==1,'Wiedergänger: steht einmal mit halbem Leben auf, liegt solange unangreifbar am Boden, zählt erst beim zweiten Tod')
    check(abs(r['cmd'][0]-1.25)<.1 and abs(r['cmd'][1]-1)<.1,f"Kommandant: Gegner im Umkreis {r['cmd'][0]:.2f}-mal so schnell, entfernte unverändert")
    d=pg.evaluate("""()=>{run.en.length=0;run.spawnEnemy('commander',false,0,-300);run.spawnEnemy('brute',false,30,-60);run.spawnEnemy('brute',false,300,-60);const c=run.en[0];c.x=20;c.y=-90;c.sp=0;for(const e of run.en)e.atkT=0;run.base.hp=run.base.max=1e15;
      const hit=i=>{const e=run.en[i];e.x=0;e.y=-(run.base.r+e.r);e.atkT=0;const h=run.base.hp;run.buildGrid();run.updEnemies(1/60);return h-run.base.hp};const nah=hit(1);run.en[1].x=999;run.en[0].x=9999;const fern=hit(2);return nah/fern}""")
    check(abs(d-1.4)<.05,f'Kommandant: Gegner im Umkreis schlagen {d:.2f}-mal so hart zu')
    pg.evaluate("""()=>{run.en.length=0;['queen','ram','tank','revenant','commander'].forEach((t,i)=>{run.spawnEnemy(t,false,-140+i*70,-230);run.en[i].sp=0;run.en[i].qT=1e9});paused=false}""")
    pg.wait_for_timeout(400);pg.screenshot(path='g3_gegner.png')
    print('\n'.join(errs) or 'no errors');b.close()
