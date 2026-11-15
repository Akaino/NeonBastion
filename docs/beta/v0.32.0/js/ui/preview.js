import { fmtD, fmtN } from '../core/format.js';
import { HEROES } from '../data/heroes.js';

/* ---------- before/after previews ---------- */
export const fv = v =>
  typeof v === 'string' ? v : v >= 100 ? fmtN(v) : fmtD(v, Math.abs(v - Math.round(v)) < 0.005 ? 0 : 1);

export const FMT = {
  n: fv,
  i: v => String(Math.round(v)),
  s: v => (v ? fmtD(v, 1) + ' s' : '–'),
  x: v => '×' + fmtD(v, 2),
  pct: v => fmtD(v, 0) + ' %',
  t: v => v,
};

export const PREV = {
  b1: [
    ['Basisleben', S => S.baseHp, 'n'],
    ['Schaden pro Geschütz- und Autofeuer-Schuss', S => S.turretDmg, 'n'],
  ],
  b2a: [['Schild', S => S.baseHp * S.shieldPct, 'n']],
  b2b: [['Reparatur pro Sekunde', S => S.baseHp * S.regen, 'n']],
  b3a: [
    ['Geschütztürme', S => S.turrets, 'i'],
    ['Schaden pro Schuss', S => (S.turrets ? S.turretDmg : 0), 'n'],
  ],
  b3b: [
    ['Schockwellen-Schaden', S => (S.pulse ? S.pulseDmg : 0), 'n'],
    ['Anteil am Gegnerleben', S => fmtD(S.pulsePct * 100, 1) + ' %', 't'],
    ['Abklingzeit', S => (S.pulse ? S.pulseCd : 0), 's'],
  ],
  b4a: [['Schaden pro Geschütz- und Autofeuer-Schuss', S => S.turretDmg, 'n']],
  b4b: [['Abklingzeit der Schockwelle', S => S.pulseCd, 's']],
  b5: [
    ['Basisleben', S => S.baseHp, 'n'],
    ['Geschützreichweite', S => S.turretRange, 'i'],
  ],
  u1: [['Drohnen', S => S.drones, 'i']],
  u2a: [['Drohnenschaden', S => S.droneDmg, 'n']],
  u2b: [['Bauzeit pro Drohne', S => S.droneSpawn, 's']],
  u3a: [['Drohnenleben', S => S.droneHp, 'n']],
  u3b: [['Drohnen', S => S.drones, 'i']],
  u4: [
    ['Drohnenreichweite', S => S.droneRange, 'i'],
    ['Waffe', S => (S.droneBeam ? 'Strahl' : 'Kanone'), 't'],
  ],
  u5: [['Schwere Kampfschiffe', S => (S.mother ? 'Ja' : 'Nein'), 't']],
  h1: [['Heldenschaden', S => S.heroDmg, 'x']],
  h2a: [['Heldenplätze', S => S.slots, 'i']],
  h2b: [['Heldenleben', S => S.heroHp, 'x']],
  h3a: [['Heldenplätze', S => S.slots, 'i']],
  h3b: [['Wiederbelebung', S => S.revive, 's']],
  h4: [['Abklingzeit der Fähigkeiten', S => S.abilityCd, 'x']],
  h5: [['Heldenplätze', S => S.slots, 'i']],
  f1: [['Schaden pro Impuls', S => S.tapDmg * S.impMul, 'n']],
  f2a: [['Kritische Impulse', S => S.tapCrit * 100, 'pct']],
  f2b: [['Impulsradius', S => S.tapR, 'i']],
  f1b: [
    ['Impuls alle', S => fmtD(S.impInt, 2) + ' s', 't'],
    ['Schaden pro Impuls', S => S.tapDmg * S.impMul, 'n'],
    ['Impulsschaden pro Sekunde', S => (S.tapDmg * S.impMul) / S.impInt, 'n'],
  ],
  f3a: [['Schaden jedes 5. Impulses', S => (S.beat ? S.tapDmg * S.impMul * (1 + S.beat) : 0), 'n']],
  f3b: [['Schaden der Überladung', S => (S.overload ? S.tapDmg * S.impMul * (4 + 2 * S.overload) : 0), 'n']],
  f4: [['Zusätzliche Kettenziele', S => S.chain, 'i']],
  f5: [['Schaden pro Impuls', S => S.tapDmg * S.impMul, 'n']],
  e1: [['Splitter', S => S.gS * S.gAll, 'x']],
  e2a: [['Kerne', S => S.gK * S.gAll, 'x']],
  e2b: [['Startwelle', S => S.startWave, 'i']],
  e3a: [['Prismen', S => S.gP * S.gAll, 'x']],
  e3b: [['Elite-Gegner', S => S.elite, 'x']],
  b4c: [['Feuerrate der Geschütze', S => S.turretRate, 'x']],
  b5b: [['Radius der Schockwelle', S => S.pulseR, 'i']],
  b6: [['Basisleben', S => S.baseHp, 'n']],
  b7a: [
    ['Schildaufladung', S => S.shRegen, 'x'],
    ['Schild', S => S.baseHp * S.shieldPct, 'n'],
  ],
  b7b: [['Schaden pro Geschütz- und Autofeuer-Schuss', S => S.turretDmg, 'n']],
  b8: [['Basisleben', S => S.baseHp, 'n']],
  b9: [['Erlittener Schaden', S => S.dmgTaken * 100, 'pct']],
  u3c: [['Feuerrate der Drohnen', S => S.droneRate, 'x']],
  u4b: [['Bonus pro aktiver Drohne', S => S.swarmInt * 100, 'pct']],
  u6: [
    ['Drohnenschaden', S => S.droneDmg, 'n'],
    ['Drohnenleben', S => S.droneHp, 'n'],
  ],
  u7a: [['Drohnen', S => S.drones, 'i']],
  u7b: [
    ['Drohnenschaden', S => S.droneDmg, 'n'],
    ['Drohnenleben', S => S.droneHp, 'n'],
  ],
  u8: [
    ['Drohnenschaden', S => S.droneDmg, 'n'],
    ['Drohnenleben', S => S.droneHp, 'n'],
  ],
  u9: [['Feuerrate der Drohnen', S => S.droneRate, 'x']],
  h3c: [['Angriffstempo', S => S.heroRate, 'x']],
  h4b: [['Krit-Chance der Helden', S => S.heroCrit * 100, 'pct']],
  h6: [['Heldenschaden', S => S.heroDmg, 'x']],
  h7a: [['Heldenleben', S => S.heroHp, 'x']],
  h7b: [['Heldenschaden', S => S.heroDmg, 'x']],
  h8: [['Heldenschaden', S => S.heroDmg, 'x']],
  h9: [['Stärke der Fähigkeiten', S => S.abilPow, 'x']],
  f2c: [
    ['Autofeuer pro Sekunde', S => S.autoRate, 'n'],
    ['Schaden pro Schuss', S => (S.autoRate ? S.turretDmg * S.autoDmg : 0), 'n'],
  ],
  f3c: [
    ['Schaden pro Schuss', S => S.turretDmg * S.autoDmg, 'n'],
    ['Zielt auf Gruppen', S => (S.autoAim ? 'Ja' : 'Nein'), 't'],
  ],
  f4b: [['Schaden pro Impuls', S => S.tapDmg * S.impMul, 'n']],
  f6: [['Schaden pro Impuls', S => S.tapDmg * S.impMul, 'n']],
  f7: [['Autofeuer pro Sekunde', S => S.autoRate, 'n']],
  h5c: [['Klinge-Schaden', S => S.heroDmg * S.heroSelf * HEROES.klinge.dmg, 'n']],
  h7c: [['Klinge-Schaden', S => S.heroDmg * S.heroSelf * HEROES.klinge.dmg, 'n']],
  b5c: [
    ['Schaden pro Geschütz- und Autofeuer-Schuss', S => S.turretDmg, 'n'],
    ['Schaden der Schockwelle', S => S.pulseDmg, 'n'],
  ],
  u5c: [['Drohnenschaden', S => S.droneDmg, 'n']],
  b6b: [['Schaden durch Geschosse', S => S.rangedRes * 100, 'pct']],
  b8b: [['Geschützreichweite', S => S.turretRange, 'i']],
  u5b: [['Reparatur der Drohnen pro Sekunde', S => S.droneRegen * 100, 'pct']],
  u8b: [['Tempo der Drohnen', S => S.droneSp, 'x']],
  h5b: [['Heilung der Helden pro Sekunde', S => S.heroRegen * 100, 'pct']],
  h8b: [['Heldenplätze', S => S.slots, 'i']],
  f5b: [['Impulsschaden gegen Elite und Bosse', S => 1 + S.impBig, 'x']],
  f7b: [['Impulsradius im Schatten', S => S.tapR * S.shadeMul, 'i']],
  e4c: [['Energie aus Gegnern', S => S.energyGain, 'x']],
  f8: [['Weltenbrecher alle … Impulse', S => S.megaTap || '–', 't']],
  e3c: [['Splitter', S => S.gS * S.gAll, 'x']],
  e4b: [['Prisma-Chance pro Elite', S => fmtD(S.prismChance * 100, 1) + ' %', 't']],
  e6: [
    ['Splitter', S => S.gS * S.gAll, 'x'],
    ['Kerne', S => S.gK * S.gAll, 'x'],
  ],
  e7: [['Kerne', S => S.gK * S.gAll, 'x']],
  e7b: [['Quanten', S => S.qMul, 'x']],
  e4: [['Sternenstaub pro Meilenstein', S => (1 + S.gD) * S.gAll, 'i']],
  e5: [['Alle Belohnungen', S => S.gAll, 'x']],
};

