import { Snd } from '../audio/sound.js';
import { fmtD, fmtN } from '../core/format.js';
import { hyp } from '../core/util.js';
import { TOWERS, TOWER_MAX, comboOf } from '../data/towers.js';
import { toast } from './common.js';
import { $, $$ } from './dom.js';
import { cmpRows } from './preview.js';
import { R, W, run, save } from './state.js';
import { Run2 } from '../world2/Run2.js';
import { stats2 } from '../world2/stats.js';

export /* ---------- Türme im Run: Bauen, Aufwerten, Verschieben, Abbauen ---------- */
// Solange gebaut oder ein Turm bearbeitet wird, ist das Spiel pausiert.
let buildSel = null,
  trayOpen = false,
  buildDown = false,
  moveT = null,
  towerSel = null;

export const buildPaused = () => !!(trayOpen || buildSel || moveT || towerSel);

export const BOLT =
  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>';

export function towerFxRows(id, l) {
  const ts =
      run && run.towerStats
        ? run.towerStats(id, l)
        : W.id === 2
          ? Run2.prototype.towerStats.call(
              {
                S: stats2(save),
              },
              id,
              l,
            )
          : {
              r: TOWERS[id].r(l),
              fx: TOWERS[id].fx(l),
            },
    f = ts.fx,
    r = ts.r;
  if (id === 'laser')
    return [
      ['Schaden pro Sekunde', fmtN(f.dps)],
      ['Reichweite', String(r)],
    ];
  if (id === 'rocket')
    return [
      ['Schaden pro Rakete', fmtN(f.dmg)],
      ['Explosionsradius', String(f.splash)],
      ['Reichweite', String(r)],
    ];
  if (id === 'tesla')
    return [
      ['Schaden pro Blitz', fmtN(f.dmg)],
      ['Ziele', String(f.chain + 1)],
      ['Reichweite', String(r)],
    ];
  if (id === 'mute')
    return [
      ['Wirkung', 'Fähigkeiten aus'],
      ['Radius', String(r)],
    ];
  if (id === 'mark')
    return [
      ['Impulsschaden', '+' + fmtD((f.mark - 1) * 100, 0) + ' %'],
      ['Radius', String(r)],
    ];
  if (id === 'frost')
    return [
      ['Verlangsamung', fmtD(f.slow * 100, 0) + ' %'],
      ['Radius', String(r)],
    ];
  if (id === 'weak')
    return [
      ['Gegner nehmen', `+${fmtD((f.vuln - 1) * 100, 0)} % Schaden`],
      ['Gegner verursachen', `−${fmtD((1 - f.weak) * 100, 0)} % Schaden`],
      ['Radius', String(r)],
    ];
  return [
    ['Einfrieren für', fmtD(f.dur, 1) + ' s'],
    ['Alle', fmtD(f.cd, 1) + ' s'],
    ['Radius', String(r)],
  ];
}

export function screenToWorld(e) {
  const r = $('#cv').getBoundingClientRect();
  return [(e.clientX - r.left - R.w / 2) / R.se, (e.clientY - r.top - R.h / 2) / R.se];
}

export function setPauseBadge() {
  const on = buildPaused() && run && !run.over;
  $('#buildPause').hidden = !on;
}

export function updBuildBtn() {
  if (!run) return;
  const b = $('#bBuild'),
    free = run.towers.length < run.towerSlots();
  if (!b.dataset.init) {
    b.innerHTML = `<span>Bauen</span><small>${BOLT}<i></i></small>`;
    b.dataset.init = '1';
  }
  const ei = b.querySelector('i'),
    et = fmtN(run.energy);
  if (ei.textContent !== et) ei.textContent = et;
  const cheap = free && W.towerIds.some(id => W.ts()[id].u && run.energy >= run.buildCost(id));
  b.classList.toggle('ping', cheap && !buildPaused());
}

export function endBuild() {
  trayOpen = false;
  buildSel = null;
  moveT = null;
  towerSel = null;
  buildDown = false;
  R.ghost = null;
  R.selTower = null;
  $('#tray').hidden = true;
  $('#tpanel').hidden = true;
  $('#buildHint').hidden = true;
  setPauseBadge();
  updBuildBtn();
}

