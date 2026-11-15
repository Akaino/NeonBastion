/* Entwicklermodus: nur in Beta und Bottest. build.py hängt diese Datei dort hinter ui.js; das echte Spiel enthält sie nicht.
   Inhalt: Bedienelemente (werden beim Laden in die Einstellungen eingesetzt), Code-Abfrage, Test-Freischaltung der Gitterfestung,
   Testhilfen (Ressourcen, Rekord, Startwelle, erzwungene Gegner), Leistungsmessung mit Ursachensuche.
   Verbindung zum Spiel: das Objekt Dev (Haken in core.js) und das Objekt Perf (in ui.js nur leer angelegt). */

/* ---------- Bedienelemente und Stilregeln einsetzen ---------- */
const DEV_CSS = `/* Testhilfen (Entwicklermodus): Zeilen mit Wert und kleinen Knöpfen, Anzeige der Leistungsmessung unten links */
#dev{z-index:7}#dev .mbox{background:#100e30;text-align:left;max-height:calc(100dvh - 40px);overflow-y:auto;gap:10px}#dev h2{text-align:center}
#devBody h3{margin:8px 0 2px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#ff8a3d}#devBody p{margin:0;color:var(--muted);font-size:13px}
.drow{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;padding:6px 0;border-top:1px solid rgba(255,255,255,.07)}.drow>span:first-child{flex:1;min-width:96px}.drow>b{min-width:52px;text-align:right;font-variant-numeric:tabular-nums}
.dbtn{display:flex;gap:4px}.dbtn button,.dwide{font:inherit;font-size:13px;font-weight:600;color:var(--ink);background:rgba(5,5,26,.6);border:1.5px solid rgba(255,138,61,.6);border-radius:8px;padding:7px 8px;cursor:pointer}
.dwide{width:100%;padding:10px 12px;font-size:15px;margin-top:6px}.dwide.on{background:rgba(255,138,61,.25);border-color:#ff8a3d}
#devOut{width:100%;height:160px;font:12px/1.35 ui-monospace,Menlo,monospace;color:var(--ink);background:rgba(5,5,26,.8);border:1px solid var(--line);border-radius:8px;padding:8px;-webkit-user-select:text;user-select:text}
#perf{position:fixed;left:max(8px,env(safe-area-inset-left,0px));bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:5;pointer-events:none;font:11px/1.35 ui-monospace,Menlo,monospace;color:#ffe14f;background:rgba(3,3,14,.72);border-radius:6px;padding:4px 7px;white-space:pre}
html.nofont *{font-family:system-ui,sans-serif!important}html.nofx *,html.nofx *::before,html.nofx *::after{box-shadow:none!important;text-shadow:none!important;filter:none!important;backdrop-filter:none!important}
html.onlycv body *{visibility:hidden!important}html.onlycv #cv{visibility:visible!important}html.blank body{display:none!important}
html.noanim *,html.noanim *::before,html.noanim *::after{animation:none!important}
#devCode{display:flex;align-items:center;gap:8px;justify-content:center}#devCode label{color:var(--muted);font-size:14px}#devCode .btn{padding:9px 14px}
#devIn{width:110px;font:inherit;font-weight:600;text-align:center;letter-spacing:.2em;color:var(--ink);background:rgba(5,5,26,.8);border:1.5px solid #ff8a3d;border-radius:10px;padding:9px 8px;-webkit-user-select:text;user-select:text}#devIn:focus-visible{outline:2px solid var(--cyan);outline-offset:2px}#devCode.shake{animation:shake .3s}`;
{
  const light = document.createElement('style');
  light.textContent = DEV_CSS;
  document.head.appendChild(light);
  const inner = document.createElement('style');
  inner.textContent = DEV_CSS.replace(/html\.onlycv body \*/g, ':host(.onlycv) *').replace(
    /html\.(\w+) /g,
    ':host(.$1) ',
  );
  UI.appendChild(inner);
  $('#setVer').insertAdjacentHTML(
    'afterend',
    `<div id="devCode" hidden><label for="devIn">Code</label><input id="devIn" type="text" inputmode="numeric" autocomplete="off" maxlength="8" aria-label="Code für den Entwicklermodus"><button class="btn" id="bDevOk" style="--c:#ff8a3d">Bestätigen</button></div>`,
  );
  $('#bLiveCopy').insertAdjacentHTML(
    'beforebegin',
    `<button class="btn" id="bDev" style="--c:#ff8a3d" hidden>Testhilfen</button>
    <button class="btn" id="bW2Test" style="--c:#ff8a3d" hidden></button><button class="btn" id="bDevOff" style="--c:var(--muted)" hidden>Entwicklermodus beenden</button>`,
  );
  $('#toast').insertAdjacentHTML(
    'beforebegin',
    `<section id="dev" class="screen modal" hidden>
  <div class="mbox"><h2>Testhilfen</h2><div id="devBody"></div>
    <textarea id="devOut" readonly hidden aria-label="Messung als Text"></textarea>
    <button class="btn big" id="bDevClose">Fertig</button></div>
</section>
<div id="perf" hidden></div>`,
  );
}

