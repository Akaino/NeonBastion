import { hyp, sq } from '../core/util.js';
import { BEAT_N, MEGA_MUL } from '../data/balance.js';
import { SHADE_MUL, SHADE_R } from '../data/enemies.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runImpulseMethods = {
  shaded(x, y) {
    for (const e of this.en)
      if (e.type === 'shade' && e.hp > 0 && !e.mute && hyp(e.x - x, e.y - y) < SHADE_R) return true;
    return false;
  },
  tap(x, y) {
    if (this.over) return;
    const S = this.S,
      n = ++this.imps;
    this.taps = n;
    let dmg = S.tapDmg * S.impMul,
      beat = false;
    if (S.beat && n % BEAT_N === 0) {
      dmg *= 1 + S.beat;
      beat = true;
    }
    if (S.megaTap && n % S.megaTap === 0) {
      for (const e of this.en)
        if (e.hp > 0)
          this.hitE(e, dmg * MEGA_MUL, {
            col: '#ffe14f',
            big: true,
            imp: true,
          });
      this.ring(0, 0, 20, Math.max(this.hw, this.hh) * 1.4, '#ffe14f', 0.8, 14);
      this.shake = Math.max(this.shake, 12);
      this.h.sfx && this.h.sfx('pulse');
      this.dropTap(null);
      return 1;
    }
    const crit = Math.random() < S.tapCrit;
    if (crit) dmg *= 2.5;
    const over = S.overload && n % 10 === 0;
    let r = S.tapR;
    if (over) {
      dmg *= 4 + 2 * S.overload;
      r = Math.max(r, 90);
    }
    if (this.shaded(x, y)) r *= this.S.shadeMul || SHADE_MUL;
    const hit = this.aoe(x, y, r, dmg, {
      col: beat ? '#ff4fd8' : '#ffffff',
      crit,
      big: over || beat,
      imp: true,
    });
    this.dropTap(x, y, r);
    this.ring(
      x,
      y,
      4,
      r + 6,
      over ? '#ff8a3d' : beat ? '#ff4fd8' : '#ffffff',
      over || beat ? 0.45 : 0.25,
      over || beat ? 8 : 3,
    );
    if (over) {
      this.shake = Math.max(this.shake, 8);
      this.burst(x, y, 24, '#ff8a3d', 260, 0.5);
    }
    if (S.chain && hit.length) {
      const f = hit[0];
      let nx = null,
        nd = 130 * 130;
      for (const e of this.en) {
        if (e.hp <= 0 || hit.includes(e)) continue;
        const d = sq(e.x - f.x) + sq(e.y - f.y);
        if (d < nd) {
          nd = d;
          nx = e;
        }
      }
      if (nx)
        this.chain([f.x, f.y], nx, dmg * 0.5, S.chain - 1, '#ff8a3d', {
          col: '#ff8a3d',
          imp: true,
        });
    }
    if (hit.length && this.h.sfx) this.h.sfx(crit || over || beat ? 'crit' : 'tap');
    return hit.length;
  },
};
