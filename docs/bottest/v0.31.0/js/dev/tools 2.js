import { Snd } from '../audio/sound.js';
import { fmtN } from '../core/format.js';
import { stats } from '../core/stats.js';
import { clamp } from '../core/util.js';
import { STAGE } from '../core/version.js';
import { CUR } from '../data/currencies.js';
import { curIcon, toast } from '../ui/common.js';
import { $ } from '../ui/dom.js';
import { renderHub } from '../ui/hub.js';
import { Perf, W, persist, run, save, setWorld } from '../ui/state.js';
import { w2Unlocked } from '../world2/save.js';

$('#bW2Test').onclick = () => {
  save.w2test = !save.w2test;
  if (!save.w2test && W.id === 2 && !w2Unlocked(save)) setWorld(1);
  persist();
  updW2Btn();
  renderHub();
};

export function updW2Btn() {
  const b = $('#bW2Test');
  b.textContent = save.w2test ? 'Test-Freischaltung Gitterfestung: an' : 'Gitterfestung testweise freischalten';
  b.hidden = !save.dev || !!run || (save.best || 0) >= 100;
  $('#bDevOff').hidden = !save.dev || !!run;
  $('#bDev').hidden = !save.dev;
}
/* ---------- Testhilfen im Entwicklermodus: Ressourcen, Rekord, Startwelle, schillernde Gegner, Leistungsmessung ---------- */

export /* ---------- Testhilfen im Entwicklermodus: Ressourcen, Rekord, Startwelle, schillernde Gegner, Leistungsmessung ---------- */
function renderDev() {
  const ws = W.s(),
    w1 = W.id === 1,
    S = w1 ? stats(save) : null,
    ids = W.curIds.concat(w1 ? ['q'] : []),
    val = c => (c === 'q' ? save.q || 0 : ws.cur[c] || 0);
  const btn = (a, l) => `<button type="button" ${a}>${l}</button>`;
  let h = '';
  if (!run) {
    h +=
      `<h3>Ressourcen · ${W.name}</h3>` +
      ids
        .map(
          c =>
            `<div class="drow"><span class="cur">${curIcon(c)}<span>${CUR[c].name}</span></span><b>${fmtN(val(c))}</b><span class="dbtn">${btn(`data-dc="${c}" data-op="k"`, '+1 Tsd.')}${btn(`data-dc="${c}" data-op="m"`, '+1 Mio.')}${btn(`data-dc="${c}" data-op="x"`, '×100')}${btn(`data-dc="${c}" data-op="0"`, '0')}</span></div>`,
        )
        .join('');
    h += `<h3>Fortschritt</h3><div class="drow"><span>Rekordwelle</span><b>${ws.best || 0}</b><span class="dbtn">${[-25, -5, 5, 25].map(d => btn(`data-db="${d}"`, (d > 0 ? '+' : '−') + Math.abs(d))).join('')}</span></div>`;
    if (w1)
      h += `<div class="drow"><span>Startwelle</span><b>${save.devStart || 'normal (' + S.startWave + ')'}</b><span class="dbtn">${[-10, -1, 1, 10].map(d => btn(`data-ds="${d}"`, (d > 0 ? '+' : '−') + Math.abs(d))).join('')}${btn('data-ds="0"', 'normal')}</span></div>`;
  } else h += '<p>Ressourcen, Rekord und Startwelle lassen sich nur außerhalb eines Runs ändern.</p>';
  h +=
    `<h3>Im Run</h3>` +
    (w1
      ? `<button type="button" class="dwide${save.devShiny ? ' on' : ''}" data-dt="devShiny">Schillernder Gegner in jeder Welle: ${save.devShiny ? 'an' : 'aus'}</button>`
      : '') +
    (w1
      ? `<button type="button" class="dwide${save.devDrop ? ' on' : ''}" data-dt="devDrop">Abwurf in jeder Welle: ${save.devDrop ? 'an' : 'aus'}</button>`
      : '') +
    `<button type="button" class="dwide${save.devPerf ? ' on' : ''}" data-dt="devPerf">Leistungsmessung: ${save.devPerf ? 'an' : 'aus'}</button>` +
    (save.devPerf
      ? `<button type="button" class="dwide" data-dp="copy">Messung kopieren (${Perf.hit.length} Ruckler)</button><button type="button" class="dwide" data-dp="clear">Messung neu beginnen</button>`
      : '') +
    `<button type="button" class="dwide" data-dp="scan">Ursachensuche starten (etwa 2 Minuten, Bild und Ton setzen zwischendurch aus)</button>` +
    (Perf.scanRes && Perf.scanRes.length && !Perf.scanT
      ? `<button type="button" class="dwide" data-dp="copy">Ergebnis kopieren</button><p style="white-space:pre;font:11px/1.4 ui-monospace,Menlo,monospace;overflow-x:auto">${Perf.scanText()}</p>`
      : '') +
    `<p>Die Testhilfen ändern den Spielstand dieser Seite${STAGE ? ' (' + STAGE + ')' : ''} und gelten nur, solange der Entwicklermodus an ist.</p>`;
  $('#devBody').innerHTML = h;
}

$('#bDev').onclick = () => {
  $('#devOut').hidden = true;
  renderDev();
  $('#dev').hidden = false;
};

$('#bDevClose').onclick = () => {
  $('#dev').hidden = true;
  persist();
  if (!run) renderHub();
  updW2Btn();
};

$('#devBody').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || !save.dev) return;
  const d = b.dataset,
    ws = W.s();
  if (d.dc && !run) {
    const q = d.dc === 'q',
      v = q ? save.q || 0 : ws.cur[d.dc] || 0,
      n = d.op === 'k' ? v + 1e3 : d.op === 'm' ? v + 1e6 : d.op === 'x' ? Math.max(100, v * 100) : 0;
    if (q) save.q = n;
    else ws.cur[d.dc] = n;
  } else if (d.db && !run) {
    ws.best = clamp((ws.best || 0) + +d.db, 0, 999);
    ws.cycleBest = ws.best;
  } else if (d.ds && !run) {
    save.devStart = +d.ds ? clamp((save.devStart || stats(save).startWave) + +d.ds, 1, 999) : 0;
  } else if (d.dt) {
    save[d.dt] = !save[d.dt];
    if (d.dt === 'devPerf') save.devPerf ? Perf.start() : Perf.stop();
  } else if (d.dp === 'clear') Perf.start();
  else if (d.dp === 'scan') {
    save.devPerf = true;
    persist();
    $('#dev').hidden = true;
    $('#settings').hidden = true;
    Perf.scan();
    return;
  } else if (d.dp === 'copy') {
    const t = Perf.report(),
      o = $('#devOut'),
      fail = () => {
        o.hidden = false;
        o.value = t;
        o.focus();
        o.select();
        toast('Text steht unten, bitte markieren und kopieren');
      };
    try {
      navigator.clipboard.writeText(t).then(() => toast('Messung kopiert'), fail);
    } catch (err) {
      fail();
    }
    return;
  } else return;
  Snd.play('buy');
  persist();
  renderDev();
});
/* ---------- Entwicklermodus: 7× auf die Version tippen, dann Code eingeben ---------- */
