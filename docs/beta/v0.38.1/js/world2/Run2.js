import { fmtN } from '../core/format.js';
import { hyp, rnd, sq } from '../core/util.js';
import { BOSS_PULL_R, BOSS_SHOCK_R } from '../data/bosses.js';
import { GAS_R, MORTAR_RANGE } from '../data/enemies.js';
import { TOWERS } from '../data/towers.js';
import { Run } from '../run/Run.js';
import { W2_SUPPORT_R } from './data.js';
import {
  BOSS2_SEND,
  ETYPES2,
  HACK2_CD,
  HACK2_R,
  MIRROR2_CD,
  MIRROR2_R,
  MIRROR2_STUN,
  QUAKE2_STUN,
  SABO_REACH,
  STUN_T,
  TWIN_HP2,
  VORTEX2_STUN,
  bossFodder,
  bossSabos,
  wave2,
} from './enemies.js';
import { stats2 } from './stats.js';

/* ================= WELT 2: Gitterfestung (Spiellogik) ================= */
export class Run2 extends Run {
  constructor(save, hooks) {
    super(save, hooks);
    const S = (this.S = stats2(save));
    this.world = 2;
    this.ET = ETYPES2; // eigene Gegnertabelle der Gitterfestung
    this.noImpulse = true; // die Gitterfestung kennt keinen Impuls (Vorgabe des Nutzers): kein Zeiger, kein Flächenangriff
    this.tsave = save.w2.towers;
    this.heroes = [];
    this.drones = [];
    this.w = 0;
    this.gain = {
      c: 0,
      m: 0,
    };
    this.energy = S.startEnergy;
    const hp = S.baseHp;
    this.base = {
      r: 30,
      max: hp,
      hp,
      shMax: hp * S.shieldPct,
      sh: hp * S.shieldPct,
      shDelay: 0,
      ov: 0,
      pulseT: 3,
      flash: 0,
      rot: 0,
      turrets: [
        {
          a: -Math.PI / 2,
          t: 0,
          aim: -Math.PI / 2,
        },
      ],
    };
    this.phase = 'build';
    this.buildT = S.buildTime + 5;
    this.moves = S.moves;
    this.dirs = [];
    this.preview = null;
    this.queue = [];
    this.prepareWave();
  }
  milestone(w) {
    const r = {
      k: 0,
      p: 0,
      m: 0,
    };
    if (this.world === 2 && w >= 10 && w % 10 === 0) {
      r.m = this.S.gM;
      this.gain.m += r.m;
    }
    return r;
  }
  hpScale(w) {
    return Math.pow(1.13, w - 1);
  }
  dmgScale(w) {
    return Math.pow(1.06, w - 1);
  }
  towerSlots() {
    return this.S.slots2;
  }
  towerStats(type, l) {
    const D = TOWERS[type],
      S = this.S;
    let r = D.r(l);
    const fx = {
      ...D.fx(l),
    };
    if (D.dmgTower) r *= S.tRange;
    else {
      r *= W2_SUPPORT_R * S.supR;
      const p = S.supPow;
      if (fx.slow) fx.slow = Math.min(0.75, fx.slow * p);
      if (fx.vuln) fx.vuln = 1 + (fx.vuln - 1) * p;
      if (fx.weak) fx.weak = Math.max(0.3, 1 - (1 - fx.weak) * p);
      if (fx.dur) fx.dur *= p;
    }
    return {
      r: Math.round(r),
      fx,
    };
  }
  energyMul(e) {
    return this.S.energyMul * (1 + 0.06 * (this.w - 1));
  }
  reward(e) {
    const S = this.S,
      w = this.w;
    this.gain.c += e.val * Math.pow(1.04, w - 1) * S.gC;
    if (e.elite && Math.random() < 0.02) {
      const m = S.gM;
      this.gain.m += m;
      this.num(e.x, e.y - e.r - 30, '+' + fmtN(Math.max(1, m)) + ' Matrixchip', '#ff6b84', true);
    }
    if (e.boss) {
      const m = (1 + Math.floor(w / 20)) * S.gM;
      this.gain.m += m;
      this.bossKills++;
      this.shake = Math.max(this.shake, 14);
      this.ring(e.x, e.y, 10, 180, '#ff6b84', 0.7, 12);
      this.num(e.x, e.y - 50, '+' + fmtN(Math.max(1, m)) + ' Matrixchips', '#ff6b84', true);
      this.h.banner && this.h.banner('Boss besiegt', '+' + fmtN(Math.max(1, m)) + ' Matrixchips');
    }
  }
  /* ---- Wellen mit Richtung, Umbau- und Kampfphase ---- */
  // Die Welle steht fest (wave2): Anzahl, Typen, Reihenfolge und Richtung hängen nur von der Wellennummer ab
  prepareWave() {
    const W = wave2(++this.w);
    this.queue = W.list.slice();
    this.dirs = W.dirs;
    this.twin2 = W.twin;
    this.spawnN = 0;
    this.preview = {
      w: W.w,
      n: W.list.length,
      types: W.types,
      boss: W.boss,
      twin: W.twin,
    };
    this.milestone(W.w);
  }
  startFight() {
    if (this.phase !== 'build') return;
    this.phase = 'fight';
    this.spawnT = 0.3;
    this.spawnI = Math.min(11, 7 + this.w * 0.1) / Math.max(1, this.queue.length);
    this.waveEndT = 0;
    this.h.banner &&
      this.h.banner(
        `Welle ${this.w}`,
        this.preview.twin ? 'Zwei Bosse nähern sich' : this.preview.boss ? 'Ein Boss nähert sich' : '',
      );
    this.h.sfx && this.h.sfx(this.preview.boss ? 'bosswave' : 'wave');
  }
  tickBuild(dt) {
    if (this.phase !== 'build' || this.over) return;
    this.buildT -= dt;
    if (this.buildT <= 0) this.startFight();
  }
  dirPt(a) {
    const W = this.hw + 40,
      H = this.hh + 40,
      c = Math.cos(a),
      s = Math.sin(a),
      t = Math.min(W / Math.abs(c || 1e-6), H / Math.abs(s || 1e-6));
    return [c * t, s * t];
  }
  updWaves(dt) {
    if (this.phase !== 'fight') return;
    if (this.queue.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        // Gruppen von 1, 2, 3, 1, 2, 3 … Gegnern; Richtung und Versatz folgen der Nummer der Gruppe, nicht dem Zufall
        const g = this.spawnN++,
          k = Math.min(this.queue.length, 1 + (g % 3)),
          boss = this.queue[0].type === 'boss',
          di = boss ? (this.queue[0].twin ? 1 : 0) : g % this.dirs.length,
          a = this.dirs[di] + (boss ? 0 : (((g * 0.618034) % 1) - 0.5) * 0.76),
          [x, y] = this.dirPt(a);
        for (let i = 0; i < (boss ? 1 : k); i++) {
          const q = this.queue.shift(),
            ox = boss ? 0 : (((g * 7 + i * 3) % 5) - 2) * 12,
            oy = boss ? 0 : (((g * 3 + i * 7) % 5) - 2) * 12;
          this.spawnEnemy(q.type, q.elite, x + ox, y + oy);
          if (q.type === 'pair') {
            const m1 = this.en[this.en.length - 1];
            this.spawnEnemy('pair', false, m1.x + 24, m1.y + 24);
            const m2 = this.en[this.en.length - 1];
            m1.mate = m2;
            m2.mate = m1;
          }
        }
        this.spawnT = boss ? 0.6 : this.spawnI * k;
      }
    } else if (this.en.length > 0) {
      this.waveEndT += dt;
      // Sturmregel: 20 s ohne Nachschub. Solange ein Boss lebt, gilt sie nicht – er schickt selbst Nachschub.
      if (this.waveEndT > 20 && !this.charge && !this.en.some(e => e.boss)) {
        this.charge = true;
        for (const e of this.en) {
          e.ranged = false;
          e.stop = 0; // auch Mörser und Scharfschützen geben ihre Stellung auf
          e.sp *= 1.6;
        }
        this.h.banner && this.h.banner('Sturmangriff', 'Die übrigen Gegner stürmen den Kern');
      }
    }
    if (!this.queue.length && this.en.length === 0) {
      this.charge = false;
      const bonus = Math.round((20 + 5 * this.w) * this.S.energyMul);
      this.energy += bonus;
      this.num(0, -60, '+' + fmtN(bonus) + ' Energie', '#ffe14f', true);
      this.phase = 'build';
      this.buildT = this.S.buildTime;
      this.moves = this.S.moves;
      for (const T of this.towers) T.stun = 0;
      this.zones.length = 0;
      this.prepareWave();
      this.h.sfx && this.h.sfx('buy');
    }
  }
  /* ---- Gegner der Gitterfestung: Angreifer betäuben Türme ---- */
  spawnEnemy(type, elite, x, y, shiny) {
    super.spawnEnemy(type, elite, x, y, shiny);
    const e = this.en[this.en.length - 1];
    if (type === 'boss' && this.twin2) e.hp = e.max = e.hp * TWIN_HP2;
    if (type === 'sabo') e.own = true;
    e.hk = HACK2_CD * rnd(0.5, 1); // Hacker: Zeit bis zur nächsten Betäubung
    e.m2 = -9; // Spiegel: Zeitpunkt der letzten Betäubung
    e.sn = 0; // Boss: Nummer des letzten Schubs
  }
  // Einzige Stelle, an der Türme betäubt werden – hier setzen später die Schutztürme an
  stunTower(T, sec, col) {
    if (!(sec > (T.stun || 0))) return;
    T.stun = T.stun0 = sec;
    T.beam = null;
    this.ring(T.x, T.y, 22, 6, col || '#ffe14f', 0.35, 4);
    this.h.sfx && this.h.sfx('down');
  }
  // nächster Turm um (x, y) innerhalb von r, der nicht ohnehin noch länger betäubt ist
  nearTower(x, y, r) {
    let b = null,
      bd = r * r;
    for (const T of this.towers) {
      if (T.stun > 1) continue;
      const q = sq(T.x - x) + sq(T.y - y);
      if (q < bd) {
        bd = q;
        b = T;
      }
    }
    return b;
  }
  // Saboteur: läuft zum nächsten wachen Turm, betäubt ihn und vergeht. Ohne Ziel greift er den Kern an wie ein Schwärmer.
  ownEnemy(e, dt) {
    const T = this.nearTower(e.x, e.y, 1e4);
    if (!T) return false;
    const dx = T.x - e.x,
      dy = T.y - e.y,
      d = hyp(dx, dy) || 1;
    if (d < SABO_REACH + e.r) {
      this.stunTower(T, STUN_T, e.col);
      this.burst(e.x, e.y, 10, e.col, 180, 0.35, 2);
      e.hp = 0;
      return true;
    }
    const v = e.sp * (e.spMul || 1) * (this.rushT > 0 ? 1.5 : 1) * dt;
    e.x += (dx / d) * v;
    e.y += (dy / d) * v;
    if (!this.headless) e.ang = Math.atan2(dy, dx);
    return true;
  }
  // Bosse kommen allein und schicken abwechselnd Kanonenfutter und Saboteure vor
  bossSummon(e) {
    e.sumT = BOSS2_SEND;
    e.sn++;
    const sabo = e.sn % 2 === 0 && this.towers.length > 0,
      n = sabo ? bossSabos(this.w) : bossFodder(this.w);
    for (let j = 0; j < n; j++) {
      const a = (j * 2 * Math.PI) / n + e.sn;
      this.spawnEnemy(sabo ? 'sabo' : 'swarm', false, e.x + Math.cos(a) * (e.r + 16), e.y + Math.sin(a) * (e.r + 16));
    }
    this.ring(e.x, e.y, e.r, e.r * 2.2, sabo ? '#ffe14f' : '#ff8a3d', 0.4, 5);
  }
  // Mörser zielt auf den nächsten Turm; der Einschlag betäubt (updZones)
  mortarPick(e) {
    return this.nearTower(e.x, e.y, MORTAR_RANGE);
  }
  // Scharfschütze zielt auf den Turm mit der höchsten Stufe, bei Gleichstand auf den nächsten
  snipePick(e) {
    let b = null,
      bl = -1,
      bd = Infinity;
    for (const T of this.towers) {
      if (T.stun > 1) continue;
      const q = sq(T.x - e.x) + sq(T.y - e.y);
      if (T.l > bl || (T.l === bl && q < bd)) {
        bl = T.l;
        bd = q;
        b = T;
      }
    }
    return b;
  }
  // In der Gitterfestung gibt es keine Helden und Drohnen: Was hier „Verbündete“ trifft, trifft einen Turm und betäubt ihn
  hurtAlly(T) {
    this.stunTower(T, STUN_T);
  }
  // Spiegel: Wird er getroffen, betäubt er kurz den nächsten Turm
  hitE(e, dmg, o) {
    const r = super.hitE(e, dmg, o);
    if (e.type === 'mirror' && !e.mute && this.t - e.m2 > MIRROR2_CD) {
      const T = this.nearTower(e.x, e.y, MIRROR2_R);
      if (T) {
        e.m2 = this.t;
        this.stunTower(T, MIRROR2_STUN, e.col);
        this.headless ||
          this.bolts.push({
            pts: [
              [e.x, e.y],
              [T.x, T.y],
            ],
            l: 0,
            m: 0.2,
            col: e.col,
            w: 2,
          });
      }
    }
    return r;
  }
  // Granaten betäuben beim Einschlag alle Türme im Kreis
  updZones(dt) {
    for (const z of this.zones)
      if (z.kind === 'shell' && z.t - dt <= 0)
        for (const T of this.towers) if (hyp(T.x - z.x, T.y - z.y) < z.r + 14) this.stunTower(T, STUN_T, z.col);
    super.updZones(dt);
  }
  // Titan und Vortex treffen hier Türme statt Helden; die übrigen Fähigkeiten bleiben
  bossAbility(e, dm, allies) {
    if (e.name === 'Titan' || e.name === 'Vortex') {
      const R = e.name === 'Titan' ? BOSS_SHOCK_R : BOSS_PULL_R,
        col = e.name === 'Titan' ? '#ff6b84' : '#b98cff';
      for (const T of this.towers)
        if (hyp(T.x - e.x, T.y - e.y) < R) this.stunTower(T, e.name === 'Titan' ? QUAKE2_STUN : VORTEX2_STUN, col);
      this.ring(e.x, e.y, e.r, R, col, 0.5, 10);
      this.shake = Math.max(this.shake, 10);
      this.h.sfx && this.h.sfx(e.name === 'Titan' ? 'pulse' : 'whirl');
    } else super.bossAbility(e, dm, allies);
  }
  moveTower(T, x, y) {
    if (this.phase !== 'build' || this.moves <= 0) return false;
    if (!super.moveTower(T, x, y)) return false;
    this.moves--;
    return true;
  }
  /* ---- Schadenstürme ---- */
  updTowers(dt) {
    // Betäubung läuft ab; Türme in einer Giftwolke fallen aus, solange sie steht; Hacker betäuben in Abständen
    for (const T of this.towers) {
      if (T.stun > 0) T.stun -= dt;
      for (const z of this.zones)
        if (z.kind === 'gas' && hyp(T.x - z.x, T.y - z.y) < GAS_R + 10 && !(T.stun > 0.3)) {
          T.stun = 0.3;
          T.stun0 = 0.3;
          T.beam = null;
        }
    }
    for (const e of this.en) {
      if (e.type !== 'hacker' || e.hp <= 0 || e.mute || e.frozen > 0) continue;
      e.hk -= dt;
      if (e.hk > 0) continue;
      const T = this.nearTower(e.x, e.y, HACK2_R);
      if (!T) {
        e.hk = 0.5;
        continue;
      }
      e.hk = HACK2_CD;
      this.stunTower(T, STUN_T, e.col);
      this.headless ||
        this.bolts.push({
          pts: [
            [e.x, e.y],
            [T.x, T.y],
          ],
          l: 0,
          m: 0.25,
          col: e.col,
          w: 2,
        });
    }
    super.updTowers(dt);
    const S = this.S,
      cm = S.comboMul;
    for (const e of this.en) {
      if (e.acid > 0 && e.hp > 0) {
        e.acid -= dt;
        e.hp -= e.max * (e.boss ? 0.004 : 0.02) * S.poisonMul * cm * dt;
        if (e.hp <= 0) this.kill(e);
      }
    }
    for (const T of this.towers) {
      const D = TOWERS[T.type];
      if (!D.dmgTower) continue;
      if (T.jam) {
        T.beam = null;
        continue;
      }
      const r2 = T.r * T.r;
      const inR = e => e.hp > 0 && sq(e.x - T.x) + sq(e.y - T.y) < r2 + e.r * e.r;
      const pick = () => {
        let b = null,
          bd = Infinity;
        for (const e of this.en) {
          if (!inR(e)) continue;
          const d = e.x * e.x + e.y * e.y;
          if (d < bd) {
            bd = d;
            b = e;
          }
        }
        return b;
      };
      if (T.type === 'laser') {
        if (!(T.tg && inR(T.tg))) T.tg = pick();
        const e = T.tg;
        T.beam = e || null;
        if (!e) continue;
        let m = 1,
          crit = false;
        if (e.sF) m *= 1 + 0.6 * cm;
        if (e.sZ) {
          m *= 1 + 0.4 * cm;
          crit = true;
        }
        if (e.sK && e.frozen > 0) m *= 1 + 2 * cm;
        const d = T.fx.dps * S.tDmg * S.laserDmg * S.tRate * m * dt;
        this.hitE(e, d, {
          num: false,
        });
        T.acc = (T.acc || 0) + d;
        T.cd2 -= dt;
        if (T.cd2 <= 0) {
          T.cd2 = 0.4;
          if (T.acc > 0)
            this.num(e.x, e.y - e.r - 4, fmtN(Math.max(1, T.acc)) + (crit ? '!' : ''), crit ? '#ffe14f' : T.col, crit);
          T.acc = 0;
          this.h.sfx && this.h.sfx('beam');
        }
      } else if (T.type === 'rocket') {
        T.cd2 -= dt * S.tRate;
        if (T.cd2 > 0) continue;
        let best = null,
          bn = -1;
        const cand = this.en.filter(inR);
        if (!cand.length) {
          T.cd2 = 0.2;
          continue;
        }
        for (const e of cand.length > 24 ? cand.slice(0, 24) : cand) {
          let n = 0;
          for (const o of cand) if (sq(o.x - e.x) + sq(o.y - e.y) < T.fx.splash * T.fx.splash) n++;
          if (n > bn) {
            bn = n;
            best = e;
          }
        }
        T.cd2 = T.fx.cd;
        T.aim = Math.atan2(best.y - T.y, best.x - T.x);
        this.shootAt(T.x, T.y, best, 380, T.fx.dmg * S.tDmg * S.rocketDmg, T.col, {
          size: 5,
          splash: T.fx.splash,
          num: true,
        });
        this.h.sfx && this.h.sfx('turret');
      } else if (T.type === 'tesla') {
        T.cd2 -= dt * S.tRate;
        if (T.cd2 > 0) continue;
        const e = pick();
        if (!e) {
          T.cd2 = 0.15;
          continue;
        }
        T.cd2 = T.fx.cd;
        const n = T.fx.chain + (e.sF ? Math.round(2 * cm) : 0),
          d = T.fx.dmg * S.tDmg * S.teslaDmg * (e.sZ ? 1 + 0.6 * cm : 1),
          stun = e.sK;
        this.chain([T.x, T.y], e, d, n, T.col, {
          col: T.col,
          each: o => {
            if (stun && !o.boss) o.frozen = Math.max(o.frozen || 0, 0.4);
          },
        });
        T.zap = 0.15;
        this.h.sfx && this.h.sfx('zap');
      }
    }
    for (const T of this.towers) if (T.zap > 0) T.zap -= dt;
  }
  explodeAt(p, first) {
    const S = this.S,
      big = first.sK ? 1.5 : 1,
      R = p.o.splash * big;
    const hit = this.aoe(p.x, p.y, R, p.dmg, {
      col: p.col,
      num: true,
    });
    for (const e of hit) {
      if (first.sF && !e.boss) e.frozen = Math.max(e.frozen || 0, 0.6 * S.freezeMul);
      if (first.sZ) e.acid = 3;
    }
    this.ring(p.x, p.y, 6, R, p.col, 0.35, 6);
    this.burst(p.x, p.y, 14, p.col, 220, 0.4, 3);
    this.shake = Math.max(this.shake, 2);
    this.h.sfx && this.h.sfx('kill');
  }
  end() {
    super.end();
    this.gain = {
      c: Math.floor(this.gain.c || 0),
      m: Math.floor(this.gain.m || 0),
    };
  }
}
