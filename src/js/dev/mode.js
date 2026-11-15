import { Snd } from '../audio/sound.js';
import { updW2Btn } from './tools.js';
import { toast } from '../ui/common.js';
import { $ } from '../ui/dom.js';
import { Perf, persist, run, save } from '../ui/state.js';

export /* ---------- Entwicklermodus: 7× auf die Version tippen, dann Code eingeben ---------- */
let devTaps = 0,
  devT = 0;

export const devHash = s => {
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

export function devTry() {
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

export function setDevTaps(v) {
  return (devTaps = v);
}

export function setDevT(v) {
  return (devT = v);
}
