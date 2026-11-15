/* ================= AUDIO ================= */
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// A-Moll: Am – F – C – G, jeweils als MIDI-Noten
const PROG = [
  { root: 45, ch: [57, 60, 64] },
  { root: 41, ch: [53, 57, 60] },
  { root: 48, ch: [55, 60, 64] },
  { root: 43, ch: [55, 59, 62] },
];
const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91];

function makeImpulse(ctx, sec, decay) {
  const r = ctx.sampleRate,
    n = Math.floor(r * sec),
    b = ctx.createBuffer(2, n, r);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return b;
}

// Baut den Mischpult-Graphen auf einem (Offline-)AudioContext
function buildBus(ctx, dest) {
  const B = { ctx };
  B.master = ctx.createGain();
  B.master.gain.value = 1.4;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 8;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -2.5;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.08;
  B.master.connect(comp);
  comp.connect(lim);
  lim.connect(dest);
  B.rev = ctx.createConvolver();
  B.rev.buffer = makeImpulse(ctx, 2.4, 3);
  const rg = ctx.createGain();
  rg.gain.value = 0.32;
  B.rev.connect(rg);
  rg.connect(B.master);
  B.sfx = ctx.createGain();
  B.sfx.gain.value = 0.7;
  B.sfx.connect(B.master);
  const ss = ctx.createGain();
  ss.gain.value = 0.1;
  B.sfx.connect(ss);
  ss.connect(B.rev);
  // Bitcrusher (8 Stufen) und Sättigung für digitalen Grip
  const crushCurve = new Float32Array(1024),
    driveCurve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = i / 511.5 - 1;
    crushCurve[i] = Math.round(x * 6) / 6;
    driveCurve[i] = Math.tanh(x * 3.2) / Math.tanh(3.2);
  }
  const cs = ctx.createWaveShaper();
  cs.curve = crushCurve;
  const co = ctx.createGain();
  co.gain.value = 0.22;
  B.crush = ctx.createGain();
  B.crush.gain.value = 4.5;
  B.crush.connect(cs);
  cs.connect(co);
  co.connect(B.sfx);
  B.drive = ctx.createWaveShaper();
  B.drive.curve = driveCurve;
  B.drive.oversample = '2x';
  B.drive.connect(B.sfx);
  // harte Verzerrung für Laser und Explosionen
  const distCurve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = i / 511.5 - 1;
    distCurve[i] = Math.max(-1, Math.min(1, x * 6)) * 0.8 + Math.tanh(x * 2) * 0.2;
  }
  B.dist = ctx.createWaveShaper();
  B.dist.curve = distCurve;
  B.dist.oversample = '4x';
  const dg = ctx.createGain();
  dg.gain.value = 0.55;
  B.dist.connect(dg);
  dg.connect(B.sfx);
  // kurzes Ping-Pong-Echo für Sci-Fi-Raumgefühl
  B.echo = ctx.createGain();
  B.echo.connect(B.sfx);
  const ed = ctx.createDelay(0.5);
  ed.delayTime.value = 0.11;
  const ef = ctx.createGain();
  ef.gain.value = 0.32;
  const eh = ctx.createBiquadFilter();
  eh.type = 'highpass';
  eh.frequency.value = 900;
  B.echo.connect(ed);
  ed.connect(eh);
  eh.connect(ef);
  ef.connect(ed);
  if (ctx.createStereoPanner) {
    const ep = ctx.createStereoPanner();
    ep.pan.value = 0.45;
    eh.connect(ep);
    ep.connect(B.sfx);
  } else eh.connect(B.sfx);
  B.mus = ctx.createGain();
  B.mus.gain.value = 0.3;
  B.mus.connect(B.master);
  B.pad = ctx.createGain();
  B.pad.connect(B.mus);
  const ms = ctx.createGain();
  ms.gain.value = 0.45;
  B.mus.connect(ms);
  ms.connect(B.rev);
  // Feedback-Delay für Arpeggio
  B.dly = ctx.createDelay(1);
  B.dly.delayTime.value = 0.33;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const df = ctx.createBiquadFilter();
  df.type = 'lowpass';
  df.frequency.value = 2600;
  B.dly.connect(df);
  df.connect(fb);
  fb.connect(B.dly);
  df.connect(B.mus);
  B.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = B.noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return B;
}

