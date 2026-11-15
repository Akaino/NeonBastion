import {
  ARPS,
  BASSP,
  CHORDS,
  DRUMP,
  MEL_END,
  MEL_R,
  NOTE,
  PROGS,
  Vol,
  inSet,
  pcsOf,
  rpick,
  scaleFor,
} from './music-data.js';
import { Snd } from './sound.js';
import { click, noise, osc } from './synth.js';
import { Track } from './track.js';
import { clamp } from '../core/util.js';

// Melodie für 4 Takte: Akkordtöne auf betonten Zählzeiten, Schritte dazwischen, Phrase endet auf dem Grundton
export function makeMelody(prog) {
  const LO = 64,
    HI = 81,
    rA = rpick(MEL_R),
    rB = rpick(MEL_R),
    bars = [];
  let prev = rpick([69, 72, 76]);
  const chordNotes = ch => {
    const o = [];
    for (let m = LO; m <= HI; m++) if (inSet(m, pcsOf(ch))) o.push(m);
    return o;
  };
  const scaleNotes = ch => {
    const o = [];
    for (let m = LO; m <= HI; m++) if (inSet(m, scaleFor(ch))) o.push(m);
    return o;
  };
  for (let b = 0; b < 4; b++) {
    const ch = prog[b],
      r = b === 3 ? MEL_END : b % 2 === 0 ? rA : rB,
      pos = [];
    for (let i = 0; i < 16; i++) if (r[i] === 'x') pos.push(i);
    const cn = chordNotes(ch),
      sn = scaleNotes(ch),
      notes = new Array(16).fill(null);
    pos.forEach((p, j) => {
      let m;
      const last = b === 3 && j === pos.length - 1;
      if (last) {
        const root = cn.filter(x => inSet(x, [CHORDS[ch][0] % 12]));
        m = root.reduce((a, x) => (Math.abs(x - prev) < Math.abs(a - prev) ? x : a), root[0]);
      } else if (p % 4 === 0) {
        const c = cn.slice().sort((a, x) => Math.abs(a - prev) - Math.abs(x - prev));
        m = Math.random() < 0.7 ? c[0] : c[Math.min(1, c.length - 1)];
        if (m === prev && c.length > 1 && Math.random() < 0.5) m = c[1];
      } else {
        const i = sn.indexOf(sn.reduce((a, x) => (Math.abs(x - prev) < Math.abs(a - prev) ? x : a), sn[0]));
        const dir = prev > 76 ? -1 : prev < 67 ? 1 : rpick([-1, 1]);
        m = sn[clamp(i + dir * rpick([1, 1, 2]), 0, sn.length - 1)];
      }
      const nx = j + 1 < pos.length ? pos[j + 1] : 16;
      notes[p] = {
        m,
        len: Math.min(4, nx - p) + (last ? 4 : 0),
      };
      prev = m;
    });
    bars.push(notes);
  }
  return bars;
}

