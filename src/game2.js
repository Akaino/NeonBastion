/* ================= WELT 2: Gitterfestung (Spiellogik) ================= */
class Run2 extends Run{
constructor(save,hooks){super(save,hooks);const S=this.S=stats2(save);
  this.world=2;this.tsave=save.w2.towers;this.heroes=[];this.drones=[];this.w=0;this.gain={c:0,m:0};this.energy=S.startEnergy;
  const hp=S.baseHp;this.base={r:30,max:hp,hp,shMax:hp*S.shieldPct,sh:hp*S.shieldPct,shDelay:0,ov:0,pulseT:3,flash:0,rot:0,turrets:[{a:-PI/2,t:0,aim:-PI/2}]};
  this.phase='build';this.buildT=S.buildTime+5;this.moves=S.moves;this.dirs=[];this.preview=null;this.queue=[];this.prepareWave()}
milestone(w){const r={k:0,p:0,m:0};if(this.world===2&&w>=10&&w%10===0){r.m=this.S.gM;this.gain.m+=r.m}return r}
hpScale(w){return Math.pow(1.13,w-1)}
dmgScale(w){return Math.pow(1.06,w-1)}
towerSlots(){return this.S.slots2}
towerStats(type,l){const D=TOWERS[type],S=this.S;let r=D.r(l);const fx={...D.fx(l)};
  if(D.dmgTower)r*=S.tRange;else{r*=W2_SUPPORT_R*S.supR;const p=S.supPow;if(fx.slow)fx.slow=Math.min(.75,fx.slow*p);if(fx.vuln)fx.vuln=1+(fx.vuln-1)*p;if(fx.weak)fx.weak=Math.max(.3,1-(1-fx.weak)*p);if(fx.dur)fx.dur*=p}
  return{r:Math.round(r),fx}}
energyMul(e){return this.S.energyMul*(1+.06*(this.w-1))}
reward(e){const S=this.S,w=this.w;this.gain.c+=e.val*Math.pow(1.04,w-1)*S.gC;
  if(e.elite&&Math.random()<.02){const m=S.gM;this.gain.m+=m;this.num(e.x,e.y-e.r-30,'+'+fmtN(Math.max(1,m))+' Matrixchip','#ff6b84',true)}
  if(e.boss){const m=(1+Math.floor(w/20))*S.gM;this.gain.m+=m;this.bossKills++;this.shake=Math.max(this.shake,14);this.ring(e.x,e.y,10,180,'#ff6b84',.7,12);
    this.num(e.x,e.y-50,'+'+fmtN(Math.max(1,m))+' Matrixchips','#ff6b84',true);this.h.banner&&this.h.banner('Boss besiegt','+'+fmtN(Math.max(1,m))+' Matrixchips')}}
/* ---- Wellen mit Richtung, Umbau- und Kampfphase ---- */
prepareWave(){const w=++this.w,n=Math.round(Math.min(7+w*2.3,55+w*.7)),bS=w>=3?Math.min(.25,.04*(w-2)):0,sS=w>=5?Math.min(.2,.04*(w-4)):0,eC=Math.min(.08,.03+.003*w),boss=w%10===0,q=[];
  const cnt=boss?Math.round(n*.5):n;for(let i=0;i<cnt;i++){const r=Math.random();q.push({type:r<bS?'brute':r<bS+sS?'shooter':'swarm',elite:Math.random()<eC})}
  if(boss)q.splice(Math.floor(q.length/3),0,{type:'boss',elite:false});
  this.queue=q;const a1=rnd(0,TAU);this.dirs=[a1];if(w>=12&&Math.random()<Math.min(.55,(w-10)*.03))this.dirs.push(a1+rnd(1.8,4.4));
  const types={};for(const x of q)types[x.type]=(types[x.type]||0)+1;this.preview={w,n:q.length,types,boss};this.milestone(w)}
startFight(){if(this.phase!=='build')return;this.phase='fight';this.spawnT=.3;this.spawnI=Math.min(11,7+this.w*.1)/Math.max(1,this.queue.length);this.waveEndT=0;
  this.h.banner&&this.h.banner(`Welle ${this.w}`,this.preview.boss?'Ein Boss nähert sich':'');this.h.sfx&&this.h.sfx(this.preview.boss?'bosswave':'wave')}
tickBuild(dt){if(this.phase!=='build'||this.over)return;this.buildT-=dt;if(this.buildT<=0)this.startFight()}
dirPt(a){const W=this.hw+40,H=this.hh+40,c=Math.cos(a),s=Math.sin(a),t=Math.min(W/Math.abs(c||1e-6),H/Math.abs(s||1e-6));return[c*t,s*t]}
updWaves(dt){if(this.phase!=='fight')return;
  if(this.queue.length){this.spawnT-=dt;if(this.spawnT<=0){const k=Math.min(this.queue.length,1+Math.floor(Math.random()*3)),a=this.dirs[Math.floor(Math.random()*this.dirs.length)]+rnd(-.38,.38),[x,y]=this.dirPt(a);
    for(let i=0;i<k;i++){const q=this.queue.shift();this.spawnEnemy(q.type,q.elite,x+rnd(-24,24),y+rnd(-24,24))}this.spawnT=this.spawnI*k*rnd(.7,1.3)}}
  else if(this.en.length>0){this.waveEndT+=dt;if(this.waveEndT>20&&!this.charge){this.charge=true;for(const e of this.en){e.ranged=false;e.sp*=1.6}this.h.banner&&this.h.banner('Sturmangriff','Die übrigen Gegner stürmen den Kern')}}
  if(!this.queue.length&&this.en.length===0){this.charge=false;const bonus=Math.round((20+5*this.w)*this.S.energyMul);this.energy+=bonus;this.num(0,-60,'+'+fmtN(bonus)+' Energie','#ffe14f',true);
    this.phase='build';this.buildT=this.S.buildTime;this.moves=this.S.moves;this.prepareWave();this.h.sfx&&this.h.sfx('buy')}}
moveTower(T,x,y){if(this.phase!=='build'||this.moves<=0)return false;if(!super.moveTower(T,x,y))return false;this.moves--;return true}
/* ---- Schadenstürme ---- */
updTowers(dt){super.updTowers(dt);const S=this.S,cm=S.comboMul;
  for(const e of this.en){if(e.acid>0&&e.hp>0){e.acid-=dt;e.hp-=e.max*(e.boss?.004:.02)*S.poisonMul*cm*dt;if(e.hp<=0)this.kill(e)}}
  for(const T of this.towers){const D=TOWERS[T.type];if(!D.dmgTower)continue;const r2=T.r*T.r;
    const inR=e=>e.hp>0&&sq(e.x-T.x)+sq(e.y-T.y)<r2+e.r*e.r;
    const pick=()=>{let b=null,bd=Infinity;for(const e of this.en){if(!inR(e))continue;const d=e.x*e.x+e.y*e.y;if(d<bd){bd=d;b=e}}return b};
    if(T.type==='laser'){if(!(T.tg&&inR(T.tg)))T.tg=pick();const e=T.tg;T.beam=e||null;if(!e)continue;
      let m=1,crit=false;if(e.sF)m*=1+.6*cm;if(e.sZ){m*=1+.4*cm;crit=true}if(e.sK&&e.frozen>0)m*=1+2*cm;
      const d=T.fx.dps*S.tDmg*S.laserDmg*S.tRate*m*dt;this.hitE(e,d,{num:false});T.acc=(T.acc||0)+d;T.cd2-=dt;
      if(T.cd2<=0){T.cd2=.4;if(T.acc>0)this.num(e.x,e.y-e.r-4,fmtN(Math.max(1,T.acc))+(crit?'!':''),crit?'#ffe14f':T.col,crit);T.acc=0;this.h.sfx&&this.h.sfx('beam')}}
    else if(T.type==='rocket'){T.cd2-=dt*S.tRate;if(T.cd2>0)continue;let best=null,bn=-1;const cand=this.en.filter(inR);if(!cand.length){T.cd2=.2;continue}
      for(const e of cand.length>24?cand.slice(0,24):cand){let n=0;for(const o of cand)if(sq(o.x-e.x)+sq(o.y-e.y)<T.fx.splash*T.fx.splash)n++;if(n>bn){bn=n;best=e}}
      T.cd2=T.fx.cd;T.aim=Math.atan2(best.y-T.y,best.x-T.x);this.shootAt(T.x,T.y,best,380,T.fx.dmg*S.tDmg*S.rocketDmg,T.col,{size:5,splash:T.fx.splash,num:true});this.h.sfx&&this.h.sfx('turret')}
    else if(T.type==='tesla'){T.cd2-=dt*S.tRate;if(T.cd2>0)continue;const e=pick();if(!e){T.cd2=.15;continue}T.cd2=T.fx.cd;
      const n=T.fx.chain+(e.sF?Math.round(2*cm):0),d=T.fx.dmg*S.tDmg*S.teslaDmg*(e.sZ?1+.6*cm:1),stun=e.sK;
      this.chain([T.x,T.y],e,d,n,T.col,{col:T.col,each:o=>{if(stun&&!o.boss)o.frozen=Math.max(o.frozen||0,.4)}});T.zap=.15;this.h.sfx&&this.h.sfx('zap')}}
  for(const T of this.towers)if(T.zap>0)T.zap-=dt}
explodeAt(p,first){const S=this.S,big=first.sK?1.5:1,R=p.o.splash*big;
  const hit=this.aoe(p.x,p.y,R,p.dmg,{col:p.col,num:true});
  for(const e of hit){if(first.sF&&!e.boss)e.frozen=Math.max(e.frozen||0,.6*S.freezeMul);if(first.sZ)e.acid=3}
  this.ring(p.x,p.y,6,R,p.col,.35,6);this.burst(p.x,p.y,14,p.col,220,.4,3);this.shake=Math.max(this.shake,2);this.h.sfx&&this.h.sfx('kill')}
end(){super.end();this.gain={c:Math.floor(this.gain.c||0),m:Math.floor(this.gain.m||0)}}
}
