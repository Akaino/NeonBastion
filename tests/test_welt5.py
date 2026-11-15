# Welt 5 „Expedition“ (Prototyp seit 0.37.0): Idle-Runner mit Heldensammlung. Nur in Beta und Bottest betretbar.
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
ROOT=os.path.join(os.path.dirname(HERE),'dist','web')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch();errs=[]
    # ----- echtes Spiel: weiter verdeckt -----
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True);pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'index.html'),karte=True));pg.wait_for_timeout(400)
    pg.click('#wmap [data-w="5"] .hit');pg.wait_for_timeout(100)
    check('hidden' in pg.evaluate("()=>$('#wmap [data-w=\"5\"]').getAttribute('class')") and pg.locator('#bEnter').count()==0 and 'Expedition' not in pg.inner_text('#worlds'),'echtes Spiel: Welt 5 bleibt verdeckt und lässt sich nicht betreten')
    pg.close()
    # ----- Beta -----
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True);pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'beta','index.html'),karte=True));pg.wait_for_timeout(400);ev=pg.evaluate
    # Daten
    check(ev("()=>HERO_IDS5.length")==26 and ev("()=>RARITY_IDS5.map(r=>HERO_IDS5.filter(h=>HEROES5[h].rar===r).length)")==[10,6,5,5],'26 Helden: 10 Basis, 6 Elite, 5 Legendäre, 5 Champions')
    check(ev("()=>RARITY_IDS5.every(r=>CLASS_IDS5.every(c=>HERO_IDS5.some(h=>HEROES5[h].rar===r&&HEROES5[h].cls===c)))") and ev("()=>CLASS_IDS5.length")==5,'jede der fünf Klassen kommt in jeder Seltenheit vor')
    check(ev("()=>CRYSTAL_IDS5.every(c=>CRYSTALS5[c].p.reduce((a,b)=>a+b,0)===100)") and ev("()=>CRYSTALS5.einfach.p[3]")==3 and ev("()=>CRYSTALS5.selten.p[3]>3&&CRYSTALS5.prisma.p[3]>CRYSTALS5.selten.p[3]"),'drei Kristalle, Chancen ergeben je 100 %, Champion 3 % im einfachen und mehr in den besseren')
    check(ev("()=>{const s=freshW5();return Object.keys(s.heroes).length===1&&HEROES5[Object.keys(s.heroes)[0]].rar==='basis'&&s.team.filter(Boolean).length===1}"),'Start mit einem Basishelden')
    check(ev("()=>new Set(HERO_IDS5.map(h=>heroSprite5(h,20).toDataURL())).size")==26,'alle 26 Helden sehen verschieden aus')
    # Kristalle: Häufigkeiten, doppelter Held wird zum Kern
    f=ev("()=>{const s=freshW5();s.cur.k=1e9;const n={basis:0,elite:0,legend:0,champ:0};let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;for(let i=0;i<20000;i++)n[pull5(s,'einfach',rnd).rar]++;return [n.basis/200,n.elite/200,n.legend/200,n.champ/200,Object.keys(s.heroes).length,s.heroes.funke.s>0]}")
    check(abs(f[0]-62)<2 and abs(f[1]-25)<2 and abs(f[2]-10)<1.5 and abs(f[3]-3)<0.8 and f[4]==26 and f[5],'20.000 einfache Kristalle: Häufigkeiten wie angegeben, doppelte Helden werden zu Kernen '+str(f[:4]))
    check(ev("()=>{const s=freshW5();s.cur.k=5;return pull5(s,'einfach')===null&&s.cur.k===5}"),'ohne genug Kryon öffnet sich kein Kristall')
    # Aufwerten, Rang, Synchronisieren
    check(ev("()=>{const s=freshW5();s.cur.l=1e6;const a=heroStats5('funke',1,0);levelUp5(s,'funke');const b=heroStats5('funke',2,0);return s.heroes.funke.l===2&&b.hp>a.hp&&b.atk>a.atk&&s.cur.l===1e6-lvlCost5(1)}"),'Stufe kostet Lumen und hebt Leben und Angriff')
    check(ev("()=>{const s=freshW5();s.cur.l=1e9;for(let i=0;i<30;i++)levelUp5(s,'funke');const l=s.heroes.funke.l;s.ess.striker=breakCost5(10);levelUp5(s,'funke');return l===10&&s.heroes.funke.l===11&&s.ess.striker===0}"),'alle 10 Stufen braucht der Durchbruch Material der Klasse')
    check(ev("()=>{const s=freshW5();s.heroes.funke.s=1;const ok=rankUp5(s,'funke');s.heroes.funke.s=0;const no=rankUp5(s,'funke');s.cur.d=2;const dust=rankUp5(s,'funke');return ok&&!no&&dust&&s.heroes.funke.r===2&&s.cur.d===0}"),'Rang kostet Kerne; fehlende Kerne ersetzt Synchron-Staub')
    check(ev("()=>{const s=freshW5();s.heroes.funke.s=3;s.heroes.aegis={l:1,r:0,s:2};return sync5(s,'funke')===3&&s.cur.d===3&&s.heroes.funke.s===0&&sync5(s,'aegis')===0&&s.heroes.aegis.s===2}"),'Synchronisieren macht aus Kernen von Basishelden Staub, andere Seltenheiten nicht')
    check(ev("()=>{const s=freshW5();s.heroes.funke.r=5;return rankNeed5(s,'funke')===null}") and ev("()=>RARITY5.champ.maxRank")==6,'höchster Rang 5, Champions 6')
    # Gruppenregel
    check(ev("()=>{const s=freshW5();for(const h of HERO_IDS5)s.heroes[h]={l:1,r:0,s:0};setSlot5(s,1,'aegis');const a=slotBlock5(s,2,'fenris');setSlot5(s,2,'monolith');setSlot5(s,3,'vesper');const b=slotBlock5(s,4,'aurora');return a.includes('Champion')&&b.includes('Legendäre')&&setSlot5(s,4,'riegel')&&s.team.join()==='funke,aegis,monolith,vesper,riegel'}"),'Gruppe: höchstens ein Champion und zwei Legendäre')
    check(ev("()=>{const s=freshW5();return setSlot5(s,0,null)===false&&s.team[0]==='funke'}"),'der letzte Held lässt sich nicht aus der Gruppe nehmen')
    # Lauf: Sieg, Niederlage, Bossregel, Wechsel
    ev("()=>{window.mk=(f)=>{const s=freshW5();f&&f(s);const r=new Run5(s,{});r.headless=true;window.r=r;window.s=s;return r};window.st=sec=>{for(let i=0;i<Math.round(sec/0.05);i++)r.step(0.05)}}")
    ev("()=>{mk(s=>{s.heroes.funke.l=40});st(12)}");check(ev("()=>s.cleared>=1&&s.pos>1&&s.cur.l>0&&s.cur.k>20"),'starke Gruppe gewinnt Wellen, bekommt Lumen und Kryon und rückt vor')
    ev("()=>{mk(s=>{s.pos=7;s.cleared=6});st(40)}");check(ev("()=>r.wipes>=1&&s.pos<7&&s.cleared===6"),'schwache Gruppe fällt und läuft in der Welle davor weiter, ohne Verlust')
    ev("()=>{mk(s=>{s.pos=10;s.cleared=9;s.heroes.funke.l=22});window.e0=[];st(60)}")
    check(ev("()=>s.block===10&&s.pos===9&&r.wipes===1"),'am Boss gescheitert: Welle 9 läuft weiter, der Boss wartet')
    ev("()=>st(60)");check(ev("()=>s.pos===9&&s.block===10&&r.wins>=2"),'ohne Herausforderung wird der Boss nicht erneut versucht')
    ev("()=>{s.heroes.funke.l=70;r.refresh();r.challenge();st(40)}");check(ev("()=>s.block===0&&s.cleared>=10&&zoneOf5(s.pos)===2"),'„Boss herausfordern“ tritt gegen den Boss an; nach dem Sieg geht es in Zone 2 weiter')
    ev("()=>{r.goto(4,true);st(30)}");check(ev("()=>s.pos===4&&r.stage===4&&s.hold&&r.wins>=3"),'Wechsel in eine frühere Welle mit „wiederholen“: Die Gruppe bleibt dort')
    ev("()=>{r.goto(999,false)}");check(ev("()=>s.pos===s.cleared+1"),'nicht weiter als bis zur ersten ungewonnenen Welle')
    # Helden handeln sinnvoll
    check(ev("()=>{mk(s=>{s.heroes.flick={l:1,r:0,s:0};s.heroes.riegel={l:30,r:0,s:0};s.team=['riegel',null,null,null,'flick']});r.spawn();const h=r.heroes.find(x=>x.id==='flick');h.en=100;const a=r.useful(h,r.en);r.heroes[0].hp=r.heroes[0].max*0.3;return [a,r.useful(h,r.en)]}")==[False,True],'Heiler setzt die Heilwelle nur ein, wenn jemand verletzt ist')
    check(ev("()=>{mk(s=>{s.heroes.riegel={l:1,r:0,s:0};s.team=[null,null,null,null,'riegel','funke'].slice(0,5)});r.spawn();for(const e of r.en){e.x=300;e.sp=0}const h=r.heroes[0];return r.act(h,r.en)}")==False,'Nahkämpfer trifft nichts, was außer Reichweite steht')
    # Abwesenheit
    o=ev("()=>{const s=freshW5();s.pos=15;s.cleared=14;s.last=1e12;const now=1e12+3600e3,r=idleRate5(s),l0=s.cur.l,g=claimIdle5(s,now);return [Math.round(g.min),g.l,Math.round(r.l*60),s.cur.l-l0,s.last===now,waveLoot5(14)*25]}")
    check(o[0]==60 and abs(o[1]-o[2])<=1 and o[3]==o[1] and o[4] and abs(o[1]-o[5])<=o[5]*0.01+1,'eine Stunde weg bringt so viel Lumen wie 25 Wellen der geparkten Stufe (etwa fünf Minuten aktiv) '+str(o))
    check(ev("()=>{const s=freshW5();s.pos=15;s.cleared=14;s.last=1e12;const g=claimIdle5(s,1e12+200*86400e3);return g.min===200*1440&&g.l>1e6}"),'kein Deckel: 200 Tage werden voll abgerechnet')
    check(ev("()=>{const s=freshW5();s.last=1e12;return claimIdle5(s,1e12+3600e3)===null}"),'ohne gewonnene Welle gibt es keinen Abwesenheitsertrag')
    check(ev("()=>{const a=loadW5({cur:{l:5},heroes:{funke:{l:7},gibtsnicht:{l:1}},team:['funke','gibtsnicht']});return a.cur.k===START_KRYON5&&a.heroes.funke.r===0&&!a.heroes.gibtsnicht&&a.team.length===5&&a.team[1]===null&&a.ess.tank===0}"),'alter oder lückenhafter Spielstand wird sauber aufgefüllt')
    # ----- Oberfläche -----
    pg.click('#wmap [data-w="5"] .hit');pg.wait_for_timeout(100)
    check('Prototyp' in pg.inner_text('#wsheet') and 'Expedition' in ev("()=>$('#wmap').textContent"),'Beta: Welt 5 steht mit Namen auf der Karte')
    pg.click('#bEnter');pg.wait_for_timeout(1200)
    check(ev("()=>!$('#w5').hidden&&w5On&&run5&&run5.t>0.5&&W.id===1"),'Betreten öffnet den Lauf; die aktive Welt der anderen bleibt')
    check(ev("()=>{const c=$('#w5cv'),d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<d.length;i+=400)if(d[i]+d[i+1]+d[i+2]>150)n++;return n}")>20,'der Lauf wird gezeichnet')
    check('1-1' in pg.inner_text('#w5Title') and 'Glasfelder' in pg.inner_text('#w5Title'),'Kopfzeile nennt Zone, Welle und Namen')
    t=pg.inner_text('#w5panel');check('Funke' in t and 'Stufe 2' in t and '„Wuchtschlag“' in t and '→' in t and t.count('Noch nicht gefunden')==25,'Reiter Helden: eigener Held mit Vorschau, 25 noch verdeckt')
    ev("()=>{save.w5.cur.l=5000;save.w5.cur.k=400}");pg.wait_for_timeout(400)
    pg.click('#w5panel [data-act="lvl"]');pg.wait_for_timeout(150);check(ev("()=>save.w5.heroes.funke.l")==2 and ev("()=>run5.heroes[0].max===heroStats5('funke',2,0).hp"),'Stufe kaufen wirkt sofort im laufenden Kampf')
    pg.screenshot(path='w5a_helden.png')
    pg.click('#w5tabs [data-t="shop"]');pg.wait_for_timeout(100)
    for i in range(6):
        pg.click('#w5panel [data-act="pull"][data-id="selten"]');pg.wait_for_timeout(80)
    check(ev("()=>save.w5.pulls")==6 and ev("()=>save.w5.cur.k")==40 and pg.locator('#w5panel .w5res').count()==1 and ('Neu:' in pg.inner_text('#w5panel .w5res') or 'Schon vorhanden' in pg.inner_text('#w5panel .w5res')),'Shop: Kristalle öffnen zeigt den gefundenen Helden')
    pg.screenshot(path='w5b_shop.png')
    pg.click('#w5panel [data-act="pull"][data-id="prisma"]');pg.wait_for_timeout(250);check('fehlen' in pg.inner_text('#toast') and ev("()=>save.w5.pulls")==6,'zu wenig Kryon: Meldung, kein Kauf')
    pg.click('#w5tabs [data-t="team"]');pg.wait_for_timeout(100)
    n=ev("()=>Object.keys(save.w5.heroes).length");check(pg.locator('#w5panel .w5chip').count()==n and pg.locator('#w5panel .w5slot').count()==5,'Aufstellung: fünf Plätze, alle gefundenen Helden zur Wahl')
    pg.click('#w5panel [data-slot="1"]');pg.wait_for_timeout(80);pg.click('#w5panel .w5chip:not(.poor):not(.sel) >> nth=1');pg.wait_for_timeout(150)
    check(ev("()=>save.w5.team.filter(Boolean).length")==2 and ev("()=>run5.heroes.length")==2,'Held auf Platz 2 gesetzt, die Welle beginnt mit der neuen Gruppe')
    pg.screenshot(path='w5c_team.png')
    pg.click('#w5tabs [data-t="zonen"]');pg.wait_for_timeout(100)
    ev("()=>{save.w5.cleared=13;save.w5.pos=14;renderW5()}");pg.wait_for_timeout(80)
    check(pg.locator('#w5panel .w5card.zone').count()==2 and pg.locator('#w5panel .w5wave:not([disabled])').count()==14,'Zonen: zwei Zonen sichtbar, 14 Wellen wählbar')
    pg.click('#w5panel [data-stage="4"]');pg.wait_for_timeout(150);check(ev("()=>save.w5.pos===4&&run5.stage===4") and '1-4' in pg.inner_text('#w5Title'),'Wechsel nach 1-4')
    pg.click('#w5panel [data-act="hold"]');pg.wait_for_timeout(100);check(ev("()=>save.w5.hold")==True and 'an' in pg.inner_text('#w5panel [data-act="hold"]'),'„Diese Welle wiederholen“ lässt sich einschalten')
    pg.screenshot(path='w5d_zonen.png')
    ev("()=>{save.w5.block=20;updW5Hud()}");check(pg.is_visible('#w5Boss'),'Knopf „Boss herausfordern“ erscheint, wenn ein Boss wartet')
    pg.click('#w5Speed');check(pg.inner_text('#w5Speed')=='2×' and ev("()=>w5Speed")==2,'Tempo-Knopf')
    # zurück, Abwesenheit, Neuladen
    pg.click('#w5Back');pg.wait_for_timeout(200);check(ev("()=>!$('#worlds').hidden&&!w5On&&save.w5.last>0"),'Zurück führt zur Weltenkarte, der Zeitpunkt wird gemerkt')
    ev("()=>{save.w5.block=0;save.w5.last=Date.now()-3*3600e3;persist()}");pg.reload();pg.wait_for_timeout(400)
    l0=ev("()=>save.w5.cur.l");pg.click('#wmap [data-w="5"] .hit');pg.click('#bEnter');pg.wait_for_timeout(500)
    check(pg.is_visible('#w5Note') and 'Während du weg warst' in pg.inner_text('#w5Note') and '3 h' in pg.inner_text('#w5Note') and ev("()=>save.w5.cur.l")>l0,'nach drei Stunden Abwesenheit: Meldung mit Ertrag')
    pg.screenshot(path='w5e_weg.png')
    pg.click('#w5NoteX');check(not pg.is_visible('#w5Note'),'Meldung lässt sich schließen')
    # die anderen Welten bleiben unberührt
    pg.click('#w5Back');pg.wait_for_timeout(150);pg.click('#wmap [data-w="1"] .hit');pg.click('#bEnter');pg.wait_for_timeout(200);pg.click('#bStart');pg.wait_for_timeout(1500)
    check(ev("()=>run&&run.world===1&&run.t>0.5&&!w5On"),'Neon-Sektor läuft danach wie gewohnt')
    print('\n'.join(errs) or 'no errors');b.close()
