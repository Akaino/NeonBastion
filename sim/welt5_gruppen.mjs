/* global process, console */
// Neon Bastion – Gruppen-Messung für Welt 5 (Expedition). Spielt keine Karriere, sondern stellt Gruppen mit gleicher Stufe auf und
// lässt sie ab Welle 1-1 klettern, bis sie zum ersten Mal scheitern (gefallen oder Zeit abgelaufen). So lassen sich Zusammensetzungen
// und Aufstellungen vergleichen, ohne dass Kristall-Glück hineinspielt. Der Kampf selbst enthält keinen Zufall.
//   Teil A: alle 252 Gruppen aus den zehn Basishelden × vier Aufstellungen → Rangliste, Wirkung jeder Klasse, Auswertung je Held
//   Teil B: alle 126 Klassen-Mischungen aus dem ganzen Kader (ein Champion, zwei Legendäre), mit und ohne Zeitlimit
//   Teil C: jeder der 26 Helden einzeln in eine feste Vergleichsgruppe eingewechselt; dazu die Vergleichsgruppe ohne je ein Mitglied
// Aufruf: node sim/welt5_gruppen.mjs [--stufen 12,16,20,24,28,32] [--stufenB 20,30,40] [--kurz] [--nurA] [--set mage.hp=120,…]     Bericht: sim/ergebnisse/welt5_gruppen.md
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
  list = (n, d) => {
    const i = process.argv.indexOf('--' + n);
    return (i < 0 ? d : process.argv[i + 1]).split(',').map(Number);
  },
  // Gemessen wird auf mehreren Stufen und gemittelt: Auf einer einzelnen Stufe hängen fast alle Gruppen am selben Boss fest,
  // und die Unterschiede verschwinden im Raster der Bosswellen.
  LA = list('stufen', '12,16,20,24,28,32'),
  LB = list('stufenB', '20,30,40'),
  KURZ = process.argv.includes('--kurz'),
  NURA = process.argv.includes('--nurA'), // nur Teil A (für schnelle Vergleiche von Varianten)
  SET = process.argv.indexOf('--set'); // --set mage.hp=120,support.atk=10 ändert Klassenwerte nur für diesen Lauf
let a = 1;
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
if (SET >= 0)
  for (const kv of process.argv[SET + 1].split(',')) {
    const [k, v] = kv.split('='),
      [c, f] = k.split('.');
    m.CLASSES5[c][f] = +v;
  }
const H = m.HEROES5,
  CN = { tank: 'Verteidiger', striker: 'Angreifer', mage: 'Magier', healer: 'Heiler', support: 'Unterstützer' },
  CK = { tank: 'V', striker: 'A', mage: 'M', healer: 'H', support: 'U' },
  CLS = Object.keys(CN),
  melee = id => m.CLASSES5[H[id].cls].melee;

/* ---------- Aufstellungen: Liste von Helden → 3×3-Raster (Feld i: Reihe floor(i/3), 0 = vorn) ---------- */
const FRONT = [1, 0, 2],
  MID = [4, 3, 5],
  BACK = [7, 6, 8];
function place(ids, order) {
  // order(id) = Liste der Felder, die der Held der Reihe nach versucht
  const t = Array(9).fill(null);
  for (const id of ids) {
    const c = order(id).find(i => !t[i]);
    t[c] = id;
  }
  return t;
}
const FORM = {
  // Nahkämpfer vorn (Verteidiger zuerst), Magier und Unterstützer in die Mitte, Heiler nach hinten
  klug: ids =>
    place(
      ids.slice().sort((x, y) => CLS.indexOf(H[x].cls) - CLS.indexOf(H[y].cls)),
      id =>
        melee(id)
          ? [...FRONT, ...MID, ...BACK]
          : H[id].cls === 'healer'
            ? [...BACK, ...MID, ...FRONT]
            : [...MID, ...BACK, ...FRONT],
    ),
  // Verteidiger vorn, Angreifer dahinter in der Mitte, alle Fernkämpfer hinten (gibt es keinen Verteidiger, steht vorn niemand:
  // dann ist die Mitte die vorderste Reihe)
  staffel: ids =>
    place(ids, id =>
      H[id].cls === 'tank'
        ? [...FRONT, ...MID, ...BACK]
        : H[id].cls === 'striker'
          ? [...MID, ...FRONT, ...BACK]
          : [...BACK, ...MID, ...FRONT],
    ),
  // alle so weit vorn wie möglich: drei vorn (Nahkämpfer zuerst), zwei in der Mitte
  vorn: ids =>
    place(
      ids.slice().sort((x, y) => CLS.indexOf(H[x].cls) - CLS.indexOf(H[y].cls)),
      () => [...FRONT, ...MID, ...BACK],
    ),
  // verkehrt herum: Fernkämpfer vorn, Nahkämpfer in der Mitte
  verkehrt: ids =>
    place(
      ids.slice().sort((x, y) => CLS.indexOf(H[y].cls) - CLS.indexOf(H[x].cls)),
      id => (melee(id) ? [...MID, ...BACK, ...FRONT] : [...FRONT, ...MID, ...BACK]),
    ),
};
const FORMS = Object.keys(FORM),
  FNAME = { klug: 'Nahkämpfer vorn', staffel: 'gestaffelt', vorn: 'alle vorn', verkehrt: 'verkehrt herum' };

