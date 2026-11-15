import { Dev } from '../core/dev-hooks.js';
import { fmtN } from '../core/format.js';
import { TAU, rnd } from '../core/util.js';
import { BOSS_NAMES, TWIN_EVERY, TWIN_HP } from '../data/bosses.js';
import { DROP_P } from '../data/drops.js';
import {
  EGG_T,
  ETYPES,
  JUMP_CD,
  PHASE_OFF,
  QUEEN_CD,
  SHIELD_HITS,
  SHIELD_PER,
  SHINY_HP,
  SHINY_P,
  WAVE_MIX,
  waveMix,
} from '../data/enemies.js';

/* Methoden der Klasse Run (werden in Run.js an die Klasse gehängt). */
export const runWavesMethods = {
  /* ---------- waves ---------- */ milestone(w) {
    const S = this.S,
      r = {
        k: 0,
        p: 0,
      };
    if (w > 1 && (w - 1) % 5 === 0) {
      r.k = Math.floor((w - 1) / 5) * S.gK * S.gAll;
      this.gain.k += r.k;
    }
    if (w >= 10 && w % 10 === 0) {
      r.p = S.gP;
      this.gain.p += r.p;
    }
    return r;
  },
  nextWave() {
    const w = ++this.w,
      S = this.S;
    const n = Math.round(Math.min(8 + w * 2.4, 50 + w * 0.6)),
      bS = w >= 3 ? Math.min(0.25, 0.04 * (w - 2)) : 0,
      sS = w >= 5 ? Math.min(0.2, 0.04 * (w - 4)) : 0;
    const eC = Math.min(0.08, 0.03 + 0.003 * w) * S.elite,
      twin = w % TWIN_EVERY === 0,
      boss = w % 10 === 0 || twin,
      cnt = boss ? Math.round(n * 0.5) : n,
      q = [];
    this.twin = twin;
    this.bossPt = null;
    this.twinMax = 0;
    this.twinDown = 0;
    const mix = waveMix(w);
    for (let i = 0; i < cnt; i++) {
      let r = Math.random(),
        type = 'swarm';
      for (const [t, s] of mix) {
        if (r < s) {
          type = t;
          break;
        }
        r -= s;
      }
      q.push({
        type,
        elite: Math.random() < eC,
        shiny: Math.random() < SHINY_P,
      });
    }
    const dv = Dev.wave ? Dev.wave(this) : null;
    if (dv && dv.shiny && q.length) q[0].shiny = true; // Testhilfen: erzwungener schillernder Gegner bzw. Abwurf
    if ((Math.random() < DROP_P || (dv && dv.drop)) && q.length) q[Math.floor(Math.random() * q.length)].drop = true; // vor den Bossen: Bosse werfen nichts ab   // Testhilfe: ein schillernder Gegner je Welle
    if (boss)
      q.splice(Math.floor(q.length / 3), 0, {
        type: 'boss',
        elite: false,
      });
    if (twin)
      q.splice(Math.floor((q.length * 2) / 3), 0, {
        type: 'boss',
        elite: false,
        twin: true,
      });
    if (w > 1) this.energy += 10;
    this.queue = q;
    this.spawnI = Math.min(12, 8 + w * 0.12) / q.length;
    this.spawnT = 0.2;
    this.waveEndT = 0;
    let sub = twin ? 'Zwei Bosse nähern sich' : boss ? 'Ein Boss nähert sich' : '';
    const ms = this.milestone(w);
    if (ms.k) sub = `+${fmtN(Math.max(1, ms.k))} ${ms.k < 2 ? 'Kern' : 'Kerne'} für ${w - 1} Wellen`;
    if (ms.p)
      sub =
        `Meilenstein: +${fmtN(Math.max(1, ms.p))} ${ms.p < 2 ? 'Prisma' : 'Prismen'}` +
        (twin ? ' · Doppelboss naht' : boss ? ' · Boss naht' : '');
    const neu = WAVE_MIX.find(t => ETYPES[t].from === w && ETYPES[t].text);
    if (neu) sub = (sub ? sub + ' · ' : '') + 'Neu: ' + ETYPES[neu].name;
    if (w > this.save.best && this.save.best > 0 && !this.record) {
      this.record = true;
    }
    this.h.banner && this.h.banner(`Welle ${w}`, sub);
    this.h.sfx && this.h.sfx(boss ? 'bosswave' : 'wave');
  },
  bossName() {
    const used = this.en.filter(e => e.boss && e.hp > 0).map(e => e.name),
      free = BOSS_NAMES.filter(n => !used.includes(n)),
      l = free.length ? free : BOSS_NAMES;
    return l[Math.floor(Math.random() * l.length)];
  },
  spawnPt() {
    const W = this.hw + 40,
      H = this.hh + 40;
    let u = Math.random() * (4 * W + 4 * H);
    if (u < 2 * W) return [-W + u, -H];
    u -= 2 * W;
    if (u < 2 * H) return [W, -H + u];
    u -= 2 * H;
    if (u < 2 * W) return [W - u, H];
    u -= 2 * W;
    return [-W, H - u];
  },
  spawnEnemy(type, elite, x, y, shiny) {
    const T = ETYPES[type],
      w = this.w,
      hm = this.hpScale(w),
      dm = this.dmgScale(w);
    let hp = T.hp * hm * (type === 'boss' ? (500 / 900) * (1 + w * 0.03) * (this.twin ? TWIN_HP : 1) : 1),
      r = T.r,
      val = T.val;
    if (elite) {
      hp *= 5;
      r *= 1.35;
      val *= 4;
    }
    if (shiny) hp *= SHINY_HP;
    this.en.push({
      type,
      x,
      y,
      r,
      hp,
      max: hp,
      sp: T.sp * rnd(0.9, 1.1) * (elite ? 0.85 : 1),
      dmg: T.dmg * dm * (elite ? 2 : 1),
      val,
      elite,
      boss: type === 'boss',
      ranged: !!T.ranged,
      col: T.col,
      flash: 0,
      name: type === 'boss' ? this.bossName() : null,
      atkT: rnd(0, 1),
      ang: Math.atan2(-y, -x),
      sumT: 4,
      wob: rnd(0, TAU),
      stop:
        type === 'siege' || type === 'sniper'
          ? Math.min(rnd(250, 270), Math.min(this.hw, this.hh) - 14)
          : rnd(200, 240),
      sh: 0,
      sh0: 0,
      bd: 0,
      shiny: !!shiny,
      healT: rnd(0, 1),
      cloak: type === 'cloaker',
      heavy: type === 'giant',
      acc: 1,
      down: 0,
      rev: false,
      qT: QUEEN_CD,
      aimT: 0,
      tgA: null,
      mirT: -9,
      mate: null,
      rage: false,
      jT: JUMP_CD * rnd(0.5, 1),
      phT: PHASE_OFF * rnd(0.3, 1),
      eggT: EGG_T,
      cast: 0,
      cast0: 0,
      abT: rnd(4, 7),
      armorT: 0,
      // Alle später benutzten Felder schon hier anlegen: Gegner haben dann immer dieselbe Form, das hält den Rechenkern schnell.
      mute: false,
      mark: 1,
      spMul: 1,
      vuln: 1,
      dmgMul: 1,
      critB: 0,
      combo: 0,
      perma: false,
      shat: false,
      nullp: false,
      tw: [],
      frozen: 0,
      chill: 0,
      frzImm: 0,
      sF: false,
      sZ: false,
      sK: false,
      kbT: 0,
      psn: 0,
      psT: 0,
      acid: 0,
    });
    if (type === 'shield') {
      const e = this.en[this.en.length - 1];
      e.sh = e.sh0 = SHIELD_HITS + Math.floor(w / SHIELD_PER);
    }
  },
  updWaves(dt) {
    if (this.queue.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        const k = Math.min(this.queue.length, 1 + Math.floor(Math.random() * 3));
        const [x, y] = this.spawnPt();
        for (let i = 0; i < k; i++) {
          const q = this.queue.shift();
          let px = x,
            py = y;
          // der zweite Boss eines Doppelbosses kommt von der gegenüberliegenden Seite
          if (q.type === 'boss') {
            if (q.twin && this.bossPt) {
              px = -this.bossPt[0];
              py = -this.bossPt[1];
            } else this.bossPt = [x, y];
          }
          this.spawnEnemy(q.type, q.elite, px + rnd(-22, 22), py + rnd(-22, 22), q.shiny);
          if (q.drop) this.en[this.en.length - 1].drop = true;
          if (q.type === 'pair') {
            const a = this.en[this.en.length - 1];
            this.spawnEnemy('pair', false, a.x + rnd(-30, 30), a.y + rnd(-30, 30));
            const m = this.en[this.en.length - 1];
            a.mate = m;
            m.mate = a;
          }
        }
        this.spawnT = this.spawnI * k * rnd(0.7, 1.3);
      }
    } else {
      this.waveEndT += dt;
      if (this.en.length <= 3 || this.waveEndT > 9) {
        this.waveGap -= dt;
        if (this.waveGap <= 0) {
          this.nextWave();
          this.waveGap = 1.5;
        }
      }
    }
  },
};
