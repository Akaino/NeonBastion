import { PI, clamp } from '../core/util.js';
import { CUR, CUR_SRC } from '../data/currencies.js';
import { nodeCost } from '../data/nodes.js';
import { canPay, curHTML, curIcon, glyph, pay, renderCurs, show } from './common.js';
import { $ } from './dom.js';
import { bindStepper, startStepper } from './hub.js';
import { FMT, PREV, PREV2, cmpRows } from './preview.js';
import { W, persist, selNode, setSelNode } from './state.js';

$('#bTree').onclick = () => {
  show('tree');
  renderTree();
  treeHome();
};

export /* ---------- skill tree ---------- */
const tv = $('#tv'),
  tw = $('#tw');

export let tz = 1,
  tx = 0,
  ty = 0;

export function applyT() {
  tw.style.transform = `translate(${tx}px,${ty}px) scale(${tz})`;
}

export function treeHome() {
  const r = tv.getBoundingClientRect();
  tz = clamp(Math.min(r.width, r.height) / 760, 0.5, 1);
  tx = r.width / 2;
  ty = r.height / 2;
  applyT();
}

export function zoomAt(f, cx, cy) {
  const nz = clamp(tz * f, 0.3, 1.8);
  f = nz / tz;
  tx = cx - (cx - tx) * f;
  ty = cy - (cy - ty) * f;
  tz = nz;
  applyT();
}

export function nodeState(n) {
  if (n.id === 'root')
    return {
      l: 1,
      cls: 'root max',
    };
  const N = W.s().nodes,
    l = N[n.id] || 0,
    lock = !((N[n.parent] || 0) > 0) && !l,
    max = l >= n.max; // bereits gekaufte Knoten bleiben sichtbar, auch wenn sich ihr Vorgänger geändert hat
  const aff = !lock && !max && canPay(n.cur, nodeCost(n, l));
  return {
    l,
    lock,
    max,
    aff,
    cls: [lock ? 'locked' : '', l > 0 ? 'owned' : '', max ? 'max' : '', aff ? 'afford' : ''].join(' '),
  };
}
// Hintergrund des Skilltrees: ein farbiger Sektor je Ast mit dem Astnamen an einer Sektorgrenze, Ringe für die Tiefe, feines Punktraster.
// Rein dekorativ und statisch (ein SVG, keine Animation pro Frame).

export // Hintergrund des Skilltrees: ein farbiger Sektor je Ast mit dem Astnamen an einer Sektorgrenze, Ringe für die Tiefe, feines Punktraster.
// Rein dekorativ und statisch (ein SVG, keine Animation pro Frame).
function treeBackdrop() {
  const BRS = W.br,
    ids = Object.keys(BRS),
    half = PI / ids.length,
    ND = Object.values(W.nodes),
    maxD = Math.ceil(Math.max(...ND.map(n => n.depth))) + 1,
    RR = 118 * (maxD + 0.8),
    f = v => v.toFixed(1);
  let s = `<defs><pattern id="tdots" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="1.1" fill="#aab6ff" fill-opacity=".13"/><circle cx="21" cy="21" r=".8" fill="#aab6ff" fill-opacity=".08"/></pattern></defs><circle r="${f(RR)}" fill="url(#tdots)"/>`;
  for (const id of ids) {
    const B = BRS[id],
      a = (B.a * PI) / 180,
      a0 = a - half,
      a1 = a + half,
      x0 = Math.cos(a0) * RR,
      y0 = Math.sin(a0) * RR,
      x1 = Math.cos(a1) * RR,
      y1 = Math.sin(a1) * RR;
    s += `<path d="M0 0L${f(x0)} ${f(y0)}A${f(RR)} ${f(RR)} 0 0 1 ${f(x1)} ${f(y1)}Z" fill="${B.col}" fill-opacity=".05"/><line x1="0" y1="0" x2="${f(x0)}" y2="${f(y0)}" stroke="#ffffff" stroke-opacity=".07" stroke-dasharray="3 9"/>`;
    // Astname: einmal, parallel zu einer Grenze des eigenen Sektors, knapp innerhalb davon. Welche Grenze, steht in ls.
    const side = B.ls || 1,
      t = a + side * half,
      R1 = 118 * 2.75,
      off = 24,
      nx = Math.cos(t - (side * PI) / 2),
      ny = Math.sin(t - (side * PI) / 2),
      x = Math.cos(t) * R1 + nx * off,
      y = Math.sin(t) * R1 + ny * off;
    let rot = (t * 180) / PI;
    if (Math.cos(t) < -1e-6) rot += 180;
    s += `<text class="brname" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})" text-anchor="middle" dominant-baseline="middle" fill="${B.col}" fill-opacity=".5" font-size="34">${B.name.toUpperCase()}</text>`;
  }
  for (let d = 1; d <= maxD; d++)
    s += `<circle r="${118 * d}" fill="none" stroke="#ffffff" stroke-opacity="${d % 3 === 0 ? 0.09 : 0.05}" stroke-dasharray="${d % 3 === 0 ? 'none' : '2 10'}"/>`;
  return (
    s +
    `<circle r="58" fill="none" stroke="${W.col}" stroke-opacity=".35" stroke-width="1.5"/><circle r="74" fill="none" stroke="${W.col}" stroke-opacity=".15" stroke-dasharray="4 8"/>`
  );
}

