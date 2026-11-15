/* ================= WELT 5: Ausrüstung (seit 0.40.0) =================
   Vorgabe des Nutzers: Jeder Held trägt Hose, Brustpanzer, Waffe, Schild, Schuhe, Helm, zwei Ringe und eine Halskette. Besiegte
   Gegner hinterlassen Ausrüstung, alles landet im Inventar. Was man nicht braucht, wird zu Schrott recycelt; für Schrott gibt es
   Ausrüstungsboxen mit zufälligem Inhalt. Sets aus 3, 4 oder 5 Teilen geben Boni schon ab einer Teilmenge.
   Ein Gegenstand ist { id, t: Art, q: Güte 0–3, s: Stufe (die Welle, in der er fiel), set: Kennung oder null }.
   Diese Datei kennt weder Helden noch Oberfläche; sie rechnet nur mit Gegenständen und dem Spielstand save.w5
   (inv = Inventar, gear[Held][Platz] = angelegter Gegenstand, uid = nächste Nummer, cur.x = Schrott).
   Alle Zahlen sind ein erster Wurf. */

// Die neun Plätze eines Helden und die acht Arten (zwei Plätze nehmen einen Ring)
export const GEAR_SLOTS5 = ['helm', 'brust', 'hose', 'schuhe', 'waffe', 'schild', 'ring1', 'ring2', 'kette'];
export const slotType5 = slot => (slot === 'ring1' || slot === 'ring2' ? 'ring' : slot);
export const SLOT_NAMES5 = {
  helm: 'Helm',
  brust: 'Brustpanzer',
  hose: 'Hose',
  schuhe: 'Schuhe',
  waffe: 'Waffe',
  schild: 'Schild',
  ring1: 'Ring 1',
  ring2: 'Ring 2',
  kette: 'Halskette',
};
// stat: hp/atk/haste/dr in Prozent, en als Energie je Sekunde · v = Grundwert bei gewöhnlicher Güte und Stufe 0
export const GEAR_TYPES5 = {
  helm: { name: 'Helm', stat: 'hp', v: 3 },
  brust: { name: 'Brustpanzer', stat: 'hp', v: 6 },
  hose: { name: 'Hose', stat: 'hp', v: 4 },
  schuhe: { name: 'Schuhe', stat: 'haste', v: 2 },
  waffe: { name: 'Waffe', stat: 'atk', v: 6 },
  schild: { name: 'Schild', stat: 'dr', v: 2 },
  ring: { name: 'Ring', stat: 'atk', v: 3 },
  kette: { name: 'Halskette', stat: 'en', v: 0.4 },
};
export const GEAR_TYPE_IDS5 = Object.keys(GEAR_TYPES5);
export const STAT_NAMES5 = {
  hp: 'Leben',
  atk: 'Angriff',
  haste: 'Tempo',
  dr: 'weniger Schaden',
  en: 'Energie je Sekunde',
};
// Güte: Faktor auf den Wert, Farbe, Schrott beim Recyceln
export const GEAR_Q5 = [
  { name: 'Gewöhnlich', mul: 1, col: '#9fb4d8', scrap: 1 },
  { name: 'Selten', mul: 1.5, col: '#5ab8ff', scrap: 3 },
  { name: 'Episch', mul: 2.2, col: '#c79bff', scrap: 8 },
  { name: 'Legendär', mul: 3.2, col: '#ffb14f', scrap: 20 },
];
export const GEAR_LVL5 = 0.02, // Zuwachs je Stufe des Gegenstands
  DR_CAP5 = 0.5,
  HASTE_CAP5 = 0.5;

/* Sets. parts = Arten, die dazugehören (ein Ring zählt einmal). bonus = [[ab so vielen Teilen, { Wirkung }, Text], …];
   die Wirkungen addieren sich. Drei 3er-Sets (Glut, Takt, Wacht) füllen zusammen alle neun Plätze. */
export const SETS5 = {
  glut: {
    name: 'Glutklinge',
    col: '#ff6b84',
    parts: ['waffe', 'ring', 'kette'],
    bonus: [
      [2, { atk: 8 }, '+8 % Angriff'],
      [3, { atk: 12 }, 'weitere +12 % Angriff'],
    ],
  },
  takt: {
    name: 'Taktgeber',
    col: '#ffe14f',
    parts: ['helm', 'schuhe', 'ring'],
    bonus: [
      [2, { haste: 5 }, '+5 % Tempo'],
      [3, { haste: 7, en: 1 }, 'weitere +7 % Tempo und +1 Energie je Sekunde'],
    ],
  },
  wacht: {
    name: 'Wacht',
    col: '#5ab8ff',
    parts: ['schild', 'brust', 'hose'],
    bonus: [
      [2, { dr: 4 }, '4 % weniger Schaden'],
      [3, { dr: 6 }, 'weitere 6 % weniger Schaden'],
    ],
  },
  quell: {
    name: 'Lebensquell',
    col: '#6dffb0',
    parts: ['brust', 'hose', 'kette', 'ring'],
    bonus: [
      [2, { hp: 8 }, '+8 % Leben'],
      [3, { hp: 7 }, 'weitere +7 % Leben'],
      [4, { hp: 10, dr: 5 }, 'weitere +10 % Leben und 5 % weniger Schaden'],
    ],
  },
  bastion: {
    name: 'Bastion',
    col: '#c79bff',
    parts: ['helm', 'brust', 'hose', 'schild', 'schuhe'],
    bonus: [
      [3, { hp: 12 }, '+12 % Leben'],
      [4, { dr: 8 }, '8 % weniger Schaden'],
      [5, { hp: 18 }, 'weitere +18 % Leben'],
    ],
  },
};
export const SET_IDS5 = Object.keys(SETS5);

