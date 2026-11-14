import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'docs','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
import json
save={"v":2,"cur":{"s":5000,"k":30,"p":4,"d":0},"nodes":{"root":1},"heroes":{"klinge":{"u":0,"l":1,"a":0},"schuetzin":{"u":0,"l":1,"a":0},"arkanist":{"u":0,"l":1,"a":0},"waechterin":{"u":0,"l":1,"a":0}},
 "team":[],"best":5,"cycleBest":5,"runs":5,"volMus":0,"volSfx":0,"speed":1,"towers":{"frost":{"u":1,"l":3},"weak":{"u":1,"l":3},"cryo":{"u":1,"l":3}},"tslots":4,"q":0,"pr":{},"nova":0}
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")")
    pg.goto(GAME);pg.wait_for_timeout(300);pg.click('#bStart');pg.wait_for_timeout(300)
    res=pg.evaluate("""()=>{const out={};
      for(const [a,b] of [['frost','frost'],['frost','weak'],['weak','weak'],['frost','cryo'],['weak','cryo'],['cryo','cryo']]){
        run.towers=[];run.en=[];run.energy=9999;run.queue=[];run.waveGap=999;run.place(a,-30,-150);run.place(b,30,-150);
        run.spawnEnemy('brute',false,0,-150);const e=run.en[0];e.sp=0;const hp0=e.hp,x0=e.y;
        for(let i=0;i<180;i++){run.updTowers(1/60);if(run.en[0]!==e)break}
        let hitMul=0;if(e.hp>0){const h1=e.hp;run.hitE(e,100,{num:false});hitMul=Math.round(h1-e.hp)}
        out[a+'+'+b]={combo:e.combo,spMul:+e.spMul.toFixed(2),vuln:+e.vuln.toFixed(2),critB:e.critB,frozen:+(e.frozen||0).toFixed(2),hpLostPct:+((hp0-Math.max(0,e.hp+hitMul))/hp0*100).toFixed(1),movedOut:Math.round(Math.abs(e.y)-Math.abs(x0)),dmgOf100:hitMul}}
      return out}""")
    for k,v in res.items():print(k.ljust(12),v)
    pg.evaluate("()=>{run.towers=[];run.en=[];run.energy=9999;run.place('frost',-40,-130);run.place('weak',40,-130);run.place('cryo',0,-60);for(let i=0;i<12;i++)run.spawnEnemy('swarm',false,-20+i*4,-120+(i%3)*10);run.waveGap=999}")
    pg.wait_for_timeout(1500);pg.screenshot(path='cb1.png')
    pos=pg.evaluate("()=>{const T=run.towers[0],r=document.querySelector('#cv').getBoundingClientRect();return [r.left+R.w/2+T.x*R.se,r.top+R.h/2+T.y*R.se]}")
    pg.mouse.click(pos[0],pos[1]);pg.wait_for_timeout(200);pg.screenshot(path='cb2.png')
    pg.click('#tpClose');pg.click('#bPause');pg.click('#bQuit');pg.wait_for_timeout(2200);pg.click('#bBack');pg.click('#bTowers');pg.wait_for_timeout(300)
    pg.evaluate("()=>document.querySelector('#tlist').lastElementChild.scrollIntoView()");pg.wait_for_timeout(200);pg.screenshot(path='cb3.png')
    print('\n'.join(errs) or 'no errors');b.close()
