import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','beta','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
import json,sys
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1},"heroes":{"klinge":{"u":1,"l":3,"a":0},"schuetzin":{"u":0,"l":1,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},"team":["klinge"],"best":30,"cycleBest":30,"runs":5,"volMus":0,"volSfx":0,"w2test":True,"world":int(sys.argv[1]) if len(sys.argv)>1 else 1}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-beta',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400);pg.click('#bStart');pg.wait_for_timeout(800)
    ok=0;N=12
    for i in range(N):
        box=pg.locator('#bBuild').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
        pg.mouse.move(x,y);pg.mouse.down();pg.wait_for_timeout(180);pg.mouse.up();pg.wait_for_timeout(120)
        if pg.evaluate("()=>trayOpen"):ok+=1;pg.evaluate("()=>endBuild()")
        pg.wait_for_timeout(150)
    print('Bauen: opened',ok,'of',N)
    if pg.evaluate("()=>run.world")==2:
        pg.evaluate("()=>{run.buildT=60}");pg.wait_for_timeout(300)
        box=pg.locator('#bReady').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
        pg.mouse.move(x,y);pg.mouse.down();pg.wait_for_timeout(250);pg.mouse.up();pg.wait_for_timeout(150);print('Bereit worked',pg.evaluate("()=>run.phase==='fight'"))
    print('\n'.join(errs) or 'no errors');b.close()
