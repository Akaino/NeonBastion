import { Snd } from '../audio/sound.js';
import { fmtN } from '../core/format.js';
import { drawRun5, paintHero5 } from '../render/world5.js';
import { Run5 } from '../world5/Run5.js';
import {
  BOX_COST5,
  BOX_W5,
  GEAR_Q5,
  GEAR_SLOTS5,
  GEAR_TYPES5,
  GEAR_TYPE_IDS5,
  SETS5,
  SLOT_NAMES5,
  buyBox5,
  equip5,
  itemName5,
  itemScore5,
  itemText5,
  recycle5,
  recycleAll5,
  scrapOf5,
  setCounts5,
  slotType5,
  unequip5,
} from '../world5/gear.js';
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
  ROW_NAMES5,
  TEAM_SIZE5,
  rowOf5,
  ZONES5,
  ZONE_LEN5,
  essZone5,
  heroPower5,
  optimizeGear5,
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
  w5Slot = 1;
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
let invDirty = false,
  acc = 0,
  hudT = 0,
  saveT = 0,
  lastRes = null, // Ergebnis des zuletzt geöffneten Kristalls
  lastBox = null, // Inhalt der zuletzt geöffneten Ausrüstungsbox
  gearHero = null, // Held, dessen Ausrüstung gerade offen ist (Reiter Helden)
  gearSlot = 'waffe', // dort gewählter Platz
  invType = 'alle', // Filter im Inventar
  heroOrder = null; // Reihenfolge der Heldenübersicht; null = beim nächsten Aufbau neu nach UP sortieren
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
  setRun5(
    new Run5(W(), {
      sfx: n => n !== 'kill' && Snd.play(n),
      event: k => {
        hudT = 1;
        if (k === 'gear') invDirty = true; // neue Beute: Inventar-Reiter bei Gelegenheit auffrischen
      },
    }),
  );
  setW5On(true);
  heroOrder = null;
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
  if (b.dataset.t === 'helden') heroOrder = null; // Klick auf „Helden“ sortiert neu – auch wenn der Reiter schon offen ist
  lastRes = lastBox = null;
  gearHero = null;
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
    // Neue Ausrüstung zeigt der Inventar-Reiter erst, wenn gerade kein Finger auf einem Knopf liegt
    if (invDirty && !$('#w5panel :active')) {
      invDirty = false;
      const el = $('#w5InvN');
      if (el) setT(el, String(W().inv.length));
      if (w5Tab === 'inv') renderW5();
    }
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
// Wertung eines gefundenen Helden und der ganzen Gruppe
const up5 = id => heroPower5(id, W().heroes[id].l, W().heroes[id].r, W().gear[id]);
const upTag = id => `<span class="tag up">UP ${fmtN(up5(id))}</span>`;
// Heldenübersicht: der stärkste zuerst (Vorgabe des Nutzers), bei Gleichstand die höhere Seltenheit
const ownedSorted = () =>
  HERO_IDS5.filter(id => W().heroes[id]).sort(
    (a, b) => up5(b) - up5(a) || RARITY_IDS5.indexOf(HEROES5[b].rar) - RARITY_IDS5.indexOf(HEROES5[a].rar),
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
  const G = w.gear[id],
    a = heroStats5(id, st.l, st.r, G),
    lc = levelCost5(w, id),
    b = lc ? heroStats5(id, st.l + 1, st.r, G) : null,
    rn = rankNeed5(w, id),
    c = rn ? heroStats5(id, st.l, st.r + 1, G) : null,
    R = RARITY5[H.rar],
    inTeam = w.team.includes(id);
  let h = `<div class="w5card${H.rar === 'champ' ? ' champ' : ''}" style="--c:${R.col}">${portrait(id, 22)}<div class="w5body">
    <h3>${H.name} ${tag(H.rar)}${upTag(id)}${inTeam ? '<span class="tag" style="--c:#6dffb0">In der Gruppe</span>' : ''}</h3>
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
  h += `<button class="btn" data-act="gear" data-id="${id}" style="--c:${CUR5.x.col}">Ausrüstung · ${Object.keys(G || {}).length} von ${GEAR_SLOTS5.length}</button>`;
  return h + `</div></div></div>`;
}
/* ---------- Ausrüstung ---------- */
const SYMX = '⛭';
const scrap5 = n => `<span class="c5" style="color:${CUR5.x.col}">${SYMX} ${fmtN(n)}</span>`;
const qTag = it => `<span class="tag" style="--c:${GEAR_Q5[it.q].col}">${GEAR_Q5[it.q].name}</span>`;
const setTag = it =>
  it.set ? `<span class="tag" style="--c:${SETS5[it.set].col}">Set ${SETS5[it.set].name}</span>` : '';
// Zeile eines Gegenstands; extra = Knöpfe oder Zusatztext rechts
const itemRow = (it, extra) =>
  `<div class="w5item" style="--c:${GEAR_Q5[it.q].col}"><div class="w5ibody"><b>${itemName5(it)}</b><span>${itemText5(it)} · Stufe ${it.s}</span><span>${qTag(it)}${setTag(it)}</span></div>${extra || ''}</div>`;
// Wertung des Helden, wenn auf dem Platz dieser Gegenstand läge (null = leer)
function upWith(id, slot, it) {
  const st = W().heroes[id],
    g = { ...(W().gear[id] || {}) };
  if (it) g[slot] = it;
  else delete g[slot];
  return heroPower5(id, st.l, st.r, g);
}
// Ausrüstung eines Helden: neun Plätze, Set-Boni, für den gewählten Platz die passenden Teile aus dem Inventar mit Vergleich
function panelGear(id) {
  const w = W(),
    H = HEROES5[id],
    G = w.gear[id] || {},
    cur = G[gearSlot],
    now = up5(id),
    n = setCounts5(G);
  let h = `<div class="w5acts"><button class="btn" data-act="gback" style="--c:#6dffb0">‹ Zurück zu den Helden</button><button class="btn" data-act="opt" style="--c:#ffe14f"${w.inv.length ? '' : ' disabled'}>Optimieren</button></div>
    <p class="w5hint">„Optimieren“ legt aus dem Inventar an, was für einen ${CLASSES5[H.cls].name} am meisten bringt – Set-Boni eingerechnet. Was andere Helden tragen, bleibt bei ihnen.</p>
    <div class="w5card" style="--c:${RARITY5[H.rar].col}">${portrait(id, 22)}<div class="w5body"><h3>${H.name} ${tag(H.rar)}${upTag(id)}</h3><p>Tippe einen Platz an, um ihn zu belegen. Was du ablegst, kommt zurück ins Inventar.</p></div></div>
    <div class="w5gslots">`;
  for (const slot of GEAR_SLOTS5) {
    const it = G[slot];
    h += `<button class="w5gslot${slot === gearSlot ? ' sel' : ''}${it ? '' : ' empty'}" data-gslot="${slot}" style="--c:${it ? GEAR_Q5[it.q].col : '#5f5c8c'}"><small>${SLOT_NAMES5[slot]}</small>${it ? `<b>${itemText5(it).replace(/ (Leben|Angriff|Tempo|weniger Schaden|Energie je Sekunde)$/, '')}</b><em style="color:${it.set ? SETS5[it.set].col : 'inherit'}">${it.set ? SETS5[it.set].name : GEAR_Q5[it.q].name}</em>` : '<b>–</b><em>leer</em>'}</button>`;
  }
  h += `</div>`;
  const sets = Object.keys(n);
  if (sets.length)
    h += sets
      .map(sid => {
        const S = SETS5[sid];
        return `<div class="w5card" style="--c:${S.col}"><div class="w5body"><h3>Set ${S.name} <span class="tag" style="--c:${S.col}">${n[sid]} von ${S.parts.length}</span></h3><p>${S.bonus.map(([need, , text]) => `<span class="${n[sid] >= need ? 'w5on' : 'w5off'}">${need} Teile: ${text}</span>`).join('<br>')}</p></div></div>`;
      })
      .join('');
  h += `<p class="w5hint"><b>${SLOT_NAMES5[gearSlot]}</b>${cur ? '' : ' ist leer.'}</p>`;
  if (cur) {
    const ohne = upWith(id, gearSlot, null);
    h += itemRow(
      cur,
      `<div class="w5iact"><span class="w5cmp">angelegt</span><button class="btn" data-act="unequip" style="--c:#ff6b84">Ablegen<small> UP ${fmtN(now)} → ${fmtN(ohne)}</small></button></div>`,
    );
  }
  const fit = w.inv.filter(it => it.t === slotType5(gearSlot)).sort((a, b) => itemScore5(b) - itemScore5(a));
  h += fit.length
    ? fit
        .map(it => {
          const neu = upWith(id, gearSlot, it);
          return itemRow(
            it,
            `<div class="w5iact"><button class="btn" data-act="equip" data-id="${it.id}" style="--c:${neu >= now ? '#6dffb0' : '#ff8a3d'}">Anlegen<small> UP ${fmtN(now)} → ${fmtN(neu)}</small></button></div>`,
          );
        })
        .join('')
    : `<p class="w5hint">Im Inventar liegt nichts für diesen Platz. Ausrüstung fällt von besiegten Gegnern (Bosse sicher) und steckt in Ausrüstungsboxen im Shop.</p>`;
  return h;
}
// Inventar: Währungen, Material, Kerne und Ausrüstung, nach Art sortiert
function panelInv() {
  const w = W(),
    cores = HERO_IDS5.filter(id => w.heroes[id] && w.heroes[id].s > 0),
    list = w.inv
      .filter(it => invType === 'alle' || it.t === invType)
      .sort(
        (a, b) =>
          GEAR_TYPE_IDS5.indexOf(a.t) - GEAR_TYPE_IDS5.indexOf(b.t) || b.q - a.q || itemScore5(b) - itemScore5(a),
      ),
    junk = q => w.inv.filter(it => it.q <= q && !it.set);
  let h = `<div class="w5card" style="--c:#9b98c8"><div class="w5body"><h3>Währungen</h3><p class="w5wrap">${cur5('l', Math.floor(w.cur.l))} Lumen · ${cur5('k', w.cur.k)} Kryon · ${cur5('d', w.cur.d)} Synchron-Staub · ${scrap5(w.cur.x)} Schrott</p></div></div>
    <div class="w5card" style="--c:#9b98c8"><div class="w5body"><h3>Material</h3><p class="w5wrap">${essLine()}</p></div></div>
    <div class="w5card" style="--c:#9b98c8"><div class="w5body"><h3>Kerne</h3><p class="w5wrap">${cores.length ? cores.map(id => `${core5(HEROES5[id].rar, w.heroes[id].s)} ${HEROES5[id].name}`).join(' · ') : 'Keine. Kerne entstehen, wenn ein Kristall einen Helden enthält, den du schon hast.'}</p></div></div>
    <p class="w5hint"><b>Ausrüstung (${w.inv.length})</b> · Recyceln macht aus einem Teil Schrott; für ${BOX_COST5} Schrott gibt es im Shop eine Ausrüstungsbox.</p>
    <div class="w5filter"><button class="w5f${invType === 'alle' ? ' sel' : ''}" data-invf="alle">Alle</button>${GEAR_TYPE_IDS5.map(t => `<button class="w5f${invType === t ? ' sel' : ''}" data-invf="${t}">${GEAR_TYPES5[t].name} ${w.inv.filter(it => it.t === t).length}</button>`).join('')}</div>
    <div class="w5acts">${[0, 1]
      .map(q => {
        const j = junk(q);
        return `<button class="btn" data-act="recyall" data-id="${q}" style="--c:${CUR5.x.col}"${j.length ? '' : ' disabled'}><span class="price"><span>${q ? 'Gewöhnliches und Seltenes' : 'Alles Gewöhnliche'} recyceln (${j.length})</span>${scrap5(j.reduce((a, it) => a + scrapOf5(it), 0))}</span></button>`;
      })
      .join('')}</div><p class="w5hint">Set-Teile bleiben dabei liegen.</p>`;
  h += list.length
    ? list
        .map(it =>
          itemRow(
            it,
            `<div class="w5iact"><button class="btn" data-act="recy" data-id="${it.id}" style="--c:${CUR5.x.col}"><span class="price"><span>Recyceln</span>${scrap5(scrapOf5(it))}</span></button></div>`,
          ),
        )
        .join('')
    : `<p class="w5hint">${w.inv.length ? 'Nichts von dieser Art.' : 'Noch keine Ausrüstung. Sie fällt von besiegten Gegnern, Bosse lassen immer zwei Teile fallen. Angelegt wird sie auf der Karte eines Helden (Reiter „Helden“ → „Ausrüstung“).'}</p>`;
  return h;
}
function panelHelden() {
  if (gearHero && W().heroes[gearHero]) return panelGear(gearHero);
  // Die Reihenfolge bleibt stehen, solange man in der Übersicht arbeitet (Rückmeldung des Nutzers: Beim Aufwerten sprangen die
  // Karten hin und her). Neu sortiert wird nur beim Betreten der Welt und beim Klick auf den Reiter; neue Helden kommen ans Ende.
  if (!heroOrder) heroOrder = ownedSorted();
  else heroOrder = heroOrder.filter(id => W().heroes[id]).concat(ownedSorted().filter(id => !heroOrder.includes(id)));
  const own = heroOrder,
    rest = HERO_IDS5.filter(id => !W().heroes[id]).sort(
      (a, b) => RARITY_IDS5.indexOf(HEROES5[a].rar) - RARITY_IDS5.indexOf(HEROES5[b].rar),
    );
  return (
    `<p class="w5hint">${own.length} von ${HERO_IDS5.length} Helden gefunden, der stärkste zuerst (sortiert wird beim Öffnen und beim Tippen auf „Helden“). <b>UP</b> ist die Wertung eines Helden aus Leben, Schaden, Stufe, Rang und Seltenheit. Material für den Durchbruch alle 10 Stufen gibt es in den Zonen (Reiter „Zonen“ zeigt, welche Zone was gibt): ${essLine()}<br>${cur5('d', 'Synchron-Staub')} ersetzt fehlende Kerne beim Rang. Du bekommst ihn, indem du Kerne von Basishelden synchronisierst (Knopf auf ihrer Karte), und selten als Beute: 1 % je gewonnener Welle, 25 % je besiegtem Boss.</p>` +
    own.map(heroCard).join('') +
    rest.map(heroCard).join('')
  );
}
// Hinweis, wenn ein Nahkämpfer auf einem Platz landet, von dem aus er nicht trifft
function warnFar(slot) {
  if (!tooFar5(W(), slot)) return false;
  const H = HEROES5[W().team[slot]];
  toast(`${H.name} kämpft im Nahkampf und trifft aus der Reihe „${ROW_NAMES5[rowOf5(slot)]}“ nicht`);
  return true;
}
// Aufstellung als 3×3-Raster, gesehen wie im Lauf: links hinten, rechts vorn (dort kommen die Gegner)
function panelTeam() {
  const w = W(),
    n = w.team.filter(Boolean).length;
  let h = `<p class="w5hint">Drei Reihen mit je drei Feldern, rechts ist vorn. <b>Verteidiger und Angreifer kämpfen im Nahkampf und treffen aus der vordersten besetzten Reihe und der direkt dahinter</b> – steht einer zu weit hinten, ist sein Feld rot. Gegner im Nahkampf greifen die vorderste Reihe an, Schützen treffen alle. Höchstens ${TEAM_SIZE5} Helden, darunter ein Champion und zwei Legendäre. Zieh einen Helden auf ein anderes Feld – oder tippe erst das Feld, dann den Helden an. Eine Änderung beginnt die Welle neu.</p>
    <div class="w5grid">`;
  for (const row of [2, 1, 0]) {
    h += `<div class="w5row"><small>${ROW_NAMES5[row]}</small>`;
    for (let col = 0; col < 3; col++) {
      const i = row * 3 + col,
        id = w.team[i],
        far = tooFar5(w, i);
      h += `<button class="w5slot${i === w5Slot ? ' sel' : ''}${far ? ' far' : ''}${id ? '' : ' empty'}" data-slot="${i}">${id ? portrait(id, 16) + `<b>${HEROES5[id].name}</b>` : '<span class="w5q sm">+</span>'}${far ? '<em>trifft von hier nicht</em>' : ''}</button>`;
    }
    h += `</div>`;
  }
  h += `</div><div class="w5acts"><button class="btn" data-act="clear" style="--c:#ff6b84"${w.team[w5Slot] && n > 1 ? '' : ' disabled'}>${w.team[w5Slot] ? HEROES5[w.team[w5Slot]].name + ' aus der Gruppe nehmen' : 'Feld ist leer'}</button></div>
    <div class="w5acts"><button class="btn" data-act="optall" style="--c:#ffe14f"${w.inv.length ? '' : ' disabled'}>Ausrüstung der Gruppe optimieren</button></div><p class="w5hint">${n} von ${TEAM_SIZE5} Helden aufgestellt · Wertung der Gruppe: <b>UP ${fmtN(w.team.filter(Boolean).reduce((a, id) => a + up5(id), 0))}</b></p><div class="w5chips">`;
  for (const id of ownedSorted()) {
    const H = HEROES5[id],
      at = w.team.indexOf(id),
      blk = slotBlock5(w, w5Slot, id);
    h += `<button class="w5chip${blk ? ' poor' : ''}${at === w5Slot ? ' sel' : ''}" data-pick="${id}" style="--c:${RARITY5[H.rar].col}">${portrait(id, 15)}<span><b>${H.name}</b><small style="color:${CLASSES5[H.cls].col}">${CLASSES5[H.cls].name} · UP ${fmtN(up5(id))}${at >= 0 ? ' · ' + ROW_NAMES5[rowOf5(at)] : ''}</small></span></button>`;
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
  if (lastBox)
    h += `<div class="w5res" style="--c:${GEAR_Q5[lastBox.q].col}"><div class="w5box"></div><div><h3>Aus der Box: ${itemName5(lastBox)}</h3><p>${itemText5(lastBox)} · Stufe ${lastBox.s} · ${qTag(lastBox)}${setTag(lastBox)}<br>Liegt jetzt im Inventar.</p></div></div>`;
  h += `<div class="w5card" style="--c:${CUR5.x.col}"><div class="w5box"></div><div class="w5body"><h3>Ausrüstungsbox</h3>
      <p>Ein zufälliges Ausrüstungsteil auf der Stufe deiner höchsten gewonnenen Welle. ${GEAR_Q5.map((Q, i) => `<span style="color:${Q.col}">${Q.name} ${BOX_W5[i]} %</span>`).join(' · ')}. Schrott gibt es fürs Recyceln im Inventar.</p>
      <div class="w5acts"><button class="btn" data-act="box" style="--c:${CUR5.x.col}"><span class="price"><span>Öffnen</span>${scrap5(BOX_COST5)}</span></button></div></div></div>`;
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
  p.innerHTML = { helden: panelHelden, team: panelTeam, inv: panelInv, shop: panelShop, zonen: panelZonen }[w5Tab]();
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
              : a === 'box'
                ? w.cur.x >= BOX_COST5
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
    } else if (a === 'gear') {
      gearHero = id;
      $('#w5panel').scrollTop = 0;
      return renderW5();
    } else if (a === 'gback') {
      gearHero = null;
      return renderW5();
    } else if (a === 'opt' || a === 'optall') {
      // Optimieren: ein Held oder die ganze Gruppe, der Stärkste wählt zuerst
      const ids = a === 'opt' ? [gearHero] : w.team.filter(Boolean).sort((x, y) => up5(y) - up5(x)),
        vor = ids.reduce((s2, h) => s2 + up5(h), 0);
      let n = 0;
      for (const h of ids) n += optimizeGear5(w, h);
      Snd.play(n ? 'buy' : 'ui');
      toast(
        n
          ? `${n} ${n === 1 ? 'Teil' : 'Teile'} getauscht · UP ${fmtN(vor)} → ${fmtN(ids.reduce((s2, h) => s2 + up5(h), 0))}`
          : 'Schon optimal ausgerüstet',
      );
    } else if (a === 'equip') {
      if (!equip5(w, gearHero, gearSlot, +id)) return;
      Snd.play('buy');
    } else if (a === 'unequip') {
      if (!unequip5(w, gearHero, gearSlot)) return;
      Snd.play('ui');
    } else if (a === 'recy') {
      const n = recycle5(w, +id);
      if (!n) return;
      Snd.play('buy');
      toast(`+${n} Schrott`);
    } else if (a === 'recyall') {
      const n = recycleAll5(w, +id);
      Snd.play('buy');
      toast(`+${n} Schrott`);
    } else if (a === 'box') {
      const it = buyBox5(w);
      if (!it) {
        Snd.play('no');
        return toast(`Dir fehlen ${BOX_COST5 - w.cur.x} Schrott – recycle Ausrüstung im Inventar`);
      }
      lastBox = it;
      lastRes = null;
      Snd.play(it.q >= 2 ? 'nova' : 'buy');
      $('#w5panel').scrollTop = 0;
    } else if (a === 'clear') {
      if (setSlot5(w, w5Slot, null)) run5.begin(true);
    } else if (a === 'hold') {
      w.hold = !w.hold; // die laufende Welle geht weiter, nur das Vorrücken danach ändert sich
    }
    return again();
  }
  const gs = t.closest('[data-gslot]');
  if (gs) {
    gearSlot = gs.dataset.gslot;
    return renderW5();
  }
  const fl = t.closest('[data-invf]');
  if (fl) {
    invType = fl.dataset.invf;
    return renderW5();
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
