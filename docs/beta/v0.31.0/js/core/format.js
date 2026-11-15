export const NUM_UNITS = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
// Einheit für 1000^e: bis Qi die bekannten Kürzel, danach aa, ab, … zz

export // Einheit für 1000^e: bis Qi die bekannten Kürzel, danach aa, ab, … zz
const numUnit = e =>
  e < NUM_UNITS.length
    ? NUM_UNITS[e]
    : (k => String.fromCharCode(97 + (Math.floor(k / 26) % 26)) + String.fromCharCode(97 + (k % 26)))(
        e - NUM_UNITS.length,
      );

export function fmtN(n) {
  n = Math.floor(n);
  if (!isFinite(n)) return n !== n ? '0' : '∞';
  if (n < 1000) return String(n);
  let e = Math.floor(Math.log10(n) / 3),
    v = n / Math.pow(1000, e);
  if (v >= 999.5) {
    v /= 1000;
    e++;
  }
  return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0).replace('.', ',') + numUnit(e);
}

export const fmtD = (v, d = 1) => v.toFixed(d).replace('.', ',');
