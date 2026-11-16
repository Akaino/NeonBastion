import { STAGE } from '../core/version.js';
import { loadGear5 } from './gear.js';
import {
  CLASSES5,
  CLASS_IDS5,
  CRYSTALS5,
  DUST_P5,
  ESS_P5,
  HEROES5,
  HERO_IDS5,
  IDLE_WPM5,
  KRYON_P5,
  LVL_MAX5,
  RARITY5,
  RARITY_IDS5,
  START_HERO5,
  START_KRYON5,
  TEAM_CELLS5,
  TEAM_MAX5,
  TEAM_SIZE5,
  breakCost5,
  lvlCost5,
  rankCost5,
  rowOf5,
  teamKey5,
  waveLoot5,
  zone5,
  zoneOf5,
} from './data.js';

/* ================= WELT 5: Spielstand und alles, was ihn verändert (ohne Oberfläche) =================
   Liegt in save.w5. heroes[id] = { l: Stufe, r: Rang, s: Kerne } – nur gefundene Helden haben einen Eintrag.
   team = 3×3-Raster (Feld i: Reihe floor(i/3), 0 = vorn; Spur i % 3), je Helden-Kennung oder null, höchstens fünf Helden.
   pos = Stufe, auf der die Gruppe gerade läuft · hold = diese Welle wiederholen · block = Boss-Stufe, an der die Gruppe gescheitert ist
   (bis „Boss herausfordern“ läuft die Welle davor) · cleared = höchste gewonnene Stufe · last = Zeitpunkt der letzten Abrechnung (ms). */
export function freshW5() {
  return {
    cur: { l: 0, k: START_KRYON5, d: 0, x: 0 },
    ess: Object.fromEntries(CLASS_IDS5.map(c => [c, 0])),
    heroes: { [START_HERO5]: { l: 1, r: 0, s: 0 } },
    team: [null, START_HERO5, null, null, null, null, null, null, null], // 3×3-Raster, der Startheld steht vorn in der Mitte
    pos: 1,
    hold: false,
    block: 0,
    cleared: 0,
    last: 0,
    pulls: 0,
    frac: {}, // Bruchteile aus dem Abwesenheitsertrag, damit nichts verloren geht
    inv: [], // Inventar: Ausrüstung, die niemand trägt
    gear: {}, // gear[Held][Platz] = angelegter Gegenstand
    uid: 1, // nächste Nummer für einen Gegenstand
    // Recyceln: q = angehakte Güten für den Knopf im Inventar, auto = Güten, die schon beim Aufheben recycelt werden,
    // sets = auch Set-Teile (gilt für beides)
    recy: { q: [false, false, false, false], auto: [false, false, false, false], sets: false },
    sort: 'up', // Sortierung der Heldenübersicht: up, name, rar, cls
  };
}
// Spielstand aus der Datei übernehmen; fehlende Felder bekommen ihren Startwert
export function loadW5(s) {
  const f = freshW5();
  if (!s) return f;
  const o = Object.assign(f, s);
  o.cur = Object.assign(freshW5().cur, s.cur || {});
  o.ess = Object.assign(freshW5().ess, s.ess || {});
  o.heroes = {};
  for (const id in s.heroes || {}) if (HEROES5[id]) o.heroes[id] = Object.assign({ l: 1, r: 0, s: 0 }, s.heroes[id]);
  if (!Object.keys(o.heroes).length) o.heroes[START_HERO5] = { l: 1, r: 0, s: 0 };
  // Aufstellung: bis 0.38.3 fünf Plätze hintereinander, seitdem ein 3×3-Raster. Alte Plätze 1 und 2 kommen nach vorn,
  // 3 und 4 in die Mitte, 5 nach hinten. Unbekannte und doppelte Einträge fallen weg, mehr als fünf Helden auch.
  const old = Array.isArray(s.team) ? s.team : [],
    map = old.length === 5 ? [1, 0, 4, 3, 7] : null,
    seen = new Set();
  o.team = Array(TEAM_CELLS5).fill(null);
  old.forEach((id, i) => {
    const cell = map ? map[i] : i;
    if (!id || !o.heroes[id] || seen.has(id) || cell >= TEAM_CELLS5 || seen.size >= TEAM_SIZE5) return;
    seen.add(id);
    o.team[cell] = id;
  });
  if (!o.team.some(Boolean)) o.team[1] = Object.keys(o.heroes)[0];
  o.frac = Object.assign({}, s.frac || {});
  loadGear5(o, s);
  const R = s.recy || {},
    four = a => [0, 1, 2, 3].map(i => !!(Array.isArray(a) && a[i]));
  o.recy = { q: four(R.q), auto: four(R.auto), sets: !!R.sets };
  o.sort = ['up', 'name', 'rar', 'cls'].includes(s.sort) ? s.sort : 'up';
  return o;
}
// Der Prototyp ist vorerst nur in Beta und Bottest betretbar
export const w5Open = () => !!STAGE;

