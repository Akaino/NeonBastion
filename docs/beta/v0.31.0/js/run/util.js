import { hyp, rnd } from '../core/util.js';

export // AUTO_R: Trefferradius eines Autofeuer-Schusses   // AIM_STICK: so viel näher an der Basis muss ein anderer Gegner sein, damit ein Held das Ziel wechselt
function jag(x1, y1, x2, y2, n, amp) {
  const p = [[x1, y1]],
    dx = x2 - x1,
    dy = y2 - y1,
    L = hyp(dx, dy) || 1,
    nx = -dy / L,
    ny = dx / L;
  for (let i = 1; i < n; i++) {
    const t = i / n,
      o = rnd(-amp, amp);
    p.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]);
  }
  p.push([x2, y2]);
  return p;
}
