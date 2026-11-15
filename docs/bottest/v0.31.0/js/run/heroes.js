import { fmtN } from '../core/format.js';
import { PI, TAU, hyp, rnd, sq } from '../core/util.js';
import { ENGI_DUR, HUNT_MUL, HUNT_SHOT } from '../data/balance.js';
import { HEROES } from '../data/heroes.js';
import { jag } from './util.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runHeroesMethods = {
  makeHero(id, i, n) {
    const d = HEROES[id],
      st = this.save.heroes[id],
      lm = 1 + 0.12 * (st.l - 1),
      a = (i / Math.max(1, n)) * TAU - PI / 2;
    const max = d.hp * lm * this.S.heroHp;
    return {
      id,
      d,
      col: d.col,
      x: Math.cos(a) * 55,
      y: Math.sin(a) * 55,
      r: 11,
      max,
      hp: max,
      dmg: d.dmg * lm * this.S.heroDmg * (this.S.heroSelf || 1),
      rate: d.rate * this.S.heroRate,
      range: d.range,
      sp: d.speed,
      cd: d.cd * this.S.abilityCd * (1 - 0.08 * st.a),
      pow: (1 + 0.35 * st.a) * this.S.abilPow,
      abT: d.cd * 0.5,
      atkT: 0,
      dead: 0,
      face: a,
      idleA: a,
      flash: 0,
      healT: 1,
      lunge: 0,
      spin: 0,
      hits: 0,
      swDir: 1,
    };
  },
  hurtAlly(a, d) {
    a.hp -= d;
    a.flash = 0.1;
    if (a.hp <= 0) {
      this.burst(a.x, a.y, a.d ? 24 : 8, a.col || '#3df5ff', 200, 0.5);
      if (a.d) {
        a.hp = 0;
        a.dead = this.S.revive;
        this.h.sfx && this.h.sfx('down');
      }
    }
  },
  /* ---------- heroes ---------- */ updHeroes(dt) {
    for (const h of this.heroes) {
      if (h.dead > 0) {
        h.dead -= dt;
        if (h.dead <= 0) {
          h.dead = 0;
          h.hp = h.max;
          h.x = Math.cos(h.idleA) * 40;
          h.y = Math.sin(h.idleA) * 40;
          this.ring(h.x, h.y, 4, 40, h.col, 0.4, 5);
        }
        continue;
      }
      h.flash -= dt;
      h.atkT -= dt;
      h.abT -= dt;
      if (this.S.heroRegen && h.hp < h.max) h.hp = Math.min(h.max, h.hp + h.max * this.S.heroRegen * dt);
      if (h.cast) h.cast = Math.max(0, h.cast - dt);
      if (h.id !== 'klinge') h.lunge = Math.max(0, h.lunge - dt);
      this['ai_' + h.id](h, dt);
    }
  },
  idle(h, dt, R = 55) {
    h.idleA += dt * 0.25;
    this.moveTo(h, Math.cos(h.idleA) * R, Math.sin(h.idleA) * R, dt, h.sp * 0.6);
  },
  kite(h, tg, dt) {
    const dx = tg.x - h.x,
      dy = tg.y - h.y,
      dd = hyp(dx, dy);
    h.face = Math.atan2(dy, dx);
    if (dd > h.range * 0.95) this.moveTo(h, tg.x, tg.y, dt);
    else if (dd < h.range * 0.4) this.moveTo(h, h.x - dx, h.y - dy, dt, h.sp * 0.8);
    return dd;
  },
  cluster() {
    let best = null,
      bn = 0;
    const list =
      this.en.length > 30
        ? Array.from(
            {
              length: 30,
            },
            () => this.en[Math.floor(Math.random() * this.en.length)],
          )
        : this.en;
    for (const e of list) {
      if (e.hp <= 0 || e.cloak || hyp(e.x, e.y) > 320) continue;
      let n = 0;
      this.query(e.x, e.y, 60, o => {
        if (hyp(o.x - e.x, o.y - e.y) < 60) n++;
      });
      if (n > bn) {
        bn = n;
        best = e;
      }
    }
    return best;
  },
  ai_klinge(h, dt) {
    h.lunge = Math.max(0, h.lunge - dt);
    h.spin = Math.max(0, h.spin - dt);
    const tg = this.aim(h, 300) || this.nearest(h.x, h.y, 380);
    if (h.abT <= 0 && this.en.length) {
      const c = this.cluster();
      if (c) {
        const sx = h.x,
          sy = h.y,
          tx = c.x + rnd(-6, 6),
          ty = c.y + rnd(-6, 6),
          da = Math.atan2(ty - sy, tx - sx);
        for (let i = 1; i <= 6; i++) {
          const k = i / 7;
          this.headless ||
            this.ghosts.push({
              id: h.id,
              col: h.col,
              x: sx + (tx - sx) * k,
              y: sy + (ty - sy) * k,
              a: da,
              l: -i * 0.025,
              m: 0.28,
            });
        }
        this.headless ||
          this.bolts.push({
            pts: [
              [sx, sy],
              [tx, ty],
            ],
            l: 0,
            m: 0.18,
            col: h.col,
            w: 4,
          });
        h.x = tx;
        h.y = ty;
        h.spin = 0.45;
        h.face = da;
        for (let i = 0; i < 3; i++)
          this.headless ||
            this.slashes.push({
              x: h.x,
              y: h.y,
              a: da + (i * TAU) / 3,
              dir: 1,
              r: 58 + i * 6,
              l: -i * 0.07,
              m: 0.32,
              col: i === 1 ? '#ffffff' : h.col,
              w: 11,
              full: 1,
            });
        this.aoe(h.x, h.y, 75, h.dmg * 3 * h.pow, {
          col: h.col,
          big: true,
          kb: [h.x, h.y, 20],
        });
        this.ring(h.x, h.y, 10, 95, h.col, 0.4, 12);
        this.burst(h.x, h.y, 28, h.col, 320, 0.5, 3);
        this.burst(h.x, h.y, 14, '#ffffff', 260, 0.3, 2);
        h.abT = h.cd;
        this.shake = Math.max(this.shake, 8);
        this.h.sfx && this.h.sfx('whirl');
      }
    }
    if (tg) {
      const dx = tg.x - h.x,
        dy = tg.y - h.y,
        dd = hyp(dx, dy);
      if (h.lunge <= 0) h.face = Math.atan2(dy, dx);
      if (dd > tg.r + h.r + 12) this.moveTo(h, tg.x, tg.y, dt);
      else if (h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.hits++;
        const heavy = h.hits % 3 === 0;
        h.swDir = -h.swDir;
        h.lunge = 0.16;
        const hc = Math.random() < this.S.heroCrit,
          dm = h.dmg * (heavy ? 1.8 : 1) * (hc ? 2.5 : 1),
          fx = Math.cos(h.face),
          fy = Math.sin(h.face);
        this.hitE(tg, dm, {
          col: h.col,
          big: heavy,
          crit: hc,
        });
        this.aoe(tg.x, tg.y, heavy ? 42 : 28, dm * 0.5, {
          num: false,
          skip: tg,
          kb: [h.x, h.y, heavy ? 10 : 4],
        });
        this.knock(tg, h.x, h.y, heavy ? 16 : 7);
        this.headless ||
          this.slashes.push({
            x: h.x + fx * 10,
            y: h.y + fy * 10,
            a: h.face,
            dir: h.swDir,
            r: heavy ? 44 : 34,
            l: 0,
            m: heavy ? 0.3 : 0.22,
            col: h.col,
            w: heavy ? 13 : 9,
          });
        if (heavy)
          this.headless ||
            this.slashes.push({
              x: h.x + fx * 10,
              y: h.y + fy * 10,
              a: h.face,
              dir: -h.swDir,
              r: 38,
              l: -0.06,
              m: 0.26,
              col: '#ffffff',
              w: 7,
            });
        const ix = tg.x - fx * tg.r,
          iy = tg.y - fy * tg.r;
        this.burst(ix, iy, heavy ? 12 : 6, '#ffffff', 280, 0.22, 2);
        this.burst(ix, iy, heavy ? 10 : 5, h.col, 220, 0.35, 2.6);
        if (heavy) this.shake = Math.max(this.shake, 3.5);
        this.h.sfx && this.h.sfx(heavy ? 'heavy' : 'slash');
      }
    } else this.idle(h, dt);
    this.leash(h, 320);
  },
  // Kopfjäger: nimmt das zäheste große Ziel (Elite, Hüne, Boss) in Reichweite, sonst das übliche Ziel
  bigGame(h, R) {
    let b = null,
      bh = 0;
    for (const e of this.en) {
      if (e.hp <= 0 || e.cloak || !(e.elite || e.boss || e.heavy) || e.max <= bh) continue;
      if (hyp(e.x - h.x, e.y - h.y) < R) {
        bh = e.max;
        b = e;
      }
    }
    return b;
  },
  ai_kopfjaeger(h, dt) {
    const tg = this.bigGame(h, 420) || this.aim(h, 380);
    if (tg) {
      const dd = this.kite(h, tg, dt),
        big = tg.elite || tg.boss || tg.heavy ? HUNT_MUL : 1,
        mx = h.x + Math.cos(h.face) * 14,
        my = h.y + Math.sin(h.face) * 14;
      if (h.abT <= 0 && dd <= h.range * 1.2) {
        h.abT = h.cd;
        h.atkT = 1 / h.rate;
        h.lunge = 0.2;
        this.headless ||
          this.bolts.push({
            pts: [
              [mx, my],
              [tg.x, tg.y],
            ],
            l: 0,
            m: 0.25,
            col: h.col,
            w: 5,
          });
        this.ring(tg.x, tg.y, 4, 46, h.col, 0.35, 6);
        this.burst(tg.x, tg.y, 14, h.col, 260, 0.4, 3);
        this.hitE(tg, h.dmg * HUNT_SHOT * h.pow * big, {
          col: h.col,
          big: true,
        });
        this.shake = Math.max(this.shake, 4);
        this.h.sfx && this.h.sfx('abil');
      } else if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.lunge = 0.1;
        const hc = Math.random() < this.S.heroCrit;
        this.shootAt(mx, my, tg, 760, h.dmg * (hc ? 2.5 : 1) * big, h.col, {
          size: 4,
          num: true,
        });
        this.h.sfx && this.h.sfx('shoot');
        this.ring(mx, my, 2, 11, h.col, 0.14, 2);
      }
    } else this.idle(h, dt);
    this.leash(h, 250);
  },
  // Ingenieurin: mehr Energie, solange sie lebt (engiAt); Verstärker lässt Gegner im Turmradius mehr Schaden nehmen (ampT, wirkt in updTowers)
  ai_ingenieurin(h, dt) {
    this.engiAt = this.t;
    const tg = this.aim(h, 320);
    if (h.abT <= 0 && this.towers.length && this.en.length) {
      h.abT = h.cd;
      this.ampT = ENGI_DUR;
      for (const T of this.towers) this.ring(T.x, T.y, 8, T.r, h.col, 0.5, 5);
      this.ring(h.x, h.y, 4, 40, h.col, 0.4, 5);
      this.h.sfx && this.h.sfx('abil');
    }
    if (tg) {
      const dd = this.kite(h, tg, dt);
      if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.lunge = 0.1;
        const mx = h.x + Math.cos(h.face) * 12,
          my = h.y + Math.sin(h.face) * 12,
          hc = Math.random() < this.S.heroCrit;
        this.shootAt(mx, my, tg, 620, h.dmg * (hc ? 2.5 : 1), h.col, {
          size: 3,
          num: true,
        });
        this.h.sfx && this.h.sfx('shoot');
      }
    } else this.idle(h, dt);
    this.leash(h, 250);
  },
  ai_schuetzin(h, dt) {
    const tg = this.aim(h, 360);
    if (h.abT <= 0 && tg) {
      const a0 = Math.atan2(tg.y - h.y, tg.x - h.x);
      for (let i = 0; i < 12; i++)
        this.shoot(h.x, h.y, a0 + (i - 5.5) * 0.09, 640, h.dmg * 1.5 * h.pow, h.col, {
          pierce: 3,
          size: 4,
          num: true,
        });
      h.abT = h.cd;
      this.h.sfx && this.h.sfx('abil');
      this.h.sfx && this.h.sfx('turret');
    }
    if (tg) {
      const dd = this.kite(h, tg, dt);
      if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.lunge = 0.1;
        const mx = h.x + Math.cos(h.face) * 14,
          my = h.y + Math.sin(h.face) * 14;
        {
          const hc = Math.random() < this.S.heroCrit;
          this.shootAt(mx, my, tg, 660, h.dmg * (hc ? 2.5 : 1), h.col, {
            size: 3.5,
            num: true,
          });
        }
        this.h.sfx && this.h.sfx('shoot');
        this.ring(mx, my, 2, 11, h.col, 0.14, 2);
        this.burst(mx, my, 3, '#ffffff', 140, 0.15, 1.6);
      }
    } else this.idle(h, dt);
    this.leash(h, 250);
  },
  chain(from, first, dmg, n, col, o = {}) {
    const hit = new Set();
    let cur = first,
      fx = from[0],
      fy = from[1];
    for (let i = 0; i <= n && cur; i++) {
      this.headless ||
        this.bolts.push({
          pts: jag(fx, fy, cur.x, cur.y, 6, 8),
          l: 0,
          m: 0.22,
          col,
          w: 3,
        });
      hit.add(cur);
      this.hitE(cur, dmg, o);
      if (o.each) o.each(cur);
      fx = cur.x;
      fy = cur.y;
      dmg *= 0.8;
      let nx = null,
        nd = 110 * 110;
      for (const e of this.en) {
        if (e.hp <= 0 || hit.has(e)) continue;
        const d = sq(e.x - fx) + sq(e.y - fy);
        if (d < nd) {
          nd = d;
          nx = e;
        }
      }
      cur = nx;
    }
    return hit;
  },
  strike(x, y, dmg, col) {
    this.headless ||
      this.bolts.push({
        pts: jag(x + rnd(-30, 30), y - 240, x, y, 9, 14),
        l: 0,
        m: 0.3,
        col,
        w: 5,
      });
    this.aoe(x, y, 42, dmg, {
      col,
      big: true,
    });
    this.ring(x, y, 4, 50, col, 0.3, 6);
    this.burst(x, y, 8, col, 160, 0.4);
  },
  ai_arkanist(h, dt) {
    const tg = this.aim(h, 340);
    if (h.abT <= 0 && this.en.length) {
      const list = this.en
        .filter(e => e.hp > 0)
        .sort((a, b) => a.x * a.x + a.y * a.y - (b.x * b.x + b.y * b.y))
        .slice(0, 14);
      for (let i = 0; i < 8 && list.length; i++) {
        const e = list[Math.floor(Math.random() * list.length)];
        this.strike(e.x, e.y, h.dmg * 4 * h.pow, h.col);
      }
      h.abT = h.cd;
      this.shake = Math.max(this.shake, 5);
      this.h.sfx && this.h.sfx('abil');
    }
    if (tg) {
      const dd = this.kite(h, tg, dt);
      if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        {
          const hc = Math.random() < this.S.heroCrit;
          this.chain([h.x, h.y], tg, h.dmg * (hc ? 2.5 : 1), 3, h.col, {
            col: h.col,
            crit: hc,
          });
        }
        this.ring(h.x, h.y, 22, 16, h.col, 0.3, 2);
        h.cast = 0.3;
        this.h.sfx && this.h.sfx('zap');
      }
    } else this.idle(h, dt);
    this.leash(h, 240);
  },
  ai_waechterin(h, dt) {
    const b = this.base;
    h.healT -= dt;
    if (h.healT <= 0) {
      h.healT = 1;
      const amt = b.max * 0.012 * h.pow;
      if (b.hp < b.max) {
        b.hp = Math.min(b.max, b.hp + amt);
        this.num(0, -40, '+' + fmtN(Math.max(1, amt)), '#8cff4f', false);
      }
      for (const a of [...this.heroes, ...this.drones])
        if (a !== h && !(a.dead > 0) && hyp(a.x - h.x, a.y - h.y) < 130)
          a.hp = Math.min(a.max, a.hp + a.max * 0.08 * h.pow);
      this.ring(h.x, h.y, 6, 130, h.col, 0.6, 2);
    }
    if (h.abT <= 0 && this.en.length) {
      b.ov = Math.max(b.ov, b.max * 0.3 * h.pow);
      for (const a of [...this.heroes, ...this.drones]) if (!(a.dead > 0)) a.hp = a.max;
      this.ring(0, 0, 20, 90, h.col, 0.6, 10);
      h.abT = h.cd;
      this.h.sfx && this.h.sfx('abil');
    }
    const tg = this.nearest(h.x, h.y, h.range);
    if (tg) {
      h.face = Math.atan2(tg.y - h.y, tg.x - h.x);
      if (h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        this.shootAt(h.x, h.y, tg, 560, h.dmg, h.col, {
          size: 3,
          num: true,
        });
        this.h.sfx && this.h.sfx('shoot2');
      }
    }
    this.idle(h, dt, 62);
  },
};
