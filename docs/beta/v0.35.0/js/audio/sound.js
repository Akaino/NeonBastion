import { buildBus } from './bus.js';
import { Music } from './music.js';
import { Vol } from './music-data.js';
import { SFX } from './sfx.js';
import { Track } from './track.js';
import { clamp } from '../core/util.js';

/* ---- Steuerung ---- */
export const Snd = {
  ctx: null,
  B: null,
  last: {},
  unlocked: false,
  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC({
          latencyHint: 'interactive',
        });
        this.B = buildBus(this.ctx, this.ctx.destination);
        Track.wrap(this.ctx);
        this.vol();
      } catch (e) {
        return;
      }
    }
    if (this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
    if (!this.unlocked) {
      this.unlocked = true;
      try {
        if (navigator.audioSession) navigator.audioSession.type = 'playback';
      } catch (e) {}
      try {
        const a = new Audio(
          'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YZABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        );
        a.setAttribute('playsinline', '');
        a.volume = 0.01;
        a.play().catch(() => {});
      } catch (e) {}
      try {
        const b = this.ctx.createBuffer(1, 1, 22050),
          s = this.ctx.createBufferSource();
        s.buffer = b;
        s.connect(this.ctx.destination);
        s.start(0);
      } catch (e) {}
    }
    Music.start();
  },
  vol() {
    const B = this.B;
    if (!B) return;
    const t = this.ctx.currentTime,
      cv = v => Math.pow(clamp(v, 0, 100) / 100, 1.6);
    B.mus.gain.setTargetAtTime(0.53 * cv(Vol.mus), t, 0.05);
    B.sfx.gain.setTargetAtTime(1 * cv(Vol.sfx), t, 0.05);
  },
  play(n) {
    const B = this.B;
    if (!(Vol.sfx > 0) || !B || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const lim =
      {
        killbig: 0.08,
        drone: 0.09,
        beam: 0.09,
        turret: 0.1,
        shoot: 0.06,
        shoot2: 0.08,
        kill: 0.05,
        hit: 0.06,
        slash: 0.07,
        heavy: 0.1,
        tap: 0.09,
        zap: 0.08,
        base: 0.12,
        shield: 0.1,
        ui: 0.04,
        crit: 0.09,
      }[n] || 0.05;
    if (this.last[n] && now - this.last[n] < lim) return;
    this.last[n] = now;
    const f = SFX[n];
    if (f) Track.run(() => f(B, B.sfx, now + 0.005));
  },
  suspend() {
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {});
  },
};
// Beim Verlassen oder Neuladen der Seite den Ton-Unterbau schließen. Sonst bleibt er in Safari über das Neuladen hinaus im selben Prozess liegen (vom Nutzer beobachtet:
// Ruckler und stotternder Ton auch direkt nach dem Neuladen). Beim nächsten Antippen baut Snd.init alles neu auf.

// Beim Verlassen oder Neuladen der Seite den Ton-Unterbau schließen. Sonst bleibt er in Safari über das Neuladen hinaus im selben Prozess liegen (vom Nutzer beobachtet:
// Ruckler und stotternder Ton auch direkt nach dem Neuladen). Beim nächsten Antippen baut Snd.init alles neu auf.
addEventListener('pagehide', () => {
  try {
    for (const b of Track.list)
      for (const x of b.nodes) {
        try {
          x.disconnect();
        } catch (e) {}
      }
    Track.list.length = 0;
    Track.ctx = null;
    if (Snd.ctx) {
      const c = Snd.ctx;
      Snd.ctx = null;
      Snd.B = null;
      Snd.unlocked = false;
      Snd.last = {};
      Music.next = 0;
      c.close().catch(() => {});
    }
  } catch (e) {}
});

for (const ev of ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'])
  document.addEventListener(ev, () => Snd.init(), {
    capture: true,
    passive: true,
  });

document.addEventListener('click', e => {
  const t = e.composedPath()[0] || e.target;
  if (t.closest && t.closest('.btn')) Snd.play('ui');
});
