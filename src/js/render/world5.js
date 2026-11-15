import { CLASSES5, ENEMIES5, HEROES5, RARITY5, RARITY_IDS5 } from '../world5/data.js';

/* ================= WELT 5: Zeichnung =================
   Helden und Gegner werden einmal als leuchtende Bildchen vorgezeichnet (kein Leuchten je Bild und Objekt) und dann nur noch
   kopiert. Jeder Held sieht anders aus: Die Klasse gibt die Grundform, Farbton und Variante (HEROES5[id].hue, .v) den Rest;
   Punkte unter der Figur zeigen die Seltenheit, Champions tragen einen dezenten Lichtkranz. */
const TAU = Math.PI * 2,
  cache = new Map();
const poly = (c, pts) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
  c.closePath();
};
const ngon = (n, r, rot = -Math.PI / 2) =>
  Array.from({ length: n }, (_, i) => [Math.cos(rot + (i * TAU) / n) * r, Math.sin(rot + (i * TAU) / n) * r]);

function sprite(key, size, draw) {
  let cv = cache.get(key);
  if (cv) return cv;
  const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  cv = document.createElement('canvas');
  cv.width = cv.height = Math.ceil(size * 2 * dpr);
  cv.half = size;
  const c = cv.getContext('2d');
  c.scale(dpr, dpr);
  c.translate(size, size);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  draw(c);
  cache.set(key, cv);
  return cv;
}
// Umriss mit Leuchten: erst breit und weich, dann scharf
function neon(c, path, col, fill, lw = 2.2) {
  c.save();
  c.shadowColor = col;
  c.shadowBlur = 12;
  path();
  c.fillStyle = fill || 'rgba(6,8,34,.92)';
  c.fill();
  c.strokeStyle = col;
  c.lineWidth = lw;
  c.stroke();
  c.restore();
  path();
  c.strokeStyle = 'rgba(255,255,255,.55)';
  c.lineWidth = lw * 0.35;
  c.stroke();
}

