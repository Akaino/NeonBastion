"""Die Seite bleibt klein: Der Skripttext steht nach dem Start nicht mehr im Dokument, verlassene Menüs werden geleert und beim Öffnen neu aufgebaut."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=web(os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
N="()=>$$('*').length"
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300)
    check(pg.evaluate("()=>[...document.scripts].reduce((s,x)=>s+x.textContent.length,0)")<2000 and pg.evaluate("()=>typeof Run==='function'&&typeof save==='object'"),'Skripttext ist aus dem Dokument entfernt, das Spiel läuft')
    check(pg.evaluate("()=>document.documentElement.outerHTML.length")<120000,'Dokument unter 120 KB: %d'%pg.evaluate("()=>document.documentElement.outerHTML.length"))
    pg.evaluate("()=>{save.best=120;save.cur.s=1e9;for(const k of Object.keys(NODES))save.nodes[k]=1;save.kills={swarm:5,brute:3};persist();renderHub()}")
    n0=pg.evaluate(N);check(n0<500,'Hub: %d Elemente'%n0)
    for btn,sec,probe in (('#bTree','#tree','#tw'),('#bHeroes','#heroes','#hlist'),('#bFleet','#fleet','#flist'),('#bTowers','#towers','#tlist'),('#bCodex','#codex','#clist'),('#bAchv','#achv','#alist')):
        pg.click(btn);pg.wait_for_timeout(150);inn=pg.evaluate("q=>$(q).children.length",probe);n1=pg.evaluate(N)
        pg.click(sec+' [data-back]');pg.wait_for_timeout(150);n2=pg.evaluate(N);leer=pg.evaluate("q=>$(q).children.length",probe)
        check(inn>0 and n1>n0 and leer==0 and n2<=n0+5,'%s: geöffnet %d Elemente, nach dem Verlassen wieder %d'%(sec,n1,n2))
    pg.click('#bTree');pg.wait_for_timeout(200);pg.click('#bHeroes') if False else None
    check(pg.evaluate("()=>$$('#tw *').length")>100,'Skilltree ist beim erneuten Öffnen wieder vollständig da')
    pg.click('#tree [data-back]');pg.click('#bStart');pg.wait_for_timeout(1500)
    check(pg.evaluate("()=>run&&run.w>=1")and pg.evaluate(N)<500,'im Run: %d Elemente'%pg.evaluate(N))
    print('\n'.join(errs) or 'no errors');b.close()
