import { Snd } from '../audio/sound.js';
import { fmtD } from '../core/format.js';
import { show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { goHub } from './hub.js';
import { W, WORLDS, save, setWorld } from './state.js';
import { WORLD_MAX, w2Unlocked, worldUnlockWave } from '../world2/save.js';
import { w2BonusForW1 } from '../world2/stats.js';

$('#bWorlds').onclick = () => {
  show('worlds');
  renderWorlds();
};

export function futureWorlds() {
  let rows = '';
  for (let id = 3; id <= WORLD_MAX; id++) {
    const w = worldUnlockWave(id);
    rows += `<div><span>Welt ${id}</span><b>${(save.best || 0) >= w ? 'erreicht · in Arbeit' : `ab Welle ${w}`}</b></div>`;
  }
  return `<article class="hcard world lock" style="--c:#c7b8ff"><h3>Weitere Welten</h3><p>Alle 100 Wellen im Neon-Sektor öffnet sich eine neue Welt. Die Welten 3 bis ${WORLD_MAX} sind noch in Arbeit.</p><div class="cmp" style="--c:#c7b8ff">${rows}</div></article>`;
}

export function renderWorlds() {
  const un2 = w2Unlocked(save),
    b1 = w2BonusForW1(save),
    b2 = 1 + 0.01 * (save.best || 0);
  $('#wlist').innerHTML =
    [1, 2]
      .map(id => {
        const Wd = WORLDS[id],
          ok = id === 1 || un2,
          act = W.id === id,
          best = id === 1 ? save.best : save.w2.best;
        const bonus =
          id === 1
            ? `Bonus aus der Gitterfestung: ×${fmtD(b1, 2)} Schaden`
            : `Bonus aus dem Neon-Sektor: ×${fmtD(b2, 2)} Turmschaden`;
        return `<article class="hcard world ${ok ? '' : 'lock'}" style="--c:${Wd.col}"><h3>${Wd.name}</h3><p>${Wd.text}</p>
      <div class="cmp" style="--c:${Wd.col}"><div><span>Rekord</span><b>Welle ${best || 0}</b></div><div><span>Weltenbonus</span><b>${bonus.split(': ')[1]}</b></div></div>
      <p class="trayinfo">${bonus.split(': ')[0]}. ${id === 1 ? 'Jede Welle Rekord in der Gitterfestung gibt hier +2 % Schaden.' : 'Jede Welle Rekord im Neon-Sektor gibt hier +1 % Turmschaden.'}</p>
      ${ok ? (act ? '<button class="btn" disabled>Aktive Welt</button>' : `<button class="btn big" data-world="${id}" style="--c:${Wd.col}">Welt betreten</button>`) : `<button class="btn poor" disabled>Freischaltung bei Welle ${worldUnlockWave(id)} im Neon-Sektor</button>`}</article>`;
      })
      .join('') + futureWorlds();
  $$('[data-world]').forEach(
    b =>
      (b.onclick = () => {
        setWorld(+b.dataset.world);
        Snd.play('nova');
        goHub();
        toast(`Willkommen in: ${W.name}`);
      }),
  );
}
/* ---------- Flotte: Drohnenklassen freischalten, aufwerten und ihre Verteilung einstellen ---------- */
