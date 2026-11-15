import { hyp } from '../core/util.js';
import { GAS_PCT } from '../data/enemies.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runZonesMethods = {
  /* ---------- Zonen: angekündigte Granaten (shell) und Giftwolken (gas) treffen nur Helden und Drohnen ---------- */ updZones(
    dt,
  ) {
    if (!this.zones.length) return;
    for (const z of this.zones) {
      z.t -= dt;
      const hit = z.kind === 'gas' || z.t <= 0;
      if (!hit) continue;
      for (const a of this.heroes)
        if (!(a.dead > 0) && hyp(a.x - z.x, a.y - z.y) < z.r + a.r)
          this.hurtAlly(a, z.kind === 'gas' ? a.max * GAS_PCT * dt : z.dmg);
      for (const a of this.drones)
        if (a.hp > 0 && hyp(a.x - z.x, a.y - z.y) < z.r + a.r)
          this.hurtAlly(a, z.kind === 'gas' ? a.max * GAS_PCT * dt : z.dmg);
      if (z.kind === 'shell') {
        this.ring(z.x, z.y, 6, z.r + 8, z.col, 0.35, 8);
        this.burst(z.x, z.y, 14, z.col, 220, 0.4, 3);
        this.shake = Math.max(this.shake, 3);
        this.h.sfx && this.h.sfx('killbig');
      }
    }
    this.zones = this.zones.filter(z => z.t > 0);
  },
};
