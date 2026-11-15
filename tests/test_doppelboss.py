"""Doppelboss: alle 25 Wellen kommen zwei Bosse von gegenüberliegenden Seiten, der Bossbalken zählt beide zusammen,
Sternenstaub gibt es nur einmal pro Welle. Normale Bosswellen (alle 10) bleiben bei einem Boss."""
import os,sys,json
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
save={"v":2,"cur":{"s":0,"k":0,"p":0,"d":0},"nodes":{"root":1,"b1":400,"e2b":60},"best":120,"cycleBest":0,"runs":5,"volMus":0,"volSfx":0}
# Run starten und im Zeitraffer vorspulen, bis in der gewünschten Welle alle Gegner erschienen sind
SPUL="""w=>{save.startPick=w;persist();$('#bBack').click();$('#bStart').click();paused=true;run.noImpulse=true;
  const seen=[];for(let i=0;i<60*200&&!run.over;i++){run.step(1/60);for(const e of run.en)if(e.boss&&!seen.includes(e))seen.push(e);if(run.w===w&&!run.queue.length&&seen.length)break}
  updHud();return {w:run.w,twin:!!run.twin,n:seen.length,namen:seen.map(e=>e.name),max:seen.map(e=>Math.round(e.max)),
    gegenueber:seen.length===2?Math.hypot(seen[0].sx+seen[1].sx,seen[0].sy+seen[1].sy)<80:null,
    balken:$('#bossBar b').textContent,breite:parseFloat($('#bossBar i').style.width)}}"""
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.add_init_script("if(!sessionStorage.x){sessionStorage.x=1;localStorage.setItem('neon-bastion-v1',"+json.dumps(json.dumps(save))+")}")
    pg.goto(GAME);pg.wait_for_timeout(300)
    # Spawnpunkt jedes Gegners merken, um die Seiten zu vergleichen
    pg.evaluate("()=>{const f=Run.prototype.spawnEnemy;Run.prototype.spawnEnemy=function(t,el,x,y){f.call(this,t,el,x,y);const e=this.en[this.en.length-1];e.sx=x;e.sy=y}}")
    r10=pg.evaluate(SPUL,10)
    check(r10['n']==1 and not r10['twin'] and r10['balken'].startswith('Boss · '),'Welle 10: ein Boss, Balken „'+r10['balken']+'“')
    r20=pg.evaluate(SPUL,20);r25=pg.evaluate(SPUL,25)
    check(r25['n']==2 and r25['twin'],'Welle 25: zwei Bosse')
    check(r25['gegenueber'],'die beiden kommen von gegenüberliegenden Seiten')
    check(r25['namen'][0]!=r25['namen'][1] and r25['balken']=='Doppelboss · '+' & '.join(r25['namen']),'verschiedene Namen, Balken „'+r25['balken']+'“')
    check(r25['max'][0]==r25['max'][1] and abs(r25['max'][0]/ (r20['max'][0]*1.15**5*(1+25*.03)/(1+20*.03)) -.75)<.01,'jeder der beiden hat 75 % des normalen Bosslebens')
    pg.screenshot(path='db1_doppelboss.png')
    # einen der beiden besiegen: Balken fällt auf die Hälfte, Sternenstaub nur einmal
    h=pg.evaluate("()=>{const bs=run.en.filter(e=>e.boss);for(const b of bs){b.armorT=0;b.hp=b.max}run.twinMax=0;updHud();const d0=run.gain.d,p0=run.gain.p;run.hitE(bs[0],bs[0].hp*2);updHud();const d1=run.gain.d;run.en=run.en.filter(e=>e.hp>0);updHud();const br=parseFloat($('#bossBar i').style.width),lab=$('#bossBar b').textContent;run.hitE(bs[1],bs[1].hp*2);return {staub1:d1-d0,staub2:run.gain.d-d1,prismen:run.gain.p-p0,breite:br,lab,kills:run.bossKills}}")
    check(48<=h['breite']<=52 and h['lab'].startswith('Doppelboss · ') and ' & ' not in h['lab'],f"nach dem ersten Sieg zeigt der Balken die Hälfte: {h['breite']} %, „{h['lab']}“")
    check(h['staub1']>0 and h['staub2']==0,f"Sternenstaub nur einmal pro Welle: {h['staub1']} + {h['staub2']}")
    check(h['prismen']>=2 and h['kills']>=2,'beide Bosse geben Prismen')
    r50=pg.evaluate(SPUL,50);check(r50['n']==2 and r50['twin'],'Welle 50: Doppelboss statt einzelnem Boss')
    r30=pg.evaluate(SPUL,30);check(r30['n']==1 and not r30['twin'],'Welle 30: wieder ein einzelner Boss')
    print('\n'.join(errs) or 'no errors');b.close()
