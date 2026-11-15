import { PI, TAU } from '../core/util.js';
import { DRONES } from '../data/drones.js';

/* Methoden der Klasse Renderer (werden in Renderer.js an die Klasse gehängt). */
export const rendererSpritesMethods = {
  enemySprite(type, r, col, white) {
    const key = 'e' + type + Math.round(r) + (white ? 'w' : col);
    return this.sprite(key, r * 1.7 + 8, (c, K) => {
      const C = white ? '#ffffff' : col,
        F = white ? 'rgba(255,255,255,.35)' : 'rgba(8,4,20,.88)';
      if (type === 'swarm')
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.3, 0);
            c.lineTo(-r, -r * 0.95);
            c.lineTo(-r * 0.5, 0);
            c.lineTo(-r, r * 0.95);
            c.closePath();
          },
          C,
          2,
          10,
          F,
        );
      else if (type === 'brute') {
        this.neon(c, K, c => this.poly(c, 6, r, PI / 6), C, 2.5, 12, F);
        this.neon(c, K, c => this.poly(c, 6, r * 0.5, PI / 6), C, 1.6, 6);
      } else if (type === 'shooter') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.25, 0);
            c.lineTo(0, -r);
            c.lineTo(-r * 0.9, 0);
            c.lineTo(0, r);
            c.closePath();
          },
          C,
          2,
          10,
          F,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(r * 0.15, 0, r * 0.28, 0, TAU);
        c.fill();
      } else if (type === 'sprinter') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.7, 0);
            c.lineTo(-r * 0.9, -r * 0.55);
            c.lineTo(-r * 0.3, 0);
            c.lineTo(-r * 0.9, r * 0.55);
            c.closePath();
          },
          C,
          1.8,
          10,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 1.1, -r * 0.9);
            c.lineTo(-r * 1.9, -r * 0.9);
            c.moveTo(-r * 1.1, r * 0.9);
            c.lineTo(-r * 1.9, r * 0.9);
          },
          C,
          1.3,
          4,
        );
      } else if (type === 'shield') {
        this.neon(c, K, c => this.poly(c, 5, r, 0), C, 2.4, 12, F);
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.35, -r * 0.4);
            c.lineTo(r * 0.35, -r * 0.4);
            c.lineTo(r * 0.35, r * 0.05);
            c.lineTo(0, r * 0.5);
            c.lineTo(-r * 0.35, r * 0.05);
            c.closePath();
          },
          C,
          1.5,
          6,
        );
      } else if (type === 'splitter') {
        for (let i = 0; i < 3; i++) {
          const a = (i * TAU) / 3,
            x = Math.cos(a) * r * 0.45,
            y = Math.sin(a) * r * 0.45;
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.arc(x, y, r * 0.55, 0, TAU);
            },
            C,
            2,
            10,
            F,
          );
        }
      } else if (type === 'mite') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.8, 0, TAU);
          },
          C,
          1.6,
          8,
          F,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, r * 0.25, 0, TAU);
        c.fill();
      } else if (type === 'queen') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.85, 0, TAU);
          },
          C,
          2.4,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i * TAU) / 6;
              c.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85);
              c.lineTo(Math.cos(a) * r * 1.35, Math.sin(a) * r * 1.35);
            }
          },
          C,
          2,
          6,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.35, 0, TAU);
          },
          C,
          1.6,
          6,
        );
      } else if (type === 'ram') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.4, 0);
            c.lineTo(r * 0.2, -r);
            c.lineTo(-r, -r);
            c.lineTo(-r * 0.3, 0);
            c.lineTo(-r, r);
            c.lineTo(r * 0.2, r);
            c.closePath();
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 0.5, -r * 0.45);
            c.lineTo(r * 0.95, 0);
            c.lineTo(r * 0.5, r * 0.45);
          },
          C,
          1.6,
          6,
        );
      } else if (type === 'tank') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-r * 0.9, -r * 0.9, r * 1.8, r * 1.8);
          },
          C,
          3,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-r * 0.5, -r * 0.5, r, r);
          },
          C,
          1.8,
          6,
        );
      } else if (type === 'revenant') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.1, 0);
            c.lineTo(0, -r);
            c.lineTo(-r * 1.1, 0);
            c.lineTo(0, r);
            c.closePath();
          },
          C,
          2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.35, -r * 0.35);
            c.lineTo(r * 0.35, r * 0.35);
            c.moveTo(r * 0.35, -r * 0.35);
            c.lineTo(-r * 0.35, r * 0.35);
          },
          C,
          1.6,
          6,
        );
      } else if (type === 'commander') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (let i = 0; i < 10; i++) {
              const a = -PI / 2 + (i * TAU) / 10,
                rr = i % 2 ? r * 0.5 : r * 1.1;
              c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            c.closePath();
          },
          C,
          2.2,
          14,
          F,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, r * 0.2, 0, TAU);
        c.fill();
      } else if (type === 'healer') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r, 0, TAU);
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.55, 0);
            c.lineTo(r * 0.55, 0);
            c.moveTo(0, -r * 0.55);
            c.lineTo(0, r * 0.55);
          },
          C,
          2.6,
          8,
        );
      } else if (type === 'bomber') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.8, 0, TAU);
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (let i = 0; i < 8; i++) {
              const a = (i * TAU) / 8;
              c.moveTo(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95);
              c.lineTo(Math.cos(a) * r * 1.4, Math.sin(a) * r * 1.4);
            }
          },
          C,
          1.8,
          6,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, r * 0.3, 0, TAU);
        c.fill();
      } else if (type === 'jumper') {
        for (const o of [-0.45, 0.45])
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.moveTo(r * (o - 0.45), -r * 0.8);
              c.lineTo(r * (o + 0.55), 0);
              c.lineTo(r * (o - 0.45), r * 0.8);
            },
            C,
            2.2,
            10,
          );
      } else if (type === 'shade') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r, 0, TAU);
          },
          C,
          2.2,
          12,
          white ? F : 'rgba(2,0,10,.96)',
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(r * 0.25, 0, r * 0.55, PI * 0.5, PI * 1.5);
          },
          C,
          2,
          6,
        );
      } else if (type === 'phaser') {
        for (const o of [-0.3, 0.3])
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.moveTo(r * (o + 0.9), 0);
              c.lineTo(r * o, -r * 0.8);
              c.lineTo(r * (o - 0.9), 0);
              c.lineTo(r * o, r * 0.8);
              c.closePath();
            },
            C,
            1.8,
            10,
            o > 0 ? F : null,
          );
      } else if (type === 'hacker') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.35, -r);
            c.lineTo(-r, -r);
            c.lineTo(-r, r);
            c.lineTo(-r * 0.35, r);
            c.moveTo(r * 0.35, -r);
            c.lineTo(r, -r);
            c.lineTo(r, r);
            c.lineTo(r * 0.35, r);
          },
          C,
          2.2,
          12,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, r * 0.28, 0, TAU);
        c.fill();
      } else if (type === 'brooder') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.ellipse(0, 0, r * 1.15, r * 0.85, 0, 0, TAU);
          },
          C,
          2.4,
          12,
          F,
        );
        for (const [x, y] of [
          [-0.45, 0],
          [0.2, -0.3],
          [0.2, 0.3],
        ])
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.arc(r * x, r * y, r * 0.2, 0, TAU);
            },
            C,
            1.4,
            5,
          );
      } else if (type === 'egg') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.ellipse(0, 0, r * 0.95, r * 0.72, 0, 0, TAU);
          },
          C,
          2,
          10,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.5, 0);
            c.lineTo(-r * 0.15, -r * 0.25);
            c.lineTo(r * 0.15, r * 0.2);
            c.lineTo(r * 0.5, -r * 0.05);
          },
          C,
          1.3,
          4,
        );
      } else if (type === 'thief') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.2, 0);
            c.lineTo(-r * 0.6, -r * 0.8);
            c.lineTo(-r * 0.2, 0);
            c.lineTo(-r * 0.6, r * 0.8);
            c.closePath();
          },
          C,
          2,
          10,
          F,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(r * 0.25, 0, r * 0.2, 0, TAU);
        c.fill();
      } else if (type === 'mortar') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-r * 0.9, -r * 0.7, r * 1.4, r * 1.4);
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(-r * 0.2, 0, r * 0.4, 0, TAU);
            c.moveTo(r * 0.2, 0);
            c.lineTo(r * 1.3, 0);
          },
          C,
          2.2,
          6,
        );
      } else if (type === 'gas') {
        for (const [x, y, q] of [
          [-0.35, 0.25, 0.6],
          [0.4, 0.3, 0.5],
          [0, -0.4, 0.6],
        ])
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.arc(r * x, r * y, r * q, 0, TAU);
            },
            C,
            2,
            10,
            F,
          );
      } else if (type === 'sniper') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r, -r * 0.5);
            c.lineTo(r * 0.3, -r * 0.5);
            c.lineTo(r * 0.3, r * 0.5);
            c.lineTo(-r, r * 0.5);
            c.closePath();
            c.moveTo(r * 0.3, 0);
            c.lineTo(r * 1.7, 0);
          },
          C,
          2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(-r * 0.35, 0, r * 0.22, 0, TAU);
          },
          C,
          1.4,
          5,
        );
      } else if (type === 'mirror') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 0.5, -r * 1.1);
            c.lineTo(r * 0.5, r * 1.1);
            c.lineTo(-r * 0.6, r * 0.7);
            c.lineTo(-r * 0.6, -r * 0.7);
            c.closePath();
          },
          C,
          2.2,
          14,
          white ? F : 'rgba(214,245,255,.22)',
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.2, -r * 0.5);
            c.lineTo(r * 0.2, -r * 0.1);
            c.moveTo(-r * 0.2, r * 0.1);
            c.lineTo(r * 0.2, r * 0.5);
          },
          C,
          1.3,
          4,
        );
      } else if (type === 'magnet') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.95, PI * 0.75, PI * 2.25);
            c.arc(0, 0, r * 0.45, PI * 2.25, PI * 0.75, true);
            c.closePath();
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.2, r * 0.9);
            c.lineTo(-r * 0.75, r * 0.45);
            c.moveTo(r * 0.2, r * 0.9);
            c.lineTo(r * 0.75, r * 0.45);
          },
          '#ffffff',
          1.6,
          6,
        );
      } else if (type === 'pair') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.9, 0, TAU);
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(-r * 0.25, 0, r * 0.38, 0, TAU);
            c.moveTo(r * 0.63, 0);
            c.arc(r * 0.25, 0, r * 0.38, 0, TAU);
          },
          C,
          1.5,
          6,
        );
      } else if (type === 'cloaker') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.25, 0);
            c.lineTo(0, -r * 0.85);
            c.lineTo(-r * 1.25, 0);
            c.lineTo(0, r * 0.85);
            c.closePath();
          },
          C,
          2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.ellipse(0, 0, r * 0.55, r * 0.28, 0, 0, TAU);
          },
          C,
          1.5,
          6,
        );
      } else if (type === 'jammer') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r, r * 0.8);
            c.lineTo(-r, r * 0.8);
            c.lineTo(0, -r * 0.95);
            c.closePath();
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, -r * 0.95, r * 0.55, -PI * 0.85, -PI * 0.15);
            c.moveTo(r * 0.9, -r * 0.95);
            c.arc(0, -r * 0.95, r * 0.9, 0, -PI, true);
          },
          C,
          1.4,
          6,
        );
      } else if (type === 'giant') {
        this.neon(c, K, c => this.poly(c, 8, r, PI / 8), C, 3, 14, F);
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-r * 0.42, -r * 0.42, r * 0.84, r * 0.84);
          },
          C,
          2,
          8,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, r * 0.14, 0, TAU);
        c.fill();
      } else if (type === 'siege') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);
          },
          C,
          2.4,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(r * 0.2, -r * 0.28, r * 1.25, r * 0.56);
          },
          C,
          1.8,
          8,
          F,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(-r * 0.2, 0, r * 0.25, 0, TAU);
        c.fill();
      } else {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (let i = 0; i < 16; i++) {
              const a = (i * TAU) / 16,
                rr = i % 2 ? r * 0.62 : r;
              c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            c.closePath();
          },
          C,
          3,
          18,
          F,
        );
        this.neon(c, K, c => this.poly(c, 8, r * 0.42, PI / 8), C, 2, 8);
        c.fillStyle = white ? '#fff' : '#ffd0dc';
        c.beginPath();
        c.arc(0, 0, r * 0.18, 0, TAU);
        c.fill();
      }
    });
  },
  eliteRing(r) {
    return this.sprite('el' + Math.round(r), r * 1.6 + 8, (c, K) => {
      c.setLineDash([4, 4]);
      this.neon(
        c,
        K,
        c => {
          c.beginPath();
          c.arc(0, 0, r * 1.45, 0, TAU);
        },
        '#ffe14f',
        1.6,
        8,
      );
    });
  },
  heroSprite(id, col, white) {
    return this.sprite('h' + id + (white ? 'w' : ''), 26, (c, K) => {
      const C = white ? '#ffffff' : col,
        F = 'rgba(10,4,24,.9)';
      if (id === 'klinge') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(16, 0);
            c.lineTo(0, -7);
            c.lineTo(-11, 0);
            c.lineTo(0, 7);
            c.closePath();
          },
          C,
          2.4,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-3, -11);
            c.lineTo(-3, 11);
            c.moveTo(-11, 0);
            c.lineTo(-16, 0);
          },
          C,
          2,
          8,
        );
      } else if (id === 'schuetzin') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(-2, 0, 9, 0, TAU);
          },
          C,
          2.2,
          12,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(-4, 0, 15, -1.1, 1.1);
            c.moveTo(-6, 0);
            c.lineTo(16, 0);
            c.moveTo(12, -4);
            c.lineTo(16, 0);
            c.lineTo(12, 4);
          },
          C,
          1.8,
          8,
        );
      } else if (id === 'arkanist') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (const o of [0, PI]) {
              for (let i = 0; i < 3; i++) {
                const a = o - PI / 2 + (i * TAU) / 3;
                i ? c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13) : c.moveTo(Math.cos(a) * 13, Math.sin(a) * 13);
              }
              c.closePath();
            }
          },
          C,
          2.2,
          14,
          F,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, 3, 0, TAU);
        c.fill();
      } else if (id === 'kopfjaeger') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-12, -8);
            c.lineTo(4, -8);
            c.lineTo(10, 0);
            c.lineTo(4, 8);
            c.lineTo(-12, 8);
            c.closePath();
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(6, 0);
            c.lineTo(19, 0);
            c.moveTo(-3, 0);
            c.arc(-6, 0, 3, 0, TAU);
          },
          C,
          1.8,
          8,
        );
      } else if (id === 'ingenieurin') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (let i = 0; i < 16; i++) {
              const a = (i * TAU) / 16 + PI / 16,
                rr = i % 2 ? 13 : 9.5;
              c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            c.closePath();
          },
          C,
          2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 4, 0, TAU);
            c.moveTo(4, 0);
            c.lineTo(15, 0);
          },
          C,
          1.8,
          8,
        );
      } else {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-10, -11);
            c.lineTo(10, -11);
            c.lineTo(10, 0);
            c.quadraticCurveTo(10, 9, 0, 14);
            c.quadraticCurveTo(-10, 9, -10, 0);
            c.closePath();
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(0, -6);
            c.lineTo(0, 6);
            c.moveTo(-5, 0);
            c.lineTo(5, 0);
          },
          C,
          1.8,
          6,
        );
      }
    });
  },
  droneSprite(cls, white) {
    const D = DRONES[cls] || DRONES.jaeger,
      big = cls === 'kreuzer';
    return this.sprite('d' + cls + (white ? 'w' : ''), big ? 20 : 13, (c, K) => {
      const C = white ? '#fff' : D.col,
        r = D.r,
        F = 'rgba(4,20,30,.9)';
      if (big) {
        this.neon(c, K, c => this.poly(c, 6, r, 0), C, 2, 12, F);
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 0.8, 0);
            c.lineTo(-r * 0.4, -r * 0.5);
            c.lineTo(-r * 0.4, r * 0.5);
            c.closePath();
          },
          C,
          1.4,
          4,
        );
      } else if (cls === 'abfang')
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.9, 0);
            c.lineTo(-r * 0.9, -r * 0.6);
            c.lineTo(-r * 0.2, 0);
            c.lineTo(-r * 0.9, r * 0.6);
            c.closePath();
          },
          C,
          1.5,
          8,
          F,
        );
      else if (cls === 'schwarm') {
        for (let i = 0; i < 3; i++) {
          const a = (i * TAU) / 3,
            x = Math.cos(a) * r * 0.6,
            y = Math.sin(a) * r * 0.6;
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.moveTo(x + r * 0.55, y);
              c.lineTo(x - r * 0.35, y - r * 0.38);
              c.lineTo(x - r * 0.35, y + r * 0.38);
              c.closePath();
            },
            C,
            1.2,
            6,
            F,
          );
        }
      } else if (cls === 'repair') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, r * 0.95, 0, TAU);
          },
          C,
          1.6,
          8,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-r * 0.5, 0);
            c.lineTo(r * 0.5, 0);
            c.moveTo(0, -r * 0.5);
            c.lineTo(0, r * 0.5);
          },
          C,
          1.6,
          5,
        );
      } else
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(r * 1.3, 0);
            c.lineTo(-r * 0.8, -r * 0.9);
            c.lineTo(-r * 0.3, 0);
            c.lineTo(-r * 0.8, r * 0.9);
            c.closePath();
          },
          C,
          1.6,
          8,
          F,
        );
    });
  },
  coreSprite(r, n, lw, col, key) {
    return this.sprite(key, r + 14, (c, K) =>
      this.neon(c, K, c => this.poly(c, n, r, 0), col, lw, 16, 'rgba(6,10,36,.92)'),
    );
  },
  towerSprite(type, col) {
    return this.sprite('t' + type + col, 26, (c, K) => {
      const C = col,
        F = 'rgba(6,10,36,.92)';
      if (type === 'frost') {
        this.neon(c, K, c => this.poly(c, 6, 13, 0), C, 2.2, 14, F);
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            for (let i = 0; i < 6; i++) {
              const a = (i * PI) / 3;
              c.moveTo(0, 0);
              c.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
              c.moveTo(Math.cos(a) * 5 + Math.cos(a + 0.9) * 3, Math.sin(a) * 5 + Math.sin(a + 0.9) * 3);
              c.lineTo(Math.cos(a) * 5, Math.sin(a) * 5);
              c.lineTo(Math.cos(a) * 5 + Math.cos(a - 0.9) * 3, Math.sin(a) * 5 + Math.sin(a - 0.9) * 3);
            }
          },
          C,
          1.3,
          6,
        );
      } else if (type === 'weak') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-13, -9);
            c.lineTo(13, -9);
            c.lineTo(0, 14);
            c.closePath();
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, -1, 4.5, 0, TAU);
          },
          C,
          1.6,
          8,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, -1, 1.8, 0, TAU);
        c.fill();
      } else if (type === 'mute') {
        this.neon(c, K, c => this.poly(c, 8, 13, PI / 8), C, 2.2, 14, F);
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 6.5, 0, TAU);
            c.moveTo(-4.6, 4.6);
            c.lineTo(4.6, -4.6);
          },
          C,
          1.7,
          8,
        );
      } else if (type === 'mark') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 12, 0, TAU);
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 5.5, 0, TAU);
            c.moveTo(-10, 0);
            c.lineTo(-3, 0);
            c.moveTo(3, 0);
            c.lineTo(10, 0);
            c.moveTo(0, -10);
            c.lineTo(0, -3);
            c.moveTo(0, 3);
            c.lineTo(0, 10);
          },
          C,
          1.5,
          8,
        );
      } else if (type === 'laser') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 11, 0, TAU);
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(4, -3);
            c.lineTo(18, -3);
            c.moveTo(4, 3);
            c.lineTo(18, 3);
          },
          C,
          2,
          8,
        );
        c.fillStyle = C;
        c.beginPath();
        c.arc(0, 0, 3.5, 0, TAU);
        c.fill();
      } else if (type === 'rocket') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-11, -11, 22, 22);
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.rect(-3, -9, 16, 6);
            c.rect(-3, 3, 16, 6);
          },
          C,
          1.6,
          8,
        );
      } else if (type === 'tesla') {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 12, 0, TAU);
          },
          C,
          2.2,
          14,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-6, -7);
            c.lineTo(2, -2);
            c.lineTo(-3, 1);
            c.lineTo(6, 7);
            c.moveTo(-8, 0);
            c.arc(0, 0, 8, PI, PI * 1.6);
          },
          C,
          1.6,
          8,
        );
      } else {
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(0, -15);
            c.lineTo(10, 0);
            c.lineTo(0, 15);
            c.lineTo(-10, 0);
            c.closePath();
          },
          C,
          2.2,
          16,
          F,
        );
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.moveTo(-10, 0);
            c.lineTo(10, 0);
            c.moveTo(0, -15);
            c.lineTo(-4, 0);
            c.lineTo(0, 15);
            c.moveTo(0, -15);
            c.lineTo(4, 0);
            c.lineTo(0, 15);
          },
          C,
          1,
          4,
        );
      }
    });
  },
};
