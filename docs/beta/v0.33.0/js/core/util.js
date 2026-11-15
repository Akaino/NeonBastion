export const PI = Math.PI,
  TAU = PI * 2;

export const rnd = (a, b) => a + Math.random() * (b - a);

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export const verNum = v => {
  const p = String(v || '0')
    .split('.')
    .map(Number);
  return (p[0] || 0) * 1e6 + (p[1] || 0) * 1e3 + (p[2] || 0);
};

export const hyp = (a, b) => Math.sqrt(a * a + b * b),
  sq = x => x * x; // sq statt **2: die Potenz ist in den innersten Schleifen spürbar langsamer
// Gegnertypen. from = erste Welle, share = Anteil an der Welle (wächst ab from um step je Welle bis max), bar = Lebensbalken zeigen.
// Die Reihenfolge in WAVE_MIX bestimmt, wer bei der Auswahl zuerst drankommt; der Rest der Welle sind Schwärmer.
