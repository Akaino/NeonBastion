// Neon Bastion – Simulation der Gitterfestung (Welt 2)
// In Welt 2 stehen Anzahl, Typen und Richtung jeder Welle fest (wave2 in src/js/world2/enemies.js). Der Bot kennt die Richtung der
// nächsten Welle wie der Spieler aus der Vorschau und stellt seine Türme danach auf. Verglichen werden Aufstellungen („Varianten“):
// Bauweise, Abstand zum Kern, Reihenfolge der Turmarten, erlaubte Äste des Skilltrees.
// Der Neon-Sektor wird hier nicht berührt; sein Bot steht in bot2.js.
const bot = require('./bot2.js');

const W2 = { c: 1, m: 40 }, // grober Wert der Währungen in Schaltkreisen, nur für die Kaufregel „billig“
  SUPPORT = ['frost', 'weak', 'cryo'];
const norm = a => Math.atan2(Math.sin(a), Math.cos(a));

/* ---------- Aufstellung ---------- */
// Wunschplätze für n Türme. richtung: fächerförmig vor der Richtung, aus der die Welle kommt (bei zwei Richtungen abwechselnd).
// ring: gleichmäßig um den Kern. Abstand = Entfernung der Schadenstürme vom Kern; Unterstützungstürme stehen etwas weiter außen.
function spots(r, opt, n) {
  const rho = opt.abstand,
    out = [];
  if (opt.bau === 'ring') {
    for (let i = 0; i < n; i++) out.push([(i * 2 * Math.PI) / Math.max(n, 3) - Math.PI / 2, rho]);
    return out;
  }
  const step = 42 / rho,
    per = {};
  for (let i = 0; i < n; i++) {
    const d = i % r.dirs.length,
      k = (per[d] = (per[d] || 0) + 1) - 1,
      off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * step;
    out.push([r.dirs[d] + off, rho]);
  }
  return out;
}
const xy = (a, rho) => [Math.cos(a) * rho, Math.sin(a) * rho];
// Platz nahe dem Wunschplatz suchen, an dem gebaut werden darf
function freeNear(r, a, rho, ign) {
  for (let k = 0; k < 14; k++) {
    const [x, y] = xy(a + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.16, rho + Math.floor(k / 5) * 26);
    const cx = Math.max(-r.hw + 14, Math.min(r.hw - 14, x)),
      cy = Math.max(-r.hh + 14, Math.min(r.hh - 14, y));
    if (r.canPlace(cx, cy, ign)) return [cx, cy];
  }
  return null;
}

// Bauen, Verschieben, Aufwerten. build = true in der Umbauphase (nur dann darf verschoben werden).
function manage(X, r, opt, build) {
  const types = opt.tuerme.filter(t => r.tsave[t] && r.tsave[t].u),
    slots = r.towerSlots();
  if (!types.length) return;
  // 1) Verschieben: Türme, die weit von der kommenden Richtung stehen, auf freie Wunschplätze setzen
  if (build && opt.bau === 'richtung' && r.moves > 0 && r.towers.length) {
    const want = spots(r, opt, r.towers.length),
      far = T => Math.min(...r.dirs.map(d => Math.abs(norm(Math.atan2(T.y, T.x) - d))));
    const order = r.towers.slice().sort((a, b) => far(b) - far(a));
    for (const T of order) {
      if (r.moves <= 0 || far(T) < 0.9) break;
      const w = want.find(
        ([a, rho]) => !r.towers.some(o => o !== T && Math.hypot(o.x - xy(a, rho)[0], o.y - xy(a, rho)[1]) < 34),
      );
      if (!w) break;
      const p = freeNear(r, w[0], w[1] + (SUPPORT.includes(T.type) ? 26 : 0), T);
      if (!p || !r.moveTower(T, p[0], p[1])) break;
    }
  }
  // 2) Bauen, solange Plätze frei sind und die Energie reicht
  for (let guard = 0; guard < 12 && r.towers.length < slots; guard++) {
    const ty = types[r.towers.length % types.length];
    if (r.energy < r.buildCost(ty)) break;
    const [a, rho] = spots(r, opt, r.towers.length + 1)[r.towers.length],
      p = freeNear(r, a, rho + (SUPPORT.includes(ty) ? 26 : 0));
    if (!p || !r.place(ty, p[0], p[1])) break;
  }
  // 3) Aufwerten: immer den günstigsten Ausbau; „schaden“ wertet zuerst Schadenstürme auf
  for (let guard = 0; guard < 40; guard++) {
    if (r.towers.length < slots && r.energy < r.buildCost(types[r.towers.length % types.length]) && opt.sparen) break; // für den nächsten Turm sparen
    let pool = r.towers.filter(T => T.l < X.TOWER_MAX);
    if (opt.ausbau === 'schaden' && pool.some(T => X.TOWERS[T.type].dmgTower))
      pool = pool.filter(T => X.TOWERS[T.type].dmgTower);
    const T = pool.sort((a, b) => r.upCost(a) - r.upCost(b))[0];
    if (!T || r.energy < r.upCost(T) || !r.upgradeTower(T)) break;
  }
}

