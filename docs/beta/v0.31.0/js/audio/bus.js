export function makeImpulse(ctx, sec, decay) {
  const r = ctx.sampleRate,
    n = Math.floor(r * sec),
    b = ctx.createBuffer(2, n, r);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return b;
}

// Baut den Mischpult-Graphen auf einem (Offline-)AudioContext

export // Baut den Mischpult-Graphen auf einem (Offline-)AudioContext
function buildBus(ctx, dest) {
  const B = {
    ctx,
  };
  B.master = ctx.createGain();
  B.master.gain.value = 1.4;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 12;
  comp.ratio.value = 8;
  comp.attack.value = 0.004;
  comp.release.value = 0.18;
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -2.5;
  lim.knee.value = 0;
  lim.ratio.value = 20;
  lim.attack.value = 0.001;
  lim.release.value = 0.08;
  B.master.connect(comp);
  comp.connect(lim);
  lim.connect(dest);
  B.rev = ctx.createConvolver();
  B.rev.buffer = makeImpulse(ctx, 2.4, 3);
  const rg = ctx.createGain();
  rg.gain.value = 0.32;
  B.rev.connect(rg);
  rg.connect(B.master);
  B.sfx = ctx.createGain();
  B.sfx.gain.value = 0.7;
  B.sfx.connect(B.master);
  const ss = ctx.createGain();
  ss.gain.value = 0.1;
  B.sfx.connect(ss);
  ss.connect(B.rev);
  // Bitcrusher (8 Stufen) und Sättigung für digitalen Grip
  const crushCurve = new Float32Array(1024),
    driveCurve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = i / 511.5 - 1;
    crushCurve[i] = Math.round(x * 6) / 6;
    driveCurve[i] = Math.tanh(x * 3.2) / Math.tanh(3.2);
  }
  const cs = ctx.createWaveShaper();
  cs.curve = crushCurve;
  const co = ctx.createGain();
  co.gain.value = 0.22;
  B.crush = ctx.createGain();
  B.crush.gain.value = 4.5;
  B.crush.connect(cs);
  cs.connect(co);
  co.connect(B.sfx);
  B.drive = ctx.createWaveShaper();
  B.drive.curve = driveCurve;
  B.drive.oversample = '2x';
  B.drive.connect(B.sfx);
  // harte Verzerrung für Laser und Explosionen
  const distCurve = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) {
    const x = i / 511.5 - 1;
    distCurve[i] = Math.max(-1, Math.min(1, x * 6)) * 0.8 + Math.tanh(x * 2) * 0.2;
  }
  B.dist = ctx.createWaveShaper();
  B.dist.curve = distCurve;
  B.dist.oversample = '4x';
  const dg = ctx.createGain();
  dg.gain.value = 0.55;
  B.dist.connect(dg);
  dg.connect(B.sfx);
  // kurzes Ping-Pong-Echo für Sci-Fi-Raumgefühl
  B.echo = ctx.createGain();
  B.echo.connect(B.sfx);
  const ed = ctx.createDelay(0.5);
  ed.delayTime.value = 0.11;
  const ef = ctx.createGain();
  ef.gain.value = 0.32;
  const eh = ctx.createBiquadFilter();
  eh.type = 'highpass';
  eh.frequency.value = 900;
  B.echo.connect(ed);
  ed.connect(eh);
  eh.connect(ef);
  ef.connect(ed);
  if (ctx.createStereoPanner) {
    const ep = ctx.createStereoPanner();
    ep.pan.value = 0.45;
    eh.connect(ep);
    ep.connect(B.sfx);
  } else eh.connect(B.sfx);
  B.mus = ctx.createGain();
  B.mus.gain.value = 0.3;
  B.mus.connect(B.master);
  B.pad = ctx.createGain();
  B.pad.connect(B.mus);
  const ms = ctx.createGain();
  ms.gain.value = 0.45;
  B.mus.connect(ms);
  ms.connect(B.rev);
  // Feedback-Delay für Arpeggio
  B.dly = ctx.createDelay(1);
  B.dly.delayTime.value = 0.33;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const df = ctx.createBiquadFilter();
  df.type = 'lowpass';
  df.frequency.value = 2600;
  B.dly.connect(df);
  df.connect(fb);
  fb.connect(B.dly);
  df.connect(B.mus);
  B.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = B.noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  return B;
}

/* ---- Synth-Bausteine (zeitgesteuert, funktionieren auch offline) ---- */
