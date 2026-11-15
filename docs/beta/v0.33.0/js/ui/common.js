import { Snd } from '../audio/sound.js';
import { fmtN } from '../core/format.js';
import { CUR } from '../data/currencies.js';
import { $, $$ } from './dom.js';
import { W, persist, save } from './state.js';

/* ---------- icons ---------- */
export function curIcon(c) {
  const col = CUR[c].col;
  const p = {
    s: `<path d="M10 1.5 16.5 8 11 18.5 3.5 9z" fill="${col}" fill-opacity=".25" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/>`,
    k: `<circle cx="10" cy="10" r="7" fill="${col}" fill-opacity=".18" stroke="${col}" stroke-width="1.6"/><circle cx="10" cy="10" r="2.6" fill="${col}"/>`,
    p: `<path d="M10 1.8 17.1 6v8L10 18.2 2.9 14V6z" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 1.8V18.2M2.9 6 17.1 14" stroke="${col}" stroke-width=".9" opacity=".6"/>`,
    c: `<rect x="3" y="3" width="14" height="14" rx="2" fill="${col}" fill-opacity=".2" stroke="${col}" stroke-width="1.5"/><path d="M7 3V1M13 3V1M7 19v-2M13 19v-2M3 7H1M3 13H1M19 7h-2M19 13h-2" stroke="${col}" stroke-width="1.4"/><rect x="7" y="7" width="6" height="6" fill="${col}"/>`,
    m: `<path d="M10 1.5 18 6v8l-8 4.5L2 14V6z" fill="${col}" fill-opacity=".22" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/><path d="M6 8h8M6 12h8M8 5.5v9M12 5.5v9" stroke="${col}" stroke-width="1" opacity=".8"/>`,
    q: `<ellipse cx="10" cy="10" rx="8.5" ry="3.4" fill="none" stroke="${col}" stroke-width="1.4" transform="rotate(30 10 10)"/><ellipse cx="10" cy="10" rx="8.5" ry="3.4" fill="none" stroke="${col}" stroke-width="1.4" transform="rotate(-30 10 10)"/><circle cx="10" cy="10" r="2.6" fill="${col}"/>`,
    d: `<path d="M10 1 12.3 7.7 19 10 12.3 12.3 10 19 7.7 12.3 1 10 7.7 7.7z" fill="${col}" fill-opacity=".3" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`,
  }[c];
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${p}</svg>`;
}

export const curHTML = (c, v) => `<span class="cur" title="${CUR[c].name}">${curIcon(c)}<span>${fmtN(v)}</span></span>`;

export function glyph(br) {
  const g = {
    b: '<path d="M12 3 20 7.5v9L12 21 4 16.5v-9z"/><path d="M12 8 16 10.3v4.4L12 17 8 14.7v-4.4z"/>',
    u: '<path d="M12 3 21 20H3z"/><path d="M12 10v5"/>',
    h: '<path d="M5 4h14v7c0 5-3.5 8-7 9.5C8.5 19 5 16 5 11z"/><path d="m9 11 2 2 4-4"/>',
    f: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
    e: '<path d="M12 2 20 12 12 22 4 12z"/><path d="M4 12h16"/>',
    root: '<path d="M12 2 20.5 7v10L12 22 3.5 17V7z"/><circle cx="12" cy="12" r="3.5"/>',
  }[br];
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${g}</svg>`;
}

/* ---------- Welten ---------- */

export function toast(t) {
  const e = $('#toast');
  e.textContent = t;
  e.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => e.classList.remove('show'), 2600);
}

export function banner(t, sub) {
  const b = $('#banner');
  b.querySelector('b').textContent = t;
  b.querySelector('span').textContent = sub || '';
  b.classList.remove('show');
  void b.offsetWidth;
  b.classList.add('show');
}
// Menüs werden bei jedem Öffnen neu aufgebaut. Verlässt man sie, wird ihr Inhalt geleert: Die Seite bleibt klein (rund 350 statt über 2.000 Elemente),
// das hält Werbeblocker, die jede Sekunde die ganze Seite absuchen, kurz (gemessen beim Nutzer: 45 bis 145 ms Hänger je Sekunde mit „AdBlock for Safari“).

// Menüs werden bei jedem Öffnen neu aufgebaut. Verlässt man sie, wird ihr Inhalt geleert: Die Seite bleibt klein (rund 350 statt über 2.000 Elemente),
// das hält Werbeblocker, die jede Sekunde die ganze Seite absuchen, kurz (gemessen beim Nutzer: 45 bis 145 ms Hänger je Sekunde mit „AdBlock for Safari“).
export const DYN = {
  tree: ['#tw', '#sheet'],
  heroes: ['#hlist', '#slots'],
  nova: ['#novaList', '#novaTop'],
  towers: ['#tlist', '#tslots'],
  worlds: ['#wmap', '#wsheet'],
  codex: ['#clist'],
  achv: ['#alist'],
  fleet: ['#flist', '#fbar'],
};

export function show(id) {
  for (const s of ['hub', 'hud', 'tree', 'heroes', 'nova', 'towers', 'worlds', 'codex', 'achv', 'fleet']) {
    const el = $('#' + s);
    if (s !== id && !el.hidden && DYN[s])
      for (const q of DYN[s]) {
        const c = $(q);
        if (c) c.textContent = '';
      }
    el.hidden = s !== id;
  }
  if (id !== 'hud') {
    $('#pause').hidden = true;
    $('#end').hidden = true;
  }
}

export function renderCurs() {
  const ws = W.s(),
    h =
      W.curIds.map(c => curHTML(c, ws.cur[c])).join('') +
      (W.id === 1 && (save.nova || save.q) ? curHTML('q', save.q) : '');
  $('#hubCur').innerHTML = h;
  $$('[data-cur]').forEach(e => (e.innerHTML = h));
}

export function canPay(c, a) {
  return (W.s().cur[c] || 0) >= a;
}

export function pay(c, a, btn) {
  if (!canPay(c, a)) {
    Snd.play('no');
    if (btn) {
      btn.classList.remove('shake');
      void btn.offsetWidth;
      btn.classList.add('shake');
    }
    toast(`Dir fehlen ${fmtN(a - (W.s().cur[c] || 0))} ${CUR[c].name}`);
    return false;
  }
  W.s().cur[c] -= a;
  Snd.play('buy');
  persist();
  return true;
}

// Mehrere Währungen auf einmal: costs = [[Währung, Menge], …]. Bezahlt wird nur, wenn alles reicht.
export function canPayAll(costs) {
  return costs.every(([c, a]) => canPay(c, a));
}
export function payAll(costs, btn) {
  const miss = costs.find(([c, a]) => !canPay(c, a));
  if (miss) return pay(miss[0], miss[1], btn); // meldet, was fehlt
  for (const [c, a] of costs.slice(1)) W.s().cur[c] -= a;
  return pay(costs[0][0], costs[0][1], btn);
}
export function costBtn(label, c, a) {
  return `${label}<small>${curIcon(c)}${fmtN(a)}</small>`;
}

/* ---------- Startwelle wählen ---------- */
