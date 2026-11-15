import { fmtN } from '../core/format.js';
import { hyp, sq } from '../core/util.js';
import { ENGI_AMP } from '../data/balance.js';
import { JAM_R } from '../data/enemies.js';
import { BUILD_GAP_BASE, BUILD_GAP_TOWER, SLOT_BASE, TOWERS, TOWER_MAX } from '../data/towers.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runTowersMethods = {
  towerSlots() {
    return SLOT_BASE + (this.save.tslots || 0);
  },
  towerStats(type, l) {
    const D = TOWERS[type];
    return {
      r: D.r(l),
      fx: D.fx(l),
    };
  },
  buildCost(type) {
    return Math.round(TOWERS[type].cost * Math.pow(1.4, this.towers.length));
  },
  // Warum hier kein Turm stehen darf: 'base' (zu nah an der Basis), 'tower' (zu nah an einem Turm), 'edge' (außerhalb des Felds) oder '' (frei)
  placeBlock(x, y, ign) {
    if (hyp(x, y) < BUILD_GAP_BASE) return 'base';
    for (const T of this.towers) if (T !== ign && hyp(T.x - x, T.y - y) < BUILD_GAP_TOWER) return 'tower';
    return Math.abs(x) < this.hw - 10 && Math.abs(y) < this.hh - 10 ? '' : 'edge';
  },
  canPlace(x, y, ign) {
    return !this.placeBlock(x, y, ign);
  },
  place(type, x, y) {
    const c = this.buildCost(type);
    if (this.energy < c || this.towers.length >= this.towerSlots() || !this.canPlace(x, y)) return false;
    const D = TOWERS[type],
      l = this.tsave[type].l,
      ts = this.towerStats(type, l);
    this.energy -= c;
    this.towers.push({
      type,
      x,
      y,
      l,
      l0: l,
      spent: c,
      r: ts.r,
      fx: ts.fx,
      col: D.col,
      cd2: 0,
      cd: 1.5,
      pulse: 0,
      born: 0,
    });
    this.ring(x, y, 6, ts.r, D.col, 0.6, 6);
    this.burst(x, y, 20, D.col, 220, 0.5);
    this.h.sfx && this.h.sfx('build');
    return true;
  },
  upCost(T) {
    return Math.round(TOWERS[T.type].cost * 0.8 * Math.pow(1.6, T.l - T.l0 + 1));
  },
  refund(T) {
    return Math.floor(T.spent * 0.5);
  },
  upgradeTower(T) {
    if (T.l >= TOWER_MAX) return false;
    const c = this.upCost(T);
    if (this.energy < c) return false;
    this.energy -= c;
    T.spent += c;
    T.l++;
    const ts = this.towerStats(T.type, T.l);
    T.r = ts.r;
    T.fx = ts.fx;
    T.born = 0;
    this.ring(T.x, T.y, 6, T.r, T.col, 0.5, 5);
    this.burst(T.x, T.y, 14, T.col, 200, 0.4);
    this.h.sfx && this.h.sfx('buy');
    return true;
  },
  moveTower(T, x, y) {
    if (!this.canPlace(x, y, T)) return false;
    this.burst(T.x, T.y, 10, T.col, 160, 0.3);
    T.x = x;
    T.y = y;
    T.born = 0;
    this.ring(x, y, 6, T.r, T.col, 0.4, 4);
    this.h.sfx && this.h.sfx('build');
    return true;
  },
  sellTower(T) {
    this.energy += this.refund(T);
    this.towers = this.towers.filter(t => t !== T);
    this.burst(T.x, T.y, 18, T.col, 220, 0.5);
    this.h.sfx && this.h.sfx('down');
  },
  updTowers(dt) {
    // 1) Zurücksetzen und sammeln, welche Türme jeden Gegner erreichen
    for (const e of this.en) {
      e.mute = false;
      e.mark = 1;
      e.spMul = 1;
      e.vuln = 1;
      e.dmgMul = 1;
      e.critB = 0;
      e.combo = 0;
      e.perma = false;
      e.shat = false;
      e.nullp = false;
      e.tw ? (e.tw.length = 0) : (e.tw = []);
      if (e.frozen > 0) e.frozen -= dt;
      if (e.chill > 0) e.chill -= dt;
      if (e.frzImm > 0) e.frzImm -= dt;
    }
    // Stör-Türme zuerst: Sie lassen sich nicht abschalten und nehmen auch Störsendern die Wirkung. Tarner und Phasenläufer werden sichtbar.
    for (const T of this.towers) {
      if (T.type !== 'mute') continue;
      T.pulse += dt;
      T.born += dt;
      T.jam = false;
      const r2 = T.r * T.r;
      for (const e of this.en) {
        if (e.hp <= 0 || e.boss || e.down > 0) continue;
        if (sq(e.x - T.x) + sq(e.y - T.y) < r2 + e.r * e.r) {
          e.mute = true;
          if (e.cloak) e.cloak = false;
        }
      }
    }
    const jam = this.en.filter(e => e.type === 'jammer' && e.hp > 0 && !e.mute);
    for (const T of this.towers) {
      if (T.type === 'mute') continue;
      T.pulse += dt;
      T.born += dt;
      // T.stun: Betäubung durch Angreifer – gibt es nur in der Gitterfestung, im Neon-Sektor bleibt das Feld leer
      T.jam = (jam.length > 0 && jam.some(j => hyp(j.x - T.x, j.y - T.y) < JAM_R)) || T.stun > 0;
      if (T.jam) continue;
      const r2 = T.r * T.r;
      if (T.type === 'mark') {
        for (const e of this.en) {
          if (e.hp <= 0 || e.cloak) continue;
          if (sq(e.x - T.x) + sq(e.y - T.y) < r2 + e.r * e.r && T.fx.mark > e.mark) e.mark = T.fx.mark;
        }
        continue;
      }
      for (const e of this.en) {
        if (e.hp <= 0 || e.cloak) continue;
        const d = sq(e.x - T.x) + sq(e.y - T.y);
        if (d < r2 + e.r * e.r) e.tw.push(T);
      }
    }
    // 2) Effekte addieren (max. 3 Türme) und Kombinationen bestimmen
    for (const e of this.en) {
      const tw = e.tw;
      e.sF = e.sZ = e.sK = false;
      if (!tw.length) continue;
      for (const T of tw) {
        if (T.type === 'frost') e.sF = true;
        else if (T.type === 'weak') e.sZ = true;
        else if (T.type === 'cryo') e.sK = true;
      }
      for (let i = tw.length - 1; i >= 0; i--) if (TOWERS[tw[i].type].dmgTower) tw.splice(i, 1);
      if (!tw.length) continue;
      if (tw.length > 3) {
        tw.sort((a, b) => b.l - a.l);
        tw.length = 3;
      }
      let f = 0,
        z = 0,
        k = 0;
      const sl = [],
        vu = [],
        rd = [],
        DIM = [1, 0.5, 0.25];
      for (const T of tw) {
        if (T.type === 'frost') {
          f++;
          sl.push(T.fx.slow);
        } else if (T.type === 'weak') {
          z++;
          vu.push(T.fx.vuln - 1);
          rd.push(1 - T.fx.weak);
        } else k++;
      }
      const dimSum = a => a.sort((x, y) => y - x).reduce((s, v, i) => s + v * DIM[i], 0);
      let slow = dimSum(sl);
      if (e.boss) slow *= 0.5;
      e.spMul = 1 - Math.min(0.65, slow);
      e.vuln = 1 + Math.min(0.8, dimSum(vu));
      e.dmgMul = 1 - Math.min(0.5, dimSum(rd));
      const amp = n => (n >= 3 ? 1.5 : 1);
      let cm = 0;
      if (f >= 2) {
        cm |= 1;
        e.kbT = (e.kbT || 0) - dt;
        if (e.kbT <= 0) {
          e.kbT = 2.4;
          if (!e.boss && !this.charge) {
            const L = hyp(e.x, e.y) || 1;
            e.x += (e.x / L) * 10 * amp(f);
            e.y += (e.y / L) * 10 * amp(f);
            this.burst(e.x, e.y, 3, '#7fd0ff', 120, 0.25, 2);
          }
        }
      }
      if (f && z) {
        cm |= 2;
        const dps =
          e.max * (e.boss ? 0.003 : 0.015) * (f + z >= 3 ? 1.5 : 1) * (this.S.poisonMul || 1) * (this.S.comboMul || 1);
        e.hp -= dps * dt;
        e.psn = (e.psn || 0) + dps * dt;
        e.psT = (e.psT || 0) + dt;
        if (e.psT > 1.2) {
          this.num(e.x, e.y - e.r - 4, fmtN(Math.max(1, e.psn)), '#8cff4f', false);
          e.psn = 0;
          e.psT = 0;
        }
        if (e.hp <= 0) {
          this.kill(e);
          continue;
        }
      }
      if (z >= 2) {
        cm |= 4;
        e.vuln += 0.1 * amp(z) * (this.S.comboMul || 1);
        e.critB = 0.1 * amp(z);
      }
      if (f && k) {
        cm |= 8;
        e.perma = true;
      }
      if (z && k) {
        cm |= 16;
        e.shat = true;
      }
      if (k >= 2) {
        cm |= 32;
        e.nullp = true;
      }
      e.combo = cm;
    }
    if (this.ampT > 0) {
      this.ampT -= dt;
      for (const e of this.en) if (e.tw.length || e.mute || e.mark > 1) e.vuln *= ENGI_AMP;
    } // Verstärker der Ingenieurin
    // 3) Kryo-Türme frieren ein (mit Kombinations-Boni)
    for (const T of this.towers) {
      if (T.type !== 'cryo' || T.jam) continue;
      T.cd -= dt;
      if (T.cd > 0) continue;
      const r2 = T.r * T.r;
      let any = false;
      const fm = this.S.freezeMul || 1;
      for (const e of this.en) {
        if (e.hp <= 0 || e.frzImm > 0) continue;
        const d = sq(e.x - T.x) + sq(e.y - T.y);
        if (d >= r2 + e.r * e.r) continue;
        any = true;
        const dur = T.fx.dur * (e.perma ? 1.5 : 1) * fm;
        if (e.boss) e.chill = dur;
        else e.frozen = dur;
        e.frzImm = dur + 2;
        if (e.nullp) {
          this.hitE(e, e.max * (e.boss ? 0.01 : 0.04), {
            col: '#ffffff',
          });
          this.burst(e.x, e.y, 5, '#ffffff', 150, 0.3, 2);
        }
      }
      if (any) {
        T.cd = T.fx.cd;
        this.ring(T.x, T.y, 8, T.r, '#bff4ff', 0.45, 8);
        this.burst(T.x, T.y, 18, '#bff4ff', T.r * 2.2, 0.45, 2.5);
        this.h.sfx && this.h.sfx('freeze');
      } else T.cd = 0.25;
    }
    for (const e of this.en) if (e.chill > 0) e.spMul = Math.min(e.spMul, 0.5);
  },
};
