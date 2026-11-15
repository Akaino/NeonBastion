import { heroLvlCost } from './heroes.js';

// Flotte: Drohnenklassen. dmg/hp/rate sind Faktoren auf die Werte aus dem Skilltree. unlock: null = von Anfang an, [Währung, Kosten] oder die ID eines Skilltree-Knotens.
export const DRONES = {
  jaeger: {
    name: 'Jäger',
    role: 'Allrounder',
    col: '#3df5ff',
    unlock: null,
    dmg: 1,
    hp: 1,
    rate: 1,
    sp: 160,
    r: 5,
    text: 'Schnell und zuverlässig gegen einzelne Ziele.',
  },
  abfang: {
    name: 'Abfänger',
    role: 'Jagd auf schnelle Gegner',
    col: '#fff34f',
    unlock: ['k', 8],
    dmg: 0.8,
    hp: 0.7,
    rate: 1.4,
    sp: 250,
    r: 5,
    text: 'Sehr schnell. Greift zuerst Bomber, Sprinter und Tarner an.',
  },
  schwarm: {
    name: 'Schwarm',
    role: 'Viele kleine Treffer',
    col: '#8cff4f',
    unlock: ['k', 20],
    dmg: 0.4,
    hp: 0.8,
    rate: 1,
    sp: 150,
    r: 6,
    shots: 3,
    text: 'Feuert drei kleine Geschosse pro Salve. Bricht Schilde besonders schnell.',
  },
  repair: {
    name: 'Reparaturdrohne',
    role: 'Unterstützung',
    col: '#6dffb0',
    unlock: ['p', 3],
    dmg: 0,
    hp: 1.2,
    rate: 1,
    sp: 130,
    r: 6,
    text: 'Greift nicht an. Repariert die Basis und heilt Helden und Drohnen in ihrer Nähe.',
  },
  kreuzer: {
    name: 'Kreuzer',
    role: 'Schwerer Flächenschaden',
    col: '#ff8a3d',
    unlock: 'u5',
    dmg: 4,
    hp: 4,
    rate: 1,
    sp: 110,
    r: 9,
    splash: 34,
    text: 'Langsam und zäh. Seine Treffer schaden allen Gegnern im Umkreis.',
  },
};

export const DRONE_IDS = Object.keys(DRONES),
  DRONE_MAX = 60,
  DRONE_PRIO = {
    bomber: 1,
    sprinter: 1,
    cloaker: 1,
  },
  REPAIR_BASE = 0.0015,
  REPAIR_ALLY = 0.03,
  REPAIR_R = 120;

export const droneLvlCost = l => heroLvlCost(l);

export const DRONE_LV = 0.08,
  droneLm = l => 1 + DRONE_LV * (l - 1); // Stufenfaktor auf Schaden und Leben (flacher als bei Helden: mit +12 % je Stufe kam die Flotte allein auf Welle 51 statt 30)

export const repairMul = l => 1 + 0.04 * (l - 1); // Stufenfaktor der Reparaturleistung

export const droneUnlocked = (save, id) => {
  const D = DRONES[id],
    st = save.fleet && save.fleet[id];
  return (
    D.unlock === null ||
    !!(st && st.u) ||
    (typeof D.unlock === 'string' && ((save.nodes && save.nodes[D.unlock]) || 0) > 0)
  );
};
// p = eingestellter Anteil an den gebauten Drohnen in Prozentpunkten (wird über die freigeschalteten Klassen normiert)

// p = eingestellter Anteil an den gebauten Drohnen in Prozentpunkten (wird über die freigeschalteten Klassen normiert)
export const freshFleet = () => ({
  jaeger: {
    u: 1,
    l: 1,
    p: 100,
  },
  abfang: {
    u: 0,
    l: 1,
    p: 0,
  },
  schwarm: {
    u: 0,
    l: 1,
    p: 0,
  },
  repair: {
    u: 0,
    l: 1,
    p: 0,
  },
  kreuzer: {
    u: 0,
    l: 1,
    p: 0,
  },
});
