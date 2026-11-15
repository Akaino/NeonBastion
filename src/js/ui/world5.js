import { Snd } from '../audio/sound.js';
import { fmtN } from '../core/format.js';
import { drawRun5, paintHero5 } from '../render/world5.js';
import { Run5 } from '../world5/Run5.js';
import {
  CLASSES5,
  CLASS_IDS5,
  CRYSTALS5,
  CRYSTAL_IDS5,
  CUR5,
  HEROES5,
  HERO_IDS5,
  RARITY5,
  RARITY_IDS5,
  TEAM_SIZE5,
  ZONES5,
  ZONE_LEN5,
  essZone5,
  heroPower5,
  heroStats5,
  stage5,
  stageName5,
  waveLoot5,
  waveOf5,
  zone5,
  zoneOf5,
} from '../world5/data.js';
import {
  canLevel5,
  canRank5,
  claimIdle5,
  idleRate5,
  levelCost5,
  levelUp5,
  pull5,
  rankNeed5,
  rankUp5,
  setSlot5,
  slotBlock5,
  swapSlots5,
  tooFar5,
  sync5,
} from '../world5/save.js';
import { show, toast } from './common.js';
import { $, $$, UI } from './dom.js';
import { persist, save } from './state.js';
import { openWorlds } from './worlds.js';

/* ================= WELT 5: Oberfläche (Prototyp) =================
   Oben läuft die Gruppe (eigenes Zeichenfeld #w5cv), darunter vier Reiter: Helden, Aufstellung, Shop, Zonen.
   Der Lauf geht weiter, während man in den Reitern blättert. Die Reiter werden nur nach einer Aktion neu aufgebaut; dazwischen
   ändert sich höchstens, welche Knöpfe bezahlbar aussehen – ein Knopf, der unter dem Finger neu aufgebaut wird, verliert den Klick. */
export let run5 = null,
  w5On = false,
  w5Tab = 'helden',
  w5Speed = 1,
  w5Slot = 0;
export function setRun5(v) {
  return (run5 = v);
}
export function setW5On(v) {
  return (w5On = v);
}
export function setW5Tab(v) {
  return (w5Tab = v);
}
export function setW5Speed(v) {
  return (w5Speed = v);
}
export function setW5Slot(v) {
  return (w5Slot = v);
}
let acc = 0,
  hudT = 0,
  saveT = 0,
  lastRes = null; // Ergebnis des zuletzt geöffneten Kristalls
const W = () => save.w5;
const tag = (rar, extra) =>
  `<span class="tag" style="--c:${RARITY5[rar].col}">${RARITY5[rar].name}${extra || ''}</span>`;
const dur = min =>
  min >= 1440
    ? `${Math.floor(min / 1440)} T ${Math.floor((min % 1440) / 60)} h`
    : min >= 60
      ? `${Math.floor(min / 60)} h ${Math.floor(min % 60)} min`
      : `${Math.floor(min)} min`;

export function openW5() {
  const got = claimIdle5(W(), Date.now());
  setRun5(new Run5(W(), { sfx: n => n !== 'kill' && Snd.play(n), event: () => (hudT = 1) }));
  setW5On(true);
  show('w5');
  $('#w5Note').hidden = !got;
  if (got)
    $('#w5Note').innerHTML =
      `<b>Während du weg warst (${dur(got.min)}, geparkt in ${stageName5(got.s)}):</b> +${fmtN(got.l)} Lumen` +
      (got.k ? ` · +${got.k} Kryon` : '') +
      (got.ess ? ` · +${got.ess} ${CLASSES5[got.cls].ess}` : '') +
      (got.d ? ` · +${got.d} Synchron-Staub` : '') +
      ` <button class="btn icon sm" id="w5NoteX" aria-label="Schließen">×</button>`;
  renderW5();
  updW5Hud();
  persist();
}
function closeW5() {
  W().last = Date.now();
  persist();
  setW5On(false);
  setRun5(null);
  openWorlds();
}
$('#w5Back').onclick = closeW5;
$('#w5Speed').onclick = () => {
  setW5Speed(w5Speed >= 8 ? 1 : w5Speed * 2);
  $('#w5Speed').textContent = w5Speed + '×';
};
$('#w5Boss').onclick = () => {
  if (run5 && run5.challenge()) {
    Snd.play('nova');
    updW5Hud();
    if (w5Tab === 'zonen') renderW5();
  }
};
$('#w5tabs').addEventListener('click', e => {
  const b = e.target.closest('[data-t]');
  if (!b) return;
  setW5Tab(b.dataset.t);
  lastRes = null;
  renderW5();
});
$('#w5Note').addEventListener('click', e => {
  if (e.target.closest('#w5NoteX')) $('#w5Note').hidden = true;
});

