/* ---- Synth-Bausteine (zeitgesteuert, funktionieren auch offline) ---- */
export function osc(B, out, t, { type = 'sine', f0, f1, dur, vol, att = 0.003, det = 0, ft, fq }) {
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

export function noise(B, out, t, { dur, vol, type = 'bandpass', f0, f1, q = 1, att = 0.002 }) {
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

/* ---- Zusatz-Bausteine für knackige Sci-Fi-Sounds ---- */
// FM-Synthese: Träger + Modulator, Index fällt ab → metallischer Laser-Charakter
export function fm(
  B,
  out,
  t,
  { f0, f1, ratio = 2, idx0 = 8, idx1 = 0, dur, vol, att = 0.001, type = 'sine', pan = 0 },
) {
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

// harter Klick als Transiente
export const click = (B, o, t, v = 0.35, f = 6000) =>
  noise(B, o, t, {
    dur: 0.012,
    vol: v,
    f0: f,
    type: 'highpass',
    att: 0.0005,
  });
// kurzer Sub-Kick für Punch

// kurzer Sub-Kick für Punch
export const thump = (B, o, t, v = 0.6, f0 = 170, f1 = 42, d = 0.12) =>
  osc(B, o, t, {
    type: 'sine',
    f0,
    f1,
    dur: d,
    vol: v,
    att: 0.0008,
  });

// Klassische Analog-Stimme: verstimmte Oszillatoren → resonanter Tiefpass mit Hüllkurve, Tonhöhe fällt

// Klassische Analog-Stimme: verstimmte Oszillatoren → resonanter Tiefpass mit Hüllkurve, Tonhöhe fällt
export function synth(
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

// Explosion: v = Lautstärke, size = Länge/Größe (0.1 klein … 1 riesig), pan = Stereoposition
export function explode(B, t, v, size, pan = 0) {
  const d = 0.08 + size * 0.7;
  noise(B, B.dist, t, {
    dur: 0.02 + size * 0.03,
    vol: v * 1.1,
    f0: 6500,
    f1: 2800,
    q: 0.4,
    att: 0.0005,
  }); // heller Knall
  noise(B, B.dist, t + 0.004, {
    dur: d,
    vol: v * 0.7,
    f0: 2600,
    f1: 260,
    q: 0.5,
    att: 0.002,
  }); // verzerrter Körper
  noise(B, B.crush, t, {
    dur: d * 0.6,
    vol: v * 0.4,
    f0: 9000,
    f1: 3000,
    type: 'highpass',
  }); // digitales Zischen
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

// Knistern: viele winzige, zufällige Klicks im Nachhall
export function crackle(B, t, dur, n, v) {
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
