import { verNum } from './util.js';
import { LIVE_KEY, STAGE } from './version.js';
import { F5_MAX } from '../data/balance.js';
import { freshFleet } from '../data/drones.js';
import { freshW2 } from '../world2/save.js';
import { freshW5, loadW5 } from '../world5/save.js';

export function freshSave() {
  return {
    w2: typeof freshW2 !== 'undefined' ? freshW2() : null,
    w5: freshW5(), // Welt 5 (Expedition): eigener Teil des Spielstands
    v: 2,
    cur: {
      s: 0,
      k: 0,
      p: 0,
      d: 0,
    },
    nodes: {
      root: 1,
    },
    heroes: {
      klinge: {
        u: 0,
        l: 1,
        a: 0,
      },
      schuetzin: {
        u: 0,
        l: 1,
        a: 0,
      },
      arkanist: {
        u: 0,
        l: 1,
        a: 0,
      },
      waechterin: {
        u: 0,
        l: 1,
        a: 0,
      },
      kopfjaeger: {
        u: 0,
        l: 1,
        a: 0,
      },
      ingenieurin: {
        u: 0,
        l: 1,
        a: 0,
      },
    },
    team: [],
    best: 0,
    runs: 0,
    pending: null,
    snd: 1,
    mus: 1,
    volMus: 70,
    volSfx: 80,
    speed: 1,
    world: 1,
    w2test: false,
    dev: false,
    dropsUsed: 0,
    devStart: 0,
    devShiny: false,
    devDrop: false,
    devPerf: false,
    towers: {
      frost: {
        u: 1,
        l: 1,
      },
      weak: {
        u: 0,
        l: 1,
      },
      cryo: {
        u: 0,
        l: 1,
      },
      mute: {
        u: 0,
        l: 1,
      },
      mark: {
        u: 0,
        l: 1,
      },
    },
    tslots: 0,
    fleet: freshFleet(),
    kills: {},
    ach: null,
    q: 0,
    pr: {},
    nova: 0,
    cycleBest: 0,
  };
}

// Vorschau-Stufen, erkannt am Pfad: /beta/ (zum Testen freigegeben) und /bottest/ (Arbeitsstand, kann unfertig sein).
// Jede Stufe hat einen eigenen Spielstand, damit Tests den echten Fortschritt nie berühren. In Node (Simulation) gibt es kein location.

export const Store = {
  key: STAGE ? 'neon-bastion-' + STAGE.toLowerCase() : LIVE_KEY,
  load() {
    try {
      const t = localStorage.getItem(this.key);
      return t ? JSON.parse(t) : null;
    } catch (e) {
      return null;
    }
  },
  save(o) {
    try {
      localStorage.setItem(this.key, JSON.stringify(o));
    } catch (e) {}
  },
};

export function loadSave() {
  const f = freshSave(),
    s = Store.load();
  if (!s) return f;
  const o = Object.assign(f, s);
  o.cur = Object.assign(freshSave().cur, s.cur || {});
  o.nodes = Object.assign(
    {
      root: 1,
    },
    s.nodes || {},
  );
  if (o.nodes.f5 === 1 && verNum(s.ver) < verNum('0.27.0')) o.nodes.f5 = F5_MAX;
  o.heroes = Object.assign(freshSave().heroes, s.heroes || {});
  if (s.volMus === undefined) o.volMus = s.mus === 0 ? 0 : 70;
  if (s.volSfx === undefined) o.volSfx = s.snd === 0 ? 0 : 80;
  o.towers = Object.assign(freshSave().towers, s.towers || {});
  o.tslots = s.tslots || 0;
  o.fleet = Object.assign(freshFleet(), s.fleet || {});
  // Spielstände von vor der Flotte: wer „Mutterschiff“ hatte, bekam jede vierte Drohne als Kampfschiff – das entspricht etwa 20 % Kreuzern
  if (!s.fleet && o.nodes.u5) {
    o.fleet.jaeger.p = 80;
    o.fleet.kreuzer.p = 20;
  }
  o.pr = Object.assign({}, s.pr || {});
  o.w2 = Object.assign(freshW2(), s.w2 || {});
  o.w2.cur = Object.assign(
    {
      c: 0,
      m: 0,
    },
    (s.w2 && s.w2.cur) || {},
  );
  o.w2.towers = Object.assign(freshW2().towers, (s.w2 && s.w2.towers) || {});
  o.w2.nodes = Object.assign(
    {
      root: 1,
    },
    (s.w2 && s.w2.nodes) || {},
  );
  o.w5 = loadW5(s.w5);
  if (s.cycleBest === undefined) o.cycleBest = s.best || 0;
  if (!s.v || s.v < 2) {
    for (const id of ['klinge', 'schuetzin']) {
      const h = o.heroes[id];
      if (h.u && h.l === 1 && h.a === 0) h.u = 0;
    }
    o.team = o.team.filter(id => o.heroes[id] && o.heroes[id].u);
    o.v = 2;
  }
  return o;
}
