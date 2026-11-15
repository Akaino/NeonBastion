import { fmtN } from '../core/format.js';
import { TAU, hyp, rnd, sq } from '../core/util.js';
import { BOSS_ABIL_RANGE, BOSS_KINDS, BOSS_PULL_R, BOSS_SHOCK_R } from '../data/bosses.js';
import {
  CLOAK_R,
  CMD_DMG,
  CMD_R,
  CMD_SP,
  EGG_N,
  HEAL_PCT,
  HEAL_R,
  JUMP_CD,
  JUMP_D,
  MORTAR_CD,
  MORTAR_DELAY,
  MORTAR_MUL,
  MORTAR_R,
  MORTAR_RANGE,
  PAIR_HEAL,
  PAIR_RAGE,
  PHASE_OFF,
  PHASE_ON,
  QUEEN_CD,
  RAM_ACC,
  RAM_MAX,
  SNIPE_BASE,
  SNIPE_MUL,
  SNIPE_T,
  THIEF_PCT,
} from '../data/enemies.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runEnemiesMethods = {
  /* ---------- enemies ---------- */ updEnemies(dt) {
    const b = this.base,
      allies = [];
    for (const h of this.heroes) if (!(h.dead > 0)) allies.push(h);
    for (const d of this.drones) allies.push(d);
    // Rechteck um alle Verbündeten: Gegner außerhalb können niemanden berühren und überspringen die teure Einzelprüfung
    let ax0 = Infinity,
      ax1 = -Infinity,
      ay0 = Infinity,
      ay1 = -Infinity,
      ar = 0;
    for (const a of allies) {
      if (a.x < ax0) ax0 = a.x;
      if (a.x > ax1) ax1 = a.x;
      if (a.y < ay0) ay0 = a.y;
      if (a.y > ay1) ay1 = a.y;
      if (a.r > ar) ar = a.r;
    }
    const n0 = this.en.length;
    const cmd = this.en.filter(e => e.type === 'commander' && e.hp > 0 && !e.mute);
    for (let i = 0; i < n0; i++) {
      const e = this.en[i];
      if (e.hp <= 0) continue;
      e.flash -= dt;
      if (e.down > 0) {
        e.down -= dt;
        if (e.down <= 0) {
          e.down = 0;
          e.cloak = false;
          this.ring(e.x, e.y, 4, e.r * 3, e.col, 0.4, 4);
        }
        continue;
      }
      if (e.type === 'egg') {
        e.eggT -= dt;
        if (e.eggT <= 0) {
          for (let j = 0; j < EGG_N; j++) this.pend.push(['swarm', e.x + rnd(-14, 14), e.y + rnd(-14, 14), 0]);
          e.hp = 0;
          this.ring(e.x, e.y, 4, 40, e.col, 0.4, 4);
          this.burst(e.x, e.y, 10, e.col, 160, 0.4, 2);
        }
        continue;
      }
      if (e.type === 'phaser' && !e.mute) {
        e.phT -= dt;
        if (e.phT <= 0) {
          e.cloak = !e.cloak;
          e.phT = e.cloak ? PHASE_ON : PHASE_OFF;
          this.ring(e.x, e.y, e.r * 2, 4, e.col, 0.25, 2);
        }
      }
      if (e.frozen > 0) continue;
      e.atkT -= dt;
      const d = hyp(e.x, e.y) || 1;
      if (e.type === 'jumper' && !e.mute) {
        e.jT -= dt;
        if (e.jT <= 0 && d > b.r + e.r + 30) {
          e.jT = JUMP_CD;
          const j = Math.min(JUMP_D, d - b.r - e.r - 6);
          this.ring(e.x, e.y, e.r * 2, 3, e.col, 0.3, 3);
          e.x -= (e.x / d) * j;
          e.y -= (e.y / d) * j;
          this.ring(e.x, e.y, 3, e.r * 2.4, e.col, 0.3, 3);
          continue;
        }
      }
      let buff = false;
      if (cmd.length)
        for (const c of cmd)
          if (c !== e && hyp(c.x - e.x, c.y - e.y) < CMD_R) {
            buff = true;
            break;
          }
      if (e.mate) {
        if (e.mate.hp > 0) {
          if (!e.mute && e.hp < e.max) e.hp = Math.min(e.max, e.hp + e.max * PAIR_HEAL * dt);
        } else if (!e.rage) {
          e.rage = true;
          e.acc = PAIR_RAGE;
          this.ring(e.x, e.y, e.r, e.r * 3, '#ff4f4f', 0.4, 4);
        }
      }
      if (e.type === 'ram') e.acc = Math.min(RAM_MAX, e.acc + RAM_ACC * dt);
      if (e.type === 'queen' && !e.mute) {
        e.qT -= dt;
        if (e.qT <= 0) {
          e.qT = QUEEN_CD;
          for (let j = 0; j < 2; j++) this.pend.push(['swarm', e.x + rnd(-20, 20), e.y + rnd(-20, 20), 0]);
        }
      }
      const dm = e.dmg * (e.dmgMul || 1) * (buff ? CMD_DMG : 1),
        spd = e.sp * (e.spMul || 1) * (this.rushT > 0 ? 1.5 : 1) * e.acc * (buff ? CMD_SP : 1);
      if (e.boss) {
        e.sumT -= dt;
        if (e.sumT <= 0) {
          e.sumT = 4;
          for (let j = 0; j < 3; j++) this.spawnEnemy('swarm', false, e.x + rnd(-30, 30), e.y + rnd(-30, 30));
        }
        if (e.armorT > 0) e.armorT -= dt;
        // Fähigkeit: erst in Reichweite der Basis, dann aufladen (Boss steht still), dann auslösen
        if (e.cast > 0) {
          e.cast -= dt;
          if (e.cast <= 0) {
            e.cast = 0;
            this.bossAbility(e, dm, allies);
          }
          continue;
        }
        e.abT -= dt;
        if (e.abT <= 0 && d < BOSS_ABIL_RANGE) {
          const K = BOSS_KINDS[e.name];
          e.cast = e.cast0 = K.charge;
          e.abT = K.cd;
          this.h.sfx && this.h.sfx('bosswave');
          continue;
        }
      }
      if (e.type === 'healer' && !e.mute) {
        e.healT -= dt;
        if (e.healT <= 0) {
          e.healT = 1;
          let any = false;
          this.query(e.x, e.y, HEAL_R, o => {
            if (o === e || o.hp >= o.max || hyp(o.x - e.x, o.y - e.y) > HEAL_R) return;
            o.hp = Math.min(o.max, o.hp + o.max * HEAL_PCT * (o.boss ? 0.25 : 1));
            any = true;
          });
          if (any) this.ring(e.x, e.y, 8, HEAL_R, '#6dffb0', 0.5, 3);
        }
      }
      if (e.cloak && e.type === 'cloaker' && d < CLOAK_R) {
        e.cloak = false;
        this.ring(e.x, e.y, 4, e.r * 3, '#9aa7ff', 0.4, 4);
        this.burst(e.x, e.y, 10, '#9aa7ff', 160, 0.4, 2);
      }
      let bl = null;
      const am = e.r + ar + 3;
      if (
        !e.ranged &&
        e.type !== 'bomber' &&
        e.type !== 'thief' &&
        e.x > ax0 - am &&
        e.x < ax1 + am &&
        e.y > ay0 - am &&
        e.y < ay1 + am
      )
        for (const a of allies) {
          const rr = e.r + a.r + 3;
          if (Math.abs(a.x - e.x) < rr && Math.abs(a.y - e.y) < rr && hyp(a.x - e.x, a.y - e.y) < rr) {
            bl = a;
            break;
          }
        }
      if (bl) {
        if (e.atkT <= 0) {
          this.hurtAlly(bl, dm);
          e.atkT = 1;
        }
        continue;
      }
      if (e.type === 'mortar' && d < e.stop) {
        e.ang = Math.atan2(-e.y, -e.x);
        if (e.atkT <= 0) {
          e.atkT = MORTAR_CD;
          let t = null,
            bd = MORTAR_RANGE * MORTAR_RANGE;
          for (const a of allies) {
            const q = sq(a.x - e.x) + sq(a.y - e.y);
            if (q < bd) {
              bd = q;
              t = a;
            }
          }
          if (t) {
            this.zones.push({
              kind: 'shell',
              x: t.x,
              y: t.y,
              r: MORTAR_R,
              t: MORTAR_DELAY,
              t0: MORTAR_DELAY,
              dmg: dm * MORTAR_MUL,
              col: e.col,
            });
            e.ang = Math.atan2(t.y - e.y, t.x - e.x);
          } else
            this.ep.push({
              x: e.x,
              y: e.y,
              vx: (-e.x / d) * 200,
              vy: (-e.y / d) * 200,
              dmg: dm,
              col: e.col,
              big: false,
            });
        }
        continue;
      }
      if (e.type === 'sniper' && d < e.stop) {
        if (e.tgA && (e.tgA.dead > 0 || e.tgA.hp <= 0)) e.tgA = null;
        if (!e.tgA && e.aimT === 0) {
          let bh = 0;
          for (const a of this.heroes)
            if (!(a.dead > 0) && a.max > bh) {
              bh = a.max;
              e.tgA = a;
            }
        }
        const tx = e.tgA ? e.tgA.x : 0,
          ty = e.tgA ? e.tgA.y : 0;
        e.ang = Math.atan2(ty - e.y, tx - e.x);
        e.aimT += dt;
        if (e.aimT >= SNIPE_T) {
          e.aimT = 0;
          this.headless ||
            this.bolts.push({
              pts: [
                [e.x, e.y],
                [tx, ty],
              ],
              l: 0,
              m: 0.2,
              col: '#ffffff',
              w: 4,
            });
          if (e.tgA) this.hurtAlly(e.tgA, dm * SNIPE_MUL);
          else this.damageBase(dm * SNIPE_BASE);
          e.tgA = null;
          this.burst(tx, ty, 10, e.col, 220, 0.3, 3);
          this.h.sfx && this.h.sfx('turret');
        }
        continue;
      }
      if (e.ranged && d < e.stop) {
        e.ang = Math.atan2(-e.y, -e.x);
        if (e.atkT <= 0) {
          const sg = e.type === 'siege',
            v = sg ? 150 : 220;
          e.atkT = sg ? 3.6 : 1.8;
          this.ep.push({
            x: e.x,
            y: e.y,
            vx: (-e.x / d) * v,
            vy: (-e.y / d) * v,
            dmg: dm,
            col: e.col,
            big: sg,
          });
        }
        continue;
      }
      if (d < b.r + e.r + 2) {
        if (e.type === 'thief') {
          const st = this.energy * THIEF_PCT;
          this.energy -= st;
          e.hp = 0;
          this.num(e.x, e.y - 16, '−' + fmtN(Math.max(1, st)) + ' Energie', '#ffd24f', true);
          this.ring(e.x, e.y, 4, 40, e.col, 0.4, 5);
          this.burst(e.x, e.y, 12, e.col, 200, 0.4, 2);
          this.h.sfx && this.h.sfx('down');
          continue;
        }
        if (e.type === 'bomber') {
          this.damageBase(dm);
          e.hp = 0;
          this.ring(e.x, e.y, 6, 70, '#ff5a3d', 0.4, 10);
          this.burst(e.x, e.y, 26, '#ff5a3d', 260, 0.5, 3);
          this.shake = Math.max(this.shake, 7);
          this.h.sfx && this.h.sfx('killbig');
          continue;
        }
        if (e.atkT <= 0) {
          this.damageBase(dm);
          e.atkT = 1;
        }
        continue;
      }
      e.wob += dt * 3;
      const ux = -e.x / d,
        uy = -e.y / d,
        lat = e.boss ? 0 : Math.sin(e.wob) * 0.25;
      e.x += (ux - uy * lat) * spd * dt;
      e.y += (uy + ux * lat) * spd * dt;
      if (!this.headless) e.ang = Math.atan2(uy, ux);
    }
  },
  // Fähigkeit eines Bosses auslösen (dm = sein aktueller Schaden, allies = lebende Helden und Drohnen)
  bossAbility(e, dm, allies) {
    const k = e.name;
    if (k === 'Titan') {
      for (const a of allies) {
        const dx = a.x - e.x,
          dy = a.y - e.y,
          L = hyp(dx, dy) || 1;
        if (L > BOSS_SHOCK_R) continue;
        this.hurtAlly(a, dm * 1.5);
        a.x += (dx / L) * 60;
        a.y += (dy / L) * 60;
      }
      this.ring(e.x, e.y, e.r, BOSS_SHOCK_R, '#ff6b84', 0.5, 10);
      this.shake = Math.max(this.shake, 10);
      this.h.sfx && this.h.sfx('pulse');
    } else if (k === 'Koloss') {
      e.armorT = 4;
      this.ring(e.x, e.y, e.r * 2, e.r * 1.2, '#ffffff', 0.5, 8);
      this.h.sfx && this.h.sfx('shield');
    } else if (k === 'Nemesis') {
      const d = hyp(e.x, e.y) || 1;
      this.ep.push({
        x: e.x,
        y: e.y,
        vx: (-e.x / d) * 170,
        vy: (-e.y / d) * 170,
        dmg: dm * 3,
        col: '#ff3b5c',
        big: true,
      });
      this.h.sfx && this.h.sfx('turret');
    } else if (k === 'Vortex') {
      for (const a of allies) {
        const dx = e.x - a.x,
          dy = e.y - a.y,
          L = hyp(dx, dy) || 1;
        if (L > BOSS_PULL_R) continue;
        const p = Math.min(70, Math.max(0, L - e.r));
        a.x += (dx / L) * p;
        a.y += (dy / L) * p;
        this.hurtAlly(a, dm * 0.5);
      }
      this.ring(e.x, e.y, BOSS_PULL_R, e.r, '#b98cff', 0.6, 8);
      this.h.sfx && this.h.sfx('whirl');
    } else if (k === 'Hydra') {
      for (let j = 0; j < 8; j++) {
        const a = (j * TAU) / 8;
        this.spawnEnemy('swarm', false, e.x + Math.cos(a) * (e.r + 14), e.y + Math.sin(a) * (e.r + 14));
      }
      this.ring(e.x, e.y, e.r, e.r * 2.6, '#ff8a3d', 0.5, 8);
      this.h.sfx && this.h.sfx('killbig');
    } else if (k === 'Leviathan') {
      this.rushT = 4;
      this.ring(0, 0, Math.max(this.hw, this.hh), 40, '#3df5ff', 0.9, 10);
      this.h.banner && this.h.banner('Flut', 'Alle Gegner werden schneller');
      this.h.sfx && this.h.sfx('wave');
    }
  },
  separate() {
    for (const e of this.en) {
      if (e.boss) continue;
      this.query(e.x, e.y, e.r + 36, o => {
        if (o === e) return;
        const dx = e.x - o.x,
          dy = e.y - o.y,
          rr = e.r + o.r,
          dd = dx * dx + dy * dy;
        if (dd < rr * rr && dd > 0.01) {
          const d = Math.sqrt(dd),
            p = ((rr - d) / d) * (o.boss ? 0.8 : 0.5);
          e.x += dx * p;
          e.y += dy * p;
        }
      });
      const d = hyp(e.x, e.y) || 1,
        m = this.base.r + e.r;
      if (d < m) {
        e.x *= m / d;
        e.y *= m / d;
      }
    }
  },
};
