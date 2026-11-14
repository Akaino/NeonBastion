"""Neue Gegner: Sprinter, Schildträger, Spalter, Belagerer. Einstiegswellen, Eigenheiten, Ankündigung und Zählung für die Enzyklopädie."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"b1":600,"e2b":60},"best":150,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    # Einstiegswellen und Anteile
    sh=pg.evaluate("()=>Object.fromEntries([14,15,29,30,44,45,59,60,90].map(w=>[w,WAVE_MIX.filter(t=>waveShare(t,w)>0)]))")
    check('sprinter' not in sh['14'] and 'sprinter' in sh['15'] and 'shield' not in sh['29'] and 'shield' in sh['30'] and 'splitter' not in sh['44'] and 'splitter' in sh['45'] and 'siege' not in sh['59'] and 'siege' in sh['60'],'Einstieg: Sprinter 15, Schildträger 30, Spalter 45, Belagerer 60')
    check(pg.evaluate("()=>WAVE_MIX.reduce((s,t)=>s+waveShare(t,200),0)")<1,'es bleiben immer Schwärmer übrig')
    old=pg.evaluate("()=>[3,4,9,40].map(w=>[waveShare('brute',w),waveShare('shooter',w)])")
    check(all(abs(a-min(.25,.04*(w-2)))<1e-9 and abs(s-(min(.2,.04*(w-4)) if w>=5 else 0))<1e-9 for (a,s),w in zip(old,[3,4,9,40])),'Brecher und Fernkämpfer kommen so häufig wie zuvor')
    pg.evaluate("()=>{save.startPick=70;persist()}");pg.click('#bStart');pg.wait_for_timeout(300)
    r=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.base.max=run.base.hp=1e15;run.en.length=0;run.queue.length=0;const mk=(t,x,y)=>{run.spawnEnemy(t,false,x,y);return run.en[run.en.length-1]};const out={};
      // Sprinter: deutlich schneller als ein Schwärmer
      out.tempo=mk('sprinter',200,0).sp/mk('swarm',200,40).sp;
      // Schildträger: Schild schluckt ganze Treffer, danach normaler Schaden
      const s=mk('shield',0,-200);out.ladungen=s.sh;for(let i=0;i<s.sh0;i++)run.hitE(s,1e12);out.nachSchild=[s.sh,s.hp===s.max];run.hitE(s,s.max*.5);out.schaden=s.hp<s.max&&s.hp>0;
      // Spalter: zerfällt in drei Splitterlinge
      const sp=mk('splitter',-150,150);run.buildGrid();const k0=run.kills;run.hitE(sp,sp.max*2);run.step(1/60);out.splitterlinge=run.en.filter(e=>e.type==='mite').length;out.miteHp=run.en.find(e=>e.type==='mite').max/sp.max;out.miteSoll=MITE_HP;out.schildSoll=SHIELD_HITS+Math.floor(run.w/SHIELD_PER);
      // Belagerer: bleibt weiter draußen stehen als ein Fernkämpfer und schießt schwerer
      const sg=mk('siege',0,300),ft=mk('shooter',0,-300);out.stop=[sg.stop,ft.stop,Math.min(run.hw,run.hh)];out.dmg=sg.dmg/ft.dmg;
      run.ep.length=0;for(let i=0;i<60*14;i++)run.step(1/60);out.steht=[Math.hypot(sg.x,sg.y)>=sg.stop-1,Math.hypot(sg.x,sg.y)<sg.stop+2];out.gross=run.ep.some(q=>q.big)||run.base.hp<run.base.max;out.lebt=!run.over;
      out.kills=run.killsBy;out.namen=['sprinter','shield','splitter','mite','siege'].map(t=>ETYPES[t].name);return out}""")
    check(r['tempo']>1.7,f"Sprinter ist {r['tempo']:.1f}-mal so schnell wie ein Schwärmer")
    check(r['ladungen']==r['schildSoll']>=4 and r['nachSchild']==[0,True] and r['schaden'],f"Schildträger: {r['ladungen']} Treffer werden vollständig geschluckt, danach wirkt Schaden")
    check(r['splitterlinge']==3 and abs(r['miteHp']-r['miteSoll'])<.01,f"Spalter zerfällt in drei Splitterlinge mit je {r['miteSoll']*100:.0f} % seines Lebens")
    check(r['stop'][0]>r['stop'][1] and r['stop'][0]<r['stop'][2] and r['dmg']>2,f"Belagerer steht bei {r['stop'][0]:.0f} (Fernkämpfer {r['stop'][1]:.0f}, Feldrand {r['stop'][2]:.0f}) und schießt {r['dmg']:.1f}-mal so stark")
    check(all(r['steht']) and r['gross'] and r['lebt'],'Belagerer bleibt im sichtbaren Feld stehen und feuert')
    check(r['kills'].get('splitter')==1,'besiegte Gegner werden je Typ gezählt: '+json.dumps(r['kills']))
    # Zeichnen aller Typen ohne Fehler, auch mit Schildring und als Elite
    pg.evaluate("""()=>{run.en.length=0;run.base.hp=run.base.max;const T=['swarm','brute','shooter','sprinter','shield','splitter','mite','siege'];T.forEach((t,i)=>{run.spawnEnemy(t,false,-150+(i%4)*100,-230+Math.floor(i/4)*90);run.spawnEnemy(t,true,-150+(i%4)*100,150+Math.floor(i/4)*90)});for(const e of run.en){e.sp=0;e.atkT=99}paused=false}""")
    pg.wait_for_timeout(400);pg.screenshot(path='g1_gegner.png')
    # Ankündigung beim ersten Auftritt und Übernahme der Zählung in den Spielstand
    a=pg.evaluate("()=>{const subs={};const h=run.h.banner;run.h.banner=(t,s)=>{subs[t]=s};for(const w of [14,29,44,59]){run.w=w;run.nextWave()}run.h.banner=h;return subs}")
    check('Neu: Sprinter' in a['Welle 15'] and 'Neu: Schildträger' in a['Welle 30'] and 'Neu: Spalter' in a['Welle 45'] and 'Neu: Belagerer' in a['Welle 60'],'Ankündigung beim ersten Auftritt: '+a['Welle 30'])
    pg.evaluate("()=>{run.killsBy={sprinter:4,shield:2,elite:1};run.quit=true;run.end()}");pg.wait_for_timeout(2200)
    check(pg.evaluate("()=>JSON.stringify(save.kills)")==json.dumps({"sprinter":4,"shield":2,"elite":1},separators=(',',':')),'Zählung landet im Spielstand')
    pg.click('#bBack');pg.click('#bStart');pg.wait_for_timeout(300);pg.evaluate("()=>{run.killsBy={sprinter:1};run.quit=true;run.end()}");pg.wait_for_timeout(2200)
    check(pg.evaluate("()=>save.kills.sprinter")==5,'Zählung summiert sich über Runs')
    print('\n'.join(errs) or 'no errors');b.close()
