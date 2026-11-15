import { Music } from '../audio/music.js';
import { Snd } from '../audio/sound.js';
import { Track } from '../audio/track.js';
import { STAGE, VERSION } from '../core/version.js';
import { toast } from '../ui/common.js';
import { $, $$, UI } from '../ui/dom.js';
import { Perf, R } from '../ui/state.js';

/* Leistungsmessung (Testhilfe): hält jedes Bild fest, das länger als HITCH_MS dauert, und was in dieser Lücke gerechnet wurde.
   Die Lücke zwischen zwei Bildern enthält die Arbeit des vorigen Bildes, deshalb wird dessen Aufteilung notiert. „Rest“ ist Zeit außerhalb des Spiels (Browser, System). */
export const HITCH_MS = 28;

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
        this.scanRes.push({
          name: p[0],
          n: f.length,
          hits: hits.length,
          max: f.length ? Math.max(...f) : 0,
          sec,
        });
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
