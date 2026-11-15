import { fmtD, fmtN } from '../core/format.js';

export const PRESTIGE_DEFS = [
  [
    'dmg',
    'Urkraft',
    100,
    1,
    1.5,
    l => `×${fmtD(Math.pow(1.25, l), 2)} Schaden für Helden, Drohnen, Geschütze und Impulse`,
  ],
  ['hp', 'Kernpanzer', 100, 1, 1.5, l => `×${fmtD(Math.pow(1.25, l), 2)} Basisleben`],
  ['gain', 'Goldene Ernte', 100, 2, 1.5, l => `×${fmtD(1 + 0.5 * l, 1)} Splitter, Kerne und Prismen`],
  ['hero', 'Heldenblut', 50, 2, 1.5, l => `×${fmtD(1 + 0.4 * l, 1)} Heldenschaden und Heldenleben`],
  [
    'legacy',
    'Vermächtnis',
    10,
    4,
    1.9,
    l => (l ? `Alle Splitter-Knoten starten nach einer Supernova mit Stufe ${l}` : 'Der Skilltree startet leer'),
  ],
  [
    'start',
    'Startkapital',
    10,
    3,
    1.8,
    l =>
      l ? `Nach einer Supernova: ${fmtN(200 * Math.pow(3, l - 1))} Splitter und ${l * 5} Kerne` : 'Kein Startkapital',
  ],
  ['drone', 'Ewige Flotte', 5, 3, 2, l => `+${l * 2} Drohnen`],
  ['qgain', 'Quantenresonanz', 20, 4, 1.6, l => `+${l * 25} % Quanten pro Supernova`],
  [
    'warp',
    'Zeitsprung',
    10,
    8,
    1.9,
    l =>
      l ? `Runs starten bis zu ${l * 5} Wellen später, höchstens bei der Hälfte deines Rekords` : 'Kein Zeitsprung',
  ],
];

export const PRES = {};

for (const [id, name, max, base, g, fx] of PRESTIGE_DEFS)
  PRES[id] = {
    id,
    name,
    max,
    base,
    g,
    fx,
  };

export const presCost = (p, l) => Math.ceil(p.base * Math.pow(p.g, l));

export const NOVA_MIN = 25;

export function quantaFor(w, save) {
  if (w < NOVA_MIN) return 0;
  const qm = 1 + 0.1 * ((save.nodes && save.nodes.e7b) || 0);
  return Math.floor(2 * Math.pow(1.1, w - NOVA_MIN) * (1 + 0.25 * ((save.pr && save.pr.qgain) || 0)) * qm);
}

// ls = an welcher Grenze seines Sektors der Astname im Skilltree steht: 1 = im Uhrzeigersinn, -1 = dagegen (vom Nutzer so festgelegt)
