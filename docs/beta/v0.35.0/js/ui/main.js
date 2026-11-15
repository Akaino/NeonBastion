import { Music } from '../audio/music.js';
import { STAGE, VERSION } from '../core/version.js';
import { ACH, achTier } from './achievements.js';
import { buildPaused, endBuild, placing, updBuildBtn } from './build.js';
import { toast } from './common.js';
import { $, $$, UI } from './dom.js';
import { goHub } from './hub.js';
import { openWorlds } from './worlds.js';
import { musicState, showEnd, updHud } from './hud.js';
import { Perf, R, W, endShown, paused, persist, run, save, speed } from './state.js';

/* ---------- boot + loop ---------- */
if (save.pending && save.pending.g) {
  const ps = save.pending.world === 2 ? save.w2 : save;
  for (const c in save.pending.g) ps.cur[c] = (ps.cur[c] || 0) + (save.pending.g[c] || 0);
  ps.best = Math.max(ps.best || 0, save.pending.w || 0);
  ps.cycleBest = Math.max(ps.cycleBest || 0, save.pending.w || 0);
  save.pending = null;
  persist();
  setTimeout(() => toast('Belohnungen aus deinem letzten Run wurden gutgeschrieben'), 600);
}

R.setTheme(W.id);

document.documentElement.dataset.wtheme = W.id;

UI.host.dataset.wtheme = W.id;

$$('.ver').forEach(e => (e.textContent = 'Version ' + VERSION + (STAGE ? ' ' + STAGE : '')));

save.ver = VERSION;

if (!save.ach) {
  save.ach = {};
  for (const a of ACH) save.ach[a.id] = achTier(a);
  persist();
}

// Startseite ist die Weltenkarte (Vorgabe des Nutzers). Mit „#hub“ in der Adresse geht es direkt ins Menü der aktiven Welt.
if (location.hash === '#hub') goHub();
else openWorlds();

export let last = performance.now(),
  acc = 0,
  hudT = 0,
  pendT = 0;

export function loop(now) {
  const raw = now - last,
    dt = Math.min(0.1, raw / 1000);
  last = now;
  const pf = Perf.on,
    p0 = pf ? performance.now() : 0;
  let p1 = p0,
    p2 = p0,
    ns = 0;
  if (run && !paused && run.world === 2 && !buildPaused()) run.tickBuild(dt);
  if (run && !paused) {
    run.hw = R.hwe;
    run.hh = R.hhe;
    acc += buildPaused() ? 0 : dt * speed;
    let n = 0;
    while (acc >= 1 / 60 && n < 20) {
      run.step(1 / 60);
      acc -= 1 / 60;
      n++;
    }
    if (n >= 20) acc = 0;
    ns = n;
    if (run.over && buildPaused()) endBuild();
    if (run.over && run.overT > (run.quit ? 1.2 : 2.3) && !endShown) showEnd();
    pendT += dt;
    if (pendT > 2 && !run.over) {
      pendT = 0;
      save.pending = {
        world: W.id,
        g: Object.fromEntries(W.curIds.map(c => [c, Math.floor(run.gain[c] || 0)])),
        w: run.w,
      };
      persist();
    }
    if (pf) p1 = performance.now();
    hudT += dt;
    if (hudT > 0.1 && !Perf.freeze) {
      hudT = 0;
      updHud();
      updBuildBtn();
      musicState();
    }
  } else if (!run)
    Music.set({
      menu: true,
      E: 0,
      W: 0,
      danger: 0,
      boss: false,
      tr: W.id === 2 ? 5 : 0,
    });
  if (pf) p2 = performance.now();
  if (
    $('#tree').hidden &&
    $('#heroes').hidden &&
    $('#nova').hidden &&
    $('#towers').hidden &&
    $('#codex').hidden &&
    $('#achv').hidden &&
    $('#fleet').hidden &&
    !Perf.noDraw
  )
    R.buildMode = !!run && run.world === 2 && !run.over && placing(); // nur Gitterfestung
  R.frame(run, paused ? 0 : run && buildPaused() ? dt * 0.15 : dt * (run ? speed : 1));
  if (pf)
    Perf.frame(now, raw, {
      st: p1 - p0,
      hud: Math.max(0, p2 - p1),
      draw: performance.now() - p2,
      ns,
      en: run ? run.en.length : 0,
      w: run ? run.w : 0,
      sp: speed,
    });
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

export function setLast(v) {
  return (last = v);
}

export function setAcc(v) {
  return (acc = v);
}

export function setHudT(v) {
  return (hudT = v);
}

export function setPendT(v) {
  return (pendT = v);
}
