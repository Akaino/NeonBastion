import { fmtN } from '../core/format.js';
import { TAU, hyp, rnd, sq } from '../core/util.js';
import { ENGI_ENERGY } from '../data/balance.js';
import {
  EGG_HP,
  GAS_DUR,
  GAS_R,
  MIRROR_CD,
  MIRROR_PCT,
  MIRROR_R,
  MITE_HP,
  REV_DOWN,
  TANK_CAP,
} from '../data/enemies.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runCombatMethods = {
  aoe(x, y, r, dmg, o = {}) {
    const hit = [];
    this.query(x, y, r + 40, e => {
      if (e === o.skip) return;
      if (hyp(e.x - x, e.y - y) < r + e.r) hit.push(e);
    });
    for (const e of hit) {
      this.hitE(e, dmg, o);
      if (o.kb) this.knock(e, o.kb[0], o.kb[1], o.kb[2]);
    }
    return hit;
  },
  knock(e, fx, fy, d) {
    if (e.boss || e.heavy || e.hp <= 0) return;
    const dx = e.x - fx,
      dy = e.y - fy,
      L = hyp(dx, dy) || 1;
    e.x += (dx / L) * d;
    e.y += (dy / L) * d;
  },
  shoot(x, y, a, sp, dmg, col, o = {}) {
    if (this.pr.length > 320) return;
    this.pr.push({
      x,
      y,
      tx: x,
      ty: y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      sp,
      dmg,
      col,
      tg: o.tg || null,
      size: o.size || 3,
      pierce: o.pierce || 0,
      hitSet: o.pierce ? new Set() : null,
      life: 1.6,
      o,
      src: this.src,
    });
  },
  shootAt(x, y, tg, sp, dmg, col, o = {}) {
    o.tg = tg;
    this.shoot(x, y, Math.atan2(tg.y - y, tg.x - x), sp, dmg, col, o);
  },
  /* ---------- damage ---------- */ hitE(e, dmg, o = {}) {
    if (e.hp <= 0 || e.cloak) return;
    if (e.sh > 0) {
      e.sh--;
      e.flash = 0.08;
      if (!this.headless) {
        this.burst(e.x, e.y, e.sh ? 3 : 10, '#9fd8ff', e.sh ? 120 : 200, 0.25, 2);
        if (!e.sh) this.ring(e.x, e.y, e.r, e.r * 2.4, '#9fd8ff', 0.3, 4);
      }
      return;
    }
    dmg *= e.vuln || 1;
    if (o.imp) {
      if (e.mark > 1) dmg *= e.mark;
      if (e.boss || e.elite) dmg *= 1 + (this.S.impBig || 0);
    }
    if (this.buff.dmg > 0) dmg *= 2;
    if (e.armorT > 0) dmg *= 0.2;
    if (e.type === 'tank') dmg = Math.min(dmg, e.max * TANK_CAP);
    if (e.shat && e.frozen > 0) dmg *= 2;
    let cr = o.crit;
    if (e.critB && Math.random() < e.critB) {
      dmg *= 2;
      cr = true;
    }
    if (this.tally) this.tally[this.src] = (this.tally[this.src] || 0) + Math.min(dmg, e.hp) / e.max;
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.type === 'mirror' && !e.mute && this.t - e.mirT > MIRROR_CD) {
      e.mirT = this.t;
      let a = null,
        bd = MIRROR_R * MIRROR_R;
      for (const h of this.heroes) {
        if (h.dead > 0) continue;
        const q = sq(h.x - e.x) + sq(h.y - e.y);
        if (q < bd) {
          bd = q;
          a = h;
        }
      }
      for (const h of this.drones) {
        const q = sq(h.x - e.x) + sq(h.y - e.y);
        if (q < bd) {
          bd = q;
          a = h;
        }
      }
      if (a) {
        this.hurtAlly(a, a.max * MIRROR_PCT);
        this.headless ||
          this.bolts.push({
            pts: [
              [e.x, e.y],
              [a.x, a.y],
            ],
            l: 0,
            m: 0.15,
            col: e.col,
            w: 2,
          });
      }
    }
    if (!this.headless && (o.num !== false || cr))
      this.num(
        e.x,
        e.y - e.r - 4,
        fmtN(Math.max(1, dmg)) + (cr ? '!' : ''),
        cr ? '#ffe14f' : o.col || '#d6fdff',
        !!(cr || o.big),
      );
    if (e.hp <= 0) this.kill(e);
  },
  kill(e) {
    // Wiedergänger: beim ersten Tod bleibt er kurz liegen (unangreifbar) und steht mit halbem Leben wieder auf
    if (e.type === 'revenant' && !e.rev) {
      e.rev = true;
      e.hp = e.max * 0.5;
      e.down = REV_DOWN;
      e.cloak = true;
      this.burst(e.x, e.y, 8, e.col, 160, 0.4, 2);
      return;
    }
    this.kills++;
    this.energy +=
      e.val * this.energyMul(e) * (this.t - this.engiAt < 0.2 ? ENGI_ENERGY : 1) * (this.S.energyGain || 1);
    const kb = this.killsBy;
    kb[e.type] = (kb[e.type] || 0) + 1;
    if (e.elite) kb.elite = (kb.elite || 0) + 1;
    if (e.boss) {
      kb['boss:' + e.name] = (kb['boss:' + e.name] || 0) + 1;
      if (this.twin && ++this.twinDown === 2) kb.twin = (kb.twin || 0) + 1;
    }
    if (e.shiny) {
      kb['shiny:' + e.type] = (kb['shiny:' + e.type] || 0) + 1;
      this.ring(e.x, e.y, e.r, e.r * 5, '#ffffff', 0.7, 8);
      this.h.banner && this.h.banner('Schillernd!', this.ET[e.type].name + ' besiegt');
      this.h.sfx && this.h.sfx('abil');
    }
    if (e.type === 'brooder') this.pend.push(['egg', e.x, e.y, e.max * EGG_HP]);
    if (e.type === 'gas') {
      this.zones.push({
        kind: 'gas',
        x: e.x,
        y: e.y,
        r: GAS_R,
        t: GAS_DUR,
        col: e.col,
      });
      this.ring(e.x, e.y, 8, GAS_R, e.col, 0.5, 5);
    }
    if (e.type === 'splitter')
      for (let i = 0; i < 3; i++) {
        const a = (i * TAU) / 3 + rnd(0, 1);
        this.pend.push(['mite', e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, e.max * MITE_HP]);
      }
    this.burst(e.x, e.y, e.boss ? 60 : e.elite ? 22 : 8, e.col, e.boss ? 320 : 200, e.boss ? 0.9 : 0.5, e.boss ? 5 : 3);
    this.reward(e);
    if (e.drop) this.spawnDrop(e.x, e.y);
    this.h.sfx && this.h.sfx(e.boss ? 'boss' : e.elite || e.type === 'brute' ? 'killbig' : 'kill');
  },
  energyMul(e) {
    return 1;
  },
  reward(e) {
    const S = this.S,
      w = this.w;
    this.gain.s += e.val * Math.pow(1.025, w - 1) * S.gS * S.gAll * (this.buff.gain > 0 ? 2 : 1);
    if (e.elite && Math.random() < S.prismChance) {
      const p = S.gP;
      this.gain.p += p;
      this.num(e.x, e.y - e.r - 34, '+' + fmtN(Math.max(1, p)) + ' ' + (p < 2 ? 'Prisma' : 'Prismen'), '#ff4fd8', true);
    }
    if (e.elite && Math.random() < 0.55) {
      const k = S.gK * S.gAll;
      this.gain.k += k;
      this.num(e.x, e.y - e.r - 18, '+' + fmtN(Math.max(1, k)) + ' ' + (k < 2 ? 'Kern' : 'Kerne'), '#8cff4f', true);
      this.ring(e.x, e.y, 4, 40, '#8cff4f', 0.45, 4);
    }
    if (e.boss) {
      const p = (1 + Math.floor(w / 25)) * S.gP;
      this.gain.p += p;
      this.bossKills++;
      this.shake = Math.max(this.shake, 14);
      this.ring(e.x, e.y, 10, 180, '#ff4fd8', 0.7, 12);
      this.num(e.x, e.y - 50, '+' + fmtN(Math.max(1, p)) + ' ' + (p < 2 ? 'Prisma' : 'Prismen'), '#ff4fd8', true);
      // Sternenstaub: erster Bosssieg ab Welle 20 in diesem Zyklus, ab Welle 30 jeder Bosssieg
      const first = w > (this.save.cycleBest || 0);
      let d = 0;
      if (w >= 20 && first) d = (1 + S.gD) * S.gAll;
      else if (w >= 30) d = S.gAll;
      if (this.dustW === w) d = 0;
      if (d) {
        this.dustW = w;
        this.gain.d += d;
        this.ring(0, 0, 20, 400, '#ffe14f', 1, 10);
        this.num(e.x, e.y - 72, '+' + fmtN(d) + ' Sternenstaub', '#ffe14f', true);
      }
      this.h.banner &&
        this.h.banner(
          'Boss besiegt',
          (p < 2 ? '+1 Prisma' : '+' + fmtN(p) + ' Prismen') + (d ? ` und +${fmtN(d)} Sternenstaub` : ''),
        );
    }
  },
  /* ---------- projectiles ---------- */ updProj(dt) {
    const lim = Math.max(this.hw, this.hh) + 120;
    for (const p of this.pr) {
      p.life -= dt;
      if (p.tg && p.tg.hp > 0 && !p.pierce) {
        const dx = p.tg.x - p.x,
          dy = p.tg.y - p.y,
          d = hyp(dx, dy) || 1;
        p.vx += ((dx / d) * p.sp - p.vx) * Math.min(1, dt * 10);
        p.vy += ((dy / d) * p.sp - p.vy) * Math.min(1, dt * 10);
      }
      p.tx += (p.x - p.tx) * Math.min(1, dt * 18);
      p.ty += (p.y - p.ty) * Math.min(1, dt * 18);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let hitE = null;
      this.query(p.x, p.y, p.size + 20, e => {
        if (hitE || (p.hitSet && p.hitSet.has(e))) return;
        if (hyp(e.x - p.x, e.y - p.y) < e.r + p.size) hitE = e;
      });
      if (hitE && p.o.splash && this.explodeAt) {
        this.explodeAt(p, hitE);
        p.life = 0;
      } else if (hitE) {
        this.src = p.src;
        this.hitE(hitE, p.dmg, {
          num: p.o.num,
          col: p.col,
        });
        this.burst(p.x, p.y, 3, p.col, 120, 0.25, 2);
        if (p.pierce > 0) {
          p.pierce--;
          p.hitSet.add(hitE);
        } else p.life = 0;
      }
      if (Math.abs(p.x) > lim || Math.abs(p.y) > lim) p.life = 0;
    }
    this.pr = this.pr.filter(p => p.life > 0);
    for (const q of this.ep) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (hyp(q.x, q.y) < this.base.r + 4) {
        q.dead = 1;
        this.damageBase(q.dmg * (this.S.rangedRes || 1));
        this.burst(q.x, q.y, 5, q.col, 140, 0.3);
      }
    }
    this.ep = this.ep.filter(q => !q.dead);
  },
};
