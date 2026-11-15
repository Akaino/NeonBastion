import { TAU, clamp, hyp, rnd } from '../core/util.js';
import {
  BOMB_BOSS,
  BOMB_PCT,
  BOMB_R,
  DROPS,
  DROP_DUR,
  DROP_HITS,
  DROP_IDS,
  DROP_LIFE,
  DROP_R,
  DROP_REPAIR,
} from '../data/drops.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runDropsMethods = {
  // Impuls am Zeiger (Fokus-Ast). Zähler laufen immer weiter, auch wenn nichts getroffen wird.
  /* ---------- Abwürfe ---------- */
  spawnDrop(x, y, kind) {
    const mx = Math.max(60, (this.hw || 330) - 40),
      my = Math.max(60, (this.hh || 700) - 40);
    x = clamp(x, -mx, mx);
    y = clamp(y, -my, my);
    const d = hyp(x, y);
    if (d < 70) {
      const a = d > 1 ? Math.atan2(y, x) : rnd(0, TAU);
      x = Math.cos(a) * 70;
      y = Math.sin(a) * 70;
    }
    kind = kind || DROP_IDS[Math.floor(Math.random() * DROP_IDS.length)];
    this.drops.push({
      x,
      y,
      kind,
      col: DROPS[kind].col,
      hits: 0,
      life: DROP_LIFE,
      t: 0,
      flash: 0,
    });
    this.ring(x, y, 6, 60, DROPS[kind].col, 0.6, 5);
    this.h.banner && this.h.banner('Abwurf', DROPS[kind].name + ' · ' + DROP_HITS + ' Impulse');
    this.h.sfx && this.h.sfx('abil');
  },
  dropTap(x, y, r) {
    if (!this.drops.length) return;
    let used = false;
    for (const d of this.drops) {
      if (x === null || hyp(d.x - x, d.y - y) < r + DROP_R) {
        d.hits++;
        d.life = DROP_LIFE;
        d.flash = 0.15;
        if (d.hits >= DROP_HITS) {
          d.life = 0;
          used = true;
          this.useDrop(d);
        }
      } else d.hits = 0;
    }
    if (used) this.drops = this.drops.filter(d => d.life > 0);
  },
  useDrop(d) {
    const D = DROPS[d.kind];
    this.dropN++;
    this.h.banner && this.h.banner(D.name, D.text);
    this.ring(d.x, d.y, 8, 90, D.col, 0.5, 8);
    this.burst(d.x, d.y, 20, D.col, 240, 0.5);
    if (d.kind === 'bomb') {
      const hit = [];
      this.query(d.x, d.y, BOMB_R + 40, e => {
        if (e.hp > 0 && hyp(e.x - d.x, e.y - d.y) < BOMB_R + e.r) hit.push(e);
      });
      for (const e of hit)
        this.hitE(e, e.max * (e.boss ? BOMB_BOSS : BOMB_PCT), {
          col: D.col,
          big: true,
        });
      this.ring(d.x, d.y, 20, BOMB_R, D.col, 0.6, 14);
      this.shake = Math.max(this.shake, 12);
      this.h.sfx && this.h.sfx('pulse');
    } else {
      this.buff[d.kind] = DROP_DUR;
      this.h.sfx && this.h.sfx('abil');
    }
  },
  updDrops(dt) {
    const B = this.buff;
    for (const k in B) if (B[k] > 0) B[k] -= dt;
    if (B.repair > 0) {
      const b = this.base;
      if (b.hp < b.max) b.hp = Math.min(b.max, b.hp + b.max * DROP_REPAIR * dt);
    }
    if (this.drops.length) {
      for (const d of this.drops) {
        d.life -= dt;
        d.t += dt;
        d.flash -= dt;
      }
      this.drops = this.drops.filter(d => d.life > 0);
    }
  },
};