/* ---------- Bild und Takt (von ui/main.js je Bild gerufen) ---------- */
export function w5Frame(dt) {
  if (!run5) return;
  acc += dt * w5Speed;
  let n = 0;
  while (acc >= 1 / 60 && n < 40) {
    run5.step(1 / 60);
    acc -= 1 / 60;
    n++;
  }
  if (n >= 40) acc = 0;
  const cv = $('#w5cv'),
    dpr = Math.min(2, devicePixelRatio || 1),
    w = cv.clientWidth,
    h = cv.clientHeight;
  if (w && h) {
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
    }
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRun5(c, w, h, run5, zone5(run5.zone).hue);
  }
  hudT += dt;
  if (hudT > 0.25) {
    hudT = 0;
    updW5Hud();
    updAfford();
  }
  saveT += dt;
  if (saveT > 5) {
    saveT = 0;
    W().last = Date.now();
    persist();
  }
}
const setT = (el, t) => {
  if (el.textContent !== t) el.textContent = t;
};
export function updW5Hud() {
  if (!run5) return;
  const w = W(),
    Z = zone5(run5.zone);
  setT($('#w5Title'), `${stageName5(run5.stage)} · ${Z.name}`);
  setT($('#w5cL'), fmtN(Math.floor(w.cur.l)));
  setT($('#w5cK'), fmtN(w.cur.k));
  setT($('#w5cD'), fmtN(w.cur.d));
  const boss = waveOf5(run5.stage) === ZONE_LEN5;
  setT(
    $('#w5Info'),
    run5.phase === 'wipe'
      ? `Gruppe gefallen – zurück zu ${stageName5(w.pos)}`
      : w.block
        ? `Boss ${stageName5(w.block)} wartet – ${stageName5(w.pos)} läuft weiter`
        : w.hold
          ? `Welle ${stageName5(w.pos)} wird wiederholt`
          : run5.phase === 'fight'
            ? boss
              ? 'Bosskampf'
              : `Welle ${run5.wave} von ${ZONE_LEN5}`
            : 'Unterwegs …',
  );
  $('#w5Boss').hidden = !w.block;
}

/* ---------- Reiter ---------- */
const ownedSorted = () =>
  HERO_IDS5.filter(id => W().heroes[id]).sort(
    (a, b) =>
      RARITY_IDS5.indexOf(HEROES5[b].rar) - RARITY_IDS5.indexOf(HEROES5[a].rar) ||
      heroPower5(b, W().heroes[b].l, W().heroes[b].r) - heroPower5(a, W().heroes[a].l, W().heroes[a].r),
  );
// Betrag mit dem Zeichen seiner Währung (dieselben Zeichen wie oben in der Kopfzeile): l Lumen, k Kryon, d Synchron-Staub
const SYM = { l: '◆', k: '❖', d: '✦' };
const cur5 = (c, n) =>
  `<span class="c5" style="color:${CUR5[c].col}">${SYM[c]} ${typeof n === 'number' ? fmtN(n) : n}</span>`;
// Material einer Klasse und Kerne eines Helden bekommen ebenfalls ein festes Zeichen
const ess5 = (cls, n) => `<span class="c5" style="color:${CLASSES5[cls].col}">⬟ ${n} ${CLASSES5[cls].ess}</span>`;
const core5 = (rar, n) => `<span class="c5" style="color:${RARITY5[rar].col}">⬢ ${n}</span>`;
const zoneHint = cls =>
  `Zone ${essZone5(cls)}, ${essZone5(cls) + ZONES5.length}, ${essZone5(cls) + 2 * ZONES5.length} …`;
