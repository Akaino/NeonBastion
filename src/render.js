class Renderer{
constructor(cv){this.cv=cv;this.c=cv.getContext('2d');this.sp=new Map();this.t=0;this.zoom=1;this.ghost=null;this.theme=1;this.resize()}
setTheme(w){if(this.theme===w)return;this.theme=w;this.buildBg()}
resize(){const r=this.cv.getBoundingClientRect();this.dpr=Math.min(2,window.devicePixelRatio||1);this.w=Math.max(1,r.width);this.h=Math.max(1,r.height);
  this.cv.width=Math.round(this.w*this.dpr);this.cv.height=Math.round(this.h*this.dpr);
  this.s=Math.min(1.25,Math.min(this.w,this.h)/(2*255));this.K=this.s*this.dpr;this.hw=this.w/2/this.s;this.hh=this.h/2/this.s;this.se=this.s*this.zoom;this.hwe=this.w/2/this.se;this.hhe=this.h/2/this.se;
  this.sp.clear();this.buildBg()}
/* ----- sprite cache ----- */
sprite(key,R,fn){let s=this.sp.get(key);if(!s){const K=this.K,px=Math.ceil(R*2*K);s=document.createElement('canvas');s.width=s.height=Math.max(2,px);
  const c=s.getContext('2d');c.scale(K,K);c.translate(R,R);c.lineJoin='round';c.lineCap='round';fn(c,K);s.R=R;this.sp.set(key,s)}return s}
draw(s,x,y,a,sc=1){const c=this.c,R=s.R*sc;if(a){c.save();c.translate(x,y);c.rotate(a);c.drawImage(s,-R,-R,R*2,R*2);c.restore()}else c.drawImage(s,x-R,y-R,R*2,R*2)}
neon(c,K,path,col,lw,blur,fill){c.save();path(c);if(fill){c.fillStyle=fill;c.fill()}c.shadowColor=col;c.shadowBlur=blur*K;c.strokeStyle=col;c.lineWidth=lw;c.stroke();c.stroke();
  c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=lw*.35;c.stroke();c.restore()}
dot(col){return this.sprite('dot'+col,8,(c,K)=>{const g=c.createRadialGradient(0,0,0,0,0,8);g.addColorStop(0,'#ffffff');g.addColorStop(.25,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,8,0,TAU);c.fill()})}
poly(c,n,r,rot=0,ry){c.beginPath();for(let i=0;i<n;i++){const a=rot+i*TAU/n;c.lineTo(Math.cos(a)*r,Math.sin(a)*(ry||r))}c.closePath()}
enemySprite(type,r,col,white){const key='e'+type+Math.round(r)+(white?'w':col);return this.sprite(key,r*1.7+8,(c,K)=>{
  const C=white?'#ffffff':col,F=white?'rgba(255,255,255,.35)':'rgba(8,4,20,.88)';
  if(type==='swarm')this.neon(c,K,c=>{c.beginPath();c.moveTo(r*1.3,0);c.lineTo(-r,-r*.95);c.lineTo(-r*.5,0);c.lineTo(-r,r*.95);c.closePath()},C,2,10,F);
  else if(type==='brute'){this.neon(c,K,c=>this.poly(c,6,r,PI/6),C,2.5,12,F);this.neon(c,K,c=>this.poly(c,6,r*.5,PI/6),C,1.6,6)}
  else if(type==='shooter'){this.neon(c,K,c=>{c.beginPath();c.moveTo(r*1.25,0);c.lineTo(0,-r);c.lineTo(-r*.9,0);c.lineTo(0,r);c.closePath()},C,2,10,F);c.fillStyle=C;c.beginPath();c.arc(r*.15,0,r*.28,0,TAU);c.fill()}
  else{this.neon(c,K,c=>{c.beginPath();for(let i=0;i<16;i++){const a=i*TAU/16,rr=i%2?r*.62:r;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath()},C,3,18,F);
    this.neon(c,K,c=>this.poly(c,8,r*.42,PI/8),C,2,8);c.fillStyle=white?'#fff':'#ffd0dc';c.beginPath();c.arc(0,0,r*.18,0,TAU);c.fill()}})}
eliteRing(r){return this.sprite('el'+Math.round(r),r*1.6+8,(c,K)=>{c.setLineDash([4,4]);this.neon(c,K,c=>{c.beginPath();c.arc(0,0,r*1.45,0,TAU)},'#ffe14f',1.6,8)})}
heroSprite(id,col,white){return this.sprite('h'+id+(white?'w':''),26,(c,K)=>{const C=white?'#ffffff':col,F='rgba(10,4,24,.9)';
  if(id==='klinge'){this.neon(c,K,c=>{c.beginPath();c.moveTo(16,0);c.lineTo(0,-7);c.lineTo(-11,0);c.lineTo(0,7);c.closePath()},C,2.4,14,F);this.neon(c,K,c=>{c.beginPath();c.moveTo(-3,-11);c.lineTo(-3,11);c.moveTo(-11,0);c.lineTo(-16,0)},C,2,8)}
  else if(id==='schuetzin'){this.neon(c,K,c=>{c.beginPath();c.arc(-2,0,9,0,TAU)},C,2.2,12,F);this.neon(c,K,c=>{c.beginPath();c.arc(-4,0,15,-1.1,1.1);c.moveTo(-6,0);c.lineTo(16,0);c.moveTo(12,-4);c.lineTo(16,0);c.lineTo(12,4)},C,1.8,8)}
  else if(id==='arkanist'){this.neon(c,K,c=>{c.beginPath();for(const o of[0,PI]){for(let i=0;i<3;i++){const a=o-PI/2+i*TAU/3;i?c.lineTo(Math.cos(a)*13,Math.sin(a)*13):c.moveTo(Math.cos(a)*13,Math.sin(a)*13)}c.closePath()}},C,2.2,14,F);c.fillStyle=C;c.beginPath();c.arc(0,0,3,0,TAU);c.fill()}
  else{this.neon(c,K,c=>{c.beginPath();c.moveTo(-10,-11);c.lineTo(10,-11);c.lineTo(10,0);c.quadraticCurveTo(10,9,0,14);c.quadraticCurveTo(-10,9,-10,0);c.closePath()},C,2.2,14,F);this.neon(c,K,c=>{c.beginPath();c.moveTo(0,-6);c.lineTo(0,6);c.moveTo(-5,0);c.lineTo(5,0)},C,1.8,6)}})}
droneSprite(big,white){return this.sprite('d'+(big?1:0)+(white?'w':''),big?20:12,(c,K)=>{const C=white?'#fff':'#3df5ff',r=big?9:5;
  if(big){this.neon(c,K,c=>this.poly(c,6,r,0),C,2,12,'rgba(4,20,30,.9)');this.neon(c,K,c=>{c.beginPath();c.moveTo(r*.8,0);c.lineTo(-r*.4,-r*.5);c.lineTo(-r*.4,r*.5);c.closePath()},C,1.4,4)}
  else this.neon(c,K,c=>{c.beginPath();c.moveTo(r*1.3,0);c.lineTo(-r*.8,-r*.9);c.lineTo(-r*.3,0);c.lineTo(-r*.8,r*.9);c.closePath()},C,1.6,8,'rgba(4,20,30,.9)')})}
coreSprite(r,n,lw,col,key){return this.sprite(key,r+14,(c,K)=>this.neon(c,K,c=>this.poly(c,n,r,0),col,lw,16,'rgba(6,10,36,.92)'))}
/* ----- background ----- */
buildBg(){const W=this.cv.width,H=this.cv.height,b=document.createElement('canvas');b.width=W;b.height=H;const c=b.getContext('2d'),cx=W/2,cy=H/2;
  const g=c.createRadialGradient(cx,cy,0,cx,cy,Math.max(W,H)*.7);const T2=this.theme===2;g.addColorStop(0,T2?'#2a1408':'#10103a');g.addColorStop(.5,T2?'#140a06':'#080824');g.addColorStop(1,T2?'#060302':'#030310');c.fillStyle=g;c.fillRect(0,0,W,H);
  for(let i=0;i<120;i++){const x=(i*733.7)%W,y=(i*421.3)%H;c.fillStyle=`rgba(200,210,255,${.15+(i%5)*.06})`;c.fillRect(x,y,Math.max(1,this.dpr),Math.max(1,this.dpr))}
  this.bg=b;
  // Welt-Raster als eigene Ebene, damit es beim Rauszoomen mitskaliert
  const ZMIN=.6,hwW=this.hw/ZMIN,hhW=this.hh/ZMIN,rs=Math.min(this.K,2800/(2*Math.max(hwW,hhW))),w=document.createElement('canvas');
  w.width=Math.ceil(2*hwW*rs);w.height=Math.ceil(2*hhW*rs);const d=w.getContext('2d');d.scale(rs,rs);d.translate(hwW,hhW);d.lineWidth=Math.max(.7,1/rs);
  const hs=26,hh=hs*Math.sqrt(3),fade=Math.min(this.hw,this.hh)*1.25;
  for(let y=-hhW-hh;y<hhW+hh;y+=hh/2)for(let x=-hwW-hs*3,row=Math.round(y/(hh/2));x<hwW+hs*3;x+=hs*3){const ox=x+(row%2?hs*1.5:0),dd=Math.hypot(ox,y)/fade;
    const a=Math.max(0,.13-dd*.08);if(a<=.004)continue;d.strokeStyle=this.theme===2?`rgba(255,160,70,${a})`:`rgba(61,245,255,${a})`;d.beginPath();for(let i=0;i<6;i++){const an=i*PI/3;d.lineTo(ox+Math.cos(an)*hs,y+Math.sin(an)*hs)}d.closePath();d.stroke()}
  d.setLineDash([3,7]);for(const [rad,a] of[[120,.16],[240,.11],[360,.07],[480,.05]]){d.strokeStyle=this.theme===2?`rgba(255,90,110,${a})`:`rgba(122,92,255,${a})`;d.beginPath();d.arc(0,0,rad,0,TAU);d.stroke()}
  this.bgW={c:w,hw:hwW,hh:hhW};
  const v=document.createElement('canvas');v.width=W;v.height=H;const vc=v.getContext('2d'),vg=vc.createRadialGradient(cx,cy,Math.min(W,H)*.35,cx,cy,Math.max(W,H)*.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.55)');vc.fillStyle=vg;vc.fillRect(0,0,W,H);this.vig=v}
/* ----- frame ----- */
frame(run,dt){this.t+=dt;
  // Dynamischer Zoom: je mehr Gegner, desto weiter raus
  const zt=run&&!run.over?clamp(1-(run.en.length-14)*.0085,.6,1):1;this.zoom+=(zt-this.zoom)*Math.min(1,dt*.9);
  this.se=this.s*this.zoom;this.hwe=this.w/2/this.se;this.hhe=this.h/2/this.se;
  const c=this.c,K=this.se*this.dpr;c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.drawImage(this.bg,0,0);
  let sx=0,sy=0;if(run&&run.shake>.3){sx=rnd(-1,1)*run.shake;sy=rnd(-1,1)*run.shake}
  c.setTransform(K,0,0,K,this.cv.width/2+sx*K,this.cv.height/2+sy*K);
  const W_=this.bgW;c.drawImage(W_.c,-W_.hw,-W_.hh,W_.hw*2,W_.hh*2);
  // radar sweep
  c.globalCompositeOperation='lighter';const sw=this.t*.9;c.strokeStyle='rgba(61,245,255,.10)';c.lineWidth=14;c.beginPath();c.arc(0,0,95,sw,sw+.9);c.stroke();
  c.strokeStyle='rgba(255,79,216,.08)';c.lineWidth=6;c.beginPath();c.arc(0,0,150,-sw*.6,-sw*.6+1.4);c.stroke();c.globalCompositeOperation='source-over';
  if(!run){this.drawBase({r:30,rot:this.t*.6,hp:1,max:1,sh:1,shMax:1,ov:0,flash:0,turrets:[]},null);
    for(let i=0;i<5;i++){const a=this.t*.5+i*TAU/5;this.draw(this.droneSprite(false),Math.cos(a)*70,Math.sin(a)*70,a+PI/2)}
    if(this.theme===2){for(let i=0;i<4;i++){const a=-this.t*.25+i*TAU/4,ty=['laser','frost','rocket','tesla'][i];this.draw(this.towerSprite(ty,TOWERS[ty].col),Math.cos(a)*118,Math.sin(a)*118,a+PI)}}
    else for(let i=0;i<3;i++){const a=-this.t*.3+i*TAU/3,col=['#ff4fd8','#8cff4f','#b98cff'][i];this.draw(this.heroSprite(['klinge','schuetzin','arkanist'][i],col),Math.cos(a)*118,Math.sin(a)*118,a-PI/2)}
    c.setTransform(1,0,0,1,0,0);c.drawImage(this.vig,0,0);return}
  this.drawTowers(run);
  this.drawBase(run.base,run);
  // enemy projectiles
  c.globalCompositeOperation='lighter';for(const q of run.ep)this.draw(this.dot(q.col),q.x,q.y,0,.9);c.globalCompositeOperation='source-over';
  // enemies
  for(const e of run.en){if(e.vuln>1){c.strokeStyle='rgba(214,92,255,.7)';c.lineWidth=1.4;c.setLineDash([3,3]);c.lineDashOffset=-this.t*20;c.beginPath();c.arc(e.x,e.y,e.r*1.45,0,TAU);c.stroke();c.setLineDash([])}
    if(e.spMul<1&&!(e.frozen>0)){c.strokeStyle='rgba(90,184,255,.75)';c.lineWidth=1.6;c.beginPath();c.arc(e.x,e.y,e.r*1.25,0,TAU);c.stroke()}
    if(e.boss){const p=.5+.5*Math.sin(this.t*4);c.globalCompositeOperation='lighter';c.globalAlpha=.55+.25*p;this.draw(this.dot('#ff1f4b'),e.x,e.y,0,e.r*.22*(1+.12*p));
      c.globalAlpha=.8;c.strokeStyle='#ff3b5c';c.lineWidth=3;c.setLineDash([10,8]);c.lineDashOffset=-this.t*30;c.beginPath();c.arc(e.x,e.y,e.r*1.55,0,TAU);c.stroke();
      c.lineWidth=1.5;c.setLineDash([3,9]);c.lineDashOffset=this.t*20;c.beginPath();c.arc(e.x,e.y,e.r*1.85,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=1;c.globalCompositeOperation='source-over'}
    const s=this.enemySprite(e.type,e.r,e.col,e.flash>0);this.draw(s,e.x,e.y,e.boss?this.t*.4:e.ang);if(e.elite)this.draw(this.eliteRing(e.r),e.x,e.y,this.t*1.5);
    if(e.combo&2){c.globalCompositeOperation='lighter';for(let q=0;q<2;q++){const ph=(this.t*1.3+q*.5+e.wob)%1;c.globalAlpha=(1-ph)*.8;this.draw(this.dot('#8cff4f'),e.x+Math.sin(e.wob*3+q*2)*e.r*.6,e.y-e.r*.4-ph*e.r*1.4,0,.35+.2*(1-ph))}c.globalAlpha=1;c.globalCompositeOperation='source-over'}
    if(e.combo&4){c.strokeStyle='rgba(255,79,216,.85)';c.lineWidth=1.5;c.beginPath();for(let q=0;q<4;q++){const an=this.t*2+q*PI/2;c.moveTo(e.x+Math.cos(an)*e.r*1.6,e.y+Math.sin(an)*e.r*1.6);c.lineTo(e.x+Math.cos(an)*e.r*2,e.y+Math.sin(an)*e.r*2)}c.stroke()}
    if(e.frozen>0){c.globalAlpha=Math.min(1,e.frozen*3);c.save();c.translate(e.x,e.y);c.fillStyle='rgba(191,244,255,.28)';c.strokeStyle='#e6fbff';c.lineWidth=1.8;this.poly(c,6,e.r*1.5,PI/6);c.fill();c.stroke();
      c.lineWidth=1;c.beginPath();c.moveTo(-e.r*.7,-e.r*.4);c.lineTo(e.r*.2,e.r*.5);c.moveTo(e.r*.5,-e.r*.7);c.lineTo(e.r*.1,0);c.stroke();c.restore();c.globalAlpha=1}}
  // hp bars for damaged big ones
  for(const e of run.en){if(e.boss||e.hp>=e.max||(!e.elite&&e.type!=='brute'))continue;const w=e.r*2.2,f=Math.max(0,e.hp/e.max),y=e.y-e.r*1.5-6;
    c.fillStyle='rgba(5,5,26,.8)';c.fillRect(e.x-w/2-1,y-1,w+2,5);c.fillStyle=e.boss?'#ff3b5c':e.elite?'#ffe14f':'#ff8a3d';c.fillRect(e.x-w/2,y,w*f,3)}
  // drones
  for(const d of run.drones)this.draw(this.droneSprite(d.big,d.flash>0),d.x,d.y,d.face);
  // dash afterimages
  for(const g of run.ghosts){if(g.l<0)continue;c.globalAlpha=(1-g.l/g.m)*.45;this.draw(this.heroSprite(g.id,g.col),g.x,g.y,g.a,1.2)}c.globalAlpha=1;
  // heroes
  for(const h of run.heroes){if(h.dead>0){c.globalAlpha=.35;c.strokeStyle=h.col;c.lineWidth=1.5;c.setLineDash([3,4]);c.beginPath();c.arc(Math.cos(h.idleA)*40,Math.sin(h.idleA)*40,10,0,TAU);c.stroke();c.setLineDash([]);c.globalAlpha=1;continue}
    const lm=h.id==='klinge'?.16:.1,lo=h.lunge>0?Math.sin((1-h.lunge/lm)*PI)*(h.id==='klinge'?8:-4):0,hx=h.x+Math.cos(h.face)*lo,hy=h.y+Math.sin(h.face)*lo;
    if(h.cast>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=h.cast/.3;c.strokeStyle=h.col;c.lineWidth=1.4;c.translate(h.x,h.y);c.rotate(this.t*3);
      for(const o of[0,PI]){c.beginPath();for(let i=0;i<3;i++){const a=o+i*TAU/3;c.lineTo(Math.cos(a)*22,Math.sin(a)*22)}c.closePath();c.stroke()}c.restore()}
    this.draw(this.heroSprite(h.id,h.col,h.flash>0),hx,hy,h.spin>0?h.face+(1-h.spin/.45)*TAU*2:h.face,1.2);
    const f=Math.max(0,h.hp/h.max);c.fillStyle='rgba(5,5,26,.8)';c.fillRect(h.x-12,h.y+16,24,4);c.fillStyle=h.col;c.fillRect(h.x-11.5,h.y+16.5,23*f,3);
    const cf=1-Math.max(0,h.abT)/h.cd;c.strokeStyle=cf>=1?'#ffffff':h.col;c.globalAlpha=cf>=1?.9:.45;c.lineWidth=1.6;c.beginPath();c.arc(h.x,h.y,17,-PI/2,-PI/2+TAU*Math.min(1,cf));c.stroke();c.globalAlpha=1}
  // Impuls-Ring am Zeiger: füllt sich im Uhrzeigersinn bis zum nächsten Impuls, Farbe kündigt Sondertreffer an
  if(run.S.impInt>0&&!run.over){const S=run.S,r=S.tapR,f=clamp(1-run.impT/S.impInt,0,1),nx=run.imps+1;
    const col=S.megaTap&&nx%S.megaTap===0?'#ffe14f':S.overload&&nx%10===0?'#ff8a3d':S.beat&&nx%BEAT_N===0?'#ff4fd8':'#3df5ff';
    c.fillStyle=col;c.globalAlpha=.05;c.beginPath();c.arc(run.cx,run.cy,r,0,TAU);c.fill();
    c.globalAlpha=.3;c.strokeStyle='#ffffff';c.lineWidth=1.2;c.stroke();
    c.globalAlpha=.95;c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(run.cx,run.cy,r,-PI/2,-PI/2+TAU*f);c.stroke();c.lineCap='butt';
    c.globalAlpha=.85;this.draw(this.dot(col),run.cx,run.cy,0,.45);c.globalAlpha=1}
  // additive fx
  c.globalCompositeOperation='lighter';
  for(const p of run.pr){c.strokeStyle=p.col;c.globalAlpha=.55;c.lineWidth=p.size*.9;c.beginPath();c.moveTo(p.tx,p.ty);c.lineTo(p.x,p.y);c.stroke();c.globalAlpha=1;this.draw(this.dot(p.col),p.x,p.y,0,p.size/3)}
  for(const b of run.bolts){const a=1-b.l/b.m;
    if(b.arc){c.strokeStyle=b.col;c.globalAlpha=a;c.lineWidth=b.w;c.beginPath();c.arc(b.x,b.y,20,b.a-1.1,b.a+1.1);c.stroke();continue}
    c.beginPath();b.pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.globalAlpha=a*.35;c.strokeStyle=b.col;c.lineWidth=b.w*2.4;c.stroke();c.globalAlpha=a;c.strokeStyle='#ffffff';c.lineWidth=b.w*.45;c.stroke()}
  c.globalAlpha=1;
  for(const s of run.slashes){if(s.l<0)continue;this.slash(c,s)}
  c.globalAlpha=1;
  for(const r of run.rings){const k=r.l/r.m,e=1-Math.pow(1-k,3),rad=r.r0+(r.r1-r.r0)*e;c.globalAlpha=(1-k)*.9;c.strokeStyle=r.col;c.lineWidth=r.w*(1-k)+1;c.beginPath();c.arc(r.x,r.y,rad,0,TAU);c.stroke()}
  c.globalAlpha=1;
  for(const p of run.parts){const k=p.l/p.m;this.draw(this.dot(p.col),p.x,p.y,0,p.s/4*(1-k*.7))}
  c.globalCompositeOperation='source-over';
  // numbers in screen space
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
  for(const n of run.nums){const x=this.w/2+(n.x+sx)*this.se,y=this.h/2+(n.y+sy)*this.se,k=n.l/.9,sc=n.l<.08?.6+n.l*5:1;
    c.globalAlpha=k<.6?1:1-(k-.6)/.4;c.font=`700 ${Math.round((n.big?20:14)*sc)}px "Chakra Petch",system-ui,sans-serif`;c.lineWidth=4;c.strokeStyle='rgba(4,3,18,.9)';c.strokeText(n.t,x,y);c.fillStyle=n.col;c.fillText(n.t,x,y)}
  c.globalAlpha=1;
  if(run.world===2&&run.dirs&&run.dirs.length&&!run.over){const build=run.phase==='build',p=.55+.45*Math.sin(this.t*5);
    for(const a of run.dirs){const cx=this.w/2,cy=this.h/2,dx=Math.cos(a),dy=Math.sin(a),k=Math.min((this.w/2-30)/Math.abs(dx||1e-6),(this.h/2-140)/Math.abs(dy||1e-6)),ax=cx+dx*k,ay=cy+dy*k;
      c.save();c.translate(ax,ay);c.rotate(a+PI);c.globalAlpha=build?p:.45;c.fillStyle='#ff8a3d';c.shadowColor='#ff8a3d';c.shadowBlur=build?18:8;const s=build?1.4:1;
      for(let i=0;i<(build?3:1);i++){c.beginPath();c.moveTo((14+i*12)*s,0);c.lineTo((-4+i*12)*s,-11*s);c.lineTo((1+i*12)*s,0);c.lineTo((-4+i*12)*s,11*s);c.closePath();c.fill()}c.restore()}
    c.globalAlpha=1}
  const placed=[];if(this.comboLabels)for(const [lx,ly,cb] of this.comboLabels){const x=this.w/2+(lx+sx)*this.se;let y=this.h/2+(ly+sy)*this.se;
    for(let g=0;g<6&&placed.some(([px,py])=>Math.abs(px-x)<78&&Math.abs(py-y)<14);g++)y+=14;placed.push([x,y]);c.font='700 11px "Chakra Petch",system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(4,3,18,.85)';c.strokeText(cb.name,x,y);c.fillStyle=cb.col;c.fillText(cb.name,x,y)}
  for(const e of run.en){if(!e.boss)continue;const x=this.w/2+(e.x+sx)*this.se,y=this.h/2+(e.y+sy)*this.se,m=34;
    if(x>m&&x<this.w-m&&y>m+90&&y<this.h-m-90){const ty=y-(e.r*1.9)*this.se-10;c.font='700 13px "Chakra Petch",system-ui,sans-serif';c.lineWidth=4;c.strokeStyle='rgba(4,3,18,.9)';
      c.strokeText('BOSS · '+e.name,x,ty-10);c.fillStyle='#ff6b84';c.fillText('BOSS · '+e.name,x,ty-10);const w=70,f=Math.max(0,e.hp/e.max);c.fillStyle='rgba(5,5,26,.85)';c.fillRect(x-w/2-1,ty-1,w+2,7);c.fillStyle='#ff3b5c';c.fillRect(x-w/2,ty,w*f,5)}
    else{const cx=this.w/2,cy=this.h/2,dx=x-cx,dy=y-cy,k=Math.min((this.w/2-m)/Math.abs(dx||1e-6),(this.h/2-m-90)/Math.abs(dy||1e-6)),ax=cx+dx*k,ay=cy+dy*k,a=Math.atan2(dy,dx),p=.6+.4*Math.sin(this.t*6);
      c.save();c.translate(ax,ay);c.rotate(a);c.globalAlpha=p;c.fillStyle='#ff3b5c';c.shadowColor='#ff3b5c';c.shadowBlur=14;c.beginPath();c.moveTo(16,0);c.lineTo(-8,-12);c.lineTo(-3,0);c.lineTo(-8,12);c.closePath();c.fill();c.restore();
      c.globalAlpha=1;c.font='700 11px "Chakra Petch",system-ui,sans-serif';c.lineWidth=3;c.strokeStyle='rgba(4,3,18,.9)';c.strokeText('BOSS',ax-Math.cos(a)*24,ay-Math.sin(a)*24);c.fillStyle='#ff6b84';c.fillText('BOSS',ax-Math.cos(a)*24,ay-Math.sin(a)*24)}}
  c.globalAlpha=1;c.setTransform(1,0,0,1,0,0);c.drawImage(this.vig,0,0)}
slash(c,s){const k=s.l/s.m,fade=k<.55?1:1-(k-.55)/.45;let a0,sweep;
  if(s.full){a0=s.a+k*TAU*.9;sweep=2.6}else{sweep=2.5;const prog=Math.min(1,k*1.8);a0=s.a-s.dir*sweep/2;const head=a0+s.dir*sweep*prog,tail=a0+s.dir*sweep*Math.max(0,prog-.6);return this.crescent(c,s.x,s.y,s.r,tail,head,s.dir,s.w,s.col,fade)}
  this.crescent(c,s.x,s.y,s.r*(.85+k*.35),a0,a0+sweep,1,s.w,s.col,fade)}
crescent(c,x,y,r,t0,t1,dir,w,col,fade){const N=9,ccw=dir<0;
  c.strokeStyle=col;c.lineCap='round';
  c.globalAlpha=fade*.22;c.lineWidth=w*2.2;c.beginPath();c.arc(x,y,r,t0,t1,ccw);c.stroke();
  for(let i=0;i<N;i++){const a=t0+(t1-t0)*i/N,b=t0+(t1-t0)*(i+1)/N,q=(i+1)/N;c.globalAlpha=fade*q;c.lineWidth=w*(.25+.75*Math.sin(q*PI*.9));c.beginPath();c.arc(x,y,r,a,b,ccw);c.stroke()}
  c.strokeStyle='#ffffff';c.globalAlpha=fade;c.lineWidth=Math.max(1,w*.28);c.beginPath();c.arc(x,y,r+w*.15,t0+(t1-t0)*.45,t1,ccw);c.stroke();
  const ex=x+Math.cos(t1)*r,ey=y+Math.sin(t1)*r;this.draw(this.dot(col),ex,ey,0,w/7);c.globalAlpha=1}
towerSprite(type,col){return this.sprite('t'+type+col,26,(c,K)=>{const C=col,F='rgba(6,10,36,.92)';
  if(type==='frost'){this.neon(c,K,c=>this.poly(c,6,13,0),C,2.2,14,F);this.neon(c,K,c=>{c.beginPath();for(let i=0;i<6;i++){const a=i*PI/3;c.moveTo(0,0);c.lineTo(Math.cos(a)*9,Math.sin(a)*9);
      c.moveTo(Math.cos(a)*5+Math.cos(a+.9)*3,Math.sin(a)*5+Math.sin(a+.9)*3);c.lineTo(Math.cos(a)*5,Math.sin(a)*5);c.lineTo(Math.cos(a)*5+Math.cos(a-.9)*3,Math.sin(a)*5+Math.sin(a-.9)*3)}},C,1.3,6)}
  else if(type==='weak'){this.neon(c,K,c=>{c.beginPath();c.moveTo(-13,-9);c.lineTo(13,-9);c.lineTo(0,14);c.closePath()},C,2.2,14,F);this.neon(c,K,c=>{c.beginPath();c.arc(0,-1,4.5,0,TAU)},C,1.6,8);c.fillStyle=C;c.beginPath();c.arc(0,-1,1.8,0,TAU);c.fill()}
  else if(type==='laser'){this.neon(c,K,c=>{c.beginPath();c.arc(0,0,11,0,TAU)},C,2.2,14,F);this.neon(c,K,c=>{c.beginPath();c.moveTo(4,-3);c.lineTo(18,-3);c.moveTo(4,3);c.lineTo(18,3)},C,2,8);c.fillStyle=C;c.beginPath();c.arc(0,0,3.5,0,TAU);c.fill()}
  else if(type==='rocket'){this.neon(c,K,c=>{c.beginPath();c.rect(-11,-11,22,22)},C,2.2,14,F);this.neon(c,K,c=>{c.beginPath();c.rect(-3,-9,16,6);c.rect(-3,3,16,6)},C,1.6,8)}
  else if(type==='tesla'){this.neon(c,K,c=>{c.beginPath();c.arc(0,0,12,0,TAU)},C,2.2,14,F);this.neon(c,K,c=>{c.beginPath();c.moveTo(-6,-7);c.lineTo(2,-2);c.lineTo(-3,1);c.lineTo(6,7);c.moveTo(-8,0);c.arc(0,0,8,PI,PI*1.6)},C,1.6,8)}
  else{this.neon(c,K,c=>{c.beginPath();c.moveTo(0,-15);c.lineTo(10,0);c.lineTo(0,15);c.lineTo(-10,0);c.closePath()},C,2.2,16,F);this.neon(c,K,c=>{c.beginPath();c.moveTo(-10,0);c.lineTo(10,0);c.moveTo(0,-15);c.lineTo(-4,0);c.lineTo(0,15);c.moveTo(0,-15);c.lineTo(4,0);c.lineTo(0,15)},C,1,4)}})}
drawTowerArea(x,y,r,col,alpha=1){const c=this.c;c.fillStyle=col;c.globalAlpha=.05*alpha;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();
  c.globalAlpha=Math.min(1,.4*alpha);c.strokeStyle=col;c.lineWidth=1.3;c.setLineDash([6,6]);c.lineDashOffset=-this.t*12;c.stroke();c.setLineDash([]);c.globalAlpha=1}
drawTowers(run){const c=this.c;
  // Überschneidungen: Linse in Kombinationsfarbe + Name
  const TT=run.towers,labels=[];
  for(let i=0;i<TT.length;i++)for(let j=i+1;j<TT.length;j++){const A=TT[i],B=TT[j],d=hyp(A.x-B.x,A.y-B.y);if(d>=A.r+B.r)continue;const cb=comboOf(A.type,B.type);if(!cb)continue;
    c.save();c.beginPath();c.arc(A.x,A.y,A.r,0,TAU);c.clip();c.beginPath();c.arc(B.x,B.y,B.r,0,TAU);c.fillStyle=cb.col;c.globalAlpha=.13+.05*Math.sin(this.t*3);c.fill();
    c.globalAlpha=.55;c.strokeStyle=cb.col;c.lineWidth=1.5;c.setLineDash([2,5]);c.stroke();c.setLineDash([]);c.restore();
    const t=d?(A.r-(A.r+B.r-d)/2)/d:0;labels.push([A.x+(B.x-A.x)*t,A.y+(B.y-A.y)*t,cb])}
  this.comboLabels=labels;
  for(const T of run.towers){this.drawTowerArea(T.x,T.y,T.r,T.col);c.globalCompositeOperation='lighter';
    if(T.type==='frost'){for(let i=0;i<2;i++){const k=((T.pulse+i*.7)%1.4)/1.4;c.globalAlpha=(1-k)*.35;c.strokeStyle=T.col;c.lineWidth=2;c.beginPath();c.arc(T.x,T.y,T.r*k,0,TAU);c.stroke()}}
    else if(T.type==='weak'){const k=.5+.5*Math.sin(T.pulse*3);c.globalAlpha=.15+k*.2;c.strokeStyle=T.col;c.lineWidth=3;c.beginPath();c.arc(T.x,T.y,T.r*.98,0,TAU);c.stroke()}
    else{const f=1-Math.max(0,T.cd)/T.fx.cd;c.globalAlpha=.85;c.strokeStyle=f>.92?'#ffffff':T.col;c.lineWidth=2.5;c.beginPath();c.arc(T.x,T.y,20,-PI/2,-PI/2+TAU*clamp(f,0,1));c.stroke()}
    if(T.type==='laser'&&T.beam&&T.beam.hp>0){const e=T.beam,fl=.75+.25*Math.sin(this.t*40);c.globalAlpha=.35*fl;c.strokeStyle=T.col;c.lineWidth=7;c.beginPath();c.moveTo(T.x,T.y);c.lineTo(e.x,e.y);c.stroke();
      c.globalAlpha=fl;c.strokeStyle='#ffffff';c.lineWidth=1.8;c.stroke();this.draw(this.dot(T.col),e.x,e.y,0,.9);T.aim=Math.atan2(e.y-T.y,e.x-T.x)}
    if(T.type==='tesla'&&T.zap>0){c.globalAlpha=T.zap/.15;c.strokeStyle=T.col;c.lineWidth=3;c.beginPath();c.arc(T.x,T.y,16,0,TAU);c.stroke()}
    c.globalAlpha=1;c.globalCompositeOperation='source-over';const pop=T.born<.3?.6+T.born/.3*.4:1;const rot=T.type==='frost'?T.pulse*.4:(T.type==='laser'||T.type==='rocket')?(T.aim||0):0;this.draw(this.towerSprite(T.type,T.col),T.x,T.y,rot,pop)}
  const sel=this.selTower;if(sel&&run.towers.includes(sel)){c.strokeStyle='#ffffff';c.lineWidth=2;c.setLineDash([4,4]);c.lineDashOffset=-this.t*20;c.beginPath();c.arc(sel.x,sel.y,24,0,TAU);c.stroke();c.setLineDash([])}
  const g=this.ghost;if(g){const col=g.ok?TOWERS[g.type].col:'#ff4f6d';this.drawTowerArea(g.x,g.y,g.r,col,1.6);c.globalAlpha=.75;this.draw(this.towerSprite(g.type,col),g.x,g.y,0);c.globalAlpha=1}}
drawBase(b,run){const c=this.c,fl=b.flash>0;
  if(b.shMax>0&&b.sh>0){const f=b.sh/b.shMax;c.globalCompositeOperation='lighter';c.fillStyle=`rgba(61,245,255,${.04+.05*f})`;c.beginPath();c.arc(0,0,50,0,TAU);c.fill();
    c.strokeStyle=fl?'#ffffff':`rgba(61,245,255,${.25+.5*f})`;c.lineWidth=2;c.beginPath();c.arc(0,0,50,0,TAU);c.stroke();c.globalCompositeOperation='source-over'}
  if(b.ov>0){c.globalCompositeOperation='lighter';c.strokeStyle=`rgba(255,225,79,${.4+.4*Math.sin(this.t*6)**2})`;c.lineWidth=3;c.beginPath();c.arc(0,0,56,0,TAU);c.stroke();c.globalCompositeOperation='source-over'}
  for(const tu of b.turrets){const x=Math.cos(tu.a)*44,y=Math.sin(tu.a)*44;c.save();c.translate(x,y);c.rotate(tu.aim);c.strokeStyle='#3df5ff';c.lineWidth=3;c.beginPath();c.moveTo(0,0);c.lineTo(11,0);c.stroke();c.fillStyle='rgba(6,10,36,.95)';c.fillRect(-5,-5,10,10);c.lineWidth=1.6;c.strokeRect(-5,-5,10,10);c.restore()}
  const col=fl?'#ffffff':'#3df5ff';this.draw(this.coreSprite(30,6,3,col,'core1'+col),0,0,b.rot);
  const col2=fl?'#ffffff':'#ff4fd8';this.draw(this.coreSprite(17,6,2.2,col2,'core2'+col2),0,0,-b.rot*1.6);
  const p=.6+.4*Math.sin(this.t*3),hf=b.max?b.hp/b.max:1;c.globalCompositeOperation='lighter';this.draw(this.dot(hf<.3?'#ff4f6d':'#3df5ff'),0,0,0,1.1+p*.4);c.globalCompositeOperation='source-over'}
}
