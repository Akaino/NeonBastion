import { Vol } from '../audio/music-data.js';
import { Store, loadSave } from '../core/save.js';
import { stats } from '../core/stats.js';
import { CUR_IDS } from '../data/currencies.js';
import { BR, NODES } from '../data/nodes.js';
import { TOWERS, TOWER_IDS, towerLvlCost } from '../data/towers.js';
import { Renderer } from '../render/Renderer.js';
import { Run } from '../run/Run.js';
import { $, UI } from './dom.js';
import { Run2 } from '../world2/Run2.js';
import { CUR_IDS2, T2_UNLOCK, TOWER_IDS2, towerLvlCost2 } from '../world2/data.js';
import { BR2, NODES2 } from '../world2/nodes.js';
import { w2Unlocked } from '../world2/save.js';
import { stats2 } from '../world2/stats.js';

export let save = loadSave(),
  run = null,
  paused = false,
  speed = save.speed || 1,
  endShown = false,
  selNode = 'root';

export const R = new Renderer($('#cv'));

Vol.mus = save.volMus;

Vol.sfx = save.volSfx;

/* ---------- icons ---------- */

/* ---------- Welten ---------- */
export const WORLDS = {
  1: {
    id: 1,
    name: 'Neon-Sektor',
    text: 'Helden, Drohnen und Türme verteidigen den Kern gegen endlose Wellen.',
    nodes: NODES,
    br: BR,
    curIds: CUR_IDS,
    s: () => save,
    st: () => stats(save),
    with: o =>
      stats({
        ...save,
        ...o,
      }),
    towerIds: TOWER_IDS,
    ts: () => save.towers,
    unlock: id => TOWERS[id].unlock,
    tlvl: towerLvlCost,
    Run: Run,
    col: '#3df5ff',
  },
  2: {
    id: 2,
    name: 'Gitterfestung',
    text: 'Nur Türme. Jede Welle kommt aus einer angekündigten Richtung, dazwischen baust du um.',
    nodes: NODES2,
    br: BR2,
    curIds: CUR_IDS2,
    s: () => save.w2,
    st: () => stats2(save),
    with: o =>
      stats2({
        ...save,
        w2: {
          ...save.w2,
          ...o,
        },
      }),
    towerIds: TOWER_IDS2,
    ts: () => save.w2.towers,
    unlock: id => T2_UNLOCK[id],
    tlvl: towerLvlCost2,
    Run: Run2,
    col: '#ff8a3d',
  },
};

export let W = WORLDS[save.world === 2 && w2Unlocked(save) ? 2 : 1];

export function setWorld(id) {
  save.world = id;
  W = WORLDS[id];
  persist();
  R.setTheme(id);
  document.documentElement.dataset.wtheme = id;
  UI.host.dataset.wtheme = id;
  selNode = 'root';
}
/* ---------- helpers ---------- */
/* Perf ist im echten Spiel nur ein leeres Objekt. Beta und Bottest füllen es in dev.js mit der Leistungsmessung. */

/* ---------- helpers ---------- */
/* Perf ist im echten Spiel nur ein leeres Objekt. Beta und Bottest füllen es in dev.js mit der Leistungsmessung. */
export const Perf = {
  on: false,
  noDraw: false,
  freeze: false,
  sv: 0,
};
// Gibt Grafik und Ton, was sie aus dem Spielstand brauchen (sie greifen nicht selbst darauf zu).

// Gibt Grafik und Ton, was sie aus dem Spielstand brauchen (sie greifen nicht selbst darauf zu).
export const syncSound = () => {
  Vol.mus = save.volMus;
  Vol.sfx = save.volSfx;
};

export const persist = () => {
  syncSound();
  if (!Perf.on) {
    Store.save(save);
    return;
  }
  const a = performance.now();
  Store.save(save);
  Perf.sv += performance.now() - a;
};

export function setRun(v) {
  return (run = v);
}

export function setPaused(v) {
  return (paused = v);
}

export function setSave(v) {
  return (save = v);
}

export function setEndShown(v) {
  return (endShown = v);
}

export function setSpeed(v) {
  return (speed = v);
}

export function setSelNode(v) {
  return (selNode = v);
}

export function setW(v) {
  return (W = v);
}