export const PREV2 = {
  k1: [['Kernleben', S => S.baseHp, 'n']],
  k2a: [['Schild', S => S.baseHp * S.shieldPct, 'n']],
  k2b: [['Reparatur pro Sekunde', S => S.baseHp * S.regen, 'n']],
  k3: [['Kerngeschütz-Schaden', S => S.turretDmg, 'n']],
  k4: [['Kernleben', S => S.baseHp, 'n']],
  k5: [['Erlittener Schaden', S => S.dmgTaken * 100, 'pct']],
  w1: [['Turmschaden', S => S.tDmg, 'x']],
  w2a: [['Laserschaden', S => S.tDmg * S.laserDmg, 'x']],
  w2b: [['Raketenschaden', S => S.tDmg * S.rocketDmg, 'x']],
  w2c: [['Tesla-Schaden', S => S.tDmg * S.teslaDmg, 'x']],
  w3: [['Feuerrate', S => S.tRate, 'x']],
  w4: [['Turmschaden', S => S.tDmg, 'x']],
  w5: [['Reichweite', S => S.tRange, 'x']],
  u1: [['Radius Unterstützung', S => S.supR, 'x']],
  u2a: [['Kombinationsstärke', S => S.comboMul, 'x']],
  u2b: [['Einfrierdauer', S => S.freezeMul, 'x']],
  u3: [['Gift und Säure', S => S.poisonMul, 'x']],
  u4: [['Wirkung Unterstützung', S => S.supPow, 'x']],
  l1: [['Energie aus Gegnern', S => S.energyMul, 'x']],
  l2a: [['Umbaupunkte', S => S.moves, 'i']],
  l2b: [['Bauplätze', S => S.slots2, 'i']],
  l2c: [['Umbauphase', S => S.buildTime, 's']],
  l3: [['Startenergie', S => S.startEnergy, 'i']],
  l4: [['Schaltkreise', S => S.gC, 'x']],
  l5: [['Matrixchips', S => S.gM, 'x']],
};

export function cmpRows(rows, col) {
  return (
    `<div class="cmp" style="--c:${col}">` +
    rows
      .map(([lab, a, b]) => {
        const same = b === undefined || a === b;
        return `<div><span>${lab}</span><b>${a}${same ? '' : `<i aria-hidden="true">→</i><em>${b}</em>`}</b></div>`;
      })
      .join('') +
    '</div>'
  );
}

/* ---------- skill tree ---------- */