/* ---------- Haken ins Spiel ---------- */
Dev.stats = (save, S) => {
  if (save.dev && save.devStart) {
    S.startMax = Math.max(S.startMax, save.devStart);
    S.startWave = save.devStart;
  }
}; // Testhilfe: Startwelle frei wählbar
Dev.wave = run => (run.save && run.save.dev ? { shiny: !!run.save.devShiny, drop: !!run.save.devDrop } : null); // ein schillernder Gegner bzw. ein Abwurf je Welle
Dev.w2 = save => !!save.w2test; // Test-Freischaltung der Gitterfestung
Dev.openSettings = () => {
  devTaps = 0;
  $('#devCode').hidden = true;
  updW2Btn();
};

/* Leistungsmessung (Testhilfe): hält jedes Bild fest, das länger als HITCH_MS dauert, und was in dieser Lücke gerechnet wurde.
   Die Lücke zwischen zwei Bildern enthält die Arbeit des vorigen Bildes, deshalb wird dessen Aufteilung notiert. „Rest“ ist Zeit außerhalb des Spiels (Browser, System). */
const HITCH_MS = 28;
Object.assign(Perf, {
  on: false,
  fr: [],
  hit: [],
  t0: 0,
  mus: 0,
  sv: 0,
  pw: null,
  lastUi: 0,
  /* Ursachensuche: schaltet nacheinander einzelne Teile ab und zählt je Abschnitt die Ruckler. Zeigt, ob Zeichnen, Ton, Animationen oder gar nichts davon schuld ist. */
  scanRes: null,
  scanT: 0,
  noDraw: false,
  freeze: false,
  /* Schalter für die Ursachensuche, auch von Hand in der JavaScript-Konsole bedienbar:
     Perf.live()        zeigt alle 5 s in der Konsole, wie viele Ruckler es gab (noch einmal aufrufen beendet es)
     Perf.aus('inp')    schaltet etwas ab, Perf.an('inp') wieder an. Mögliche Namen: frz inp tim fnt fx ani cvo ton leer
     Perf.aus()         zeigt die Liste der Namen mit Erklärung */
  NAMEN: {
    frz: 'Anzeigen eingefroren (kein Text ändert sich)',
    inp: 'Eingabefelder entfernt',
    tim: 'Zeitgeber aus (Musik, Aufräumen)',
    fnt: 'Systemschrift statt Spielschrift',
    fx: 'Leuchteffekte aus',
    ani: 'Animationen aus',
    cvo: 'nur das Spielfeld sichtbar',
    ton: 'Ton angehalten',
    leer: 'Seite leer, nichts wird gezeichnet',
  },
  sw() {
    if (this._P) return this._P;
    // Jeder Abschnitt schaltet genau eine Sache ab und danach wieder an. Gesucht ist, was die Spielseite hat und eine leere Seite nicht.
    let ins = [],
      mt = 0,
      tt = 0;
    const H = document.documentElement,
      cls = (n, on) => {
        H.classList.toggle(n, !!on);
        UI.host.classList.toggle(n, !!on);
      },
      au = on => {
        if (Snd.ctx) (on ? Snd.ctx.resume() : Snd.ctx.suspend()).catch(() => {});
      };
    return (this._P = {
      frz: [
        () => {
          this.freeze = true;
        },
        () => {
          this.freeze = false;
        },
      ],
      inp: [
        () => {
          ins = [...$$('input,textarea,select')].map(e => [e, e.parentNode, e.nextSibling]);
          for (const x of ins) x[0].remove();
        },
        () => {
          for (const [e, pa, nx] of ins) pa.insertBefore(e, nx && nx.parentNode === pa ? nx : null);
          ins = [];
        },
      ],
      tim: [
        () => {
          mt = Music.timer;
          clearInterval(mt);
          Music.timer = null;
          tt = Track.timer;
          clearInterval(tt);
          Track.timer = null;
        },
        () => {
          if (mt) {
            Music.timer = null;
            Music.start();
          }
          if (tt) Track.timer = setInterval(() => Track.sweep(), 500);
        },
      ],
      fnt: [() => cls('nofont', 1), () => cls('nofont', 0)],
      fx: [() => cls('nofx', 1), () => cls('nofx', 0)],
      ani: [() => cls('noanim', 1), () => cls('noanim', 0)],
      cvo: [() => cls('onlycv', 1), () => cls('onlycv', 0)],
      ton: [() => au(false), () => au(true)],
      leer: [
        () => {
          this.noDraw = true;
          H.classList.add('blank');
        },
        () => {
          this.noDraw = false;
          H.classList.remove('blank');
        },
      ],
    });
  },

  aus(k) {
    if (!this.NAMEN[k]) {
      console.log(
        Object.entries(this.NAMEN)
          .map(([a, b]) => a.padEnd(5) + b)
          .join('\n'),
      );
      return;
    }
    this.off = this.off || {};
    if (this.off[k]) return k + ' ist schon aus';
    this.off[k] = 1;
    this.sw()[k][0]();
    return 'aus: ' + this.NAMEN[k];
  },
  an(k) {
    if (k === undefined) {
      for (const x of Object.keys(this.off || {})) this.an(x);
      return 'alles wieder an';
    }
    if (!this.off || !this.off[k]) return k + ' ist an';
    delete this.off[k];
    this.sw()[k][1]();
    return 'an: ' + this.NAMEN[k];
  },
  live(sec = 5) {
    if (this.liveT) {
      clearInterval(this.liveT);
      this.liveT = 0;
      return 'Anzeige beendet';
    }
    if (!this.on) this.start();
    let n0 = this.fr.length;
    this.liveT = setInterval(() => {
      const f = this.fr.slice(n0);
      n0 = this.fr.length;
      const h = f.filter(v => v > HITCH_MS && v < 5000);
      console.log(
        'Ruckler in ' +
          sec +
          ' s: ' +
          h.length +
          (h.length ? ', längster ' + Math.round(Math.max(...h)) + ' ms' : '') +
          (Object.keys(this.off || {}).length ? '   [aus: ' + Object.keys(this.off).join(', ') + ']' : ''),
      );
    }, sec * 1000);
    return 'Anzeige läuft, alle ' + sec + ' s eine Zeile';
  },
  scan(sec = 8) {
    if (this.scanT) return;
    const cv = R.cv,
      pf = $('#perf'),
      au = on => {
        if (Snd.ctx) (on ? Snd.ctx.resume() : Snd.ctx.suspend()).catch(() => {});
      },
      H = document.documentElement;
    const P = this.sw();
    const one = (name, k) => [this.NAMEN[k], P[k][0], P[k][1]],
      ks = Object.keys(P);
    const ph = [
      ['alles an', () => {}, () => {}],
      one('Anzeigen eingefroren (kein Text ändert sich)', 'frz'),
      one('Eingabefelder entfernt', 'inp'),
      one('Zeitgeber aus (Musik, Aufräumen)', 'tim'),
      one('Systemschrift statt Spielschrift', 'fnt'),
      one('Leuchteffekte aus', 'fx'),
      one('Animationen aus', 'ani'),
      one('nur das Spielfeld sichtbar', 'cvo'),
      one('Ton angehalten', 'ton'),
      one('Seite leer, nichts wird gezeichnet', 'leer'),
      [
        'alles zusammen',
        () => {
          for (const k of ks) P[k][0]();
        },
        () => {
          for (const k of ks.slice().reverse()) P[k][1]();
        },
      ],
      ['alles an (Kontrolle)', () => {}, () => {}],
    ];
    if (!this.on) this.start();
    this.scanRes = [];
    let i = 0;
    const next = () => {
      if (i > 0) {
        const p = ph[i - 1],
          f = this.fr.slice(this.scanN + 40),
          hits = f.filter(v => v > HITCH_MS && v < 5000);
        p[2]();
        this.scanRes.push({ name: p[0], n: f.length, hits: hits.length, max: f.length ? Math.max(...f) : 0, sec });
      }
      if (i >= ph.length) {
        this.scanT = 0;
        toast('Ursachensuche fertig');
        $('#bDev').onclick();
        return;
      }
      ph[i][1]();
      this.scanN = this.fr.length;
      i++;
      this.scanT = setTimeout(next, sec * 1000);
    };
    next();
  },
  scanText() {
    if (!this.scanRes || !this.scanRes.length) return '';
    let o = '\nUrsachensuche (je Abschnitt ' + this.scanRes[0].sec + ' s)\n';
    for (const r of this.scanRes)
      o +=
        '  ' +
        r.name.padEnd(46) +
        String(r.hits).padStart(3) +
        ' Ruckler, ' +
        r.n +
        ' Bilder, längstes ' +
        Math.round(r.max) +
        ' ms\n';
    return o;
  },
  start() {
    this.on = true;
    this.fr = [];
    this.hit = [];
    this.t0 = performance.now();
    this.mus = this.sv = 0;
    this.pw = null;
    $('#perf').hidden = false;
    $('#perf').textContent = 'Messung läuft …';
  },
  stop() {
    this.on = false;
    $('#perf').hidden = true;
  },
  frame(now, raw, work) {
    const mus = this.mus,
      sv = this.sv,
      pw = this.pw;
    this.mus = this.sv = 0;
    this.pw = work;
    if (this.fr.length < 60000) this.fr.push(raw);
    if (raw > HITCH_MS && raw < 5000 && pw && this.hit.length < 400)
      this.hit.push({
        t: (now - this.t0) / 1000,
        raw,
        st: pw.st,
        hud: pw.hud,
        draw: pw.draw,
        mus,
        sv,
        ns: pw.ns,
        en: pw.en,
        w: pw.w,
        sp: pw.sp,
      });
    if (now - this.lastUi > 500 && !this.freeze) {
      this.lastUi = now;
      const n = Math.min(this.fr.length, 60);
      let s = 0;
      for (let i = this.fr.length - n; i < this.fr.length; i++) s += this.fr[i];
      const h = this.hit[this.hit.length - 1];
      $('#perf').textContent =
        (n ? Math.round((1000 * n) / s) : 0) +
        ' Bilder/s · Ruckler ' +
        this.hit.length +
        (h
          ? '\nletzter ' +
            Math.round(h.raw) +
            ' ms: Spiel ' +
            (h.st + h.hud + h.draw + h.mus).toFixed(0) +
            ', Rest ' +
            Math.max(0, h.raw - h.st - h.hud - h.draw - h.mus).toFixed(0)
          : '');
    }
  },
  report() {
    const f = this.fr.slice().sort((a, b) => a - b),
      n = f.length,
      q = p => (n ? f[Math.min(n - 1, Math.floor(n * p))].toFixed(1) : '–'),
      H = this.hit,
      f1 = v => v.toFixed(1).padStart(6);
    let gap = 0;
    for (let i = 1; i < H.length; i++) gap += H[i].t - H[i - 1].t;
    let o =
      'Neon Bastion Leistungsmessung ' +
      VERSION +
      (STAGE ? ' ' + STAGE : '') +
      '\n' +
      navigator.userAgent +
      '\nFenster ' +
      innerWidth +
      '×' +
      innerHeight +
      ', Pixelverhältnis ' +
      (window.devicePixelRatio || 1) +
      ', Leinwand ' +
      R.cv.width +
      '×' +
      R.cv.height +
      '\nDauer ' +
      ((performance.now() - this.t0) / 1000).toFixed(0) +
      ' s, ' +
      n +
      ' Bilder, Median ' +
      q(0.5) +
      ' ms, 99 %: ' +
      q(0.99) +
      ' ms, längstes ' +
      q(1) +
      ' ms' +
      '\nRuckler (Bild über ' +
      HITCH_MS +
      ' ms): ' +
      H.length +
      (H.length > 1 ? ', mittlerer Abstand ' + (gap / (H.length - 1)).toFixed(1) + ' s' : '') +
      '\n\n  Zeit   Bild  Logik Anzeig Zeichn  Musik Speich   Rest | Schritte Gegner Welle Tempo\n';
    for (const h of H.slice(-60))
      o +=
        f1(h.t) +
        f1(h.raw) +
        f1(h.st) +
        f1(h.hud) +
        f1(h.draw) +
        f1(h.mus) +
        f1(h.sv) +
        f1(Math.max(0, h.raw - h.st - h.hud - h.draw - h.mus)) +
        ' | ' +
        h.ns +
        ' ' +
        h.en +
        ' ' +
        h.w +
        ' ' +
        h.sp +
        '×\n';
    return (
      o +
      this.scanText() +
      '\nAlle Angaben in Millisekunden. Speichern ist in Logik enthalten. Rest = Zeit außerhalb des Spiels (Browser, System).\n'
    );
  },
});

