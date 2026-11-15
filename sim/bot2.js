// Neon Bastion – Simulations-Bot (Neon-Sektor, ohne Tippen)
// Lädt den originalen Spielcode aus ./game und spielt komplette Karrieren oder einzelne Test-Runs.
const fs = require('fs'),
  vm = require('vm'),
  path = require('path');

function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Der Spielcode liegt seit 0.31.0 als Module in src/js. Die Simulation lädt nur die Spiellogik (src/js/logic.js: Daten, Werte, Run, Welt 2),
// ohne Oberfläche, Grafik und Ton. Module lassen sich nur asynchron laden, deshalb muss vor dem ersten Lauf prepare(dir) abgewartet werden.
// Der Zufall wird je Lauf über Math.random des jeweiligen Arbeitsfadens festgelegt (jeder Faden hat sein eigenes Math).
// Ältere Stände (vor 0.31.0, etwa ein git-Worktree für „--gegen“) haben noch core.js, game.js usw. in einem Ordner; sie laufen wie früher in einem eigenen vm-Kontext.
const { pathToFileURL } = require('url');
const DEFAULT = path.join(__dirname, '..', 'src'),
  MODS = {},
  SCRIPTS = {};
const isLegacy = dir => fs.existsSync(path.join(dir, 'core.js'));
async function prepare(dir) {
  dir = dir || DEFAULT;
  if (isLegacy(dir) || MODS[dir]) return;
  MODS[dir] = await import(pathToFileURL(path.join(dir, 'js', 'logic.js')).href);
}
function scriptFor(dir) {
  if (!SCRIPTS[dir]) {
    const SRC = ['core.js', 'core2.js', 'game.js', 'game2.js']
      .map(f => fs.readFileSync(path.join(dir, f), 'utf8'))
      .join('\n');
    SCRIPTS[dir] = new vm.Script(
      SRC +
        ';Object.assign(this,{Run,freshSave,NODES,nodeCost,heroLvlCost,stats,HEROES,PRES,presCost,quantaFor,TOWERS,TOWER_IDS,towerLvlCost,slotCost,SLOT_EXTRA,HERO_MAX,TOWER_MAX,DRONES:typeof DRONES!=="undefined"?DRONES:null,DRONE_IDS:typeof DRONE_IDS!=="undefined"?DRONE_IDS:[],DRONE_MAX:typeof DRONE_MAX!=="undefined"?DRONE_MAX:0,droneLvlCost:typeof droneLvlCost!=="undefined"?droneLvlCost:null,droneUnlocked:typeof droneUnlocked!=="undefined"?droneUnlocked:null});',
    );
  }
  return SCRIPTS[dir];
}
function loadGame(seed, dir) {
  dir = dir || DEFAULT;
  if (isLegacy(dir)) {
    const ctx = { console, __rnd: seededRandom(seed) };
    vm.createContext(ctx);
    vm.runInContext('Math.random=__rnd;', ctx);
    scriptFor(dir).runInContext(ctx);
    return ctx;
  }
  if (!MODS[dir]) throw new Error('prepare(' + dir + ') wurde nicht abgewartet');
  Math.random = seededRandom(seed);
  return MODS[dir];
}
const clone = o => JSON.parse(JSON.stringify(o));
const WEIGHT = { s: 1, k: 40, p: 400, d: 4000, q: 1 };

// Zielender Zeiger: wie ein aufmerksamer Spieler alle 0,25 s auf die Stelle ziehen, an der der Impuls die meisten Gegner trifft.
// Bei Gleichstand gewinnt die Gruppe, die der Basis am nächsten ist. Ohne Gegner bleibt der Zeiger liegen.
function aimPointer(r) {
  if (r.drops && r.drops.length) {
    r.cx = r.drops[0].x;
    r.cy = r.drops[0].y;
    return;
  } // Abwürfe gehen vor: fünf Impulse hintereinander
  const en = r.en,
    n = en.length;
  if (!n) return;
  const R = r.S.tapR,
    step = Math.max(1, Math.floor(n / 40));
  let best = null,
    bn = 0,
    bd = Infinity;
  for (let i = 0; i < n; i += step) {
    const e = en[i];
    if (e.hp <= 0) continue;
    const d = Math.sqrt(e.x * e.x + e.y * e.y);
    if (d > 420) continue;
    let c = 0;
    r.query(e.x, e.y, R + 40, o => {
      const dx = o.x - e.x,
        dy = o.y - e.y;
      if (Math.sqrt(dx * dx + dy * dy) < R + o.r) c++;
    });
    if (c > bn || (c === bn && d < bd)) {
      bn = c;
      bd = d;
      best = e;
    }
  }
  if (best) {
    r.cx = best.x;
    r.cy = best.y;
  }
}