export function renderTree() {
  renderCurs();
  let lines = '';
  const NS = W.nodes,
    BRS = W.br,
    SN = W.s().nodes;
  for (const n of Object.values(NS)) {
    if (!n.parent) continue;
    const p = NS[n.parent],
      on = (SN[n.id] || 0) > 0,
      col = BRS[n.br].col;
    lines += `<line x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}" stroke="${col}" stroke-width="${on ? 3 : 2}" stroke-opacity="${on ? 0.9 : 0.22}" ${on ? `style="filter:drop-shadow(0 0 4px ${col})"` : 'stroke-dasharray="5 6"'}/>`;
  }
  let html = `<svg width="1600" height="1600" viewBox="-800 -800 1600 1600" aria-hidden="true">${treeBackdrop()}${lines}</svg>`;
  for (const n of Object.values(NS)) {
    const st = nodeState(n),
      col = n.br ? BRS[n.br].col : W.col;
    if (st.lock) {
      html += `<button class="node ${st.cls}${selNode === n.id ? ' sel' : ''}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;--c:${col}" aria-label="Verborgener Knoten"><span class="q">?</span></button>`;
      continue;
    }
    html += `<button class="node ${st.cls}${selNode === n.id ? ' sel' : ''}" data-id="${n.id}" style="left:${n.x}px;top:${n.y}px;--c:${col}" aria-label="${n.name}">${glyph(
      W.id === 2 && n.br
        ? {
            k: 'b',
            w: 'f',
            u: 'h',
            l: 'e',
          }[n.br]
        : n.br || 'root',
    )}${n.id !== 'root' ? `<span class="lv">${st.l}/${n.max >= 999 ? '∞' : n.max}</span>` : ''}<span class="nm">${n.name}</span></button>`;
  }
  tw.innerHTML = html;
  renderSheet();
}

export function renderSheet() {
  const n = W.nodes[selNode] || W.nodes.root,
    sh = $('#sheet'),
    SN = W.s().nodes;
  if (n.id === 'root') {
    sh.innerHTML =
      `<h3>Kern <span class="tag" style="--c:#3df5ff">Ursprung</span></h3><p>Tippe auf einen Knoten, um ihn anzusehen. Ziehen verschiebt den Baum, mit zwei Fingern zoomst du.</p><p>${W.id === 1 ? 'Innen kosten Upgrades Splitter, nach außen Kerne, Prismen und ganz außen Sternenstaub.' : 'Innen kosten Upgrades Schaltkreise, nach außen Matrixchips.'}</p><div class="srcs">${W.curIds.map(c => `<div>${curIcon(c)}<span><b>${CUR[c].name}</b> ${CUR_SRC[c]}</span></div>`).join('')}</div>`.replace(
        /<svg /g,
        '<svg style="width:14px;height:14px;vertical-align:-2px" ',
      );
    return;
  }
  const st = nodeState(n),
    br = W.br[n.br];
  if (st.lock) {
    const par = W.nodes[n.parent],
      pv = par.parent === null || (SN[par.parent] || 0) > 0;
    sh.innerHTML = `<h3>Verborgen <span class="tag" style="--c:${br.col}">${br.name}</span></h3><p>${pv ? `Schalte zuerst „${par.name}“ frei, um diesen Knoten aufzudecken.` : 'Dieser Knoten liegt noch tiefer im Dunkeln. Arbeite dich den Ast entlang vor.'}</p>`;
    return;
  }
  let h = `<h3>${n.name} <span class="tag" style="--c:${br.col}">${br.name}</span></h3><p>Stufe <b>${st.l} / ${n.max >= 999 ? '∞' : n.max}</b>${st.max ? ' · maximal' : ''}</p>`;
  h += `<p>${st.max ? '' : 'Nach dem Kauf: '}<b>${n.fx(st.max ? st.l : st.l + 1)}</b></p>`;
  const S0 = W.st(),
    S1 = st.max
      ? null
      : W.with({
          nodes: {
            ...SN,
            [n.id]: st.l + 1,
          },
        });
  h += cmpRows(
    [
      ['Stufe', `${st.l}`, st.max ? undefined : `${st.l + 1}`],
      ...((W.id === 1 ? PREV : PREV2)[n.id] || []).map(([lab, f, t]) => [
        lab,
        FMT[t](f(S0)),
        S1 ? FMT[t](f(S1)) : undefined,
      ]),
    ],
    br.col,
  );
  if (st.lock) h += `<p class="hint" style="text-align:left">Schalte zuerst „${W.nodes[n.parent].name}“ frei.</p>`;
  else if (st.max)
    h += `<div class="act"><button class="btn" disabled style="--c:${br.col}">Maximal ausgebaut</button></div>`;
  else {
    const c = nodeCost(n, st.l);
    h += `<div class="act"><button class="btn ${st.aff ? '' : 'poor'}" id="bBuy" style="--c:${br.col}">${st.l ? 'Verbessern' : 'Freischalten'} für ${curHTML(n.cur, c).replace('class="cur"', 'class="cur" style="margin-left:4px"')}</button></div>`;
  }
  if (W.id === 1 && n.id === 'e2b' && st.l > 0) h += startStepper();
  sh.innerHTML = h;
  bindStepper();
  const b = $('#bBuy');
  if (b)
    b.onclick = () => {
      const l = SN[n.id] || 0;
      if (pay(n.cur, nodeCost(n, l), b)) {
        SN[n.id] = l + 1;
        persist();
        renderTree();
        const el = tw.querySelector(`[data-id="${n.id}"]`);
        if (el) {
          el.classList.add('pop');
        }
      }
    };
}