// Wert eines Gegenstands in der Einheit seiner Wirkung (Prozent bzw. Energie je Sekunde)
export const itemValue5 = it => GEAR_TYPES5[it.t].v * GEAR_Q5[it.q].mul * (1 + it.s * GEAR_LVL5);
export const itemName5 = it => GEAR_TYPES5[it.t].name + (it.set ? ' · ' + SETS5[it.set].name : '');
export function itemText5(it) {
  const T = GEAR_TYPES5[it.t],
    v = itemValue5(it);
  return T.stat === 'en'
    ? `+${v.toFixed(1).replace('.', ',')} ${STAT_NAMES5.en}`
    : T.stat === 'dr'
      ? `${v.toFixed(1).replace('.', ',')} % ${STAT_NAMES5.dr}`
      : `+${v.toFixed(1).replace('.', ',')} % ${STAT_NAMES5[T.stat]}`;
}
// Grobe Stärke zum Vergleichen und Sortieren, über alle Arten hinweg vergleichbar
export const itemScore5 = it => GEAR_Q5[it.q].mul * (1 + it.s * GEAR_LVL5) * (it.set ? 1.15 : 1);
export const scrapOf5 = it => Math.max(1, Math.round(GEAR_Q5[it.q].scrap * (1 + it.s / 20)));

// Wie viele Teile jedes Sets trägt jemand? (gear = { Platz: Gegenstand })
export function setCounts5(gear) {
  const n = {};
  for (const slot in gear || {}) {
    const it = gear[slot];
    if (it && it.set) n[it.set] = Math.min(SETS5[it.set].parts.length, (n[it.set] || 0) + 1);
  }
  return n;
}
/* Gesamtwirkung der angelegten Ausrüstung: { hp, atk, haste, dr als Anteile (0,12 = 12 %), en als Energie je Sekunde }.
   heroStats5 rechnet damit; ohne Ausrüstung ist alles 0. */
export function gearBonus5(gear) {
  const b = { hp: 0, atk: 0, haste: 0, dr: 0, en: 0 };
  if (!gear) return b;
  for (const slot in gear) {
    const it = gear[slot];
    if (it) b[GEAR_TYPES5[it.t].stat] += itemValue5(it);
  }
  const n = setCounts5(gear);
  for (const id in n) for (const [need, fx] of SETS5[id].bonus) if (n[id] >= need) for (const k in fx) b[k] += fx[k];
  return {
    hp: b.hp / 100,
    atk: b.atk / 100,
    haste: Math.min(HASTE_CAP5, b.haste / 100),
    dr: Math.min(DR_CAP5, b.dr / 100),
    en: b.en,
  };
}

/* ---------- Beute und Boxen ---------- */
export const DROP_P5 = 0.03, // Ausrüstung je besiegtem Gegner
  DROP_BOSS5 = 2, // so viele Teile lässt ein Boss sicher fallen
  DROP_W5 = [70, 22, 7, 1], // Güte bei gewöhnlicher Beute
  DROP_BOSS_W5 = [40, 35, 20, 5],
  SET_P5 = 0.25, // Anteil der Beute, der zu einem Set gehört
  BOX_COST5 = 30, // Schrott je Ausrüstungsbox
  BOX_W5 = [45, 35, 16, 4],
  BOX_SET_P5 = 0.4;
function pick(weights, rnd) {
  let x = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < weights.length; i++) {
    if (x < weights[i]) return i;
    x -= weights[i];
  }
  return weights.length - 1;
}
// Würfelt einen Gegenstand der Stufe s aus und legt ihn ins Inventar
export function rollItem5(w5, s, weights, setP, rnd = Math.random) {
  const t = GEAR_TYPE_IDS5[Math.min(GEAR_TYPE_IDS5.length - 1, Math.floor(rnd() * GEAR_TYPE_IDS5.length))],
    q = pick(weights, rnd),
    sets = SET_IDS5.filter(id => SETS5[id].parts.includes(t)),
    set = sets.length && rnd() < setP ? sets[Math.min(sets.length - 1, Math.floor(rnd() * sets.length))] : null,
    it = { id: w5.uid++, t, q, s: Math.max(1, s), set };
  w5.inv.push(it);
  return it;
}
// Beute eines besiegten Gegners: Liste der gefallenen Gegenstände (meist leer)
export function dropGear5(w5, stage, boss, rnd = Math.random) {
  const out = [];
  if (boss) for (let i = 0; i < DROP_BOSS5; i++) out.push(rollItem5(w5, stage, DROP_BOSS_W5, SET_P5 * 1.5, rnd));
  else if (rnd() < DROP_P5) out.push(rollItem5(w5, stage, DROP_W5, SET_P5, rnd));
  return out;
}
// Ausrüstungsbox: ein Gegenstand auf der Stufe der höchsten gewonnenen Welle, mit besseren Chancen als gewöhnliche Beute
export function buyBox5(w5, rnd = Math.random) {
  if (w5.cur.x < BOX_COST5) return null;
  w5.cur.x -= BOX_COST5;
  return rollItem5(w5, Math.max(1, w5.cleared), BOX_W5, BOX_SET_P5, rnd);
}