// Einen Run spielen. Türme werden automatisch gebaut, Tippen gibt es nicht.
function playRun(X, save, opt) {
  const r = new X.Run(save, {});
  if (opt.anteile) r.tally = {};
  r.headless = opt.headless !== false;
  r.hw = 330;
  r.hh = 700;
  r.noImpulse = opt.zeiger === 'aus';
  const aimS = opt.zeiger === 'zielt';
  let aimT = 0;
  const ang = [0.8, 2.4, 4, 5.5, 1.6, 3.2];
  let ti = 0;
  const types = X.TOWER_IDS.filter(t => save.towers[t].u),
    pref = (aimS ? ['weak', 'mark', 'frost', 'cryo'] : ['weak', 'frost', 'cryo']).filter(t => types.includes(t));
  while (!r.over && r.t < opt.maxRunSec) {
    r.step(opt.dt);
    if (aimS && (aimT -= opt.dt) <= 0) {
      aimT = 0.25;
      aimPointer(r);
    }
    if (pref.length && ti < r.towerSlots()) {
      const ty = pref[ti % pref.length];
      if (r.energy >= r.buildCost(ty) && r.place(ty, Math.cos(ang[ti]) * 110, Math.sin(ang[ti]) * 110)) ti++;
    }
  }
  return r;
}

// Liste aller Kaufoptionen (id, Währung, Kosten, Anwenden)
// opt.aeste: erlaubte Äste als Buchstabenfolge (b Basis, u Einheiten, h Helden, f Fokus, e Ertrag); fehlt die Angabe, ist alles erlaubt.
// Helden (Freischalten, Stufen, Aufstieg) gehören zum Helden-Ast. opt.tuerme==='aus' sperrt Turm-Käufe.
const BOT_NO_HERO = ['kopfjaeger', 'ingenieurin'];
const botTowers = (X, opt) =>
  X.TOWER_IDS.filter(id => id !== 'mute' && (id !== 'mark' || (opt && opt.zeiger === 'zielt')));
