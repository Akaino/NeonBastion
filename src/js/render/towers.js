import { PI, TAU, clamp, hyp } from '../core/util.js';
import { BUILD_GAP_BASE, BUILD_GAP_TOWER, TOWERS, comboOf } from '../data/towers.js';

/* Methoden der Klasse Renderer (werden in Renderer.js an die Klasse gehängt). */
export const rendererTowersMethods = {
  drawTowerArea(x, y, r, col, alpha = 1) {
    const c = this.c;
    c.fillStyle = col;
    c.globalAlpha = 0.05 * alpha;
    c.beginPath();
    c.arc(x, y, r, 0, TAU);
    c.fill();
    c.globalAlpha = Math.min(1, 0.4 * alpha);
    c.strokeStyle = col;
    c.lineWidth = 1.3;
    c.setLineDash([6, 6]);
    c.lineDashOffset = -this.t * 12;
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
  },
  drawTowers(run) {
    const c = this.c;
    // Überschneidungen: Linse in Kombinationsfarbe + Name
    const TT = run.towers,
      labels = [];
    for (let i = 0; i < TT.length; i++)
      for (let j = i + 1; j < TT.length; j++) {
        const A = TT[i],
          B = TT[j],
          d = hyp(A.x - B.x, A.y - B.y);
        if (d >= A.r + B.r) continue;
        const cb = comboOf(A.type, B.type);
        if (!cb) continue;
        c.save();
        c.beginPath();
        c.arc(A.x, A.y, A.r, 0, TAU);
        c.clip();
        c.beginPath();
        c.arc(B.x, B.y, B.r, 0, TAU);
        c.fillStyle = cb.col;
        c.globalAlpha = 0.13 + 0.05 * Math.sin(this.t * 3);
        c.fill();
        c.globalAlpha = 0.55;
        c.strokeStyle = cb.col;
        c.lineWidth = 1.5;
        c.setLineDash([2, 5]);
        c.stroke();
        c.setLineDash([]);
        c.restore();
        const t = d ? (A.r - (A.r + B.r - d) / 2) / d : 0;
        labels.push([A.x + (B.x - A.x) * t, A.y + (B.y - A.y) * t, cb]);
      }
    this.comboLabels = labels;
    for (const T of run.towers) {
      this.drawTowerArea(T.x, T.y, T.r, T.col);
      c.globalCompositeOperation = 'lighter';
      if (T.type === 'frost') {
        for (let i = 0; i < 2; i++) {
          const k = ((T.pulse + i * 0.7) % 1.4) / 1.4;
          c.globalAlpha = (1 - k) * 0.35;
          c.strokeStyle = T.col;
          c.lineWidth = 2;
          c.beginPath();
          c.arc(T.x, T.y, T.r * k, 0, TAU);
          c.stroke();
        }
      } else if (T.type === 'weak') {
        const k = 0.5 + 0.5 * Math.sin(T.pulse * 3);
        c.globalAlpha = 0.15 + k * 0.2;
        c.strokeStyle = T.col;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(T.x, T.y, T.r * 0.98, 0, TAU);
        c.stroke();
      } else {
        const f = 1 - Math.max(0, T.cd) / T.fx.cd;
        c.globalAlpha = 0.85;
        c.strokeStyle = f > 0.92 ? '#ffffff' : T.col;
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(T.x, T.y, 20, -PI / 2, -PI / 2 + TAU * clamp(f, 0, 1));
        c.stroke();
      }
      if (T.type === 'laser' && T.beam && T.beam.hp > 0) {
        const e = T.beam,
          fl = 0.75 + 0.25 * Math.sin(this.t * 40);
        c.globalAlpha = 0.35 * fl;
        c.strokeStyle = T.col;
        c.lineWidth = 7;
        c.beginPath();
        c.moveTo(T.x, T.y);
        c.lineTo(e.x, e.y);
        c.stroke();
        c.globalAlpha = fl;
        c.strokeStyle = '#ffffff';
        c.lineWidth = 1.8;
        c.stroke();
        this.draw(this.dot(T.col), e.x, e.y, 0, 0.9);
        T.aim = Math.atan2(e.y - T.y, e.x - T.x);
      }
      if (T.type === 'tesla' && T.zap > 0) {
        c.globalAlpha = T.zap / 0.15;
        c.strokeStyle = T.col;
        c.lineWidth = 3;
        c.beginPath();
        c.arc(T.x, T.y, 16, 0, TAU);
        c.stroke();
      }
      c.globalAlpha = 1;
      c.globalCompositeOperation = 'source-over';
      const pop = T.born < 0.3 ? 0.6 + (T.born / 0.3) * 0.4 : 1;
      const rot = T.type === 'frost' ? T.pulse * 0.4 : T.type === 'laser' || T.type === 'rocket' ? T.aim || 0 : 0;
      if (T.jam) c.globalAlpha = 0.3;
      this.draw(this.towerSprite(T.type, T.col), T.x, T.y, rot, pop);
      c.globalAlpha = 1;
    }
    const sel = this.selTower;
    if (sel && run.towers.includes(sel)) {
      c.strokeStyle = '#ffffff';
      c.lineWidth = 2;
      c.setLineDash([4, 4]);
      c.lineDashOffset = -this.t * 20;
      c.beginPath();
      c.arc(sel.x, sel.y, 24, 0, TAU);
      c.stroke();
      c.setLineDash([]);
    }
    // Baumodus: zeigen, wo kein Turm stehen darf – schraffierter Ring um die Basis, feiner Ring um jeden Turm.
    // Liegt die Vorschau im Sperrbereich, leuchtet der betroffene Ring rot auf.
    if (this.buildMode) {
      const gb = this.ghost && this.ghost.block,
        hit = gb === 'base',
        col = hit ? '#ff4f6d' : '#ffb14f';
      c.save();
      c.beginPath();
      c.arc(0, 0, BUILD_GAP_BASE, 0, TAU);
      c.fillStyle = col;
      c.globalAlpha = hit ? 0.2 : 0.1;
      c.fill();
      c.clip();
      c.globalAlpha = hit ? 0.5 : 0.28;
      c.strokeStyle = col;
      c.lineWidth = 1.5;
      c.beginPath();
      for (let d = -BUILD_GAP_BASE * 2; d <= BUILD_GAP_BASE * 2; d += 9) {
        c.moveTo(d - BUILD_GAP_BASE, BUILD_GAP_BASE);
        c.lineTo(d + BUILD_GAP_BASE, -BUILD_GAP_BASE);
      }
      c.stroke();
      c.restore();
      c.globalAlpha = hit ? 1 : 0.75;
      c.strokeStyle = col;
      c.lineWidth = hit ? 2.5 : 1.8;
      c.setLineDash([7, 5]);
      c.lineDashOffset = this.t * 10;
      c.beginPath();
      c.arc(0, 0, BUILD_GAP_BASE, 0, TAU);
      c.stroke();
      c.setLineDash([]);
      for (const T of run.towers) {
        const near = gb === 'tower' && this.ghost && hyp(T.x - this.ghost.x, T.y - this.ghost.y) < BUILD_GAP_TOWER;
        c.globalAlpha = near ? 0.9 : 0.3;
        c.strokeStyle = near ? '#ff4f6d' : '#ffb14f';
        c.lineWidth = near ? 2 : 1;
        c.beginPath();
        c.arc(T.x, T.y, BUILD_GAP_TOWER / 2 + 4, 0, TAU);
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    const g = this.ghost;
    if (g) {
      const col = g.ok ? TOWERS[g.type].col : '#ff4f6d';
      this.drawTowerArea(g.x, g.y, g.r, col, 1.6);
      c.globalAlpha = 0.75;
      this.draw(this.towerSprite(g.type, col), g.x, g.y, 0);
      c.globalAlpha = 1;
    }
  },
};
