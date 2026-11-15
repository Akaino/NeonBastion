import { Snd } from '../audio/sound.js';
import { fmtD } from '../core/format.js';
import { TAU } from '../core/util.js';
import { show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { goHub } from './hub.js';
import { W, WORLDS, save, setWorld } from './state.js';
import { worldOpen } from '../world2/save.js';
import { w2BonusForW1 } from '../world2/stats.js';

/* ---------- Weltenkarte (seit 0.33.0, Startseite seit 0.34.0, Vorgaben des Nutzers) ----------
   Aufbau wie der Skilltree: der Kern in der Mitte, fünf Welten im Kreis darum. Hinter jeder Welt liegt weiter außen ein Platz für eine
   weitere Version dieser Welt; diese Plätze sind verdeckt, ihre Inhalte und Bedingungen sind noch nicht festgelegt.
   Zustände: open = spielbar, soon = „Demnächst“ (sichtbar, nicht betretbar), hidden = verdeckt („?“).
   Jede Welt hat einen eigenen Knoten (Umriss und bewegtes Motiv, `ART`), der Name steht im Knoten.
   Die Karte wird beim Öffnen einmal aufgebaut; Antippen ändert nur Klassen und die Infokarte, damit nichts springt und keine Bewegung neu beginnt. */
export const WORLD_MAP = [
  { id: 1, name: 'Neon-Sektor', lines: ['Neon-Sektor'], col: '#3df5ff', state: () => 'open' },
  {
    id: 2,
    name: 'Gitterfestung',
    lines: ['Gitterfestung'],
    col: '#ff8a3d',
    state: () => (worldOpen(2) ? 'open' : 'soon'),
  },
  {
    id: 3,
    name: 'Arcade',
    lines: ['Arcade'],
    col: '#8cff4f',
    state: () => 'soon',
    text: 'Ein Arcade-Shooter: Du fliegst eines von drei Raumschiffen, die Gegner kommen von oben. Das Schiff feuert von selbst, unterwegs sammelst du Verbesserungen ein.',
  },
  {
    id: 4,
    name: 'Classic Tower Defense',
    lines: ['Classic', 'Tower Defense'],
    col: '#ff4fd8',
    state: () => 'soon',
    text: 'Klassisches Tower Defense: Die Gegner laufen feste Wege entlang, du baust Türme an den Rand. Hier gibt es keine Basis.',
  },
  { id: 5, name: 'Verborgene Welt', lines: [], col: '#9a8cff', state: () => 'hidden' },
];
const VB = 210, // halbe Kantenlänge der Karte
  R_WORLD = 114,
  R_VER = 194;
const pos = (i, r) => {
  const a = -TAU / 4 + (i * TAU) / WORLD_MAP.length;
  return [Math.cos(a) * r, Math.sin(a) * r];
};
const f1 = v => v.toFixed(1);
const hex = r =>
  'M' +
  [0, 1, 2, 3, 4, 5]
    .map(k => f1(Math.cos(-TAU / 4 + (k * TAU) / 6) * r) + ' ' + f1(Math.sin(-TAU / 4 + (k * TAU) / 6) * r))
    .join('L') +
  'Z';
// fester Zufall, damit Sterne und Motive bei jedem Aufbau gleich liegen
const rng = seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* Knoten je Welt: shape = Umriss (ein SVG-Element ohne Klasse; dient auch als Ausschnitt für das Motiv), art = Motiv im Inneren,
   deco = Beiwerk außerhalb des Umrisses. Alles um den Ursprung gezeichnet, Radius etwa 46. */
const ART = {
  // Neon-Sektor: Sechseck wie die Basis, kreisende Drohnen, Impulsring
  1: () => ({
    shape: `<path d="${hex(50)}"/>`,
    art: `<path class="a2" d="${hex(39)}"/><path class="a3" d="${hex(27)}"/><circle class="wping" r="20"/>`,
    deco: `<g class="worb">${[0, 1, 2].map(k => `<path class="adrone" transform="rotate(${k * 120}) translate(0 -58)" d="M-4 3L0 -5L4 3L0 1Z"/>`).join('')}</g>`,
  }),
  // Gitterfestung: Festung mit abgeschrägten Ecken, Gitter, Abtaststrahl, vier Ecktürme
  2: () => ({
    shape: `<path d="M-32 -45H32L45 -32V32L32 45H-32L-45 32V-32Z"/>`,
    art:
      [-30, -15, 0, 15, 30].map(v => `<path class="a2" d="M${v} -46V46M-46 ${v}H46"/>`).join('') +
      `<rect class="wscan" x="-46" y="-8" width="92" height="16"/>`,
    deco: [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]
      .map(
        ([x, y]) =>
          `<rect class="aturret" x="-5.5" y="-5.5" width="11" height="11" transform="translate(${x * 41} ${y * 41}) rotate(45)"/>`,
      )
      .join(''),
  }),
  // Arcade: Sternenflug nach unten, Schiff unten, Gegner oben, drehender Skalenring
  3: () => {
    const r = rng(11);
    let st = '';
    for (let k = 0; k < 16; k++) {
      const x = f1(r() * 84 - 42),
        y = r() * 120 - 60,
        l = 3 + r() * 6;
      st += `<path d="M${x} ${f1(y)}v${f1(l)}M${x} ${f1(y - 120)}v${f1(l)}"/>`;
    }
    return {
      shape: `<circle r="46"/>`,
      art: `<g class="wfall">${st}</g><path class="aship" d="M0 22L8 37L0 33L-8 37Z"/><path class="afoe" d="M-22 -36l5 8l5 -8M-5 -40l5 8l5 -8M12 -36l5 8l5 -8"/>`,
      deco: `<circle class="wticks" r="52"/>`,
    };
  },
  // Classic Tower Defense: abgerundetes Feld, gewundener Weg mit marschierenden Gegnern, Türme am Rand
  4: () => ({
    shape: `<rect x="-45" y="-45" width="90" height="90" rx="15"/>`,
    art:
      `<path class="aroad" d="M-46 -27H20a13 13 0 0 1 0 26H-20a13 13 0 0 0 0 26H46"/><path class="wmarch" d="M-46 -27H20a13 13 0 0 1 0 26H-20a13 13 0 0 0 0 26H46"/>` +
      [
        [-18, -40],
        [34, -40],
        [-36, 12],
        [18, 38],
      ]
        .map(([x, y]) => `<rect class="atower" x="${x - 4}" y="${y - 4}" width="8" height="8" rx="2"/>`)
        .join(''),
    deco: `<path class="acorner" d="M-52 -38V-52H-38M38 -52H52V-38M52 38V52H38M-38 52H-52V38"/>`,
  }),
  // Verborgene Welt: Nebelwirbel hinter gestricheltem Rand
  5: () => ({
    shape: `<circle r="45"/>`,
    art: `<g class="wswirl">${[0, 1, 2].map(k => `<path class="a2" transform="rotate(${k * 120})" d="M0 -6C14 -30 40 -22 38 6"/>`).join('')}</g>`,
    deco: `<circle class="wticks slow" r="51"/>`,
  }),
};

// Ausgewählter Knoten der Karte: Welt-Nummer oder 'v' + Welt-Nummer für ihre zweite Version
export let worldSel = 1;
export function setWorldSel(v) {
  return (worldSel = v);
}

export function openWorlds() {
  setWorldSel(W.id);
  show('worlds');
  renderWorlds();
}
$('#bWorlds').onclick = openWorlds;

function mapSvg() {
  const n = WORLD_MAP.length;
  let h = `<svg viewBox="${-VB} ${-VB} ${2 * VB} ${2 * VB}" role="img" aria-label="Weltenkarte"><defs>`;
  WORLD_MAP.forEach(w => {
    const a = ART[w.id]();
    h += `<radialGradient id="wg${w.id}"><stop offset="0" stop-color="${w.col}" stop-opacity=".34"/><stop offset=".55" stop-color="${w.col}" stop-opacity=".1"/><stop offset="1" stop-color="${w.col}" stop-opacity="0"/></radialGradient><clipPath id="wc${w.id}">${a.shape}</clipPath>`;
  });
  h += `<radialGradient id="wg0"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".4" stop-color="#3df5ff" stop-opacity=".16"/><stop offset="1" stop-color="#3df5ff" stop-opacity="0"/></radialGradient></defs>`;
  // Sterne: reichen über die Karte hinaus, damit auch hohe und breite Fenster gefüllt sind
  const r = rng(7);
  for (let k = 0; k < 170; k++)
    h += `<circle class="wstar t${k % 4}" cx="${f1((r() * 2 - 1) * VB * 2.6)}" cy="${f1((r() * 2 - 1) * VB * 1.9)}" r="${f1(0.35 + r() * r() * 1.5)}"/>`;
  // Sektoren, Leuchten hinter den Welten, Bahnen
  WORLD_MAP.forEach((w, i) => {
    const a0 = -TAU / 4 + ((i - 0.5) * TAU) / n,
      a1 = a0 + TAU / n,
      p = (a, rr) => f1(Math.cos(a) * rr) + ' ' + f1(Math.sin(a) * rr),
      [x, y] = pos(i, R_WORLD);
    h += `<path class="wsec" d="M${p(a0, 30)}L${p(a0, 204)}A204 204 0 0 1 ${p(a1, 204)}L${p(a1, 30)}" fill="${w.col}"/>`;
    h += `<circle class="wglow ${w.state()}${W.id === w.id ? ' act' : ''}" cx="${f1(x)}" cy="${f1(y)}" r="100" fill="url(#wg${w.id})"/>`;
  });
  h += `<circle class="wring r1" r="${R_WORLD}"/><circle class="wring r2" r="${R_VER}"/><circle class="wring r3" r="62"/>`;
  // Verbindungen: offene Welten bekommen einen laufenden Energiepuls vom Kern
  WORLD_MAP.forEach((w, i) => {
    const [x, y] = pos(i, R_WORLD),
      [vx, vy] = pos(i, R_VER),
      xy = `x1="0" y1="0" x2="${f1(x)}" y2="${f1(y)}" stroke="${w.col}"`;
    h += `<line class="wline ${w.state()}" ${xy}/>`;
    if (w.state() === 'open') h += `<line class="wpulse" pathLength="100" style="animation-delay:${-i * 0.7}s" ${xy}/>`;
    h += `<line class="wline ver" x1="${f1(x)}" y1="${f1(y)}" x2="${f1(vx)}" y2="${f1(vy)}" stroke="${w.col}"/>`;
  });
  // Kern
  h += `<g class="wcore"><circle class="glow" r="70" fill="url(#wg0)"/><circle class="orbit" r="31"/><path class="h1" d="${hex(23)}"/><path class="h2" d="${hex(13)}"/><circle class="dot" r="4.5"/></g>`;
  // Welten und ihre verdeckten zweiten Versionen
  WORLD_MAP.forEach((w, i) => {
    const st = w.state(),
      [x, y] = pos(i, R_WORLD),
      [vx, vy] = pos(i, R_VER),
      a = ART[w.id](),
      L = w.lines,
      tag = W.id === w.id ? 'Aktiv' : st === 'soon' ? 'Demnächst' : '',
      tw = tag.length * 5.5 + 13;
    h += `<g class="wnode w${w.id} ${st}${worldSel === w.id ? ' sel' : ''}${W.id === w.id ? ' act' : ''}" data-w="${w.id}" style="--c:${w.col}" transform="translate(${f1(x)} ${f1(y)})">
      <circle class="hit" r="54"/><g class="selring">${a.shape}</g><g class="deco">${a.deco}</g><g class="body">${a.shape}</g>
      <g class="art" clip-path="url(#wc${w.id})">${a.art}</g><g class="rim">${a.shape}</g>
      ${
        st === 'hidden'
          ? `<text class="q" y="13">?</text>`
          : `<ellipse class="plate" rx="41" ry="${L.length * 8 + 5}"/>` +
            L.map(
              (t, k) =>
                `<text class="name${t.length > 11 ? ' long' : ''}" y="${f1((k - (L.length - 1) / 2) * 14 + 4)}">${t}</text>`,
            ).join('')
      }
      ${tag ? `<g class="tag" transform="translate(0 58)"><rect x="${f1(-tw / 2)}" y="-8" width="${f1(tw)}" height="16" rx="8"/><text y="3.4">${tag}</text></g>` : ''}</g>`;
    h += `<g class="wnode ver hidden${worldSel === 'v' + w.id ? ' sel' : ''}" data-w="v${w.id}" style="--c:${w.col}" transform="translate(${f1(vx)} ${f1(vy)})"><circle class="hit" r="22"/><circle class="vrim" r="13"/><text class="vq" y="4.5">?</text></g>`;
  });
  return h + '</svg>';
}

function sheetHtml() {
  if (String(worldSel)[0] === 'v') {
    const w = WORLD_MAP.find(x => 'v' + x.id === worldSel),
      known = w.state() !== 'hidden';
    return `<h3>Zweite Version <span class="tag" style="--c:${w.col}">Verborgen</span></h3><p>${known ? `Eine weitere Version von „${w.name}“.` : 'Eine weitere Version dieser Welt.'} Noch ist nichts darüber bekannt.</p>`;
  }
  const w = WORLD_MAP.find(x => x.id === worldSel),
    st = w.state();
  if (st === 'hidden')
    return `<h3>Verborgene Welt <span class="tag" style="--c:${w.col}">?</span></h3><p>Über diese Welt ist noch nichts bekannt.</p>`;
  if (st === 'soon')
    return `<h3>${w.name} <span class="tag" style="--c:${w.col}">Demnächst</span></h3><p>${w.text || WORLDS[w.id].text}</p><div class="act"><button class="btn poor" disabled>Demnächst verfügbar</button></div>`;
  const Wd = WORLDS[w.id],
    best = w.id === 1 ? save.best : save.w2.best,
    bonus =
      w.id === 1 ? `×${fmtD(w2BonusForW1(save), 2)} Schaden` : `×${fmtD(1 + 0.01 * (save.best || 0), 2)} Turmschaden`,
    note =
      w.id === 1
        ? 'Jede Welle Rekord in der Gitterfestung gibt hier +2 % Schaden.'
        : 'Jede Welle Rekord im Neon-Sektor gibt hier +1 % Turmschaden.';
  return `<h3>${w.name} <span class="tag" style="--c:${w.col}">${W.id === w.id ? 'Aktiv' : 'Offen'}</span></h3><p>${Wd.text}</p>
    <div class="cmp" style="--c:${w.col}"><div><span>Rekord</span><b>Welle ${best || 0}</b></div><div><span>Weltenbonus</span><b>${bonus}</b></div></div>
    <p class="trayinfo">${note}</p>
    <div class="act"><button class="btn big" id="bEnter" style="--c:${w.col}">${W.id === w.id ? 'Weiterspielen' : 'Welt betreten'}</button></div>`;
}

function renderSheet() {
  $('#wsheet').innerHTML = sheetHtml();
  const b = $('#bEnter');
  if (b)
    b.onclick = () => {
      const neu = W.id !== worldSel;
      if (neu) setWorld(worldSel);
      Snd.play(neu ? 'nova' : 'ui');
      goHub();
      if (neu) toast(`Willkommen in: ${W.name}`);
    };
}
export function renderWorlds() {
  $('#wmap').innerHTML = mapSvg();
  renderSheet();
}
$('#wmap').addEventListener('click', e => {
  const g = e.target.closest('[data-w]');
  if (!g) return;
  const v = g.dataset.w;
  setWorldSel(v[0] === 'v' ? v : +v);
  Snd.play('ui');
  $$('#wmap .wnode').forEach(el => el.classList.toggle('sel', el === g));
  renderSheet();
});