const allowBr = (opt, br) => !opt || opt.aeste == null || opt.aeste.includes(br);
function options(X, save, opt) {
  const o = [],
    heroes = allowBr(opt, 'h'),
    towers = !opt || opt.tuerme !== 'aus';
  for (const n of Object.values(X.NODES)) {
    if (n.id === 'root' || !allowBr(opt, n.br)) continue;
    const l = save.nodes[n.id] || 0;
    if (l >= n.max || !(save.nodes[n.parent] > 0)) continue;
    if (n.id === 'e2b' && l >= Math.floor((save.best || 0) / 2)) continue;
    o.push({
      id: n.id,
      name: n.name,
      cur: n.cur,
      cost: X.nodeCost(n, l),
      cost2: X.nodeCost2 ? X.nodeCost2(n, l) : null, // zweite Währung (seit 0.32.0)
      apply: () => (save.nodes[n.id] = l + 1),
      undo: () => (save.nodes[n.id] = l),
    });
  }
  if (heroes)
    for (const id of save.team) {
      const h = save.heroes[id];
      if (h.a < 5)
        o.push({
          id: 'aufstieg:' + id,
          name: 'Aufstieg ' + X.HEROES[id].name,
          cur: 'p',
          cost: (h.a + 1) * 2,
          apply: () => h.a++,
          undo: () => h.a--,
        });
      if (h.l < X.HERO_MAX) {
        const [cu, a] = X.heroLvlCost(h.l);
        o.push({
          id: 'held:' + id,
          name: 'Stufe ' + X.HEROES[id].name,
          cur: cu,
          cost: a,
          apply: () => h.l++,
          undo: () => h.l--,
        });
      }
    }
  if (towers)
    for (const id of botTowers(X, opt)) {
      const t = save.towers[id];
      if (t.u && t.l < X.TOWER_MAX) {
        const [cu, a] = X.towerLvlCost(t.l);
        o.push({
          id: 'turm:' + id,
          name: 'Startstufe ' + X.TOWERS[id].name,
          cur: cu,
          cost: a,
          apply: () => t.l++,
          undo: () => t.l--,
          fix: 0.01,
        });
      }
    }
  // Flotte: Stufen der freigeschalteten und eingesetzten Drohnenklassen (zählt zum Ast Flotte)
  if (save.fleet && allowBr(opt, 'u'))
    for (const id of X.DRONE_IDS) {
      const f = save.fleet[id];
      if (X.droneUnlocked(save, id) && f.p > 0 && f.l < X.DRONE_MAX) {
        const [cu, a] = X.droneLvlCost(f.l);
        o.push({
          id: 'drohne:' + id,
          name: 'Stufe ' + X.DRONES[id].name,
          cur: cu,
          cost: a,
          apply: () => f.l++,
          undo: () => f.l--,
          fix: 0.02,
        });
      }
    }
  if (towers && (save.tslots || 0) < X.SLOT_EXTRA) {
    const [cu, a] = X.slotCost(save.tslots || 0);
    o.push({
      id: 'bauplatz',
      name: 'Bauplatz',
      cur: cu,
      cost: a,
      apply: () => (save.tslots = (save.tslots || 0) + 1),
      undo: () => save.tslots--,
      fix: 0.05,
    });
  }
  return o;
}
function unlocks(X, save, spend, opt) {
  if (allowBr(opt, 'h'))
    for (const id in X.HEROES) {
      if (
        BOT_NO_HERO.includes(id) &&
        !(
          opt &&
          String(opt.held || '')
            .split(',')
            .includes(id)
        )
      )
        continue;
      const h = save.heroes[id];
      if (!h.u) {
        const [cu, a] = X.HEROES[id].unlock;
        if (save.cur[cu] >= a) {
          save.cur[cu] -= a;
          h.u = 1;
          track(spend, 'frei:' + id, 'Held ' + X.HEROES[id].name, cu, a);
        }
      }
    }
  // Drohnenklassen freischalten und gleichmäßig einsetzen (Reparaturdrohnen mit halbem Anteil)
  if (save.fleet && allowBr(opt, 'u')) {
    for (const id of X.DRONE_IDS) {
      const D = X.DRONES[id],
        f = save.fleet[id];
      if (!f.u && Array.isArray(D.unlock) && save.cur[D.unlock[0]] >= D.unlock[1]) {
        save.cur[D.unlock[0]] -= D.unlock[1];
        f.u = 1;
        track(spend, 'frei:' + id, 'Klasse ' + D.name, D.unlock[0], D.unlock[1]);
      }
    }
    for (const id of X.DRONE_IDS) save.fleet[id].p = X.droneUnlocked(save, id) ? (id === 'repair' ? 10 : 20) : 0;
  }
  if (!opt || opt.tuerme !== 'aus')
    for (const id of botTowers(X, opt)) {
      const t = save.towers[id];
      if (!t.u && X.TOWERS[id].unlock) {
        const [cu, a] = X.TOWERS[id].unlock;
        if (save.cur[cu] >= a) {
          save.cur[cu] -= a;
          t.u = 1;
          track(spend, 'frei:' + id, X.TOWERS[id].name, cu, a);
        }
      }
    }
}
function track(spend, id, name, cur, cost) {
  const e = spend[id] || (spend[id] = { id, name, levels: 0, s: 0, k: 0, p: 0, d: 0, q: 0 });
  e.levels++;
  e[cur] += cost;
}