const portrait = (id, r) => `<canvas class="w5p" data-h="${id}" data-r="${r || 20}"></canvas>`;
// Materialbestand; die Zahlen stehen in eigenen Elementen und werden laufend nachgeführt (updAfford), nicht erst nach einer Aktion
const essLine = () =>
  CLASS_IDS5.map(
    c =>
      `<span class="c5" style="color:${CLASSES5[c].col}">⬟ <b data-ess="${c}">${W().ess[c]}</b> ${CLASSES5[c].ess}</span>`,
  ).join(' · ');

function heroCard(id) {
  const w = W(),
    H = HEROES5[id],
    C = CLASSES5[H.cls],
    st = w.heroes[id];
  if (!st)
    return `<div class="w5card lock"><div class="w5q">?</div><div class="w5body"><h3>Noch nicht gefunden ${tag(H.rar)}</h3><p>${C.name}</p></div></div>`;
  const a = heroStats5(id, st.l, st.r),
    lc = levelCost5(w, id),
    b = lc ? heroStats5(id, st.l + 1, st.r) : null,
    rn = rankNeed5(w, id),
    c = rn ? heroStats5(id, st.l, st.r + 1) : null,
    R = RARITY5[H.rar],
    inTeam = w.team.includes(id);
  let h = `<div class="w5card${H.rar === 'champ' ? ' champ' : ''}" style="--c:${R.col}">${portrait(id, 22)}<div class="w5body">
    <h3>${H.name} ${tag(H.rar)}${inTeam ? '<span class="tag" style="--c:#6dffb0">In der Gruppe</span>' : ''}</h3>
    <p><b style="color:${C.col}">${C.name}</b> · Stufe ${st.l} · Rang ${st.r}/${R.maxRank}</p>
    <p class="w5abil">${H.abil ? `<b>${H.abil}:</b> ${H.text}` : C.text}</p>
    ${H.trait.name ? `<p class="w5abil"><b>Eigenheit „${H.trait.name}“:</b> ${H.trait.text}</p>` : ''}
    <div class="cmp" style="--c:${R.col}">
      <div><span>Leben</span><b>${fmtN(a.hp)}${b ? ` <i>→</i> <em>${fmtN(b.hp)}</em>` : ''}</b></div>
      <div><span>Angriff</span><b>${fmtN(a.atk)}${b ? ` <i>→</i> <em>${fmtN(b.atk)}</em>` : ''}</b></div>
      ${c ? `<div><span>Rang ${st.r + 1}</span><b>Leben ${fmtN(c.hp)} · Angriff ${fmtN(c.atk)}</b></div>` : ''}
      <div class="w5cores"><span>Kerne</span><b>${core5(H.rar, st.s)}${rn ? ` <i>von</i> ${rn.need} <i>für Rang ${st.r + 1}</i>` : ''}</b></div>
      ${rn && rn.dust ? `<div><span>Fehlende Kerne</span><b>${rn.need - rn.have} <i>· ersetzbar durch</i> ${cur5('d', rn.dust + ' Staub')} <i>(du hast ${fmtN(w.cur.d)})</i></b></div>` : ''}
      ${lc && lc.ess ? `<div><span>${C.ess}</span><b>${ess5(H.cls, `<b data-ess="${H.cls}">${w.ess[H.cls]}</b> von ${lc.ess}`).replace(' ' + C.ess + '</span>', '</span>')} <i>· aus ${zoneHint(H.cls)}</i></b></div>` : ''}
    </div><div class="w5acts">`;
  h += lc
    ? `<button class="btn" data-act="lvl" data-id="${id}" style="--c:${CUR5.l.col}"><span class="price"><span>Stufe ${st.l + 1}</span>${cur5('l', lc.l)}${lc.ess ? `<span class="plus">+</span>${ess5(H.cls, lc.ess)}` : ''}</span></button>`
    : `<button class="btn" disabled>Höchste Stufe</button>`;
  h += rn
    ? `<button class="btn" data-act="rank" data-id="${id}" style="--c:${R.col}"><span class="price"><span>Rang ${st.r + 1}</span>${core5(H.rar, `${Math.min(rn.have, rn.need)}/${rn.need} Kerne`)}${rn.dust ? `<span class="plus">·</span><span>${rn.need - rn.have === 1 ? 'fehlender Kern' : rn.need - rn.have + ' fehlende Kerne'} für</span>${cur5('d', rn.dust + ' Staub')}` : ''}</span></button>`
    : `<button class="btn" disabled>Höchster Rang</button>`;
  if (H.rar === 'basis' && st.s > 0)
    h += `<button class="btn" data-act="sync" data-id="${id}" style="--c:${CUR5.d.col}"><span class="price"><span>Synchronisieren</span>${core5(H.rar, st.s)}<span class="plus">→</span>${cur5('d', st.s * R.sync)}</span></button>`;
  return h + `</div></div></div>`;
}
function panelHelden() {
  const own = ownedSorted(),
    rest = HERO_IDS5.filter(id => !W().heroes[id]).sort(
      (a, b) => RARITY_IDS5.indexOf(HEROES5[a].rar) - RARITY_IDS5.indexOf(HEROES5[b].rar),
    );
  return (
    `<p class="w5hint">${own.length} von ${HERO_IDS5.length} Helden gefunden. Material für den Durchbruch alle 10 Stufen gibt es in den Zonen (Reiter „Zonen“ zeigt, welche Zone was gibt): ${essLine()}<br>${cur5('d', 'Synchron-Staub')} ersetzt fehlende Kerne beim Rang. Du bekommst ihn, indem du Kerne von Basishelden synchronisierst (Knopf auf ihrer Karte), und selten als Beute: 1 % je gewonnener Welle, 25 % je besiegtem Boss.</p>` +
    own.map(heroCard).join('') +
    rest.map(heroCard).join('')
  );
}
// Hinweis, wenn ein Nahkämpfer auf einem Platz landet, von dem aus er nicht trifft
function warnFar(slot) {
  if (!tooFar5(W(), slot)) return false;
  const H = HEROES5[W().team[slot]];
  toast(`${H.name} kämpft im Nahkampf und trifft von Platz ${slot + 1} aus nicht`);
  return true;
}
function panelTeam() {
  const w = W();
  let h = `<p class="w5hint">Platz 1 steht vorn und fängt die Gegner ab, Platz 5 ganz hinten. <b>Verteidiger und Angreifer kämpfen im Nahkampf: Sie treffen nur vom vordersten besetzten Platz und dem direkt dahinter.</b> Weiter hinten greifen sie erst ein, wenn die Helden vor ihnen gefallen sind – solche Plätze sind rot markiert. In der Gruppe sind höchstens ein Champion und zwei Legendäre erlaubt. Zieh einen Helden auf einen anderen Platz, um zu tauschen – oder tippe erst den Platz, dann den Helden an. Eine Änderung beginnt die Welle neu.</p><div class="w5slots">`;
  for (let i = 0; i < TEAM_SIZE5; i++) {
    const id = w.team[i];
    const far = tooFar5(w, i);
    h += `<button class="w5slot${i === w5Slot ? ' sel' : ''}${far ? ' far' : ''}" data-slot="${i}"><small>Platz ${i + 1}${i === 0 ? ' · vorn' : i === TEAM_SIZE5 - 1 ? ' · hinten' : ''}</small>${id ? portrait(id, 18) + `<b>${HEROES5[id].name}</b>` : '<span class="w5q sm">–</span><b>leer</b>'}${far ? '<em>trifft von hier nicht</em>' : ''}</button>`;
  }
  h += `</div><div class="w5acts"><button class="btn" data-act="clear" style="--c:#ff6b84"${w.team[w5Slot] && w.team.filter(Boolean).length > 1 ? '' : ' disabled'}>Platz ${w5Slot + 1} leeren</button></div><div class="w5chips">`;
  for (const id of ownedSorted()) {
    const H = HEROES5[id],
      at = w.team.indexOf(id),
      blk = slotBlock5(w, w5Slot, id);
    h += `<button class="w5chip${blk ? ' poor' : ''}${at === w5Slot ? ' sel' : ''}" data-pick="${id}" style="--c:${RARITY5[H.rar].col}">${portrait(id, 15)}<span><b>${H.name}</b><small style="color:${CLASSES5[H.cls].col}">${CLASSES5[H.cls].name}${at >= 0 ? ' · Platz ' + (at + 1) : ''}</small></span></button>`;
  }
  return h + '</div>';
}
function panelShop() {
  const w = W();
  let h = '';
  if (lastRes) {
    const H = HEROES5[lastRes.id];
    h += `<div class="w5res${H.rar === 'champ' ? ' champ' : ''}" style="--c:${RARITY5[H.rar].col}">${portrait(lastRes.id, 30)}<div><h3>${lastRes.neu ? 'Neu' : 'Schon vorhanden'}: ${H.name} ${tag(H.rar)}</h3><p>${
      lastRes.neu
        ? `${CLASSES5[H.cls].name}. Du kannst ${H.name} jetzt in der Aufstellung einsetzen.`
        : `Der Fund wurde zu einem Kern für den Rang von ${H.name} (jetzt ${w.heroes[lastRes.id].s}).`
    }</p></div></div>`;
  }
  h += `<p class="w5hint">Kristalle kosten Kryon. Kryon gibt es nur im Spiel: für jeden ersten Sieg in einer Welle, von Bossen und gelegentlich aus Wellen. Jeder Kristall enthält einen Helden.</p>`;
  for (const cid of CRYSTAL_IDS5) {
    const C = CRYSTALS5[cid];
    h += `<div class="w5card" style="--c:${C.col}"><div class="w5cry"></div><div class="w5body"><h3>${C.name}</h3>
      <p>${RARITY_IDS5.map((r, i) =>
        C.p[i] ? `<span style="color:${RARITY5[r].col}">${RARITY5[r].name} ${C.p[i]} %</span>` : '',
      )
        .filter(Boolean)
        .join(' · ')}</p>
      <div class="w5acts"><button class="btn" data-act="pull" data-id="${cid}" style="--c:${C.col}"><span class="price"><span>Öffnen</span>${cur5('k', C.cost)}</span></button></div></div></div>`;
  }
  return h;
}
function panelZonen() {
  const w = W(),
    zMax = zoneOf5(w.cleared + 1),
    R = idleRate5(w);
  let h = `<p class="w5hint">Jede Zone hat zehn Wellen, die zehnte ist der Boss. Du kannst jederzeit in jede schon erreichte Welle wechseln; sie beginnt dann neu. ${
    R
      ? `Bist du weg, sammelt die Gruppe in <b>${stageName5(R.s)}</b> weiter: etwa ${fmtN(Math.round(R.l * 60))} Lumen je Stunde.`
      : 'Sobald du eine Welle gewonnen hast, sammelt die Gruppe auch weiter, wenn du weg bist.'
  }</p><div class="w5acts"><button class="btn" data-act="hold" style="--c:${w.hold ? '#6dffb0' : '#9b98c8'}">Diese Welle wiederholen: ${w.hold ? 'an' : 'aus'}</button></div>`;
  for (let z = zMax; z >= 1; z--) {
    const Z = zone5(z);
    h += `<div class="w5card zone" style="--c:hsl(${Z.hue} 100% 65%)"><div class="w5body"><h3>Zone ${z} · ${Z.name}</h3><p>Gibt vor allem <b style="color:${CLASSES5[Z.ess].col}">${CLASSES5[Z.ess].ess}</b> (für ${CLASSES5[Z.ess].name}) · ${fmtN(waveLoot5(stage5(z, 5)))} Lumen in Welle 5</p><div class="w5waves">`;
    for (let k = 1; k <= ZONE_LEN5; k++) {
      const s = stage5(z, k),
        ok = s <= w.cleared + 1;
      h += `<button class="w5wave${s === w.pos ? ' sel' : ''}${s <= w.cleared ? ' done' : ''}" data-stage="${s}"${ok ? '' : ' disabled'}>${k === ZONE_LEN5 ? 'Boss' : k}</button>`;
    }
    h += `</div></div></div>`;
  }
  return h;
}
export function renderW5() {
  $$('#w5tabs [data-t]').forEach(b => b.classList.toggle('sel', b.dataset.t === w5Tab));
  const p = $('#w5panel');
  p.innerHTML = { helden: panelHelden, team: panelTeam, shop: panelShop, zonen: panelZonen }[w5Tab]();
  $$('#w5panel canvas.w5p').forEach(cv => paintHero5(cv, cv.dataset.h, +cv.dataset.r));
  updAfford();
}
// Knöpfe, die gerade nicht bezahlbar sind, gedämpft zeigen – ohne den Reiter neu aufzubauen
function updAfford() {
  const w = W();
  $$('#w5panel [data-ess]').forEach(e => setT(e, String(w.ess[e.dataset.ess])));
  $$('#w5panel [data-act]').forEach(b => {
    const a = b.dataset.act,
      id = b.dataset.id,
      ok =
        a === 'lvl'
          ? canLevel5(w, id)
          : a === 'rank'
            ? canRank5(w, id)
            : a === 'pull'
              ? w.cur.k >= CRYSTALS5[id].cost
              : true;
    b.classList.toggle('poor', !ok);
  });
}
$('#w5panel').addEventListener('click', e => {
  if (skipClick) return;
  const w = W(),
    t = e.target,
    b = t.closest('[data-act]'),
    again = () => {
      run5 && run5.refresh();
      persist();
      renderW5();
      updW5Hud();
    };
  if (b && !b.disabled) {
    const a = b.dataset.act,
      id = b.dataset.id;
    if (a === 'lvl') {
      if (!levelUp5(w, id)) {
        Snd.play('no');
        const c = levelCost5(w, id);
        return toast(
          w.cur.l < c.l
            ? `Dir fehlen ${fmtN(c.l - Math.floor(w.cur.l))} Lumen`
            : `Dir fehlen ${c.ess - w.ess[HEROES5[id].cls]} ${CLASSES5[HEROES5[id].cls].ess} – die gibt es in einer passenden Zone`,
        );
      }
      Snd.play('buy');
    } else if (a === 'rank') {
      const vor = rankNeed5(w, id);
      if (!rankUp5(w, id)) {
        Snd.play('no');
        const n = rankNeed5(w, id);
        return toast(
          `Dir fehlen ${n.need - n.have} Kerne oder ${n.dust - w.cur.d} Synchron-Staub (aus Kernen von Basishelden oder selten als Beute)`,
        );
      }
      Snd.play('nova');
      // Fehlende Kerne werden mit Synchron-Staub bezahlt – das soll niemand übersehen (Rückmeldung des Nutzers: „1/2 Kerne und es ging trotzdem“)
      if (vor.dust)
        toast(
          `${vor.need - vor.have === 1 ? 'Ein fehlender Kern wurde' : vor.need - vor.have + ' fehlende Kerne wurden'} mit ${vor.dust} Synchron-Staub ersetzt`,
        );
    } else if (a === 'sync') {
      const d = sync5(w, id);
      Snd.play('buy');
      toast(`+${d} Synchron-Staub`);
    } else if (a === 'pull') {
      const r = pull5(w, id);
      if (!r) {
        Snd.play('no');
        return toast(`Dir fehlen ${CRYSTALS5[id].cost - w.cur.k} Kryon`);
      }
      lastRes = r;
      Snd.play(r.rar === 'champ' || r.rar === 'legend' ? 'nova' : 'buy');
      $('#w5panel').scrollTop = 0;
    } else if (a === 'clear') {
      if (setSlot5(w, w5Slot, null)) run5.begin(true);
    } else if (a === 'hold') {
      w.hold = !w.hold; // die laufende Welle geht weiter, nur das Vorrücken danach ändert sich
    }
    return again();
  }
  const sl = t.closest('[data-slot]');
  if (sl) {
    setW5Slot(+sl.dataset.slot);
    return renderW5();
  }
  const pk = t.closest('[data-pick]');
  if (pk) {
    const id = pk.dataset.pick,
      blk = slotBlock5(w, w5Slot, id);
    if (blk) {
      Snd.play('no');
      return toast(blk);
    }
    if (w.team[w5Slot] === id) return;
    setSlot5(w, w5Slot, id);
    run5.begin(true);
    Snd.play('buy');
    warnFar(w5Slot);
    return again();
  }
  const wv = t.closest('[data-stage]');
  if (wv && !wv.disabled) {
    run5.goto(+wv.dataset.stage, true);
    Snd.play('buy');
    return again();
  }
});

