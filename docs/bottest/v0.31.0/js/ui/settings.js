import { Snd } from '../audio/sound.js';
import { Dev } from '../core/dev-hooks.js';
import { Store, freshSave, loadSave } from '../core/save.js';
import { IS_BETA, LIVE_KEY, STAGE } from '../core/version.js';
import { toast } from './common.js';
import { $ } from './dom.js';
import { goHub } from './hub.js';
import { persist, run, save, setSave, setWorld, syncSound } from './state.js';

export function setVol(k, v) {
  save[k] = +v;
  syncSound();
  $('#' + k + 'V').textContent = v > 0 ? v + ' %' : 'Aus';
  Snd.init();
  Snd.vol();
  clearTimeout(setVol.t);
  setVol.t = setTimeout(persist, 300);
}

$('#volMus').oninput = e => setVol('volMus', e.target.value);

$('#volSfx').oninput = e => {
  setVol('volSfx', e.target.value);
  const n = Date.now();
  if (!setVol.p || n - setVol.p > 180) {
    setVol.p = n;
    Snd.play(['tap', 'shoot', 'turret', 'kill'][Math.floor(n / 180) % 4]);
  }
};

export function openSettings() {
  $('#settings').hidden = false;
  for (const k of ['volMus', 'volSfx']) {
    $('#' + k).value = save[k];
    $('#' + k + 'V').textContent = save[k] > 0 ? save[k] + ' %' : 'Aus';
  }
  $('#bReset').textContent = 'Spielstand zurücksetzen';
  $('#bReset').dataset.arm = '';
  $('#bReset').hidden = !!run;
  $('#resetInfo').hidden = !!run;
  if (Dev.openSettings) Dev.openSettings();
  const lc = $('#bLiveCopy');
  lc.hidden = !IS_BETA || !!run;
  lc.dataset.arm = '';
  lc.textContent = 'Live-Spielstand übernehmen';
}
/* Nur in der Beta: Kopie des echten Spielstands holen. Geschrieben wird ausschließlich in den Beta-Spielstand. */

/* Nur in der Beta: Kopie des echten Spielstands holen. Geschrieben wird ausschließlich in den Beta-Spielstand. */
$('#bLiveCopy').onclick = () => {
  const b = $('#bLiveCopy');
  let t = null;
  try {
    t = localStorage.getItem(LIVE_KEY);
  } catch (e) {}
  if (!t) {
    Snd.play('no');
    toast('Auf diesem Gerät gibt es keinen Live-Spielstand');
    return;
  }
  if (!b.dataset.arm) {
    b.dataset.arm = '1';
    b.textContent = STAGE + '-Spielstand ersetzen? Nochmal tippen';
    setTimeout(() => {
      if (b.dataset.arm) {
        b.dataset.arm = '';
        b.textContent = 'Live-Spielstand übernehmen';
      }
    }, 4000);
    return;
  }
  try {
    const o = JSON.parse(t);
    o.pending = null;
    Store.save(o);
    setSave(loadSave());
  } catch (e) {
    Snd.play('no');
    toast('Der Live-Spielstand ist nicht lesbar');
    return;
  }
  location.reload();
};

$('#bSet').onclick = openSettings;

$('#bPSet').onclick = openSettings;

$('#bSetClose').onclick = () => {
  $('#settings').hidden = true;
};

$('#bReset').onclick = () => {
  const b = $('#bReset');
  if (!b.dataset.arm) {
    b.dataset.arm = '1';
    b.textContent = 'Wirklich alles löschen? Nochmal tippen';
    Snd.play('no');
    setTimeout(() => {
      if (b.dataset.arm) {
        b.dataset.arm = '';
        b.textContent = 'Spielstand zurücksetzen';
      }
    }, 4000);
    return;
  }
  setSave(freshSave());
  setWorld(1);
  persist();
  $('#settings').hidden = true;
  goHub();
  toast('Spielstand wurde zurückgesetzt');
};