// Grobe Stärkeschätzung für die Kaufregel „nutzen“: Schaden pro Sekunde aller Quellen, Standfestigkeit der Basis und Einkommen, jeweils logarithmisch.
// Das ist eine Faustformel, kein Messwert. Sie soll den Bot nur davon abhalten, seltene Währungen in Knoten zu stecken, die fast nichts bewirken.
function power(X, save, opt) {
  const S = X.stats(save),
    w = Math.max(1, save.best || 1),
    ref = 8 * Math.pow(1.15, w - 1) * Math.pow(1.08, Math.max(0, w - 35)) * Math.pow(1.06, Math.max(0, w - 60));
  let dps = 0;
  for (const id of save.team) {
    const d = X.HEROES[id],
      h = save.heroes[id],
      lm = 1 + 0.12 * (h.l - 1),
      dm = d.dmg * lm * S.heroDmg;
    dps +=
      dm * d.rate * S.heroRate * (1 + 1.5 * S.heroCrit) +
      (dm * 3 * (1 + 0.35 * h.a) * S.abilPow) / (d.cd * S.abilityCd * (1 - 0.08 * h.a));
  }
  dps +=
    S.drones *
      S.droneDmg *
      1.2 *
      S.droneRate *
      (1 + S.swarmInt * S.drones) *
      (S.mother ? 1.75 : 1) *
      Math.min(1, 0.3 + S.droneHp / (ref * 0.05 + 1)) +
    S.turrets * S.turretDmg * 1.5 * S.turretRate +
    S.autoRate * S.turretDmg * S.autoDmg * (S.autoAim ? 1.5 : 1) +
    (S.pulse ? ((S.pulseDmg + (S.pulsePct || 0) * ref * 4) * 3) / S.pulseCd : 0);
  const zf = opt && opt.zeiger === 'zielt' ? 1 : opt && opt.zeiger === 'aus' ? 0 : 0.12;
  dps +=
    ((zf * S.tapDmg * S.impMul) / S.impInt) *
    (1 + 1.5 * S.tapCrit) *
    (S.tapR / 26) *
    (1 + (S.beat || 0) / 5) *
    (1 + 0.3 * (S.overload || 0)) *
    (1 + 0.4 * (S.chain || 0)) *
    (S.megaTap ? 1.3 : 1);
  const ehp = (S.baseHp * (1 + S.shieldPct * S.shRegen) * (1 + S.regen * 25)) / S.dmgTaken;
  return (
    Math.log(dps + 1) +
    0.5 * Math.log(ehp) +
    0.6 * Math.log(S.gS * S.gAll) +
    0.25 * Math.log(S.gK * S.gAll) +
    0.2 * Math.log(S.gP * S.gAll) +
    0.1 * Math.log(1 + S.gD) +
    0.1 * Math.log(S.elite) +
    0.05 * Math.log(S.qMul || 1) +
    0.03 * (save.nodes.e2b || 0)
  );
}
// Kaufregel: opt.kauf==='nutzen' wählt unter den bezahlbaren Optionen die mit dem größten geschätzten Nutzen je Kosten, sonst wie bisher die billigste.
function buy(X, save, spend, opt) {
  const smart = opt && opt.kauf === 'nutzen';
  for (let c = 0; c < 20000; c++) {
    unlocks(X, save, spend, opt);
    const S = X.stats(save);
    save.team = Object.keys(X.HEROES)
      .filter(id => save.heroes[id].u)
      .slice(0, S.slots);
    let o = options(X, save, opt).filter(
      op => save.cur[op.cur] >= Math.ceil(op.cost) && (!op.cost2 || save.cur[op.cost2[0]] >= op.cost2[1]),
    );
    const total = op => op.cost * WEIGHT[op.cur] + (op.cost2 ? op.cost2[1] * WEIGHT[op.cost2[0]] : 0); // Gesamtpreis in Splitter-Einheiten
    if (!o.length) break;
    let pick;
    if (smart) {
      const p0 = power(X, save, opt);
      let best = -1;
      for (const op of o) {
        let g = op.fix || 0;
        if (!op.fix) {
          op.apply();
          g = power(X, save, opt) - p0;
          op.undo();
        }
        const v = (Math.max(g, 0) + 1e-6) / total(op);
        if (v > best) {
          best = v;
          pick = op;
        }
      }
    } else pick = o.sort((a, b) => total(a) - total(b))[0];
    const cst = Math.ceil(pick.cost);
    save.cur[pick.cur] -= cst;
    pick.apply();
    track(spend, pick.id, pick.name, pick.cur, cst);
    if (pick.cost2) {
      save.cur[pick.cost2[0]] -= pick.cost2[1];
      track(spend, pick.id + '+', pick.name + ' (zweite Währung)', pick.cost2[0], pick.cost2[1]);
    }
  }
}
function buyPrestige(X, save, spend) {
  for (let c = 0; c < 2000; c++) {
    const o = Object.values(X.PRES)
      .filter(p => (save.pr[p.id] || 0) < p.max)
      .map(p => [X.presCost(p, save.pr[p.id] || 0) * (p.id === 'dmg' || p.id === 'hp' ? 0.6 : 1), p]);
    if (!o.length) break;
    o.sort((a, b) => a[0] - b[0]);
    const p = o[0][1],
      real = X.presCost(p, save.pr[p.id] || 0);
    if (save.q < real) break;
    save.q -= real;
    save.pr[p.id] = (save.pr[p.id] || 0) + 1;
    track(spend, 'nova:' + p.id, 'Supernova: ' + p.name, 'q', real);
  }
}
function supernova(X, save) {
  const g = X.quantaFor(save.cycleBest, save);
  save.q += g;
  save.nova = (save.nova || 0) + 1;
  save.cur = { s: 0, k: 0, p: 0, d: 0 };
  save.nodes = { root: 1 };
  if (save.fleet) for (const id of X.DRONE_IDS) save.fleet[id].l = 1;
  for (const id in save.heroes) {
    save.heroes[id].l = 1;
    save.heroes[id].a = 0;
  }
  for (const id of X.TOWER_IDS) save.towers[id].l = 1;
  const L = save.pr.legacy || 0;
  if (L) for (const n of Object.values(X.NODES)) if (n.cur === 's') save.nodes[n.id] = Math.min(n.max, L);
  const st = save.pr.start || 0;
  if (st) {
    save.cur.s = 200 * Math.pow(3, st - 1);
    save.cur.k = st * 5;
  }
  save.cycleBest = 0;
  return g;
}

