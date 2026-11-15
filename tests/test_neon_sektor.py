import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
import json
save={"v":2,"cur":{"s":3000,"k":40,"p":3,"d":1},"nodes":{"root":1,"b1":5,"b2a":2,"u1":2,"f1":3,"h1":2,"e1":1},"heroes":{"klinge":{"u":1,"l":8,"a":0},"schuetzin":{"u":1,"l":3,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},"team":["klinge"],"best":41,"cycleBest":41,"runs":12,"pending":None,"snd":1,"speed":1,"q":3,"pr":{},"nova":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400);pg.screenshot(path='x1_hub.png')
    pg.click('#bTree');pg.wait_for_timeout(300);pg.tap('[data-id="b3a"]');pg.wait_for_timeout(200);pg.screenshot(path='x2_tree.png')
    pg.tap('[data-id="b2a"]');pg.wait_for_timeout(200);pg.screenshot(path='x2b_tree.png',clip={'x':0,'y':600,'width':390,'height':244})
    pg.click('#tree [data-back]');pg.click('#bNova');pg.wait_for_timeout(300);pg.screenshot(path='x3_nova.png')
    pg.click('#bNovaGo');pg.wait_for_timeout(100);pg.click('#bNovaGo');pg.wait_for_timeout(500);pg.screenshot(path='x4_after.png')
    st=pg.evaluate("()=>JSON.stringify({q:save.q,nova:save.nova,cur:save.cur,nodes:save.nodes,cb:save.cycleBest,h:save.heroes.klinge})");print(st)
    pg.click('[data-pr="dmg"]');pg.click('[data-pr="hp"]');print(pg.evaluate("()=>JSON.stringify({q:save.q,pr:save.pr})"))
    pg.click('#nova [data-back]');pg.click('#bStart');pg.wait_for_timeout(300)
    for i in range(3):pg.click('#bSpeed')
    print('speed after 3 clicks',pg.evaluate("()=>speed"))
    pg.click('#bSpeed');pg.click('#bSpeed');pg.wait_for_timeout(3000);print('speed',pg.evaluate("()=>speed"),'wave',pg.evaluate("()=>run.w"), 'basehp',pg.evaluate("()=>Math.round(run.base.max)"))
    pg.click('#bPause');pg.click('#bQuit');pg.wait_for_timeout(2200);pg.click('#bBack');pg.wait_for_timeout(200)
    pg.click('#bSet');pg.wait_for_timeout(200);pg.screenshot(path='x5_settings.png');pg.click('#bReset');pg.click('#bReset');pg.wait_for_timeout(300)
    print(pg.evaluate("()=>JSON.stringify({q:save.q,best:save.best,cur:save.cur,h:save.heroes.klinge.u})"))
    print('\n'.join(errs) or 'no errors');b.close()