export function openTray() {
  if (!run || run.over) return;
  endBuild();
  trayOpen = true;
  renderTray();
  $('#tray').hidden = false;
  setPauseBadge();
}

export function renderTray() {
  const n = run.towers.length,
    max = run.towerSlots();
  $('#trayHead').innerHTML =
    `<b>Turm bauen</b><span>${n} / ${max} Plätze</span><span class="en">${BOLT}${fmtN(run.energy)}</span>`;
  $('#trayList').innerHTML =
    W.towerIds
      .filter(id => W.ts()[id].u)
      .map(id => {
        const T = TOWERS[id],
          c = run.buildCost(id),
          ok = run.energy >= c && n < max;
        return `<button class="btn tcard ${ok ? '' : 'poor'}" data-bt="${id}" style="--c:${T.col}"><canvas data-t="${id}" width="72" height="72"></canvas><b>${T.name.replace('-Turm', '')}</b><small>${BOLT}${fmtN(c)}</small></button>`;
      })
      .join('') || '<p class="hint">Noch kein Turm freigeschaltet.</p>';
  $$('#trayList canvas[data-t]').forEach(cv => {
    const id = cv.dataset.t;
    cv.getContext('2d').drawImage(R.towerSprite(id, TOWERS[id].col), 0, 0, 72, 72);
  });
}

$('#bBuild').onclick = () => {
  trayOpen ? endBuild() : openTray();
};

$('#bTrayClose').onclick = endBuild;

$('#trayList').addEventListener('click', e => {
  const b = e.target.closest('[data-bt]');
  if (!b) return;
  const id = b.dataset.bt,
    c = run.buildCost(id);
  if (run.towers.length >= run.towerSlots()) {
    Snd.play('no');
    toast('Alle Bauplätze belegt. Mehr gibt es im Turm-Menü.');
    return;
  }
  if (run.energy < c) {
    Snd.play('no');
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
    toast(`Dir fehlen ${fmtN(c - run.energy)} Energie`);
    return;
  }
  trayOpen = false;
  $('#tray').hidden = true;
  buildSel = id;
  $('#buildHint').hidden = false;
  $('#buildHintT').textContent = `Tippe aufs Spielfeld, um den ${TOWERS[id].name} zu platzieren`;
  setPauseBadge();
});

$('#bBuildCancel').onclick = () => {
  const t = moveT;
  endBuild();
  if (t) openTower(t);
};

export function ghostAt(e) {
  const [x, y] = screenToWorld(e),
    T = moveT,
    type = T ? T.type : buildSel,
    l = T ? T.l : W.ts()[type].l;
  R.ghost = {
    type,
    x,
    y,
    r: run.towerStats(type, l).r,
    ok: run.canPlace(x, y, T),
  };
}
/* Turm-Menü im Run */

export /* Turm-Menü im Run */
function openTower(T) {
  endBuild();
  towerSel = T;
  R.selTower = T;
  renderTpanel();
  $('#tpanel').hidden = false;
  setPauseBadge();
}

