import { Music } from '../audio/music.js';
import { Snd } from '../audio/sound.js';
import { fmtN } from '../core/format.js';
import { stats } from '../core/stats.js';
import { PI, clamp } from '../core/util.js';
import { CUR, CUR_SRC } from '../data/currencies.js';
import { HERO_IDS } from '../data/heroes.js';
import { achCheck } from './achievements.js';
import { endBuild } from './build.js';
import { banner, curHTML, curIcon, show, toast } from './common.js';
import { $, $$ } from './dom.js';
import { goHub } from './hub.js';
import { aimPos, setAimDown } from './input.js';
import { R, W, persist, run, save, setEndShown, setPaused, setRun, setSpeed, speed } from './state.js';

/* ---------- run ---------- */
export function startRun() {
  Snd.init();
  const S = stats(save);
  save.team = save.team.filter(id => save.heroes[id] && save.heroes[id].u).slice(0, S.slots);
  $('#bBuild').dataset.init = '';
  $('#phaseBar').dataset.key = '';
  setRun(
    new W.Run(save, {
      banner,
      sfx: n => Snd.play(n),
    }),
  );
  if (W.id === 2) save.w2.runs = (save.w2.runs || 0) + 1;
  run.hw = R.hwe;
  run.hh = R.hhe;
  if (aimPos) {
    run.cx = clamp(aimPos[0], -run.hw, run.hw);
    run.cy = clamp(aimPos[1], -run.hh, run.hh);
  }
  setAimDown(false);
  setPaused(false);
  setEndShown(false);
  endBuild();
  save.runs++;
  persist();
  show('hud');
  buildChips();
  $('#bSpeed').textContent = speed + '×';
  if (save.runs === 1 && W.id === 1)
    setTimeout(
      () =>
        toast(
          matchMedia('(pointer:coarse)').matches
            ? 'Wische irgendwo über das Feld, um den Kreis zu schieben. Tippen setzt ihn direkt.'
            : 'Dein Impuls trifft alles im Kreis. Führe ihn mit der Maus auf die Gegner.',
        ),
      2400,
    );
  else if (W.id === 1 && !save.team.length && HERO_IDS.some(id => save.heroes[id].u))
    toast('Kein Held eingesetzt. Das geht im Heldenmenü.');
}

$('#bStart').onclick = startRun;

$('#bPause').onclick = () => {
  if (run && !run.over) {
    endBuild();
    setPaused(true);
    $('#pause').hidden = false;
  }
};

$('#bResume').onclick = () => {
  setPaused(false);
  $('#pause').hidden = true;
};

$('#bQuit').onclick = () => {
  setPaused(false);
  $('#pause').hidden = true;
  if (run && !run.over) {
    run.quit = true;
    run.end();
  }
};

$('#bSpeed').onclick = () => {
  setSpeed(speed === 1 ? 2 : speed === 2 ? 4 : speed === 4 ? 8 : 1);
  save.speed = speed;
  persist();
  $('#bSpeed').textContent = speed + '×';
};

$('#bBack').onclick = goHub;

export function showEnd() {
  setEndShown(true);
  if (W.id === 1) {
    save.dropsUsed = (save.dropsUsed || 0) + (run.dropN || 0);
    const K = save.kills || (save.kills = {});
    for (const t in run.killsBy) K[t] = (K[t] || 0) + run.killsBy[t];
  }
  setTimeout(achCheck, 1200);
  $('#eTitle').textContent = run.quit ? 'Run beendet' : 'Basis zerstört';
  const g = run.gain,
    ws = W.s(),
    prev = ws.best || 0;
  for (const c of W.curIds) ws.cur[c] += Math.floor(g[c] || 0);
  ws.best = Math.max(prev, run.w);
  ws.cycleBest = Math.max(ws.cycleBest || 0, run.w);
  save.pending = null;
  persist();
  $('#eWave').innerHTML =
    `<p style="margin:0;font-size:18px">Welle <b>${run.w}</b> erreicht</p>` +
    (run.w > prev && prev > 0 ? '<p class="rec" style="margin:4px 0 0">Neuer Rekord</p>' : '') +
    `<p style="margin:4px 0 0;color:var(--muted);font-size:13px">${fmtN(run.kills)} Gegner besiegt</p>`;
  $('#eGain').innerHTML = W.curIds
    .map(
      c =>
        `<div class="${Math.floor(g[c]) ? '' : 'zero'}"><span class="cur">${curIcon(c)}<span>${CUR[c].name}<small>${CUR_SRC[c]}</small></span></span><b>+${fmtN(g[c])}</b></div>`,
    )
    .join('');
  $('#end').hidden = false;
}

export function buildChips() {
  $('#hHeroes').innerHTML = run.heroes
    .map(
      (h, i) =>
        `<div class="hchip" data-i="${i}" style="--c:${h.col}"><div class="ring" style="--p:0"><b>${h.d.name[0]}</b></div><div class="hb"><i></i></div>${h.d.name}</div>`,
    )
    .join('');
}

