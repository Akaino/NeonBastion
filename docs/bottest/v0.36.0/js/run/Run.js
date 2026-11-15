import { stats } from '../core/stats.js';
import { PI, TAU, hyp, rnd, sq } from '../core/util.js';
import { AIM_STICK, BOOM_T, CELL } from '../data/balance.js';
import { CUR_IDS } from '../data/currencies.js';
import { DROP_HASTE } from '../data/drops.js';
import { ETYPES } from '../data/enemies.js';
import { runBaseMethods } from './base.js';
import { runCombatMethods } from './combat.js';
import { runDronesMethods } from './drones.js';
import { runDropsMethods } from './drops.js';
import { runEnemiesMethods } from './enemies.js';
import { runHeroesMethods } from './heroes.js';
import { runImpulseMethods } from './impulse.js';
import { runTowersMethods } from './towers.js';
import { runWavesMethods } from './waves.js';
import { runZonesMethods } from './zones.js';

export class Run {
  constructor(save, hooks) {
    this.save = save;
    this.S = stats(save);
    this.h = hooks || {};
    const S = this.S;
    this.t = 0;
    this.w = S.startWave - 1;
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
      turrets: [],
    };
    for (let i = 0; i < S.turrets; i++)
      this.base.turrets.push({
        a: (i / S.turrets) * TAU + PI / 4,
        t: Math.random(),
        aim: (i / S.turrets) * TAU + PI / 4,
      });
    this.en = [];
    this.heroes = [];
    this.drones = [];
    this.pr = [];
    this.ep = [];
    this.parts = [];
    this.nums = [];
    this.rings = [];
    this.bolts = [];
    this.slashes = [];
    this.ghosts = [];
    this.towers = [];
    this.energy = 30;
    this.tsave = save.towers;
    this.world = 1;
    this.gain = {
      s: 0,
      k: 0,
      p: 0,
      d: 0,
    };
    this.kills = 0;
    this.bossKills = 0;
    this.drops = [];
    this.dropN = 0;
    this.zones = [];
    this.engiAt = -9;
    this.ampT = 0;
    this.buff = {
      dmg: 0,
      haste: 0,
      repair: 0,
      gain: 0,
    };
    this.queue = [];
    this.spawnT = 0;
    this.spawnI = 1;
    this.waveGap = 1.5;
    this.waveEndT = 0;
    this.droneT = 0.4;
    this.droneIdx = 0;
    this.taps = 0;
    this.imps = 0;
    this.ET = ETYPES; // Gegnertabelle dieser Welt; Run2 setzt seine eigene Kopie ein
    this.killsBy = {};
    this.pend = [];
    this.rushT = 0;
    this.dcount = {};
    this.cx = 0;
    this.cy = -90;
    this.impT = S.impInt;
    this.shake = 0;
    this.over = false;
    this.overT = 0;
    this.hw = 400;
    this.hh = 400;
    this.grid = new Map();
    this.record = false;
    for (let w = 2; w <= this.w; w++) this.milestone(w);
    const team = save.team.filter(id => save.heroes[id] && save.heroes[id].u).slice(0, S.slots);
    team.forEach((id, i) => this.heroes.push(this.makeHero(id, i, team.length)));
  }
  /* ---------- helpers ---------- */
  key(cx, cy) {
    return (cx + 500) * 1000 + (cy + 500);
  }
  buildGrid() {
    const g = this.grid;
    for (const a of g.values()) a.length = 0;
    if (g.size > 4000) g.clear();
    for (const e of this.en) {
      if (e.hp <= 0) continue;
      const k = this.key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
      let a = g.get(k);
      if (!a) g.set(k, (a = []));
      a.push(e);
    }
  }
  query(x, y, r, fn) {
    const x0 = Math.floor((x - r) / CELL),
      x1 = Math.floor((x + r) / CELL),
      y0 = Math.floor((y - r) / CELL),
      y1 = Math.floor((y + r) / CELL);
    for (let cx = x0; cx <= x1; cx++)
      for (let cy = y0; cy <= y1; cy++) {
        const a = this.grid.get(this.key(cx, cy));
        if (a) for (const e of a) if (e.hp > 0) fn(e);
      }
  }
  nearest(x, y, R) {
    let b = null,
      bd = R * R;
    for (const e of this.en) {
      if (e.hp <= 0 || e.cloak) continue;
      const d = sq(e.x - x) + sq(e.y - y);
      if (d < bd) {
        bd = d;
        b = e;
      }
    }
    return b;
  }
  threat(R) {
    let b = null,
      bs = Infinity;
    for (const e of this.en) {
      if (e.hp <= 0 || e.cloak) continue;
      const d = hyp(e.x, e.y) - e.r;
      if (d > R) continue;
      // Fernkämpfer, die die Basis beschießen, zählen als besonders bedrohlich
      const s = d - (e.ranged && d < e.stop + 10 ? 150 : 0);
      if (s < bs) {
        bs = s;
        b = e;
      }
    }
    return b;
  }
  tscore(e) {
    const d = hyp(e.x, e.y) - e.r;
    return d - (e.ranged && d < e.stop + 10 ? 150 : 0);
  }
  // Ziel eines Helden: bleibt beim einmal gewählten Gegner, bis er tot oder außer Reichweite ist.
  // Gewechselt wird nur, wenn ein anderer deutlich bedrohlicher ist (z. B. ein Fernkämpfer, der die Basis beschießt).
  aim(h, R) {
    let t = h.tg;
    if (t && (t.hp <= 0 || hyp(t.x, t.y) - t.r > R + 40)) t = null;
    const n = this.threat(R);
    if (!t || (n && n !== t && this.tscore(n) < this.tscore(t) - AIM_STICK)) t = n;
    return (h.tg = t);
  }
  moveTo(h, tx, ty, dt, sp) {
    const dx = tx - h.x,
      dy = ty - h.y,
      d = hyp(dx, dy);
    if (d < 1) return;
    const s = Math.min(d, (sp || h.sp) * dt);
    h.x += (dx / d) * s;
    h.y += (dy / d) * s;
  }
  leash(o, R) {
    const d = hyp(o.x, o.y);
    if (d > R) {
      o.x *= R / d;
      o.y *= R / d;
    }
  }
  burst(x, y, n, col, sp = 180, life = 0.5, size = 3) {
    if (this.headless) return;
    if (this.parts.length > 420) n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU),
        s = rnd(0.3, 1) * sp;
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        l: 0,
        m: life * rnd(0.6, 1.2),
        col,
        s: size * rnd(0.7, 1.3),
      });
    }
  }
  num(x, y, t, col, big) {
    if (this.headless) return;
    if (this.nums.length < 70)
      this.nums.push({
        x: x + rnd(-6, 6),
        y,
        v: -46,
        l: 0,
        t,
        col,
        big,
      });
  }
  ring(x, y, r0, r1, col, m = 0.35, w = 6) {
    if (this.headless) return;
    if (this.rings.length < 40)
      this.rings.push({
        x,
        y,
        r0,
        r1,
        col,
        l: 0,
        m,
        w,
      });
  }
  /* ---------- towers ---------- */
  hpScale(w) {
    return Math.pow(1.15, w - 1) * Math.pow(1.08, Math.max(0, w - 35)) * Math.pow(1.06, Math.max(0, w - 60));
  }
  dmgScale(w) {
    return Math.pow(1.06, w - 1) * Math.pow(1.07, Math.max(0, w - 35)) * Math.pow(1.05, Math.max(0, w - 60));
  }
  end() {
    this.over = true;
    this.boomed = !!this.quit;
    if (this.quit) {
      this.burst(0, 0, 30, '#3df5ff', 260, 0.8, 4);
      this.ring(0, 0, 10, 200, '#3df5ff', 0.7, 8);
    } else {
      this.burst(0, 0, 26, '#ffffff', 240, 0.4, 3);
      this.shake = 9;
    }
    for (const c of CUR_IDS) this.gain[c] = Math.floor(this.gain[c]);
    this.h.sfx && this.h.sfx('lose');
  }

  /* ---------- waves ---------- */

  /* ---------- main ---------- */
  fx(dt) {
    for (const p of this.parts) {
      p.l += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 3;
      p.vy *= 1 - dt * 3;
    }
    this.parts = this.parts.filter(p => p.l < p.m);
    for (const n of this.nums) {
      n.l += dt;
      n.y += n.v * dt;
      n.v *= 1 - dt * 2.5;
    }
    this.nums = this.nums.filter(n => n.l < 0.9);
    for (const r of this.rings) r.l += dt;
    this.rings = this.rings.filter(r => r.l < r.m);
    for (const b of this.bolts) b.l += dt;
    this.bolts = this.bolts.filter(b => b.l < b.m);
    for (const s of this.slashes) s.l += dt;
    this.slashes = this.slashes.filter(s => s.l < s.m);
    for (const s of this.ghosts) s.l += dt;
    this.ghosts = this.ghosts.filter(s => s.l < s.m);
    this.shake *= Math.exp(-dt * 9);
  }
  step(dt) {
    if (this.over) {
      this.overT += dt;
      this.fx(dt);
      this.shake = Math.max(0, this.shake - dt * 26);
      if (!this.boomed && this.overT >= BOOM_T) {
        this.boomed = true;
        this.burst(0, 0, 90, '#3df5ff', 420, 1.3, 5);
        this.burst(0, 0, 50, '#ff4fd8', 320, 1.1, 4);
        this.burst(0, 0, 30, '#ffffff', 520, 0.7, 3);
        this.ring(0, 0, 10, 360, '#3df5ff', 1.1, 16);
        this.ring(0, 0, 10, 240, '#ff4fd8', 0.9, 10);
        this.ring(0, 0, 6, 130, '#ffffff', 0.5, 8);
        this.shake = 26;
        this.h.sfx && this.h.sfx('boss');
      }
      return;
    }
    this.t += dt;
    if (this.rushT > 0) this.rushT -= dt;
    this.src = 'basis';
    this.updBase(dt);
    this.updWaves(dt);
    this.src = 'tuerme';
    this.updTowers(dt);
    this.src = 'helden';
    this.updHeroes(dt);
    this.src = 'flotte';
    this.updDrones(dt);
    this.src = 'basis';
    if (this.S.autoRate > 0 && this.en.length) {
      this.autoT = (this.autoT || 0) - dt;
      if (this.autoT <= 0) {
        const tg = (this.S.autoAim && this.cluster()) || this.threat(420);
        if (tg) {
          this.autoShot(tg.x, tg.y);
          this.autoT = 1 / this.S.autoRate;
        }
      }
    }
    // Impuls am Zeiger: feste Taktung, unabhängig davon, ob dort Gegner stehen
    this.src = 'impuls';
    if (this.S.impInt > 0 && !this.noImpulse) {
      this.impT -= dt;
      for (let n = 0; this.impT <= 0 && n < 4; n++) {
        this.impT += this.S.impInt * (this.buff.haste > 0 ? DROP_HASTE : 1);
        this.tap(this.cx, this.cy);
      }
      if (this.impT < 0) this.impT = 0;
    }
    this.updDrops(dt);
    this.updEnemies(dt);
    this.updZones(dt);
    this.en = this.en.filter(e => e.hp > 0);
    this.buildGrid();
    if ((this.sepT = (this.sepT || 0) + 1) % 2 === 0) this.separate();
    this.updProj(dt);
    if (this.pend.length) {
      for (const [t, x, y, hp] of this.pend) {
        this.spawnEnemy(t, false, x, y);
        const m = this.en[this.en.length - 1];
        if (hp) {
          m.hp = m.max = hp;
        }
      }
      this.pend.length = 0;
    }
    this.en = this.en.filter(e => e.hp > 0);
    this.fx(dt);
  }
}

Object.assign(
  Run.prototype,
  runHeroesMethods,
  runCombatMethods,
  runTowersMethods,
  runBaseMethods,
  runWavesMethods,
  runDronesMethods,
  runEnemiesMethods,
  runDropsMethods,
  runZonesMethods,
  runImpulseMethods,
);
