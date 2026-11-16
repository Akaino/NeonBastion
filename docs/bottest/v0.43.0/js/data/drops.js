/* Abwürfe: Je Welle lässt mit DROP_P einer ihrer Gegner beim Tod etwas fallen. Nur der Impuls zerstört es: DROP_HITS Treffer hintereinander,
   ein Impuls daneben setzt den Zähler zurück. Ohne Treffer verschwindet es nach DROP_LIFE Sekunden, jeder Treffer setzt die Frist zurück. */
export const DROP_P = 0.1,
  DROP_HITS = 5,
  DROP_LIFE = 3,
  DROP_DUR = 10,
  DROP_R = 13,
  BOMB_R = 170,
  BOMB_PCT = 0.4,
  BOMB_BOSS = 0.08,
  DROP_REPAIR = 0.03,
  DROP_HASTE = 0.5;

export const DROPS = {
    bomb: {
      name: 'Bombe',
      text: 'Sprengt alles im Umkreis',
      col: '#ff8a3d',
    },
    dmg: {
      name: 'Doppelter Schaden',
      text: '10 Sekunden lang',
      col: '#ff4f6d',
    },
    haste: {
      name: 'Schneller Impuls',
      text: '10 Sekunden doppeltes Tempo',
      col: '#3df5ff',
    },
    repair: {
      name: 'Reparatur',
      text: 'Die Basis wird 10 Sekunden lang repariert',
      col: '#5dffb0',
    },
    gain: {
      name: 'Splitterregen',
      text: '10 Sekunden doppelte Splitter',
      col: '#ffe14f',
    },
  },
  DROP_IDS = Object.keys(DROPS);