/* ---------- Anlegen, Ablegen, Recyceln ---------- */
const invIndex = (w5, uid) => w5.inv.findIndex(it => it.id === uid);
// Gegenstand aus dem Inventar auf einen Platz legen; was dort lag, kommt zurück ins Inventar
export function equip5(w5, hero, slot, uid) {
  const i = invIndex(w5, uid);
  if (i < 0 || !w5.heroes[hero] || !GEAR_SLOTS5.includes(slot) || w5.inv[i].t !== slotType5(slot)) return false;
  const g = w5.gear[hero] || (w5.gear[hero] = {}),
    old = g[slot];
  g[slot] = w5.inv.splice(i, 1)[0];
  if (old) w5.inv.push(old);
  return true;
}
export function unequip5(w5, hero, slot) {
  const g = w5.gear[hero];
  if (!g || !g[slot]) return false;
  w5.inv.push(g[slot]);
  delete g[slot];
  return true;
}
// Ein Teil aus dem Inventar zu Schrott machen; liefert den Schrott
export function recycle5(w5, uid) {
  const i = invIndex(w5, uid);
  if (i < 0) return 0;
  const n = scrapOf5(w5.inv.splice(i, 1)[0]);
  w5.cur.x += n;
  return n;
}
// Alles im Inventar bis zu dieser Güte recyceln (0 = nur Gewöhnliches). Set-Teile bleiben, außer withSets ist gesetzt.
export function recycleAll5(w5, maxQ, withSets) {
  let n = 0;
  for (const it of w5.inv.filter(x => x.q <= maxQ && (withSets || !x.set))) n += recycle5(w5, it.id);
  return n;
}
/* „Optimieren“ (Wunsch des Nutzers): legt aus dem Inventar das an, was für diese Gewichtung am meisten bringt.
   weights = { hp, atk, haste, dr, en } sagt, wie viel ein Prozentpunkt (bzw. ein Punkt Energie je Sekunde) dieser Wirkung wert ist;
   die Gewichtung je Klasse steht in data.js (GEAR_W5). Bewertet wird immer die ganze Ausstattung samt Set-Boni: Platz für Platz
   wird das Teil gesucht, mit dem die Gesamtwertung am höchsten ist, in mehreren Durchgängen, bis sich nichts mehr bessert.
   Teile, die andere Helden tragen, bleiben unberührt. Liefert die Zahl der getauschten Plätze. */
export function gearScore5(gear, weights) {
  const b = gearBonus5(gear);
  return (
    (b.hp * weights.hp + b.atk * weights.atk + b.haste * weights.haste + b.dr * weights.dr) * 100 + b.en * weights.en
  );
}
export function optimize5(w5, hero, weights) {
  if (!w5.heroes[hero]) return 0;
  const g = w5.gear[hero] || (w5.gear[hero] = {});
  let changed = 0;
  for (let pass = 0; pass < 3; pass++) {
    let any = false;
    for (const slot of GEAR_SLOTS5) {
      let best = null,
        bs = gearScore5(g, weights) + 1e-9;
      for (const it of w5.inv) {
        if (it.t !== slotType5(slot)) continue;
        const sc = gearScore5({ ...g, [slot]: it }, weights);
        if (sc > bs) {
          bs = sc;
          best = it;
        }
      }
      if (best && equip5(w5, hero, slot, best.id)) {
        changed++;
        any = true;
      }
    }
    if (!any) break;
  }
  return changed;
}

// Spielstand-Teile der Ausrüstung aus einer Datei übernehmen: nur gültige Gegenstände, fortlaufende Nummern
export function loadGear5(o, s) {
  const ok = it => it && GEAR_TYPES5[it.t] && GEAR_Q5[it.q] && (!it.set || SETS5[it.set]);
  let uid = 1;
  const fix = it => ({ id: uid++, t: it.t, q: it.q, s: Math.max(1, it.s | 0), set: it.set || null });
  o.inv = (Array.isArray(s.inv) ? s.inv : []).filter(ok).map(fix);
  o.gear = {};
  for (const h in s.gear || {}) {
    if (!o.heroes[h]) continue;
    for (const slot of GEAR_SLOTS5) {
      const it = s.gear[h][slot];
      if (ok(it) && it.t === slotType5(slot)) (o.gear[h] || (o.gear[h] = {}))[slot] = fix(it);
    }
  }
  o.uid = uid;
}
