import { Snd } from '../audio/sound.js';
import { fmtD, fmtN } from '../core/format.js';
import { stats } from '../core/stats.js';
import { DRONE_IDS } from '../data/drones.js';
import { HEROES, HERO_IDS } from '../data/heroes.js';
import { NODES } from '../data/nodes.js';
import { NOVA_MIN, PRES, presCost, quantaFor } from '../data/prestige.js';
import { TOWER_IDS } from '../data/towers.js';
import { costBtn, curIcon, renderCurs, show, toast } from './common.js';
import { $ } from './dom.js';
import { cmpRows, fv } from './preview.js';
import { persist, save } from './state.js';

$('#bNova').onclick = () => {
  show('nova');
  renderNova();
};

export /* ---------- supernova (prestige) ---------- */
function renderNova() {
  renderCurs();
  const qg = quantaFor(save.cycleBest, save),
    cb = save.cycleBest || 0;
  let next = '';
  if (cb < NOVA_MIN) next = `Erreiche Welle ${NOVA_MIN}, um deine Supernova zu zünden.`;
  else {
    let w = cb + 1;
    while (quantaFor(w, save) <= qg && w < cb + 30) w++;
    next = `Bei Welle ${w} wären es ${fmtN(quantaFor(w, save))} Quanten.`;
  }
  $('#novaTop').innerHTML = `<div class="novabig">${curIcon('q')}<b>+${fmtN(qg)}</b><span>Quanten</span></div>
    <p>Höchste Welle in diesem Zyklus: <b>${cb}</b>. ${next}</p>
    <div class="resets"><p><span>Wird zurückgesetzt:</span> Skilltree, Währungen, Helden-, Flotten- und Turmstufen</p><p><span>Bleibt erhalten:</span> freigeschaltete Helden, Drohnenklassen und Türme, die Verteilung der Flotte, Bauplätze, Rekord, Quanten und Quanten-Upgrades</p></div>
    <button class="btn big ${qg > 0 ? '' : 'poor'}" id="bNovaGo" style="--c:#c7b8ff">Supernova zünden</button>`;
  const b = $('#bNovaGo');
  b.onclick = () => {
    if (qg <= 0) {
      Snd.play('no');
      b.classList.remove('shake');
      void b.offsetWidth;
      b.classList.add('shake');
      toast(`Die Supernova braucht mindestens Welle ${NOVA_MIN}`);
      return;
    }
    if (!b.dataset.arm) {
      b.dataset.arm = '1';
      b.textContent = 'Wirklich zünden? Nochmal tippen';
      setTimeout(() => {
        if (b.isConnected && b.dataset.arm) {
          b.dataset.arm = '';
          b.textContent = 'Supernova zünden';
        }
      }, 4000);
      return;
    }
    supernova();
  };
  $('#novaList').innerHTML = Object.values(PRES)
    .map(p => {
      const l = save.pr[p.id] || 0,
        max = l >= p.max,
        c = max ? 0 : presCost(p, l);
      const S0 = stats(save),
        S1 = max
          ? null
          : stats({
              ...save,
              pr: {
                ...save.pr,
                [p.id]: l + 1,
              },
            });
      const rows = [['Stufe', `${l}`, max ? undefined : `${l + 1}`]];
      const pv =
        {
          dmg: [
            ['Klinge-Schaden', S => fv(S.heroDmg * HEROES.klinge.dmg)],
            ['Schaden pro Impuls', S => fv(S.tapDmg * S.impMul)],
            ['Drohnenschaden', S => fv(S.droneDmg)],
          ],
          hp: [['Basisleben', S => fv(S.baseHp)]],
          gain: [
            ['Splitter', S => '×' + fmtD(S.gS, 2)],
            ['Kerne', S => '×' + fmtD(S.gK, 2)],
            ['Prismen', S => '×' + fmtD(S.gP, 2)],
          ],
          hero: [
            ['Heldenschaden', S => '×' + fmtD(S.heroDmg, 2)],
            ['Heldenleben', S => '×' + fmtD(S.heroHp, 2)],
          ],
          drone: [['Drohnen', S => String(S.drones)]],
        }[p.id] || [];
      for (const [lab, f] of pv) rows.push([lab, f(S0), S1 ? f(S1) : undefined]);
      if (p.id === 'qgain')
        rows.push([
          'Quanten jetzt',
          fmtN(qg),
          max
            ? undefined
            : fmtN(
                quantaFor(cb, {
                  pr: {
                    ...save.pr,
                    qgain: l + 1,
                  },
                }),
              ),
        ]);
      if (p.id === 'legacy') rows.push(['Startstufe der Knoten', String(l), max ? undefined : String(l + 1)]);
      if (p.id === 'start')
        rows.push(
          ['Start-Splitter', l ? fmtN(200 * Math.pow(3, l - 1)) : '0', max ? undefined : fmtN(200 * Math.pow(3, l))],
          ['Start-Kerne', String(l * 5), max ? undefined : String((l + 1) * 5)],
        );
      return `<article class="hcard" style="--c:#c7b8ff"><div class="hc-top"><div><h3>${p.name}</h3><small>Stufe ${l} / ${p.max}</small></div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${max ? '' : 'Nach dem Kauf: '}<b style="color:var(--ink);font-weight:600">${p.fx(max ? l : l + 1)}</b></p>${cmpRows(rows, '#c7b8ff')}
      <div class="hc-act">${max ? '<button class="btn" disabled>Maximal ausgebaut</button>' : `<button class="btn ${save.q >= c ? '' : 'poor'}" data-pr="${p.id}" style="--c:#c7b8ff">${costBtn('Kaufen', 'q', c)}</button>`}</div></article>`;
    })
    .join('');
}

$('#novaList').addEventListener('click', e => {
  const b = e.target.closest('[data-pr]');
  if (!b) return;
  const p = PRES[b.dataset.pr],
    l = save.pr[p.id] || 0,
    c = presCost(p, l);
  if (save.q < c) {
    Snd.play('no');
    b.classList.remove('shake');
    void b.offsetWidth;
    b.classList.add('shake');
    toast(`Dir fehlen ${fmtN(c - save.q)} Quanten`);
    return;
  }
  save.q -= c;
  save.pr[p.id] = l + 1;
  Snd.play('buy');
  persist();
  renderNova();
});

export function supernova() {
  const g = quantaFor(save.cycleBest, save);
  if (g <= 0) return;
  save.q += g;
  save.nova = (save.nova || 0) + 1;
  save.cur = {
    s: 0,
    k: 0,
    p: 0,
    d: 0,
  };
  save.nodes = {
    root: 1,
  };
  for (const id of HERO_IDS) {
    save.heroes[id].l = 1;
    save.heroes[id].a = 0;
  }
  for (const id of TOWER_IDS) save.towers[id].l = 1;
  for (const id of DRONE_IDS) save.fleet[id].l = 1;
  const L = save.pr.legacy || 0;
  if (L) for (const n of Object.values(NODES)) if (n.cur === 's') save.nodes[n.id] = Math.min(n.max, L);
  const st = save.pr.start || 0;
  if (st) {
    save.cur.s = 200 * Math.pow(3, st - 1);
    save.cur.k = st * 5;
  }
  save.cycleBest = 0;
  save.team = save.team.slice(0, stats(save).slots);
  persist();
  const f = $('#flash');
  f.classList.remove('go');
  void f.offsetWidth;
  f.classList.add('go');
  Snd.play('nova');
  renderNova();
  toast(`Supernova! +${fmtN(g)} Quanten`);
}

/* ---------- boot + loop ---------- */