$('#bW2Test').onclick = () => {
  save.w2test = !save.w2test;
  if (!save.w2test && W.id === 2 && !w2Unlocked(save)) setWorld(1);
  persist();
  updW2Btn();
  renderHub();
};
function updW2Btn() {
  const b = $('#bW2Test');
  b.textContent = save.w2test ? 'Test-Freischaltung Gitterfestung: an' : 'Gitterfestung testweise freischalten';
  b.hidden = !save.dev || !!run || (save.best || 0) >= 100;
  $('#bDevOff').hidden = !save.dev || !!run;
  $('#bDev').hidden = !save.dev;
}
/* ---------- Testhilfen im Entwicklermodus: Ressourcen, Rekord, Startwelle, schillernde Gegner, Leistungsmessung ---------- */
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
let devTaps = 0,
  devT = 0;
const devHash = s => {
  let h = 5381;
  for (const c of s) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0;
  return h;
};
$('#setVer').onclick = () => {
  if (run || save.dev) return;
  const n = Date.now();
  devTaps = n - devT < 2000 ? devTaps + 1 : 1;
  devT = n;
  if (devTaps >= 7) {
    devTaps = 0;
    const d = $('#devCode');
    d.classList.remove('shake');
    d.hidden = false;
    $('#devIn').value = '';
    $('#devIn').focus();
  }
};
function devTry() {
  const d = $('#devCode');
  if (d.hidden) return;
  if (devHash($('#devIn').value.trim()) === 2085854505) {
    d.hidden = true;
    save.dev = true;
    persist();
    updW2Btn();
    Snd.play('buy');
    toast('Entwicklermodus aktiv');
  } else {
    Snd.play('no');
    toast('Falscher Code');
    d.classList.remove('shake');
    void d.offsetWidth;
    d.classList.add('shake');
    setTimeout(() => {
      d.hidden = true;
      d.classList.remove('shake');
    }, 350);
  }
}
$('#bDevOk').onclick = devTry;
$('#devIn').addEventListener('keydown', e => {
  if (e.key === 'Enter') devTry();
});
$('#bDevOff').onclick = () => {
  save.dev = false;
  Perf.stop();
  persist();
  updW2Btn();
  toast('Entwicklermodus beendet');
};

{
  const mt = Music.tick.bind(Music);
  Music.tick = () => {
    if (!Perf.on) return mt();
    const a = performance.now();
    mt();
    Perf.mus += performance.now() - a;
  };
}
if (save.dev && save.devPerf) Perf.start();
