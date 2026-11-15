import { Snd } from '../audio/sound.js';
import { fmtD } from '../core/format.js';
import { stats } from '../core/stats.js';
import {
  DRONES,
  DRONE_IDS,
  DRONE_MAX,
  REPAIR_ALLY,
  REPAIR_BASE,
  droneLm,
  droneLvlCost,
  droneUnlocked,
  repairMul,
} from '../data/drones.js';
import { NODES } from '../data/nodes.js';
import { canPay, costBtn, pay, renderCurs, show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { cmpRows, fv } from './preview.js';
import { R, persist, save } from './state.js';

/* ---------- Flotte: Drohnenklassen freischalten, aufwerten und ihre Verteilung einstellen ---------- */
export const fleetOn = id => droneUnlocked(save, id);

export const fleetSum = () => DRONE_IDS.reduce((s, id) => s + (fleetOn(id) ? save.fleet[id].p : 0), 0);

export function renderFleet() {
  renderCurs();
  const S = stats(save),
    sum = fleetSum(),
    F = save.fleet;
  $('#fbar').innerHTML =
    `<div class="slotinfo"><b>${S.drones}</b> Drohnen gleichzeitig · <b>${sum} %</b> verteilt${sum < 100 ? `, ${100 - sum} % frei` : ''}</div><div class="fdist" aria-hidden="true">${DRONE_IDS.filter(
      id => fleetOn(id) && F[id].p > 0,
    )
      .map(id => `<i style="width:${F[id].p}%;background:${DRONES[id].col}"></i>`)
      .join(
        '',
      )}</div>${sum ? (sum < 100 ? '<p class="hint">Gebaut wird im Verhältnis der eingestellten Anteile.</p>' : '') : '<p class="hint">Nichts verteilt. Die Basis baut keine Drohnen.</p>'}`;
  $('#flist').innerHTML = DRONE_IDS.map(id => {
    const D = DRONES[id],
      st = F[id],
      un = fleetOn(id),
      lm = droneLm(st.l),
      lm1 = droneLm(st.l + 1),
      rep = id === 'repair';
    let act = '',
      prev = '',
      share = '';
    const stat = rep
      ? `<div>Basis pro Sekunde<b>${fmtD(REPAIR_BASE * repairMul(st.l) * 100, 2)} %</b></div><div>Verbündete<b>${fmtD(REPAIR_ALLY * repairMul(st.l) * 100, 1)} %</b></div><div>Leben<b>${fv(S.droneHp * lm * D.hp)}</b></div>`
      : `<div>Schaden<b>${fv(S.droneDmg * lm * D.dmg)}${D.shots ? ' × ' + D.shots : ''}</b></div><div>Leben<b>${fv(S.droneHp * lm * D.hp)}</b></div><div>Tempo<b>${D.sp}</b></div>`;
    if (un) {
      if (st.l < DRONE_MAX) {
        const rows = [['<small>Aufwerten</small> Stufe', `${st.l}`, `${st.l + 1}`]];
        if (rep)
          rows.push([
            'Basis pro Sekunde',
            fmtD(REPAIR_BASE * repairMul(st.l) * 100, 2) + ' %',
            fmtD(REPAIR_BASE * repairMul(st.l + 1) * 100, 2) + ' %',
          ]);
        else rows.push(['Schaden', fv(S.droneDmg * lm * D.dmg), fv(S.droneDmg * lm1 * D.dmg)]);
        rows.push(['Leben', fv(S.droneHp * lm * D.hp), fv(S.droneHp * lm1 * D.hp)]);
        prev = cmpRows(rows, D.col);
        const [c, a] = droneLvlCost(st.l);
        act = `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-fl="${id}" style="--c:${D.col}">${costBtn('Aufwerten', c, a)}</button>`;
      } else act = '<button class="btn" disabled>Maximal ausgebaut</button>';
      share = `<div class="fshare"><span>Anteil an der Flotte</span><span style="display:flex;align-items:center;gap:8px"><button class="btn icon sm" data-fp="${id}:-5" aria-label="Anteil ${D.name} verringern">−</button><b>${st.p} %</b><button class="btn icon sm" data-fp="${id}:5" aria-label="Anteil ${D.name} erhöhen">+</button></span></div>`;
    } else if (typeof D.unlock === 'string')
      act = `<button class="btn poor" disabled>Im Skilltree: „${NODES[D.unlock].name}“</button>`;
    else {
      const [c, a] = D.unlock;
      act = `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-fu="${id}" style="--c:${D.col}">${costBtn('Freischalten', c, a)}</button>`;
    }
    return `<article class="hcard ${un ? '' : 'lock'}" style="--c:${D.col}"><div class="hc-top"><canvas data-d="${id}" width="112" height="112"></canvas><div><h3>${D.name}</h3><small>${D.role}</small></div>
      <div class="lvl">${un ? `<small>Stufe</small><br>${st.l}<small> / ${DRONE_MAX}</small>` : '<small>Gesperrt</small>'}</div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${D.text}</p><div class="stats">${stat}</div>${share}${prev}<div class="hc-act">${act}</div></article>`;
  }).join('');
  $$('#flist canvas[data-d]').forEach(cv => {
    const id = cv.dataset.d,
      c = cv.getContext('2d'),
      s = R.droneSprite(id);
    c.clearRect(0, 0, 112, 112);
    c.drawImage(s, 16, 16, 80, 80);
  });
}

$('#fleet').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const F = save.fleet;
  if (b.dataset.fp) {
    const [id, d] = b.dataset.fp.split(':'),
      st = F[id];
    // Anteile werden nie automatisch umverteilt (Vorgabe des Nutzers): Plus geht nur, solange noch Prozente frei sind, Minus bis 0. Summe höchstens 100.
    const free = 100 - fleetSum(),
      step = +d > 0 ? Math.min(+d, free) : -Math.min(-d, st.p);
    if (+d > 0 && free <= 0) {
      Snd.play('no');
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      toast('Schon 100 % verteilt. Verringere erst eine andere Klasse.');
      return;
    }
    st.p += step;
    persist();
    renderFleet();
    return;
  }
  if (b.dataset.fu) {
    const id = b.dataset.fu,
      D = DRONES[id];
    if (pay(D.unlock[0], D.unlock[1], b)) {
      F[id].u = 1;
      F[id].p = 0;
      persist();
      renderFleet();
      toast(`${D.name} ist freigeschaltet. Stell den Anteil ein.`);
    }
    return;
  }
  if (b.dataset.fl) {
    const id = b.dataset.fl,
      st = F[id],
      [c, a] = droneLvlCost(st.l);
    if (pay(c, a, b)) {
      st.l++;
      persist();
      renderFleet();
    }
  }
});

$('#bFleet').onclick = () => {
  show('fleet');
  renderFleet();
};

/* ---------- Enzyklopädie: was man besiegt hat, getrennt nach Gegnern und Bossen ---------- */