// Komplette Karriere simulieren
function simulate(opt, onRun) {
  const X = loadGame(opt.seed),
    save = X.freshSave(),
    spend = {},
    snaps = {},
    ms = {};
  let T = 0,
    stall = 0,
    cyc = 1,
    runs = 0;
  while (runs < opt.maxRuns && T < opt.maxGameHours * 3600) {
    const S0 = X.stats(save),
      pick = Math.max(1, Math.min(S0.startMax, (save.cycleBest || 0) - 10));
    save.startPick = pick >= S0.startMax ? 0 : pick;
    const r = playRun(X, save, opt);
    runs++;
    T += r.t;
    for (const c of ['s', 'k', 'p', 'd']) save.cur[c] += Math.floor(r.gain[c]);
    if (r.w > save.cycleBest) {
      save.cycleBest = r.w;
      stall = 0;
    } else stall++;
    save.best = Math.max(save.best, r.w);
    buy(X, save, spend, opt);
    const row = {
      seed: opt.seed,
      run: runs,
      cycle: cyc,
      wave: r.w,
      startWave: X.stats(save).startWave,
      runSec: Math.round(r.t),
      totalMin: +(T / 60).toFixed(1),
      best: save.best,
      cycleBest: save.cycleBest,
      s: Math.floor(r.gain.s),
      k: Math.floor(r.gain.k),
      p: Math.floor(r.gain.p),
      d: Math.floor(r.gain.d),
      treeLevels: Object.entries(save.nodes).reduce((a, [k, v]) => a + (k === 'root' ? 0 : v), 0),
      heroes: save.team.length,
      supernovas: save.nova || 0,
      event: '',
    };
    for (const m of opt.milestones)
      if (!ms[m] && save.best >= m) {
        ms[m] = { totalSec: T, runs, cycle: cyc, supernovas: save.nova || 0 };
        row.event += `Welle ${m} erreicht; `;
      }
    for (const m of opt.snapshotsAt || []) if (!snaps[m] && save.best >= m) snaps[m] = clone(save);
    if (stall >= opt.stallRuns && save.cycleBest >= 25) {
      const g = supernova(X, save);
      buyPrestige(X, save, spend);
      row.event += `Supernova ${cyc} (+${g} Quanten); `;
      cyc++;
      stall = 0;
    }
    onRun && onRun(row);
    if (save.best >= opt.target && !(opt.snapshotsAt || []).some(m => !snaps[m])) break;
  }
  return {
    seed: opt.seed,
    runs,
    totalSec: T,
    best: save.best,
    supernovas: save.nova || 0,
    milestones: ms,
    spend,
    snapshots: snaps,
  };
}

