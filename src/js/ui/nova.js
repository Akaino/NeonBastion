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

/* ---------- supernova (prestige) ---------- */
export function renderNova() {
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
    supernovaShow();
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

// Setzt den Zyklus zurück und schreibt die Quanten gut. Liefert die gewonnenen Quanten (0, wenn noch keine Supernova möglich ist).
function novaReset() {
  const g = quantaFor(save.cycleBest, save);
  if (g <= 0) return 0;
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
  return g;
}
const novaFlash = () => {
  const f = $('#flash');
  f.classList.remove('go');
  void f.offsetWidth;
  f.classList.add('go');
};
// Supernova ohne Schauspiel (für Tests und wenn der Browser um weniger Bewegung bittet)
export function supernova() {
  const g = novaReset();
  if (!g) return;
  novaFlash();
  Snd.play('nova');
  renderNova();
  toast(`Supernova! +${fmtN(g)} Quanten`);
}
/* Supernova mit Schauspiel (Wunsch des Nutzers): erst die Nova, dann zieht ein schwarzes Loch alle Elemente des Menüs in die Mitte,
   dort wird zurückgesetzt, und das Loch spuckt das Menü mit den Quanten-Upgrades wieder aus. Dauer etwa 2,8 Sekunden. */
let novaBusy = false;
const novaParts = () => [...$('#nova').querySelectorAll('.head, #novaTop > *, #novaList > *')];
const toCenter = el => {
  const r = el.getBoundingClientRect(),
    s = $('#nova').getBoundingClientRect(),
    dx = s.left + s.width / 2 - (r.left + r.width / 2),
    dy = s.top + s.height / 2 - (r.top + r.height / 2);
  return [
    `translate(${dx.toFixed(0)}px,${dy.toFixed(0)}px) scale(.04) rotate(${dx > 0 ? 220 : -220}deg)`,
    Math.hypot(dx, dy),
  ];
};
export function supernovaShow() {
  if (novaBusy) return;
  if (quantaFor(save.cycleBest, save) <= 0) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return supernova();
  novaBusy = true;
  const scr = $('#nova');
  let hole = $('#bhole');
  if (!hole) {
    hole = document.createElement('div');
    hole.id = 'bhole';
    scr.appendChild(hole);
  }
  scr.classList.add('novabusy');
  novaFlash();
  Snd.play('nova');
  // 1) Sog: Elemente wandern gestaffelt in die Mitte, das Loch wächst
  setTimeout(() => {
    hole.className = 'on';
    for (const el of novaParts()) {
      const [tf, dist] = toCenter(el);
      el.style.transition = `transform .95s cubic-bezier(.55,0,.9,.35) ${(dist / 2600).toFixed(2)}s, opacity .9s ease-in ${(dist / 2600).toFixed(2)}s`;
      el.style.transform = tf;
      el.style.opacity = '0';
    }
  }, 350);
  // 2) In der Mitte: zurücksetzen, Menü neu aufbauen (noch im Loch verborgen)
  setTimeout(() => {
    const g = novaReset();
    renderNova();
    const parts = novaParts();
    for (const el of parts) {
      el.style.transition = 'none';
      el.style.transform = toCenter(el)[0];
      el.style.opacity = '0';
    }
    void scr.offsetWidth;
    // 3) Ausstoß: Loch platzt, Elemente fliegen an ihren Platz
    hole.className = 'pop';
    novaFlash();
    Snd.play('nova');
    for (const el of parts) {
      el.style.transition = 'transform .75s cubic-bezier(.15,1.25,.4,1), opacity .35s ease-out';
      el.style.transform = '';
      el.style.opacity = '';
    }
    setTimeout(() => {
      for (const el of novaParts()) el.style.transition = '';
      hole.className = '';
      scr.classList.remove('novabusy');
      novaBusy = false;
      if (g) toast(`Supernova! +${fmtN(g)} Quanten`);
    }, 850);
  }, 1750);
}

/* ---------- boot + loop ---------- */