export const Music = {
  step: 0,
  next: 0,
  timer: null,
  tempo: 100,
  secTempo: 100,
  tr: 0,
  st: {
    menu: true,
    E: 0,
    W: 0,
    danger: 0,
    boss: false,
    tr: 0,
  },
  sec: null,
  secN: 0,
  mel: null,
  log: null,
  newSection(E) {
    const tiers =
      E < 0
        ? ['amb', 'amb2']
        : E < 0.3
          ? ['A', 'B', 'A', 'B2']
          : E < 0.65
            ? ['A', 'B', 'D', 'C', 'D', 'B2']
            : ['B', 'D', 'D', 'C', 'D2', 'B2'];
    const kind = tiers[this.secN++ % tiers.length],
      prevP = this.sec && this.sec.prog;
    let prog = prevP;
    if (!prevP || kind === 'A' || kind === 'C' || kind === 'amb' || Math.random() < 0.35) {
      do {
        prog = rpick(PROGS);
      } while (prog === prevP);
    }
    if (prog !== prevP || !this.mel) this.mel = makeMelody(prog);
    this.tr = this.st.tr;
    this.secTempo = this.target();
    this.sec = {
      kind,
      prog,
      len: kind === 'C' ? 4 : 8,
      bar: 0,
      arp: rpick(ARPS),
      bass: kind === 'D' || kind === 'D2' ? rpick([2, 3, 5]) : rpick([0, 1, 2, 4]),
      drum:
        kind === 'C'
          ? 'half'
          : kind === 'D' || kind === 'D2'
            ? rpick(['four', 'drive', 'gallop'])
            : rpick(['four', 'brk', 'four', 'drive']),
      lead: kind !== 'A' && kind !== 'amb',
      oct: kind === 'D2' ? 12 : 0,
    };
  },
  note(kind, m) {
    if (this.log)
      this.log.push({
        kind,
        m,
        ch: this.sec.prog[this.sec.bar % 4],
        s: this.cur,
      });
  },
  scheduleStep(B, step, t, S, beat) {
    const s = step % 16,
      E = S.menu ? -1 : S.E;
    this.cur = s;
    if (s === 0 && (!this.sec || this.sec.bar >= this.sec.len)) this.newSection(E);
    const sec = this.sec,
      tr = this.tr,
      R = n => NOTE(n + tr),
      o = B.mus,
      K = sec.kind,
      lastBar = sec.bar === sec.len - 1,
      ch = sec.prog[sec.bar % 4],
      C = CHORDS[ch],
      tones = [C[0], C[1], C[2], C[0] + 12];
    const drop = K === 'D' || K === 'D2',
      brk = K === 'C',
      amb = K === 'amb' || K === 'amb2';
    if (s === 0 && sec.bar === 0 && !amb) {
      if (brk)
        noise(B, o, t, {
          dur: beat * 16,
          vol: 0.12,
          f0: 9000,
          f1: 300,
          q: 1.2,
        });
      else
        noise(B, o, t, {
          dur: 1.8,
          vol: 0.1 + Math.max(0, E) * 0.05,
          f0: 5000,
          f1: 3000,
          type: 'highpass',
        });
    }
    // Flächen
    if (s === 0) {
      const op = amb ? 700 : brk ? 600 + sec.bar * 500 : 900 + Math.max(0, E) * 3500;
      for (const n of C) {
        this.note('pad', 57 + n);
        for (const d of [-6, 6])
          osc(B, B.pad, t, {
            type: 'sawtooth',
            f0: R(57 + n),
            dur: beat * 16 + 0.3,
            vol: brk ? 0.05 : 0.04,
            att: drop ? 0.03 : 0.4,
            det: d,
            ft: [op, op * 0.55],
            fq: 1,
          });
      }
      if (amb || brk) {
        this.note('sub', 45 + C[0]);
        osc(B, o, t, {
          type: 'sine',
          f0: R(45 + C[0]),
          dur: beat * 16,
          vol: 0.06,
          att: 0.5,
        });
      }
    }
    // Arpeggio (nur Akkordtöne)
    const fast = !amb && (E > 0.3 || drop || brk),
      arpOn = amb ? s % 4 === 0 : fast ? true : s % 2 === 0;
    if (arpOn) {
      const idx = fast ? s : s >> 1,
        n = 57 + tones[sec.arp[idx % sec.arp.length]] + 12,
        cut = brk ? 900 + ((sec.bar * 16 + s) / (sec.len * 16)) * 6000 : amb ? 2400 : 2200 + Math.max(0, E) * 5000;
      this.note('arp', n);
      osc(B, o, t, {
        type: drop || E > 0.45 ? 'square' : 'triangle',
        f0: R(n),
        dur: beat * (fast ? 0.9 : 1.6),
        vol: amb ? 0.045 : 0.036,
        ft: [cut, 700],
      });
      osc(B, B.dly, t, {
        type: 'triangle',
        f0: R(n),
        dur: beat,
        vol: 0.018,
      });
    }
    // Lead-Melodie
    if (sec.lead) {
      const nb = this.mel[sec.bar % 4][s];
      if (nb) {
        const n = nb.m + sec.oct;
        this.note('lead', n);
        this.lead(B, t, R(n), beat * nb.len * 0.92, amb ? 0.035 : drop ? 0.065 : 0.055, amb);
      }
    }
    if (amb) {
      if (s === 15) sec.bar++;
      return;
    }
    // Bass (Grundton, Oktave, Quinte)
    if (!brk) {
      const bp = BASSP[sec.bass][s];
      if (bp !== null) {
        const n = 45 + C[0] + bp;
        this.note('bass', n);
        const acid = E > 0.75 && drop;
        osc(B, o, t, {
          type: 'sawtooth',
          f0: R(n),
          dur: beat * 0.95,
          vol: 0.11,
          ft: [acid ? 1400 + ((step * 37) % 9) * 400 : 900 + E * 1000, acid ? 180 : 140],
          fq: acid ? 12 : 5,
        });
      }
    }
    // Drums
    const D = DRUMP[sec.drum],
      fill = lastBar && s >= 8 && !brk;
    if (!brk || sec.bar >= 2) {
      if (D.k.includes(s) && !(fill && s >= 12)) {
        osc(B, o, t, {
          type: 'sine',
          f0: 165,
          f1: 42,
          dur: 0.24,
          vol: brk ? 0.35 : 0.6,
          att: 0.001,
        });
        click(B, o, t, 0.12, 3000);
        const g = B.pad.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(0.25, t);
        g.linearRampToValueAtTime(1, t + beat * 3);
      }
    }
    if (D.sn.includes(s) && !fill) {
      noise(B, o, t, {
        dur: 0.16,
        vol: 0.27,
        f0: 1900,
        f1: 1000,
        q: 0.8,
      });
      noise(B, o, t + 0.006, {
        dur: 0.07,
        vol: 0.13,
        f0: 4500,
        type: 'highpass',
      });
    }
    if (D.gh && D.gh.includes(s))
      noise(B, o, t, {
        dur: 0.05,
        vol: 0.08,
        f0: 2200,
        q: 0.8,
      });
    if (fill) {
      const k = s >= 12 ? 2 : 1;
      for (let i = 0; i < k; i++) {
        const tt = t + (i * beat) / 2;
        if (s < 12 || (i === 0 && s % 2))
          noise(B, o, tt, {
            dur: 0.06,
            vol: 0.12 + (s - 8) * 0.025,
            f0: 2200,
            f1: 1300,
            q: 0.8,
          });
        else
          noise(B, o, tt, {
            dur: 0.09,
            vol: 0.2,
            f0: 900 - (s - 12) * 120,
            f1: 300,
            q: 1.2,
          });
      }
    }
    const hat16 = E > 0.25 || drop;
    if (hat16 || s % 4 === 2)
      noise(B, o, t, {
        dur: drop && s % 4 === 2 ? 0.16 : 0.028,
        vol: s % 4 === 2 ? 0.1 : 0.045,
        f0: 9500,
        type: 'highpass',
      });
    if (lastBar && !drop && E > 0.3 && s === 0)
      noise(B, o, t, {
        dur: beat * 16,
        vol: 0.12,
        f0: 300,
        f1: 11000,
        q: 2.5,
        att: beat * 15,
      });
    // Gefahr: hohe, tonartgerechte Oktav-Pulse statt Dissonanz
    if (S.danger > 0.45 && (s === 2 || s === 10)) {
      const n = 69 + 12 + C[0];
      this.note('alarm', n);
      osc(B, o, t, {
        type: 'square',
        f0: R(n),
        dur: beat * 0.8,
        vol: 0.03,
        ft: [6000, 2500],
      });
    }
    // Boss: treibende tiefe Grundton-Achtel
    if (S.boss && s % 2 === 0) {
      const n = 33 + C[0] + (s % 8 === 6 ? 7 : 0);
      this.note('boss', n);
      osc(B, o, t, {
        type: 'sawtooth',
        f0: R(n),
        dur: beat * 1.6,
        vol: 0.09,
        ft: [1200, 200],
        fq: 4,
      });
    }
    if (s === 15) sec.bar++;
  },
  lead(B, t, f, dur, vol, soft) {
    const c = B.ctx,
      fl = c.createBiquadFilter(),
      g = c.createGain(),
      lfo = c.createOscillator(),
      lg = c.createGain();
    fl.type = 'lowpass';
    fl.Q.value = 2;
    fl.frequency.setValueAtTime(soft ? 2400 : 5200, t);
    fl.frequency.exponentialRampToValueAtTime(soft ? 1100 : 1800, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.setValueAtTime(vol, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.06);
    lfo.frequency.value = 5.2;
    lg.gain.setValueAtTime(0, t);
    lg.gain.setValueAtTime(0, t + Math.min(0.25, dur * 0.5));
    lg.gain.linearRampToValueAtTime(dur > 0.3 ? 10 : 0, t + dur);
    lfo.connect(lg);
    for (const [ty, dt] of [
      ['sawtooth', -5],
      ['square', 5],
    ]) {
      const os = c.createOscillator();
      os.type = ty;
      os.frequency.value = f;
      os.detune.value = dt;
      lg.connect(os.detune);
      os.connect(fl);
      os.start(t);
      os.stop(t + dur + 0.12);
    }
    lfo.start(t);
    lfo.stop(t + dur + 0.12);
    fl.connect(g);
    g.connect(B.mus);
    const sd = c.createGain();
    sd.gain.value = 0.4;
    g.connect(sd);
    sd.connect(B.dly);
  },
  target() {
    const S = this.st;
    return S.menu ? 100 : 112 + 60 * Math.min(1, S.W || 0);
  },
  tick() {
    const B = Snd.B;
    if (!B || !(Vol.mus > 0) || B.ctx.state !== 'running') return;
    const now = B.ctx.currentTime;
    if (this.next < now) this.next = now + 0.05;
    while (this.next < now + 0.15) {
      this.tempo += (this.secTempo - this.tempo) * 0.06;
      const beat = 60 / this.tempo / 4;
      Track.run(() => this.scheduleStep(B, this.step, this.next, this.st, beat));
      this.step++;
      this.next += beat;
    }
  },
  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), 30);
  },
  set(st) {
    const was = this.st.menu;
    Object.assign(this.st, st);
    if (was !== this.st.menu) {
      this.sec = null;
      this.secN = 0;
      this.mel = null;
      this.step = Math.ceil(this.step / 16) * 16;
    }
  },
};

/* ---- Aufräumen ----
   Jeder Effekt und jede Musiknote baut mehrere Ton-Bausteine (Oszillator, Filter, Lautstärke) und hängt sie ans Mischpult. Safari gibt solche Bausteine nicht frei,
   solange sie verbunden sind – auch wenn der Ton längst verklungen ist. Nach einigen Minuten sind es Zehntausende, und der Browser hängt etwa einmal pro Sekunde
   für 60 bis 150 ms (vom Nutzer gemessen, wächst mit der Spieldauer). Deshalb merkt sich Track alle Bausteine, die während eines Aufrufs entstehen, und trennt sie,
   sobald die letzte Tonquelle dieses Aufrufs zu Ende ist. */