export function updHud() {
  const b = run.base,
    f = b.hp / b.max;
  $('#hWave').textContent = `Welle ${Math.max(1, run.w)}`;
  const hp = $('#hHp');
  hp.style.width = (f * 100).toFixed(1) + '%';
  hp.classList.toggle('ok', f > 0.3);
  $('#hSh').style.width = b.shMax > 0 ? ((b.sh / b.shMax) * 100).toFixed(1) + '%' : '0';
  $('#hHpT').textContent = `${fmtN(Math.ceil(b.hp))} / ${fmtN(b.max)}` + (b.ov > 0 ? `  +${fmtN(b.ov)}` : '');
  $('#hGain').innerHTML = W.curIds
    .filter((c, i) => i === 0 || run.gain[c] >= 1)
    .map(c => curHTML(c, run.gain[c]))
    .join('');
  updPhase();
  $$('#hHeroes .hchip').forEach(el => {
    const h = run.heroes[+el.dataset.i];
    el.classList.toggle('dead', h.dead > 0);
    el.querySelector('.ring').style.setProperty(
      '--p',
      h.dead > 0 ? 0 : Math.round(100 * (1 - Math.max(0, h.abT) / h.cd)),
    );
    el.querySelector('b').textContent = h.dead > 0 ? Math.ceil(h.dead) : h.d.name[0];
    el.querySelector('.hb i').style.width = (h.hp / h.max) * 100 + '%';
  });
  const bs = run.en.filter(e => e.boss && e.hp > 0),
    bb = $('#bossBar');
  bb.hidden = !bs.length;
  if (bs.length) {
    let hp = 0,
      mx = 0;
    for (const e of bs) {
      hp += Math.max(0, e.hp);
      mx += e.max;
    }
    // beim Doppelboss zählt der Balken beide zusammen; ist einer besiegt, bleibt sein Anteil leer
    if (run.twin) mx = Math.max(mx, (run.twinMax = Math.max(run.twinMax || 0, mx)));
    bb.querySelector('b').textContent = (run.twin ? 'Doppelboss · ' : 'Boss · ') + bs.map(e => e.name).join(' & ');
    bb.querySelector('i').style.width = ((hp / mx) * 100).toFixed(1) + '%';
    bb.querySelector('span').textContent = fmtN(hp);
  }
}

export function musicState() {
  if (run.over) {
    Music.set({
      menu: true,
      E: 0,
      W: 0,
      danger: 0,
      boss: false,
      tr: 0,
    });
    return;
  }
  const b = run.base,
    hp = b.hp / b.max;
  let near = 0,
    boss = false;
  for (const e of run.en) {
    if (e.boss) boss = true;
    if (e.x * e.x + e.y * e.y < 120 * 120) near++;
  }
  const danger = clamp(Math.max((0.6 - hp) / 0.5, near / 18), 0, 1),
    w = Math.max(1, run.w);
  Music.set({
    menu: false,
    W: clamp((w - 1) / 35, 0, 1),
    E: clamp(clamp((w - 1) / 35, 0, 1) + (boss ? 0.2 : 0), 0, 1),
    danger,
    boss,
    tr: [0, 2, 3, 5, 7][Math.min(4, Math.floor(w / 10))] + (W.id === 2 ? 5 : 0),
  });
}

export function updPhase() {
  const pb = $('#phaseBar');
  if (!run || run.world !== 2 || run.over) {
    pb.hidden = true;
    return;
  }
  pb.hidden = false;
  const p = run.preview;
  const dirName = a => {
    const d = ((a * 180) / PI + 360 + 90) % 360;
    return ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'][
      Math.round(d / 45) % 8
    ];
  };
  // Die Welle steht fest: die häufigsten Arten nennen, den Rest zusammenfassen
  const ts = Object.keys(p.types).sort((a, b) => p.types[b] - p.types[a]),
    comp = p.twin
      ? 'Doppelboss, schickt Einheiten vor'
      : p.boss
        ? 'Boss, schickt Einheiten vor'
        : ts
            .slice(0, 4)
            .map(t => `${p.types[t]}× ${run.ET[t].name}`)
            .join(', ') + (ts.length > 4 ? ` und ${ts.length - 4} weitere Arten` : '');
  const key = run.phase + ':' + p.w;
  if (pb.dataset.key !== key) {
    pb.dataset.key = key;
    if (run.phase === 'build') {
      pb.className = 'build';
      pb.innerHTML = `<div><b class="pt"></b><span>Welle ${p.w} aus ${run.dirs.map(dirName).join(' und ')}: ${comp}</span><span class="pm"></span></div><button class="btn" id="bReady" style="--c:#ff8a3d">Bereit</button>`;
      $('#bReady').onclick = () => {
        if (run && run.phase === 'build') {
          endBuild();
          run.startFight();
        }
      };
    } else {
      pb.className = 'fight';
      pb.innerHTML = `<div><span class="pf"></span></div>`;
    }
  }
  const set = (s, t) => {
    const el = pb.querySelector(s);
    if (el && el.textContent !== t) el.textContent = t;
  };
  if (run.phase === 'build') {
    set('.pt', `Umbauphase · ${Math.ceil(Math.max(0, run.buildT))} s`);
    set('.pm', `Umbaupunkte: ${run.moves}`);
  } else set('.pf', `Welle ${p.w} läuft · ${run.en.length + run.queue.length} Gegner übrig`);
}
/* ---------- input ---------- */