/* ---------- eine Gruppe klettern lassen ---------- */
const CAP = 300; // Sekunden je Welle ohne Zeitlimit, danach gilt sie als nicht geschafft
function climb(team, level, noLimit, rank = 0) {
  const w = S.freshW5();
  w.heroes = {};
  for (const id of team) if (id) w.heroes[id] = { l: level, r: rank, s: 0 };
  w.team = team.slice();
  const r = new Run5(w, {});
  r.headless = true;
  r.noLimit = !!noLimit;
  const st = {};
  for (const id of team) if (id) st[id] = { dmg: 0, healed: 0, taken: 0, soaked: 0, casts: 0, downs: 0 };
  let time = 0,
    slow = 0,
    why = '';
  for (let s = 1; s <= 400; s++) {
    w.pos = s;
    w.block = 0;
    w.hold = false;
    r.begin(true);
    const w0 = r.wins,
      l0 = r.wipes;
    let n = 0;
    while (r.wins === w0 && r.wipes === l0 && n++ < CAP * 20 + 400) r.step(0.05);
    for (const h of r.heroes) for (const k in st[h.id]) st[h.id][k] += h[k];
    time += r.wt;
    slow = Math.max(slow, r.wt);
    if (r.wins === w0) {
      why = r.wipes === l0 ? 'zu langsam' : r.why === 'time' ? 'Zeit' : 'gefallen';
      return { reached: s - 1, waves: s, why, time, slow, st };
    }
  }
  return { reached: 400, waves: 400, why: '', time, slow, st };
}
// dieselbe Gruppe auf mehreren Stufen: erreichte Welle gemittelt, alles andere summiert
function multi(team, levels, noLimit) {
  const rs = levels.map(l => climb(team, l, noLimit)),
    o = { reached: 0, waves: 0, time: 0, slow: 0, st: {}, zeit: 0, per: rs.map(r => r.reached) };
  for (const r of rs) {
    o.reached += r.reached / rs.length;
    o.waves += r.waves;
    o.time += r.time;
    o.slow = Math.max(o.slow, r.slow);
    if (r.why !== 'gefallen') o.zeit++;
    for (const id in r.st) {
      const t = o.st[id] || (o.st[id] = { dmg: 0, healed: 0, taken: 0, soaked: 0, casts: 0, downs: 0 });
      for (const k in t) t[k] += r.st[id][k];
    }
  }
  o.why = o.zeit ? `${o.zeit}× Zeit` : 'gefallen';
  return o;
}
const avg = l => (l.length ? l.reduce((x, y) => x + y, 0) / l.length : 0);
const f1 = x => x.toFixed(1).replace('.', ',');
const best = (ids, level, noLimit) => {
  let b = null;
  for (const f of FORMS) {
    const x = multi(FORM[f](ids), level, noLimit);
    x.form = f;
    if (!b || x.reached > b.reached || (x.reached === b.reached && x.time < b.time)) b = x;
  }
  return b;
};
const sn = s => f1(s);
const out = [];
const say = (s = '') => {
  out.push(s);
  console.log(s);
};
const table = (head, rows) => {
  say('| ' + head.join(' | ') + ' |');
  say('|' + head.map(() => '---').join('|') + '|');
  for (const r of rows) say('| ' + r.join(' | ') + ' |');
  say();
};
const names = ids => ids.map(id => H[id].name).join(', ');
const mix = ids => CLS.map(c => ids.filter(id => H[id].cls === c).length + CK[c]).join(' ');

say(`# Welt 5 – Gruppen-Messung (Zeitlimit ${60} s je Welle, ${90} s je Boss)`);
say();
say(
  'Alle Helden einer Gruppe haben dieselbe Stufe, Rang 0, keine Ausrüstung. „Erreicht“ ist die Zahl der gewonnenen Wellen beim Klettern ab 1-1 (25 = bis 3-5), gemittelt über mehrere Stufen; gestoppt wird beim ersten Scheitern. V = Verteidiger, A = Angreifer, M = Magier, H = Heiler, U = Unterstützer.',
);
say();

