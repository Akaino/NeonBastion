import { fmtD } from '../core/format.js';
import { PI } from '../core/util.js';

export const BR2 = {
  k: {
    name: 'Kern',
    col: '#3df5ff',
    a: -90,
  },
  w: {
    name: 'Waffen',
    col: '#ff4f6d',
    a: 0,
  },
  u: {
    name: 'Unterstützung',
    col: '#5ab8ff',
    a: 90,
  },
  l: {
    name: 'Logistik',
    col: '#ffb03d',
    a: 180,
  },
};

export const NODE_DEFS2 = [
  ['k1', 'k', 'root', 1, 0, 'Kernpanzer', 40, 'c', 10, 1.25, l => `+${l * 20} % Leben des Kerns`],
  [
    'k2a',
    'k',
    'k1',
    2,
    -1,
    'Kernschild',
    10,
    'c',
    50,
    1.35,
    l => (l ? `Schild mit ${25 + (l - 1) * 8} % des Kernlebens` : 'Noch kein Schild'),
  ],
  [
    'k2b',
    'k',
    'k1',
    2,
    1,
    'Kernreparatur',
    10,
    'c',
    40,
    1.35,
    l => (l ? `Repariert ${fmtD(l * 0.3)} % Leben pro Sekunde` : 'Keine Reparatur'),
  ],
  ['k3', 'k', 'k2a', 3, -0.5, 'Kerngeschütz', 20, 'c', 80, 1.3, l => `+${l * 50} % Schaden des Kerngeschützes`],
  ['k4', 'k', 'k3', 4, 0, 'Festung', 25, 'm', 2, 1.35, l => `×${fmtD(Math.pow(1.1, l), 2)} Leben des Kerns`],
  ['k5', 'k', 'k4', 5, 0, 'Bastion', 10, 'm', 5, 1.5, l => `−${l * 5} % erlittener Schaden`],
  ['w1', 'w', 'root', 1, 0, 'Kalibrierung', 50, 'c', 12, 1.25, l => `+${l * 15} % Schaden aller Schadenstürme`],
  ['w2a', 'w', 'w1', 2, -1.3, 'Laserlinsen', 25, 'c', 60, 1.3, l => `+${l * 25} % Laserschaden`],
  ['w2b', 'w', 'w1', 2, 0, 'Sprengköpfe', 25, 'c', 60, 1.3, l => `+${l * 25} % Raketenschaden`],
  ['w2c', 'w', 'w1', 2, 1.3, 'Hochspannung', 25, 'c', 60, 1.3, l => `+${l * 25} % Tesla-Schaden`],
  ['w3', 'w', 'w2b', 3, 0, 'Feuerleitung', 15, 'm', 1, 1.4, l => `+${l * 8} % Feuerrate aller Schadenstürme`],
  ['w4', 'w', 'w3', 4, 0, 'Überlastung', 30, 'm', 3, 1.33, l => `×${fmtD(Math.pow(1.1, l), 2)} Schaden aller Türme`],
  ['w5', 'w', 'w4', 5, 0, 'Weitsicht', 10, 'm', 4, 1.5, l => `+${l * 5} % Reichweite aller Türme`],
  ['u1', 'u', 'root', 1, 0, 'Feldradius', 15, 'c', 20, 1.3, l => `+${l * 4} % Radius der Unterstützungstürme`],
  ['u2a', 'u', 'u1', 2, -1, 'Synergie', 20, 'c', 80, 1.3, l => `+${l * 10} % Stärke der Kombinationseffekte`],
  ['u2b', 'u', 'u1', 2, 1, 'Tiefkühlung', 10, 'c', 90, 1.35, l => `+${l * 15} % Einfrierdauer`],
  ['u3', 'u', 'u2a', 3, 0, 'Giftmischer', 10, 'm', 2, 1.4, l => `+${l * 20} % Gift- und Säureschaden`],
  ['u4', 'u', 'u3', 4, 0, 'Resonanzkern', 5, 'm', 6, 1.6, l => `+${l * 10} % Wirkung aller Unterstützungstürme`],
  ['l1', 'l', 'root', 1, 0, 'Energiezufuhr', 30, 'c', 10, 1.25, l => `+${l * 10} % Energie aus Gegnern`],
  ['l2a', 'l', 'l1', 2, -1.3, 'Umbautrupp', 5, 'c', 150, 2, l => `${2 + l} Umbaupunkte pro Pause`],
  ['l2b', 'l', 'l1', 2, 0, 'Bauplätze', 6, 'c', 200, 2.2, l => `${4 + l} Bauplätze pro Run`],
  ['l2c', 'l', 'l1', 2, 1.3, 'Bauzeit', 4, 'c', 100, 1.8, l => `${20 + l * 5} Sekunden Umbauphase`],
  ['l3', 'l', 'l2b', 3, 0, 'Startenergie', 20, 'c', 60, 1.3, l => `${100 + l * 40} Energie zu Beginn`],
  ['l4', 'l', 'l3', 4, -0.6, 'Schaltkreisfabrik', 25, 'c', 300, 1.3, l => `+${l * 15} % Schaltkreise`],
  ['l5', 'l', 'l3', 4, 0.6, 'Matrixdecoder', 10, 'm', 3, 1.5, l => `+${l * 20} % Matrixchips`],
];

export const NODES2 = {
  root: {
    id: 'root',
    br: null,
    parent: null,
    depth: 0,
    name: 'Kern',
    max: 1,
    x: 0,
    y: 0,
  },
};

for (const [id, br, parent, depth, lat, name, max, cur, base, g, fx] of NODE_DEFS2) {
  const a = (BR2[br].a * PI) / 180,
    R = 118 * depth,
    L = lat * 68;
  NODES2[id] = {
    id,
    br,
    parent,
    depth,
    name,
    max,
    cur,
    base,
    g,
    fx,
    x: Math.cos(a) * R - Math.sin(a) * L,
    y: Math.sin(a) * R + Math.cos(a) * L,
  };
}