/* ---------- Aufstellung: Ziehen und Ablegen ----------
   Einen Helden aus einem Platz auf einen anderen ziehen tauscht die beiden (auch mit einem leeren Platz); einen Helden aus der
   Liste auf einen Platz ziehen setzt ihn dort ein. Antippen ohne Ziehen wählt wie bisher. Maus und Finger laufen über dieselben
   Zeigerereignisse; die Plätze nehmen dem Browser dafür das Wischen ab (touch-action: none). */
let drag = null; // { from: Platz | null, id, x0, y0, on: zieht schon?, ghost }
const DRAG_MIN = 8;
$('#w5panel').addEventListener('pointerdown', e => {
  if (w5Tab !== 'team') return;
  const sl = e.target.closest('[data-slot]'),
    ch = e.target.closest('[data-pick]'),
    id = sl ? W().team[+sl.dataset.slot] : ch ? ch.dataset.pick : null;
  if (!id || (ch && e.pointerType !== 'mouse')) return; // in der Liste wischt der Finger zum Blättern; dort zieht nur die Maus
  drag = { from: sl ? +sl.dataset.slot : null, id, x0: e.clientX, y0: e.clientY, on: false, ghost: null };
});
function dragMove(e) {
  if (!drag) return;
  if (!drag.on) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < DRAG_MIN) return;
    drag.on = true;
    const g = document.createElement('canvas');
    g.className = 'w5ghost';
    $('#w5').appendChild(g);
    paintHero5(g, drag.id, 22);
    drag.ghost = g;
  }
  drag.ghost.style.transform = `translate(${e.clientX - 34}px, ${e.clientY - 44}px)`;
  const over = UI.elementFromPoint(e.clientX, e.clientY),
    sl = over && over.closest && over.closest('[data-slot]');
  $$('#w5panel .w5slot').forEach(b => b.classList.toggle('drop', b === sl));
  e.preventDefault();
}
function dragEnd(e) {
  if (!drag) return;
  const d = drag;
  drag = null;
  if (!d.on) return;
  d.ghost.remove();
  const over = e.type === 'pointerup' ? UI.elementFromPoint(e.clientX, e.clientY) : null,
    sl = over && over.closest && over.closest('[data-slot]'),
    w = W();
  skipClick = true; // das Loslassen soll nicht zusätzlich als Antippen zählen
  setTimeout(() => (skipClick = false), 0);
  if (sl) {
    const to = +sl.dataset.slot;
    let ok = false;
    if (d.from != null) ok = swapSlots5(w, d.from, to);
    else {
      const blk = slotBlock5(w, to, d.id);
      if (blk) toast(blk);
      else ok = setSlot5(w, to, d.id);
    }
    if (ok) {
      setW5Slot(to);
      run5.begin(true);
      Snd.play('buy');
      warnFar(to) || (d.from != null && warnFar(d.from));
      persist();
    } else Snd.play('no');
  }
  renderW5();
}
let skipClick = false;
window.addEventListener('pointermove', dragMove, { passive: false });
window.addEventListener('pointerup', dragEnd);
window.addEventListener('pointercancel', dragEnd);