/* ================= Teil A: alle Gruppen aus Basishelden ================= */
const basis = m.HERO_IDS5.filter(id => H[id].rar === 'basis'),
  combos = [];
(function rec(i, pick) {
  if (pick.length === 5) return combos.push(pick.slice());
  for (let j = i; j < basis.length; j++) rec(j + 1, [...pick, basis[j]]);
})(0, []);
const A = combos.map(ids => {
  const res = {};
  for (const f of FORMS) res[f] = multi(FORM[f](ids), LA, false);
  const bf = FORMS.reduce((x, y) =>
    res[y].reached > res[x].reached || (res[y].reached === res[x].reached && res[y].time < res[x].time) ? y : x,
  );
  return { ids, res, bf, b: res[bf] };
});
say(`## A. Alle ${A.length} Gruppen aus den zehn Basishelden, Stufen ${LA.join(', ')}`);
say();
say('### Aufstellungen im Vergleich');
table(
  ['Aufstellung', 'Ø erreicht', 'beste von vier bei … Gruppen', 'Läufe, die an der Zeit scheitern'],
  FORMS.map(f => [
    FNAME[f],
    f1(avg(A.map(x => x.res[f].reached))),
    A.filter(x => x.res[f].reached === Math.max(...FORMS.map(g => x.res[g].reached))).length,
    Math.round((100 * A.reduce((n, x) => n + x.res[f].zeit, 0)) / (A.length * LA.length)) + ' %',
  ]),
);
A.sort((x, y) => y.b.reached - x.b.reached || x.b.time - y.b.time);
const rowA = x => [
  mix(x.ids),
  names(x.ids),
  sn(x.b.reached),
  FNAME[x.bf],
  x.b.why,
  Math.round(x.b.slow) + ' s',
  FORMS.map(f => sn(x.res[f].reached)).join(' / '),
];
const headA = [
  'Mischung',
  'Helden',
  'erreicht',
  'beste Aufstellung',
  'scheitert an',
  'längste Welle',
  FORMS.map(f => FNAME[f]).join(' / '),
];
say('### Die zehn besten Gruppen');
table(headA, A.slice(0, 10).map(rowA));
say('### Die zehn schwächsten Gruppen');
table(headA, A.slice(-10).map(rowA));
say('### Wirkung der Klassen (Ø erreichte Welle, je nach Anzahl in der Gruppe, beste Aufstellung)');
table(
  ['Klasse', 'keiner', 'einer', 'zwei', 'Unterschied 0 → 1', '1 → 2'],
  CLS.map(c => {
    const v = [0, 1, 2].map(n =>
      avg(A.filter(x => x.ids.filter(id => H[id].cls === c).length === n).map(x => x.b.reached)),
    );
    return [
      CN[c],
      f1(v[0]),
      f1(v[1]),
      f1(v[2]),
      (v[1] >= v[0] ? '+' : '') + f1(v[1] - v[0]),
      (v[2] >= v[1] ? '+' : '') + f1(v[2] - v[1]),
    ];
  }),
);
// je Held: mit/ohne, Anteile
const total = x => {
  const t = { dmg: 0, healed: 0, taken: 0, soaked: 0 };
  for (const id of x.ids) for (const k in t) t[k] += x.b.st[id][k];
  return t;
};
const heroRow = (id, list, key) => {
  // list = Gruppen mit diesem Helden; key(x) liefert das Ergebnis-Objekt
  const sh = k =>
    avg(
      list.map(x => {
        const r = key(x),
          t = Object.values(r.st).reduce((s2, v) => s2 + v[k], 0);
        return t ? (100 * r.st[id][k]) / t : 0;
      }),
    );
  return {
    dmg: sh('dmg'),
    heal: sh('healed'),
    taken: sh('taken'),
    casts: avg(list.map(x => key(x).st[id].casts / Math.max(1, key(x).waves))),
    downs: avg(list.map(x => key(x).st[id].downs)),
  };
};
void total;
say('### Auswertung je Basisheld');
say(
  'Mit/ohne = Ø erreichte Welle aller Gruppen mit bzw. ohne diesen Helden (je 126). Die Anteile beziehen sich auf die eigene Gruppe (fünf Helden: 20 % wäre der gleiche Anteil für alle).',
);
say();
const perA = basis.map(id => {
  const mit = A.filter(x => x.ids.includes(id)),
    ohne = A.filter(x => !x.ids.includes(id)),
    r = heroRow(id, mit, x => x.b),
    d = avg(mit.map(x => x.b.reached)) - avg(ohne.map(x => x.b.reached));
  return {
    id,
    d,
    mit: avg(mit.map(x => x.b.reached)),
    ohne: avg(ohne.map(x => x.b.reached)),
    top: A.slice(0, 25).filter(x => x.ids.includes(id)).length,
    ...r,
  };
});
const verdict = d =>
  d >= 1.5 ? 'sehr hilfreich' : d >= 0.5 ? 'hilfreich' : d > -0.5 ? 'neutral' : d > -1.5 ? 'schwach' : 'schadet';
