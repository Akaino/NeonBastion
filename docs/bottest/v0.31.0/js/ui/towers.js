import { fmtN } from '../core/format.js';
import { COMBOS, SLOT_BASE, SLOT_EXTRA, TOWERS, TOWER_MAX, slotCost } from '../data/towers.js';
import { towerFxRows } from './build.js';
import { canPay, costBtn, pay, renderCurs, show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { cmpRows } from './preview.js';
import { R, W, persist, save } from './state.js';
import { stats2 } from '../world2/stats.js';

export /* ---------- Türme: Menü ---------- */
function renderTowers() {
  renderCurs();
  const ex = save.tslots || 0,
    TS = W.ts();
  let sl = `<div class="slotinfo"><b>${W.id === 1 ? SLOT_BASE + ex : stats2(save).slots2}</b> Bauplätze pro Run${W.id === 2 ? ' · mehr über „Bauplätze“ im Skilltree' : ''}</div>`;
  if (W.id === 1 && ex < SLOT_EXTRA) {
    const [c, a] = slotCost(ex);
    sl += `<button class="btn ${canPay(c, a) ? '' : 'poor'}" id="bSlot" style="--c:#ff4fd8">${costBtn('Bauplatz kaufen', c, a)}</button>`;
  }
  $('#tslots').innerHTML = sl;
  $('#tlist').innerHTML = W.towerIds
    .map(id => {
      const T = TOWERS[id],
        st = TS[id];
      let act = '',
        rows;
      if (!st.u) {
        const [c, a] = W.unlock(id);
        act = `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-tu="${id}" style="--c:${T.col}">${costBtn('Freischalten', c, a)}</button>`;
        rows = towerFxRows(id, st.l).map(([a, b]) => [a, b]);
      } else {
        const nx = st.l < TOWER_MAX ? towerFxRows(id, st.l + 1) : null;
        rows = [
          ['Startstufe', String(st.l), nx ? String(st.l + 1) : undefined],
          ...towerFxRows(id, st.l).map(([a, b], i) => [a, b, nx ? nx[i][1] : undefined]),
        ];
        if (st.l < TOWER_MAX) {
          const [c, a] = W.tlvl(st.l);
          act = `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-tl="${id}" style="--c:${T.col}">${costBtn('Aufwerten', c, a)}</button>`;
        } else act = '<button class="btn" disabled>Maximal ausgebaut</button>';
      }
      return `<article class="hcard ${st.u ? '' : 'lock'}" style="--c:${T.col}"><div class="hc-top"><canvas data-t="${id}" width="112" height="112"></canvas><div><h3>${T.name}</h3><small>${st.u ? `Startstufe ${st.l} / ${TOWER_MAX}` : 'Gesperrt'} · Bauen kostet ${fmtN(T.cost)} Energie</small></div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${T.text}</p>${cmpRows(rows, T.col)}<div class="hc-act">${act}</div></article>`;
    })
    .join('');
  $('#tlist').insertAdjacentHTML(
    'beforeend',
    `<article class="hcard" style="--c:#c7b8ff"><h3 style="margin:0">Kombinationen</h3><p style="margin:0;color:var(--muted);font-size:13px">Überschneiden sich die Radien mehrerer Türme, addieren sich ihre Effekte (maximal drei Türme). In den Überschneidungen entstehen zusätzliche Effekte, bei drei gleichen Türmen 50 % stärker.</p><div class="combos">${COMBOS.filter(
      cb => W.id === 2 || cb.bit,
    )
      .map(cb => {
        const ok = cb.need.every(t => TS[t] && TS[t].u);
        return `<span style="--c:${cb.col}" class="${ok ? '' : 'off'}"><b>${cb.name}</b> <em>${cb.need.map(t => TOWERS[t].name.replace('-Turm', '')).join(' + ')}</em> ${ok ? cb.text : 'Noch nicht verfügbar.'}</span>`;
      })
      .join('')}</div></article>`,
  );
  $$('#tlist canvas[data-t]').forEach(cv => {
    const id = cv.dataset.t,
      s = R.towerSprite(id, TOWERS[id].col);
    const c = cv.getContext('2d');
    c.clearRect(0, 0, 112, 112);
    c.drawImage(s, 0, 0, 112, 112);
  });
  const bs = $('#bSlot');
  if (bs)
    bs.onclick = () => {
      const [c, a] = slotCost(save.tslots || 0);
      if (pay(c, a, bs)) {
        save.tslots = (save.tslots || 0) + 1;
        persist();
        renderTowers();
        toast('Neuer Bauplatz');
      }
    };
}

$('#tlist').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const id = b.dataset.tu || b.dataset.tl;
  if (!id) return;
  const st = W.ts()[id],
    T = TOWERS[id];
  if (b.dataset.tu) {
    const ul = W.unlock(id);
    if (pay(ul[0], ul[1], b)) {
      st.u = 1;
      persist();
      renderTowers();
      toast(`${T.name} ist freigeschaltet`);
    }
  } else {
    const [c, a] = W.tlvl(st.l);
    if (pay(c, a, b)) {
      st.l++;
      persist();
      renderTowers();
    }
  }
});

$('#bTowers').onclick = () => {
  show('towers');
  renderTowers();
};

/* ---------- supernova (prestige) ---------- */
