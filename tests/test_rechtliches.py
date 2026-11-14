"""Impressum und Datenschutz: Seiten existieren, sind aus den Einstellungen verlinkt und führen zurück ins Spiel."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__));DOCS=os.path.join(os.path.dirname(HERE),'dist','web')
GAME='file://'+os.path.join(DOCS,'index.html')
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300);pg.click('#bSet');pg.wait_for_timeout(200)
    links=pg.evaluate("()=>[...document.querySelectorAll('#settings .legal a')].map(a=>[a.textContent,a.getAttribute('href'),a.target])")
    check(links==[['Impressum','impressum.html','_blank'],['Datenschutz','datenschutz.html','_blank']],'Links in den Einstellungen: '+str(links))
    check(pg.is_visible('#settings .legal a'),'Links sichtbar')
    pg.screenshot(path='r1_einstellungen.png')
    for f,h1,other in[('impressum.html','Impressum','datenschutz.html'),('datenschutz.html','Datenschutz','impressum.html')]:
        check(os.path.isfile(os.path.join(DOCS,f)),f+' liegt in der gebauten Website')
        pg.goto('file://'+os.path.join(DOCS,f));pg.wait_for_timeout(200)
        check(h1 in pg.inner_text('h1').replace('­',''),f+': Überschrift')
        check('kontakt@neonbastion.de' in pg.inner_text('main'),f+': Kontaktadresse')
        check(pg.get_attribute('a.back','href')=='./',f+': Rückweg ins Spiel')
        check(pg.locator(f'a[href="{other}"]').count()==1,f+': Link auf '+other)
        check(pg.evaluate("()=>document.documentElement.scrollWidth<=window.innerWidth"),f+': kein seitliches Scrollen')
        pg.screenshot(path='r2_'+f.replace('.html','.png'),full_page=True)
    print('\n'.join(errs) or 'no errors');b.close()
