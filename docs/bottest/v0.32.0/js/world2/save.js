import { Dev } from '../core/dev-hooks.js';

export function freshW2() {
  return {
    cur: {
      c: 0,
      m: 0,
    },
    nodes: {
      root: 1,
    },
    towers: {
      laser: {
        u: 1,
        l: 1,
      },
      frost: {
        u: 1,
        l: 1,
      },
      rocket: {
        u: 0,
        l: 1,
      },
      tesla: {
        u: 0,
        l: 1,
      },
      weak: {
        u: 0,
        l: 1,
      },
      cryo: {
        u: 0,
        l: 1,
      },
    },
    best: 0,
    cycleBest: 0,
    runs: 0,
  };
}
// Neue Welten öffnen sich alle 100 Wellen im Neon-Sektor: Welt 2 bei 100, Welt 3 bei 200, … Welt 10 bei 900. Welt 3–10 haben noch keinen Inhalt.

// Neue Welten öffnen sich alle 100 Wellen im Neon-Sektor: Welt 2 bei 100, Welt 3 bei 200, … Welt 10 bei 900. Welt 3–10 haben noch keinen Inhalt.
export const WORLD_MAX = 10,
  worldUnlockWave = id => (id - 1) * 100;

export const w2Unlocked = save => (save.best || 0) >= worldUnlockWave(2) || !!(Dev.w2 && Dev.w2(save));
