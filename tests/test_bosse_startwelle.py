import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
import json
save={"v":2,"cur":{"s":90000,"k":30,"p":4,"d":0},"nodes":{"root":1,"e1":3,"e2b":6,"b1":10,"f1":10,"f2c":4,"h1":10,"u1":3},"heroes":{"klinge":{"u":1,"l":20,"a":0},"schuetzin":{"u":1,"l":10,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},"team":["klinge"],"best":20,"cycleBest":20,"runs":5,"volMus":0,"volSfx":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400);pg.screenshot(path='bh1.png')
    print('start max',pg.evaluate("()=>stats(save).startMax"),'pick',pg.evaluate("()=>stats(save).startWave"))
    pg.click('#hubStart [data-sw="-1"]');pg.click('#hubStart [data-sw="-1"]');print('after 2x minus',pg.evaluate("()=>[stats(save).startWave,save.startPick]"))
    pg.click('#bTree');pg.wait_for_timeout(300);pg.evaluate("()=>{selNode='e2b';renderTree()}");pg.wait_for_timeout(100)
    pg.click('#sheet [data-sw="1"]');print('after plus in tree',pg.evaluate("()=>stats(save).startWave"));pg.screenshot(path='bh2.png',clip={'x':0,'y':520,'width':390,'height':324})
    pg.click('#bBuy');print('bought lvl',pg.evaluate("()=>[save.nodes.e2b,stats(save).startMax,stats(save).startWave]"))
    pg.click('#tree [data-back]');pg.click('#bStart');pg.wait_for_timeout(400);print('run starts at wave',pg.evaluate("()=>run.w+1"))
    pg.evaluate("()=>{run.queue=[];run.w=19;run.waveGap=.05;run.base.max=run.base.hp=1e9}")
    for i in range(40):
        pg.wait_for_timeout(250)
        if pg.evaluate("()=>run.en.some(e=>e.boss)"):break
    pg.wait_for_timeout(300)
    pg.screenshot(path='bh3.png')
    pg.evaluate("()=>{const b=run.en.find(e=>e.boss);if(b){b.x=0;b.y=-230}}");pg.wait_for_timeout(300);pg.screenshot(path='bh4.png')
    print('boss present',pg.evaluate("()=>run.en.some(e=>e.boss)"),'bar visible',pg.is_visible('#bossBar'))
    print('\n'.join(errs) or 'no errors');b.close()
