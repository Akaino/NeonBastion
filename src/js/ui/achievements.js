import { Snd } from '../audio/sound.js';
import { fmtN } from '../core/format.js';
import { clamp } from '../core/util.js';
import { BOSS_NAMES } from '../data/bosses.js';
import { DRONE_IDS, droneUnlocked } from '../data/drones.js';
import { HERO_IDS } from '../data/heroes.js';
import { NODES } from '../data/nodes.js';
import { TOWER_IDS } from '../data/towers.js';
import { CODEX_TYPES } from './codex.js';
import { show, toast } from './common.js';
import { $ } from './dom.js';
import { persist, save } from './state.js';

export /* ---------- Erfolge: jeweils Bronze, Silber, Gold. Rein zum Sammeln, ohne Belohnung. ---------- */
const achKills = s => {
  const K = s.kills || {};
  let n = K.boss || 0;
  for (const t of CODEX_TYPES) n += K[t] || 0;
  return n;
};

export const achK = t => s => (s.kills && s.kills[t]) || 0;

export const ACH = [
  {
    id: 'welle',
    name: 'Verteidiger',
    text: 'Höchste erreichte Welle im Neon-Sektor',
    val: s => s.best || 0,
    tiers: [25, 100, 300],
  },
  {
    id: 'kills',
    name: 'Jäger',
    text: 'Besiegte Gegner insgesamt',
    val: achKills,
    tiers: [1000, 100000, 10000000],
  },
  {
    id: 'boss',
    name: 'Bossjäger',
    text: 'Besiegte Bosse',
    val: achK('boss'),
    tiers: [10, 100, 1000],
  },
  {
    id: 'twin',
    name: 'Zwillingstöter',
    text: 'Besiegte Doppelbosse',
    val: achK('twin'),
    tiers: [1, 25, 250],
  },
  {
    id: 'elite',
    name: 'Elitejäger',
    text: 'Besiegte Elite-Gegner',
    val: achK('elite'),
    tiers: [50, 2000, 50000],
  },
  {
    id: 'arten',
    name: 'Artenkenner',
    text: 'Verschiedene Gegnerarten besiegt',
    val: s => CODEX_TYPES.filter(t => achK(t)(s) > 0).length,
    tiers: [3, 6, CODEX_TYPES.length],
  },
  {
    id: 'bossarten',
    name: 'Bosskenner',
    text: 'Verschiedene Boss-Arten besiegt',
    val: s => BOSS_NAMES.filter(b => achK('boss:' + b)(s) > 0).length,
    tiers: [2, 4, BOSS_NAMES.length],
  },
  {
    id: 'sprinter',
    name: 'Sprinterfänger',
    text: 'Besiegte Sprinter',
    val: achK('sprinter'),
    tiers: [100, 5000, 100000],
  },
  {
    id: 'schild',
    name: 'Schildbrecher',
    text: 'Besiegte Schildträger',
    val: achK('shield'),
    tiers: [25, 1000, 25000],
  },
  {
    id: 'spalter',
    name: 'Kernspalter',
    text: 'Besiegte Spalter',
    val: achK('splitter'),
    tiers: [25, 1000, 25000],
  },
  {
    id: 'belagerer',
    name: 'Belagerungsbrecher',
    text: 'Besiegte Belagerer',
    val: achK('siege'),
    tiers: [10, 500, 10000],
  },
  {
    id: 'heiler',
    name: 'Heilerjäger',
    text: 'Besiegte Heiler',
    val: achK('healer'),
    tiers: [25, 1000, 25000],
  },
  {
    id: 'bomber',
    name: 'Bombenentschärfer',
    text: 'Bomber vor der Basis abgefangen',
    val: achK('bomber'),
    tiers: [25, 1000, 25000],
  },
  {
    id: 'abwurf',
    name: 'Glücksgriff',
    text: 'Abwürfe mit dem Impuls ausgelöst',
    val: s => s.dropsUsed || 0,
    tiers: [5, 100, 2000],
  },
  {
    id: 'koenigin',
    name: 'Königsmörder',
    text: 'Besiegte Schwarmköniginnen',
    val: achK('queen'),
    tiers: [10, 500, 10000],
  },
  {
    id: 'tarner',
    name: 'Enttarner',
    text: 'Besiegte Tarner',
    val: achK('cloaker'),
    tiers: [25, 1000, 25000],
  },
  {
    id: 'huene',
    name: 'Riesentöter',
    text: 'Besiegte Hünen',
    val: achK('giant'),
    tiers: [5, 250, 5000],
  },
  {
    id: 'ei',
    name: 'Nesträuber',
    text: 'Eier zerstört, bevor etwas schlüpft',
    val: achK('egg'),
    tiers: [10, 500, 10000],
  },
  {
    id: 'dieb',
    name: 'Diebesfänger',
    text: 'Diebe vor der Basis abgefangen',
    val: achK('thief'),
    tiers: [25, 1000, 25000],
  },
  {
    id: 'helden',
    name: 'Heldenriege',
    text: 'Freigeschaltete Helden',
    val: s => HERO_IDS.filter(id => s.heroes[id] && s.heroes[id].u).length,
    tiers: [2, 4, HERO_IDS.length],
  },
  {
    id: 'flotte',
    name: 'Flottenadmiral',
    text: 'Freigeschaltete Drohnenklassen',
    val: s => DRONE_IDS.filter(id => droneUnlocked(s, id)).length,
    tiers: [2, 4, DRONE_IDS.length],
  },
  {
    id: 'tuerme',
    name: 'Baumeister',
    text: 'Freigeschaltete Türme im Neon-Sektor',
    val: s => TOWER_IDS.filter(id => s.towers[id] && s.towers[id].u).length,
    tiers: [2, 4, TOWER_IDS.length],
  },
  {
    id: 'baum',
    name: 'Baumpfleger',
    text: 'Knoten im Skilltree des Neon-Sektors mit mindestens einer Stufe',
    val: s => Object.keys(s.nodes || {}).filter(k => k !== 'root' && s.nodes[k] > 0 && NODES[k]).length,
    tiers: [10, 40, Object.keys(NODES).length - 1],
  },
  {
    id: 'runs',
    name: 'Ausdauer',
    text: 'Gespielte Runs',
    val: s => s.runs || 0,
    tiers: [25, 500, 5000],
  },
  {
    id: 'nova',
    name: 'Sternentod',
    text: 'Gezündete Supernovas',
    val: s => s.nova || 0,
    tiers: [1, 25, 250],
  },
  {
    id: 'gitter',
    name: 'Weltenwanderer',
    text: 'Höchste erreichte Welle in der Gitterfestung',
    val: s => (s.w2 && s.w2.best) || 0,
    tiers: [10, 50, 150],
  },
  {
    id: 'shiny',
    name: 'Erstes Schillern',
    text: 'Einen schillernden Gegner besiegt',
    val: s => {
      const K = s.kills || {};
      return Object.keys(K).some(k => k.startsWith('shiny:') && K[k] > 0) ? 1 : 0;
    },
    tiers: [1],
  },
];