/* ---------- Helden aufwerten ---------- */
// Kosten der nächsten Stufe: { l: Lumen, ess: Material der Klasse } oder null am Höchstwert
export function levelCost5(w5, id) {
  const st = w5.heroes[id];
  if (!st || st.l >= LVL_MAX5) return null;
  return { l: lvlCost5(st.l), ess: breakCost5(st.l) };
}
export function canLevel5(w5, id) {
  const c = levelCost5(w5, id);
  return !!c && w5.cur.l >= c.l && w5.ess[HEROES5[id].cls] >= c.ess;
}
export function levelUp5(w5, id) {
  if (!canLevel5(w5, id)) return false;
  const c = levelCost5(w5, id);
  w5.cur.l -= c.l;
  w5.ess[HEROES5[id].cls] -= c.ess;
  w5.heroes[id].l++;
  return true;
}
// Rang: braucht Kerne des Helden; fehlende Kerne lassen sich mit Synchron-Staub ersetzen.
// Liefert { need, have, dust } (dust = Staub, der für die fehlenden Kerne nötig wäre) oder null am Höchstrang.
export function rankNeed5(w5, id) {
  const st = w5.heroes[id],
    R = RARITY5[HEROES5[id].rar];
  if (!st || st.r >= R.maxRank) return null;
  const need = rankCost5(st.r);
  return { need, have: st.s, dust: Math.max(0, need - st.s) * R.sync };
}
export function canRank5(w5, id) {
  const n = rankNeed5(w5, id);
  return !!n && w5.cur.d >= n.dust;
}
export function rankUp5(w5, id) {
  if (!canRank5(w5, id)) return false;
  const n = rankNeed5(w5, id),
    st = w5.heroes[id];
  w5.cur.d -= n.dust;
  st.s = Math.max(0, st.s - n.need);
  st.r++;
  return true;
}
// Synchronisieren: Kerne eines Basishelden werden zu Synchron-Staub (Vorgabe des Nutzers). Liefert den gewonnenen Staub.
export function sync5(w5, id, n) {
  const st = w5.heroes[id],
    R = RARITY5[HEROES5[id].rar];
  if (!st || HEROES5[id].rar !== 'basis') return 0;
  const k = Math.min(st.s, n == null ? st.s : n);
  st.s -= k;
  w5.cur.d += k * R.sync;
  return k * R.sync;
}

/* ---------- Kristalle ---------- */
// Öffnet einen Kristall: zieht erst die Seltenheit, dann gleich verteilt einen Helden daraus. Ein schon vorhandener Held wird
// automatisch zu einem Kern für seinen Rang. Liefert { id, rar, neu } oder null, wenn das Kryon nicht reicht.
export function pull5(w5, cid, rnd = Math.random) {
  const C = CRYSTALS5[cid];
  if (!C || w5.cur.k < C.cost) return null;
  w5.cur.k -= C.cost;
  w5.pulls++;
  let x = rnd() * 100,
    rar = RARITY_IDS5[0];
  for (let i = 0; i < RARITY_IDS5.length; i++) {
    if (x < C.p[i]) {
      rar = RARITY_IDS5[i];
      break;
    }
    x -= C.p[i];
  }
  const pool = HERO_IDS5.filter(id => HEROES5[id].rar === rar),
    id = pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))],
    neu = !w5.heroes[id];
  if (neu) w5.heroes[id] = { l: 1, r: 0, s: 0 };
  else w5.heroes[id].s++;
  return { id, rar, neu };
}

