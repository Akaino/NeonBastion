# Weltenkarte (seit 0.33.0): Kern in der Mitte, fünf Welten darum, dahinter je ein verdeckter Platz für eine zweite Version.
# Echtes Spiel: Neon-Sektor offen, Gitterfestung, Arcade und Classic Tower Defense „Demnächst“, fünfte Welt verdeckt.
# Beta: Gitterfestung zusätzlich spielbar.
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
ROOT=os.path.join(os.path.dirname(HERE),'dist','web')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
cls=lambda pg,w:pg.evaluate("w=>$('#wmap [data-w=\"'+w+'\"]').getAttribute('class')",w)
def karte(pg,name,beta):
    check(not pg.evaluate("()=>$('#bWorlds').hidden"),name+': Knopf „Welten“ ist von Anfang an da (frischer Spielstand)')
    pg.click('#bWorlds');pg.wait_for_timeout(250)
    check(pg.evaluate("()=>$$('#wmap .wnode:not(.ver)').length")==5 and pg.evaluate("()=>$$('#wmap .wnode.ver').length")==5 and pg.evaluate("()=>$$('#wmap .wcore').length")==1,name+': Kern, fünf Welten, fünf verdeckte zweite Versionen')
    check('open' in cls(pg,'1') and 'act' in cls(pg,'1'),name+': Neon-Sektor offen und aktiv')
    check(('open' if beta else 'soon') in cls(pg,'2'),name+': Gitterfestung '+('offen' if beta else '„Demnächst“'))
    check('soon' in cls(pg,'3') and 'soon' in cls(pg,'4'),name+': Arcade und Classic Tower Defense „Demnächst“')
    check('hidden' in cls(pg,'5') and 'soon' not in cls(pg,'5'),name+': fünfte Welt verdeckt, nicht „Demnächst“')
    t=pg.evaluate("()=>$('#wmap').textContent")
    check('Arcade' in t and 'Classic' in t and 'Defense' in t and 'Neon-Sektor' in t and 'Gitterfestung' in t and 'Verborgene' not in t,name+': Namen der vier bekannten Welten stehen auf der Karte, die fünfte hat keinen')
    check('Rekord' in pg.inner_text('#wsheet') and pg.locator('#bEnter').count()==0,name+': Karte zeigt die aktive Welt mit Rekord, ohne Betreten-Knopf')
    for w,wort in (('3','Raumschiffe'),('4','Türme')):
        pg.click('#wmap [data-w="'+w+'"]');pg.wait_for_timeout(80)
        s=pg.inner_text('#wsheet')
        check('Demnächst' in s and wort in s and pg.locator('#bEnter').count()==0 and 'sel' in cls(pg,w),name+': Welt '+w+' zeigt Beschreibung und „Demnächst“, lässt sich nicht betreten')
    pg.click('#wmap [data-w="5"]');pg.wait_for_timeout(80)
    s=pg.inner_text('#wsheet');check('nichts bekannt' in s and 'Demnächst' not in s and pg.locator('#bEnter').count()==0,name+': fünfte Welt verrät nichts')
    pg.click('#wmap [data-w="v1"]');pg.wait_for_timeout(80)
    s=pg.inner_text('#wsheet');check('Zweite Version' in s and 'Neon-Sektor' in s and pg.locator('#bEnter').count()==0,name+': zweite Version des Neon-Sektors ist verdeckt')
    pg.click('#wmap [data-w="v5"]');pg.wait_for_timeout(80)
    check('Zweite Version' in pg.inner_text('#wsheet') and 'Verborgene Welt' not in pg.inner_text('#wsheet'),name+': zweite Version der fünften Welt nennt keinen Namen')
    pg.click('#wmap [data-w="2"]');pg.wait_for_timeout(80)
    # passt auf den Bildschirm: Karte ragt nicht über den Rand, kein Text der Karte liegt außerhalb
    box=pg.evaluate("()=>{const r=$('#wmap svg').getBoundingClientRect();const o=[...$$('#wmap text')].filter(t=>{const b=t.getBoundingClientRect();return b.left<0||b.right>innerWidth||b.top<0||b.bottom>innerHeight}).length;return [r.width,r.height,o]}")
    check(box[0]>=300 and box[1]>=300 and box[2]==0,name+': Karte passt aufs Handy '+str(box))
    ov=pg.evaluate("()=>{const T=[...$$('#wmap .wnode text.lab, #wmap .wnode text.tag')].map(t=>t.getBoundingClientRect()),C=[...$$('#wmap .wnode .body, #wmap .wcore circle')].map(c=>c.getBoundingClientRect());let n=0;for(const t of T)for(const c of C)if(t.left<c.right-1&&t.right>c.left+1&&t.top<c.bottom-1&&t.bottom>c.top+1)n++;return n}")
    check(ov==0,name+': keine Beschriftung überdeckt einen Knoten ('+str(ov)+')')
