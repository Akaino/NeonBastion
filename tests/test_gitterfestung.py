import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','beta','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
import json
save={"v":2,"cur":{"s":500,"k":5,"p":0,"d":0},"nodes":{"root":1},"heroes":{"klinge":{"u":1,"l":3,"a":0},"schuetzin":{"u":0,"l":1,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},"team":["klinge"],"best":30,"cycleBest":30,"runs":5,"volMus":0,"volSfx":0,"dev":True}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-beta',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(400)
    print('worlds btn hidden',pg.evaluate("()=>$('#bWorlds').hidden"))
    pg.click('#bSet');pg.click('#bW2Test');pg.click('#bSetClose');print('worlds btn visible',not pg.evaluate("()=>$('#bWorlds').hidden"))
    pg.click('#bWorlds');pg.wait_for_timeout(300);pg.screenshot(path='w2a.png')
    pg.click('[data-world="2"]');pg.wait_for_timeout(500);pg.screenshot(path='w2b.png');print('world',pg.evaluate("()=>W.id"),'heroes hidden',pg.evaluate("()=>$('#bHeroes').hidden"))
    pg.click('#bTowers');pg.wait_for_timeout(300);pg.screenshot(path='w2c.png');pg.click('#towers [data-back]')
    pg.click('#bTree');pg.wait_for_timeout(300);pg.screenshot(path='w2d.png');pg.click('#tree [data-back]')
    pg.click('#bStart');pg.wait_for_timeout(800);print('run world',pg.evaluate("()=>run.world"),'phase',pg.evaluate("()=>run.phase"),'energy',pg.evaluate("()=>run.energy"),'dirs',pg.evaluate("()=>run.dirs"))
    pg.screenshot(path='w2e.png')
    # build a laser towards direction
    pg.click('#bBuild');pg.click('[data-bt="laser"]')
    pos=pg.evaluate("()=>{const a=run.dirs[0],r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+Math.cos(a)*120*R.se,r.top+R.h/2+Math.sin(a)*120*R.se]}")
    pg.mouse.click(pos[0],pos[1]);pg.wait_for_timeout(200)
    pg.click('#bBuild');pg.click('[data-bt="frost"]');pos2=pg.evaluate("()=>{const a=run.dirs[0]+.4,r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+Math.cos(a)*150*R.se,r.top+R.h/2+Math.sin(a)*150*R.se]}")
    pg.mouse.click(pos2[0],pos2[1]);pg.wait_for_timeout(200)
    print('towers',pg.evaluate("()=>run.towers.map(t=>t.type+' r'+t.r)"),'energy',pg.evaluate("()=>run.energy"))
    # move frost (uses a move point)
    tp=pg.evaluate("()=>{const T=run.towers[1],r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+T.x*R.se,r.top+R.h/2+T.y*R.se]}")
    pg.mouse.click(tp[0],tp[1]);pg.wait_for_timeout(150);pg.click('#tpMove');pos3=pg.evaluate("()=>{const a=run.dirs[0]-.4,r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+Math.cos(a)*130*R.se,r.top+R.h/2+Math.sin(a)*130*R.se]}")
    pg.mouse.click(pos3[0],pos3[1]);pg.wait_for_timeout(200);print('moves left',pg.evaluate("()=>run.moves"));pg.click('#tpClose')
    pg.screenshot(path='w2f.png')
    pg.click('#bReady');pg.wait_for_timeout(200);print('phase after ready',pg.evaluate("()=>run.phase"))
    pg.wait_for_timeout(3000);pg.screenshot(path='w2g.png')  # kurz genug, dass Welle 1 auch aus der nahen Richtung noch läuft
    print('still fighting',pg.evaluate("()=>run.phase"))
    # try moving during fight
    tp=pg.evaluate("()=>{const T=run.towers[0],r=$('#cv').getBoundingClientRect();return [r.left+R.w/2+T.x*R.se,r.top+R.h/2+T.y*R.se]}")
    pg.mouse.click(tp[0],tp[1]);pg.wait_for_timeout(150);pg.click('#tpMove');pg.wait_for_timeout(100);print('move during fight blocked',pg.evaluate("()=>moveT===null"));pg.click('#tpClose')
    for i in range(60):
        pg.wait_for_timeout(500)
        if pg.evaluate("()=>run.phase==='build'&&run.w>=2"):break
    print('after wave: w',pg.evaluate("()=>run.w"),'phase',pg.evaluate("()=>run.phase"),'gain',pg.evaluate("()=>JSON.stringify(run.gain)"),'moves reset',pg.evaluate("()=>run.moves"))
    pg.click('#bPause');pg.click('#bQuit');pg.wait_for_timeout(2300);pg.screenshot(path='w2h.png');pg.click('#bBack')
    print('w2 cur',pg.evaluate("()=>JSON.stringify(save.w2.cur)"),'w2 best',pg.evaluate("()=>save.w2.best"),'w1 cur s',pg.evaluate("()=>save.cur.s"))
    print('\n'.join(errs) or 'no errors');b.close()