/* ---------- Aufstellung ---------- */
// Warum ein Held nicht auf einen Platz darf: '' (darf), sonst der Grund als Text
export function slotBlock5(w5, slot, id) {
  if (!w5.heroes[id]) return 'Noch nicht gefunden';
  // ein neuer Held auf ein leeres Feld: nur, solange weniger als fünf im Raster stehen
  if (!w5.team[slot] && !w5.team.includes(id) && w5.team.filter(Boolean).length >= TEAM_SIZE5)
    return 'Die Gruppe ist voll (fünf Helden)';
  const key = teamKey5(HEROES5[id].rar),
    n = w5.team.filter((t, i) => t && i !== slot && t !== id && teamKey5(HEROES5[t].rar) === key).length;
  if (n >= TEAM_MAX5[key])
    return key === 'champ'
      ? 'Nur ein Champion in der Gruppe'
      : key === 'legend'
        ? 'Höchstens zwei Legendäre in der Gruppe'
        : 'Die Gruppe ist voll';
  return '';
}
// Held auf einen Platz setzen (null leert ihn). Stand er schon woanders, tauschen die beiden Plätze. Der letzte Held bleibt.
export function setSlot5(w5, slot, id) {
  if (id == null) {
    if (w5.team.filter(Boolean).length <= 1 && w5.team[slot]) return false;
    w5.team[slot] = null;
    return true;
  }
  if (slotBlock5(w5, slot, id)) return false;
  const from = w5.team.indexOf(id);
  if (from >= 0) w5.team[from] = w5.team[slot];
  w5.team[slot] = id;
  return true;
}

// Steht der Held auf diesem Feld zu weit hinten, um im Nahkampf zu treffen? Nahkämpfer erreichen Gegner aus der vordersten
// besetzten Reihe und der direkt dahinter; noch weiter hinten greifen sie erst ein, wenn die Reihen vor ihnen gefallen sind.
export function tooFar5(w5, slot) {
  const id = w5.team[slot];
  if (!id || !CLASSES5[HEROES5[id].cls].melee) return false;
  return rowOf5(slot) - rowOf5(w5.team.findIndex(Boolean)) >= 2;
}
// Zwei Plätze tauschen (auch mit einem leeren Platz). Die Gruppe bleibt dieselbe, deshalb gibt es hier nichts zu prüfen.
export function swapSlots5(w5, a, b) {
  if (a === b || !(w5.team[a] || w5.team[b])) return false;
  const t = w5.team[a];
  w5.team[a] = w5.team[b];
  w5.team[b] = t;
  return true;
}

/* ---------- Abwesenheit ---------- */
// Ertrag je Minute Abwesenheit auf der Stufe, auf der die Gruppe geparkt ist (höchstens die höchste gewonnene)
export function idleRate5(w5) {
  const s = Math.min(w5.pos, w5.cleared);
  if (s < 1) return null;
  return {
    s,
    l: waveLoot5(s) * IDLE_WPM5,
    k: KRYON_P5 * IDLE_WPM5,
    d: DUST_P5 * IDLE_WPM5,
    ess: ESS_P5 * IDLE_WPM5,
    cls: zone5(zoneOf5(s)).ess,
  };
}
// Rechnet die Zeit seit der letzten Abrechnung ab (kein Deckel, Vorgabe des Nutzers) und liefert, was dazukam – oder null.
export function claimIdle5(w5, now) {
  const last = w5.last;
  w5.last = now;
  if (!last || now - last < 60000) return null;
  const R = idleRate5(w5);
  if (!R) return null;
  const min = (now - last) / 60000,
    F = w5.frac,
    take = (key, v) => {
      const x = (F[key] || 0) + v,
        n = Math.floor(x);
      F[key] = x - n;
      return n;
    };
  const out = {
    min,
    s: R.s,
    l: take('l', R.l * min),
    k: take('k', R.k * min),
    d: take('d', R.d * min),
    ess: take('e:' + R.cls, R.ess * min),
    cls: R.cls,
  };
  w5.cur.l += out.l;
  w5.cur.k += out.k;
  w5.cur.d += out.d;
  w5.ess[R.cls] += out.ess;
  return out;
}
