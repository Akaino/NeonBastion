import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
import json
save={"v":2,"cur":{"s":5000,"k":30,"p":4,"d":0},"nodes":{"root":1,"b1":5,"u1":2,"f1":3},"heroes":{"klinge":{"u":1,"l":8,"a":0},"schuetzin":{"u":0,"l":1,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},
 "team":["klinge"],"best":12,"cycleBest":12,"runs":5,"pending":None,"volMus":0,"volSfx":0,"speed":8,"towers":{"frost":{"u":1,"l":2,"a":0},"weak":{"u":1,"l":1},"cryo":{"u":0,"l":1}},"tslots":0,"q":0,"pr":{},"nova":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400)
    pg.click('#bStart');pg.wait_for_timeout(1500);print('speed',pg.evaluate("()=>speed"))
    pg.evaluate("()=>{run.energy=300}")
    pg.click('#bBuild');pg.wait_for_timeout(200)
    t0=pg.evaluate("()=>run.t");pg.wait_for_timeout(600);print('paused in tray:',pg.evaluate("()=>run.t")==t0,'badge',pg.is_visible('#buildPause'))
    pg.screenshot(path='tt1.png')
    pg.click('[data-bt="frost"]');pg.wait_for_timeout(150);print('buildSel',pg.evaluate("()=>buildSel"))
    pg.mouse.click(195,300);pg.wait_for_timeout(200)
    print('towers',pg.evaluate("()=>run.towers.map(t=>t.type+' L'+t.l+' @'+Math.round(t.x)+','+Math.round(t.y))"),'energy',pg.evaluate("()=>run.energy"),'paused now',pg.evaluate("()=>buildPaused()"))
    pg.wait_for_timeout(500)
    # tap tower -> panel
    pos=pg.evaluate("()=>{const T=run.towers[0],r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+T.x*R.se,r.top+R.h/2+T.y*R.se]}")
    pg.mouse.click(pos[0],pos[1]);pg.wait_for_timeout(200);print('panel open',pg.is_visible('#tpanel'));pg.screenshot(path='tt2.png')
    pg.click('#tpUp');pg.wait_for_timeout(150);print('after upgrade',pg.evaluate("()=>[run.towers[0].l,run.energy,run.towers[0].spent]"))
    pg.click('#tpMove');pg.wait_for_timeout(100);pg.mouse.click(120,600);pg.wait_for_timeout(200)
    print('moved',pg.evaluate("()=>[Math.round(run.towers[0].x),Math.round(run.towers[0].y)]"),'panel reopened',pg.is_visible('#tpanel'))
    pg.click('#tpSell');pg.wait_for_timeout(150);print('after sell',pg.evaluate("()=>[run.towers.length,run.energy]"),'paused',pg.evaluate("()=>buildPaused()"))
    t0=pg.evaluate("()=>run.t");pg.wait_for_timeout(500);print('running again',pg.evaluate("()=>run.t")>t0)
    print('\n'.join(errs) or 'no errors');b.close()
