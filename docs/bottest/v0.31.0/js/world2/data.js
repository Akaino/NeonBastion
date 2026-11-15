import { CUR, CUR_SRC } from '../data/currencies.js';
import { COMBOS, TOWERS } from '../data/towers.js';

/* ================= WELT 2: GITTERFESTUNG ================= */
CUR.c = {
  name: 'Schaltkreise',
  one: 'Schaltkreis',
  col: '#ffb03d',
};

CUR.m = {
  name: 'Matrixchips',
  one: 'Matrixchip',
  col: '#ff6b84',
};

export const CUR_IDS2 = ['c', 'm'];

CUR_SRC.c = 'Jeder besiegte Gegner in der Gitterfestung';

CUR_SRC.m = 'Bosse und Meilensteine alle 10 Wellen in der Gitterfestung';

// Schadenstürme (nur Welt 2). Unterstützungstürme aus Welt 1 bekommen hier größere Radien.

// Schadenstürme (nur Welt 2). Unterstützungstürme aus Welt 1 bekommen hier größere Radien.
Object.assign(TOWERS, {
  laser: {
    name: 'Laser-Turm',
    col: '#ff4f6d',
    cost: 40,
    dmgTower: true,
    text: 'Dauerstrahl mit hohem Einzelschaden auf den Gegner, der dem Kern am nächsten ist.',
    r: l => 150 + 3 * l,
    fx: l => ({
      dps: 22 * Math.pow(1.15, l - 1),
    }),
  },
  rocket: {
    name: 'Raketen-Turm',
    col: '#ff8a3d',
    cost: 60,
    dmgTower: true,
    text: 'Feuert Raketen in die dichteste Gegnergruppe. Flächenschaden.',
    r: l => 175 + 3 * l,
    fx: l => ({
      dmg: 40 * Math.pow(1.15, l - 1),
      cd: 1.6,
      splash: 48,
    }),
  },
  tesla: {
    name: 'Tesla-Turm',
    col: '#ffe14f',
    cost: 50,
    dmgTower: true,
    text: 'Kettenblitze, die von Gegner zu Gegner springen.',
    r: l => 135 + 3 * l,
    fx: l => ({
      dmg: 16 * Math.pow(1.15, l - 1),
      cd: 0.9,
      chain: 3,
    }),
  },
});

export const TOWER_IDS2 = ['laser', 'rocket', 'tesla', 'frost', 'weak', 'cryo'];

export const W2_SUPPORT_R = 1.35;

export const T2_UNLOCK = {
  laser: null,
  frost: null,
  rocket: ['c', 120],
  tesla: ['c', 300],
  weak: ['m', 3],
  cryo: ['m', 6],
};

export const towerLvlCost2 = l =>
  l < 10 ? ['c', Math.ceil(150 * Math.pow(1.7, l - 1))] : ['m', Math.ceil(3 * Math.pow(1.35, l - 10))];

export const slotCost2 = n => ['m', 3 * (n + 1)];

// Kombinationen aus Schadens- und Unterstützungsturm

// Kombinationen aus Schadens- und Unterstützungsturm
COMBOS.push(
  {
    bit: 0,
    need: ['laser', 'frost'],
    name: 'Kältelaser',
    col: '#9fd8ff',
    text: 'Laser verursacht +60 % Schaden an Gegnern in der Überschneidung.',
  },
  {
    bit: 0,
    need: ['laser', 'weak'],
    name: 'Brennpunkt',
    col: '#ff7ad9',
    text: 'Laser verursacht +40 % Schaden, Treffer zählen als kritisch.',
  },
  {
    bit: 0,
    need: ['laser', 'cryo'],
    name: 'Thermoschock',
    col: '#ffffff',
    text: 'Laser verursacht dreifachen Schaden an eingefrorenen Gegnern.',
  },
  {
    bit: 0,
    need: ['rocket', 'frost'],
    name: 'Frostgranate',
    col: '#9fd8ff',
    text: 'Raketen frieren getroffene Gegner kurz ein.',
  },
  {
    bit: 0,
    need: ['rocket', 'weak'],
    name: 'Säurebombe',
    col: '#8cff4f',
    text: 'Raketen hinterlassen Säure: 2 % des Gegnerlebens pro Sekunde für 3 Sekunden.',
  },
  {
    bit: 0,
    need: ['rocket', 'cryo'],
    name: 'Eissplitter',
    col: '#e0f6ff',
    text: 'Raketen haben +50 % Explosionsradius.',
  },
  {
    bit: 0,
    need: ['tesla', 'frost'],
    name: 'Supraleiter',
    col: '#bfefff',
    text: 'Blitze springen auf zwei zusätzliche Gegner.',
  },
  {
    bit: 0,
    need: ['tesla', 'weak'],
    name: 'Überladung',
    col: '#ff9fe8',
    text: 'Tesla verursacht +60 % Schaden.',
  },
  {
    bit: 0,
    need: ['tesla', 'cryo'],
    name: 'Kryoblitz',
    col: '#e8fbff',
    text: 'Blitze betäuben Gegner für 0,4 Sekunden.',
  },
);
