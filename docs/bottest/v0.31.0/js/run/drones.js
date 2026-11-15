import { PI, TAU, hyp, rnd, sq } from '../core/util.js';
import {
  DRONES,
  DRONE_IDS,
  DRONE_PRIO,
  REPAIR_ALLY,
  REPAIR_BASE,
  REPAIR_R,
  droneLm,
  droneUnlocked,
  repairMul,
} from '../data/drones.js';
import { HACK_R } from '../data/enemies.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runDronesMethods = {
  /* ---------- drones ---------- */
  // Nächste Drohne bauen: die Klasse, die gemessen an der eingestellten Verteilung am weitesten zurückliegt
  spawnDrone() {
    const F = this.save.fleet,
      S = this.S,
      ids = F ? DRONE_IDS.filter(id => F[id] && F[id].p > 0 && droneUnlocked(this.save, id)) : [];
    let id = 'jaeger';
    const tot = ++this.droneIdx;
    if (ids.length) {
      let sum = 0,
        best = -Infinity;
      for (const i of ids) sum += F[i].p;
      for (const i of ids) {
        const def = (F[i].p / sum) * tot - (this.dcount[i] || 0);
        if (def > best) {
          best = def;
          id = i;
        }
      }
    }
    this.dcount[id] = (this.dcount[id] || 0) + 1;
    const D = DRONES[id],
      l = (F && F[id] && F[id].l) || 1,
      lm = droneLm(l),
      hp = S.droneHp * lm * D.hp;
    this.drones.push({
      cls: id,
      x: 0,
      y: 0,
      r: D.r,
      max: hp,
      hp,
      dmg: S.droneDmg * lm * D.dmg,
      rate: D.rate,
      sp: D.sp * (S.droneSp || 1),
      shots: D.shots || 1,
      splash: D.splash || 0,
      heal: id === 'repair' ? repairMul(l) : 0,
      healT: rnd(0.2, 1),
      atkT: 0.5,
      big: id === 'kreuzer',
      orb: rnd(0, TAU),
      off: rnd(0, TAU),
      flash: 0,
      col: D.col,
      face: 0,
    });
    this.ring(0, 0, 10, 36, D.col, 0.3, 3);
  },
  updDrones(dt) {
    const S = this.S,
      leash = 200 + (S.droneRange - 90);
    if (this.drones.length < S.drones) {
      this.droneT -= dt;
      if (this.droneT <= 0) {
        this.droneT = S.droneSpawn;
        this.spawnDrone();
      }
    }
    if (this.drones.length) for (const e of this.en) e.bd = hyp(e.x, e.y); // einmal pro Schritt statt einmal pro Drohne
    const hk = this.en.filter(e => e.type === 'hacker' && e.hp > 0 && !e.mute);
    for (const d of this.drones) {
      d.flash -= dt;
      d.atkT -= dt;
      if (S.droneRegen && d.hp < d.max) d.hp = Math.min(d.max, d.hp + d.max * S.droneRegen * dt);
      d.hack = hk.length > 0 && hk.some(e => hyp(e.x - d.x, e.y - d.y) < HACK_R);
      // Reparaturdrohne: kreist nah an der Basis, repariert sie und heilt Verbündete in ihrer Nähe
      if (d.heal) {
        d.healT -= dt;
        if (d.healT <= 0) {
          d.healT = 1;
          const b = this.base;
          if (b.hp < b.max) b.hp = Math.min(b.max, b.hp + b.max * REPAIR_BASE * d.heal);
          for (const a of this.heroes)
            if (!(a.dead > 0) && a.hp < a.max && hyp(a.x - d.x, a.y - d.y) < REPAIR_R)
              a.hp = Math.min(a.max, a.hp + a.max * REPAIR_ALLY * d.heal);
          for (const a of this.drones)
            if (a !== d && a.hp < a.max && hyp(a.x - d.x, a.y - d.y) < REPAIR_R)
              a.hp = Math.min(a.max, a.hp + a.max * REPAIR_ALLY * d.heal);
          this.ring(d.x, d.y, 4, 26, d.col, 0.4, 2);
        }
        d.orb += dt * 0.9;
        this.moveTo(d, Math.cos(d.orb) * 58, Math.sin(d.orb) * 58, dt, d.sp);
        d.face = d.orb + PI / 2;
        continue;
      }
      let tg = null,
        bd = Infinity;
      const pr = d.cls === 'abfang';
      for (const e of this.en) {
        if (e.hp <= 0 || e.cloak) continue;
        const bdist = e.bd;
        if (bdist > leash + S.droneRange * 0.9) continue;
        const dd =
          sq(e.x - d.x) +
          sq(e.y - d.y) * 1 -
          (e.ranged && bdist < e.stop + 10 ? 9000 : 0) -
          (pr && DRONE_PRIO[e.type] ? 60000 : 0);
        if (dd < bd) {
          bd = dd;
          tg = e;
        }
      }
      if (tg) {
        const dist = hyp(tg.x - d.x, tg.y - d.y);
        if (!this.headless) d.face = Math.atan2(tg.y - d.y, tg.x - d.x);
        if (dist > S.droneRange * 0.8)
          this.moveTo(d, tg.x + Math.cos(d.off) * 14, tg.y + Math.sin(d.off) * 14, dt, d.sp);
        if (dist <= S.droneRange && d.atkT <= 0 && !d.hack) {
          d.atkT = 1 / (1.2 * S.droneRate * d.rate);
          const dd_ = d.dmg * (1 + S.swarmInt * this.drones.length);
          if (d.splash) {
            this.headless ||
              this.bolts.push({
                pts: [
                  [d.x, d.y],
                  [tg.x, tg.y],
                ],
                l: 0,
                m: 0.14,
                col: d.col,
                w: 4,
              });
            this.aoe(tg.x, tg.y, d.splash, dd_, {
              num: false,
            });
            this.ring(tg.x, tg.y, 4, d.splash, d.col, 0.25, 3);
            this.h.sfx && this.h.sfx('turret');
          } else if (S.droneBeam) {
            for (let k = 0; k < d.shots && tg.hp > 0; k++)
              this.hitE(tg, dd_, {
                num: false,
              });
            this.headless ||
              this.bolts.push({
                pts: [
                  [d.x, d.y],
                  [tg.x, tg.y],
                ],
                l: 0,
                m: 0.12,
                col: d.col,
                w: 2,
              });
            this.h.sfx && this.h.sfx('beam');
          } else {
            for (let k = 0; k < d.shots; k++)
              this.shootAt(d.x + (k ? rnd(-5, 5) : 0), d.y + (k ? rnd(-5, 5) : 0), tg, 520, dd_, d.col, {
                num: false,
                size: d.shots > 1 ? 1.7 : 2.2,
              });
            this.h.sfx && this.h.sfx('drone');
          }
        }
      } else {
        d.orb += dt * 0.7;
        this.moveTo(d, Math.cos(d.orb) * 70, Math.sin(d.orb) * 70, dt, 90);
        d.face = d.orb + PI / 2;
      }
      this.leash(d, leash);
    }
    this.drones = this.drones.filter(d => d.hp > 0);
  },
};
