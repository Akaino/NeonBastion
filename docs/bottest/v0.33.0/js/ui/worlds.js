import { Snd } from '../audio/sound.js';
import { fmtD } from '../core/format.js';
import { TAU } from '../core/util.js';
import { show, toast } from './common.js';
import { $ } from './dom.js';
import { goHub } from './hub.js';
import { W, WORLDS, save, setWorld } from './state.js';
import { worldOpen } from '../world2/save.js';
import { w2BonusForW1 } from '../world2/stats.js';

/* ---------- Weltenkarte (seit 0.33.0, Vorgabe des Nutzers) ----------
   Aufbau wie der Skilltree: ein Kern in der Mitte, fünf Welten im Kreis darum. Hinter jeder Welt liegt weiter außen ein Platz für eine
   weitere Version dieser Welt; diese Plätze sind verdeckt, ihre Inhalte und Bedingungen sind noch nicht festgelegt.
   Zustände: open = spielbar, soon = „Demnächst“ (sichtbar, nicht betretbar), hidden = verdeckt („?“). */
export const WORLD_MAP = [
  { id: 1, name: 'Neon-Sektor', col: '#3df5ff', state: () => 'open' },
  { id: 2, name: 'Gitterfestung', col: '#ff8a3d', state: () => (worldOpen(2) ? 'open' : 'soon') },
  {
    id: 3,
    name: 'Arcade',
    col: '#8cff4f',
    state: () => 'soon',
    text: 'Ein Arcade-Shooter: Du fliegst eines von drei Raumschiffen, die Gegner kommen von oben. Das Schiff feuert von selbst, unterwegs sammelst du Verbesserungen ein.',
  },
  {
    id: 4,
    name: 'Classic Tower Defense',
    col: '#ff4fd8',
    state: () => 'soon',
    text: 'Klassisches Tower Defense: Die Gegner laufen feste Wege entlang, du baust Türme an den Rand. Hier gibt es keine Basis.',
  },
  { id: 5, name: 'Verborgene Welt', col: '#8a86c0', state: () => 'hidden' },
];
const R_WORLD = 96,
  R_VER = 180;
const pos = (i, r) => {
  const a = -TAU / 4 + (i * TAU) / WORLD_MAP.length;
  return [Math.cos(a) * r, Math.sin(a) * r];
};
// Ausgewählter Knoten der Karte: Welt-Nummer oder 'v' + Welt-Nummer für ihre zweite Version
export let worldSel = 1;
export function setWorldSel(v) {
  return (worldSel = v);
}

$('#bWorlds').onclick = () => {
  setWorldSel(W.id);
  show('worlds');
  renderWorlds();
};

function mapSvg() {
  const n = WORLD_MAP.length;
  let h = `<svg viewBox="-202 -202 404 404" role="img" aria-label="Weltenkarte">`;
  // Sektoren, Ringe
  WORLD_MAP.forEach((w, i) => {
    const a0 = -TAU / 4 + ((i - 0.5) * TAU) / n,
      a1 = a0 + TAU / n,
      p = (a, r) => (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1);
    h += `<path class="wsec" d="M0 0L${p(a0, 196)}A196 196 0 0 1 ${p(a1, 196)}Z" fill="${w.col}"/>`;
  });
  h += `<circle class="wring" r="${R_WORLD}"/><circle class="wring" r="${R_VER}"/>`;
  // Verbindungen
  WORLD_MAP.forEach((w, i) => {
    const [x, y] = pos(i, R_WORLD),
      [vx, vy] = pos(i, R_VER),
      on = w.state() === 'open';
    h += `<line class="wline${on ? ' on' : ''}" x1="0" y1="0" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="${w.col}"/>`;
    h += `<line class="wline dim" x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${vx.toFixed(1)}" y2="${vy.toFixed(1)}" stroke="${w.col}"/>`;
  });
  h += `<g class="wcore"><circle r="24"/><text y="4">Kern</text></g>`;
  // Welten und ihre verdeckten zweiten Versionen
  WORLD_MAP.forEach((w, i) => {
    const st = w.state(),
      [x, y] = pos(i, R_WORLD),
      [vx, vy] = pos(i, R_VER),
      below = y > 20,
      name = st === 'hidden' ? '' : w.name,
      cut = name.lastIndexOf(' ', 14),
      lines = (name.length > 14 && cut > 0 ? [name.slice(0, cut), name.slice(cut + 1)] : name ? [name] : []).map(t => [
        'lab',
        t,
      ]);
    // Name und Zustand stehen als Block auf der Seite, die vom Kern wegzeigt: unten unter dem Knoten, sonst darüber
    if (W.id === w.id) lines.push(['tag', 'Aktiv']);
    else if (st === 'soon') lines.push(['tag', 'Demnächst']);
    const y0 = below ? 47 : -38 - (lines.length - 1) * 13;
    h += `<g class="wnode ${st}${worldSel === w.id ? ' sel' : ''}${W.id === w.id ? ' act' : ''}" data-w="${w.id}" style="--c:${w.col}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})">
      <circle class="hit" r="40"/><circle class="body" r="30"/><text class="num" y="8">${st === 'hidden' ? '?' : w.id}</text>
      ${lines.map(([c, t], k) => `<text class="${c}" y="${y0 + k * 13}">${t}</text>`).join('')}</g>`;
    h += `<g class="wnode ver hidden${worldSel === 'v' + w.id ? ' sel' : ''}" data-w="v${w.id}" style="--c:${w.col}" transform="translate(${vx.toFixed(1)} ${vy.toFixed(1)})"><circle class="hit" r="24"/><circle class="body" r="15"/><text class="num small" y="5">?</text></g>`;
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
    <div class="act">${W.id === w.id ? '<button class="btn" disabled>Aktive Welt</button>' : `<button class="btn big" id="bEnter" style="--c:${w.col}">Welt betreten</button>`}</div>`;
}

export function renderWorlds() {
  $('#wmap').innerHTML = mapSvg();
  $('#wsheet').innerHTML = sheetHtml();
  const b = $('#bEnter');
  if (b)
    b.onclick = () => {
      setWorld(worldSel);
      Snd.play('nova');
      goHub();
      toast(`Willkommen in: ${W.name}`);
    };
}
$('#wmap').addEventListener('click', e => {
  const g = e.target.closest('[data-w]');
  if (!g) return;
  const v = g.dataset.w;
  setWorldSel(v[0] === 'v' ? v : +v);
  Snd.play('ui');
  renderWorlds();
});
