"""Ton: Bausteine werden nach dem Verklingen getrennt, beim Verlassen der Seite wird der Ton-Unterbau geschlossen und danach neu aufgebaut."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=web(os.path.join(os.path.dirname(HERE),'dist','web','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']);pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300);pg.mouse.click(195,300);pg.wait_for_timeout(500)
    if pg.evaluate("()=>!Snd.ctx||Snd.ctx.state!=='running'"):
        print('ok   kein laufender Ton in dieser Umgebung, Prüfung übersprungen');print('no errors');b.close();sys.exit(0)
    r=pg.evaluate("""async()=>{const B=Snd.B,t=Snd.ctx.currentTime,m0=Track.made,f0=Track.freed,dis=[];
      const orig=AudioNode.prototype.disconnect;AudioNode.prototype.disconnect=function(){dis.push(1);return orig.apply(this,arguments)};
      for(let i=0;i<40;i++)Track.run(()=>SFX[['kill','shoot','hit','drone','turret'][i%5]](B,B.sfx,t+.05+i*.01));
      const made=Track.made-m0,wait=Track.list.length;await new Promise(r=>setTimeout(r,2500));AudioNode.prototype.disconnect=orig;
      return {made,wait,freed:Track.freed-f0,dis:dis.length,left:Track.list.filter(b=>b.end<Snd.ctx.currentTime-1).length}}""")
    check(r['made']>=80 and r['wait']>=40,'jeder Effekt meldet seine Bausteine an: '+str(r['made']))
    check(r['freed']>=r['made'] and r['dis']>=r['made'] and r['left']==0,'nach dem Verklingen sind alle getrennt: '+str(r))
    pg.click('#bStart');pg.wait_for_timeout(6000)
    t=pg.evaluate("()=>[Track.made,Track.freed,Track.list.length]")
    check(t[0]>50 and t[0]-t[1]<400 and t[2]<120,'im laufenden Spiel bleibt der Bestand klein: erzeugt %d, getrennt %d, wartend %d'%tuple(t))
    st=pg.evaluate("()=>{const c=Snd.ctx;dispatchEvent(new Event('pagehide'));return [Snd.ctx===null,Snd.B===null,Track.list.length,c.state]}")
    check(st[0] and st[1] and st[2]==0,'beim Verlassen der Seite wird der Ton-Unterbau geschlossen: '+str(st))
    pg.wait_for_timeout(300);pg.mouse.click(195,60);pg.wait_for_timeout(600)
    check(pg.evaluate("()=>!!Snd.ctx&&Snd.ctx.state==='running'&&!!Snd.B"),'beim nächsten Antippen läuft der Ton wieder')
    pg.wait_for_timeout(1500);check(pg.evaluate("()=>Track.made")>t[0],'Musik und Effekte spielen danach weiter')
    print('\n'.join(errs) or 'no errors');b.close()