// Einzelner Test-Run für die Upgrade-Messung: Spielstand + Änderung, gleicher Zufalls-Startwert
function benchmark(job) {
  const X = loadGame(job.seed),
    save = clone(job.save);
  if (job.mod) {
    const m = job.mod;
    if (m.kind === 'node') {
      const n = X.NODES[m.id];
      save.nodes[m.id] = Math.min(n.max, (save.nodes[m.id] || 0) + m.n);
    } else if (m.kind === 'held') {
      const h = save.heroes[m.id];
      h.l = Math.min(X.HERO_MAX, h.l + m.n);
    } else if (m.kind === 'aufstieg') {
      const h = save.heroes[m.id];
      h.a = Math.min(5, h.a + m.n);
    } else if (m.kind === 'turm') {
      const t = save.towers[m.id];
      t.l = Math.min(X.TOWER_MAX, t.l + m.n);
    } else if (m.kind === 'bauplatz') {
      save.tslots = Math.min(X.SLOT_EXTRA, (save.tslots || 0) + m.n);
    }
  }
  const S = X.stats(save);
  save.team = Object.keys(X.HEROES)
    .filter(id => save.heroes[id].u)
    .slice(0, S.slots);
  save.startPick = 1;
  const r = playRun(X, save, job.opt);
  return { wave: r.w, sec: r.t };
}

