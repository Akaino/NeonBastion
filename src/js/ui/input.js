import { Snd } from '../audio/sound.js';
import { clamp } from '../core/util.js';
import {
  buildDown,
  buildSel,
  endBuild,
  ghostAt,
  moveT,
  openTower,
  screenToWorld,
  setBuildDown,
  towerAt,
  towerSel,
  trayOpen,
} from './build.js';
import { $ } from './dom.js';
import { R, W, paused, persist, run, save, setPaused } from './state.js';
import { treeHome } from './tree.js';

/* ---------- input ---------- */
$('#cv').addEventListener('pointerdown', e => {
  if (!run || paused || run.over || $('#hud').hidden) return;
  e.preventDefault();
  if (trayOpen || towerSel) {
    endBuild();
    return;
  }
  if (buildSel || moveT) {
    setBuildDown(true);
    ghostAt(e);
    return;
  }
  const [x, y] = screenToWorld(e);
  const T = towerAt(x, y);
  aimDown = true;
  aimDrag = false;
  aimStart = aimLast = [e.clientX, e.clientY];
  // Auf einem Turm: erst beim Loslassen entscheiden. Kurzes Antippen ohne Bewegung öffnet das Menü, Ziehen bewegt den Impuls-Zeiger.
  if (T) {
    towerTap = {
      T,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
    };
    return;
  }
  towerTap = null;
  if (e.pointerType === 'mouse') aimAt(e);
});
/* Zeiger für den Impuls. Klicken macht keinen Schaden mehr.
   Maus: der Zeiger folgt ihr direkt.
   Finger: wie ein Trackpad – Wischen irgendwo auf dem Feld schiebt den Zeiger um die gewischte Strecke × AIM_GAIN, damit der Finger nichts verdeckt.
   Kurzes Antippen ohne Bewegung setzt ihn direkt an die Stelle. Beim Loslassen bleibt er liegen. */

export /* Zeiger für den Impuls. Klicken macht keinen Schaden mehr.
   Maus: der Zeiger folgt ihr direkt.
   Finger: wie ein Trackpad – Wischen irgendwo auf dem Feld schiebt den Zeiger um die gewischte Strecke × AIM_GAIN, damit der Finger nichts verdeckt.
   Kurzes Antippen ohne Bewegung setzt ihn direkt an die Stelle. Beim Loslassen bleibt er liegen. */
let aimDown = false,
  aimDrag = false,
  aimStart = null,
  aimLast = null,
  aimPos = null,
  towerTap = null;

export const TAP_MOVE = 8,
  TAP_MS = 400,
  AIM_GAIN = 1.5;

export function aimBy(dx, dy) {
  if (!run || run.over) return;
  run.cx = clamp(run.cx + (dx / R.se) * AIM_GAIN, -run.hw, run.hw);
  run.cy = clamp(run.cy + (dy / R.se) * AIM_GAIN, -run.hh, run.hh);
  aimPos = [run.cx, run.cy];
}

export function aimAt(e) {
  if (!run || run.over) return;
  const [x, y] = screenToWorld(e);
  run.cx = clamp(x, -run.hw, run.hw);
  run.cy = clamp(y, -run.hh, run.hh);
  aimPos = [run.cx, run.cy];
}

$('#cv').addEventListener('pointermove', e => {
  if (!run || paused || buildSel || moveT || trayOpen || towerSel || $('#hud').hidden) return;
  if (towerTap) {
    if (Math.abs(e.clientX - towerTap.x) + Math.abs(e.clientY - towerTap.y) <= TAP_MOVE) return;
    towerTap = null;
  }
  if (e.pointerType === 'mouse') {
    aimAt(e);
    return;
  }
  if (!aimDown) return;
  if (!aimDrag) {
    if (Math.abs(e.clientX - aimStart[0]) + Math.abs(e.clientY - aimStart[1]) <= TAP_MOVE) return;
    aimDrag = true;
    aimLast = [e.clientX, e.clientY];
    return;
  }
  aimBy(e.clientX - aimLast[0], e.clientY - aimLast[1]);
  aimLast = [e.clientX, e.clientY];
});

$('#cv').addEventListener('pointerup', e => {
  const tt = towerTap;
  towerTap = null;
  if (tt) {
    if (run && !run.over && !paused && performance.now() - tt.t <= TAP_MS && run.towers.includes(tt.T)) openTower(tt.T);
    return;
  }
  if (
    aimDown &&
    !aimDrag &&
    e.pointerType !== 'mouse' &&
    run &&
    !paused &&
    !buildSel &&
    !moveT &&
    !trayOpen &&
    !towerSel
  )
    aimAt(e);
});

for (const ev of ['pointerup', 'pointercancel'])
  addEventListener(ev, () => {
    aimDown = false;
    towerTap = null;
  });

addEventListener('resize', () => {
  R.resize();
  if (run) {
    run.hw = R.hwe;
    run.hh = R.hhe;
  }
  if (!$('#tree').hidden) treeHome();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    if (Snd.ctx) Snd.ctx.resume().catch(() => {});
    return;
  }
  Snd.suspend();
  {
    if (run && !run.over) {
      setPaused(true);
      $('#pause').hidden = false;
      save.pending = {
        world: W.id,
        g: Object.fromEntries(W.curIds.map(c => [c, Math.floor(run.gain[c] || 0)])),
        w: run.w,
      };
    }
    persist();
  }
});

addEventListener('contextmenu', e => e.preventDefault());

/* ---------- before/after previews ---------- */

export function setAimDown(v) {
  return (aimDown = v);
}

export function setAimDrag(v) {
  return (aimDrag = v);
}

export function setAimStart(v) {
  return (aimStart = v);
}

export function setAimLast(v) {
  return (aimLast = v);
}

export function setAimPos(v) {
  return (aimPos = v);
}

export function setTowerTap(v) {
  return (towerTap = v);
}