export const MEDALS = [
  ['Bronze', '#d08a4e'],
  ['Silber', '#c8d2e6'],
  ['Gold', '#ffe14f'],
];

export const achTier = a => {
  const v = a.val(save);
  return a.tiers.filter(t => v >= t).length;
};
// Einzel-Erfolge mit nur einer Stufe zählen als Gold

export // Einzel-Erfolge mit nur einer Stufe zählen als Gold
const achMedal = (a, i) => MEDALS[a.tiers.length === 1 ? 2 : i];

export function achCheck() {
  const A = save.ach || (save.ach = {});
  let msg = null,
    n = 0;
  for (const a of ACH) {
    const t = achTier(a);
    if (t > (A[a.id] || 0)) {
      A[a.id] = t;
      n++;
      msg = `Erfolg: ${a.name} (${achMedal(a, t - 1)[0]})`;
    }
  }
  if (n) {
    persist();
    toast(n > 1 ? `${n} neue Erfolge` : msg);
    Snd.play('abil');
  }
}
// Ein Erfolg bleibt verdeckt (kein Name, keine Beschreibung, keine Schwellen), bis seine erste Stufe erreicht ist. Danach sind auch die weiteren Stufen sichtbar.

export // Ein Erfolg bleibt verdeckt (kein Name, keine Beschreibung, keine Schwellen), bis seine erste Stufe erreicht ist. Danach sind auch die weiteren Stufen sichtbar.
function renderAchv() {
  let got = 0,
    all = 0,
    open = 0;
  const cards = ACH.map(a => {
    const v = a.val(save),
      t = achTier(a),
      next = a.tiers[t],
      prev = t ? a.tiers[t - 1] : 0;
    got += t;
    all += a.tiers.length;
    if (!t)
      return '<article class="hcard lock" style="--c:#5f5c8c"><div class="hc-top"><div class="unk">?</div><div><h3>Verborgener Erfolg</h3><small>Noch nicht freigeschaltet</small></div></div></article>';
    open++;
    const meds = a.tiers
      .map((_, i) => {
        const [nm, col] = achMedal(a, i);
        return `<span class="medal ${i < t ? 'on' : ''}" style="--m:${col}" title="${nm}: ${fmtN(a.tiers[i])}" aria-label="${nm} ${i < t ? 'erreicht' : 'offen'}">${nm[0]}</span>`;
      })
      .join('');
    const col = t ? achMedal(a, t - 1)[1] : '#5f5c8c',
      pct = next ? clamp((v - prev) / (next - prev), 0, 1) * 100 : 100;
    return `<article class="hcard" style="--c:${col}"><div class="hc-top"><div><h3>${a.name}</h3><small>${a.text}</small></div><div class="medals">${meds}</div></div>
      <div class="prog"><i style="width:${pct.toFixed(1)}%"></i></div><div class="progt"><span>${next ? `Nächste Stufe: ${achMedal(a, t)[0]}` : 'Alle Stufen erreicht'}</span><b>${fmtN(v)}${next ? ' / ' + fmtN(next) : ''}</b></div></article>`;
  }).join('');
  $('#alist').innerHTML =
    `<article class="hcard" style="--c:#ffe14f"><div class="hc-top"><div><h3>${got} von ${all} Medaillen</h3><small>${open} von ${ACH.length} Erfolgen entdeckt. Erfolge sind zum Sammeln da und bringen keinen Vorteil im Spiel.</small></div></div><div class="prog"><i style="width:${((got / all) * 100).toFixed(1)}%"></i></div></article>` +
    cards;
}

$('#bAchv').onclick = () => {
  show('achv');
  renderAchv();
};
