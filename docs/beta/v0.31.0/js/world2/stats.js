import { stats } from '../core/stats.js';

export function stats2(save) {
  const w = save.w2,
    L = id => w.nodes[id] || 0;
  const S = stats({
    nodes: {
      root: 1,
    },
    pr: {},
    best: 0,
  }); // neutrale Grundwerte
  const pd = Math.pow(1.1, L('w4')) * (1 + 0.01 * (save.best || 0)); // Bonus aus Welt-1-Rekord
  Object.assign(S, {
    baseHp: 300 * (1 + 0.2 * L('k1')) * Math.pow(1.1, L('k4')),
    shieldPct: L('k2a') ? 0.25 + 0.08 * (L('k2a') - 1) : 0,
    regen: 0.003 * L('k2b'),
    dmgTaken: 1 - 0.05 * L('k5'),
    turrets: 1,
    turretDmg: 9 * (1 + 0.5 * L('k3')) * pd,
    turretRange: 220,
    drones: 0,
    slots: 0,
    autoRate: 0,
    startWave: 1,
    startMax: 1,
    tDmg: (1 + 0.15 * L('w1')) * pd,
    laserDmg: 1 + 0.25 * L('w2a'),
    rocketDmg: 1 + 0.25 * L('w2b'),
    teslaDmg: 1 + 0.25 * L('w2c'),
    tRate: 1 + 0.08 * L('w3'),
    tRange: 1 + 0.05 * L('w5'),
    supR: (1 + 0.04 * L('u1')) * (1 + 0.05 * L('w5')),
    comboMul: 1 + 0.1 * L('u2a'),
    freezeMul: 1 + 0.15 * L('u2b'),
    poisonMul: 1 + 0.2 * L('u3'),
    supPow: 1 + 0.1 * L('u4'),
    energyMul: 1 + 0.1 * L('l1'),
    moves: 2 + L('l2a'),
    slots2: 4 + L('l2b'),
    buildTime: 20 + 5 * L('l2c'),
    startEnergy: 100 + 40 * L('l3'),
    gC: 1 + 0.15 * L('l4'),
    gM: 1 + 0.2 * L('l5'),
    tapDmg: 6 * pd,
  });
  return S;
}
// Bonus, den die Gitterfestung dem Neon-Sektor gibt

export // Bonus, den die Gitterfestung dem Neon-Sektor gibt
const w2BonusForW1 = save => 1 + 0.02 * ((save.w2 && save.w2.best) || 0);