with sync_playwright() as p:
    b=p.chromium.launch()
    # ----- echtes Spiel -----
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'index.html')));pg.wait_for_timeout(400)
    karte(pg,'echtes Spiel',False)
    check('Demnächst' in pg.inner_text('#wsheet') and pg.locator('#bEnter').count()==0,'echtes Spiel: Gitterfestung lässt sich nicht betreten')
    pg.screenshot(path='wk1_prod.png')
    # ein alter Spielstand, der in der Gitterfestung stand, landet im Neon-Sektor und behält seine Daten
    pg.evaluate("()=>{save.world=2;save.w2.best=12;save.best=120;persist()}");pg.reload();pg.wait_for_timeout(400)
    check(pg.evaluate("()=>W.id")==1 and pg.evaluate("()=>save.w2.best")==12,'echtes Spiel: Spielstand aus der Gitterfestung startet im Neon-Sektor, Welt-2-Fortschritt bleibt erhalten')
    pg.click('#bWorlds');pg.wait_for_timeout(200);pg.click('[data-back]:visible');pg.wait_for_timeout(150)
    check(pg.evaluate("()=>!$('#hub').hidden"),'echtes Spiel: Zurück führt in den Hub')
    pg.close()
    # ----- Beta -----
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'beta','index.html')));pg.wait_for_timeout(400)
    karte(pg,'Beta',True)
    pg.screenshot(path='wk2_beta.png')
    check(pg.locator('#bEnter').count()==1,'Beta: Gitterfestung hat einen Betreten-Knopf')
    pg.click('#bEnter');pg.wait_for_timeout(400)
    check(pg.evaluate("()=>W.id")==2 and pg.evaluate("()=>!$('#hub').hidden"),'Beta: Betreten wechselt in die Gitterfestung und zurück in den Hub')
    pg.click('#bWorlds');pg.wait_for_timeout(200)
    check('act' in cls(pg,'2') and 'Aktive Welt' in pg.inner_text('#wsheet'),'Beta: Karte öffnet auf der aktiven Welt')
    pg.screenshot(path='wk3_beta_w2.png')
    pg.click('#wmap [data-w="1"]');pg.click('#bEnter');pg.wait_for_timeout(300)
    check(pg.evaluate("()=>W.id")==1,'Beta: zurück in den Neon-Sektor')
    pg.reload();pg.wait_for_timeout(300);check(pg.evaluate("()=>W.id")==1,'Beta: Auswahl bleibt nach dem Neuladen')
    # Querformat am Rechner
    pg.set_viewport_size({'width':1280,'height':720});pg.click('#bWorlds');pg.wait_for_timeout(250);pg.screenshot(path='wk4_breit.png')
    o=pg.evaluate("()=>{const s=$('#wsheet').getBoundingClientRect(),m=$('#wmap svg').getBoundingClientRect(),n=[...$$('#wmap .wnode')].every(g=>g.getBoundingClientRect().bottom<=s.top+1);return [m.height>250&&n,s.bottom<=innerHeight+1]}")
    check(o[0] and o[1],'Rechner: Karte und Infokarte passen ins Fenster '+str(o))
    print('\n'.join(errs) or 'no errors');b.close()
