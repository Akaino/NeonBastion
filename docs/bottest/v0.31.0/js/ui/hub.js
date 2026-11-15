import { fmtN } from '../core/format.js';
import { stats } from '../core/stats.js';
import { clamp } from '../core/util.js';
import { HEROES, HERO_IDS } from '../data/heroes.js';
import { NOVA_MIN, PRES, presCost, quantaFor } from '../data/prestige.js';
import { canPay, curIcon, renderCurs, show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { R, W, paused, persist, run, save, setPaused, setRun } from './state.js';
import { nodeState, renderSheet } from './tree.js';
import { w2Unlocked } from '../world2/save.js';

export /* ---------- Startwelle wählen ---------- */
function startStepper() {
  const S = stats(save);
  return `<div class="stepper"><span>Gewählte Startwelle</span><button class="btn icon sm" data-sw="-1" aria-label="Früher starten">−</button><b>${S.startWave}</b><button class="btn icon sm" data-sw="1" aria-label="Später starten">+</button><small>max. ${S.startMax}</small></div>`;
}

export function bindStepper() {
  $$('[data-sw]').forEach(
    b =>
      (b.onclick = () => {
        const S = stats(save);
        let v = S.startWave + +b.dataset.sw * 2;
        v = clamp(v, 1, S.startMax);
        save.startPick = v >= S.startMax ? 0 : v;
        persist();
        if (!$('#tree').hidden) renderSheet();
        renderHub();
      }),
  );
}
/* ---------- hub ---------- */

export /* ---------- hub ---------- */
function renderHub() {
  R.hubNodes = save.nodes;
  renderCurs();
  const w1 = W.id === 1;
  $('#hubWorld').textContent = W.name;
  $('#bHeroes').hidden = !w1;
  $('#bFleet').hidden = !w1;
  $('#bWorlds').hidden = !w2Unlocked(save);
  const treeAff = Object.values(W.nodes).some(n => n.id !== 'root' && nodeState(n).aff),
    heroAff = w1 && HERO_IDS.some(id => !save.heroes[id].u && canPay(...HEROES[id].unlock));
  $('#bTree').classList.toggle('ping', treeAff);
  $('#bHeroes').classList.toggle('ping', heroAff);
  {
    const S = stats(save),
      hs = $('#hubStart');
    if (w1 && S.startMax > 1) {
      hs.hidden = false;
      hs.innerHTML = startStepper();
      bindStepper();
    } else hs.hidden = true;
  }
  $('#bTowers').classList.toggle(
    'ping',
    W.towerIds.some(id => !W.ts()[id].u && W.unlock(id) && canPay(...W.unlock(id))),
  );
  const nb = $('#bNova'),
    qg = quantaFor(save.cycleBest, save);
  nb.hidden = !w1 || !(save.best >= 20 || save.nova > 0);
  nb.innerHTML =
    qg > 0
      ? `Supernova<small>${curIcon('q')} +${fmtN(qg)} Quanten möglich</small>`
      : `Supernova<small>ab Welle ${NOVA_MIN} in diesem Zyklus</small>`;
  nb.classList.toggle('ping', qg > 0 && Object.values(PRES).some(p => save.q + qg >= presCost(p, save.pr[p.id] || 0)));
  const bw = W.s().best;
  $('#hubBest').textContent = bw ? `Rekord: Welle ${bw}` : W.text;
}

export function goHub() {
  const wasRun = !!run;
  setRun(null);
  setPaused(false);
  show('hub');
  renderHub();
  if (wasRun && W.id === 1 && !HERO_IDS.some(id => save.heroes[id].u) && canPay(...HEROES.klinge.unlock))
    setTimeout(() => toast('Du kannst jetzt deinen ersten Helden freischalten'), 400);
}

$$('[data-back]').forEach(b => (b.onclick = goHub));

/* ---------- run ---------- */
