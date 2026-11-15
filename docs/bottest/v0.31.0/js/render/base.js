import { PI, TAU, clamp } from '../core/util.js';
import { BOOM_T } from '../data/balance.js';

/* Methoden der Klasse Renderer (werden in Renderer.js an die Klasse gehängt). */
export const rendererBaseMethods = {
  /* Aussehen der Basis nach den größeren Basis-Upgrades (Welt 1). Reine Anzeige, liest nur die Knotenstufen. */ baseLook(
    n,
  ) {
    n = n || {};
    const L = k => n[k] || 0,
      pz = L('b1');
    return {
      plates: pz >= 50 ? 3 : pz >= 25 ? 2 : pz >= 10 ? 1 : 0,
      bast: L('b5') > 0,
      crown: L('b8') > 0,
      emit: L('b3b') > 0,
      nova: L('b5b') > 0,
      guns: L('f2c') > 0 ? (L('f7') > 0 ? 6 : 3) : 0,
      reactor: L('b6') > 0,
      rep: L('b2b') ? Math.min(4, 1 + Math.floor(L('b2b') / 4)) : 0,
      matrix: L('b7a') > 0,
      net: L('b7b') > 0,
      cal: L('b4a') >= 5 ? 2 : L('b4a') > 0 ? 1 : 0,
      aura: L('b9') > 0,
    };
  },
  // Anbauten als ein gecachtes Sprite: Panzerplatten (Panzerung 10/25/50), Bastionen (Bollwerk), Krone (Festungskern), Emitter (Schockwelle, Nova-Ring), Läufe (Autofeuer, Sturmfeuer)
  baseKit(k) {
    const key = 'kit' + k.plates + +k.bast + +k.crown + +k.emit + +k.nova + k.guns;
    return this.sprite(key, 62, (c, K) => {
      if (k.crown) this.neon(c, K, c => this.poly(c, 6, 35, PI / 6), '#ffe14f', 1.6, 10);
      if (k.bast)
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6;
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.moveTo(Math.cos(a - 0.17) * 32, Math.sin(a - 0.17) * 32);
              c.lineTo(Math.cos(a) * 44, Math.sin(a) * 44);
              c.lineTo(Math.cos(a + 0.17) * 32, Math.sin(a + 0.17) * 32);
              c.closePath();
            },
            '#3df5ff',
            2,
            10,
            'rgba(6,10,36,.92)',
          );
        }
      if (k.plates)
        for (let i = 0; i < 6; i++) {
          if (k.plates === 1 && i % 2) continue;
          const a = (i * TAU) / 6 + PI / 6;
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.arc(0, 0, 38.5, a - 0.34, a + 0.34);
            },
            '#9fd8ff',
            k.plates === 3 ? 4.5 : 3,
            8,
          );
        }
      if (k.guns)
        for (let i = 0; i < 6; i++) {
          if (k.guns === 3 && i % 2) continue;
          const a = (i * TAU) / 6;
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.moveTo(Math.cos(a) * 29, Math.sin(a) * 29);
              c.lineTo(Math.cos(a) * (k.bast ? 48 : 40), Math.sin(a) * (k.bast ? 48 : 40));
            },
            '#ffffff',
            2.4,
            8,
          );
        }
      if (k.nova)
        this.neon(
          c,
          K,
          c => {
            c.beginPath();
            c.arc(0, 0, 23.5, 0, TAU);
          },
          '#ff4fd8',
          1.2,
          8,
        );
      if (k.emit)
        for (let i = 0; i < 6; i++) {
          const a = (i * TAU) / 6 + PI / 6;
          this.neon(
            c,
            K,
            c => {
              c.beginPath();
              c.arc(Math.cos(a) * 23.5, Math.sin(a) * 23.5, 1.8, 0, TAU);
            },
            '#ff4fd8',
            1.6,
            8,
            '#ff4fd8',
          );
        }
    });
  },
  // Trümmer nach der Explosion: jede Kante der beiden Kerne, Platten und Geschütze fliegt als Splitter davon. Reine Funktion der Zeit seit dem Fall (kein Zustand).
  drawWreck(b, k, look) {
    const c = this.c,
      h = (i, s) => {
        const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
        return v - Math.floor(v);
      },
      fade = clamp(1 - k / 1.6, 0, 1),
      out = 1 - Math.exp(-2.4 * k);
    c.fillStyle = 'rgba(0,0,0,.4)';
    c.beginPath();
    c.arc(0, 0, 34, 0, TAU);
    c.fill();
    c.globalCompositeOperation = 'lighter';
    const sh = (i, a0, r, len, col, lw) => {
      const a = a0 + (h(i, 1) - 0.5) * 0.7,
        d = r + (50 + h(i, 2) * 190) * out,
        rot = a0 + PI / 2 + (h(i, 3) - 0.5) * 14 * k,
        x = Math.cos(a) * d,
        y = Math.sin(a) * d,
        dx = (Math.cos(rot) * len) / 2,
        dy = (Math.sin(rot) * len) / 2;
      c.globalAlpha = fade;
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(x - dx, y - dy);
      c.lineTo(x + dx, y + dy);
      c.stroke();
      c.strokeStyle = '#ffffff';
      c.lineWidth = lw * 0.35;
      c.stroke();
    };
    if (fade > 0) {
      let n = 0;
      for (let i = 0; i < 6; i++) {
        const a = b.rot + (i * TAU) / 6 + PI / 6;
        sh(n++, a, 26, 30, '#3df5ff', 3);
        sh(n++, -b.rot * 1.6 + (i * TAU) / 6 + PI / 6, 15, 17, '#ff4fd8', 2.2);
        if (look.plates && (look.plates > 1 || i % 2 === 0)) sh(n++, a, 38, 24, '#9fd8ff', 3);
        if (look.bast) sh(n++, b.rot + (i * TAU) / 6, 38, 14, '#3df5ff', 2);
      }
      for (const tu of b.turrets) sh(n++, tu.a, 44, 12, '#3df5ff', 3);
    }
    if (k < 0.3) {
      c.globalAlpha = 1 - k / 0.3;
      this.draw(this.dot('#ffffff'), 0, 0, 0, 4 + k * 40);
    }
    c.globalAlpha = 0.35 + 0.2 * Math.sin(this.t * 5);
    this.draw(this.dot('#ff4f6d'), 0, 0, 0, 1.3);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  },
  drawBase(b, run, look) {
    const c = this.c,
      dying = !!(run && run.over && !run.quit),
      fl = dying ? Math.floor(run.overT * 40) % 2 === 0 : b.flash > 0;
    look = look || this.baseLook(null);
    if (dying && run.overT >= BOOM_T) {
      this.drawWreck(b, run.overT - BOOM_T, look);
      return;
    }
    if (look.aura) {
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(255,255,255,${0.1 + 0.08 * Math.sin(this.t * 2)})`;
      c.lineWidth = 5;
      c.beginPath();
      c.arc(0, 0, 62, 0, TAU);
      c.stroke();
      c.globalCompositeOperation = 'source-over';
    }
    if (b.shMax > 0 && b.sh > 0) {
      const f = b.sh / b.shMax;
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = `rgba(61,245,255,${0.04 + 0.05 * f})`;
      c.beginPath();
      c.arc(0, 0, 50, 0, TAU);
      c.fill();
      c.strokeStyle = fl ? '#ffffff' : `rgba(61,245,255,${0.25 + 0.5 * f})`;
      c.lineWidth = 2;
      c.beginPath();
      c.arc(0, 0, 50, 0, TAU);
      c.stroke();
      if (look.matrix) {
        c.lineWidth = 1.5;
        c.setLineDash([7, 6]);
        c.lineDashOffset = this.t * 14;
        c.beginPath();
        c.arc(0, 0, 54, 0, TAU);
        c.stroke();
        c.setLineDash([]);
      }
      c.globalCompositeOperation = 'source-over';
    }
    if (b.ov > 0) {
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = `rgba(255,225,79,${0.4 + 0.4 * Math.sin(this.t * 6) ** 2})`;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(0, 0, 56, 0, TAU);
      c.stroke();
      c.globalCompositeOperation = 'source-over';
    }
    if (look.net && b.turrets.length > 1) {
      c.strokeStyle = 'rgba(61,245,255,.35)';
      c.lineWidth = 1;
      c.beginPath();
      for (const tu of b.turrets) c.lineTo(Math.cos(tu.a) * 44, Math.sin(tu.a) * 44);
      c.closePath();
      c.stroke();
    }
    for (const tu of b.turrets) {
      const x = Math.cos(tu.a) * 44,
        y = Math.sin(tu.a) * 44,
        bl = look.cal ? 15 : 11;
      c.save();
      c.translate(x, y);
      c.rotate(tu.aim);
      c.strokeStyle = '#3df5ff';
      c.lineWidth = look.cal === 1 ? 4 : 3;
      c.beginPath();
      if (look.cal === 2) {
        c.moveTo(0, -2.6);
        c.lineTo(bl, -2.6);
        c.moveTo(0, 2.6);
        c.lineTo(bl, 2.6);
      } else {
        c.moveTo(0, 0);
        c.lineTo(bl, 0);
      }
      c.stroke();
      c.fillStyle = 'rgba(6,10,36,.95)';
      c.fillRect(-5, -5, 10, 10);
      c.lineWidth = 1.6;
      c.strokeRect(-5, -5, 10, 10);
      c.restore();
    }
    if (look.plates || look.bast || look.crown || look.emit || look.nova || look.guns)
      this.draw(this.baseKit(look), 0, 0, b.rot || 1e-9);
    const col = fl ? '#ffffff' : '#3df5ff';
    this.draw(this.coreSprite(30, 6, 3, col, 'core1' + col), 0, 0, b.rot);
    const col2 = fl ? '#ffffff' : '#ff4fd8';
    this.draw(this.coreSprite(17, 6, 2.2, col2, 'core2' + col2), 0, 0, -b.rot * 1.6);
    if (look.reactor) this.draw(this.coreSprite(8, 3, 1.6, '#ffe14f', 'core3'), 0, 0, this.t * 2.4);
    const p = 0.6 + 0.4 * Math.sin(this.t * 3),
      hf = b.max ? b.hp / b.max : 1;
    c.globalCompositeOperation = 'lighter';
    this.draw(this.dot(hf < 0.3 ? '#ff4f6d' : look.reactor ? '#ffe14f' : '#3df5ff'), 0, 0, 0, 1.1 + p * 0.4);
    for (let i = 0; i < look.rep; i++) {
      const a = this.t * 1.7 + (i * TAU) / look.rep;
      this.draw(this.dot('#5dffb0'), Math.cos(a) * 34, Math.sin(a) * 34, 0, 0.5);
    }
    if (dying) this.draw(this.dot('#ffffff'), 0, 0, 0, 1.5 + (run.overT / BOOM_T) * 5);
    c.globalCompositeOperation = 'source-over';
  },
};
