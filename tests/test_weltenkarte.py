# Weltenkarte (seit 0.33.0, Startseite seit 0.34.0): Kern in der Mitte, fünf Welten darum, dahinter je ein verdeckter Platz für eine zweite Version.
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
size=lambda pg:pg.evaluate("()=>{const r=$('#wmap svg').getBoundingClientRect();return [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)]}")
def karte(pg,name,beta):
    check(pg.evaluate("()=>!$('#worlds').hidden&&$('#hub').hidden"),name+': Das Spiel startet auf der Weltenkarte')
    check(pg.evaluate("()=>$$('#wmap .wnode:not(.ver)').length")==5 and pg.evaluate("()=>$$('#wmap .wnode.ver').length")==5 and pg.evaluate("()=>$$('#wmap .wcore').length")==1,name+': Kern, fünf Welten, fünf verdeckte zweite Versionen')
    check('open' in cls(pg,'1') and 'act' in cls(pg,'1'),name+': Neon-Sektor offen und aktiv')
    check(('open' if beta else 'soon') in cls(pg,'2'),name+': Gitterfestung '+('offen' if beta else '„Demnächst“'))
    check('soon' in cls(pg,'3') and 'soon' in cls(pg,'4'),name+': Arcade und Classic Tower Defense „Demnächst“')
    check(('open' if beta else 'hidden') in cls(pg,'5') and 'soon' not in cls(pg,'5'),name+(': fünfte Welt als Prototyp offen' if beta else ': fünfte Welt verdeckt, nicht „Demnächst“'))
    # Namen stehen im Knoten, keine Nummern
    nm=pg.evaluate("()=>[...$$('#wmap .wnode:not(.ver)')].map(g=>[...g.querySelectorAll('text.name')].map(t=>t.textContent).join(' '))")
    check(nm==['Neon-Sektor','Gitterfestung','Arcade','Classic Tower Defense','Expedition' if beta else ''],name+': Namen stehen im Knoten'+('' if beta else ', die fünfte Welt hat keinen')+' '+str(nm))
    innen=pg.evaluate("()=>[...$$('#wmap .wnode:not(.ver)')].every(g=>{const r=g.querySelector('.rim').getBoundingClientRect();return [...g.querySelectorAll('text.name')].every(t=>{const b=t.getBoundingClientRect();return b.left>=r.left&&b.right<=r.right&&b.top>=r.top&&b.bottom<=r.bottom})})")
    check(innen and not pg.evaluate("()=>/[1-5]/.test($('#wmap').textContent)"),name+': Namen liegen innerhalb ihres Knotens, keine Ziffern auf der Karte')
    # jeder Knoten sieht anders aus: eigener Umriss und eigenes Motiv
    form=pg.evaluate("()=>[...$$('#wmap .wnode:not(.ver)')].map(g=>g.querySelector('.rim').innerHTML+'|'+g.querySelector('.art').innerHTML.length)")
    check(len(set(form))==5 and pg.evaluate("()=>[...$$('#wmap .wnode:not(.ver) .art')].every(a=>a.children.length>0)"),name+': fünf verschiedene Knoten mit eigenem Motiv')
    check(pg.evaluate("()=>$$('#wmap .wstar').length>100&&$$('#wmap .wpulse').length")==(3 if beta else 1),name+': Sternenhintergrund und ein Energiepuls je offener Welt')
    check('Rekord' in pg.inner_text('#wsheet') and 'Weiterspielen' in pg.inner_text('#bEnter'),name+': Infokarte zeigt die aktive Welt mit Rekord und „Weiterspielen“')
    # Antippen ändert die Größe der Karte nicht und baut sie nicht neu auf
    s0=size(pg);pg.evaluate("()=>{$('#wmap svg').dataset.alt='1'}");gleich=True
    for w,wort in (('3','Raumschiffe'),('4','Türme')):
        pg.click('#wmap [data-w="'+w+'"] .hit');pg.wait_for_timeout(80)
        s=pg.inner_text('#wsheet');gleich=gleich and size(pg)==s0
        check('Demnächst' in s and wort in s and pg.locator('#bEnter').count()==0 and 'sel' in cls(pg,w),name+': Welt '+w+' zeigt Beschreibung und „Demnächst“, lässt sich nicht betreten')
    pg.click('#wmap [data-w="5"] .hit');pg.wait_for_timeout(80);gleich=gleich and size(pg)==s0
    s=pg.inner_text('#wsheet');check(('Prototyp' in s and pg.locator('#bEnter').count()==1) if beta else ('nichts bekannt' in s and 'Demnächst' not in s and pg.locator('#bEnter').count()==0),name+(': fünfte Welt lässt sich als Prototyp betreten' if beta else ': fünfte Welt verrät nichts'))
    pg.click('#wmap [data-w="v1"] .hit');pg.wait_for_timeout(80);gleich=gleich and size(pg)==s0
    s=pg.inner_text('#wsheet');check('Zweite Version' in s and 'Neon-Sektor' in s and pg.locator('#bEnter').count()==0,name+': zweite Version des Neon-Sektors ist verdeckt')
    pg.click('#wmap [data-w="v5"] .hit');pg.wait_for_timeout(80);gleich=gleich and size(pg)==s0
    check('Zweite Version' in pg.inner_text('#wsheet') and 'Verborgene Welt' not in pg.inner_text('#wsheet'),name+': zweite Version der fünften Welt nennt keinen Namen')
    pg.click('#wmap [data-w="1"] .hit');pg.wait_for_timeout(80);gleich=gleich and size(pg)==s0
    pg.click('#wmap [data-w="2"] .hit');pg.wait_for_timeout(80);gleich=gleich and size(pg)==s0
    check(gleich and pg.evaluate("()=>$('#wmap svg').dataset.alt==='1'&&$$('#wmap .wnode.sel').length===1"),name+': Antippen lässt Größe und Lage der Karte unverändert, genau ein Knoten ist markiert '+str(s0))
    # passt auf den Bildschirm: kein Knoten ragt über den Rand, kein Schild überdeckt einen fremden Knoten
    box=pg.evaluate("()=>{const r=$('#wmap svg').getBoundingClientRect();const o=[...$$('#wmap .wnode .rim, #wmap .wnode .vrim, #wmap .wnode .tag')].filter(t=>{const b=t.getBoundingClientRect();return b.left<0||b.right>innerWidth||b.top<$('#wmap').getBoundingClientRect().top||b.bottom>$('#wsheet').getBoundingClientRect().top}).length;return [r.width,r.height,o]}")
    check(box[0]>=300 and box[1]>=300 and box[2]==0,name+': Karte passt aufs Handy '+str(box))
    ov=pg.evaluate("()=>{let n=0;for(const t of $$('#wmap .wnode .tag rect')){const a=t.getBoundingClientRect(),own=t.closest('.wnode');for(const c of $$('#wmap .wnode .rim, #wmap .wnode .vrim')){if(c.closest('.wnode')===own)continue;const b=c.getBoundingClientRect();if(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1)n++}}return n}")
    check(ov==0,name+': kein Schild überdeckt einen anderen Knoten ('+str(ov)+')')
