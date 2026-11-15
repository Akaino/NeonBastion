"""Skilltree: Äste tragen sichtbare Namen, der Hintergrund hat Sektoren und Ringe; gilt für beide Welten."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','beta','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":5000,"k":50,"p":5,"d":0},"nodes":{"root":1,"b1":3,"u1":2,"h1":2,"f1":3,"e1":2,"f2b":1,"b2a":1},"best":30,"cycleBest":30,"runs":5,"volMus":0,"volSfx":0,"w2test":True}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-beta',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    check(pg.evaluate("()=>Object.values(BR).map(b=>b.name)")==['Basis','Flotte','Helden','Impuls','Ertrag'],'Äste heißen Basis, Flotte, Helden, Impuls, Ertrag')
    pg.click('#bTree');pg.wait_for_timeout(300)
    t=pg.evaluate("()=>[...$$('#tw svg text.brname')].map(e=>e.textContent)")
    check(sorted(t)==['BASIS','ERTRAG','FLOTTE','HELDEN','IMPULS'],'jeder Astname steht genau einmal im Baum')
    # Jeder Name läuft parallel zur festgelegten Grenze seines Sektors und liegt knapp innerhalb davon
    g=pg.evaluate("""()=>{const ids=Object.keys(BR),half=180/ids.length;return [...$$('#tw svg text.brname')].map(e=>{
      const m=/translate\\(([-\\d.]+) ([-\\d.]+)\\) rotate\\(([-\\d.]+)\\)/.exec(e.getAttribute('transform')),x=+m[1],y=+m[2],rot=+m[3],id=ids.find(i=>BR[i].name.toUpperCase()===e.textContent),B=BR[id];
      const grenze=B.a+B.ls*half;let par=((rot-grenze)%180+180)%180;par=Math.min(par,180-par);let d=Math.atan2(y,x)*180/Math.PI-B.a;d=((d+540)%360)-180;
      const near=Math.min(...Object.values(NODES).map(n=>Math.hypot(n.x-x,n.y-y)));return {name:B.name,grenze:((grenze%360)+360)%360,par,imSektor:Math.abs(d)<half,amRand:Math.abs(d)/half,abstand:Math.round(near)}})}""")
    soll={'Basis':306,'Flotte':18,'Helden':90,'Impuls':162,'Ertrag':234}
    check(all(abs(x['grenze']-soll[x['name']])<1e-6 for x in g),'Grenzen wie festgelegt: Basis rechts, Flotte unten, Helden unten, Impuls oben, Ertrag oben')
    check(all(x['par']<.2 and x['imSektor'] and x['amRand']>.8 and x['abstand']>=60 for x in g),'Namen laufen parallel zur Grenze, liegen knapp im eigenen Sektor und abseits der Knoten: '+', '.join(f"{x['name']} {x['abstand']} px" for x in g))
    check(pg.evaluate("()=>$$('#tw svg path[fill-opacity]').length")==5 and pg.evaluate("()=>$$('#tw svg circle[stroke-dasharray]').length")>=9,'Hintergrund: fünf farbige Sektoren und Ringe für die Tiefe')
    # Knoten bleiben bedienbar: Antippen wählt aus, Karte nennt den neuen Astnamen
    pg.tap('[data-id="f1"]');pg.wait_for_timeout(200)
    check('Impuls' in pg.inner_text('#sheet h3') and pg.evaluate("()=>selNode")=='f1','Antippen funktioniert, die Karte zeigt den Ast „Impuls“')
    pg.screenshot(path='s1_skilltree.png')
    pg.click('#tzOut');pg.click('#tzOut');pg.click('#tzOut');pg.wait_for_timeout(200);pg.screenshot(path='s2_skilltree_weit.png')
    # Welt 2: vier Äste, eigene Namen
    pg.click('#tree [data-back]');pg.click('#bWorlds');pg.click('[data-world="2"]');pg.wait_for_timeout(400);pg.click('#bTree');pg.wait_for_timeout(300)
    t2=pg.evaluate("()=>[...new Set([...$$('#tw svg text.brname')].map(e=>e.textContent))].sort()")
    check(t2==['KERN','LOGISTIK','UNTERSTÜTZUNG','WAFFEN'] and pg.evaluate("()=>$$('#tw svg path[fill-opacity]').length")==4,'Gitterfestung: vier Sektoren mit eigenen Astnamen')
    pg.screenshot(path='s3_skilltree_w2.png')
    print('\n'.join(errs) or 'no errors');b.close()