/* ---------- ein Run ---------- */
function playRun2(X, save, opt) {
  const r = new X.Run2(save, {});
  r.headless = true;
  r.hw = 330;
  r.hh = 700;
  let t = 0,
    act = 0,
    stuns = 0,
    downT = 0;
  const st0 = r.stunTower.bind(r);
  r.stunTower = (T, s, c) => {
    if (s > (T.stun || 0)) stuns++;
    st0(T, s, c);
  };
  while (!r.over && t < opt.maxRunSec) {
    if (r.phase === 'build') {
      manage(X, r, opt, true);
      r.startFight();
      t += opt.bauzeit; // so lange braucht ein Mensch je Umbauphase
    }
    r.step(opt.dt);
    t += opt.dt;
    for (const T of r.towers) if (T.jam) downT += opt.dt;
    if ((act -= opt.dt) <= 0) {
      act = 1;
      manage(X, r, opt, false);
    }
  }
  if (!r.over) r.end();
  return {
    w: r.w,
    sec: t,
    c: Math.floor(r.gain.c || 0),
    m: Math.floor(r.gain.m || 0),
    stuns,
    downT,
    towers: r.towers.length,
  };
}

/* ---------- Käufe zwischen den Runs ---------- */
function options2(X, save, opt) {
  const w = save.w2,
    o = [];
  for (const n of Object.values(X.NODES2)) {
    if (!n.parent || (opt.aeste && !opt.aeste.includes(n.br))) continue;
    const l = w.nodes[n.id] || 0;
    if (l >= n.max || (!l && !(w.nodes[n.parent] > 0))) continue;
    o.push({ id: n.id, name: n.name, cur: n.cur, cost: X.nodeCost(n, l), apply: () => (w.nodes[n.id] = l + 1) });
  }
  for (const id of opt.tuerme) {
    const T = w.towers[id];
    if (!T) continue;
    if (!T.u) {
      const u = X.T2_UNLOCK[id];
      if (u)
        o.push({
          id: 'frei:' + id,
          name: X.TOWERS[id].name + ' freischalten',
          cur: u[0],
          cost: u[1],
          apply: () => (T.u = 1),
        });
    } else if (T.l < X.TOWER_MAX) {
      const [c, a] = X.towerLvlCost2(T.l);
      o.push({ id: 'stufe:' + id, name: X.TOWERS[id].name + ' Startstufe', cur: c, cost: a, apply: () => T.l++ });
    }
  }
  return o;
}
function buy2(X, save, opt, spend) {
  const w = save.w2;
  for (let guard = 0; guard < 2000; guard++) {
    const o = options2(X, save, opt)
      .filter(x => w.cur[x.cur] >= x.cost)
      .sort((a, b) => a.cost * W2[a.cur] - b.cost * W2[b.cur])[0];
    if (!o) break;
    w.cur[o.cur] -= o.cost;
    o.apply();
    const k = o.id.split(':')[0];
    const g = k === 'frei' || k === 'stufe' ? 'Türme' : 'Ast ' + X.NODES2[o.id].br;
    spend[g] = (spend[g] || 0) + o.cost * W2[o.cur];
  }
}

/* ---------- Karriere einer Variante ---------- */
// job: { seed, bau, abstand, tuerme[], aeste, ausbau, sparen, ziel, stunden, maxruns, bauzeit, pause, dt, maxRunSec }
function career2(job) {
  const X = bot.loadGame(job.seed, job.src);
  const save = X.freshSave(),
    w = save.w2,
    spend = {},
    marks = {},
    rows = [];
  let sec = 0,
    runs = 0,
    stuns = 0,
    down = 0,
    towerSec = 0;
  while ((w.best || 0) < job.ziel && sec < job.stunden * 3600 && runs < job.maxruns) {
    buy2(X, save, job, spend);
    const r = playRun2(X, save, job);
    runs++;
    sec += r.sec + job.pause;
    w.cur.c += r.c;
    w.cur.m += r.m;
    w.runs = (w.runs || 0) + 1;
    stuns += r.stuns;
    down += r.downT;
    towerSec += r.sec * Math.max(1, r.towers);
    const prev = w.best || 0;
    w.best = Math.max(prev, r.w);
    for (const m of [10, 20, 25, 30, 40, 50, 60, 75, 100, 150]) if (m <= w.best && !marks[m]) marks[m] = { sec, runs };
    rows.push({ run: runs, w: r.w, sec: Math.round(sec), c: r.c, m: r.m, stuns: r.stuns });
  }
  return {
    job,
    best: w.best || 0,
    sec,
    runs,
    marks,
    rows,
    spend,
    stuns,
    downPct: (100 * down) / Math.max(1, towerSec),
  };
}

// Probe: ein fester Spielstand (alle Knoten und Türme auf vorgegebener Stufe), mehrere Runs je Variante – Sekunden statt Minuten
function probe2(job) {
  const X = bot.loadGame(job.seed, job.src);
  const out = [];
  for (let i = 0; i < job.runs; i++) {
    const save = X.freshSave(),
      w = save.w2;
    for (const n of Object.values(X.NODES2))
      if (n.parent) w.nodes[n.id] = Math.min(n.max, Math.round((n.max * job.stand) / 100));
    for (const id of job.tuerme)
      if (w.towers[id])
        Object.assign(w.towers[id], { u: 1, l: Math.max(1, Math.round((X.TOWER_MAX * job.stand) / 100)) });
    out.push(playRun2(X, save, job));
  }
  return { job, runs: out };
}

module.exports = { career2, probe2, playRun2 };
