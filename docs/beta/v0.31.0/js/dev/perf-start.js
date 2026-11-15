import { Music } from '../audio/music.js';
import { Perf, save } from '../ui/state.js';

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
