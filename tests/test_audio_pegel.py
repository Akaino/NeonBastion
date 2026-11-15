import os,sys
HERE=os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0,HERE);from _web import web
GAME=os.environ.get('GAME_URL',web(os.path.join(os.path.dirname(HERE),'dist','web','index.html')))
os.makedirs(os.path.join(HERE,'out'),exist_ok=True);os.chdir(os.path.join(HERE,'out'))
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']);pg=b.new_page(viewport={'width':390,'height':844},has_touch=True)
    errs=[];pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)));pg.on('console',lambda m: errs.append(m.text) if m.type=='error' and 'ERR_NAME' not in m.text else None)
    pg.goto(GAME);pg.wait_for_timeout(300)
    pg.click('#bStart');pg.wait_for_timeout(2500)
    print('live ctx',pg.evaluate("()=>Snd.ctx&&Snd.ctx.state"),'level',pg.evaluate("()=>Music.level"),'steps',pg.evaluate("()=>Music.step"))
    res=pg.evaluate("""async()=>{const out={};
      async function render(sec,fn){const ctx=new OfflineAudioContext(2,44100*sec,44100);const B=buildBus(ctx,ctx.destination);fn(B);const buf=await ctx.startRendering();
        const d=buf.getChannelData(0);let pk=0,s=0;for(const v of d){const a=Math.abs(v);if(a>pk)pk=a;s+=v*v}return {peak:+pk.toFixed(3),rms:+Math.sqrt(s/d.length).toFixed(4)}}
      
      for(const k of Object.keys(SFX))out[k]=await render(2.5,B=>SFX[k](B,B.sfx,.02));
      out.mix=await render(8,B=>{const beat=60/158/4;for(let i=0;i<8/beat;i++)Music.scheduleStep(B,i,.05+i*beat,{menu:false,E:1,danger:.9,boss:true},beat,5);for(let i=0;i<40;i++){SFX[['slash','kill','tap','heavy','zap','crit'][i%6]](B,B.sfx,.1+i*.18)}SFX.base(B,B.sfx,3);SFX.boss(B,B.sfx,5)});
      return out}""")
    for k,v in res.items():print(f"{k:9s} peak {v['peak']:.3f} rms {v['rms']:.4f}")
    print('\n'.join(errs) or 'no errors');b.close()
