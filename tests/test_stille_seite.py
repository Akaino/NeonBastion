"""Am beobachtbaren Dokument ändert sich nichts, weder im Run noch in den Menüs: Die gesamte Oberfläche liegt im Schattenbaum.
Hintergrund: Ein fremdes Skript im Safari des Nutzers reagierte auf jede Änderung am Dokument mit einem Hänger pro Sekunde."""
import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
def check(ok,msg):
    print(('ok   ' if ok else 'Traceback FEHLER ')+msg)
WATCH="""()=>{window.MUT=[];new MutationObserver(l=>{for(const m of l)MUT.push(m.type+' '+(m.target.id||m.target.nodeName)+(m.attributeName?'@'+m.attributeName:''))}).observe(document,{subtree:true,childList:true,characterData:true,attributes:true})}"""
with sync_playwright() as p:
    b=p.chromium.launch()
    for name,sub in (('echtes Spiel',''),('Beta mit Messanzeige','beta')):
        pg=b.new_page(viewport={'width':390,'height':844},device_scale_factor=2,has_touch=True)
        errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
        pg.goto('file://'+os.path.join(os.path.dirname(HERE),'dist','web',sub,'index.html'));pg.wait_for_timeout(300)
        if sub:pg.evaluate("()=>{save.dev=true;save.devPerf=true;persist()}");pg.reload();pg.wait_for_timeout(300)
        check(pg.evaluate("()=>!!document.querySelector('#ui')&&!document.querySelector('#hud')&&!!UI.querySelector('#hud')&&!!UI.querySelector('#banner')&&!!$('#hWave')"),name+': Anzeige und Banner liegen im Schattenbaum, $ findet sie')
        pg.evaluate("()=>{save.speed=4;speed=4;save.nodes.b1=60;persist()}")
        pg.click('#bStart');pg.wait_for_timeout(1200)
        check(pg.is_visible('#hWave') and pg.is_visible('#bPause') and 'Welle' in pg.inner_text('#hWave'),name+': Anzeige ist sichtbar und zeigt die Welle')
        pg.evaluate(WATCH);w0=pg.evaluate("()=>run.w");pg.wait_for_timeout(6000)
        m=pg.evaluate("()=>MUT");w1=pg.evaluate("()=>run.w")
        check(w1>w0 and not pg.evaluate("()=>run.over"),name+': Run lief weiter (Welle %d → %d), Banner und Anzeige haben sich geändert'%(w0,w1))
        check(len(m)==0,name+': in 6 s Run keine einzige Änderung am beobachtbaren Dokument: '+str(sorted(set(m))[:6]))
        if sub:
            pg.evaluate("()=>{MUT.length=0}");pg.evaluate("()=>{run.quit=true;run.end()}");pg.wait_for_timeout(1800);pg.click('#end .btn.big') if pg.locator('#end .btn.big').count() else None;pg.wait_for_timeout(300)
            pg.evaluate("()=>{MUT.length=0}");pg.wait_for_timeout(3000)
            check(pg.evaluate("()=>MUT.length")==0 and pg.evaluate("()=>Perf.on&&$('#perf').textContent.includes('Bilder/s')"),'im Hub mit laufender Messanzeige ebenfalls keine Änderung: '+str(pg.evaluate("()=>[...new Set(MUT)].slice(0,5)")))
        if not sub:pg.screenshot(path='ss1_anzeige.png')
        # Menüs: öffnen, kaufen, wechseln – ebenfalls ohne Änderung am beobachtbaren Dokument
        pg.reload();pg.wait_for_timeout(400);pg.evaluate("()=>{save.cur.s=1e9;save.cur.k=1e6;persist();renderHub()}");pg.evaluate(WATCH)
        pg.click('#bTree');pg.wait_for_timeout(200);pg.evaluate("()=>{selNode='b1';renderTree()}");[pg.click('#bBuy') for i in range(5)];pg.click('#tree [data-back]')
        for btn,sec in (('#bHeroes','#heroes'),('#bFleet','#fleet'),('#bTowers','#towers'),('#bCodex','#codex'),('#bAchv','#achv')):
            pg.click(btn);pg.wait_for_timeout(120);pg.click(sec+' [data-back]')
        pg.click('#bSet');pg.wait_for_timeout(100);pg.click('#bSetClose');pg.wait_for_timeout(300)
        mm=pg.evaluate("()=>[...new Set(MUT)]")
        check(pg.evaluate("()=>save.nodes.b1")>=5 and mm==[],name+': Menüs öffnen, fünfmal kaufen, Einstellungen – keine Änderung am beobachtbaren Dokument: '+str(mm[:6]))
        check(pg.evaluate("()=>document.querySelectorAll('*').length")<25 and pg.evaluate("()=>UI.querySelectorAll('*').length")>200,name+': im Dokument stehen nur noch Rahmen und Spielfeld')
        print('\n'.join(errs) or 'no errors');pg.close()
    b.close()
