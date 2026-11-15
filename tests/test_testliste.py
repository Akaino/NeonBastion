"""Testliste zum Abhaken: Seite liegt neben der Beta, Haken und Notizen bleiben nach dem Neuladen erhalten."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__));DOCS=os.path.join(os.path.dirname(HERE),'dist','web')
F=os.path.join(DOCS,'beta','testliste.html')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
if not os.path.isfile(os.path.join(os.path.dirname(HERE),'TESTLISTE.md')):
    print('ok   keine TESTLISTE.md, nichts zu prüfen');sys.exit(0)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    check(os.path.isfile(F),'testliste.html liegt neben der Beta')
    pg.goto('file://'+F);pg.wait_for_timeout(200)
    n=pg.locator('.checks li').count()
    check(n>5,f'{n} Prüfpunkte')
    check(pg.inner_text('#total')==f'0 von {n} geprüft','Zähler am Anfang: '+pg.inner_text('#total'))
    check(pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth"),'kein seitliches Scrollen')
    pg.locator('.checks li .box').nth(0).tap();pg.locator('.checks li .box').nth(2).tap()
    pg.locator('.checks li .nb').nth(1).tap();pg.locator('.checks li textarea').nth(1).fill('zu klein')
    check(pg.inner_text('#total')==f'2 von {n} geprüft','Zähler nach zwei Haken: '+pg.inner_text('#total'))
    pg.screenshot(path='tl1_testliste.png',full_page=True)
    pg.reload();pg.wait_for_timeout(200)
    check(pg.inner_text('#total')==f'2 von {n} geprüft','Haken bleiben nach dem Neuladen')
    check(pg.locator('.checks li textarea').nth(1).input_value()=='zu klein' and pg.locator('.checks li textarea').nth(1).is_visible(),'Notiz bleibt und ist sichtbar')
    rep=pg.evaluate("()=>report()")
    check(rep.count('[x] ')==2 and rep.count('[ ] ')==n-2 and 'Notiz: zu klein' in rep,'Zusammenfassung enthält Haken und Notiz')
    check(pg.get_attribute('header a','href')=='./','Rückweg zur Beta')
    pg.tap('#reset');pg.tap('#reset');pg.wait_for_timeout(300)
    check(pg.inner_text('#total')==f'0 von {n} geprüft','Zurücksetzen nach zweimal Tippen')
    print('\n'.join(errs) or 'no errors');b.close()