/* ---- Synth-Bausteine (zeitgesteuert, funktionieren auch offline) ---- */
function osc(B, out, t, { type = 'sine', f0, f1, dur, vol, att = 0.003, det = 0, ft, fq }) {
  const c = B.ctx,
    o = c.createOscillator(),
    g = c.createGain();
  o.type = type;
  o.detune.value = det;
  o.frequency.setValueAtTime(f0, t);
  if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let n = o;
  if (ft) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(ft[0], t);
    f.frequency.exponentialRampToValueAtTime(ft[1], t + dur);
    f.Q.value = fq || 1;
    o.connect(f);
    n = f;
  }
  n.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function noise(B, out, t, { dur, vol, type = 'bandpass', f0, f1, q = 1, att = 0.002 }) {
  const c = B.ctx,
    s = c.createBufferSource(),
    f = c.createBiquadFilter(),
    g = c.createGain();
  s.buffer = B.noise;
  f.type = type;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, f1 || f0), t + dur);
  f.Q.value = q;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(out);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

/* ---- Zusatz-Bausteine für knackige Sci-Fi-Sounds ---- */
// FM-Synthese: Träger + Modulator, Index fällt ab → metallischer Laser-Charakter
function fm(B, out, t, { f0, f1, ratio = 2, idx0 = 8, idx1 = 0, dur, vol, att = 0.001, type = 'sine', pan = 0 }) {
  const c = B.ctx,
    car = c.createOscillator(),
    mod = c.createOscillator(),
    mg = c.createGain(),
    g = c.createGain();
  car.type = type;
  car.frequency.setValueAtTime(f0, t);
  if (f1) car.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  mod.frequency.setValueAtTime(f0 * ratio, t);
  if (f1) mod.frequency.exponentialRampToValueAtTime(Math.max(20, f1 * ratio), t + dur);
  mg.gain.setValueAtTime(f0 * idx0, t);
  mg.gain.exponentialRampToValueAtTime(Math.max(1, f0 * idx1 + 1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  mod.connect(mg);
  mg.connect(car.frequency);
  car.connect(g);
  let n = g;
  if (pan && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    n = p;
  }
  n.connect(out);
  car.start(t);
  mod.start(t);
  car.stop(t + dur + 0.05);
  mod.stop(t + dur + 0.05);
}
// harter Klick als Transiente
const click = (B, o, t, v = 0.35, f = 6000) =>
  noise(B, o, t, { dur: 0.012, vol: v, f0: f, type: 'highpass', att: 0.0005 });
// kurzer Sub-Kick für Punch
const thump = (B, o, t, v = 0.6, f0 = 170, f1 = 42, d = 0.12) =>
  osc(B, o, t, { type: 'sine', f0, f1, dur: d, vol: v, att: 0.0008 });

// Klassische Analog-Stimme: verstimmte Oszillatoren → resonanter Tiefpass mit Hüllkurve, Tonhöhe fällt
function synth(
  B,
  out,
  t,
  {
    f0,
    f1,
    dur,
    vol,
    types = ['sawtooth', 'square'],
    det = [-14, 14],
    cut0 = 8000,
    cut1 = 400,
    q = 8,
    att = 0.001,
    pan = 0,
  },
) {
  const c = B.ctx,
    f = c.createBiquadFilter(),
    g = c.createGain();
  f.type = 'lowpass';
  f.Q.value = q;
  f.frequency.setValueAtTime(cut0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(60, cut1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  types.forEach((ty, i) => {
    const o = c.createOscillator();
    o.type = ty;
    o.detune.value = det[i % det.length];
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    o.connect(f);
    o.start(t);
    o.stop(t + dur + 0.05);
  });
  f.connect(g);
  let n = g;
  if (pan && c.createStereoPanner) {
    const p = c.createStereoPanner();
    p.pan.value = pan;
    g.connect(p);
    n = p;
  }
  n.connect(out);
}

const SFX = {
  ui: (B, o, t) => {
    osc(B, o, t, { type: 'square', f0: 2600, f1: 1900, dur: 0.03, vol: 0.06, ft: [9000, 3000] });
    click(B, o, t, 0.12, 9000);
  },
  /* ---- Schüsse: gesättigte, stark abtauchende Laser ---- */
  // Spieler-Tipp: fetter Unison-Laser mit Sättigung, Knack und Sub → Signature-Sound
  tap: (B, o, t) => {
    const p = (Math.random() - 0.5) * 0.4;
    synth(B, B.dist, t, {
      f0: 2400,
      f1: 70,
      dur: 0.11,
      vol: 0.09,
      types: ['sawtooth', 'square', 'sawtooth'],
      det: [-25, 0, 25],
      cut0: 12000,
      cut1: 900,
      q: 1.2,
      pan: p,
    });
    noise(B, B.crush, t, { dur: 0.035, vol: 0.4, f0: 7000, f1: 2500, q: 0.6 });
    thump(B, o, t, 0.3, 200, 55, 0.06);
    click(B, o, t, 0.3, 6000);
  },
  // Schützin: kurzer, bissiger Rechteck-Blaster
  shoot: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 1600 + Math.random() * 150,
      f1: 220,
      dur: 0.075,
      vol: 0.05,
      types: ['square', 'square'],
      det: [-12, 12],
      cut0: 9000,
      cut1: 1200,
      q: 1,
      pan: (Math.random() - 0.5) * 0.6,
    });
    noise(B, o, t, { dur: 0.025, vol: 0.14, f0: 6000, type: 'highpass' });
  },
  // Wächterin: Phaser mit Chorus
  shoot2: (B, o, t) => {
    synth(B, B.drive, t, {
      f0: 700,
      f1: 260,
      dur: 0.11,
      vol: 0.07,
      types: ['sawtooth', 'sawtooth'],
      det: [-35, 35],
      cut0: 5000,
      cut1: 700,
      q: 1.5,
    });
  },
  // Drohnen: kleines, knackiges Pew
  drone: (B, o, t) => {
    synth(B, B.crush, t, {
      f0: 2200 + Math.random() * 300,
      f1: 500,
      dur: 0.04,
      vol: 0.1,
      types: ['square'],
      cut0: 9000,
      cut1: 2000,
      q: 0.8,
      pan: (Math.random() - 0.5) * 0.8,
    });
  },
  beam: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 3000,
      f1: 900,
      dur: 0.06,
      vol: 0.025,
      types: ['sawtooth', 'sawtooth'],
      det: [-30, 30],
      cut0: 10000,
      cut1: 2500,
      q: 1,
      pan: (Math.random() - 0.5) * 0.8,
    });
    noise(B, o, t, { dur: 0.05, vol: 0.07, f0: 8000, type: 'highpass' });
  },
  // Geschütz: Synth-Kanone mit Wumms
  turret: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 420,
      f1: 45,
      dur: 0.16,
      vol: 0.1,
      types: ['sawtooth', 'square'],
      det: [-20, 20],
      cut0: 6000,
      cut1: 300,
      q: 1.2,
    });
    noise(B, B.crush, t, { dur: 0.06, vol: 0.35, f0: 4000, f1: 900, q: 0.6 });
    thump(B, o, t, 0.45, 150, 40, 0.12);
    click(B, o, t, 0.3, 4000);
  },
  tapmiss: (B, o, t) => {
    synth(B, o, t, { f0: 1200, f1: 300, dur: 0.05, vol: 0.04, types: ['square'], cut0: 5000, cut1: 800, q: 1 });
  },
  crit: (B, o, t) => {
    SFX.tap(B, o, t);
    noise(B, B.dist, t, { dur: 0.09, vol: 0.5, f0: 3500, f1: 900, q: 0.5 });
    osc(B, B.dist, t, { type: 'square', f0: 900, f1: 3200, dur: 0.07, vol: 0.07, ft: [12000, 6000] });
    thump(B, B.drive, t, 0.5, 220, 40, 0.15);
  },
  hit: (B, o, t) => {
    osc(B, B.crush, t, { type: 'square', f0: 420, f1: 180, dur: 0.05, vol: 0.14 });
    click(B, o, t, 0.25);
  },
  slash: (B, o, t) => {
    const p = (Math.random() - 0.5) * 0.5;
    noise(B, o, t, { dur: 0.07, vol: 0.55, f0: 11000, f1: 2600, q: 1.6, att: 0.002 });
    synth(B, B.dist, t, {
      f0: 2600,
      f1: 500,
      dur: 0.065,
      vol: 0.06,
      types: ['sawtooth', 'sawtooth'],
      det: [-20, 20],
      cut0: 11000,
      cut1: 2000,
      q: 1,
      pan: p,
    });
    click(B, o, t, 0.35, 8000);
  },
  heavy: (B, o, t) => {
    noise(B, o, t, { dur: 0.1, vol: 0.6, f0: 9000, f1: 1800, q: 1.2, att: 0.002 });
    synth(B, B.dist, t, {
      f0: 1900,
      f1: 150,
      dur: 0.1,
      vol: 0.08,
      types: ['sawtooth', 'square'],
      det: [-20, 20],
      cut0: 9000,
      cut1: 900,
      q: 1,
    });
    explode(B, t + 0.01, 0.45, 0.18);
    click(B, o, t, 0.5, 6000);
  },
  whirl: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 200,
      f1: 2400,
      dur: 0.3,
      vol: 0.06,
      types: ['sawtooth', 'sawtooth'],
      det: [-30, 30],
      cut0: 2000,
      cut1: 12000,
      q: 1.5,
      att: 0.04,
    });
    for (let i = 0; i < 4; i++) {
      noise(B, o, t + 0.08 + i * 0.06, { dur: 0.06, vol: 0.4, f0: 10000, f1: 2400, q: 1.5 });
      click(B, o, t + 0.08 + i * 0.06, 0.25, 8000);
    }
    explode(B, t + 0.1, 0.7, 0.3);
  },
  zap: (B, o, t) => {
    fm(B, B.crush, t, { f0: 1300, f1: 400, ratio: 7.1, idx0: 18, idx1: 3, dur: 0.11, vol: 0.12, type: 'square' });
    noise(B, B.dist, t, { dur: 0.07, vol: 0.25, f0: 7000, f1: 3000, q: 0.7 });
    click(B, o, t, 0.25, 9000);
  },
  /* ---- Explosionen: heller Knall + verzerrter Körper + Knistern + Sub ---- */
  kill: (B, o, t) => {
    explode(B, t, 0.32, 0.13, (Math.random() - 0.5) * 0.7);
  },
  killbig: (B, o, t) => {
    explode(B, t, 0.6, 0.3);
    crackle(B, t + 0.04, 0.35, 10, 0.18);
  },
  base: (B, o, t) => {
    explode(B, t, 0.8, 0.28);
    fm(B, o, t, { f0: 330, f1: 220, ratio: 1.07, idx0: 4, dur: 0.25, vol: 0.07, type: 'square' });
  },
  shield: (B, o, t) => {
    fm(B, o, t, { f0: 1900, f1: 1100, ratio: 1.5, idx0: 6, idx1: 1, dur: 0.13, vol: 0.14 });
    noise(B, B.dist, t, { dur: 0.05, vol: 0.2, f0: 8000, f1: 4000, q: 0.7 });
    click(B, o, t, 0.3, 9000);
  },
  pulse: (B, o, t) => {
    explode(B, t, 0.85, 0.45);
    noise(B, o, t, { dur: 0.4, vol: 0.3, f0: 600, f1: 9000, q: 1.5, att: 0.01 });
    osc(B, B.drive, t, { type: 'sawtooth', f0: 55, f1: 40, dur: 0.4, vol: 0.15, ft: [3000, 90], fq: 2 });
  },
  abil: (B, o, t) => {
    [0, 7, 12, 19].forEach((s, i) =>
      synth(B, B.drive, t + i * 0.035, {
        f0: NOTE(69 + s),
        f1: NOTE(69 + s),
        dur: 0.08,
        vol: 0.05,
        types: ['square', 'sawtooth'],
        det: [-10, 10],
        cut0: 9000,
        cut1: 2000,
        q: 1,
      }),
    );
    synth(B, B.dist, t, {
      f0: 300,
      f1: 3000,
      dur: 0.2,
      vol: 0.04,
      types: ['sawtooth'],
      cut0: 3000,
      cut1: 12000,
      q: 1,
      att: 0.02,
    });
  },
  down: (B, o, t) => {
    synth(B, B.crush, t, {
      f0: 1200,
      f1: 50,
      dur: 0.4,
      vol: 0.1,
      types: ['sawtooth', 'square'],
      det: [-15, 15],
      cut0: 8000,
      cut1: 300,
      q: 1,
    });
    click(B, o, t, 0.3);
  },
  wave: (B, o, t) => {
    for (const n of [69, 76, 81])
      synth(B, B.drive, t, {
        f0: NOTE(n),
        f1: NOTE(n),
        dur: 0.2,
        vol: 0.035,
        types: ['sawtooth', 'square'],
        det: [-12, 12],
        cut0: 9000,
        cut1: 1200,
        q: 1,
      });
    for (const n of [72, 79, 84])
      synth(B, B.echo, t + 0.2, {
        f0: NOTE(n),
        f1: NOTE(n),
        dur: 0.28,
        vol: 0.03,
        types: ['sawtooth', 'square'],
        det: [-12, 12],
        cut0: 9000,
        cut1: 1200,
        q: 1,
      });
    click(B, o, t, 0.3, 6000);
  },
  bosswave: (B, o, t) => {
    for (let i = 0; i < 4; i++) {
      const f = i % 2 ? 330 : 440;
      synth(B, B.dist, t + i * 0.22, {
        f0: f,
        f1: f,
        dur: 0.2,
        vol: 0.06,
        types: ['square', 'sawtooth'],
        det: [-15, 15],
        cut0: 5000,
        cut1: 2500,
        q: 1,
      });
    }
    osc(B, B.drive, t, { type: 'sawtooth', f0: NOTE(33), dur: 1.4, vol: 0.18, att: 0.15, ft: [200, 1500], fq: 3 });
    thump(B, B.drive, t, 0.9, 90, 30, 0.6);
  },
  boss: (B, o, t) => {
    explode(B, t, 1, 0.9);
    crackle(B, t + 0.05, 1.1, 30, 0.25);
    explode(B, t + 0.28, 0.6, 0.5, 0.4);
    explode(B, t + 0.5, 0.55, 0.45, -0.4);
    [0, 3, 7, 12, 15, 19].forEach((s, i) =>
      synth(B, B.echo, t + 0.15 + i * 0.05, {
        f0: NOTE(69 + s),
        f1: NOTE(69 + s),
        dur: 0.16,
        vol: 0.04,
        types: ['square', 'sawtooth'],
        det: [-10, 10],
        cut0: 9000,
        cut1: 1500,
        q: 1,
      }),
    );
  },
  lose: (B, o, t) => {
    explode(B, t, 1, 1);
    crackle(B, t + 0.1, 1.2, 26, 0.2);
    [64, 60, 57, 52].forEach((n, i) =>
      synth(B, B.drive, t + 0.3 + i * 0.16, {
        f0: NOTE(n),
        f1: NOTE(n) * 0.5,
        dur: 0.55,
        vol: 0.05,
        types: ['sawtooth', 'sawtooth'],
        det: [-15, 15],
        cut0: 5000,
        cut1: 250,
        q: 1,
      }),
    );
  },
  buy: (B, o, t) => {
    synth(B, o, t, {
      f0: NOTE(88),
      f1: NOTE(88),
      dur: 0.05,
      vol: 0.06,
      types: ['square', 'sawtooth'],
      det: [-8, 8],
      cut0: 10000,
      cut1: 4000,
      q: 1,
    });
    synth(B, B.echo, t + 0.05, {
      f0: NOTE(95),
      f1: NOTE(95),
      dur: 0.14,
      vol: 0.06,
      types: ['square', 'sawtooth'],
      det: [-8, 8],
      cut0: 10000,
      cut1: 2500,
      q: 1,
    });
    click(B, o, t, 0.2, 9000);
  },
  no: (B, o, t) => {
    osc(B, B.crush, t, { type: 'square', f0: 110, dur: 0.06, vol: 0.12 });
    osc(B, B.crush, t + 0.08, { type: 'square', f0: 92, dur: 0.09, vol: 0.12 });
  },
  nova: (B, o, t) => {
    noise(B, o, t, { dur: 1.6, vol: 0.45, f0: 200, f1: 12000, q: 0.7, att: 1.2 });
    synth(B, B.dist, t, {
      f0: 80,
      f1: 1600,
      dur: 1.5,
      vol: 0.04,
      types: ['sawtooth', 'sawtooth'],
      det: [-30, 30],
      cut0: 600,
      cut1: 12000,
      q: 1,
      att: 1,
    });
    explode(B, t + 1.5, 1, 1.1);
    crackle(B, t + 1.55, 1.2, 30, 0.22);
    [45, 52, 57, 64, 69, 76].forEach((n, i) =>
      synth(B, B.echo, t + 1.5 + i * 0.04, {
        f0: NOTE(n),
        f1: NOTE(n),
        dur: 0.5,
        vol: 0.035,
        types: ['square', 'sawtooth'],
        det: [-12, 12],
        cut0: 9000,
        cut1: 1200,
        q: 1,
      }),
    );
  },
};
// Explosion: v = Lautstärke, size = Länge/Größe (0.1 klein … 1 riesig), pan = Stereoposition
function explode(B, t, v, size, pan = 0) {
  const d = 0.08 + size * 0.7;
  noise(B, B.dist, t, { dur: 0.02 + size * 0.03, vol: v * 1.1, f0: 6500, f1: 2800, q: 0.4, att: 0.0005 }); // heller Knall
  noise(B, B.dist, t + 0.004, { dur: d, vol: v * 0.7, f0: 2600, f1: 260, q: 0.5, att: 0.002 }); // verzerrter Körper
  noise(B, B.crush, t, { dur: d * 0.6, vol: v * 0.4, f0: 9000, f1: 3000, type: 'highpass' }); // digitales Zischen
  thump(B, B.drive, t, v * (size < 0.2 ? 0.45 : 0.85), 140 + size * 40, 28, 0.08 + size * 0.35); // Sub-Drop
  synth(B, B.dist, t, {
    f0: 900,
    f1: 60,
    dur: 0.05 + size * 0.15,
    vol: v * 0.06,
    types: ['square', 'sawtooth'],
    det: [-20, 20],
    cut0: 7000,
    cut1: 300,
    q: 1,
    pan,
  });
}
// Knistern: viele winzige, zufällige Klicks im Nachhall
function crackle(B, t, dur, n, v) {
  for (let i = 0; i < n; i++) {
    const tt = t + Math.pow(Math.random(), 1.6) * dur;
    noise(B, B.crush, tt, {
      dur: 0.008 + Math.random() * 0.012,
      vol: v * (1 - (tt - t) / dur) * (0.4 + Math.random() * 0.6),
      f0: 3000 + Math.random() * 6000,
      q: 0.8,
      att: 0.0005,
    });
  }
}

