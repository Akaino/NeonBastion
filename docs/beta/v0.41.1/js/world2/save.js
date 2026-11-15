import { STAGE } from '../core/version.js';

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
/* Welche Welten sich betreten lassen (Vorgabe des Nutzers vom 15.11.2026, ersetzt „alle 100 Wellen eine neue Welt“):
   Welten sind von Anfang an da. Der Neon-Sektor ist immer offen. Die Gitterfestung steht im echten Spiel vorerst auf „Demnächst“
   und ist nur in Beta und Bottest spielbar, bis sie nachgezogen ist. Alles Weitere zeigt die Weltenkarte (ui/worlds.js). */
export const worldOpen = id => id === 1 || (id === 2 && !!STAGE);