export function renderTpanel() {
  const T = towerSel,
    D = TOWERS[T.type],
    max = T.l >= TOWER_MAX,
    c = max ? 0 : run.upCost(T),
    nx = max ? null : towerFxRows(T.type, T.l + 1);
  const rows = [
    ['Stufe', String(T.l), max ? undefined : String(T.l + 1)],
    ...towerFxRows(T.type, T.l).map(([a, b], i) => [a, b, nx ? nx[i][1] : undefined]),
  ];
  $('#tpanel').innerHTML =
    `<div class="tp-head" style="--c:${D.col}"><canvas width="64" height="64"></canvas><div><b>${D.name}</b><small>${D.text}</small></div><span class="en">${BOLT}${fmtN(run.energy)}</span></div>
    ${cmpRows(rows, D.col)}${(() => {
      const cs = [
        ...new Set(
          run.towers
            .filter(o => o !== T && hyp(o.x - T.x, o.y - T.y) < o.r + T.r)
            .map(o => comboOf(T.type, o.type))
            .filter(Boolean),
        ),
      ];
      return cs.length
        ? `<div class="combos">${cs.map(cb => `<span style="--c:${cb.col}"><b>${cb.name}</b> ${cb.text}</span>`).join('')}</div>`
        : '<p class="trayinfo">Überschneide den Radius mit anderen Türmen für Kombinationseffekte.</p>';
    })()}
    <div class="tp-act">${max ? '<button class="btn" disabled>Maximal ausgebaut</button>' : `<button class="btn ${run.energy >= c ? '' : 'poor'}" id="tpUp" style="--c:${D.col}">Aufwerten<small>${BOLT}${fmtN(c)}</small></button>`}
      <button class="btn ${run.world === 2 && (run.phase !== 'build' || run.moves <= 0) ? 'poor' : ''}" id="tpMove" style="--c:#9b98c8">Verschieben<small>${run.world === 2 ? (run.phase === 'build' ? `1 Umbaupunkt · noch ${run.moves}` : 'nur in der Umbauphase') : 'kostenlos'}</small></button>
      <button class="btn" id="tpSell" style="--c:#ff4f6d">Abbauen<small>${BOLT}+${fmtN(run.refund(T))}</small></button></div>
    <button class="btn" id="tpClose" style="--c:var(--muted)">Weiterspielen</button>`;
  $('#tpanel canvas').getContext('2d').drawImage(R.towerSprite(T.type, D.col), 0, 0, 64, 64);
  const up = $('#tpUp');
  if (up)
    up.onclick = () => {
      if (run.upgradeTower(T)) {
        renderTpanel();
        updBuildBtn();
      } else {
        Snd.play('no');
        up.classList.remove('shake');
        void up.offsetWidth;
        up.classList.add('shake');
        toast(`Dir fehlen ${fmtN(run.upCost(T) - run.energy)} Energie`);
      }
    };
  $('#tpMove').onclick = () => {
    if (run.world === 2 && (run.phase !== 'build' || run.moves <= 0)) {
      Snd.play('no');
      toast(
        run.phase !== 'build' ? 'Verschieben geht nur in der Umbauphase' : 'Keine Umbaupunkte mehr in dieser Pause',
      );
      return;
    }
    towerSel = null;
    $('#tpanel').hidden = true;
    moveT = T;
    R.selTower = T;
    $('#buildHint').hidden = false;
    $('#buildHintT').textContent = 'Tippe auf den neuen Platz für den Turm';
    setPauseBadge();
  };
  $('#tpSell').onclick = () => {
    run.sellTower(T);
    endBuild();
  };
  $('#tpClose').onclick = endBuild;
}
/* Eingabe aufs Spielfeld */

/* Eingabe aufs Spielfeld */
$('#cv').addEventListener('pointermove', e => {
  if ((buildSel || moveT) && run && (buildDown || e.pointerType === 'mouse')) ghostAt(e);
});

$('#cv').addEventListener('pointerup', e => {
  if (!(buildSel || moveT) || !buildDown) return;
  buildDown = false;
  const [x, y] = screenToWorld(e);
  if (moveT) {
    const T = moveT;
    if (run.moveTower(T, x, y)) {
      endBuild();
      openTower(T);
    } else {
      Snd.play('no');
      toast('Hier kann der Turm nicht stehen');
      if (e.pointerType !== 'mouse') R.ghost = null;
    }
    return;
  }
  if (run.place(buildSel, x, y)) {
    endBuild();
  } else {
    Snd.play('no');
    toast(run.canPlace(x, y) ? 'Nicht genug Energie' : 'Hier kann kein Turm stehen');
    if (e.pointerType !== 'mouse') R.ghost = null;
  }
});

export function towerAt(x, y) {
  let best = null,
    bd = (26 / R.zoom) ** 2;
  for (const T of run.towers) {
    const d = (T.x - x) ** 2 + (T.y - y) ** 2;
    if (d < bd) {
      bd = d;
      best = T;
    }
  }
  return best;
}

/* ---------- Türme: Menü ---------- */

export function setBuildDown(v) {
  return (buildDown = v);
}

export function setBuildSel(v) {
  return (buildSel = v);
}

export function setTrayOpen(v) {
  return (trayOpen = v);
}

export function setMoveT(v) {
  return (moveT = v);
}

export function setTowerSel(v) {
  return (towerSel = v);
}
