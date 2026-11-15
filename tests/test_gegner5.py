"""Fünfter Schub Gegner: Dieb, Mörser, Giftträger, Scharfschütze, Spiegel, Gespann."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=web(os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"ver":"0.28.0","cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"b1":900,"e2b":60},"heroes":{"klinge":{"u":1,"l":5,"a":0},"schuetzin":{"u":1,"l":9,"a":0}},"team":["klinge"],"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
NEW=[('thief',33),('mortar',48),('gas',63),('sniper',73),('mirror',78),('pair',95)]
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    check(all(pg.evaluate("([t,w])=>waveShare(t,w-1)===0&&waveShare(t,w)>0",[t,w]) for t,w in NEW),'Einstieg: Dieb 33, Mörser 48, Giftträger 63, Scharfschütze 73, Spiegel 78, Gespann 95')
    check(pg.evaluate("n=>n.every(([t])=>ETYPES[t].name&&ETYPES[t].text&&CODEX_TYPES.includes(t))",NEW) and pg.evaluate("()=>CODEX_TYPES.length")==30 and pg.evaluate("()=>WAVE_MIX.length")==27,'30 Einträge in der Enzyklopädie, 28 Gegnerarten mit Schwärmer')
    check(pg.evaluate("()=>new Set(WAVE_MIX.map(t=>ETYPES[t].from)).size")==27 and all(pg.evaluate("w=>waveMix(w).reduce((s,x)=>s+x[1],0)",w)<=.8501 for w in (60,100,300)),'jede Einstiegswelle einmal, mindestens 15 % Schwärmer')
    pg.evaluate("()=>{save.startPick=99;persist()}");pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.queue.length=0;const out={};
      const H=run.heroes[0];
      const clear=()=>{run.en.length=0;run.ep.length=0;run.pend.length=0;run.zones.length=0;run.towers.length=0;run.drones.length=0;run.S.drones=0;run.S.turrets=0;run.base.turrets.length=0;H.dead=0;H.max=H.hp=1000;H.x=0;H.y=60};
      const mk=(t,x,y)=>{run.spawnEnemy(t,false,x,y);return run.en[run.en.length-1]};
      const tick=n=>{for(let i=0;i<n;i++){run.buildGrid();run.updEnemies(1/60);run.updZones(1/60);run.en=run.en.filter(e=>e.hp>0)}};
      // Dieb: läuft am Helden vorbei, stiehlt 20 % Energie, zählt nicht als besiegt
      clear();H.x=0;H.y=-60;const th=mk('thief',0,-120);run.energy=500;const k0=run.kills;tick(120);out.thief=[Math.round(run.energy),run.en.length,run.kills-k0,H.hp===H.max];
      // Mörser: Granate auf den Helden, Einschlag nach 1,3 s, Basis unberührt
      clear();H.x=0;H.y=-100;const mo=mk('mortar',0,-210);mo.sp=0;mo.atkT=0;mo.stop=300;const bh=run.base.hp;tick(2);out.mortar={zone:run.zones.length,kind:run.zones[0]&&run.zones[0].kind,vor:H.hp===H.max};tick(Math.ceil(60*MORTAR_DELAY)+2);out.mortar.nach=H.hp<H.max;out.mortar.weg=run.zones.length===0;out.mortar.basis=run.base.hp===bh;
      // Giftträger: Wolke nach dem Tod, 6 % je Sekunde, sechs Sekunden
      clear();H.x=0;H.y=-200;const g=mk('gas',0,-200);run.buildGrid();run.hitE(g,1e15);out.gas={zone:run.zones.length};run.en.length=0;tick(60);out.gas.s1=+((1000-H.hp)/1000).toFixed(2);tick(60*6);out.gas.end=run.zones.length;out.gas.sum=+((1000-H.hp)/1000).toFixed(2);
      // Scharfschütze: zielt drei Sekunden auf den Helden, trifft dann einmal
      clear();H.x=0;H.y=-60;const sn=mk('sniper',0,-250);sn.sp=0;sn.stop=300;tick(60);out.snipe={ziel:sn.tgA===H,vor:H.hp===H.max};tick(60*2+5);out.snipe.nach=H.hp<H.max;out.snipe.neu=sn.aimT<.2;
      // Spiegel: Treffer wirft 4 % zurück, höchstens alle 0,3 s
      clear();H.x=0;H.y=-200;const mi=mk('mirror',50,-200);mi.sp=0;mi.hp=mi.max=1e15;run.t+=1;run.hitE(mi,10);run.hitE(mi,10);out.mirror=[+((1000-H.hp)/1000).toFixed(2)];run.t+=.4;run.hitE(mi,10);out.mirror.push(+((1000-H.hp)/1000).toFixed(2));
      // Gespann: heilt sich, solange beide leben; fällt einer, rast der andere
      clear();H.dead=1e9;const a=mk('pair',0,-300),c=mk('pair',40,-300);a.mate=c;c.mate=a;a.sp=c.sp=0;a.hp=a.max*.5;tick(60);out.pair={heal:+(a.hp/a.max).toFixed(2)};run.buildGrid();run.hitE(c,1e15);tick(2);out.pair.rage=[a.rage,a.acc];const h1=a.hp;tick(60);out.pair.stop=a.hp===h1;
      return out}""")
    check(r['thief']==[400,0,0,True],'Dieb: stiehlt 20 % Energie, läuft am Helden vorbei, zählt nicht als besiegt: '+str(r['thief']))
    m=r['mortar'];check(m['zone']==1 and m['kind']=='shell' and m['vor'] and m['nach'] and m['weg'] and m['basis'],'Mörser: Granate schlägt verzögert beim Helden ein, die Basis bleibt heil')
    g=r['gas'];check(g['zone']==1 and g['s1']==0.06 and g['end']==0 and 0.35<=g['sum']<=0.37,'Giftträger: Wolke nimmt Verbündeten 6 % je Sekunde, sechs Sekunden lang: '+str(g))
    s=r['snipe'];check(s['ziel'] and s['vor'] and s['nach'] and s['neu'],'Scharfschütze: zielt drei Sekunden auf den Helden und trifft dann')
    check(r['mirror']==[0.04,0.08],'Spiegel: wirft 4 % zurück, höchstens alle 0,3 Sekunden: '+str(r['mirror']))
    q=r['pair'];check(q['heal']==0.58 and q['rage']==[True,1.6] and q['stop'],'Gespann: heilt 8 % je Sekunde, nach dem Tod des Partners rast der andere und heilt nicht mehr: '+str(q))
    pg.evaluate("""()=>{run.en.length=0;run.zones.length=0;let i=0;for(const t of['thief','mortar','gas','sniper','mirror','pair']){run.spawnEnemy(t,false,-150+60*i,-220);run.en[i].sp=0;run.en[i].atkT=99;i++}
      run.spawnEnemy('pair',false,150,-170);run.en[6].sp=0;run.en[5].mate=run.en[6];run.en[6].mate=run.en[5];run.zones.push({kind:'gas',x:-110,y:-120,r:GAS_R,t:5},{kind:'shell',x:60,y:-120,r:MORTAR_R,t:.9,t0:1.3,dmg:0,col:'#ff7a5a'});run.heroes[0].dead=0;run.heroes[0].x=-20;run.heroes[0].y=-110;paused=false}""")
    pg.wait_for_timeout(350);pg.screenshot(path='g5_neue_gegner.png',clip={'x':0,'y':120,'width':390,'height':260})
    print('\n'.join(errs) or 'no errors');b.close()