with sync_playwright() as p:
    b=p.chromium.launch()
    # ----- echtes Spiel -----
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'index.html'),karte=True));pg.wait_for_timeout(400)
    karte(pg,'echtes Spiel',False)
    check('Demnächst' in pg.inner_text('#wsheet') and pg.locator('#bEnter').count()==0,'echtes Spiel: Gitterfestung lässt sich nicht betreten')
    pg.screenshot(path='wk1_prod.png')
    # ein alter Spielstand, der in der Gitterfestung stand, landet im Neon-Sektor und behält seine Daten
    pg.evaluate("()=>{save.world=2;save.w2.best=12;save.best=120;persist()}");pg.reload();pg.wait_for_timeout(400)
    check(pg.evaluate("()=>W.id")==1 and pg.evaluate("()=>save.w2.best")==12,'echtes Spiel: Spielstand aus der Gitterfestung startet im Neon-Sektor, Welt-2-Fortschritt bleibt erhalten')
    check(pg.evaluate("()=>!$('#worlds').hidden") and 'Welle 120' in pg.inner_text('#wsheet'),'echtes Spiel: nach dem Neuladen wieder die Weltenkarte, mit Rekord')
    pg.click('#bEnter');pg.wait_for_timeout(200)
    check(pg.evaluate("()=>!$('#hub').hidden&&$('#worlds').hidden&&W.id===1"),'echtes Spiel: „Weiterspielen“ führt ins Menü des Neon-Sektors')
    pg.click('#bWorlds');pg.wait_for_timeout(200)
    check(pg.evaluate("()=>!$('#worlds').hidden&&$$('#wmap .wnode').length===10"),'echtes Spiel: Knopf „Welten“ führt zurück zur Karte')
    pg.close()
    # ----- Beta -----
    pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(web(os.path.join(ROOT,'beta','index.html'),karte=True));pg.wait_for_timeout(400)
    karte(pg,'Beta',True)
    pg.screenshot(path='wk2_beta.png')
    check('Welt betreten' in pg.inner_text('#bEnter'),'Beta: Gitterfestung hat einen Betreten-Knopf')
    pg.click('#bEnter');pg.wait_for_timeout(400)
    check(pg.evaluate("()=>W.id")==2 and pg.evaluate("()=>!$('#hub').hidden"),'Beta: Betreten wechselt in die Gitterfestung und öffnet ihr Menü')
    pg.click('#bWorlds');pg.wait_for_timeout(200)
    check('act' in cls(pg,'2') and 'sel' in cls(pg,'2') and 'Weiterspielen' in pg.inner_text('#wsheet'),'Beta: Karte öffnet auf der aktiven Welt')
    pg.wait_for_timeout(2600);pg.screenshot(path='wk3_beta_w2.png')
    pg.click('#wmap [data-w="1"] .hit');pg.click('#bEnter');pg.wait_for_timeout(300)
    check(pg.evaluate("()=>W.id")==1,'Beta: zurück in den Neon-Sektor')
    pg.reload();pg.wait_for_timeout(300);check(pg.evaluate("()=>W.id")==1 and pg.evaluate("()=>!$('#worlds').hidden"),'Beta: Auswahl bleibt nach dem Neuladen, Start wieder auf der Karte')
    # Querformat am Rechner
    pg.set_viewport_size({'width':1280,'height':720});pg.wait_for_timeout(250);pg.screenshot(path='wk4_breit.png')
    o=pg.evaluate("()=>{const s=$('#wsheet').getBoundingClientRect(),m=$('#wmap').getBoundingClientRect(),n=[...$$('#wmap .wnode .rim, #wmap .wnode .vrim')].every(g=>{const b=g.getBoundingClientRect();return b.bottom<=s.top+1&&b.top>=m.top-1});return [m.height,n,s.bottom<=innerHeight+1]}")
    check(o[0]>250 and o[1] and o[2],'Rechner: Karte und Infokarte passen ins Fenster '+str(o))
    s0=size(pg);pg.click('#wmap [data-w="4"] .hit');pg.wait_for_timeout(80);s1=size(pg);pg.click('#wmap [data-w="1"] .hit');pg.wait_for_timeout(80)
    check(s0==s1==size(pg),'Rechner: Antippen lässt die Größe der Karte unverändert')
    # Adresse mit #hub überspringt die Karte
    pg.goto(web(os.path.join(ROOT,'beta','index.html')));pg.reload();pg.wait_for_timeout(300)
    check(pg.evaluate("()=>!$('#hub').hidden&&$('#worlds').hidden"),'Adresse mit „#hub“ öffnet direkt das Menü der aktiven Welt')
    print('\n'.join(errs) or 'no errors');b.close()
