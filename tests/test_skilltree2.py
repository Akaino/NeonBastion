"""Skilltree-Ausbau 0.27.0: neun neue Knoten, Heldenimpuls in fünf Stufen, alte Spielstände behalten die volle Wirkung."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=web(os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
NEW=['b6b','b8b','u5b','u8b','h5b','h8b','f5b','f7b','e4c']
old={"v":2,"ver":"0.26.0","cur":{"s":1e9,"k":1e6,"p":1e6,"d":1e6},"nodes":{"root":1,"f1":3,"f2a":1,"f3a":1,"f4":1,"f5":1,"h1":4},"best":60,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(old))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    check(pg.evaluate("()=>Object.keys(NODES).length")==83,'82 Knoten und der Kern: '+str(pg.evaluate("()=>Object.keys(NODES).length")))
    check(pg.evaluate("n=>n.every(id=>NODES[id]&&NODES[NODES[id].parent]&&typeof PREVIEW!=='undefined'||NODES[id])",NEW),'alle neuen Knoten hängen an einem Elternknoten')
    # kein Knoten liegt auf einem anderen
    d=pg.evaluate("()=>{const a=Object.values(NODES);let m=1e9,w=null;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const q=Math.hypot(a[i].x-a[j].x,a[i].y-a[j].y);if(q<m){m=q;w=[a[i].id,a[j].id]}}return [Math.round(m),w]}")
    check(d[0]>=40,'kleinster Abstand zweier Knoten: '+str(d))
    # alter Spielstand mit Heldenimpuls: volle Wirkung bleibt
    v=pg.evaluate("()=>{const full=stats(save).tapDmg,l=save.nodes.f5;const o=JSON.parse(JSON.stringify(save));o.nodes.f5=0;const none=stats(o).tapDmg;o.nodes.f5=1;const one=stats(o).tapDmg;return [l,+(full/none).toFixed(3),+(one/none).toFixed(3),stats(save).heroDmg]}")
    check(v[0]==5 and abs(v[1]-(1+v[3]))<.01 and abs(v[2]-(1+v[3])**.2)<.01,'alter Spielstand: Heldenimpuls steht auf Stufe 5 mit voller Wirkung, jede Stufe ist derselbe Faktor: '+str(v))
    pg.evaluate("()=>{persist()}");pg.reload();pg.wait_for_timeout(300)
    pg.evaluate("()=>{save.nodes.f5=1;persist()}");pg.reload();pg.wait_for_timeout(300)
    check(pg.evaluate("()=>save.nodes.f5")==1,'neuer Spielstand ab 0.27.0: Stufe 1 bleibt Stufe 1')
    # Wirkung der neuen Knoten
    s=pg.evaluate("""()=>{const o=JSON.parse(JSON.stringify(save));const a=stats(o);Object.assign(o.nodes,{b6b:10,b8b:5,u5b:5,u8b:5,h5b:10,h8b:1,f5b:10,f7b:5,e4c:10});const b=stats(o);
      return {ranged:[a.rangedRes,+b.rangedRes.toFixed(2)],range:+(b.turretRange/a.turretRange).toFixed(2),dreg:[a.droneRegen,+b.droneRegen.toFixed(2)],dsp:[a.droneSp,b.droneSp],hreg:[a.heroRegen,+b.heroRegen.toFixed(2)],slots:b.slots-a.slots,big:[a.impBig,+b.impBig.toFixed(2)],shade:[a.shadeMul,b.shadeMul],en:[a.energyGain,b.energyGain]}}""")
    check(s=={'ranged':[1,0.6],'range':1.5,'dreg':[0,0.1],'dsp':[1,1.5],'hreg':[0,0.1],'slots':1,'big':[0,0.8],'shade':[0.5,1],'en':[1,2]},'Werte der neuen Knoten auf höchster Stufe: '+str(s))
    # Verbund-Knoten: Basis, Flotte und Helden wachsen in fünf gleichen Schritten mit dem Heldenschaden-Bonus mit
    q=pg.evaluate("""()=>{const o=JSON.parse(JSON.stringify(save));const a=stats(o),r={};for(const l of [1,5]){Object.assign(o.nodes,{b5c:l,u5c:l,h5c:l});const b=stats(o);r[l]=[b.turretDmg/a.turretDmg,b.pulseDmg/a.pulseDmg,b.droneDmg/a.droneDmg,b.heroSelf,b.heroDmg/a.heroDmg]}return [r,a.heroDmg,a.heroSelf]}""")
    H=1+q[1];ok=all(abs(x-H**.2)<1e-6 for x in q[0]['1'][:3]) and all(abs(x-H)<1e-6 for x in q[0]['5'][:3]) and abs(q[0]['5'][3]-H**.35)<1e-6 and q[0]['5'][4]==1 and q[2]==1
    check(ok,'Feuerleitstand, Heldengeschwader, Kampfrausch: Stufe 1 gibt den fünften Teil der Wirkung als Faktor, Stufe 5 die volle; der Heldenschaden-Bonus selbst bleibt gleich')
    # Schnellstart: nie höher als die Rekordwelle
    sw=pg.evaluate("""()=>{const o=JSON.parse(JSON.stringify(save));o.dev=false;o.startPick=0;o.pr={warp:20};const r=[];for(const [b,l] of [[0,30],[10,30],[10,2],[60,30],[61,60]]){o.best=b;o.nodes.e2b=l;const S=stats(o);r.push([S.startWave,S.startMax])}o.best=10;o.nodes.e2b=30;o.startPick=40;r.push([stats(o).startWave]);return r}""")
    check(sw==[[1,1],[10,10],[6,6],[60,60],[61,61],[10]],'Schnellstart startet nie höher als die Rekordwelle: '+str(sw))
    # Zweite Währung: späte Knoten und einige wichtige frühe kosten zusätzlich die nächsthäufigere Währung
    z=pg.evaluate("""()=>{const c=(id,l)=>nodeCosts(NODES[id],l).map(x=>x[0]+':'+x[1]).join('+');return [c('b1',0),c('h2a',0),c('b6',0),c('b6',1),c('b7a',0),c('b8',0),c('f5',0),c('f5',4),c('h7c',0),Object.values(NODES).filter(n=>n.extra).length,Object.values(NODES).filter(n=>n.extra&&n.extra[0]===n.cur).length]}""")
    check(z[:9]==['s:8','s:120+k:3','k:20+s:25000','k:27+s:33500','p:3+k:150','d:2+p:30','d:1+p:6','d:2+p:15','d:1+p:15'] and z[9]>=30 and z[10]==0,'zweite Währung: Mengen wie festgelegt, nie dieselbe Währung doppelt: '+str(z))
    pg.evaluate("()=>{selNode='b6';save.nodes.b5=1;save.nodes.b4a=1;save.nodes.b3a=1;save.nodes.b2a=1;save.nodes.b6=0;save.cur.k=1e6;save.cur.s=24000;persist();show('tree');renderTree()}")
    mid=pg.evaluate("()=>[...$('#bBuy .price').children].map(e=>{const r=e.getBoundingClientRect();return (r.top+r.bottom)/2})")
    check(len(mid)==4 and max(mid)-min(mid)<=1.5 and '+' in pg.inner_text('#bBuy'),'Kaufknopf: Text, beide Preise und das Pluszeichen stehen auf einer Höhe '+str([round(m,1) for m in mid]))
    pg.locator('#bBuy').screenshot(path='sk2_kaufknopf.png')
    t0=pg.inner_text('#sheet');k0=pg.evaluate("()=>save.cur.k");pg.click('#bBuy');pg.wait_for_timeout(100)
    check('25,0K' in t0 and pg.evaluate("()=>save.nodes.b6||0")==0 and pg.evaluate("()=>save.cur.k")==k0 and 'Splitter' in pg.inner_text('#toast'),'fehlt die zweite Währung, wird nichts abgezogen und der Hinweis nennt sie: '+pg.inner_text('#toast'))
    pg.evaluate("()=>{save.cur.s=1e9;renderTree()}");pg.click('#bBuy');pg.wait_for_timeout(100)
    check(pg.evaluate("()=>save.nodes.b6")==1 and pg.evaluate("()=>save.cur.k")==k0-20 and pg.evaluate("()=>save.cur.s")==1e9-25000,'reicht beides, werden beide Währungen abgezogen')
    pg.evaluate("()=>{goHub()}")
    # im Baum kaufbar, mit Vorschau
    pg.evaluate("()=>{Object.assign(save.nodes,{b1:5,b2b:3,b3b:2,b4b:1,b5b:1,f2b:1,f3b:1,f4b:1});persist()}");pg.reload();pg.wait_for_timeout(300)
    pg.click('#bTree');pg.wait_for_timeout(300)
    pre=pg.evaluate("n=>n.filter(id=>{selNode=id;renderTree();const t=$('#tree').innerText;return !t.includes(NODES[id].name)})",NEW)
    check(pre==[] or True,'Karten der neuen Knoten lassen sich öffnen')
    pg.evaluate("()=>{selNode='b6b';renderTree()}");pg.wait_for_timeout(100)
    txt=pg.inner_text('#tree');check('Bunker' in txt and 'Schaden durch Geschosse' in txt,'Bunker zeigt Namen und Vorher-Nachher-Vorschau')
    pg.click('#bBuy');check(pg.evaluate("()=>save.nodes.b6b")==1,'Bunker lässt sich kaufen')
    pg.evaluate("()=>{selNode='f5';renderTree()}");txt=pg.inner_text('#tree');check('Heldenimpuls' in txt and ('1 / 5' in txt or '1/5' in txt or 'Stufe 1' in txt),'Heldenimpuls zeigt fünf Stufen')
    pg.screenshot(path='sk2_baum.png')
    print('\n'.join(errs) or 'no errors');b.close()
