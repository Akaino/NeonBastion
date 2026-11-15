import { NOTE } from './music-data.js';
import { click, crackle, explode, fm, noise, osc, synth, thump } from './synth.js';

export const SFX = {
  ui: (B, o, t) => {
    osc(B, o, t, {
      type: 'square',
      f0: 2600,
      f1: 1900,
      dur: 0.03,
      vol: 0.06,
      ft: [9000, 3000],
    });
    click(B, o, t, 0.12, 9000);
  },
  /* ---- Schüsse: gesättigte, stark abtauchende Laser ---- */
  // Spieler-Tipp: fetter Unison-Laser mit Sättigung, Knack und Sub → Signature-Sound
  tap: (B, o, t) => {
    const p = (Math.random() - 0.5) * 0.4;
    synth(B, B.dist, t, {
      f0: 2400,
      f1: 70,
      dur: 0.11,
      vol: 0.09,
      types: ['sawtooth', 'square', 'sawtooth'],
      det: [-25, 0, 25],
      cut0: 12000,
      cut1: 900,
      q: 1.2,
      pan: p,
    });
    noise(B, B.crush, t, {
      dur: 0.035,
      vol: 0.4,
      f0: 7000,
      f1: 2500,
      q: 0.6,
    });
    thump(B, o, t, 0.3, 200, 55, 0.06);
    click(B, o, t, 0.3, 6000);
  },
  // Schützin: kurzer, bissiger Rechteck-Blaster
  shoot: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 1600 + Math.random() * 150,
      f1: 220,
      dur: 0.075,
      vol: 0.05,
      types: ['square', 'square'],
      det: [-12, 12],
      cut0: 9000,
      cut1: 1200,
      q: 1,
      pan: (Math.random() - 0.5) * 0.6,
    });
    noise(B, o, t, {
      dur: 0.025,
      vol: 0.14,
      f0: 6000,
      type: 'highpass',
    });
  },
  // Wächterin: Phaser mit Chorus
  shoot2: (B, o, t) => {
    synth(B, B.drive, t, {
      f0: 700,
      f1: 260,
      dur: 0.11,
      vol: 0.07,
      types: ['sawtooth', 'sawtooth'],
      det: [-35, 35],
      cut0: 5000,
      cut1: 700,
      q: 1.5,
    });
  },
  // Drohnen: kleines, knackiges Pew
  drone: (B, o, t) => {
    synth(B, B.crush, t, {
      f0: 2200 + Math.random() * 300,
      f1: 500,
      dur: 0.04,
      vol: 0.1,
      types: ['square'],
      cut0: 9000,
      cut1: 2000,
      q: 0.8,
      pan: (Math.random() - 0.5) * 0.8,
    });
  },
  beam: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 3000,
      f1: 900,
      dur: 0.06,
      vol: 0.025,
      types: ['sawtooth', 'sawtooth'],
      det: [-30, 30],
      cut0: 10000,
      cut1: 2500,
      q: 1,
      pan: (Math.random() - 0.5) * 0.8,
    });
    noise(B, o, t, {
      dur: 0.05,
      vol: 0.07,
      f0: 8000,
      type: 'highpass',
    });
  },
  // Geschütz: Synth-Kanone mit Wumms
  turret: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 420,
      f1: 45,
      dur: 0.16,
      vol: 0.1,
      types: ['sawtooth', 'square'],
      det: [-20, 20],
      cut0: 6000,
      cut1: 300,
      q: 1.2,
    });
    noise(B, B.crush, t, {
      dur: 0.06,
      vol: 0.35,
      f0: 4000,
      f1: 900,
      q: 0.6,
    });
    thump(B, o, t, 0.45, 150, 40, 0.12);
    click(B, o, t, 0.3, 4000);
  },
  tapmiss: (B, o, t) => {
    synth(B, o, t, {
      f0: 1200,
      f1: 300,
      dur: 0.05,
      vol: 0.04,
      types: ['square'],
      cut0: 5000,
      cut1: 800,
      q: 1,
    });
  },
  crit: (B, o, t) => {
    SFX.tap(B, o, t);
    noise(B, B.dist, t, {
      dur: 0.09,
      vol: 0.5,
      f0: 3500,
      f1: 900,
      q: 0.5,
    });
    osc(B, B.dist, t, {
      type: 'square',
      f0: 900,
      f1: 3200,
      dur: 0.07,
      vol: 0.07,
      ft: [12000, 6000],
    });
    thump(B, B.drive, t, 0.5, 220, 40, 0.15);
  },
  hit: (B, o, t) => {
    osc(B, B.crush, t, {
      type: 'square',
      f0: 420,
      f1: 180,
      dur: 0.05,
      vol: 0.14,
    });
    click(B, o, t, 0.25);
  },
  slash: (B, o, t) => {
    const p = (Math.random() - 0.5) * 0.5;
    noise(B, o, t, {
      dur: 0.07,
      vol: 0.55,
      f0: 11000,
      f1: 2600,
      q: 1.6,
      att: 0.002,
    });
    synth(B, B.dist, t, {
      f0: 2600,
      f1: 500,
      dur: 0.065,
      vol: 0.06,
      types: ['sawtooth', 'sawtooth'],
      det: [-20, 20],
      cut0: 11000,
      cut1: 2000,
      q: 1,
      pan: p,
    });
    click(B, o, t, 0.35, 8000);
  },
  heavy: (B, o, t) => {
    noise(B, o, t, {
      dur: 0.1,
      vol: 0.6,
      f0: 9000,
      f1: 1800,
      q: 1.2,
      att: 0.002,
    });
    synth(B, B.dist, t, {
      f0: 1900,
      f1: 150,
      dur: 0.1,
      vol: 0.08,
      types: ['sawtooth', 'square'],
      det: [-20, 20],
      cut0: 9000,
      cut1: 900,
      q: 1,
    });
    explode(B, t + 0.01, 0.45, 0.18);
    click(B, o, t, 0.5, 6000);
  },
  whirl: (B, o, t) => {
    synth(B, B.dist, t, {
      f0: 200,
      f1: 2400,
      dur: 0.3,
      vol: 0.06,
      types: ['sawtooth', 'sawtooth'],
      det: [-30, 30],
      cut0: 2000,
      cut1: 12000,
      q: 1.5,
      att: 0.04,
    });
    for (let i = 0; i < 4; i++) {
      noise(B, o, t + 0.08 + i * 0.06, {
        dur: 0.06,
        vol: 0.4,
        f0: 10000,
        f1: 2400,
        q: 1.5,
      });
      click(B, o, t + 0.08 + i * 0.06, 0.25, 8000);
    }
    explode(B, t + 0.1, 0.7, 0.3);
  },
  zap: (B, o, t) => {
    fm(B, B.crush, t, {
      f0: 1300,
      f1: 400,
      ratio: 7.1,
      idx0: 18,
      idx1: 3,
      dur: 0.11,
      vol: 0.12,
      type: 'square',
    });
    noise(B, B.dist, t, {
      dur: 0.07,
      vol: 0.25,
      f0: 7000,
      f1: 3000,
      q: 0.7,
    });
    click(B, o, t, 0.25, 9000);
  },
  /* ---- Explosionen: heller Knall + verzerrter Körper + Knistern + Sub ---- */
  kill: (B, o, t) => {
    explode(B, t, 0.32, 0.13, (Math.random() - 0.5) * 0.7);
  },
  killbig: (B, o, t) => {
    explode(B, t, 0.6, 0.3);
    crackle(B, t + 0.04, 0.35, 10, 0.18);
  },
  base: (B, o, t) => {
    explode(B, t, 0.8, 0.28);
    fm(B, o, t, {
      f0: 330,
      f1: 220,
      ratio: 1.07,
      idx0: 4,
      dur: 0.25,
      vol: 0.07,
      type: 'square',
    });
  },
  shield: (B, o, t) => {
    fm(B, o, t, {
      f0: 1900,
      f1: 1100,
      ratio: 1.5,
      idx0: 6,
      idx1: 1,
      dur: 0.13,
      vol: 0.14,
    });
    noise(B, B.dist, t, {
      dur: 0.05,
      vol: 0.2,
      f0: 8000,
      f1: 4000,
      q: 0.7,
    });
    click(B, o, t, 0.3, 9000);
  },
  pulse: (B, o, t) => {
    explode(B, t, 0.85, 0.45);
    noise(B, o, t, {
      dur: 0.4,
      vol: 0.3,
      f0: 600,
      f1: 9000,
      q: 1.5,
      att: 0.01,
    });
    osc(B, B.drive, t, {
      type: 'sawtooth',
      f0: 55,
      f1: 40,
      dur: 0.4,
      vol: 0.15,
      ft: [3000, 90],
      fq: 2,
    });
  },
  abil: (B, o, t) => {
    [0, 7, 12, 19].forEach((s, i) =>
      synth(B, B.drive, t + i * 0.035, {
        f0: NOTE(69 + s),
        f1: NOTE(69 + s),
        dur: 0.08,
        vol: 0.05,
        types: ['square', 'sawtooth'],
        det: [-10, 10],
        cut0: 9000,
        cut1: 2000,
        q: 1,
      }),
    );
    synth(B, B.dist, t, {
      f0: 300,
      f1: 3000,
      dur: 0.2,
      vol: 0.04,
      types: ['sawtooth'],
      cut0: 3000,
      cut1: 12000,
      q: 1,
      att: 0.02,
    });
  },
  down: (B, o, t) => {
    synth(B, B.crush, t, {
      f0: 1200,
      f1: 50,
      dur: 0.4,
      vol: 0.1,
      types: ['sawtooth', 'square'],
      det: [-15, 15],
      cut0: 8000,
      cut1: 300,
      q: 1,
    });
    click(B, o, t, 0.3);
  },
  wave: (B, o, t) => {
    for (const n of [69, 76, 81])
      synth(B, B.drive, t, {
        f0: NOTE(n),
        f1: NOTE(n),
        dur: 0.2,
        vol: 0.035,
        types: ['sawtooth', 'square'],
        det: [-12, 12],
        cut0: 9000,
        cut1: 1200,
        q: 1,
      });
    for (const n of [72, 79, 84])
      synth(B, B.echo, t + 0.2, {
        f0: NOTE(n),
        f1: NOTE(n),
        dur: 0.28,
        vol: 0.03,
        types: ['sawtooth', 'square'],
        det: [-12, 12],
        cut0: 9000,
        cut1: 1200,
        q: 1,
      });
    click(B, o, t, 0.3, 6000);
  },
  bosswave: (B, o, t) => {
    for (let i = 0; i < 4; i++) {
      const f = i % 2 ? 330 : 440;
      synth(B, B.dist, t + i * 0.22, {
        f0: f,
        f1: f,
        dur: 0.2,
        vol: 0.06,
        types: ['square', 'sawtooth'],
        det: [-15, 15],
        cut0: 5000,
        cut1: 2500,
        q: 1,
      });
    }
    osc(B, B.drive, t, {
      type: 'sawtooth',
      f0: NOTE(33),
      dur: 1.4,
      vol: 0.18,
      att: 0.15,
      ft: [200, 1500],
      fq: 3,
    });
    thump(B, B.drive, t, 0.9, 90, 30, 0.6);
  },
  boss: (B, o, t) => {
    explode(B, t, 1, 0.9);
    crackle(B, t + 0.05, 1.1, 30, 0.25);
    explode(B, t + 0.28, 0.6, 0.5, 0.4);
    explode(B, t + 0.5, 0.55, 0.45, -0.4);
    [0, 3, 7, 12, 15, 19].forEach((s, i) =>
      synth(B, B.echo, t + 0.15 + i * 0.05, {
        f0: NOTE(69 + s),
        f1: NOTE(69 + s),
        dur: 0.16,
        vol: 0.04,
        types: ['square', 'sawtooth'],
        det: [-10, 10],
        cut0: 9000,
        cut1: 1500,
        q: 1,
      }),
    );
  },
  lose: (B, o, t) => {
    explode(B, t, 1, 1);
    crackle(B, t + 0.1, 1.2, 26, 0.2);
    [64, 60, 57, 52].forEach((n, i) =>
      synth(B, B.drive, t + 0.3 + i * 0.16, {
        f0: NOTE(n),
        f1: NOTE(n) * 0.5,
        dur: 0.55,
        vol: 0.05,
        types: ['sawtooth', 'sawtooth'],
        det: [-15, 15],
        cut0: 5000,
        cut1: 250,
        q: 1,
      }),
    );
  },
  buy: (B, o, t) => {
    synth(B, o, t, {
      f0: NOTE(88),
      f1: NOTE(88),
      dur: 0.05,
      vol: 0.06,
      types: ['square', 'sawtooth'],
      det: [-8, 8],
      cut0: 10000,
      cut1: 4000,
      q: 1,
    });
    synth(B, B.echo, t + 0.05, {
      f0: NOTE(95),
      f1: NOTE(95),
      dur: 0.14,
      vol: 0.06,
      types: ['square', 'sawtooth'],
      det: [-8, 8],
      cut0: 10000,
      cut1: 2500,
      q: 1,
    });
    click(B, o, t, 0.2, 9000);
  },
  no: (B, o, t) => {
    osc(B, B.crush, t, {
      type: 'square',
      f0: 110,
      dur: 0.06,
      vol: 0.12,
    });
    osc(B, B.crush, t + 0.08, {
      type: 'square',
      f0: 92,
      dur: 0.09,
      vol: 0.12,
    });
  },
  nova: (B, o, t) => {
    noise(B, o, t, {
      dur: 1.6,
      vol: 0.45,
      f0: 200,
      f1: 12000,
      q: 0.7,
      att: 1.2,
    });
    synth(B, B.dist, t, {
      f0: 80,
      f1: 1600,
      dur: 1.5,
      vol: 0.04,
      types: ['sawtooth', 'sawtooth'],
      det: [-30, 30],
      cut0: 600,
      cut1: 12000,
      q: 1,
      att: 1,
    });
    explode(B, t + 1.5, 1, 1.1);
    crackle(B, t + 1.55, 1.2, 30, 0.22);
    [45, 52, 57, 64, 69, 76].forEach((n, i) =>
      synth(B, B.echo, t + 1.5 + i * 0.04, {
        f0: NOTE(n),
        f1: NOTE(n),
        dur: 0.5,
        vol: 0.035,
        types: ['square', 'sawtooth'],
        det: [-12, 12],
        cut0: 9000,
        cut1: 1200,
        q: 1,
      }),
    );
  },
};
// Explosion: v = Lautstärke, size = Länge/Größe (0.1 klein … 1 riesig), pan = Stereoposition
