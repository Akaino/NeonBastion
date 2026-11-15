"""Beta unter /beta/: gekennzeichnet, eigener Spielstand, Live-Spielstand lässt sich als Kopie holen, das echte Spiel bleibt unberührt."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__));WEB=os.path.join(os.path.dirname(HERE),'dist','web')
sys.path.insert(0,HERE);from _web import web
LIVE=web(os.path.join(WEB,'index.html'));BETA=web(os.path.join(WEB,'beta','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
live={"v":2,"cur":{"s":4321,"k":7,"p":0,"d":0},"nodes":{"root":1,"f1":4},"best":33,"cycleBest":33,"runs":9,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    failed=[];pg.on('requestfailed',lambda r: failed.append(r.url))
    # Hauptseite: kein Beta-Merkmal
    pg.goto(LIVE);pg.wait_for_timeout(300)
    check(pg.evaluate("()=>!IS_BETA&&Store.key==='neon-bastion-v1'") and 'Beta' not in pg.inner_text('.hubfoot'),'Hauptseite: keine Beta, Spielstand neon-bastion-v1')
    pg.click('#bSet');check(pg.evaluate("()=>$('#bLiveCopy').hidden"),'Hauptseite: kein Knopf „Live-Spielstand übernehmen“');pg.click('#bSetClose')
    # Live-Spielstand anlegen. Die Seite sichert beim Verlassen ihren Stand im Speicher, deshalb dort ebenfalls setzen.
    live=json.loads(pg.evaluate("s=>{localStorage.setItem('neon-bastion-v1',s);save=loadSave();persist();return localStorage.getItem('neon-bastion-v1')}",json.dumps(live)))
    # Beta: gekennzeichnet, eigener Schlüssel, für Suchmaschinen gesperrt, Schrift und Icons von der Hauptseite
    pg.goto(BETA);pg.wait_for_timeout(500)
    check(pg.evaluate("()=>IS_BETA&&Store.key==='neon-bastion-beta'"),'Beta erkannt, Spielstand neon-bastion-beta')
    check('Version' in pg.inner_text('.hubfoot') and 'Beta' in pg.inner_text('.hubfoot'),'Kennzeichnung im Hub: '+pg.inner_text('.hubfoot .ver'))
    check(pg.evaluate("()=>$('meta[name=robots]').content")=='noindex,nofollow','für Suchmaschinen gesperrt')
    check(pg.evaluate("()=>document.fonts.ready.then(()=>document.fonts.check('600 16px \"Chakra Petch\"'))") and not failed,'Schrift und Icons laden von der Hauptseite: '+str(failed))
    check(pg.evaluate("()=>(save.best||0)===0&&save.cur.s===0"),'Beta startet mit eigenem, leerem Spielstand')
    pg.click('#bSet');pg.wait_for_timeout(150)
    check(not pg.evaluate("()=>$('#bLiveCopy').hidden") and 'Beta' in pg.inner_text('#setVer'),'Einstellungen: Knopf sichtbar, Version mit „Beta“')
    links=pg.evaluate("()=>[...$$('#settings .legal a')].map(a=>a.getAttribute('href'))")
    check(links==['../impressum.html','../datenschutz.html'] and all(os.path.isfile(os.path.join(WEB,'beta',l)) for l in links),'Impressum und Datenschutz zeigen auf die Hauptseite: '+str(links))
    pg.screenshot(path='b1_beta.png')
    # Live-Spielstand übernehmen: erst nach zweitem Tippen, danach steht die Kopie in der Beta, das Original bleibt unverändert
    pg.click('#bLiveCopy');pg.wait_for_timeout(100)
    check(pg.evaluate("()=>save.best===0") and 'Nochmal' in pg.inner_text('#bLiveCopy'),'erstes Tippen fragt nach')
    pg.click('#bLiveCopy');pg.wait_for_timeout(700)
    check(pg.evaluate("()=>IS_BETA&&save.best===33&&save.cur.s===4321&&save.nodes.f1===4"),'Kopie des Live-Spielstands ist in der Beta')
    pg.evaluate("()=>{save.cur.s=1;save.best=99;persist()}")
    check(json.loads(pg.evaluate("()=>localStorage.getItem('neon-bastion-v1')"))==live,'Live-Spielstand bleibt unverändert, auch wenn die Beta weiterspielt')
    pg.goto(LIVE);pg.wait_for_timeout(300)
    check(pg.evaluate("()=>save.best===33&&save.cur.s===4321"),'Hauptseite sieht weiter ihren eigenen Spielstand')
    # Ohne Live-Spielstand: Hinweis statt Kopie
    pg.goto(BETA);pg.wait_for_timeout(300);pg.evaluate("()=>localStorage.removeItem('neon-bastion-v1')");pg.reload();pg.wait_for_timeout(300);pg.click('#bSet');pg.click('#bLiveCopy');pg.wait_for_timeout(150)
    check('keinen Live-Spielstand' in pg.inner_text('#toast') and pg.evaluate("()=>save.best===99"),'ohne Live-Spielstand: Hinweis, Beta bleibt wie sie ist')
    # Bottest: eigene Stufe mit eigenem Spielstand und eigener Kennzeichnung
    pg.goto(BETA.replace('/beta/','/bottest/'));pg.wait_for_timeout(400)
    check(pg.evaluate("()=>STAGE==='Bottest'&&Store.key==='neon-bastion-bottest'&&(save.best||0)===0") and 'Bottest' in pg.inner_text('.hubfoot') and not failed,'Bottest: eigene Kennzeichnung und eigener Spielstand')
    print('\n'.join(errs) or 'no errors');b.close()
