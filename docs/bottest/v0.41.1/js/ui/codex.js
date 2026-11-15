import { fmtD, fmtN } from '../core/format.js';
import { BOSS_KINDS, BOSS_NAMES } from '../data/bosses.js';
import { ETYPES } from '../data/enemies.js';
import { Run } from '../run/Run.js';
import { show } from './common.js';
import { $, $$ } from './dom.js';
import { R, save } from './state.js';

/* ---------- Enzyklopädie: was man besiegt hat, getrennt nach Gegnern und Bossen ---------- */
export const CODEX_TYPES = [
  'swarm',
  'brute',
  'shooter',
  'sprinter',
  'healer',
  'queen',
  'shield',
  'bomber',
  'ram',
  'splitter',
  'mite',
  'cloaker',
  'tank',
  'siege',
  'revenant',
  'jammer',
  'commander',
  'giant',
  'jumper',
  'shade',
  'phaser',
  'hacker',
  'brooder',
  'egg',
  'thief',
  'mortar',
  'gas',
  'sniper',
  'mirror',
  'pair',
  'magnet',
];

// Enzyklopädie, Detailansicht: Verhalten und Gegenmittel je Gegnerart. Wird gezeigt, wenn man einen besiegten Eintrag antippt.
const CODEX_HOW = {
  swarm: [
    'Läuft auf dem kürzesten Weg zur Basis und greift an, was im Weg steht. Kommt immer in großer Zahl.',
    'Flächenschaden: Impuls, Schockwelle, Kreuzer, Arkanist.',
  ],
  brute: [
    'Läuft langsam zur Basis und schlägt hart zu. Hält viel aus und bindet Helden und Drohnen lange.',
    'Früh angreifen und mit Frost oder Zerfall schwächen.',
  ],
  shooter: [
    'Bleibt in mittlerem Abstand stehen und beschießt die Basis. Helden und Drohnen greifen ihn bevorzugt an, sobald er in Schussposition ist.',
    'Helden und Drohnen mit Reichweite, Geschütze.',
  ],
  sprinter: [
    'Mehr als doppelt so schnell wie ein Schwärmer, hält aber fast nichts aus.',
    'Abfänger, Geschütze und ein schneller Impuls.',
  ],
  healer: [
    'Heilt jede Sekunde alle Gegner in seiner Nähe um 4 % ihres Lebens (Bosse ein Viertel davon).',
    'Zuerst ausschalten. Im Radius eines Stör-Turms heilt er nicht.',
  ],
  queen: [
    'Bringt alle drei Sekunden zwei Schwärmer hervor, solange sie lebt.',
    'Schnell besiegen oder in einen Stör-Turm laufen lassen.',
  ],
  jumper: [
    'Springt alle drei Sekunden ein Stück auf die Basis zu, auch über Helden und Drohnen hinweg.',
    'Schaden nahe der Basis: Schockwelle, Geschütze. Ein Stör-Turm verhindert den Sprung.',
  ],
  shield: [
    'Sein Schild schluckt die ersten Treffer vollständig, egal wie stark sie sind. Die Zahl der Ladungen wächst mit der Welle.',
    'Viele kleine Treffer: Schwarm-Drohnen, Autofeuer, schneller Impuls.',
  ],
  thief: [
    'Läuft an Helden und Drohnen vorbei zur Basis und stiehlt ein Fünftel deiner Energie, statt Schaden zu machen. Danach verschwindet er.',
    'Abfangen, bevor er ankommt. Er zählt nur als besiegt, wenn er vorher fällt.',
  ],
  bomber: [
    'Läuft an Helden und Drohnen vorbei und sprengt sich an der Basis mit hohem Schaden.',
    'Abfänger greifen ihn zuerst an. Früh treffen, er hält wenig aus.',
  ],
  shade: [
    'In seinem dunklen Hof ist dein Impuls nur halb so groß. Helden, Drohnen und Geschütze stört das nicht.',
    'Mit Helden und Drohnen angehen, oder den Knoten „Schattenlicht“ ausbauen.',
  ],
  ram: ['Wird immer schneller, je länger er lebt, bis auf das Dreifache.', 'Früh besiegen. Frost bremst ihn.'],
  splitter: [
    'Zerfällt beim Tod in drei Splitterlinge mit je 15 % seines Lebens.',
    'Flächenschaden für die Splitterlinge bereithalten.',
  ],
  mite: ['Bruchstück eines Spalters: flink, aber schwach.', 'Jeder Flächenschaden.'],
  mortar: [
    'Bleibt auf Abstand und wirft Granaten auf Helden und Drohnen. Ein Kreis zeigt 1,3 Sekunden vorher, wo sie einschlägt.',
    'Schnell ausschalten. Reparaturdrohnen und die Wächterin gleichen den Schaden aus.',
  ],
  cloaker: [
    'Unsichtbar und unangreifbar, bis er nahe an der Basis auftaucht.',
    'Schaden nahe der Basis. Ein Stör-Turm macht ihn schon vorher sichtbar. Abfänger greifen ihn zuerst an.',
  ],
  tank: [
    'Kein einzelner Treffer nimmt ihm mehr als 12 % seines Lebens. Es braucht also mindestens neun Treffer.',
    'Viele schnelle Treffer statt weniger starker.',
  ],
  phaser: [
    'Wechselt ständig: anderthalb Sekunden unangreifbar, zweieinhalb Sekunden angreifbar.',
    'Dauerfeuer statt einzelner Schläge. Im Radius eines Stör-Turms bleibt er angreifbar.',
  ],
  siege: [
    'Bleibt weit draußen am Feldrand stehen und beschießt die Basis mit schweren Geschossen.',
    'Helden und Drohnen mit Reichweite. Der Knoten „Bunker“ senkt den Schaden.',
  ],
  gas: [
    'Hinterlässt beim Tod eine Giftwolke, die Helden und Drohnen sechs Sekunden lang 6 % ihres Lebens je Sekunde nimmt.',
    'Aus der Entfernung besiegen: Impuls, Geschütze, Fernkampf-Helden.',
  ],
  revenant: [
    'Steht nach dem ersten Tod mit halbem Leben wieder auf. Dazwischen liegt er anderthalb Sekunden unangreifbar am Boden.',
    'Schaden für den zweiten Durchgang aufsparen.',
  ],
  hacker: [
    'Drohnen in seinem gepunkteten Kreis feuern nicht, solange er lebt.',
    'Helden, Impuls oder Geschütze. Ein Stör-Turm hebt die Wirkung auf.',
  ],
  jammer: [
    'Schaltet alle Türme in seinem gestrichelten Kreis ab.',
    'Besiegen, bevor er die Türme erreicht. Der Stör-Turm lässt sich nicht abschalten und nimmt ihm die Wirkung.',
  ],
  sniper: [
    'Bleibt am Feldrand, zielt drei Sekunden lang auf den stärksten Helden und trifft dann sehr hart. Die Linie zeigt sein Ziel.',
    'Innerhalb der drei Sekunden besiegen. Ohne lebenden Helden schießt er auf die Basis.',
  ],
  mirror: [
    'Wirft bei Treffern 4 % des Lebens auf den nächsten Helden oder die nächste Drohne zurück, höchstens alle 0,3 Sekunden.',
    'Wenige starke Treffer statt vieler kleiner. Im Radius eines Stör-Turms spiegelt er nicht.',
  ],
  commander: [
    'Gegner in seinem gepunkteten Kreis sind 25 % schneller und schlagen 40 % härter zu.',
    'Zuerst besiegen oder mit einem Stör-Turm entwaffnen.',
  ],
  magnet: [
    'Zieht deinen Impuls-Zeiger langsam zu sich, solange der Zeiger in seiner Nähe ist.',
    'Gegenhalten oder ihn zuerst besiegen. Ein Stör-Turm hebt den Zug auf.',
  ],
  giant: [
    'Sehr langsam, sehr zäh und nicht zurückzustoßen. Ein kleiner Boss mitten in der Welle.',
    'Kopfjäger, Zerfall-Turm und alles, was Prozentschaden macht (Schockwelle, Bombe).',
  ],
  brooder: [
    'Hinterlässt beim Tod ein Ei. Wird es nicht innerhalb von vier Sekunden zerstört, schlüpfen vier Schwärmer.',
    'Das Ei sofort zerstören.',
  ],
  egg: ['Bleibt liegen, wo der Brüter fiel, und schlüpft nach vier Sekunden.', 'Sofort zerstören, es hält wenig aus.'],
  pair: [
    'Kommt immer zu zweit. Solange beide leben, heilt sich jeder um 8 % je Sekunde. Fällt einer, wird der andere deutlich schneller.',
    'Beide gleichzeitig mit Flächenschaden treffen.',
  ],
};
const codexDetail = (t, T) => {
  const w = Math.max(1, save.best || 1),
    hs = Run.prototype.hpScale(w),
    ds = Run.prototype.dmgScale(w),
    sw = ETYPES.swarm,
    rel = (v, b) => (b ? '×' + fmtD(v / b, 1) : '–'),
    how = CODEX_HOW[t] || ['', ''];
  const rows = [
    ['Leben', fmtN(T.hp * hs), rel(T.hp, sw.hp)],
    ['Schaden je Treffer', T.dmg ? fmtN(T.dmg * ds) : '–', T.dmg ? rel(T.dmg, sw.dmg) : '–'],
    ['Tempo', T.sp ? String(T.sp) : 'steht', T.sp ? rel(T.sp, sw.sp) : '–'],
    ['Splitter-Grundwert', String(T.val), rel(T.val, sw.val)],
  ];
  if (T.max) rows.push(['Anteil an einer Welle', 'bis ' + fmtD(T.max * 100, 1) + ' %', '']);
  return `<div class="cdet"><table><thead><tr><th>Auf Welle ${w}</th><th>Wert</th><th>zum Schwärmer</th></tr></thead><tbody>${rows
    .map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`)
    .join('')}</tbody></table><p><b>Verhalten:</b> ${how[0]}</p><p><b>Dagegen hilft:</b> ${how[1]}</p></div>`;
};
// Welcher Eintrag gerade aufgeklappt ist
export let codexOpen = null;
export function setCodexOpen(v) {
  return (codexOpen = v);
}

export function renderCodex() {
  const K = save.kills || {},
    n = t => K[t] || 0;
  let h = '<h3 class="sect">Gegner</h3>';
  const card = (known, col, cv, name, sub, text, count, extra, detail) =>
    `<article class="hcard ${known ? '' : 'lock'}" style="--c:${known ? col : '#5f5c8c'}"><div class="hc-top">${known ? cv : '<div class="unk">?</div>'}<div><h3>${known ? name : 'Unbekannt'}</h3><small>${sub}</small>${extra || ''}</div>${known ? `<div class="lvl"><small>Besiegt</small><br>${fmtN(count)}</div>` : ''}</div><p style="margin:0;color:var(--muted);font-size:13px">${known ? text : 'Noch nicht besiegt.'}</p>${detail || ''}</article>`;
  for (const t of CODEX_TYPES) {
    const T = ETYPES[t],
      k = n(t),
      sh = n('shiny:' + t);
    h += card(
      k > 0,
      T.col,
      `<canvas data-e="${t}" width="112" height="112"></canvas>`,
      T.name,
      t === 'mite' ? (k ? 'entsteht aus Spaltern' : 'Herkunft unbekannt') : `ab Welle ${T.from || 1}`,
      T.text,
      k,
      (sh ? `<div class="shiny">✦ Schillernd besiegt${sh > 1 ? ' ×' + fmtN(sh) : ''}</div>` : '') +
        (k > 0
          ? `<button class="cmore" data-ct="${t}">${codexOpen === t ? 'Weniger' : 'Werte und Verhalten'}</button>`
          : ''),
      k > 0 && codexOpen === t ? codexDetail(t, T) : '',
    );
  }
  h += card(
    n('elite') > 0,
    '#ffe14f',
    '<canvas data-e="elite" width="112" height="112"></canvas>',
    'Elite',
    'jede Art, ab Welle 1',
    'Jeder Gegner kann als Elite erscheinen: fünffaches Leben, doppelter Schaden, mehr Beute.',
    n('elite'),
  );
  h += '<h3 class="sect">Bosse</h3>';
  for (const name of BOSS_NAMES) {
    const B = BOSS_KINDS[name],
      k = n('boss:' + name);
    h += card(
      k > 0,
      ETYPES.boss.col,
      `<canvas data-e="boss" width="112" height="112"></canvas>`,
      name,
      'Boss · alle 10 Wellen',
      `<b style="color:var(--ink);font-weight:600">${B.abil}:</b> ${B.text}`,
      k,
      k > 0
        ? `<button class="cmore" data-ct="boss:${name}">${codexOpen === 'boss:' + name ? 'Weniger' : 'Werte und Verhalten'}</button>`
        : '',
      k > 0 && codexOpen === 'boss:' + name
        ? `<div class="cdet"><p><b>Verhalten:</b> Bleibt in Reichweite der Basis stehen, lädt ${fmtD(B.charge, 1)} Sekunden lang sichtbar auf (goldener Ring) und löst dann „${B.abil}“ aus. Danach vergehen ${B.cd} Sekunden bis zur nächsten Aufladung. Zwischendurch ruft jeder Boss alle vier Sekunden drei Schwärmer.</p><p><b>Leben auf Welle ${Math.max(10, Math.floor((save.best || 10) / 10) * 10)}:</b> ${fmtN(ETYPES.boss.hp * Run.prototype.hpScale(Math.max(10, Math.floor((save.best || 10) / 10) * 10)) * (500 / 900) * (1 + Math.max(10, Math.floor((save.best || 10) / 10) * 10) * 0.03))}</p></div>`
        : '',
    );
  }
  h += card(
    n('twin') > 0,
    '#ff6b84',
    '<canvas data-e="twin" width="112" height="112"></canvas>',
    'Doppelboss',
    'alle 25 Wellen',
    'Zwei Bosse verschiedener Art greifen von gegenüberliegenden Seiten an.',
    n('twin'),
  );
  $('#clist').innerHTML = h;
  $$('#clist canvas[data-e]').forEach(cv => {
    const t = cv.dataset.e,
      c = cv.getContext('2d'),
      dr = (type, r, col, x, y, w) => {
        const s = R.enemySprite(type, r, col);
        c.drawImage(s, x, y, w, w);
      };
    if (t === 'elite') {
      dr('brute', 20, ETYPES.brute.col, 14, 14, 84);
      const s = R.eliteRing(20);
      c.drawImage(s, 6, 6, 100, 100);
    } else if (t === 'twin') {
      dr('boss', 24, ETYPES.boss.col, 0, 18, 72);
      dr('boss', 24, ETYPES.boss.col, 40, 22, 72);
    } else if (t === 'boss') dr('boss', 24, ETYPES.boss.col, 4, 4, 104);
    else dr(t, 20, ETYPES[t].col, 6, 6, 100);
  });
}

$('#clist').addEventListener('click', e => {
  const b = e.target.closest('[data-ct]');
  if (!b) return;
  setCodexOpen(codexOpen === b.dataset.ct ? null : b.dataset.ct);
  renderCodex();
});
$('#bCodex').onclick = () => {
  show('codex');
  renderCodex();
};

/* ---------- Erfolge: jeweils Bronze, Silber, Gold. Rein zum Sammeln, ohne Belohnung. ---------- */