/* ---- Generativer Synthwave-Komponist (harmonisch sauber) ---- */
// Akkorde relativ zu A (MIDI 57); V nutzt harmonisch Moll (G#)
const CHORDS = {
  i: [0, 3, 7],
  iv: [5, 8, 12],
  v: [7, 10, 14],
  V: [7, 11, 14],
  VI: [8, 12, 15],
  VII: [10, 14, 17],
  III: [3, 7, 10],
};
const PROGS = [
  ['i', 'VI', 'III', 'VII'],
  ['i', 'VII', 'VI', 'VII'],
  ['i', 'iv', 'VI', 'V'],
  ['VI', 'VII', 'i', 'i'],
  ['i', 'VI', 'iv', 'V'],
  ['iv', 'i', 'VII', 'VI'],
  ['i', 'III', 'VII', 'iv'],
  ['VI', 'iv', 'i', 'V'],
];
const SC_NAT = [0, 2, 3, 5, 7, 8, 10],
  SC_HARM = [0, 2, 3, 5, 7, 8, 11];
const pcsOf = ch => CHORDS[ch].map(x => x % 12);
const scaleFor = ch => (ch === 'V' ? SC_HARM : SC_NAT);
const inSet = (m, set) => set.includes((((m - 57) % 12) + 12) % 12);
// singbare Rhythmen (betonte Zählzeiten 0/4/8/12 meist belegt)
const MEL_R = [
  'x...x...x.x.x...',
  'x.x.x...x...x...',
  'x...x.x.x...x...',
  'x..x..x.x...x...',
  'x...x...x..x.x..',
  'x.x...x.x...x...',
];
const MEL_END = 'x...x...x.......';
const ARPS = [
  [0, 1, 2, 1],
  [0, 1, 2, 3],
  [3, 2, 1, 0],
  [0, 2, 1, 3],
  [0, 1, 0, 2, 0, 3, 0, 2],
  [0, 3, 1, 3, 2, 3, 1, 3],
  [0, 1, 2, 3, 2, 1],
  [2, 0, 3, 1],
];
const _ = null;
const BASSP = [
  [0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _],
  [_, _, 0, _, _, _, 0, _, _, _, 0, _, _, _, 0, 12],
  [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, 7, 12, _],
  [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 7, 12],
  [0, _, _, 0, _, _, 0, _, _, 0, _, _, 0, _, 12, _],
  [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12],
];
const DRUMP = {
  four: { k: [0, 4, 8, 12], sn: [4, 12] },
  drive: { k: [0, 4, 8, 12, 14], sn: [4, 12] },
  brk: { k: [0, 6, 10], sn: [4, 12], gh: [7, 15] },
  half: { k: [0], sn: [8] },
  gallop: { k: [0, 3, 4, 8, 11, 12], sn: [4, 12] },
};
const rpick = a => a[Math.floor(Math.random() * a.length)];