export const ptrs = new Map();

export let downNode = null,
  moved = 0,
  pinch = null;

tv.addEventListener('pointerdown', e => {
  if (e.target.closest('.treebtns')) return;
  tv.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, {
    x: e.clientX,
    y: e.clientY,
  });
  if (ptrs.size === 1) {
    moved = 0;
    downNode = e.target.closest('.node');
  } else {
    downNode = null;
    const [a, b] = [...ptrs.values()];
    pinch = {
      d: Math.hypot(a.x - b.x, a.y - b.y),
    };
  }
});

tv.addEventListener('pointermove', e => {
  const p = ptrs.get(e.pointerId);
  if (!p) return;
  const dx = e.clientX - p.x,
    dy = e.clientY - p.y;
  p.x = e.clientX;
  p.y = e.clientY;
  if (ptrs.size === 1) {
    moved += Math.abs(dx) + Math.abs(dy);
    if (moved > 6) {
      tx += dx;
      ty += dy;
      applyT();
    }
  } else if (ptrs.size === 2 && pinch) {
    const [a, b] = [...ptrs.values()],
      d = Math.hypot(a.x - b.x, a.y - b.y),
      r = tv.getBoundingClientRect();
    zoomAt(d / pinch.d, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
    pinch.d = d;
  }
});

export function ptrUp(e) {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (ptrs.size === 0 && downNode && moved <= 6) {
    setSelNode(downNode.dataset.id);
    renderTree();
  }
  if (ptrs.size === 0) downNode = null;
}

tv.addEventListener('pointerup', ptrUp);

tv.addEventListener('pointercancel', ptrUp);

tv.addEventListener('click', e => {
  if (e.detail === 0) {
    const n = e.target.closest('.node');
    if (n) {
      setSelNode(n.dataset.id);
      renderTree();
      tw.querySelector(`[data-id="${selNode}"]`)?.focus();
    }
  }
});

tv.addEventListener(
  'wheel',
  e => {
    e.preventDefault();
    const r = tv.getBoundingClientRect();
    zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
  },
  {
    passive: false,
  },
);

$('#tzIn').onclick = () => {
  const r = tv.getBoundingClientRect();
  zoomAt(1.25, r.width / 2, r.height / 2);
};

$('#tzOut').onclick = () => {
  const r = tv.getBoundingClientRect();
  zoomAt(0.8, r.width / 2, r.height / 2);
};

$('#tzHome').onclick = treeHome;

/* ---------- heroes ---------- */

export function setTz(v) {
  return (tz = v);
}

export function setTx(v) {
  return (tx = v);
}

export function setTy(v) {
  return (ty = v);
}

export function setDownNode(v) {
  return (downNode = v);
}

export function setMoved(v) {
  return (moved = v);
}

export function setPinch(v) {
  return (pinch = v);
}
