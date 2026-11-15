import { hyp } from '../core/util.js';
import { AUTO_R } from '../data/balance.js';
import { jag } from './util.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runBaseMethods = {
  damageBase(d) {
    d *= this.S.dmgTaken;
    const b = this.base;
    let r = d;
    if (b.ov > 0) {
      const a = Math.min(b.ov, r);
      b.ov -= a;
      r -= a;
    }
    if (r > 0 && b.sh > 0) {
      const a = Math.min(b.sh, r);
      b.sh -= a;
      r -= a;
    }
    b.hp -= r;
    b.shDelay = 3;
    b.flash = 0.15;
    this.shake = Math.max(this.shake, r > 0 ? 5 : 2);
    this.h.sfx && this.h.sfx(r > 0 ? 'base' : 'shield');
    if (b.hp <= 0 && !this.over) {
      b.hp = 0;
      this.end();
    }
  },
  /* ---------- base ---------- */ updBase(dt) {
    const b = this.base,
      S = this.S;
    b.rot += dt * 0.6;
    b.flash -= dt;
    if (S.regen) b.hp = Math.min(b.max, b.hp + b.max * S.regen * dt);
    b.shDelay -= dt;
    if (b.shMax > 0 && b.shDelay <= 0) b.sh = Math.min(b.shMax, b.sh + b.shMax * 0.12 * this.S.shRegen * dt);
    if (b.ov > 0) b.ov = Math.max(0, b.ov - b.max * 0.04 * dt);
    for (const tu of b.turrets) {
      tu.t -= dt;
      const x = Math.cos(tu.a) * 44,
        y = Math.sin(tu.a) * 44,
        tg = this.nearest(x, y, S.turretRange);
      if (tg) {
        tu.aim = Math.atan2(tg.y - y, tg.x - x);
        if (tu.t <= 0) {
          tu.t = 1 / (1.5 * S.turretRate);
          this.shootAt(x + Math.cos(tu.aim) * 8, y + Math.sin(tu.aim) * 8, tg, 560, S.turretDmg, '#3df5ff', {
            num: false,
            size: 3,
          });
          this.h.sfx && this.h.sfx('turret');
        }
      }
    }
    if (S.pulse) {
      b.pulseT -= dt;
      if (b.pulseT <= 0) {
        let any = false;
        for (const e of this.en) {
          if (e.hp <= 0) continue;
          const d = hyp(e.x, e.y) || 1;
          if (d < S.pulseR + e.r) {
            any = true;
            if (!e.boss) {
              e.x += (e.x / d) * 35;
              e.y += (e.y / d) * 35;
            }
            this.hitE(e, S.pulseDmg + e.max * (S.pulsePct || 0) * (e.boss ? 0.2 : 1), {
              col: '#3df5ff',
            });
          }
        }
        if (any) {
          this.ring(0, 0, 30, S.pulseR + 15, '#3df5ff', 0.5, 10);
          b.pulseT = S.pulseCd;
          this.h.sfx && this.h.sfx('pulse');
        } else b.pulseT = 0.3;
      }
    }
  },
  /* ---------- tap ---------- */
  // Autofeuer der Basis (Basis-Ast): eigener Schaden wie die Geschütze, kleine Fläche, keine Sonderfähigkeiten des Zeigers
  autoShot(x, y) {
    if (this.over) return 0;
    const S = this.S,
      hit = this.aoe(x, y, AUTO_R, S.turretDmg * S.autoDmg, {
        col: '#3df5ff',
      });
    this.ring(x, y, 4, AUTO_R + 4, '#3df5ff', 0.2, 2);
    this.headless ||
      this.bolts.push({
        pts: jag(0, 0, x, y, 5, 5),
        l: 0,
        m: 0.12,
        col: '#3df5ff',
        w: 1.6,
      });
    this.h.sfx && this.h.sfx(hit.length ? 'drone' : 'tapmiss');
    return hit.length;
  },
};