// Melodie für 4 Takte: Akkordtöne auf betonten Zählzeiten, Schritte dazwischen, Phrase endet auf dem Grundton
function makeMelody(prog) {
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
      notes[p] = { m, len: Math.min(4, nx - p) + (last ? 4 : 0) };
      prev = m;
    });
    bars.push(notes);
  }
  return bars;
}

const Music = {
  step: 0,
  next: 0,
  timer: null,
  tempo: 100,
  secTempo: 100,
  tr: 0,
  st: { menu: true, E: 0, W: 0, danger: 0, boss: false, tr: 0 },
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
    if (this.log) this.log.push({ kind, m, ch: this.sec.prog[this.sec.bar % 4], s: this.cur });
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
      if (brk) noise(B, o, t, { dur: beat * 16, vol: 0.12, f0: 9000, f1: 300, q: 1.2 });
      else noise(B, o, t, { dur: 1.8, vol: 0.1 + Math.max(0, E) * 0.05, f0: 5000, f1: 3000, type: 'highpass' });
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
        osc(B, o, t, { type: 'sine', f0: R(45 + C[0]), dur: beat * 16, vol: 0.06, att: 0.5 });
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
      osc(B, B.dly, t, { type: 'triangle', f0: R(n), dur: beat, vol: 0.018 });
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
        osc(B, o, t, { type: 'sine', f0: 165, f1: 42, dur: 0.24, vol: brk ? 0.35 : 0.6, att: 0.001 });
        click(B, o, t, 0.12, 3000);
        const g = B.pad.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(0.25, t);
        g.linearRampToValueAtTime(1, t + beat * 3);
      }
    }
    if (D.sn.includes(s) && !fill) {
      noise(B, o, t, { dur: 0.16, vol: 0.27, f0: 1900, f1: 1000, q: 0.8 });
      noise(B, o, t + 0.006, { dur: 0.07, vol: 0.13, f0: 4500, type: 'highpass' });
    }
    if (D.gh && D.gh.includes(s)) noise(B, o, t, { dur: 0.05, vol: 0.08, f0: 2200, q: 0.8 });
    if (fill) {
      const k = s >= 12 ? 2 : 1;
      for (let i = 0; i < k; i++) {
        const tt = t + (i * beat) / 2;
        if (s < 12 || (i === 0 && s % 2))
          noise(B, o, tt, { dur: 0.06, vol: 0.12 + (s - 8) * 0.025, f0: 2200, f1: 1300, q: 0.8 });
        else noise(B, o, tt, { dur: 0.09, vol: 0.2, f0: 900 - (s - 12) * 120, f1: 300, q: 1.2 });
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
      noise(B, o, t, { dur: beat * 16, vol: 0.12, f0: 300, f1: 11000, q: 2.5, att: beat * 15 });
    // Gefahr: hohe, tonartgerechte Oktav-Pulse statt Dissonanz
    if (S.danger > 0.45 && (s === 2 || s === 10)) {
      const n = 69 + 12 + C[0];
      this.note('alarm', n);
      osc(B, o, t, { type: 'square', f0: R(n), dur: beat * 0.8, vol: 0.03, ft: [6000, 2500] });
    }
    // Boss: treibende tiefe Grundton-Achtel
    if (S.boss && s % 2 === 0) {
      const n = 33 + C[0] + (s % 8 === 6 ? 7 : 0);
      this.note('boss', n);
      osc(B, o, t, { type: 'sawtooth', f0: R(n), dur: beat * 1.6, vol: 0.09, ft: [1200, 200], fq: 4 });
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
    if (!B || !(save.volMus > 0) || B.ctx.state !== 'running') return;
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
const Track = {
  cur: null,
  list: [],
  made: 0,
  freed: 0,
  ctx: null,
  // Jede Tonquelle bekommt ihr Ende über stop(t) gesagt; das späteste Ende eines Aufrufs gilt für alle seine Bausteine. Auf das Ereignis „ended“ ist in Safari kein Verlass.
  wrap(ctx) {
    this.ctx = ctx;
    for (const m of [
      'createOscillator',
      'createBufferSource',
      'createGain',
      'createBiquadFilter',
      'createStereoPanner',
      'createDelay',
      'createWaveShaper',
      'createConstantSource',
    ]) {
      const f = ctx[m];
      if (!f) continue;
      ctx[m] = function () {
        const n = f.apply(ctx, arguments),
          b = Track.cur;
        if (b) {
          b.nodes.push(n);
          Track.made++;
          if (typeof n.stop === 'function') {
            const st = n.stop;
            n.stop = function (t) {
              if (t > b.end) b.end = t;
              return st.call(n, t);
            };
          }
        }
        return n;
      };
    }
    if (!this.timer) this.timer = setInterval(() => Track.sweep(), 500);
  },
  run(fn) {
    const prev = this.cur,
      b = (this.cur = { nodes: [], end: 0 });
    try {
      fn();
    } finally {
      this.cur = prev;
      if (b.nodes.length) {
        if (!b.end) b.end = this.ctx.currentTime + 30;
        this.list.push(b);
      }
    }
  },
  sweep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime - 0.3,
      L = this.list;
    if (!L.length) return;
    let k = 0;
    for (let i = 0; i < L.length; i++) {
      const b = L[i];
      if (b.end < now) {
        for (const x of b.nodes) {
          try {
            x.disconnect();
          } catch (e) {}
        }
        this.freed += b.nodes.length;
      } else L[k++] = b;
    }
    L.length = k;
  },
};
/* ---- Steuerung ---- */
const Snd = {
  ctx: null,
  B: null,
  last: {},
  unlocked: false,
  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC({ latencyHint: 'interactive' });
        this.B = buildBus(this.ctx, this.ctx.destination);
        Track.wrap(this.ctx);
        this.vol();
      } catch (e) {
        return;
      }
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (!this.unlocked) {
      this.unlocked = true;
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
      } catch (e) {}
      try {
        const a = new Audio(
          'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YZABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );
        a.setAttribute('playsinline', '');
        a.volume = 0.01;
        a.play().catch(() => {});
      } catch (e) {}
      try {
        const b = this.ctx.createBuffer(1, 1, 22050),
          s = this.ctx.createBufferSource();
        s.buffer = b;
        s.connect(this.ctx.destination);
        s.start(0);
      } catch (e) {}
    }
    Music.start();
  },
  vol() {
    const B = this.B;
    if (!B) return;
    const t = this.ctx.currentTime,
      cv = v => Math.pow(clamp(v, 0, 100) / 100, 1.6);
    B.mus.gain.setTargetAtTime(0.53 * cv(save.volMus), t, 0.05);
    B.sfx.gain.setTargetAtTime(1 * cv(save.volSfx), t, 0.05);
  },
  play(n) {
    const B = this.B;
    if (!(save.volSfx > 0) || !B || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const lim =
      {
        killbig: 0.08,
        drone: 0.09,
        beam: 0.09,
        turret: 0.1,
        shoot: 0.06,
        shoot2: 0.08,
        kill: 0.05,
        hit: 0.06,
        slash: 0.07,
        heavy: 0.1,
        tap: 0.09,
        zap: 0.08,
        base: 0.12,
        shield: 0.1,
        ui: 0.04,
        crit: 0.09,
      }[n] || 0.05;
    if (this.last[n] && now - this.last[n] < lim) return;
    this.last[n] = now;
    const f = SFX[n];
    if (f) Track.run(() => f(B, B.sfx, now + 0.005));
  },
  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  },
};
// Beim Verlassen oder Neuladen der Seite den Ton-Unterbau schließen. Sonst bleibt er in Safari über das Neuladen hinaus im selben Prozess liegen (vom Nutzer beobachtet:
// Ruckler und stotternder Ton auch direkt nach dem Neuladen). Beim nächsten Antippen baut Snd.init alles neu auf.
addEventListener('pagehide', () => {
  try {
    for (const b of Track.list)
      for (const x of b.nodes) {
        try {
          x.disconnect();
        } catch (e) {}
      }
    Track.list.length = 0;
    Track.ctx = null;
    if (Snd.ctx) {
      const c = Snd.ctx;
      Snd.ctx = null;
      Snd.B = null;
      Snd.unlocked = false;
      Snd.last = {};
      Music.next = 0;
      c.close().catch(() => {});
    }
  } catch (e) {}
});
for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'])
  document.addEventListener(ev, () => Snd.init(), { capture: true, passive: true });
document.addEventListener('click', e => {
  const t = e.composedPath()[0] || e.target;
  if (t.closest && t.closest('.btn')) Snd.play('ui');
});
