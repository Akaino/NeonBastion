export // Schildladungen: Grundwert + 1 je SHIELD_PER Wellen; Splitterling: Anteil am Leben des Spalters
// Schillernde Gegner: sehr selten (etwa einer je zwei bis drei Runs bis Welle 50), deutlich zäher, sonst ohne Wirkung aufs Spiel. Nie Bosse oder Splitterlinge.
/* Abwürfe: Je Welle lässt mit DROP_P einer ihrer Gegner beim Tod etwas fallen. Nur der Impuls zerstört es: DROP_HITS Treffer hintereinander,
   ein Impuls daneben setzt den Zähler zurück. Ohne Treffer verschwindet es nach DROP_LIFE Sekunden, jeder Treffer setzt die Frist zurück. */
const DROP_P = 0.1,
  DROP_HITS = 5,
  DROP_LIFE = 3,
  DROP_DUR = 5,
  DROP_R = 13,
  BOMB_R = 170,
  BOMB_PCT = 0.4,
  BOMB_BOSS = 0.08,
  DROP_REPAIR = 0.06,
  DROP_HASTE = 0.5;

export const DROPS = {
    bomb: {
      name: 'Bombe',
      text: 'Sprengt alles im Umkreis',
      col: '#ff8a3d',
    },
    dmg: {
      name: 'Doppelter Schaden',
      text: '5 Sekunden lang',
      col: '#ff4f6d',
    },
    haste: {
      name: 'Schneller Impuls',
      text: '5 Sekunden doppeltes Tempo',
      col: '#3df5ff',
    },
    repair: {
      name: 'Reparatur',
      text: 'Die Basis wird 5 Sekunden lang repariert',
      col: '#5dffb0',
    },
    gain: {
      name: 'Splitterregen',
      text: '5 Sekunden doppelte Splitter',
      col: '#ffe14f',
    },
  },
  DROP_IDS = Object.keys(DROPS);
