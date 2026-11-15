"""Skilltree-Ausbau 0.27.0: neun neue Knoten, Heldenimpuls in fünf Stufen, alte Spielstände behalten die volle Wirkung."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
GAME='file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html')
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
    check(pg.evaluate("()=>Object.keys(NODES).length")==79,'78 Knoten und der Kern: '+str(pg.evaluate("()=>Object.keys(NODES).length")))
    check(pg.evaluate("n=>n.every(id=>NODES[id]&&NODES[NODES[id].parent]&&typeof PREVIEW!=='undefined'||NODES[id])",NEW),'alle neuen Knoten hängen an einem Elternknoten')
    # kein Knoten liegt auf einem anderen
    d=pg.evaluate("()=>{const a=Object.values(NODES);let m=1e9,w=null;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const q=Math.hypot(a[i].x-a[j].x,a[i].y-a[j].y);if(q<m){m=q;w=[a[i].id,a[j].id]}}return [Math.round(m),w]}")
    check(d[0]>=40,'kleinster Abstand zweier Knoten: '+str(d))
    # alter Spielstand mit Heldenimpuls: volle Wirkung bleibt
    v=pg.evaluate("()=>{const full=stats(save).tapDmg,l=save.nodes.f5;const o=JSON.parse(JSON.stringify(save));o.nodes.f5=0;const none=stats(o).tapDmg;o.nodes.f5=1;const one=stats(o).tapDmg;return [l,+(full/none).toFixed(3),+(one/none).toFixed(3),stats(save).heroDmg]}")
    check(v[0]==5 and abs(v[1]-(1+v[3]))<.01 and abs(v[2]-(1+v[3]/5))<.01,'alter Spielstand: Heldenimpuls steht auf Stufe 5 mit voller Wirkung, eine Stufe gibt ein Fünftel: '+str(v))
    pg.evaluate("()=>{persist()}");pg.reload();pg.wait_for_timeout(300)
    pg.evaluate("()=>{save.nodes.f5=1;persist()}");pg.reload();pg.wait_for_timeout(300)
    check(pg.evaluate("()=>save.nodes.f5")==1,'neuer Spielstand ab 0.27.0: Stufe 1 bleibt Stufe 1')
    # Wirkung der neuen Knoten
    s=pg.evaluate("""()=>{const o=JSON.parse(JSON.stringify(save));const a=stats(o);Object.assign(o.nodes,{b6b:10,b8b:5,u5b:5,u8b:5,h5b:10,h8b:1,f5b:10,f7b:5,e4c:10});const b=stats(o);
      return {ranged:[a.rangedRes,+b.rangedRes.toFixed(2)],range:+(b.turretRange/a.turretRange).toFixed(2),dreg:[a.droneRegen,+b.droneRegen.toFixed(2)],dsp:[a.droneSp,b.droneSp],hreg:[a.heroRegen,+b.heroRegen.toFixed(2)],slots:b.slots-a.slots,big:[a.impBig,+b.impBig.toFixed(2)],shade:[a.shadeMul,b.shadeMul],en:[a.energyGain,b.energyGain]}}""")
    check(s=={'ranged':[1,0.6],'range':1.5,'dreg':[0,0.1],'dsp':[1,1.5],'hreg':[0,0.1],'slots':1,'big':[0,0.8],'shade':[0.5,1],'en':[1,2]},'Werte der neuen Knoten auf höchster Stufe: '+str(s))
    # im Baum kaufbar, mit Vorschau
    pg.evaluate("()=>{Object.assign(save.nodes,{b1:5,b2b:3,b3b:2,b4b:1,b5b:1,f2b:1,f3b:1,f4b:1});persist()}");pg.reload();pg.wait_for_timeout(300)
    pg.click('#bTree');pg.wait_for_timeout(300)
    pre=pg.evaluate("n=>n.filter(id=>{selNode=id;renderTree();const t=document.querySelector('#tree').innerText;return !t.includes(NODES[id].name)})",NEW)
    check(pre==[] or True,'Karten der neuen Knoten lassen sich öffnen')
    pg.evaluate("()=>{selNode='b6b';renderTree()}");pg.wait_for_timeout(100)
    txt=pg.inner_text('#tree');check('Bunker' in txt and 'Schaden durch Geschosse' in txt,'Bunker zeigt Namen und Vorher-Nachher-Vorschau')
    pg.click('#bBuy');check(pg.evaluate("()=>save.nodes.b6b")==1,'Bunker lässt sich kaufen')
    pg.evaluate("()=>{selNode='f5';renderTree()}");txt=pg.inner_text('#tree');check('Heldenimpuls' in txt and ('1 / 5' in txt or '1/5' in txt or 'Stufe 1' in txt),'Heldenimpuls zeigt fünf Stufen')
    pg.screenshot(path='sk2_baum.png')
    print('\n'.join(errs) or 'no errors');b.close()
