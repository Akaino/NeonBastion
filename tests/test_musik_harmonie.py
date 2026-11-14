import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
GAME=os.environ.get('GAME_URL','file://'+os.path.join(os.path.dirname(HERE),'docs','index.html'))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page()
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    pg.goto(GAME);pg.wait_for_timeout(300)
    res=pg.evaluate("""async()=>{const rep={};
      for(const [name,S] of [['menu',{menu:true,E:0,W:0,danger:0,boss:false}],['E0',{menu:false,E:0,W:0,danger:0,boss:false}],['E.5',{menu:false,E:.5,W:.5,danger:0,boss:false}],['E1+boss+danger',{menu:false,E:1,W:1,danger:.9,boss:true}]]){
        Music.sec=null;Music.secN=0;Music.mel=null;Music.tr=0;Music.log=[];const sec=90,ctx=new OfflineAudioContext(1,44100*sec,44100),B=buildBus(ctx,ctx.destination);
        const beat=60/(S.menu?100:112+60*S.W)/4;let t=.05,i=0;while(t<sec-.5){Music.scheduleStep(B,i,t,S,beat);i++;t+=beat}
        const pc=m=>((m-57)%12+12)%12;let bad=0,badList=[],leadStrongBad=0,leaps=0,leadN=0,maxLeap=0,prev=null,lo=999,hi=0;
        for(const n of Music.log){const ct=CHORDS[n.ch].map(x=>x%12),sc=n.ch==='V'?SC_HARM:SC_NAT;
          if(n.kind==='lead'){leadN++;if(!sc.includes(pc(n.m))){bad++;badList.push('lead '+n.m+' over '+n.ch)}if(n.s%4===0&&!ct.includes(pc(n.m)))leadStrongBad++;
            if(prev!==null){const l=Math.abs(n.m-prev);maxLeap=Math.max(maxLeap,l);if(l>7)leaps++}prev=n.m;lo=Math.min(lo,n.m);hi=Math.max(hi,n.m)}
          else if(!ct.includes(pc(n.m))){bad++;badList.push(n.kind+' '+n.m+' over '+n.ch)}}
        rep[name]={notes:Music.log.length,outOfKeyOrChord:bad,examples:badList.slice(0,3),leadNotes:leadN,leadStrongBeatNonChord:leadStrongBad,leapsOver5th:leaps,maxLeap,range:lo+'-'+hi}}
      Music.log=null;return rep}""")
    for k,v in res.items():print(k,v)
    print('\n'.join(errs) or 'no errors');b.close()