table(
  [
    'Held',
    'Klasse',
    'mit',
    'ohne',
    'Unterschied',
    'in den besten 25',
    'Schaden',
    'Heilung',
    'steckt ein',
    'Fähigkeiten je Welle',
    'Urteil',
  ],
  perA
    .sort((x, y) => y.d - x.d)
    .map(p => [
      H[p.id].name,
      CN[H[p.id].cls],
      f1(p.mit),
      f1(p.ohne),
      (p.d >= 0 ? '+' : '') + f1(p.d),
      p.top,
      Math.round(p.dmg) + ' %',
      Math.round(p.heal) + ' %',
      Math.round(p.taken) + ' %',
      f1(p.casts),
      verdict(p.d),
    ]),
);

if (NURA) process.exit(0);
/* ================= Teil B: Klassen-Mischungen aus dem ganzen Kader ================= */
const byCls = c => m.HERO_IDS5.filter(id => H[id].cls === c),
  RO = ['champ', 'legend', 'elite', 'basis'];
function lineup(cnt) {
  // cnt = { Klasse: Anzahl }. Der Champion geht an die am stärksten vertretene Klasse, die zwei Legendären an die beiden stärksten;
  // der Rest wird mit Elite- und Basishelden gefüllt.
  const order = CLS.filter(c => cnt[c]).sort((x, y) => cnt[y] - cnt[x]),
    ids = [],
    need = { ...cnt };
  const take = (c, rar) => {
    const id = byCls(c).find(h => H[h].rar === rar && !ids.includes(h));
    if (id && need[c] > 0) {
      ids.push(id);
      need[c]--;
      return true;
    }
    return false;
  };
  take(order[0], 'champ');
  let lg = 0;
  for (const c of order) if (lg < 2 && take(c, 'legend')) lg++;
  for (const rar of ['elite', 'basis']) for (const c of order) while (need[c] > 0 && take(c, rar));
  return ids;
}
void RO;
const vecs = [];
(function rec(i, left, cur) {
  if (i === CLS.length - 1) return vecs.push({ ...cur, [CLS[i]]: left });
  for (let n = 0; n <= left; n++) rec(i + 1, left - n, { ...cur, [CLS[i]]: n });
})(0, 5, {});
const B = (KURZ ? vecs.filter((v, i) => i % 6 === 0 || v.tank === 5) : vecs)
  .map(cnt => ({ cnt, ids: lineup(cnt) }))
  .filter(x => x.ids.length === 5)
  .map(x => {
    const mit = best(x.ids, LB, false),
      ohne = best(x.ids, LB, true);
    return { ...x, mit, ohne };
  });
