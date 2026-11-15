"""Enzyklopädie, Erfolge und schillernde Gegner."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300)
    # --- Hub: beide Knöpfe sichtbar, nichts ragt aus dem Bildschirm ---
    check(pg.is_visible('#bCodex') and pg.is_visible('#bAchv') and pg.evaluate("()=>document.querySelector('.hubfoot').getBoundingClientRect().bottom<=innerHeight"),'Hub zeigt „Enzyklopädie“ und „Erfolge“, alles passt auf den Bildschirm')
    pg.screenshot(path='e0_hub.png')
    # --- Enzyklopädie leer: alles verdeckt ---
    pg.click('#bCodex');pg.wait_for_timeout(200)
    c=pg.evaluate("()=>({karten:document.querySelectorAll('#clist .hcard').length,verdeckt:document.querySelectorAll('#clist .hcard.lock').length,abschnitte:[...document.querySelectorAll('#clist .sect')].map(e=>e.textContent)})")
    check(c['abschnitte']==['Gegner','Bosse'] and c['karten']==30+1+6+1 and c['verdeckt']==c['karten'],f"frischer Spielstand: {c['karten']} Einträge in „Gegner“ und „Bosse“, alle verdeckt")
    check('Sprinter' not in pg.inner_text('#clist') and 'Titan' not in pg.inner_text('#clist'),'verdeckte Einträge verraten keinen Namen')
    pg.click('#codex [data-back]')
    pg.click('#bAchv');pg.wait_for_timeout(150)
    check(pg.evaluate("()=>document.querySelectorAll('#alist .hcard.lock').length")==27 and pg.evaluate("()=>document.querySelectorAll('#alist .medal').length")==0 and 'Jäger' not in pg.inner_text('#alist'),'frischer Spielstand: alle 27 Erfolge verdeckt')
    pg.click('#achv [data-back]')
    # --- mit Zählständen ---
    pg.evaluate("""()=>{save.kills={swarm:5200,brute:800,shooter:400,sprinter:120,shield:30,elite:60,boss:14,'boss:Titan':9,'boss:Hydra':5,twin:2,'shiny:sprinter':1,'shiny:swarm':3};save.best=104;save.runs=30;save.nova=1;save.ach=null;persist()}""")
    pg.reload();pg.wait_for_timeout(300)   # beim Start wird bereits Erreichtes still übernommen
    pg.click('#bCodex');pg.wait_for_timeout(200)
    t=pg.inner_text('#clist')
    check(all(x in t for x in ['Schwärmer','Brecher','Fernkämpfer','Sprinter','Schildträger','Elite','Titan','Hydra','Doppelboss','Erdstoß','Brut']) and 'Spalter' not in t and 'Koloss' not in t,'besiegte Gegner und Bosse sind aufgedeckt, die übrigen bleiben verdeckt')
    check(pg.evaluate("()=>[...document.querySelectorAll('#clist .shiny')].map(e=>e.textContent)")==['✦ Schillernd besiegt ×3','✦ Schillernd besiegt'],'schillernde Funde stehen als Stern am normalen Eintrag')
    check('5,20K' in t and pg.evaluate("()=>document.querySelectorAll('#clist canvas[data-e]').length")==5+1+2+1,'Anzahl besiegt und Formen werden angezeigt')
    pg.screenshot(path='e1_enzyklopaedie.png',full_page=False)
    pg.evaluate("()=>document.querySelector('#clist').scrollTo(0,99999)");pg.wait_for_timeout(150);pg.screenshot(path='e2_bosse.png')
    pg.click('#codex [data-back]')
    # --- Erfolge ---
    a=pg.evaluate("()=>ACH.map(a=>[a.id,a.tiers.length,achTier(a)])")
    check(all(n==3 for i,n,_ in a if i!='shiny') and dict((i,n) for i,n,_ in a)['shiny']==1,'jeder Erfolg hat Bronze, Silber und Gold; „Erstes Schillern“ ist ein Einzel-Erfolg')
    st={i:t for i,_,t in a}
    check(st['welle']==2 and st['kills']==1 and st['boss']==1 and st['twin']==1 and st['elite']==1 and st['arten']==1 and st['bossarten']==1 and st['sprinter']==1 and st['schild']==1 and st['runs']==1 and st['nova']==1 and st['shiny']==1 and st['belagerer']==0,'Stufen werden aus dem Spielstand berechnet: '+json.dumps(st))
    check(pg.evaluate("()=>ACH.find(a=>a.id==='kills').tiers[2]>=1e7&&ACH.find(a=>a.id==='welle').tiers[2]>=300&&ACH.find(a=>a.id==='nova').tiers[2]>=250"),'es gibt sehr schwer erreichbare Gold-Stufen')
    check(not pg.evaluate("()=>ACH.some(a=>/alle.*(shin|schill)/i.test(a.name+a.text))") and pg.evaluate("()=>ACH.filter(a=>/schill/i.test(a.name+a.text)).length")==1,'kein Erfolg „alle Schillernden“, nur „Erstes Schillern“')
    pg.click('#bAchv');pg.wait_for_timeout(200)
    m=pg.evaluate("()=>({karten:document.querySelectorAll('#alist .hcard').length,verdeckt:document.querySelectorAll('#alist .hcard.lock').length,an:document.querySelectorAll('#alist .medal.on').length,alle:document.querySelectorAll('#alist .medal').length,kopf:document.querySelector('#alist h3').textContent,text:document.querySelector('#alist').innerText})")
    offen=[i for i,_,t in a if t>0];zu=[i for i,_,t in a if t==0]
    check(m['karten']==28 and m['verdeckt']==len(zu) and m['an']==sum(st.values()) and m['kopf']==f"{sum(st.values())} von {26*3+1} Medaillen",f"Erfolge-Seite: {m['kopf']}, {m['verdeckt']} verdeckt")
    namen=dict(pg.evaluate("()=>ACH.map(a=>[a.id,[a.name,a.text]])"))
    check(all(namen[i][0] not in m['text'] and namen[i][1] not in m['text'] for i in zu) and all(namen[i][0] in m['text'] for i in offen),'nicht freigeschaltete Erfolge verraten weder Namen noch Beschreibung, freigeschaltete sind lesbar')
    check(m['alle']==sum(n for i,n,t in a if t>0) and 'Nächste Stufe: Silber' in m['text'] and 'Nächste Stufe: Gold' in m['text'],'bei freigeschalteten Erfolgen sind die weiteren Stufen samt Schwelle sichtbar')
    check('keinen Vorteil' in m['text'] and f"{len(offen)} von 27 Erfolgen entdeckt" in m['text'],'Kopfzeile nennt entdeckte Erfolge und den Hinweis „kein Vorteil“')
    pg.screenshot(path='e3_erfolge.png');pg.click('#achv [data-back]')
    # --- schillernde Gegner im Run ---
    check(abs(pg.evaluate("()=>SHINY_P")-1/5000)<1e-12 and pg.evaluate("()=>SHINY_HP")==3.5,'Schillernd: Wahrscheinlichkeit 1 zu 5.000, 3,5-faches Leben')
    pg.click('#bStart');pg.wait_for_timeout(300)
    s=pg.evaluate("""()=>{paused=true;run.noImpulse=true;run.en.length=0;run.queue.length=0;run.base.max=run.base.hp=1e15;const ban=[];const h=run.h.banner;run.h.banner=(t,s)=>ban.push(t+' '+s);
      run.spawnEnemy('brute',false,100,-150);const n=run.en[0];run.spawnEnemy('brute',false,-100,-150,true);const sh=run.en[1];const g0={...run.gain},e0=run.energy;
      const out={hp:sh.max/n.max,dmg:sh.dmg/n.dmg,sp:[sh.shiny,n.shiny]};run.hitE(n,n.hp*2);const gN={s:run.gain.s-g0.s,e:run.energy-e0};const g1={...run.gain},e1=run.energy;run.hitE(sh,sh.hp*2);
      out.beute=[gN.s,run.gain.s-g1.s,gN.e,run.energy-e1];out.kills=run.killsBy;out.ban=ban;run.h.banner=h;
      // Auswahl: nur Wellen-Gegner können schillern, nie Bosse oder Splitterlinge
      const R0=Math.random;Math.random=()=>0;run.w=49;run.nextWave();Math.random=R0;out.queue=run.queue.map(q=>[q.type,!!q.shiny]);run.queue.length=0;return out}""")
    check(abs(s['hp']-3.5)<1e-9 and s['dmg']==1 and s['sp']==[True,False],'schillernder Gegner hat 3,5-faches Leben und sonst dieselben Werte')
    check(abs(s['beute'][0]-s['beute'][1])<1e-9 and abs(s['beute'][2]-s['beute'][3])<1e-9,'er gibt dieselbe Beute und Energie wie ein normaler Gegner')
    check(s['kills'].get('shiny:brute')==1 and s['kills'].get('brute')==2 and s['ban']==['Schillernd! Brecher besiegt'],'Fund wird gezählt und gemeldet: '+str(s['ban']))
    check(all(sh for t,sh in s['queue'] if t!='boss') and all(not sh for t,sh in s['queue'] if t=='boss') and any(t=='boss' for t,_ in s['queue']),'Bosse schillern nie, auch wenn der Zufall es bei allen anderen auslöst')
    # Anzeige ohne Fehler
    pg.evaluate("()=>{run.en.length=0;['swarm','brute','sprinter','shield'].forEach((t,i)=>{run.spawnEnemy(t,false,-120+i*80,-180,true);run.en[i].sp=0});paused=false}");pg.wait_for_timeout(500);pg.screenshot(path='e4_schillernd.png')
    # --- Erfolg wird am Run-Ende gemeldet, alte Stände nicht nachträglich ---
    check(pg.evaluate("()=>save.ach.welle")==2,'bereits Erreichtes wurde beim Start still übernommen')
    pg.evaluate("()=>{run.en.length=0;run.killsBy={sprinter:5000};run.quit=true;run.end()}");pg.wait_for_timeout(3300)
    check(pg.evaluate("()=>save.ach.sprinter")==2 and pg.inner_text('#toast')=='Erfolg: Sprinterfänger (Silber)','neuer Erfolg wird nach dem Run gemeldet: '+pg.inner_text('#toast'))
    pg.click('#bBack');pg.click('#bStart');pg.wait_for_timeout(300);pg.evaluate("()=>{run.killsBy={siege:10,splitter:30};run.quit=true;run.end()}");pg.wait_for_timeout(3300)
    check('neue Erfolge' in pg.inner_text('#toast'),'mehrere neue Erfolge werden zusammengefasst: '+pg.inner_text('#toast'))
    print('\n'.join(errs) or 'no errors');b.close()