// Bild eines Helden; r = halbe Größe der Figur
export function heroSprite5(id, r = 20) {
  const H = HEROES5[id];
  return sprite('h' + id + r, r * 1.9 + 10, c => {
    const col = `hsl(${H.hue} 100% 66%)`,
      col2 = `hsl(${(H.hue + 40) % 360} 100% 72%)`,
      v = H.v,
      champ = H.rar === 'champ';
    if (champ) {
      // Lichtkranz: erkennbar, aber zurückhaltend
      const g = c.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 1.75);
      g.addColorStop(0, `hsl(${H.hue} 100% 70% / .30)`);
      g.addColorStop(1, `hsl(${H.hue} 100% 70% / 0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, r * 1.75, 0, TAU);
      c.fill();
      c.strokeStyle = 'rgba(255,255,255,.5)';
      c.lineWidth = 1;
      c.setLineDash([3, 5]);
      c.beginPath();
      c.arc(0, 0, r * 1.45, 0, TAU);
      c.stroke();
      c.setLineDash([]);
    }
    // Beiwerk je Variante, hinter der Figur
    c.strokeStyle = col2;
    c.lineWidth = 2;
    c.shadowColor = col2;
    c.shadowBlur = 8;
    c.beginPath();
    if (v === 2 || v === 5) {
      c.moveTo(-r * 0.7, -r * 0.2);
      c.lineTo(-r * 1.35, -r * 0.75);
      c.moveTo(-r * 0.7, r * 0.2);
      c.lineTo(-r * 1.35, r * 0.75);
    }
    if (v === 3 || v === 5) {
      c.moveTo(-r * 0.3, -r * 0.9);
      c.lineTo(0, -r * 1.5);
      c.lineTo(r * 0.3, -r * 0.9);
    }
    if (v === 4) {
      c.moveTo(-r * 0.5, -r * 0.6);
      c.quadraticCurveTo(-r * 1.6, -r * 1.3, -r * 1.2, r * 0.1);
      c.moveTo(-r * 0.5, r * 0.6);
      c.quadraticCurveTo(-r * 1.6, r * 1.3, -r * 1.2, -r * 0.1);
    }
    c.stroke();
    c.shadowBlur = 0;
    // Grundform der Klasse
    if (H.cls === 'tank') {
      neon(c, () => poly(c, ngon(6, r, 0)), col);
      neon(
        c,
        () =>
          poly(c, [
            [r * 0.15, -r * 0.62],
            [r * 0.7, 0],
            [r * 0.15, r * 0.62],
            [-r * 0.35, r * 0.62],
            [-r * 0.35, -r * 0.62],
          ]),
        col2,
        'rgba(6,8,34,.6)',
        1.6,
      );
      if (v % 2) {
        c.strokeStyle = col;
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(-r * 0.35, 0);
        c.lineTo(r * 0.7, 0);
        c.stroke();
      }
    } else if (H.cls === 'striker') {
      neon(
        c,
        () =>
          poly(c, [
            [r * 1.15, 0],
            [-r * 0.55, -r * 0.8],
            [-r * 0.15, 0],
            [-r * 0.55, r * 0.8],
          ]),
        col,
      );
      neon(
        c,
        () =>
          poly(c, [
            [r * 0.75, 0],
            [-r * 0.05, -r * 0.28],
            [-r * 0.05, r * 0.28],
          ]),
        col2,
        col2,
        1,
      );
      if (v % 2)
        neon(
          c,
          () =>
            poly(c, [
              [r * 0.2, -r * 0.75],
              [r * 0.75, -r * 0.95],
              [r * 0.45, -r * 0.45],
            ]),
          col2,
          'rgba(6,8,34,.8)',
          1.4,
        );
    } else if (H.cls === 'mage') {
      neon(c, () => poly(c, ngon(4, r)), col);
      neon(
        c,
        () => {
          c.beginPath();
          c.arc(0, 0, r * 0.34, 0, TAU);
        },
        col2,
        col2,
        1,
      );
      for (let k = 0; k < 2 + (v % 3); k++) {
        const a = (k * TAU) / (2 + (v % 3)) - 0.6;
        neon(
          c,
          () => {
            c.beginPath();
            c.arc(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, r * 0.13, 0, TAU);
          },
          col2,
          col2,
          1,
        );
      }
    } else if (H.cls === 'healer') {
      neon(
        c,
        () => {
          c.beginPath();
          c.arc(0, 0, r * 0.92, 0, TAU);
        },
        col,
      );
      const a = r * 0.2,
        b = r * 0.58;
      neon(
        c,
        () =>
          poly(c, [
            [-a, -b],
            [a, -b],
            [a, -a],
            [b, -a],
            [b, a],
            [a, a],
            [a, b],
            [-a, b],
            [-a, a],
            [-b, a],
            [-b, -a],
            [-a, -a],
          ]),
        col2,
        v % 2 ? col2 : 'rgba(6,8,34,.6)',
        1.6,
      );
    } else {
      neon(
        c,
        () => {
          c.beginPath();
          c.arc(0, 0, r * 0.9, 0, TAU);
          c.arc(0, 0, r * 0.52, 0, TAU, true);
        },
        col,
      );
      const n = 3 + (v % 3);
      for (let k = 0; k < n; k++) {
        const a = -Math.PI / 2 + (k * TAU) / n;
        neon(
          c,
          () => {
            c.beginPath();
            c.arc(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9, r * 0.17, 0, TAU);
          },
          col2,
          col2,
          1,
        );
      }
      neon(c, () => poly(c, ngon(3, r * 0.26, 0)), col2, col2, 1);
    }
    // Seltenheit als Punkte unter der Figur
    const n = RARITY_IDS5.indexOf(H.rar) + 1,
      rc = RARITY5[H.rar].col;
    c.fillStyle = rc;
    c.shadowColor = rc;
    c.shadowBlur = 6;
    for (let k = 0; k < n; k++) {
      c.beginPath();
      c.arc((k - (n - 1) / 2) * 7, r * 1.45, 2.2, 0, TAU);
      c.fill();
    }
  });
}
export function enemySprite5(type) {
  const T = ENEMIES5[type],
    r = T.r;
  return sprite('e' + type, r * 1.5 + 12, c => {
    const col = T.col;
    if (type === 'grunt')
      neon(
        c,
        () =>
          poly(c, [
            [-r * 1.1, 0],
            [r * 0.7, -r * 0.85],
            [r * 0.3, 0],
            [r * 0.7, r * 0.85],
          ]),
        col,
      );
    else if (type === 'swarm')
      neon(
        c,
        () =>
          poly(c, [
            [-r, 0],
            [r * 0.6, -r * 0.7],
            [r * 0.6, r * 0.7],
          ]),
        col,
      );
    else if (type === 'brute') {
      neon(c, () => poly(c, ngon(4, r * 1.1, Math.PI / 4)), col);
      neon(c, () => poly(c, ngon(4, r * 0.5, Math.PI / 4)), col, 'rgba(6,8,34,.6)', 1.5);
    } else if (type === 'shooter') {
      neon(c, () => poly(c, ngon(4, r)), col);
      neon(
        c,
        () =>
          poly(c, [
            [-r * 1.3, -2],
            [-r * 0.4, -2],
            [-r * 0.4, 2],
            [-r * 1.3, 2],
          ]),
        col,
        col,
        1,
      );
    } else {
      neon(c, () => poly(c, ngon(8, r, Math.PI / 8)), col, null, 3);
      neon(c, () => poly(c, ngon(8, r * 0.62, 0)), '#ffe14f', 'rgba(6,8,34,.6)', 1.8);
      neon(
        c,
        () => {
          c.beginPath();
          c.arc(0, 0, r * 0.2, 0, TAU);
        },
        '#fff',
        '#fff',
        1,
      );
    }
  });
}
// Bildchen in ein kleines <canvas> eines Menüs setzen
export function paintHero5(cv, id, r) {
  const sp = heroSprite5(id, r),
    c = cv.getContext('2d');
  cv.width = sp.width;
  cv.height = sp.height;
  c.drawImage(sp, 0, 0);
}

/* Das Lauf-Bild. c = Kontext (schon auf Geräte-Pixel skaliert), w/h in CSS-Pixeln, hue = Farbton der Zone. */
export function drawRun5(c, w, h, run, hue) {
  const sc = Math.min(1.05, w / 560),
    ox = w * 0.4,
    y0 = h * 0.6,
    X = x => ox + x * sc,
    Y = lane => y0 + lane * 15;
  // Hintergrund: Himmel in der Farbe der Zone, Horizont, Bodenraster, das mit dem zurückgelegten Weg wandert
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#05051a');
  g.addColorStop(0.62, `hsl(${hue} 70% 9%)`);
  g.addColorStop(1, '#05051a');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97.3 - run.dist * (0.05 + (i % 3) * 0.04)) % (w + 40),
      x = sx < 0 ? sx + w + 40 : sx;
    c.fillStyle = `hsl(${hue + (i % 5) * 12} 80% 80% / ${0.25 + (i % 4) * 0.12})`;
    c.fillRect(x - 20, ((i * 53.7) % (y0 - 50)) + 6, 1.6, 1.6);
  }
  // ferne Türme
  c.strokeStyle = `hsl(${hue} 90% 60% / .22)`;
  c.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    const px = ((i * 131 - run.dist * 0.25) % (w + 160)) - 80,
      x = px < -80 ? px + w + 160 : px,
      hh = 22 + ((i * 37) % 46);
    c.strokeRect(x, y0 - 34 - hh, 16 + ((i * 7) % 14), hh);
  }
  const yb = y0 + 52;
  c.strokeStyle = `hsl(${hue} 100% 62% / .7)`;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, yb);
  c.lineTo(w, yb);
  c.stroke();
  c.strokeStyle = `hsl(${hue} 100% 62% / .22)`;
  c.lineWidth = 1;
  c.beginPath();
  for (let i = -2; i < 26; i++) {
    const x = i * 44 - (run.dist % 44);
    c.moveTo(x, yb);
    c.lineTo((x - w / 2) * 2.4 + w / 2, h);
  }
  for (let k = 1; k < 5; k++) {
    const y = yb + (h - yb) * (k / 5) * (k / 5) * 1.2;
    c.moveTo(0, y);
    c.lineTo(w, y);
  }
  c.stroke();
  // Wirkungen der Gruppe als Schimmer hinter den Helden
  if (run.invul > 0 || run.guard > 0 || run.haste > 0) {
    c.fillStyle =
      run.invul > 0 ? 'rgba(255,255,255,.10)' : run.guard > 0 ? 'rgba(90,184,255,.09)' : 'rgba(255,225,79,.07)';
    c.fillRect(X(-4.6 * 46), y0 - 44, 5.4 * 46 * sc, 88);
  }
  const bar = (x, y, bw, f, col) => {
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillRect(x - bw / 2, y, bw, 3.5);
    c.fillStyle = col;
    c.fillRect(x - bw / 2, y, bw * Math.max(0, Math.min(1, f)), 3.5);
  };
  // Helden
  for (const hr of run.heroes) {
    const x = X(hr.x),
      y =
        y0 +
        (hr.slot % 2 ? -22 : 12) + // zwei Reihen, damit sich Nachbarn nicht überdecken
        (run.phase === 'walk' || run.phase === 'won' ? Math.sin(run.t * 9 + hr.slot) * 2.5 : 0),
      sp = heroSprite5(hr.id, 17);
    c.globalAlpha = hr.dead ? 0.22 : 1;
    c.drawImage(sp, x - sp.half, y - sp.half, sp.half * 2, sp.half * 2);
    if (hr.flash > 0 && !hr.dead) {
      c.globalAlpha = 0.5;
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(x, y, 15, 0, TAU);
      c.fill();
    }
    c.globalAlpha = 1;
    if (hr.dead) continue;
    if (hr.sh > 0) {
      c.strokeStyle = 'rgba(159,216,255,.9)';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y, 22, 0, TAU);
      c.stroke();
    }
    bar(x, y + 27, 26, hr.hp / hr.max, hr.hp < hr.max * 0.35 ? '#ff4f6d' : '#6dffb0');
    bar(x, y + 31.5, 26, hr.en / 100, '#ffe14f');
    if (hr.cast > 0 && hr.castName) {
      c.globalAlpha = Math.min(1, hr.cast * 2);
      c.font = '600 11px "Chakra Petch", system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillStyle = CLASSES5[hr.cls].col;
      c.fillText(hr.castName, Math.max(46, x), y - 30 - (1.2 - hr.cast) * 10);
      c.globalAlpha = 1;
    }
  }
  // Gegner
  for (const e of run.en) {
    if (e.hp <= 0) continue;
    const x = X(e.x),
      y = Y(e.lane) - (e.boss ? 6 : 0);
    if (x > w + 60) continue;
    const sp = enemySprite5(e.type);
    c.drawImage(sp, x - sp.half, y - sp.half, sp.half * 2, sp.half * 2);
    if (e.flash > 0) {
      c.globalAlpha = 0.45;
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(x, y, e.r * 0.8, 0, TAU);
      c.fill();
      c.globalAlpha = 1;
    }
    if (e.stun > 0) {
      c.strokeStyle = '#ffe14f';
      c.lineWidth = 1.5;
      c.beginPath();
      c.arc(x, y, e.r + 5, run.t * 6, run.t * 6 + 4);
      c.stroke();
    }
    if (e.hp < e.max || e.boss) bar(x, y + e.r + 8, e.boss ? 70 : 24, e.hp / e.max, e.boss ? '#ff4fd8' : '#ff8a3d');
  }
  // Wirkungen: Treffer-Linien, Ringe, Zahlen
  for (const f of run.fx) {
    const k = f.t / f.m;
    if (f.k === 'bolt') {
      c.globalAlpha = 1 - k;
      c.strokeStyle = f.col;
      c.lineWidth = f.w;
      c.beginPath();
      c.moveTo(X(f.x1), Y(f.l1));
      c.lineTo(X(f.x2), Y(f.l2));
      c.stroke();
    } else if (f.k === 'ring') {
      c.globalAlpha = (1 - k) * 0.8;
      c.strokeStyle = f.col;
      c.lineWidth = 3;
      c.beginPath();
      c.arc(X(f.x), y0, f.r * sc * (0.25 + 0.75 * k), 0, TAU);
      c.stroke();
    } else {
      c.globalAlpha = 1 - k * k;
      c.font = '600 12px "Chakra Petch", system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillStyle = f.col;
      c.fillText(f.text, Math.min(w - 40, Math.max(40, X(f.x))), Y(f.lane) - 26 - k * 22);
    }
  }
  c.globalAlpha = 1;
}
