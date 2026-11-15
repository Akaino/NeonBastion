import { Snd } from '../audio/sound.js';
import { fmtD } from '../core/format.js';
import { stats } from '../core/stats.js';
import { ASC_MAX, HEROES, HERO_IDS, HERO_MAX, heroAscCost, heroLvlCost } from '../data/heroes.js';
import { canPay, costBtn, pay, renderCurs, show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { cmpRows, fv } from './preview.js';
import { R, persist, save } from './state.js';

$('#bHeroes').onclick = () => {
  show('heroes');
  renderHeroes();
};

export /* ---------- heroes ---------- */
function renderHeroes() {
  renderCurs();
  const S = stats(save);
  save.team = save.team.filter(id => save.heroes[id].u).slice(0, S.slots);
  let sl = '';
  for (let i = 0; i < 4; i++) {
    const id = save.team[i];
    if (i >= S.slots) sl += `<div class="slot">Gesperrt<br>Skilltree</div>`;
    else if (id)
      sl += `<button class="slot on" data-rm="${id}" style="--c:${HEROES[id].col}" aria-label="${HEROES[id].name} entfernen"><canvas data-h="${id}" width="80" height="80" style="width:40px;height:40px"></canvas></button>`;
    else sl += `<div class="slot">Frei</div>`;
  }
  $('#slots').innerHTML = sl;
  $('#hlist').innerHTML = HERO_IDS.map(id => {
    const d = HEROES[id],
      st = save.heroes[id],
      lm = 1 + 0.12 * (st.l - 1),
      inT = save.team.includes(id);
    const dmg = d.dmg * lm * S.heroDmg,
      hp = d.hp * lm * S.heroHp,
      cd = d.cd * S.abilityCd * (1 - 0.08 * st.a);
    let act = '',
      prev = '';
    if (st.u) {
      const lm1 = 1 + 0.12 * st.l,
        rows = [];
      if (st.l < HERO_MAX)
        rows.push(
          ['<small>Aufwerten</small> Stufe', `${st.l}`, `${st.l + 1}`],
          ['Schaden', fv(dmg), fv(d.dmg * lm1 * S.heroDmg)],
          ['Leben', fv(hp), fv(d.hp * lm1 * S.heroHp)],
        );
      if (st.a < ASC_MAX)
        rows.push(
          ['<small>Aufstieg</small> Stärke', `+${st.a * 35} %`, `+${(st.a + 1) * 35} %`],
          ['Abklingzeit', fmtD(cd) + ' s', fmtD(d.cd * S.abilityCd * (1 - 0.08 * (st.a + 1))) + ' s'],
        );
      if (rows.length) prev = cmpRows(rows, d.col);
    }
    if (!st.u) {
      const [c, a] = d.unlock;
      act = `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-un="${id}" style="--c:${d.col}">${costBtn('Freischalten', c, a)}</button>`;
    } else {
      act = `<button class="btn" data-tg="${id}" style="--c:${inT ? '#9b98c8' : d.col}">${inT ? 'Entfernen' : 'Einsetzen'}<small>${inT ? 'aus dem Team' : save.team.length < S.slots ? 'ins Team' : 'kein Platz frei'}</small></button>`;
      if (st.l < HERO_MAX) {
        const [c, a] = heroLvlCost(st.l);
        act += `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-lv="${id}" style="--c:${d.col}">${costBtn('Aufwerten', c, a)}</button>`;
      }
      if (st.a < ASC_MAX) {
        const [c, a] = heroAscCost(st.a);
        act += `<button class="btn ${canPay(c, a) ? '' : 'poor'}" data-as="${id}" style="--c:#ffe14f">${costBtn('Aufstieg', c, a)}</button>`;
      }
    }
    return `<article class="hcard ${st.u ? '' : 'lock'}" style="--c:${d.col}"><div class="hc-top"><canvas data-h="${id}" width="112" height="112"></canvas><div><h3>${d.name}</h3><small>${d.role}</small><div class="stars" aria-label="Aufstieg ${st.a} von 5">${'★'.repeat(st.a)}${'☆'.repeat(ASC_MAX - st.a)}</div></div>
      <div class="lvl">${st.u ? `<small>Stufe</small><br>${st.l}<small> / ${HERO_MAX}</small>` : '<small>Gesperrt</small>'}</div></div>
      <p style="margin:0;color:var(--muted);font-size:13px">${d.text}</p>
      <div class="stats"><div>Schaden<b>${fv(dmg)}</b></div><div>Leben<b>${fv(hp)}</b></div><div>Fähigkeit<b>${fmtD(cd)} s</b></div></div>
      <div class="abil"><b>${d.abil}:</b> ${d.abilText}${st.a ? ` Stärke +${st.a * 35} %.` : ''}</div>${prev}<div class="hc-act">${act}</div></article>`;
  }).join('');
  $$('canvas[data-h]').forEach(cv => {
    const id = cv.dataset.h,
      c = cv.getContext('2d'),
      s = R.heroSprite(id, HEROES[id].col);
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(s, 0, 0, cv.width, cv.height);
  });
}

$('#heroes').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const S = stats(save);
  if (b.dataset.rm) {
    save.team = save.team.filter(x => x !== b.dataset.rm);
    persist();
    renderHeroes();
    return;
  }
  const id = b.dataset.un || b.dataset.tg || b.dataset.lv || b.dataset.as;
  if (!id) return;
  const st = save.heroes[id],
    d = HEROES[id];
  if (b.dataset.un) {
    if (pay(d.unlock[0], d.unlock[1], b)) {
      st.u = 1;
      if (save.team.length < S.slots) save.team.push(id);
      persist();
      renderHeroes();
      toast(`${d.name} ist freigeschaltet`);
    }
  } else if (b.dataset.tg) {
    if (save.team.includes(id)) save.team = save.team.filter(x => x !== id);
    else if (save.team.length < S.slots) save.team.push(id);
    else {
      Snd.play('no');
      toast('Alle Plätze belegt. Mehr Plätze gibt es im Skilltree.');
      return;
    }
    persist();
    renderHeroes();
  } else if (b.dataset.lv) {
    const [c, a] = heroLvlCost(st.l);
    if (pay(c, a, b)) {
      st.l++;
      persist();
      renderHeroes();
    }
  } else if (b.dataset.as) {
    const [c, a] = heroAscCost(st.a);
    if (pay(c, a, b)) {
      st.a++;
      persist();
      renderHeroes();
      toast(`${d.name} ist aufgestiegen`);
    }
  }
});

/* ---------- Türme im Run: Bauen, Aufwerten, Verschieben, Abbauen ---------- */
// Solange gebaut oder ein Turm bearbeitet wird, ist das Spiel pausiert.
