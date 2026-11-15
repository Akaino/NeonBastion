"""Supernova mit Schauspiel: Sog ins schwarze Loch, Zurücksetzen in der Mitte, Ausstoß des Menüs mit den Quanten-Upgrades."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=web(os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(400)
    pg.evaluate("()=>{save.best=45;save.cycleBest=45;save.cur.s=5000;save.nodes.b1=7;save.fleet.jaeger.l=9;persist();renderHub()}")
    pg.click('#bNova');pg.wait_for_timeout(200)
    pg.click('#bNovaGo');pg.wait_for_timeout(150);pg.click('#bNovaGo')
    pg.wait_for_timeout(900)
    mid=pg.evaluate("()=>({hole:$('#bhole')&&$('#bhole').className,busy:$('#nova').classList.contains('novabusy'),moved:[...$('#nova').querySelectorAll('.head, #novaTop > *, #novaList > *')].filter(e=>e.style.transform).length,nova:save.nova||0})")
    check(mid['hole']=='on' and mid['busy'] and mid['moved']>=3 and mid['nova']==0,'Sog: schwarzes Loch ist da, die Elemente des Menüs wandern hinein, zurückgesetzt ist noch nichts: '+str(mid))
    pg.screenshot(path='sn1_sog.png')
    pg.wait_for_timeout(1300);pg.screenshot(path='sn2_ausstoss.png');pg.wait_for_timeout(1200)
    end=pg.evaluate("()=>({hole:$('#bhole').className,busy:$('#nova').classList.contains('novabusy'),moved:[...$('#nova').querySelectorAll('.head, #novaTop > *, #novaList > *')].filter(e=>e.style.transform||e.style.opacity).length,nova:save.nova,q:save.q,b1:save.nodes.b1||0,s:save.cur.s,lvl:save.fleet.jaeger.l,karten:$$('#novaList > *').length})")
    check(end['nova']==1 and end['q']>0 and end['b1']==0 and end['s']==0 and end['lvl']==1,'in der Mitte wurde zurückgesetzt, Quanten sind gutgeschrieben: '+str(end['q']))
    check(end['hole']=='' and not end['busy'] and end['moved']==0 and end['karten']>=5,'danach steht das Menü mit den Quanten-Upgrades wieder an seinem Platz und ist bedienbar')
    check('Supernova!' in pg.inner_text('#toast'),'Hinweis nennt die gewonnenen Quanten')
    pg.screenshot(path='sn3_fertig.png')
    print('\n'.join(errs) or 'no errors');b.close()
