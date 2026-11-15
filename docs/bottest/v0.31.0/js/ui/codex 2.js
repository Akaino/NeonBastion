import { fmtN } from '../core/format.js';
import { BOSS_KINDS, BOSS_NAMES } from '../data/bosses.js';
import { ETYPES } from '../data/enemies.js';
import { show } from './common.js';
import { $, $$ } from './dom.js';
import { R, save } from './state.js';

export /* ---------- Enzyklopädie: was man besiegt hat, getrennt nach Gegnern und Bossen ---------- */
const CODEX_TYPES = [
  'swarm',
  'brute',
  'shooter',
  'sprinter',
  'healer',
  'queen',
  'shield',
  'bomber',
  'ram',
  'splitter',
  'mite',
  'cloaker',
  'tank',
  'siege',
  'revenant',
  'jammer',
  'commander',
  'giant',
  'jumper',
  'shade',
  'phaser',
  'hacker',
  'brooder',
  'egg',
  'thief',
  'mortar',
  'gas',
  'sniper',
  'mirror',
  'pair',
];

export function renderCodex() {
  const K = save.kills || {},
    n = t => K[t] || 0;
  let h = '<h3 class="sect">Gegner</h3>';
  const card = (known, col, cv, name, sub, text, count, extra) =>
    `<article class="hcard ${known ? '' : 'lock'}" style="--c:${known ? col : '#5f5c8c'}"><div class="hc-top">${known ? cv : '<div class="unk">?</div>'}<div><h3>${known ? name : 'Unbekannt'}</h3><small>${sub}</small>${extra || ''}</div>${known ? `<div class="lvl"><small>Besiegt</small><br>${fmtN(count)}</div>` : ''}</div><p style="margin:0;color:var(--muted);font-size:13px">${known ? text : 'Noch nicht besiegt.'}</p></article>`;
  for (const t of CODEX_TYPES) {
    const T = ETYPES[t],
      k = n(t),
      sh = n('shiny:' + t);
    h += card(
      k > 0,
      T.col,
      `<canvas data-e="${t}" width="112" height="112"></canvas>`,
      T.name,
      t === 'mite' ? (k ? 'entsteht aus Spaltern' : 'Herkunft unbekannt') : `ab Welle ${T.from || 1}`,
      T.text,
      k,
      sh ? `<div class="shiny">✦ Schillernd besiegt${sh > 1 ? ' ×' + fmtN(sh) : ''}</div>` : '',
    );
  }
  h += card(
    n('elite') > 0,
    '#ffe14f',
    '<canvas data-e="elite" width="112" height="112"></canvas>',
    'Elite',
    'jede Art, ab Welle 1',
    'Jeder Gegner kann als Elite erscheinen: fünffaches Leben, doppelter Schaden, mehr Beute.',
    n('elite'),
  );
  h += '<h3 class="sect">Bosse</h3>';
  for (const name of BOSS_NAMES) {
    const B = BOSS_KINDS[name],
      k = n('boss:' + name);
    h += card(
      k > 0,
      ETYPES.boss.col,
      `<canvas data-e="boss" width="112" height="112"></canvas>`,
      name,
      'Boss · alle 10 Wellen',
      `<b style="color:var(--ink);font-weight:600">${B.abil}:</b> ${B.text}`,
      k,
    );
  }
  h += card(
    n('twin') > 0,
    '#ff6b84',
    '<canvas data-e="twin" width="112" height="112"></canvas>',
    'Doppelboss',
    'alle 25 Wellen',
    'Zwei Bosse verschiedener Art greifen von gegenüberliegenden Seiten an.',
    n('twin'),
  );
  $('#clist').innerHTML = h;
  $$('#clist canvas[data-e]').forEach(cv => {
    const t = cv.dataset.e,
      c = cv.getContext('2d'),
      dr = (type, r, col, x, y, w) => {
        const s = R.enemySprite(type, r, col);
        c.drawImage(s, x, y, w, w);
      };
    if (t === 'elite') {
      dr('brute', 20, ETYPES.brute.col, 14, 14, 84);
      const s = R.eliteRing(20);
      c.drawImage(s, 6, 6, 100, 100);
    } else if (t === 'twin') {
      dr('boss', 24, ETYPES.boss.col, 0, 18, 72);
      dr('boss', 24, ETYPES.boss.col, 40, 22, 72);
    } else if (t === 'boss') dr('boss', 24, ETYPES.boss.col, 4, 4, 104);
    else dr(t, 20, ETYPES[t].col, 6, 6, 100);
  });
}

$('#bCodex').onclick = () => {
  show('codex');
  renderCodex();
};

/* ---------- Erfolge: jeweils Bronze, Silber, Gold. Rein zum Sammeln, ohne Belohnung. ---------- */