B.sort((x, y) => y.mit.reached - x.mit.reached || x.mit.time - y.mit.time);
say(
  `## B. Klassen-Mischungen aus dem ganzen Kader, Stufen ${LB.join(', ')} (${B.length} Mischungen, je beste Aufstellung)`,
);
say();
say(
  'Jede Gruppe hat einen Champion, zwei Legendäre und zwei Elite- bzw. Basishelden; der Champion gehört zur häufigsten Klasse. „Ohne Limit“ zeigt, wie weit dieselbe Gruppe ohne die 60/90 Sekunden käme (höchstens 300 s je Welle). Stufenweise Ergebnisse stehen in Klammern.',
);
say();
const rowB = (x, i) => [
  i + 1,
  mix(x.ids),
  names(x.ids),
  sn(x.mit.reached) + ' (' + x.mit.per.join('/') + ')',
  x.mit.why,
  FNAME[x.mit.form],
  sn(x.ohne.reached) + ' (' + x.ohne.per.join('/') + ')',
  Math.round(x.ohne.slow) + ' s',
];
const headB = [
  'Platz',
  'Mischung',
  'Helden',
  'erreicht',
  'scheitert an',
  'Aufstellung',
  'ohne Limit',
  'längste Welle ohne Limit',
];
say('### Die 15 besten');
table(headB, B.slice(0, 15).map(rowB));
say('### Die 10 schwächsten');
table(
  headB,
  B.slice(-10).map((x, i) => rowB(x, B.length - 10 + i)),
);
say('### Einseitige Gruppen und Gruppen ohne eine Klasse');
const pure = B.map((x, i) => [x, i]).filter(([x]) => CLS.some(c => x.cnt[c] === 5));
table(
  headB,
  pure.map(([x, i]) => rowB(x, i)),
);
table(
  ['Gruppen …', 'Anzahl', 'Ø erreicht', 'beste'],
  [
    ...CLS.map(c => ['ohne ' + CN[c], B.filter(x => !x.cnt[c])]),
    ['mit allen fünf Klassen', B.filter(x => CLS.every(c => x.cnt[c]))],
    ...CLS.map(c => ['mit drei oder mehr ' + CN[c], B.filter(x => x.cnt[c] >= 3)]),
  ].map(([n, l]) => [
    n,
    l.length,
    f1(avg(l.map(x => x.mit.reached))),
    l.length ? sn(Math.max(...l.map(x => x.mit.reached))) : '–',
  ]),
);
say('### Wo das Zeitlimit greift');
const hit = B.filter(x => x.ohne.reached > x.mit.reached);
say(
  `${hit.length} von ${B.length} Mischungen kämen ohne Limit weiter. Größter Unterschied: ` +
    hit
      .sort((x, y) => y.ohne.reached - y.mit.reached - (x.ohne.reached - x.mit.reached))
      .slice(0, 6)
      .map(x => `${mix(x.ids)} ${sn(x.mit.reached)} statt ${sn(x.ohne.reached)}`)
      .join(' · '),
);
say();

/* ================= Teil C: jeder Held einzeln ================= */
const REF = ['riegel', 'funke', 'glimmer', 'flick', 'takt'],
  refRes = best(REF, LA, false);
say(`## C. Jeder Held einzeln, Stufen ${LA.join(', ')}`);
say();
say(
  `Vergleichsgruppe: ${names(REF)} (je ein Basisheld jeder Klasse) erreicht ${sn(refRes.reached)}. Jeder Held ersetzt darin den Helden seiner Klasse. Höhere Seltenheit hat von Haus aus mehr Leben und Angriff (Elite ×1,3, Legendär ×1,7, Champion ×2,3) – verglichen wird deshalb innerhalb einer Seltenheit.`,
);
say();
const C = m.HERO_IDS5.map(id => {
  const ids = REF.map(x => (H[x].cls === H[id].cls ? id : x)),
    r = best(ids, LA, false),
    hr = heroRow(id, [r], x => x);
  return { id, r, ...hr };
});
for (const rar of m.RARITY_IDS5) {
  const l = C.filter(x => H[x.id].rar === rar),
    mean = avg(l.map(x => x.r.reached));
  say(`### ${m.RARITY5[rar].name} (Ø ${f1(mean)} Wellen)`);
  table(
    [
      'Held',
      'Klasse',
      'erreicht',
      'gegen Ø der Seltenheit',
      'Schaden',
      'Heilung',
      'steckt ein',
      'Fähigkeiten je Welle',
      'gefallen',
      'scheitert an',
    ],
    l
      .sort((x, y) => y.r.reached - x.r.reached)
      .map(x => [
        H[x.id].name,
        CN[H[x.id].cls],
        sn(x.r.reached),
        (x.r.reached >= mean ? '+' : '') + f1(x.r.reached - mean),
        Math.round(x.dmg) + ' %',
        Math.round(x.heal) + ' %',
        Math.round(x.taken) + ' %',
        f1(x.casts),
        x.r.st[x.id].downs,
        x.r.why,
      ]),
  );
}
say('### Vergleichsgruppe ohne je ein Mitglied (vier Helden)');
table(
  ['ohne', 'Klasse', 'erreicht', 'Unterschied', 'scheitert an'],
  REF.map(id => {
    const r = best(
      REF.filter(x => x !== id),
      LA,
      false,
    );
    return [H[id].name, CN[H[id].cls], sn(r.reached), f1(r.reached - refRes.reached), r.why];
  }),
);
fs.mkdirSync(root + '/sim/ergebnisse', { recursive: true });
fs.writeFileSync(root + '/sim/ergebnisse/welt5_gruppen.md', out.join('\n') + '\n');
console.log('Bericht: sim/ergebnisse/welt5_gruppen.md');
