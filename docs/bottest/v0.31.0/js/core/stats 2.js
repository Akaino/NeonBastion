import { Dev } from './dev-hooks.js';
import { clamp } from './util.js';
import { BASE_GUN, DRONE_DMG, F5_MAX, HERO_SELF, IMP_BASE, IMP_MUL, PULSE_PCT, impInterval } from '../data/balance.js';
import { w2BonusForW1 } from '../world2/stats.js';

export function stats(save) {
  const L = id => save.nodes[id] || 0;
  const S = {
    baseHp: 200 * (1 + 0.2 * L('b1')) * (L('b5') ? 2 : 1),
    shieldPct: L('b2a') ? 0.25 + 0.08 * (L('b2a') - 1) : 0,
    regen: 0.003 * L('b2b'),
    turrets: L('b3a'),
    turretDmg: 6 * (1 + 0.4 * L('b4a')) * (1 + (BASE_GUN / 100) * L('b1')),
    turretRange: 200 * (L('b5') ? 1.5 : 1),
    pulse: L('b3b'),
    pulsePct: PULSE_PCT * L('b3b'),
    pulseDmg: 15 * (1 + 0.6 * Math.max(0, L('b3b') - 1)),
    pulseCd: 8 * (1 - 0.12 * L('b4b')),
    drones: 2 + L('u1') + 2 * L('u3b'),
    droneDmg: DRONE_DMG * (1 + 0.25 * L('u2a')),
    droneHp: 20 * (1 + 0.4 * L('u3a')),
    droneSpawn: 3 / (1 + 0.2 * L('u2b')),
    droneRange: 90 * (1 + 0.5 * L('u4')),
    droneBeam: L('u4') > 0,
    mother: L('u5') > 0,
    heroDmg: 1 + 0.15 * L('h1'),
    heroHp: 1 + 0.25 * L('h2b'),
    slots: 1 + L('h2a') + L('h3a') + L('h5') + L('h8b'),
    revive: 8 * (1 - 0.15 * L('h3b')),
    abilityCd: 1 - 0.1 * L('h4'),
    tapDmg: 6 * (1 + 0.4 * L('f1')),
    tapCrit: 0.05 + 0.05 * L('f2a'),
    tapR: 26 + 12 * L('f2b'),
    beat: L('f3a'),
    overload: L('f3b'),
    chain: L('f4'),
    gS: 1 + 0.12 * L('e1'),
    gK: 1 + 0.2 * L('e2a'),
    startWave: 1 + 2 * L('e2b'),
    gP: 1 + 0.25 * L('e3a'),
    elite: 1 + 0.25 * L('e3b'),
    gD: L('e4'),
    gAll: L('e5') ? 2 : 1,
  };
  // neue Knoten
  S.rangedRes = 1 - 0.04 * L('b6b');
  S.turretRange *= 1 + 0.1 * L('b8b');
  S.droneRegen = 0.02 * L('u5b');
  S.droneSp = 1 + 0.1 * L('u8b');
  S.heroRegen = 0.01 * L('h5b');
  S.impBig = 0.08 * L('f5b');
  S.shadeMul = Math.min(1, 0.5 + 0.1 * L('f7b'));
  S.energyGain = 1 + 0.1 * L('e4c');
  S.baseHp *= Math.pow(1.06, L('b6')) * Math.pow(1.15, L('b8'));
  S.turretRate = 1 + 0.1 * L('b4c');
  S.turretDmg *= Math.pow(1.08, L('b7b'));
  S.pulseR = 150 * (1 + 0.15 * L('b5b'));
  S.shRegen = 1 + 0.25 * L('b7a');
  S.shieldPct = S.shieldPct ? S.shieldPct + 0.05 * L('b7a') : 0;
  S.dmgTaken = 1 - 0.05 * L('b9');
  S.droneRate = (1 + 0.08 * L('u3c')) * (1 + 0.5 * L('u9'));
  S.swarmInt = 0.02 * L('u4b');
  S.droneDmg *= Math.pow(1.06, L('u6')) * Math.pow(1.08, L('u7b')) * Math.pow(1.25, L('u8'));
  S.droneHp *= Math.pow(1.08, L('u7b')) * Math.pow(1.06, L('u6')) * Math.pow(1.25, L('u8'));
  S.drones += 2 * L('u7a');
  S.heroRate = 1 + 0.06 * L('h3c');
  S.heroCrit = 0.04 * L('h4b');
  S.heroDmg *= Math.pow(1.06, L('h6')) * Math.pow(1.08, L('h7b')) * Math.pow(1.25, L('h8'));
  S.heroHp *= Math.pow(1.1, L('h7a'));
  S.abilPow = 1 + 0.5 * L('h9');
  S.autoRate = 0.5 * L('f2c') * Math.pow(1.25, L('f7'));
  S.autoAim = L('f3c') > 0;
  S.autoDmg = 1 + 0.2 * L('f3c');
  S.tapDmg *= Math.pow(1.06, L('f4b')) * Math.pow(1.08, L('f6'));
  S.megaTap = L('f8') ? 60 - L('f8') * 10 : 0;
  S.gS *= Math.pow(1.05, L('e3c')) * Math.pow(1.06, L('e6'));
  S.gK *= Math.pow(1.08, L('e7')) * Math.pow(1.06, L('e6'));
  S.prismChance = 0.006 + 0.006 * L('e4b');
  S.qMul = 1 + 0.1 * L('e7b');
  const P = id => (save.pr && save.pr[id]) || 0,
    pd = Math.pow(1.25, P('dmg')) * (typeof w2BonusForW1 !== 'undefined' ? w2BonusForW1(save) : 1),
    ph = 1 + 0.4 * P('hero'),
    pg = 1 + 0.5 * P('gain');
  S.baseHp *= Math.pow(1.25, P('hp'));
  S.turretDmg *= pd;
  S.pulseDmg *= pd;
  S.droneDmg *= pd;
  S.tapDmg *= pd;
  S.heroDmg *= pd * ph;
  S.heroHp *= ph;
  S.drones += 2 * P('drone');
  S.gS *= pg;
  S.gK *= pg;
  S.gP *= pg;
  S.startMax = Math.max(S.startWave, 1 + Math.min(5 * P('warp'), Math.floor((save.best || 0) / 2)));
  // Vorgabe des Nutzers: Schnellstart darf nie höher starten lassen als die höchste bisher erreichte Welle.
  S.startMax = Math.min(S.startMax, Math.max(1, save.best || 0));
  S.startWave = save.startPick ? clamp(save.startPick, 1, S.startMax) : S.startMax;
  if (Dev.stats) Dev.stats(save, S); // Testhilfen (nur Beta und Bottest, siehe dev.js)
  // Verbund mit den Helden: Der Heldenschaden-Bonus wächst spät sehr stark (Knoten und Supernova). Impuls, Basis und Flotte bekommen je einen Knoten, der ihn in fünf Stufen übernimmt –
  // sonst trägt ab Welle 70 allein der Impuls (gemessen: 65–86 % des Schadens).
  // Jede Stufe ist derselbe Faktor (geometrisch), damit keine Stufe einen Sprung macht: Stufe l gibt (1+Bonus)^(l/5), Stufe 5 den vollen Bonus.
  const bond = id => Math.pow(1 + S.heroDmg, Math.min(1, L(id) / F5_MAX));
  if (L('f5')) S.tapDmg *= bond('f5');
  if (L('b5c')) {
    const m = bond('b5c');
    S.turretDmg *= m;
    S.pulseDmg *= m;
  }
  if (L('u5c')) S.droneDmg *= bond('u5c');
  S.heroSelf = Math.pow(1 + S.heroDmg, (HERO_SELF * L('h5c')) / F5_MAX); // Kampfrausch: nur die eigenen Treffer der Helden, nicht der Bonus, den die anderen übernehmen
  S.impInt = impInterval(L('f1b'));
  S.impMul = IMP_MUL * Math.sqrt(S.impInt / IMP_BASE);
  return S;
}
