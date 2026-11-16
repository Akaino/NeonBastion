import { CLASSES5, ENEMIES5, HEROES5, RARITY5, RARITY_IDS5 } from '../world5/data.js';

/* ================= WELT 5: Zeichnung =================
   Helden sind Figuren mit Kopf, Rumpf, Armen und Beinen (Wunsch des Nutzers: „wie eine Person, mit animierten Bewegungen“).
   Die Klasse gibt Statur und Ausrüstung (Schild, Klinge, Stab, Heilkugel, Standarte), Farbton und Variante (HEROES5[id].hue, .v)
   unterscheiden jeden Helden (Kopfschmuck, Umhang), Punkte unter den Füßen zeigen die Seltenheit, Champions tragen einen
   dezenten Lichtkranz. Im Lauf wird jede Figur je Bild neu gezeichnet (Schritt, Angriff, Fähigkeit, gefallen) – ohne Leuchtfilter,
   das Leuchten entsteht durch einen breiten, durchscheinenden Strich unter dem scharfen. Für Menüs gibt es ein stehendes Bildchen.
   Gegner bleiben einfache Formen und werden einmal vorgezeichnet. */
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
// Umriss mit Leuchtfilter – nur für vorgezeichnete Bildchen
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

/* ---------- Heldenfigur ----------
   Gezeichnet um die Füße (0, 0), Blick nach rechts, etwa 48 Einheiten hoch. a = Haltung:
   ph = Schrittphase (null = steht) · atk = Angriffsbewegung 0…1 · cast = Fähigkeit 0…1 · t = Zeit (Atmen, Flattern) · dead = gefallen */
