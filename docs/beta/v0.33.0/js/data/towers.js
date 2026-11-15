export const TOWERS = {
  frost: {
    name: 'Frost-Turm',
    col: '#5ab8ff',
    cost: 25,
    unlock: null,
    text: 'Verlangsamt alle Gegner in seinem Radius. Bosse nur halb so stark.',
    r: l => 98 + 3 * l,
    fx: l => ({
      slow: Math.min(0.55, 0.25 + 0.012 * l),
    }),
  },
  weak: {
    name: 'Zerfall-Turm',
    col: '#d65cff',
    cost: 40,
    unlock: ['k', 10],
    text: 'Gegner in seinem Radius nehmen mehr Schaden und richten weniger an.',
    r: l => 98 + 3 * l,
    fx: l => ({
      vuln: 1.12 + 0.012 * l,
      weak: 0.88 - 0.008 * l,
    }),
  },
  cryo: {
    name: 'Kryo-Turm',
    col: '#bff4ff',
    cost: 60,
    unlock: ['p', 2],
    text: 'Friert regelmäßig alle Gegner im Radius ein. Bosse werden stattdessen verlangsamt.',
    r: l => 88 + 3 * l,
    fx: l => ({
      cd: 6.6 - 0.08 * l,
      dur: 1.2 + 0.05 * l,
    }),
  },
  // Hilfstürme (aux): stapeln und kombinieren nicht mit den anderen. Stör-Turm nimmt Gegnern die Fähigkeiten, Markier-Turm verstärkt den Impuls.
  mute: {
    name: 'Stör-Turm',
    col: '#ffb02e',
    cost: 50,
    unlock: ['k', 25],
    aux: 1,
    text: 'Gegner in seinem Radius verlieren ihre Fähigkeiten: Heiler, Schwarmkönigin, Kommandant, Störsender, Hacker, Schattenwerfer und Springer. Tarner und Phasenläufer werden sichtbar. Wirkt nicht auf Bosse.',
    r: l => 84 + 3 * l,
    fx: l => ({
      mute: 1,
    }),
  },
  mark: {
    name: 'Markier-Turm',
    col: '#ffe14f',
    cost: 45,
    unlock: ['p', 4],
    aux: 1,
    text: 'Gegner in seinem Radius sind markiert und nehmen mehr Schaden durch den Impuls. Wirkt auch auf Bosse.',
    r: l => 92 + 3 * l,
    fx: l => ({
      mark: 1.5 + 0.05 * l,
    }),
  },
};

export const COMBOS = [
  {
    bit: 1,
    need: ['frost', 'frost'],
    name: 'Sturmfront',
    col: '#7fd0ff',
    text: 'Zusätzlich zur Verlangsamung werden Gegner alle paar Sekunden zurückgestoßen.',
  },
  {
    bit: 2,
    need: ['frost', 'weak'],
    name: 'Vergiftung',
    col: '#8cff4f',
    text: 'Gift frisst 1,5 % des Gegnerlebens pro Sekunde (Bosse 0,3 %).',
  },
  {
    bit: 4,
    need: ['weak', 'weak'],
    name: 'Schwachstelle',
    col: '#ff4fd8',
    text: 'Noch etwas mehr Schaden (+10 %) und 10 % Chance auf doppelten Schaden.',
  },
  {
    bit: 8,
    need: ['frost', 'cryo'],
    name: 'Permafrost',
    col: '#bff4ff',
    text: 'Eingefrorene Gegner bleiben 50 % länger gefroren.',
  },
  {
    bit: 16,
    need: ['weak', 'cryo'],
    name: 'Zersplittern',
    col: '#e0b0ff',
    text: 'Eingefrorene Gegner nehmen doppelten Schaden.',
  },
  {
    bit: 32,
    need: ['cryo', 'cryo'],
    name: 'Nullpunkt',
    col: '#ffffff',
    text: 'Jedes Einfrieren verursacht Kälteschaden von 4 % des Gegnerlebens (Bosse 1 %).',
  },
];

export const comboOf = (a, b) =>
  COMBOS.find(c => (c.need[0] === a && c.need[1] === b) || (c.need[0] === b && c.need[1] === a));

export const TOWER_IDS = Object.keys(TOWERS),
  TOWER_MAX = 25,
  SLOT_BASE = 2,
  SLOT_EXTRA = 4;

export const towerLvlCost = l =>
  l < 8
    ? ['s', Math.ceil(150 * Math.pow(1.7, l - 1))]
    : l < 16
      ? ['k', Math.ceil(10 * Math.pow(1.45, l - 8))]
      : ['p', Math.ceil(2 * Math.pow(1.35, l - 16))];

export const slotCost = n => ['p', 2 * (n + 1)];
