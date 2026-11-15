/* ---- Aufräumen ----
   Jeder Effekt und jede Musiknote baut mehrere Ton-Bausteine (Oszillator, Filter, Lautstärke) und hängt sie ans Mischpult. Safari gibt solche Bausteine nicht frei,
   solange sie verbunden sind – auch wenn der Ton längst verklungen ist. Nach einigen Minuten sind es Zehntausende, und der Browser hängt etwa einmal pro Sekunde
   für 60 bis 150 ms (vom Nutzer gemessen, wächst mit der Spieldauer). Deshalb merkt sich Track alle Bausteine, die während eines Aufrufs entstehen, und trennt sie,
   sobald die letzte Tonquelle dieses Aufrufs zu Ende ist. */
export const Track = {
  cur: null,
  list: [],
  made: 0,
  freed: 0,
  ctx: null,
  // Jede Tonquelle bekommt ihr Ende über stop(t) gesagt; das späteste Ende eines Aufrufs gilt für alle seine Bausteine. Auf das Ereignis „ended“ ist in Safari kein Verlass.
  wrap(ctx) {
    this.ctx = ctx;
    for (const m of [
      'createOscillator',
      'createBufferSource',
      'createGain',
      'createBiquadFilter',
      'createStereoPanner',
      'createDelay',
      'createWaveShaper',
      'createConstantSource',
    ]) {
      const f = ctx[m];
      if (!f) continue;
      ctx[m] = function () {
        const n = f.apply(ctx, arguments),
          b = Track.cur;
        if (b) {
          b.nodes.push(n);
          Track.made++;
          if (typeof n.stop === 'function') {
            const st = n.stop;
            n.stop = function (t) {
              if (t > b.end) b.end = t;
              return st.call(n, t);
            };
          }
        }
        return n;
      };
    }
    if (!this.timer) this.timer = setInterval(() => Track.sweep(), 500);
  },
  run(fn) {
    const prev = this.cur,
      b = (this.cur = {
        nodes: [],
        end: 0,
      });
    try {
      fn();
    } finally {
      this.cur = prev;
      if (b.nodes.length) {
        if (!b.end) b.end = this.ctx.currentTime + 30;
        this.list.push(b);
      }
    }
  },
  sweep() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime - 0.3,
      L = this.list;
    if (!L.length) return;
    let k = 0;
    for (let i = 0; i < L.length; i++) {
      const b = L[i];
      if (b.end < now) {
        for (const x of b.nodes) {
          try {
            x.disconnect();
          } catch (e) {}
        }
        this.freed += b.nodes.length;
      } else L[k++] = b;
    }
    L.length = k;
  },
};
/* ---- Steuerung ---- */
