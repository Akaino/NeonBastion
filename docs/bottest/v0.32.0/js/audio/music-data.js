/* ================= AUDIO ================= */
export const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
// A-Moll: Am – F – C – G, jeweils als MIDI-Noten

// A-Moll: Am – F – C – G, jeweils als MIDI-Noten
export const PROG = [
  {
    root: 45,
    ch: [57, 60, 64],
  },
  {
    root: 41,
    ch: [53, 57, 60],
  },
  {
    root: 48,
    ch: [55, 60, 64],
  },
  {
    root: 43,
    ch: [55, 59, 62],
  },
];

export const PENTA = [69, 72, 74, 76, 79, 81, 84, 86, 88, 91];

// Lautstärken in Prozent. Die Oberfläche trägt hier die Werte aus dem Spielstand ein (syncSound in ui.js); der Ton kennt den Spielstand nicht.

// Lautstärken in Prozent. Die Oberfläche trägt hier die Werte aus dem Spielstand ein (syncSound in ui.js); der Ton kennt den Spielstand nicht.
export const Vol = {
  mus: 70,
  sfx: 80,
};

/* ---- Generativer Synthwave-Komponist (harmonisch sauber) ---- */
// Akkorde relativ zu A (MIDI 57); V nutzt harmonisch Moll (G#)
export const CHORDS = {
  i: [0, 3, 7],
  iv: [5, 8, 12],
  v: [7, 10, 14],
  V: [7, 11, 14],
  VI: [8, 12, 15],
  VII: [10, 14, 17],
  III: [3, 7, 10],
};

export const PROGS = [
  ['i', 'VI', 'III', 'VII'],
  ['i', 'VII', 'VI', 'VII'],
  ['i', 'iv', 'VI', 'V'],
  ['VI', 'VII', 'i', 'i'],
  ['i', 'VI', 'iv', 'V'],
  ['iv', 'i', 'VII', 'VI'],
  ['i', 'III', 'VII', 'iv'],
  ['VI', 'iv', 'i', 'V'],
];

export const SC_NAT = [0, 2, 3, 5, 7, 8, 10],
  SC_HARM = [0, 2, 3, 5, 7, 8, 11];

export const pcsOf = ch => CHORDS[ch].map(x => x % 12);

export const scaleFor = ch => (ch === 'V' ? SC_HARM : SC_NAT);

export const inSet = (m, set) => set.includes((((m - 57) % 12) + 12) % 12);
// singbare Rhythmen (betonte Zählzeiten 0/4/8/12 meist belegt)

// singbare Rhythmen (betonte Zählzeiten 0/4/8/12 meist belegt)
export const MEL_R = [
  'x...x...x.x.x...',
  'x.x.x...x...x...',
  'x...x.x.x...x...',
  'x..x..x.x...x...',
  'x...x...x..x.x..',
  'x.x...x.x...x...',
];

export const MEL_END = 'x...x...x.......';

export const ARPS = [
  [0, 1, 2, 1],
  [0, 1, 2, 3],
  [3, 2, 1, 0],
  [0, 2, 1, 3],
  [0, 1, 0, 2, 0, 3, 0, 2],
  [0, 3, 1, 3, 2, 3, 1, 3],
  [0, 1, 2, 3, 2, 1],
  [2, 0, 3, 1],
];

export const _ = null;

export const BASSP = [
  [0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _, 0, _],
  [_, _, 0, _, _, _, 0, _, _, _, 0, _, _, _, 0, 12],
  [0, _, 12, _, 0, _, 12, _, 0, _, 12, _, 0, 7, 12, _],
  [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 7, 12],
  [0, _, _, 0, _, _, 0, _, _, 0, _, _, 0, _, 12, _],
  [0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12, 0, 12],
];

export const DRUMP = {
  four: {
    k: [0, 4, 8, 12],
    sn: [4, 12],
  },
  drive: {
    k: [0, 4, 8, 12, 14],
    sn: [4, 12],
  },
  brk: {
    k: [0, 6, 10],
    sn: [4, 12],
    gh: [7, 15],
  },
  half: {
    k: [0],
    sn: [8],
  },
  gallop: {
    k: [0, 3, 4, 8, 11, 12],
    sn: [4, 12],
  },
};

export const rpick = a => a[Math.floor(Math.random() * a.length)];

// Melodie für 4 Takte: Akkordtöne auf betonten Zählzeiten, Schritte dazwischen, Phrase endet auf dem Grundton
