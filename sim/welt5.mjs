/* global process, console */
// Neon Bastion – Probelauf für Welt 5 (Expedition, Prototyp). Ein einfacher Bot spielt aktiv: öffnet Kristalle, stellt die stärkste
// erlaubte Gruppe auf (Verteidiger und Angreifer vorn), kauft die billigste Stufe, erhöht Ränge, sammelt Material in der passenden
// Zone und fordert einen wartenden Boss alle zwei Minuten heraus. Kein Ersatz für eine richtige Simulation – nur ein Beleg, dass
// der Fortschritt nicht hängt, und ein erster Blick aufs Tempo.
// Aufruf: node sim/welt5.mjs [Minuten] [Seed] [ohne] [ohnelimit]   (ohne = ohne Ausrüstung, ohnelimit = ohne Zeitlimit je Welle)
import { fileURLToPath } from 'url';
import path from 'path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  MIN = +(process.argv[2] || 120),
  seed = +(process.argv[3] || 1);
let a = seed >>> 0;
Math.random = () => {
  a = (a + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const m = await import(root + '/src/js/world5/data.js'),
  S = await import(root + '/src/js/world5/save.js'),
  { Run5 } = await import(root + '/src/js/world5/Run5.js');
const G = await import(root + '/src/js/world5/gear.js'),
  GEAR = !process.argv.includes('ohne'); // „ohne“: Bot legt keine Ausrüstung an (zum Vergleich)
let boxes = 0;
const w5 = S.freshW5(),
  r = new Run5(w5, {});
r.headless = true;
r.noLimit = process.argv.includes('ohnelimit'); // „ohnelimit“: ohne die 60/90 Sekunden je Welle (zum Vergleich)
const pow = id => m.heroPower5(id, w5.heroes[id].l, w5.heroes[id].r);
function team() {
  // stärkste erlaubte Gruppe: Verteidiger und Angreifer vorn, Rest hinten
  const own = Object.keys(w5.heroes).sort((x, y) => pow(y) - pow(x)),
    pick = [],
    cnt = { champ: 0, legend: 0, low: 0 };
  for (const id of own) {
    const k = m.teamKey5(m.HEROES5[id].rar);
    if (pick.length < 5 && cnt[k] < m.TEAM_MAX5[k]) {
      cnt[k]++;
      pick.push(id);
    }
  }
  // 3×3-Raster: Verteidiger und Angreifer nach vorn (dann in die Mitte), Unterstützer und Magier in die Mitte, Heiler nach hinten
  const nt = Array(9).fill(null),
    put = (id, cells) => {
      const c = cells.find(i => !nt[i]);
      if (c != null) nt[c] = id;
    };
  for (const id of pick) {
    const cls = m.HEROES5[id].cls;
    put(
      id,
      cls === 'tank' || cls === 'striker'
        ? [1, 0, 2, 4, 3, 5]
        : cls === 'healer'
          ? [7, 6, 8, 4, 3, 5]
          : [4, 3, 5, 7, 6, 8],
    );
  }
  if (nt.join() !== w5.team.join()) {
    w5.team = nt;
    r.begin(true);
  }
}
function shop() {
  for (let g = 0; g < 50; g++) {
    const c = w5.cur.k >= 180 && w5.pulls > 12 ? 'prisma' : w5.cur.k >= 20 ? 'einfach' : null;
    if (!c || !S.pull5(w5, c)) break;
  }
  for (const id of Object.keys(w5.heroes)) {
    if (m.HEROES5[id].rar === 'basis' && !w5.team.includes(id)) S.sync5(w5, id);
    while (S.canRank5(w5, id) && w5.team.includes(id)) S.rankUp5(w5, id);
  }
  for (let g = 0; g < 400; g++) {
    // billigste Stufe in der Gruppe
    const c = w5.team
      .filter(id => id && S.canLevel5(w5, id))
      .sort((x, y) => S.levelCost5(w5, x).l - S.levelCost5(w5, y).l)[0];
    if (!c) break;
    S.levelUp5(w5, c);
  }
  team();
  // Ausrüstung: jedem Helden der Gruppe je Platz das stärkste passende Teil, den Rest recyceln, Boxen kaufen (zweimal, damit Box-Inhalt angelegt wird)
  if (GEAR)
    for (let pass = 0; pass < 2; pass++) {
      for (const id of w5.team.filter(Boolean))
        for (const slot of G.GEAR_SLOTS5) {
          const cur = (w5.gear[id] || {})[slot],
            best = w5.inv.filter(it => it.t === G.slotType5(slot)).sort((x, y) => G.itemScore5(y) - G.itemScore5(x))[0];
          if (best && (!cur || G.itemScore5(best) > G.itemScore5(cur))) G.equip5(w5, id, slot, best.id);
        }
      G.recycleAll5(w5, 3, true);
      while (G.buyBox5(w5)) boxes++;
    }
  r.refresh();
  // Fehlt Material für einen Durchbruch, in der passenden Zone sammeln (höchste gewonnene Welle dort), sonst vorn weiterlaufen
  const need = w5.team
    .filter(Boolean)
    .map(id => ({ id, c: S.levelCost5(w5, id) }))
    .find(x => x.c && x.c.ess > w5.ess[m.HEROES5[x.id].cls] && w5.cur.l >= x.c.l);
  let zf = 0;
  if (need)
    for (let z = m.zoneOf5(w5.cleared); z >= 1; z--)
      if (m.zone5(z).ess === m.HEROES5[need.id].cls) {
        zf = z;
        break;
      }
  if (zf) {
    const st = Math.min(w5.cleared, m.stage5(zf, 9));
    if (w5.pos !== st || !w5.hold) {
      r.goto(st, true);
    }
  } else if (w5.hold) r.goto(w5.cleared + 1, false);
}
let t = 0,
  nextShop = 0,
  lastTry = 0,
  marks = {};
const dt = 0.05;
while (t < MIN * 60) {
  r.step(dt);
  t += dt;
  if (t >= nextShop) {
    nextShop = t + 10;
    shop();
    if (w5.block && t - lastTry > 120) {
      lastTry = t;
      r.challenge();
    }
  }
  const z = m.zoneOf5(w5.cleared + 1);
  if (!marks[z]) marks[z] = t;
}
const f = s => (s / 60).toFixed(0) + ' min';
console.log(
  `Seed ${seed}: nach ${MIN} min höchste gewonnene Stufe ${m.stageName5(Math.max(1, w5.cleared))} · Siege ${r.wins} · Niederlagen ${r.wipes} (davon Zeit ${r.timeouts}) · Helden ${Object.keys(w5.heroes).length}/26 · Kristalle ${w5.pulls}`,
);
console.log(
  '  Zone erreicht nach:',
  Object.entries(marks)
    .map(([z, s]) => 'Z' + z + ' ' + f(s))
    .join(' · '),
);
console.log(
  '  Gruppe:',
  w5.team
    .map(id =>
      id
        ? `${m.HEROES5[id].name} (${m.RARITY5[m.HEROES5[id].rar].name}, St. ${w5.heroes[id].l}, R${w5.heroes[id].r})`
        : '–',
    )
    .join(' | '),
);
console.log(
  '  Lumen',
  Math.round(w5.cur.l),
  'Kryon',
  w5.cur.k,
  'Staub',
  w5.cur.d,
  'Material',
  JSON.stringify(w5.ess),
  '· Wellen je Minute',
  (r.wins / MIN).toFixed(1),
);
const idle = S.idleRate5(w5);
console.log(
  '  Ausrüstung:',
  GEAR
    ? `${r.loot} Teile gefunden, ${boxes} Boxen, angelegt ${w5.team
        .filter(Boolean)
        .map(id => Object.keys(w5.gear[id] || {}).length)
        .join('/')}`
    : 'nicht benutzt',
  '· UP der Gruppe',
  w5.team.filter(Boolean).reduce((a, id) => a + m.heroPower5(id, w5.heroes[id].l, w5.heroes[id].r, w5.gear[id]), 0),
);
console.log(
  '  Abwesenheit je Stunde:',
  Math.round(idle.l * 60),
  'Lumen · aktiv je 5 min etwa',
  Math.round(m.waveLoot5(idle.s) * (r.wins / MIN) * 5),
);