const DARK = 'rgba(6,8,34,.9)';
function glow(c, col, w, fill) {
  // aktueller Pfad: breiter durchscheinender Strich, dann scharfer Strich
  const al = c.globalAlpha;
  if (fill) {
    c.fillStyle = fill;
    c.fill();
  }
  c.strokeStyle = col;
  c.globalAlpha = al * 0.28;
  c.lineWidth = w + 4;
  c.stroke();
  c.globalAlpha = al;
  c.lineWidth = w;
  c.stroke();
}
const line = (c, pts) => {
  c.beginPath();
  pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
};
export function drawHero5(c, id, x, y, k, a) {
  const H = HEROES5[id],
    cls = H.cls,
    v = H.v,
    col = `hsl(${H.hue} 100% 66%)`,
    col2 = `hsl(${(H.hue + 40) % 360} 100% 74%)`,
    t = a.t || 0,
    walk = a.ph != null,
    atk = a.atk || 0,
    cast = a.cast || 0,
    sw = walk ? Math.sin(a.ph) : 0, // Schwung der Glieder
    bob = walk ? Math.abs(Math.cos(a.ph)) * 1.4 : Math.sin(t * 2.2 + H.hue) * 0.6,
    robe = cls === 'mage' || cls === 'healer',
    wide = cls === 'tank' ? 7.5 : cls === 'striker' ? 5.5 : 5;
  c.save();
  c.translate(x, y);
  c.scale(k, k);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  if (a.dead) {
    c.globalAlpha *= 0.3;
    c.translate(-4, -3);
    c.rotate(-Math.PI / 2 + 0.12);
  } else {
    // Seltenheit als Punkte unter den Füßen
    const n = RARITY_IDS5.indexOf(H.rar) + 1;
    c.fillStyle = RARITY5[H.rar].col;
    for (let i = 0; i < n; i++) {
      c.beginPath();
      c.arc((i - (n - 1) / 2) * 5, 5, 1.6, 0, TAU);
      c.fill();
    }
  }
  const lean = atk * 0.22 + (walk ? 0.07 : 0);
  c.translate(0, -bob);
  // Umhang (Legendäre und Champions) hinter der Figur
  if (H.rar === 'legend' || H.rar === 'champ') {
    const fl = Math.sin(t * 5 + H.hue) * 2 + (walk ? 4 : 0);
    line(c, [
      [-3, -34],
      [-11 - fl, -22],
      [-10 - fl * 1.4, -7],
      [-4, -18],
    ]);
    c.closePath();
    glow(c, col2, 1.3, `hsl(${(H.hue + 40) % 360} 80% 40% / .35)`);
  }
  // Standarte des Unterstützers auf dem Rücken
  if (cls === 'support') {
    const fl = Math.sin(t * 6 + v) * 1.5;
    line(c, [
      [-4, -20],
      [-7, -54],
    ]);
    glow(c, col2, 1.5);
    line(c, [
      [-7, -54],
      [-17 - fl, -50 + fl * 0.4],
      [-7, -45],
    ]);
    c.closePath();
    glow(c, col2, 1.3, `hsl(${(H.hue + 40) % 360} 100% 60% / .45)`);
  }
  // Beine oder Robe
  const hipY = -19;
  if (robe) {
    line(c, [
      [-4.5, hipY - 2],
      [4.5, hipY - 2],
      [8 + sw * 1.5, -3],
      [-8 + sw * 1.5, -3],
    ]);
    c.closePath();
    glow(c, col, 1.8, DARK);
    line(c, [
      [-3 + sw * 3, -3],
      [-3 + sw * 3, 0],
    ]);
    glow(c, col, 1.8);
    line(c, [
      [3 - sw * 3, -3],
      [3 - sw * 3, 0],
    ]);
    glow(c, col, 1.8);
  } else
    for (const s of [-1, 1]) {
      const ang = sw * 0.6 * s,
        bend = Math.max(0, -sw * s) * 0.7,
        kx = Math.sin(ang) * 9.5,
        ky = hipY + Math.cos(ang) * 9.5,
        fx = kx + Math.sin(ang - bend) * 9.5,
        fy = Math.min(0, ky + Math.cos(ang - bend) * 9.5);
      line(c, [
        [s * 1.5, hipY],
        [kx + s * 1.5, ky],
        [fx + s * 1.5, fy],
        [fx + s * 1.5 + 3, fy],
      ]);
      glow(c, s < 0 ? col2 : col, cls === 'tank' ? 2.6 : 2.1);
    }
  // Rumpf (nach vorn geneigt beim Laufen und Angreifen)
  c.translate(0, hipY);
  c.rotate(lean);
  const shY = -15;
  // hinterer Arm
  const ba = -sw * 0.7 - 0.15,
    ex = -wide * 0.6 + Math.sin(ba) * 6,
    ey = shY + 1 + Math.cos(ba) * 6;
  line(c, [
    [-wide * 0.6, shY + 1],
    [ex, ey],
    [ex + Math.sin(ba + 0.6) * 5.5, ey + Math.cos(ba + 0.6) * 5.5],
  ]);
  glow(c, col2, 1.9);
  // Rumpf
  line(c, [
    [-wide, shY],
    [wide, shY],
    [wide * 0.62, 1],
    [-wide * 0.62, 1],
  ]);
  c.closePath();
  glow(c, col, 2, DARK);
  if (cls === 'healer') {
    line(c, [
      [0, shY + 4],
      [0, shY + 11],
    ]);
    glow(c, col2, 1.6);
    line(c, [
      [-3.5, shY + 7.5],
      [3.5, shY + 7.5],
    ]);
    glow(c, col2, 1.6);
  } else if (cls === 'tank') {
    line(c, [
      [-wide * 0.8, shY + 5],
      [wide * 0.8, shY + 5],
    ]);
    glow(c, col2, 1.4);
  } else if (v % 2) {
    line(c, [
      [-wide * 0.7, shY + 3],
      [wide * 0.5, shY + 10],
    ]);
    glow(c, col2, 1.3);
  }
  // Kopf
  const hy = shY - 7;
  c.beginPath();
  c.arc(0.5, hy, cls === 'tank' ? 5.6 : 5.1, 0, TAU);
  glow(c, col, 2, DARK);
  line(c, [
    [1.5, hy - 0.5],
    [5, hy - 0.5],
  ]);
  glow(c, '#fff', 1.2);
  // Kopfschmuck je Klasse und Variante
  if (cls === 'mage') {
    line(c, [
      [-5, hy - 2],
      [1, hy - 14 - (v % 3) * 2],
      [6, hy - 2.5],
    ]);
    glow(c, col2, 1.6, `hsl(${(H.hue + 40) % 360} 80% 35% / .5)`);
  } else if (cls === 'healer') {
    c.beginPath();
    c.ellipse(0.5, hy - 8.5, 5.5, 1.8, 0, 0, TAU);
    glow(c, col2, 1.3);
  }
  if (v === 1 || v === 3) {
    line(c, [
      [-3, hy - 5],
      [-6 - v, hy - 10],
      [1, hy - 6],
    ]);
    glow(c, col2, 1.5);
  }
  if (v === 2 || v === 5) {
    line(c, [
      [-3.5, hy - 4],
      [-6, hy - 10],
    ]);
    glow(c, col2, 1.5);
    line(c, [
      [4, hy - 4],
      [6.5, hy - 10],
    ]);
    glow(c, col2, 1.5);
  }
  if (v === 4 && cls !== 'healer') {
    line(c, [
      [-4, hy - 6],
      [-3, hy - 10],
      [-0.5, hy - 7.5],
      [1, hy - 11],
      [2.5, hy - 7.5],
      [5, hy - 10],
      [5.5, hy - 6],
    ]);
    glow(c, '#ffe14f', 1.3);
  }
  if (v === 5) {
    line(c, [
      [-5, hy + 1],
      [-9, hy + 4],
    ]);
    glow(c, col2, 1.4);
  }
  // vorderer Arm mit Ausrüstung
  const sx = wide * 0.55,
    sy = shY + 1.5;
  if (cls === 'striker') {
    const th = -1.25 + atk * 1.9 + (walk ? sw * 0.25 : 0), // Schlag von oben nach vorn unten
      hx = sx + Math.cos(th) * 9,
      hy2 = sy + Math.sin(th) * 9,
      bl = 15 + (v % 3) * 2;
    line(c, [
      [sx, sy],
      [hx, hy2],
    ]);
    glow(c, col, 2);
    line(c, [
      [hx, hy2],
      [hx + Math.cos(th - 0.15) * bl, hy2 + Math.sin(th - 0.15) * bl],
    ]);
    glow(c, '#fff', 1.6);
    line(c, [
      [hx + Math.cos(th + 1.4) * 3, hy2 + Math.sin(th + 1.4) * 3],
      [hx + Math.cos(th - 1.7) * 3, hy2 + Math.sin(th - 1.7) * 3],
    ]);
    glow(c, col2, 1.6);
  } else if (cls === 'tank') {
    const px = 9 + atk * 6;
    line(c, [
      [sx, sy],
      [px - 2, sy + 5],
    ]);
    glow(c, col, 2.2);
    line(c, [
      [px - 4, sy - 6],
      [px + 4, sy - 4],
      [px + 5, sy + 7],
      [px, sy + 13],
      [px - 4, sy + 8],
    ]);
    c.closePath();
    glow(c, col2, 1.9, cast > 0 ? `hsl(${H.hue} 100% 70% / .5)` : DARK);
    line(c, [
      [px - 1, sy],
      [px + 2.5, sy + 4],
      [px - 1, sy + 8],
    ]);
    glow(c, col, 1.2);
  } else if (cls === 'mage') {
    const px = 9 + atk * 2,
      top = sy - 22;
    line(c, [
      [sx, sy],
      [px, sy + 4],
    ]);
    glow(c, col, 1.9);
    line(c, [
      [px, 2],
      [px, top],
    ]);
    glow(c, col2, 1.7);
    c.beginPath();
    c.arc(px, top - 3, 3 + atk * 2.5 + cast * 3, 0, TAU);
    glow(c, col2, 1.4, atk > 0 || cast > 0 ? '#fff' : `hsl(${(H.hue + 40) % 360} 100% 70% / .7)`);
  } else if (cls === 'healer') {
    const up = atk * 5 + cast * 7,
      px = 9,
      py = sy - 2 - up;
    line(c, [
      [sx, sy],
      [px - 1, py + 2],
    ]);
    glow(c, col, 1.9);
    c.beginPath();
    c.arc(px + 1, py - 2, 2.8 + atk * 1.5 + cast * 2.5, 0, TAU);
    glow(c, '#6dffb0', 1.4, atk > 0 || cast > 0 ? '#fff' : 'rgba(109,255,176,.6)');
  } else {
    const th = -0.3 - atk * 0.9 - cast * 1.1,
      hx = sx + Math.cos(th) * 9,
      hy2 = sy + Math.sin(th) * 9;
    line(c, [
      [sx, sy],
      [hx, hy2],
    ]);
    glow(c, col, 1.9);
    line(c, [
      [hx, hy2],
      [hx + Math.cos(th - 0.5) * 7, hy2 + Math.sin(th - 0.5) * 7],
    ]);
    glow(c, col2, 2.2);
  }
  c.restore();
}
// Stehendes Bildchen eines Helden für Menüs; r bestimmt die Größe
export function heroSprite5(id, r = 20) {
  const H = HEROES5[id];
  return sprite('h' + id + r, r * 1.9 + 10, c => {
    const half = r * 1.9 + 10,
      k = half / 36;
    if (H.rar === 'champ') {
      const g = c.createRadialGradient(0, 0, half * 0.25, 0, 0, half * 0.95);
      g.addColorStop(0, `hsl(${H.hue} 100% 70% / .32)`);
      g.addColorStop(1, `hsl(${H.hue} 100% 70% / 0)`);
      c.fillStyle = g;
      c.beginPath();
      c.arc(0, 0, half * 0.95, 0, TAU);
      c.fill();
    }
    c.shadowColor = `hsl(${H.hue} 100% 66%)`;
    c.shadowBlur = 7;
    drawHero5(c, id, -2 * k, half * 0.66, k, { ph: null, t: 0 });
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
// Lichtkranz eines Champions im Lauf, einmal vorgezeichnet
const aura = hue =>
  sprite('a' + hue, 40, c => {
    const g = c.createRadialGradient(0, 0, 6, 0, 0, 40);
    g.addColorStop(0, `hsl(${hue} 100% 70% / .28)`);
    g.addColorStop(1, `hsl(${hue} 100% 70% / 0)`);
    c.fillStyle = g;
    c.beginPath();
    c.arc(0, 0, 40, 0, TAU);
    c.fill();
  });
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
    yb = h * 0.66, // Horizont; darunter liegt der Boden, auf dem alle stehen
    X = x => ox + x * sc,
    FEET = lane => yb + 22 + lane * 8, // Standhöhe je Reihe
    Y = lane => FEET(lane) - 20; // Brusthöhe, für Treffer-Linien und Zahlen
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
    c.fillRect(x - 20, ((i * 53.7) % (yb - 30)) + 6, 1.6, 1.6);
  }
  // ferne Türme
  c.strokeStyle = `hsl(${hue} 90% 60% / .22)`;
  c.lineWidth = 1.5;
  for (let i = 0; i < 9; i++) {
    const px = ((i * 131 - run.dist * 0.25) % (w + 160)) - 80,
      x = px < -80 ? px + w + 160 : px,
      hh = 22 + ((i * 37) % 46);
    c.strokeRect(x, yb - hh, 16 + ((i * 7) % 14), hh);
  }
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
    c.fillRect(X(-2.5 * 56), yb - 44, 3.2 * 56 * sc, 96);
  }
  const bar = (x, y, bw, f, col) => {
    c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillRect(x - bw / 2, y, bw, 3);
    c.fillStyle = col;
    c.fillRect(x - bw / 2, y, bw * Math.max(0, Math.min(1, f)), 3);
  };
  // Helden im 3×3-Raster: drei Reihen hintereinander, je drei Spuren in die Tiefe. Die obere Spur steht weiter hinten im Bild
  // und wird zuerst gezeichnet; jede Spur ist ein Stück versetzt, damit sich Figuren einer Reihe nicht verdecken.
  const order = run.heroes.slice().sort((a, b) => a.lane - b.lane || b.row - a.row);
  for (const hr of order) {
    const lane = hr.lane * 1.9,
      x = X(hr.x) - hr.lane * 11,
      y = FEET(lane),
      H = HEROES5[hr.id];
    if (H.rar === 'champ' && !hr.dead) c.drawImage(aura(H.hue), x - 34, y - 56, 68, 68);
    if (hr.out && !hr.dead) c.globalAlpha = 0.5;
    drawHero5(c, hr.id, x, y, 1, {
      ph: run.moving && !hr.dead ? run.t * 11 + hr.slot * 1.3 : null,
      atk: hr.at > 0 ? Math.sin((1 - hr.at / 0.28) * Math.PI) : 0,
      cast: hr.cast > 0 ? Math.min(1, hr.cast / 0.6) : 0,
      t: run.t,
      dead: hr.dead,
    });
    c.globalAlpha = 1;
    if (hr.dead) continue;
    if (hr.flash > 0) {
      c.globalAlpha = 0.45;
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(x, y - 22, 13, 0, TAU);
      c.fill();
      c.globalAlpha = 1;
    }
    if (hr.sh > 0) {
      c.strokeStyle = 'rgba(159,216,255,.9)';
      c.lineWidth = 2;
      c.beginPath();
      c.ellipse(x, y - 22, 17, 27, 0, 0, TAU);
      c.stroke();
    }
    bar(x, y - 62, 26, hr.hp / hr.max, hr.hp < hr.max * 0.35 ? '#ff4f6d' : '#6dffb0');
    bar(x, y - 58, 26, hr.en / 100, '#ffe14f');
    if (hr.out) {
      // Nahkämpfer außer Reichweite: durchgestrichene Klinge und Hinweis
      c.strokeStyle = '#ff4f6d';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(x, y - 74, 6, 0, TAU);
      c.moveTo(x - 4.2, y - 78.2);
      c.lineTo(x + 4.2, y - 69.8);
      c.stroke();
      c.font = '600 9px "Chakra Petch", system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillStyle = '#ff8fa3';
      c.fillText('zu weit hinten', Math.max(34, x), y - 84);
    }
    if (hr.cast > 0 && hr.castName) {
      c.globalAlpha = Math.min(1, hr.cast * 2);
      c.font = '600 11px "Chakra Petch", system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillStyle = CLASSES5[hr.cls].col;
      c.fillText(hr.castName, Math.max(46, x), y - 68 - (1.2 - hr.cast) * 10);
      c.globalAlpha = 1;
    }
  }
  // Gegner: wippen im Anmarsch, stoßen beim Angriff vor
  let i = 0;
  for (const e of run.en) {
    i++;
    if (e.hp <= 0) continue;
    const lunge = e.at > 0 ? Math.sin((1 - e.at / 0.28) * Math.PI) * 9 : 0,
      x = X(e.x) - lunge,
      y = FEET(e.lane) - e.r - 2 + Math.sin(run.t * 7 + i) * 1.6;
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
    if (e.hp < e.max || e.boss) bar(x, y - e.r - 9, e.boss ? 70 : 24, e.hp / e.max, e.boss ? '#ff4fd8' : '#ff8a3d');
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
      c.arc(X(f.x), Y(0), f.r * sc * (0.25 + 0.75 * k), 0, TAU);
      c.stroke();
    } else {
      c.globalAlpha = 1 - k * k;
      c.font = '600 12px "Chakra Petch", system-ui, sans-serif';
      c.textAlign = 'center';
      c.fillStyle = f.col;
      c.fillText(f.text, Math.min(w - 40, Math.max(40, X(f.x))), Y(f.lane) - 30 - k * 22);
    }
  }
  c.globalAlpha = 1;
}
