# Welt 5 (seit 0.40.0): Ausrüstung mit neun Plätzen, Inventar, Sets mit Teilboni, Recycling, Ausrüstungsboxen.
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
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True);pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'beta','index.html'),karte=True));pg.wait_for_timeout(400);ev=pg.evaluate
    # Hilfen: it(Art, Güte, Stufe, Set) legt ein Teil ins Inventar eines Spielstands
    ev("()=>{window.it=(s,t,q,l,set)=>{const x={id:s.uid++,t,q,s:l||1,set:set||null};s.inv.push(x);return x};window.an=(s,h,slot,t,q,l,set)=>{const x=it(s,t,q,l,set);return equip5(s,h,slot,x.id)}}")
    # ----- Regeln -----
    check(ev("()=>GEAR_SLOTS5.join()")=='helm,brust,hose,schuhe,waffe,schild,ring1,ring2,kette' and ev("()=>GEAR_SLOTS5.map(slotType5).filter(t=>t==='ring').length")==2,'neun Plätze: Helm, Brustpanzer, Hose, Schuhe, Waffe, Schild, zwei Ringe, Halskette')
    check(sorted(ev("()=>SET_IDS5.map(s=>SETS5[s].parts.length)"))==[3,3,3,4,5],'Sets aus 3, 4 und 5 Teilen')
    check(ev("()=>{const need={};for(const s of ['glut','takt','wacht'])for(const t of SETS5[s].parts)need[t]=(need[t]||0)+1;const have={};for(const sl of GEAR_SLOTS5)have[slotType5(sl)]=(have[slotType5(sl)]||0)+1;return Object.keys(have).every(t=>need[t]===have[t])}"),'drei 3er-Sets füllen zusammen genau alle neun Plätze')
    o=ev("()=>{const s=freshW5(),g=n=>{const S=freshW5();const P=[['helm','helm'],['brust','brust'],['hose','hose'],['schild','schild'],['schuhe','schuhe']];for(let i=0;i<n;i++)an(S,'funke',P[i][0],P[i][1],0,1,'bastion');return gearBonus5(S.gear.funke)};const base=n=>{const S=freshW5();const P=[['helm','helm'],['brust','brust'],['hose','hose'],['schild','schild'],['schuhe','schuhe']];for(let i=0;i<n;i++)an(S,'funke',P[i][0],P[i][1],0,1,null);return gearBonus5(S.gear.funke)};return [2,3,4,5].map(n=>[Math.round((g(n).hp-base(n).hp)*100),Math.round((g(n).dr-base(n).dr)*100)])}")
    check(o==[[0,0],[12,0],[12,8],[30,8]],'5er-Set Bastion: Bonus ab 3 Teilen, mehr bei 4, voll bei 5 '+str(o))
    check(ev("()=>{const s=freshW5();an(s,'funke','waffe','waffe',0,1,'glut');an(s,'funke','ring1','ring',0,1,'glut');an(s,'funke','ring2','ring',0,1,'glut');an(s,'funke','kette','kette',0,1,'glut');return setCounts5(s.gear.funke).glut}")==3,'ein Set zählt höchstens so viele Teile, wie es hat')
    check(ev("()=>{const s=freshW5(),a=heroStats5('funke',1,0,s.gear.funke),u=heroPower5('funke',1,0,s.gear.funke);an(s,'funke','waffe','waffe',3,20);an(s,'funke','brust','brust',1,5);an(s,'funke','schuhe','schuhe',0,1);an(s,'funke','schild','schild',0,1);an(s,'funke','kette','kette',0,1);const b=heroStats5('funke',1,0,s.gear.funke);return b.atk>a.atk&&b.hp>a.hp&&b.cd<a.cd&&b.dr>0&&b.en>a.en&&heroPower5('funke',1,0,s.gear.funke)>u}"),'Ausrüstung hebt Angriff, Leben, Tempo, Energie, senkt den Schaden und zählt in UP')
    check(ev("()=>{const s=freshW5(),w=it(s,'waffe',1,3),r=it(s,'ring',0,1);const no=equip5(s,'funke','helm',w.id),ok=equip5(s,'funke','waffe',w.id),r2=equip5(s,'funke','ring2',r.id),w2=it(s,'waffe',2,3),sw=equip5(s,'funke','waffe',w2.id);return [no,ok,r2,sw,s.gear.funke.waffe.q,s.inv.length,s.inv[0].id===w.id,unequip5(s,'funke','ring2'),s.inv.length]}")==[False,True,True,True,2,1,True,True,2],'Anlegen nur auf den passenden Platz; Tauschen und Ablegen legen das alte Teil zurück ins Inventar')
    check(ev("()=>{const s=freshW5();const a=it(s,'helm',0,20),b=it(s,'helm',3,20),c=it(s,'helm',0,1,'takt');const n=recycleAll5(s,0);return [n,s.cur.x,s.inv.length,s.inv.some(x=>x.id===c.id),recycle5(s,b.id),s.cur.x]}")==[2,2,2,True,40,42],'Recyceln gibt Schrott nach Güte und Stufe; „alles Gewöhnliche“ lässt Set-Teile liegen')
    check(ev("()=>{const s=freshW5();s.cleared=17;s.cur.x=29;const a=buyBox5(s);s.cur.x=65;const b=buyBox5(s);return [a,b.s,s.cur.x,s.inv.length]}")==[None,17,35,1],'Ausrüstungsbox kostet 30 Schrott und enthält ein Teil auf der Stufe der höchsten gewonnenen Welle')
    f=ev("()=>{const s=freshW5();let seed=5;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;let n=0;for(let i=0;i<20000;i++)n+=dropGear5(s,5,false,rnd).length;const q=[0,0,0,0];for(const x of s.inv)q[x.q]++;const b=dropGear5(s,5,true,rnd).length;return [n/200,q.map(v=>Math.round(100*v/s.inv.length)),b,new Set(s.inv.map(x=>x.t)).size,s.inv.filter(x=>x.set).length/s.inv.length]}")
    check(abs(f[0]-3)<0.5 and abs(f[1][0]-70)<6 and f[1][3]<=3 and f[2]==2 and f[3]==8 and 0.15<f[4]<0.35,'Beute: 3 % je Gegner, meist gewöhnlich, alle acht Arten, etwa ein Viertel Set-Teile; ein Boss lässt zwei Teile fallen '+str(f))
    check(ev("()=>{const a=loadW5({heroes:{funke:{}},inv:[{t:'helm',q:1,s:4},{t:'quatsch',q:0,s:1},{t:'ring',q:9,s:1}],gear:{funke:{waffe:{t:'waffe',q:2,s:3},helm:{t:'ring',q:0,s:1}},gibtsnicht:{waffe:{t:'waffe',q:0,s:1}}}});return [a.inv.length,Object.keys(a.gear).join(),Object.keys(a.gear.funke).join(),a.uid,a.cur.x]}")==[1,'funke','waffe',3,0],'Spielstand: ungültige Teile und falsch belegte Plätze fallen weg, Nummern laufen fort')
    check(ev("()=>{const s=freshW5();s.heroes.funke.l=60;s.pos=10;s.cleared=9;const r=new Run5(s,{});r.headless=true;for(let i=0;i<1200&&s.cleared<10;i++)r.step(0.05);return [s.cleared,s.inv.length>=2,r.loot>=2]}")==[10,True,True],'im Lauf: der besiegte Boss hinterlässt Ausrüstung im Inventar')
    check(ev("()=>{const s=freshW5();an(s,'funke','schild','schild',3,60);const r=new Run5(s,{});r.headless=true;r.spawn();const h=r.heroes[0],e=r.en[0];r.hurt(h,100,null);return Math.round(h.max-h.hp)}")<100,'im Lauf: ein Schild senkt den Schaden')
    # ----- Oberfläche -----
    pg.click('#wmap [data-w="5"] .hit');pg.click('#bEnter');pg.wait_for_timeout(700)
    ev("()=>{const w=save.w5;it(w,'waffe',2,8,'glut');it(w,'waffe',0,2);it(w,'ring',1,8,'glut');it(w,'kette',1,8,'glut');it(w,'helm',0,3);it(w,'helm',0,1);it(w,'brust',1,5);it(w,'schuhe',0,4,'takt');renderW5()}")
    check(pg.locator('#w5tabs [data-t]').count()==5 and 'Inventar' in pg.inner_text('#w5tabs'),'fünf Reiter, darunter Inventar')
    check('Ausrüstung · 0 von 9' in pg.inner_text('#w5panel [data-act="gear"]'),'Helden-Karte hat den Knopf „Ausrüstung“')
    up0=ev("()=>heroPower5('funke',save.w5.heroes.funke.l,0,save.w5.gear.funke)")
    pg.click('#w5panel [data-act="gear"]');pg.wait_for_timeout(120)
    check(pg.locator('#w5panel .w5gslot').count()==9 and 'Ring 2' in pg.inner_text('#w5panel .w5gslots') and 'Halskette' in pg.inner_text('#w5panel .w5gslots'),'Ausrüstungs-Ansicht zeigt neun Plätze')
    check(pg.locator('#w5panel [data-act="equip"]').count()==2 and '→' in pg.inner_text('#w5panel [data-act="equip"] >> nth=0') and 'Glutklinge' in pg.inner_text('#w5panel .w5item >> nth=0'),'für den Platz „Waffe“ stehen die zwei Waffen aus dem Inventar zur Wahl, die bessere zuerst, mit UP vorher → nachher')
    pg.click('#w5panel [data-act="equip"] >> nth=0');pg.wait_for_timeout(150)
    up1=ev("()=>heroPower5('funke',save.w5.heroes.funke.l,0,save.w5.gear.funke)")
    check(ev("()=>save.w5.gear.funke.waffe.q")==2 and up1>up0 and ev("()=>run5.heroes[0].atk===heroStats5('funke',save.w5.heroes.funke.l,0,save.w5.gear.funke).atk") and 'angelegt' in pg.inner_text('#w5panel'),'Anlegen wirkt sofort im Lauf, UP steigt '+str([up0,up1]))
    pg.click('#w5panel [data-gslot="ring1"]');pg.wait_for_timeout(80);pg.click('#w5panel [data-act="equip"]');pg.wait_for_timeout(100)
    pg.click('#w5panel [data-gslot="kette"]');pg.wait_for_timeout(80);pg.click('#w5panel [data-act="equip"]');pg.wait_for_timeout(100)
    t=pg.inner_text('#w5panel');check('Set Glutklinge' in t and '3 von 3' in t and pg.locator('#w5panel .w5on').count()==2,'Set-Bonus wird mit Teilstufen angezeigt, bei drei Teilen sind beide aktiv')
    pg.screenshot(path='w5j_ausruestung.png')
    pg.click('#w5panel [data-act="unequip"]');pg.wait_for_timeout(100);check(ev("()=>!save.w5.gear.funke.kette&&save.w5.inv.some(x=>x.t==='kette')") and pg.locator('#w5panel .w5on').count()==1,'Ablegen legt das Teil zurück ins Inventar, der Set-Bonus fällt auf die erste Stufe')
    pg.click('#w5panel [data-act="gback"]');pg.wait_for_timeout(100);check('Ausrüstung · 2 von 9' in pg.inner_text('#w5panel [data-act="gear"]'),'zurück zur Heldenübersicht, Zähler stimmt')
    # Inventar
    pg.click('#w5tabs [data-t="inv"]');pg.wait_for_timeout(120)
    n0=ev("()=>save.w5.inv.length");t=pg.inner_text('#w5panel')
    check('Währungen' in t and 'Material' in t and 'Kerne' in t and 'Schrott' in t and pg.locator('#w5panel .w5item').count()==n0,'Inventar: Währungen, Material, Kerne und alle Ausrüstungsteile')
    arten=ev("()=>[...$$('#w5panel .w5item b')].map(e=>e.textContent.split(' · ')[0])")
    check(arten==sorted(arten,key=lambda a:['Helm','Brustpanzer','Hose','Schuhe','Waffe','Schild','Ring','Halskette'].index(a)),'Ausrüstung ist nach Art sortiert '+str(arten))
    pg.click('#w5panel [data-invf="helm"]');pg.wait_for_timeout(80);check(pg.locator('#w5panel .w5item').count()==2,'Filter nach Art')
    pg.click('#w5panel [data-act="recy"] >> nth=0');pg.wait_for_timeout(120);check(ev("()=>save.w5.inv.length")==n0-1 and ev("()=>save.w5.cur.x")>=1 and 'Schrott' in pg.inner_text('#toast'),'einzelnes Teil recyceln gibt Schrott')
    pg.click('#w5panel [data-invf="alle"]');pg.wait_for_timeout(80)
    pg.click('#w5panel [data-act="recyall"][data-id="0"]');pg.wait_for_timeout(120)
    check(ev("()=>save.w5.inv.every(x=>x.q>0||x.set)") and ev("()=>save.w5.inv.some(x=>x.set&&x.q===0)"),'„Alles Gewöhnliche recyceln“ lässt Set-Teile und Besseres liegen')
    pg.screenshot(path='w5k_inventar.png')
    # Shop: Box
    pg.click('#w5tabs [data-t="shop"]');pg.wait_for_timeout(100)
    check('Ausrüstungsbox' in pg.inner_text('#w5panel') and 'poor' in ev("()=>$('#w5panel [data-act=\"box\"]').className"),'Shop zeigt die Ausrüstungsbox, ohne genug Schrott grau')
    pg.click('#w5panel [data-act="box"]');pg.wait_for_timeout(250);check('fehlen' in pg.inner_text('#toast'),'zu wenig Schrott: Meldung')
    n1=ev("()=>{save.w5.cur.x=70;return save.w5.inv.length}");pg.wait_for_timeout(350)
    pg.click('#w5panel [data-act="box"]');pg.wait_for_timeout(150)
    check(ev("()=>save.w5.inv.length")==n1+1 and ev("()=>save.w5.cur.x")==40 and 'Aus der Box' in pg.inner_text('#w5panel .w5res'),'Box öffnen: Teil im Inventar, Inhalt wird gezeigt')
    pg.screenshot(path='w5l_box.png')
    # Neuladen behält Ausrüstung
    pg.reload();pg.wait_for_timeout(400);check(ev("()=>save.w5.gear.funke.waffe.q===2&&save.w5.gear.funke.ring1.set==='glut'&&save.w5.inv.length")==n1+1,'Ausrüstung und Inventar überstehen das Neuladen')
    print('\n'.join(errs) or 'no errors');b.close()