// Kandidaten für die Upgrade-Messung inklusive Kosten der zusätzlichen Stufen
function candidates(save, N) {
  const X = loadGame(1),
    out = [];
  const costOf = (fn, from, n) => {
    const c = { s: 0, k: 0, p: 0, d: 0 };
    for (let i = 0; i < n; i++) {
      const [cu, a] = fn(from + i);
      c[cu] += a;
    }
    return c;
  };
  for (const n of Object.values(X.NODES)) {
    if (n.id === 'root' || !(save.nodes[n.parent] > 0)) continue;
    const l = save.nodes[n.id] || 0;
    const k = Math.min(n.max >= 999 ? N : n.max - l, n.max === 1 ? 1 : N);
    if (k <= 0) continue;
    out.push({
      mod: { kind: 'node', id: n.id, n: k },
      name: n.name,
      cost: (() => {
        const c = costOf(i => [n.cur, X.nodeCost(n, i)], l, k);
        if (X.nodeCost2 && X.nodeCost2(n, l))
          for (let i = 0; i < k; i++) c[X.nodeCost2(n, l + i)[0]] += X.nodeCost2(n, l + i)[1];
        return c;
      })(),
    });
  }
  for (const id of Object.keys(X.HEROES)) {
    const h = save.heroes[id];
    if (!h.u) continue;
    const k = Math.min(N, X.HERO_MAX - h.l);
    if (k > 0)
      out.push({
        mod: { kind: 'held', id, n: k },
        name: 'Stufe ' + X.HEROES[id].name,
        cost: costOf(i => X.heroLvlCost(i), h.l, k),
      });
    if (h.a < 5)
      out.push({
        mod: { kind: 'aufstieg', id, n: 1 },
        name: 'Aufstieg ' + X.HEROES[id].name,
        cost: { s: 0, k: 0, p: (h.a + 1) * 2, d: 0 },
      });
  }
  for (const id of X.TOWER_IDS) {
    const t = save.towers[id];
    if (!t.u) continue;
    const k = Math.min(N, X.TOWER_MAX - t.l);
    if (k > 0)
      out.push({
        mod: { kind: 'turm', id, n: k },
        name: 'Startstufe ' + X.TOWERS[id].name,
        cost: costOf(i => X.towerLvlCost(i), t.l, k),
      });
  }
  if ((save.tslots || 0) < X.SLOT_EXTRA)
    out.push({
      mod: { kind: 'bauplatz', id: '', n: 1 },
      name: 'Bauplatz',
      cost: (() => {
        const [cu, a] = X.slotCost(save.tslots || 0);
        const c = { s: 0, k: 0, p: 0, d: 0 };
        c[cu] = a;
        return c;
      })(),
    });
  return out;
}
// Probe am festen Spielstand: ein Run wie in der Karriere (Start 10 Wellen unter dem Rekord), wahlweise mit dem Spielcode aus einem anderen Ordner.
// Fehlende Felder eines älteren Spielstands werden aus einem frischen ergänzt.
function probe(job) {
  const X = loadGame(job.seed, job.src),
    save = Object.assign(X.freshSave(), clone(job.save));
  save.towers = Object.assign(X.freshSave().towers, save.towers); // ältere Spielstände kennen neuere Türme nicht
  if (job.opt.frei)
    for (const id of String(job.opt.frei).split(','))
      if (save.towers[id]) {
        save.towers[id].u = 1;
        save.towers[id].l = Math.max(save.towers[id].l, +job.opt.freiStufe || 1);
      } // --frei mark: Turm für die Probe freischalten
  save.heroes = Object.assign(X.freshSave().heroes, save.heroes);
  if (save.nodes.f5 === 1 && !save.ver && X.NODES.f5.max > 1) save.nodes.f5 = X.NODES.f5.max; // wie loadSave: alte Stände behalten den vollen Heldenimpuls
  if (job.opt.knoten)
    for (const kv of String(job.opt.knoten).split(',')) {
      const [k, v] = kv.split('=');
      if (X.NODES[k]) save.nodes[k] = +v;
    } // --knoten b5c=5,u5c=5: Knotenstufen für die Probe setzen
  // --flotte jaeger=40,repair=0: Anteile der Drohnenklassen für die Probe setzen (schaltet die genannten Klassen frei)
  if (job.opt.flotte && save.fleet)
    for (const kv of String(job.opt.flotte).split(',')) {
      const [k, v] = kv.split('=');
      if (save.fleet[k]) {
        save.fleet[k].p = +v;
        if (+v > 0) save.fleet[k].u = 1;
      }
    }
  const S = X.stats(save);
  save.team = Object.keys(X.HEROES)
    .filter(id => save.heroes[id].u)
    .slice(0, S.slots);
  // --held kopfjaeger: ersetzt den letzten Helden im Team, mit dessen Stufe und Aufstieg
  if (job.opt.held && save.team.length)
    for (const id of String(job.opt.held).split(','))
      if (save.heroes[id] && !save.team.includes(id)) {
        const o = save.heroes[save.team[save.team.length - 1]];
        save.heroes[id] = { u: 1, l: o.l, a: o.a };
        save.team[save.team.length - 1] = id;
      }
  const pick = Math.max(1, Math.min(S.startMax, (save.best || 0) - 10));
  save.startPick = pick >= S.startMax ? 0 : pick;
  const r = playRun(X, save, job.opt);
  return {
    wave: r.w,
    sec: r.t,
    start: pick,
    tally: r.tally || null,
    built: r.droneIdx || 0,
    baseLeft: r.base.hp / r.base.max,
  };
}
module.exports = { prepare, simulate, benchmark, probe, candidates, WEIGHT };
