const hyp = (a, b) => Math.sqrt(a * a + b * b),
  sq = x => x * x; // sq statt **2: die Potenz ist in den innersten Schleifen spürbar langsamer
// Gegnertypen. from = erste Welle, share = Anteil an der Welle (wächst ab from um step je Welle bis max), bar = Lebensbalken zeigen.
// Die Reihenfolge in WAVE_MIX bestimmt, wer bei der Auswahl zuerst drankommt; der Rest der Welle sind Schwärmer.
const ETYPES = {
  swarm: {
    name: 'Schwärmer',
    hp: 8,
    sp: 72,
    r: 7,
    dmg: 3,
    val: 1,
    col: '#ff8a3d',
    text: 'Klein, schnell und immer in der Überzahl.',
  },
  brute: {
    name: 'Brecher',
    hp: 55,
    sp: 30,
    r: 15,
    dmg: 12,
    val: 4,
    col: '#ff4f6d',
    bar: 1,
    from: 3,
    step: 0.04,
    max: 0.25,
    text: 'Langsam, zäh und schlägt hart zu.',
  },
  shooter: {
    name: 'Fernkämpfer',
    hp: 22,
    sp: 44,
    r: 10,
    dmg: 6,
    val: 3,
    col: '#ffb02e',
    ranged: 1,
    from: 5,
    step: 0.04,
    max: 0.2,
    text: 'Bleibt auf Abstand stehen und beschießt die Basis.',
  },
  // Sprinter: sehr schnell, wenig Leben
  sprinter: {
    name: 'Sprinter',
    hp: 5,
    sp: 150,
    r: 6,
    dmg: 2,
    val: 1,
    col: '#fff34f',
    from: 15,
    step: 0.03,
    max: 0.15,
    text: 'Sehr schnell, aber zerbrechlich.',
  },
  // Schildträger: der Schild schluckt die ersten Treffer vollständig, egal wie stark sie sind
  shield: {
    name: 'Schildträger',
    hp: 40,
    sp: 34,
    r: 13,
    dmg: 9,
    val: 5,
    col: '#5ab8ff',
    bar: 1,
    from: 30,
    step: 0.02,
    max: 0.1,
    text: 'Sein Schild schluckt die ersten Treffer vollständig. Viele kleine Treffer brechen ihn am schnellsten.',
  },
  // Spalter: zerfällt beim Tod in drei Splitterlinge
  splitter: {
    name: 'Spalter',
    hp: 30,
    sp: 40,
    r: 12,
    dmg: 6,
    val: 3,
    col: '#b98cff',
    bar: 1,
    from: 45,
    step: 0.02,
    max: 0.1,
    text: 'Zerfällt beim Tod in drei Splitterlinge.',
  },
  mite: {
    name: 'Splitterling',
    hp: 7,
    sp: 80,
    r: 6,
    dmg: 2,
    val: 1,
    col: '#d6b8ff',
    text: 'Bruchstück eines Spalters. Flink, aber schwach.',
  },
  // Belagerer: bleibt am Rand stehen und beschießt die Basis mit schweren Geschossen
  siege: {
    name: 'Belagerer',
    hp: 35,
    sp: 26,
    r: 13,
    dmg: 15,
    val: 6,
    col: '#ff6b3d',
    ranged: 1,
    bar: 1,
    from: 60,
    step: 0.01,
    max: 0.05,
    text: 'Bleibt weit draußen stehen und beschießt die Basis mit schweren Geschossen.',
  },
  // Heiler: repariert jede Sekunde Gegner in seiner Nähe
  healer: {
    name: 'Heiler',
    hp: 26,
    sp: 38,
    r: 10,
    dmg: 3,
    val: 5,
    col: '#6dffb0',
    bar: 1,
    from: 20,
    step: 0.01,
    max: 0.05,
    text: 'Repariert jede Sekunde alle Gegner in seiner Nähe. Sollte zuerst fallen.',
  },
  // Bomber: läuft an Helden und Drohnen vorbei zur Basis und sprengt sich dort
  bomber: {
    name: 'Bomber',
    hp: 16,
    sp: 62,
    r: 9,
    dmg: 30,
    val: 3,
    col: '#ff5a3d',
    from: 35,
    step: 0.015,
    max: 0.08,
    text: 'Läuft an allem vorbei zur Basis und sprengt sich dort. Vorher abfangen.',
  },
  // Tarner: unsichtbar und unangreifbar, bis er nahe an der Basis ist
  cloaker: {
    name: 'Tarner',
    hp: 28,
    sp: 46,
    r: 10,
    dmg: 8,
    val: 4,
    col: '#9aa7ff',
    from: 50,
    step: 0.01,
    max: 0.06,
    text: 'Unsichtbar und unangreifbar, bis er nahe an der Basis auftaucht.',
  },
  // Störsender: schaltet Türme in seinem Umkreis ab
  jammer: {
    name: 'Störsender',
    hp: 45,
    sp: 30,
    r: 12,
    dmg: 5,
    val: 6,
    col: '#3dffd0',
    bar: 1,
    from: 70,
    step: 0.01,
    max: 0.05,
    text: 'Schaltet alle Türme in seinem Umkreis ab, solange er lebt.',
  },
  // Hüne: sehr langsam, sehr viel Leben, lässt sich nicht zurückstoßen
  giant: {
    name: 'Hüne',
    hp: 420,
    sp: 20,
    r: 22,
    dmg: 28,
    val: 25,
    col: '#ff7ab0',
    bar: 1,
    from: 85,
    step: 0.005,
    max: 0.03,
    text: 'Sehr langsam, sehr zäh und nicht zurückzustoßen. Ein kleiner Boss mitten in der Welle.',
  },
  // Springer: setzt alle paar Sekunden ein Stück Richtung Basis – auch über Helden und Drohnen hinweg
  jumper: {
    name: 'Springer',
    hp: 18,
    sp: 50,
    r: 9,
    dmg: 6,
    val: 3,
    col: '#c8ff4f',
    from: 28,
    step: 0.01,
    max: 0.06,
    text: 'Springt alle drei Sekunden ein Stück auf die Basis zu, auch über Helden und Drohnen hinweg.',
  },
  // Schattenwerfer: halbiert den Radius des Impulses in seiner Nähe
  shade: {
    name: 'Schattenwerfer',
    hp: 34,
    sp: 32,
    r: 12,
    dmg: 5,
    val: 5,
    col: '#8a7dff',
    bar: 1,
    from: 38,
    step: 0.008,
    max: 0.04,
    text: 'In seinem Schatten ist der Impuls nur halb so groß. Helden, Drohnen und Geschütze stört das nicht.',
  },
  // Phasenläufer: wechselt zwischen angreifbar und unangreifbar
  phaser: {
    name: 'Phasenläufer',
    hp: 30,
    sp: 48,
    r: 10,
    dmg: 8,
    val: 5,
    col: '#ff9dff',
    from: 58,
    step: 0.01,
    max: 0.05,
    text: 'Verschwindet immer wieder für anderthalb Sekunden aus der Welt und ist dann nicht zu treffen.',
  },
  // Hacker: Drohnen in seinem Umkreis feuern nicht
  hacker: {
    name: 'Hacker',
    hp: 38,
    sp: 34,
    r: 11,
    dmg: 5,
    val: 6,
    col: '#4fff8a',
    bar: 1,
    from: 68,
    step: 0.008,
    max: 0.04,
    text: 'Drohnen in seinem Umkreis feuern nicht, solange er lebt.',
  },
  // Brüter: hinterlässt beim Tod ein Ei, aus dem Schwärmer schlüpfen
  brooder: {
    name: 'Brüter',
    hp: 70,
    sp: 30,
    r: 14,
    dmg: 8,
    val: 8,
    col: '#ffa64f',
    bar: 1,
    from: 90,
    step: 0.006,
    max: 0.03,
    text: 'Hinterlässt beim Tod ein Ei. Wird es nicht rechtzeitig zerstört, schlüpfen vier Schwärmer.',
  },
  egg: {
    name: 'Ei',
    hp: 20,
    sp: 0,
    r: 9,
    dmg: 0,
    val: 1,
    col: '#ffd27a',
    text: 'Bleibt liegen, wo der Brüter fiel. Nach vier Sekunden schlüpfen vier Schwärmer.',
  },
  // Dieb: läuft an allem vorbei zur Basis und stiehlt Energie statt Leben
  thief: {
    name: 'Dieb',
    hp: 14,
    sp: 95,
    r: 8,
    dmg: 0,
    val: 3,
    col: '#ffd24f',
    from: 33,
    step: 0.01,
    max: 0.05,
    text: 'Läuft an allem vorbei zur Basis und stiehlt ein Fünftel deiner Energie. Vorher abfangen.',
  },
  // Mörser: beschießt Helden und Drohnen mit Granaten (Einschlag verzögert, Kreis kündigt ihn an)
  mortar: {
    name: 'Mörser',
    hp: 32,
    sp: 30,
    r: 12,
    dmg: 8,
    val: 5,
    col: '#ff7a5a',
    ranged: 1,
    bar: 1,
    from: 48,
    step: 0.008,
    max: 0.04,
    text: 'Bleibt auf Abstand und beschießt Helden und Drohnen mit Granaten. Der Kreis zeigt, wo sie einschlagen.',
  },
  // Giftträger: hinterlässt beim Tod eine Wolke, die Verbündeten schadet
  gas: {
    name: 'Giftträger',
    hp: 36,
    sp: 36,
    r: 12,
    dmg: 6,
    val: 5,
    col: '#a6ff4f',
    bar: 1,
    from: 63,
    step: 0.008,
    max: 0.04,
    text: 'Hinterlässt beim Tod eine Giftwolke, die Helden und Drohnen sechs Sekunden lang schadet.',
  },
  // Scharfschütze: zielt lange auf den stärksten Helden und trifft dann sehr hart
  sniper: {
    name: 'Scharfschütze',
    hp: 24,
    sp: 34,
    r: 10,
    dmg: 10,
    val: 6,
    col: '#ff4fa0',
    ranged: 1,
    from: 73,
    step: 0.006,
    max: 0.03,
    text: 'Zielt drei Sekunden lang auf den stärksten Helden und trifft dann sehr hart. Die Linie zeigt sein Ziel.',
  },
  // Spiegel: wirft bei Treffern Schaden auf den nächsten Verbündeten zurück
  mirror: {
    name: 'Spiegel',
    hp: 50,
    sp: 30,
    r: 13,
    dmg: 7,
    val: 6,
    col: '#d6f5ff',
    bar: 1,
    from: 78,
    step: 0.006,
    max: 0.03,
    text: 'Wirft bei Treffern Schaden auf den nächsten Helden oder die nächste Drohne zurück. Wenige starke Treffer sind besser als viele kleine.',
  },
  // Gespann: zwei verbundene Gegner, die sich gegenseitig heilen
  pair: {
    name: 'Gespann',
    hp: 60,
    sp: 34,
    r: 12,
    dmg: 9,
    val: 6,
    col: '#ff9a4f',
    bar: 1,
    from: 95,
    step: 0.005,
    max: 0.025,
    text: 'Kommt immer zu zweit. Solange beide leben, heilen sie sich gegenseitig. Fällt einer, rast der andere los.',
  },
  // Schwarmkönigin: bringt laufend Schwärmer hervor
  queen: {
    name: 'Schwarmkönigin',
    hp: 60,
    sp: 28,
    r: 14,
    dmg: 5,
    val: 8,
    col: '#ff9de0',
    bar: 1,
    from: 25,
    step: 0.008,
    max: 0.04,
    text: 'Bringt alle drei Sekunden zwei Schwärmer hervor, solange sie lebt.',
  },
  // Rammbock: wird immer schneller, je länger er lebt
  ram: {
    name: 'Rammbock',
    hp: 38,
    sp: 34,
    r: 11,
    dmg: 14,
    val: 4,
    col: '#ffa23d',
    bar: 1,
    from: 40,
    step: 0.01,
    max: 0.05,
    text: 'Wird immer schneller, je länger er lebt, und schlägt hart zu.',
  },
  // Panzer: jeder einzelne Treffer nimmt ihm höchstens einen festen Anteil seines Lebens
  tank: {
    name: 'Panzer',
    hp: 70,
    sp: 30,
    r: 13,
    dmg: 10,
    val: 7,
    col: '#9fb4c8',
    bar: 1,
    from: 55,
    step: 0.01,
    max: 0.05,
    text: 'Kein Treffer nimmt ihm mehr als 12 % seines Lebens. Nur viele Treffer bringen ihn zu Fall.',
  },
  // Wiedergänger: steht einmal wieder auf
  revenant: {
    name: 'Wiedergänger',
    hp: 30,
    sp: 44,
    r: 10,
    dmg: 7,
    val: 4,
    col: '#b0ffea',
    from: 65,
    step: 0.01,
    max: 0.05,
    text: 'Steht nach dem ersten Tod mit halbem Leben wieder auf.',
  },
  // Kommandant: verstärkt alle Gegner in seinem Umkreis
  commander: {
    name: 'Kommandant',
    hp: 90,
    sp: 26,
    r: 14,
    dmg: 8,
    val: 10,
    col: '#ff4f4f',
    bar: 1,
    from: 80,
    step: 0.006,
    max: 0.03,
    text: 'Alle Gegner in seinem Umkreis sind schneller und schlagen härter zu.',
  },
  boss: { name: 'Boss', hp: 900, sp: 17, r: 42, dmg: 40, val: 40, col: '#ff3b5c' },
};
const SHIELD_HITS = 4,
  SHIELD_PER = 30,
  MITE_HP = 0.15; // Schildladungen: Grundwert + 1 je SHIELD_PER Wellen; Splitterling: Anteil am Leben des Spalters
// Schillernde Gegner: sehr selten (etwa einer je zwei bis drei Runs bis Welle 50), deutlich zäher, sonst ohne Wirkung aufs Spiel. Nie Bosse oder Splitterlinge.
/* Abwürfe: Je Welle lässt mit DROP_P einer ihrer Gegner beim Tod etwas fallen. Nur der Impuls zerstört es: DROP_HITS Treffer hintereinander,
   ein Impuls daneben setzt den Zähler zurück. Ohne Treffer verschwindet es nach DROP_LIFE Sekunden, jeder Treffer setzt die Frist zurück. */
const DROP_P = 0.1,
  DROP_HITS = 5,
  DROP_LIFE = 3,
  DROP_DUR = 5,
  DROP_R = 13,
  BOMB_R = 170,
  BOMB_PCT = 0.4,
  BOMB_BOSS = 0.08,
  DROP_REPAIR = 0.06,
  DROP_HASTE = 0.5;
const DROPS = {
    bomb: { name: 'Bombe', text: 'Sprengt alles im Umkreis', col: '#ff8a3d' },
    dmg: { name: 'Doppelter Schaden', text: '5 Sekunden lang', col: '#ff4f6d' },
    haste: { name: 'Schneller Impuls', text: '5 Sekunden doppeltes Tempo', col: '#3df5ff' },
    repair: { name: 'Reparatur', text: 'Die Basis wird 5 Sekunden lang repariert', col: '#5dffb0' },
    gain: { name: 'Splitterregen', text: '5 Sekunden doppelte Splitter', col: '#ffe14f' },
  },
  DROP_IDS = Object.keys(DROPS);
const SHINY_P = 1 / 5000,
  SHINY_HP = 3.5;
const HUNT_MUL = 3,
  HUNT_SHOT = 12,
  ENGI_AMP = 1.3,
  ENGI_DUR = 6,
  ENGI_ENERGY = 1.25; // Kopfjäger und Ingenieurin
const BOOM_T = 0.35; // Sekunden vom Fall der Basis bis zur Explosion
const WAVE_MIX = [
  'brute',
  'shooter',
  'sprinter',
  'shield',
  'splitter',
  'siege',
  'healer',
  'bomber',
  'cloaker',
  'jammer',
  'giant',
  'queen',
  'ram',
  'tank',
  'revenant',
  'commander',
  'jumper',
  'shade',
  'phaser',
  'hacker',
  'brooder',
  'thief',
  'mortar',
  'gas',
  'sniper',
  'mirror',
  'pair',
];
const waveShare = (t, w) => {
  const T = ETYPES[t];
  return w >= T.from ? Math.min(T.max, T.step * (w - T.from + 1)) : 0;
};
// Mischung einer Welle. Zusammen dürfen die besonderen Typen höchstens MIX_MAX der Welle stellen; darüber werden alle anteilig gekürzt, der Rest bleibt Schwärmer.
const JUMP_CD = 3,
  JUMP_D = 90,
  SHADE_R = 130,
  SHADE_MUL = 0.5,
  PHASE_ON = 1.5,
  PHASE_OFF = 2.5,
  HACK_R = 130,
  EGG_T = 4,
  EGG_HP = 0.4,
  EGG_N = 4;
const THIEF_PCT = 0.2,
  MORTAR_CD = 3.5,
  MORTAR_R = 46,
  MORTAR_DELAY = 1.3,
  MORTAR_MUL = 2.5,
  MORTAR_RANGE = 330,
  GAS_R = 70,
  GAS_DUR = 6,
  GAS_PCT = 0.06,
  SNIPE_T = 3,
  SNIPE_MUL = 6,
  SNIPE_BASE = 3,
  MIRROR_PCT = 0.04,
  MIRROR_R = 220,
  MIRROR_CD = 0.3,
  PAIR_HEAL = 0.08,
  PAIR_RAGE = 1.6;
const MIX_MAX = 0.85,
  HEAL_R = 110,
  HEAL_PCT = 0.04,
  CLOAK_R = 150,
  JAM_R = 120,
  QUEEN_CD = 3,
  RAM_ACC = 0.25,
  RAM_MAX = 3,
  TANK_CAP = 0.12,
  REV_DOWN = 1.5,
  CMD_R = 120,
  CMD_DMG = 1.4,
  CMD_SP = 1.25;
const waveMix = w => {
  const m = WAVE_MIX.map(t => [t, waveShare(t, w)]),
    sum = m.reduce((a, x) => a + x[1], 0),
    k = sum > MIX_MAX ? MIX_MAX / sum : 1;
  return m.map(([t, s]) => [t, s * k]);
};
// Doppelboss: alle TWIN_EVERY Wellen kommen zwei Bosse von gegenüberliegenden Seiten, jeder mit TWIN_HP (75 %) des normalen Bosslebens
// Boss-Arten: jede hat eine Fähigkeit. Der Boss bleibt stehen und lädt sie charge Sekunden lang sichtbar auf (Ring + Name), danach cd Sekunden Pause.
const BOSS_KINDS = {
  Titan: {
    abil: 'Erdstoß',
    charge: 2.5,
    cd: 10,
    text: 'Schleudert Helden und Drohnen in seiner Nähe zurück und verletzt sie.',
  },
  Koloss: { abil: 'Panzerung', charge: 2, cd: 11, text: 'Nimmt vier Sekunden lang 80 % weniger Schaden.' },
  Nemesis: { abil: 'Vernichter', charge: 3, cd: 10, text: 'Feuert ein schweres Geschoss auf die Basis.' },
  Vortex: { abil: 'Sog', charge: 2.5, cd: 10, text: 'Zieht Helden und Drohnen zu sich heran und verletzt sie.' },
  Hydra: { abil: 'Brut', charge: 2, cd: 9, text: 'Setzt auf einen Schlag acht Schwärmer frei.' },
  Leviathan: { abil: 'Flut', charge: 2.5, cd: 12, text: 'Alle Gegner werden vier Sekunden lang 50 % schneller.' },
};
const BOSS_ABIL_RANGE = 420,
  BOSS_SHOCK_R = 170,
  BOSS_PULL_R = 260;
const bossLabel = e => 'BOSS · ' + e.name + (e.cast > 0 ? ' · ' + BOSS_KINDS[e.name].abil : '');
const TWIN_EVERY = 25,
  TWIN_HP = 0.75,
  BOSS_NAMES = Object.keys(BOSS_KINDS);
const CELL = 40,
  AIM_STICK = 60,
  AUTO_R = 30; // AUTO_R: Trefferradius eines Autofeuer-Schusses   // AIM_STICK: so viel näher an der Basis muss ein anderer Gegner sein, damit ein Held das Ziel wechselt
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

class Run {
  constructor(save, hooks) {
    this.save = save;
    this.S = stats(save);
    this.h = hooks || {};
    const S = this.S;
    this.t = 0;
    this.w = S.startWave - 1;
    const hp = S.baseHp;
    this.base = {
      r: 30,
      max: hp,
      hp,
      shMax: hp * S.shieldPct,
      sh: hp * S.shieldPct,
      shDelay: 0,
      ov: 0,
      pulseT: 3,
      flash: 0,
      rot: 0,
      turrets: [],
    };
    for (let i = 0; i < S.turrets; i++)
      this.base.turrets.push({
        a: (i / S.turrets) * TAU + PI / 4,
        t: Math.random(),
        aim: (i / S.turrets) * TAU + PI / 4,
      });
    this.en = [];
    this.heroes = [];
    this.drones = [];
    this.pr = [];
    this.ep = [];
    this.parts = [];
    this.nums = [];
    this.rings = [];
    this.bolts = [];
    this.slashes = [];
    this.ghosts = [];
    this.towers = [];
    this.energy = 30;
    this.tsave = save.towers;
    this.world = 1;
    this.gain = { s: 0, k: 0, p: 0, d: 0 };
    this.kills = 0;
    this.bossKills = 0;
    this.drops = [];
    this.dropN = 0;
    this.zones = [];
    this.engiAt = -9;
    this.ampT = 0;
    this.buff = { dmg: 0, haste: 0, repair: 0, gain: 0 };
    this.queue = [];
    this.spawnT = 0;
    this.spawnI = 1;
    this.waveGap = 1.5;
    this.waveEndT = 0;
    this.droneT = 0.4;
    this.droneIdx = 0;
    this.taps = 0;
    this.imps = 0;
    this.killsBy = {};
    this.pend = [];
    this.rushT = 0;
    this.dcount = {};
    this.cx = 0;
    this.cy = -90;
    this.impT = S.impInt;
    this.shake = 0;
    this.over = false;
    this.overT = 0;
    this.hw = 400;
    this.hh = 400;
    this.grid = new Map();
    this.record = false;
    for (let w = 2; w <= this.w; w++) this.milestone(w);
    const team = save.team.filter(id => save.heroes[id] && save.heroes[id].u).slice(0, S.slots);
    team.forEach((id, i) => this.heroes.push(this.makeHero(id, i, team.length)));
  }
  makeHero(id, i, n) {
    const d = HEROES[id],
      st = this.save.heroes[id],
      lm = 1 + 0.12 * (st.l - 1),
      a = (i / Math.max(1, n)) * TAU - PI / 2;
    const max = d.hp * lm * this.S.heroHp;
    return {
      id,
      d,
      col: d.col,
      x: Math.cos(a) * 55,
      y: Math.sin(a) * 55,
      r: 11,
      max,
      hp: max,
      dmg: d.dmg * lm * this.S.heroDmg * (this.S.heroSelf || 1),
      rate: d.rate * this.S.heroRate,
      range: d.range,
      sp: d.speed,
      cd: d.cd * this.S.abilityCd * (1 - 0.08 * st.a),
      pow: (1 + 0.35 * st.a) * this.S.abilPow,
      abT: d.cd * 0.5,
      atkT: 0,
      dead: 0,
      face: a,
      idleA: a,
      flash: 0,
      healT: 1,
      lunge: 0,
      spin: 0,
      hits: 0,
      swDir: 1,
    };
  }

  /* ---------- helpers ---------- */
  key(cx, cy) {
    return (cx + 500) * 1000 + (cy + 500);
  }
  buildGrid() {
    const g = this.grid;
    for (const a of g.values()) a.length = 0;
    if (g.size > 4000) g.clear();
    for (const e of this.en) {
      if (e.hp <= 0) continue;
      const k = this.key(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
      let a = g.get(k);
      if (!a) g.set(k, (a = []));
      a.push(e);
    }
  }
  query(x, y, r, fn) {
    const x0 = Math.floor((x - r) / CELL),
      x1 = Math.floor((x + r) / CELL),
      y0 = Math.floor((y - r) / CELL),
      y1 = Math.floor((y + r) / CELL);
    for (let cx = x0; cx <= x1; cx++)
      for (let cy = y0; cy <= y1; cy++) {
        const a = this.grid.get(this.key(cx, cy));
        if (a) for (const e of a) if (e.hp > 0) fn(e);
      }
  }
  nearest(x, y, R) {
    let b = null,
      bd = R * R;
    for (const e of this.en) {
      if (e.hp <= 0 || e.cloak) continue;
      const d = sq(e.x - x) + sq(e.y - y);
      if (d < bd) {
        bd = d;
        b = e;
      }
    }
    return b;
  }
  threat(R) {
    let b = null,
      bs = Infinity;
    for (const e of this.en) {
      if (e.hp <= 0 || e.cloak) continue;
      const d = hyp(e.x, e.y) - e.r;
      if (d > R) continue;
      // Fernkämpfer, die die Basis beschießen, zählen als besonders bedrohlich
      const s = d - (e.ranged && d < e.stop + 10 ? 150 : 0);
      if (s < bs) {
        bs = s;
        b = e;
      }
    }
    return b;
  }
  tscore(e) {
    const d = hyp(e.x, e.y) - e.r;
    return d - (e.ranged && d < e.stop + 10 ? 150 : 0);
  }
  // Ziel eines Helden: bleibt beim einmal gewählten Gegner, bis er tot oder außer Reichweite ist.
  // Gewechselt wird nur, wenn ein anderer deutlich bedrohlicher ist (z. B. ein Fernkämpfer, der die Basis beschießt).
  aim(h, R) {
    let t = h.tg;
    if (t && (t.hp <= 0 || hyp(t.x, t.y) - t.r > R + 40)) t = null;
    const n = this.threat(R);
    if (!t || (n && n !== t && this.tscore(n) < this.tscore(t) - AIM_STICK)) t = n;
    return (h.tg = t);
  }
  aoe(x, y, r, dmg, o = {}) {
    const hit = [];
    this.query(x, y, r + 40, e => {
      if (e === o.skip) return;
      if (hyp(e.x - x, e.y - y) < r + e.r) hit.push(e);
    });
    for (const e of hit) {
      this.hitE(e, dmg, o);
      if (o.kb) this.knock(e, o.kb[0], o.kb[1], o.kb[2]);
    }
    return hit;
  }
  knock(e, fx, fy, d) {
    if (e.boss || e.heavy || e.hp <= 0) return;
    const dx = e.x - fx,
      dy = e.y - fy,
      L = hyp(dx, dy) || 1;
    e.x += (dx / L) * d;
    e.y += (dy / L) * d;
  }
  moveTo(h, tx, ty, dt, sp) {
    const dx = tx - h.x,
      dy = ty - h.y,
      d = hyp(dx, dy);
    if (d < 1) return;
    const s = Math.min(d, (sp || h.sp) * dt);
    h.x += (dx / d) * s;
    h.y += (dy / d) * s;
  }
  leash(o, R) {
    const d = hyp(o.x, o.y);
    if (d > R) {
      o.x *= R / d;
      o.y *= R / d;
    }
  }
  burst(x, y, n, col, sp = 180, life = 0.5, size = 3) {
    if (this.headless) return;
    if (this.parts.length > 420) n = Math.min(n, 3);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, TAU),
        s = rnd(0.3, 1) * sp;
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        l: 0,
        m: life * rnd(0.6, 1.2),
        col,
        s: size * rnd(0.7, 1.3),
      });
    }
  }
  num(x, y, t, col, big) {
    if (this.headless) return;
    if (this.nums.length < 70) this.nums.push({ x: x + rnd(-6, 6), y, v: -46, l: 0, t, col, big });
  }
  ring(x, y, r0, r1, col, m = 0.35, w = 6) {
    if (this.headless) return;
    if (this.rings.length < 40) this.rings.push({ x, y, r0, r1, col, l: 0, m, w });
  }
  shoot(x, y, a, sp, dmg, col, o = {}) {
    if (this.pr.length > 320) return;
    this.pr.push({
      x,
      y,
      tx: x,
      ty: y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      sp,
      dmg,
      col,
      tg: o.tg || null,
      size: o.size || 3,
      pierce: o.pierce || 0,
      hitSet: o.pierce ? new Set() : null,
      life: 1.6,
      o,
      src: this.src,
    });
  }
  shootAt(x, y, tg, sp, dmg, col, o = {}) {
    o.tg = tg;
    this.shoot(x, y, Math.atan2(tg.y - y, tg.x - x), sp, dmg, col, o);
  }

  /* ---------- towers ---------- */
  hpScale(w) {
    return Math.pow(1.15, w - 1) * Math.pow(1.08, Math.max(0, w - 35)) * Math.pow(1.06, Math.max(0, w - 60));
  }
  dmgScale(w) {
    return Math.pow(1.06, w - 1) * Math.pow(1.07, Math.max(0, w - 35)) * Math.pow(1.05, Math.max(0, w - 60));
  }
  towerSlots() {
    return SLOT_BASE + (this.save.tslots || 0);
  }
  towerStats(type, l) {
    const D = TOWERS[type];
    return { r: D.r(l), fx: D.fx(l) };
  }
  buildCost(type) {
    return Math.round(TOWERS[type].cost * Math.pow(1.4, this.towers.length));
  }
  canPlace(x, y, ign) {
    if (hyp(x, y) < 58) return false;
    for (const T of this.towers) if (T !== ign && hyp(T.x - x, T.y - y) < 34) return false;
    return Math.abs(x) < this.hw - 10 && Math.abs(y) < this.hh - 10;
  }
  place(type, x, y) {
    const c = this.buildCost(type);
    if (this.energy < c || this.towers.length >= this.towerSlots() || !this.canPlace(x, y)) return false;
    const D = TOWERS[type],
      l = this.tsave[type].l,
      ts = this.towerStats(type, l);
    this.energy -= c;
    this.towers.push({
      type,
      x,
      y,
      l,
      l0: l,
      spent: c,
      r: ts.r,
      fx: ts.fx,
      col: D.col,
      cd2: 0,
      cd: 1.5,
      pulse: 0,
      born: 0,
    });
    this.ring(x, y, 6, ts.r, D.col, 0.6, 6);
    this.burst(x, y, 20, D.col, 220, 0.5);
    this.h.sfx && this.h.sfx('build');
    return true;
  }
  upCost(T) {
    return Math.round(TOWERS[T.type].cost * 0.8 * Math.pow(1.6, T.l - T.l0 + 1));
  }
  refund(T) {
    return Math.floor(T.spent * 0.5);
  }
  upgradeTower(T) {
    if (T.l >= TOWER_MAX) return false;
    const c = this.upCost(T);
    if (this.energy < c) return false;
    this.energy -= c;
    T.spent += c;
    T.l++;
    const ts = this.towerStats(T.type, T.l);
    T.r = ts.r;
    T.fx = ts.fx;
    T.born = 0;
    this.ring(T.x, T.y, 6, T.r, T.col, 0.5, 5);
    this.burst(T.x, T.y, 14, T.col, 200, 0.4);
    this.h.sfx && this.h.sfx('buy');
    return true;
  }
  moveTower(T, x, y) {
    if (!this.canPlace(x, y, T)) return false;
    this.burst(T.x, T.y, 10, T.col, 160, 0.3);
    T.x = x;
    T.y = y;
    T.born = 0;
    this.ring(x, y, 6, T.r, T.col, 0.4, 4);
    this.h.sfx && this.h.sfx('build');
    return true;
  }
  sellTower(T) {
    this.energy += this.refund(T);
    this.towers = this.towers.filter(t => t !== T);
    this.burst(T.x, T.y, 18, T.col, 220, 0.5);
    this.h.sfx && this.h.sfx('down');
  }
  updTowers(dt) {
    // 1) Zurücksetzen und sammeln, welche Türme jeden Gegner erreichen
    for (const e of this.en) {
      e.mute = false;
      e.mark = 1;
      e.spMul = 1;
      e.vuln = 1;
      e.dmgMul = 1;
      e.critB = 0;
      e.combo = 0;
      e.perma = false;
      e.shat = false;
      e.nullp = false;
      e.tw ? (e.tw.length = 0) : (e.tw = []);
      if (e.frozen > 0) e.frozen -= dt;
      if (e.chill > 0) e.chill -= dt;
      if (e.frzImm > 0) e.frzImm -= dt;
    }
    // Stör-Türme zuerst: Sie lassen sich nicht abschalten und nehmen auch Störsendern die Wirkung. Tarner und Phasenläufer werden sichtbar.
    for (const T of this.towers) {
      if (T.type !== 'mute') continue;
      T.pulse += dt;
      T.born += dt;
      T.jam = false;
      const r2 = T.r * T.r;
      for (const e of this.en) {
        if (e.hp <= 0 || e.boss || e.down > 0) continue;
        if (sq(e.x - T.x) + sq(e.y - T.y) < r2 + e.r * e.r) {
          e.mute = true;
          if (e.cloak) e.cloak = false;
        }
      }
    }
    const jam = this.en.filter(e => e.type === 'jammer' && e.hp > 0 && !e.mute);
    for (const T of this.towers) {
      if (T.type === 'mute') continue;
      T.pulse += dt;
      T.born += dt;
      T.jam = jam.length > 0 && jam.some(j => hyp(j.x - T.x, j.y - T.y) < JAM_R);
      if (T.jam) continue;
      const r2 = T.r * T.r;
      if (T.type === 'mark') {
        for (const e of this.en) {
          if (e.hp <= 0 || e.cloak) continue;
          if (sq(e.x - T.x) + sq(e.y - T.y) < r2 + e.r * e.r && T.fx.mark > e.mark) e.mark = T.fx.mark;
        }
        continue;
      }
      for (const e of this.en) {
        if (e.hp <= 0 || e.cloak) continue;
        const d = sq(e.x - T.x) + sq(e.y - T.y);
        if (d < r2 + e.r * e.r) e.tw.push(T);
      }
    }
    // 2) Effekte addieren (max. 3 Türme) und Kombinationen bestimmen
    for (const e of this.en) {
      const tw = e.tw;
      e.sF = e.sZ = e.sK = false;
      if (!tw.length) continue;
      for (const T of tw) {
        if (T.type === 'frost') e.sF = true;
        else if (T.type === 'weak') e.sZ = true;
        else if (T.type === 'cryo') e.sK = true;
      }
      for (let i = tw.length - 1; i >= 0; i--) if (TOWERS[tw[i].type].dmgTower) tw.splice(i, 1);
      if (!tw.length) continue;
      if (tw.length > 3) {
        tw.sort((a, b) => b.l - a.l);
        tw.length = 3;
      }
      let f = 0,
        z = 0,
        k = 0;
      const sl = [],
        vu = [],
        rd = [],
        DIM = [1, 0.5, 0.25];
      for (const T of tw) {
        if (T.type === 'frost') {
          f++;
          sl.push(T.fx.slow);
        } else if (T.type === 'weak') {
          z++;
          vu.push(T.fx.vuln - 1);
          rd.push(1 - T.fx.weak);
        } else k++;
      }
      const dimSum = a => a.sort((x, y) => y - x).reduce((s, v, i) => s + v * DIM[i], 0);
      let slow = dimSum(sl);
      if (e.boss) slow *= 0.5;
      e.spMul = 1 - Math.min(0.65, slow);
      e.vuln = 1 + Math.min(0.8, dimSum(vu));
      e.dmgMul = 1 - Math.min(0.5, dimSum(rd));
      const amp = n => (n >= 3 ? 1.5 : 1);
      let cm = 0;
      if (f >= 2) {
        cm |= 1;
        e.kbT = (e.kbT || 0) - dt;
        if (e.kbT <= 0) {
          e.kbT = 2.4;
          if (!e.boss && !this.charge) {
            const L = hyp(e.x, e.y) || 1;
            e.x += (e.x / L) * 10 * amp(f);
            e.y += (e.y / L) * 10 * amp(f);
            this.burst(e.x, e.y, 3, '#7fd0ff', 120, 0.25, 2);
          }
        }
      }
      if (f && z) {
        cm |= 2;
        const dps =
          e.max * (e.boss ? 0.003 : 0.015) * (f + z >= 3 ? 1.5 : 1) * (this.S.poisonMul || 1) * (this.S.comboMul || 1);
        e.hp -= dps * dt;
        e.psn = (e.psn || 0) + dps * dt;
        e.psT = (e.psT || 0) + dt;
        if (e.psT > 1.2) {
          this.num(e.x, e.y - e.r - 4, fmtN(Math.max(1, e.psn)), '#8cff4f', false);
          e.psn = 0;
          e.psT = 0;
        }
        if (e.hp <= 0) {
          this.kill(e);
          continue;
        }
      }
      if (z >= 2) {
        cm |= 4;
        e.vuln += 0.1 * amp(z) * (this.S.comboMul || 1);
        e.critB = 0.1 * amp(z);
      }
      if (f && k) {
        cm |= 8;
        e.perma = true;
      }
      if (z && k) {
        cm |= 16;
        e.shat = true;
      }
      if (k >= 2) {
        cm |= 32;
        e.nullp = true;
      }
      e.combo = cm;
    }
    if (this.ampT > 0) {
      this.ampT -= dt;
      for (const e of this.en) if (e.tw.length || e.mute || e.mark > 1) e.vuln *= ENGI_AMP;
    } // Verstärker der Ingenieurin
    // 3) Kryo-Türme frieren ein (mit Kombinations-Boni)
    for (const T of this.towers) {
      if (T.type !== 'cryo' || T.jam) continue;
      T.cd -= dt;
      if (T.cd > 0) continue;
      const r2 = T.r * T.r;
      let any = false;
      const fm = this.S.freezeMul || 1;
      for (const e of this.en) {
        if (e.hp <= 0 || e.frzImm > 0) continue;
        const d = sq(e.x - T.x) + sq(e.y - T.y);
        if (d >= r2 + e.r * e.r) continue;
        any = true;
        const dur = T.fx.dur * (e.perma ? 1.5 : 1) * fm;
        if (e.boss) e.chill = dur;
        else e.frozen = dur;
        e.frzImm = dur + 2;
        if (e.nullp) {
          this.hitE(e, e.max * (e.boss ? 0.01 : 0.04), { col: '#ffffff' });
          this.burst(e.x, e.y, 5, '#ffffff', 150, 0.3, 2);
        }
      }
      if (any) {
        T.cd = T.fx.cd;
        this.ring(T.x, T.y, 8, T.r, '#bff4ff', 0.45, 8);
        this.burst(T.x, T.y, 18, '#bff4ff', T.r * 2.2, 0.45, 2.5);
        this.h.sfx && this.h.sfx('freeze');
      } else T.cd = 0.25;
    }
    for (const e of this.en) if (e.chill > 0) e.spMul = Math.min(e.spMul, 0.5);
  }

  /* ---------- damage ---------- */
  hitE(e, dmg, o = {}) {
    if (e.hp <= 0 || e.cloak) return;
    if (e.sh > 0) {
      e.sh--;
      e.flash = 0.08;
      if (!this.headless) {
        this.burst(e.x, e.y, e.sh ? 3 : 10, '#9fd8ff', e.sh ? 120 : 200, 0.25, 2);
        if (!e.sh) this.ring(e.x, e.y, e.r, e.r * 2.4, '#9fd8ff', 0.3, 4);
      }
      return;
    }
    dmg *= e.vuln || 1;
    if (o.imp) {
      if (e.mark > 1) dmg *= e.mark;
      if (e.boss || e.elite) dmg *= 1 + (this.S.impBig || 0);
    }
    if (this.buff.dmg > 0) dmg *= 2;
    if (e.armorT > 0) dmg *= 0.2;
    if (e.type === 'tank') dmg = Math.min(dmg, e.max * TANK_CAP);
    if (e.shat && e.frozen > 0) dmg *= 2;
    let cr = o.crit;
    if (e.critB && Math.random() < e.critB) {
      dmg *= 2;
      cr = true;
    }
    if (this.tally) this.tally[this.src] = (this.tally[this.src] || 0) + Math.min(dmg, e.hp) / e.max;
    e.hp -= dmg;
    e.flash = 0.08;
    if (e.type === 'mirror' && !e.mute && this.t - e.mirT > MIRROR_CD) {
      e.mirT = this.t;
      let a = null,
        bd = MIRROR_R * MIRROR_R;
      for (const h of this.heroes) {
        if (h.dead > 0) continue;
        const q = sq(h.x - e.x) + sq(h.y - e.y);
        if (q < bd) {
          bd = q;
          a = h;
        }
      }
      for (const h of this.drones) {
        const q = sq(h.x - e.x) + sq(h.y - e.y);
        if (q < bd) {
          bd = q;
          a = h;
        }
      }
      if (a) {
        this.hurtAlly(a, a.max * MIRROR_PCT);
        this.headless ||
          this.bolts.push({
            pts: [
              [e.x, e.y],
              [a.x, a.y],
            ],
            l: 0,
            m: 0.15,
            col: e.col,
            w: 2,
          });
      }
    }
    if (!this.headless && (o.num !== false || cr))
      this.num(
        e.x,
        e.y - e.r - 4,
        fmtN(Math.max(1, dmg)) + (cr ? '!' : ''),
        cr ? '#ffe14f' : o.col || '#d6fdff',
        !!(cr || o.big),
      );
    if (e.hp <= 0) this.kill(e);
  }
  kill(e) {
    // Wiedergänger: beim ersten Tod bleibt er kurz liegen (unangreifbar) und steht mit halbem Leben wieder auf
    if (e.type === 'revenant' && !e.rev) {
      e.rev = true;
      e.hp = e.max * 0.5;
      e.down = REV_DOWN;
      e.cloak = true;
      this.burst(e.x, e.y, 8, e.col, 160, 0.4, 2);
      return;
    }
    this.kills++;
    this.energy +=
      e.val * this.energyMul(e) * (this.t - this.engiAt < 0.2 ? ENGI_ENERGY : 1) * (this.S.energyGain || 1);
    const kb = this.killsBy;
    kb[e.type] = (kb[e.type] || 0) + 1;
    if (e.elite) kb.elite = (kb.elite || 0) + 1;
    if (e.boss) {
      kb['boss:' + e.name] = (kb['boss:' + e.name] || 0) + 1;
      if (this.twin && ++this.twinDown === 2) kb.twin = (kb.twin || 0) + 1;
    }
    if (e.shiny) {
      kb['shiny:' + e.type] = (kb['shiny:' + e.type] || 0) + 1;
      this.ring(e.x, e.y, e.r, e.r * 5, '#ffffff', 0.7, 8);
      this.h.banner && this.h.banner('Schillernd!', ETYPES[e.type].name + ' besiegt');
      this.h.sfx && this.h.sfx('abil');
    }
    if (e.type === 'brooder') this.pend.push(['egg', e.x, e.y, e.max * EGG_HP]);
    if (e.type === 'gas') {
      this.zones.push({ kind: 'gas', x: e.x, y: e.y, r: GAS_R, t: GAS_DUR, col: e.col });
      this.ring(e.x, e.y, 8, GAS_R, e.col, 0.5, 5);
    }
    if (e.type === 'splitter')
      for (let i = 0; i < 3; i++) {
        const a = (i * TAU) / 3 + rnd(0, 1);
        this.pend.push(['mite', e.x + Math.cos(a) * e.r, e.y + Math.sin(a) * e.r, e.max * MITE_HP]);
      }
    this.burst(e.x, e.y, e.boss ? 60 : e.elite ? 22 : 8, e.col, e.boss ? 320 : 200, e.boss ? 0.9 : 0.5, e.boss ? 5 : 3);
    this.reward(e);
    if (e.drop) this.spawnDrop(e.x, e.y);
    this.h.sfx && this.h.sfx(e.boss ? 'boss' : e.elite || e.type === 'brute' ? 'killbig' : 'kill');
  }
  energyMul(e) {
    return 1;
  }
  reward(e) {
    const S = this.S,
      w = this.w;
    this.gain.s += e.val * Math.pow(1.025, w - 1) * S.gS * S.gAll * (this.buff.gain > 0 ? 2 : 1);
    if (e.elite && Math.random() < S.prismChance) {
      const p = S.gP;
      this.gain.p += p;
      this.num(e.x, e.y - e.r - 34, '+' + fmtN(Math.max(1, p)) + ' ' + (p < 2 ? 'Prisma' : 'Prismen'), '#ff4fd8', true);
    }
    if (e.elite && Math.random() < 0.55) {
      const k = S.gK * S.gAll;
      this.gain.k += k;
      this.num(e.x, e.y - e.r - 18, '+' + fmtN(Math.max(1, k)) + ' ' + (k < 2 ? 'Kern' : 'Kerne'), '#8cff4f', true);
      this.ring(e.x, e.y, 4, 40, '#8cff4f', 0.45, 4);
    }
    if (e.boss) {
      const p = (1 + Math.floor(w / 25)) * S.gP;
      this.gain.p += p;
      this.bossKills++;
      this.shake = Math.max(this.shake, 14);
      this.ring(e.x, e.y, 10, 180, '#ff4fd8', 0.7, 12);
      this.num(e.x, e.y - 50, '+' + fmtN(Math.max(1, p)) + ' ' + (p < 2 ? 'Prisma' : 'Prismen'), '#ff4fd8', true);
      // Sternenstaub: erster Bosssieg ab Welle 20 in diesem Zyklus, ab Welle 30 jeder Bosssieg
      const first = w > (this.save.cycleBest || 0);
      let d = 0;
      if (w >= 20 && first) d = (1 + S.gD) * S.gAll;
      else if (w >= 30) d = S.gAll;
      if (this.dustW === w) d = 0;
      if (d) {
        this.dustW = w;
        this.gain.d += d;
        this.ring(0, 0, 20, 400, '#ffe14f', 1, 10);
        this.num(e.x, e.y - 72, '+' + fmtN(d) + ' Sternenstaub', '#ffe14f', true);
      }
      this.h.banner &&
        this.h.banner(
          'Boss besiegt',
          (p < 2 ? '+1 Prisma' : '+' + fmtN(p) + ' Prismen') + (d ? ` und +${fmtN(d)} Sternenstaub` : ''),
        );
    }
  }
  damageBase(d) {
    d *= this.S.dmgTaken;
    const b = this.base;
    let r = d;
    if (b.ov > 0) {
      const a = Math.min(b.ov, r);
      b.ov -= a;
      r -= a;
    }
    if (r > 0 && b.sh > 0) {
      const a = Math.min(b.sh, r);
      b.sh -= a;
      r -= a;
    }
    b.hp -= r;
    b.shDelay = 3;
    b.flash = 0.15;
    this.shake = Math.max(this.shake, r > 0 ? 5 : 2);
    this.h.sfx && this.h.sfx(r > 0 ? 'base' : 'shield');
    if (b.hp <= 0 && !this.over) {
      b.hp = 0;
      this.end();
    }
  }
  hurtAlly(a, d) {
    a.hp -= d;
    a.flash = 0.1;
    if (a.hp <= 0) {
      this.burst(a.x, a.y, a.d ? 24 : 8, a.col || '#3df5ff', 200, 0.5);
      if (a.d) {
        a.hp = 0;
        a.dead = this.S.revive;
        this.h.sfx && this.h.sfx('down');
      }
    }
  }
  end() {
    this.over = true;
    this.boomed = !!this.quit;
    if (this.quit) {
      this.burst(0, 0, 30, '#3df5ff', 260, 0.8, 4);
      this.ring(0, 0, 10, 200, '#3df5ff', 0.7, 8);
    } else {
      this.burst(0, 0, 26, '#ffffff', 240, 0.4, 3);
      this.shake = 9;
    }
    for (const c of CUR_IDS) this.gain[c] = Math.floor(this.gain[c]);
    this.h.sfx && this.h.sfx('lose');
  }

  /* ---------- waves ---------- */
  milestone(w) {
    const S = this.S,
      r = { k: 0, p: 0 };
    if (w > 1 && (w - 1) % 5 === 0) {
      r.k = Math.floor((w - 1) / 5) * S.gK * S.gAll;
      this.gain.k += r.k;
    }
    if (w >= 10 && w % 10 === 0) {
      r.p = S.gP;
      this.gain.p += r.p;
    }
    return r;
  }
  nextWave() {
    const w = ++this.w,
      S = this.S;
    const n = Math.round(Math.min(8 + w * 2.4, 50 + w * 0.6)),
      bS = w >= 3 ? Math.min(0.25, 0.04 * (w - 2)) : 0,
      sS = w >= 5 ? Math.min(0.2, 0.04 * (w - 4)) : 0;
    const eC = Math.min(0.08, 0.03 + 0.003 * w) * S.elite,
      twin = w % TWIN_EVERY === 0,
      boss = w % 10 === 0 || twin,
      cnt = boss ? Math.round(n * 0.5) : n,
      q = [];
    this.twin = twin;
    this.bossPt = null;
    this.twinMax = 0;
    this.twinDown = 0;
    const mix = waveMix(w);
    for (let i = 0; i < cnt; i++) {
      let r = Math.random(),
        type = 'swarm';
      for (const [t, s] of mix) {
        if (r < s) {
          type = t;
          break;
        }
        r -= s;
      }
      q.push({ type, elite: Math.random() < eC, shiny: Math.random() < SHINY_P });
    }
    const dv = Dev.wave ? Dev.wave(this) : null;
    if (dv && dv.shiny && q.length) q[0].shiny = true; // Testhilfen: erzwungener schillernder Gegner bzw. Abwurf
    if ((Math.random() < DROP_P || (dv && dv.drop)) && q.length) q[Math.floor(Math.random() * q.length)].drop = true; // vor den Bossen: Bosse werfen nichts ab   // Testhilfe: ein schillernder Gegner je Welle
    if (boss) q.splice(Math.floor(q.length / 3), 0, { type: 'boss', elite: false });
    if (twin) q.splice(Math.floor((q.length * 2) / 3), 0, { type: 'boss', elite: false, twin: true });
    if (w > 1) this.energy += 10;
    this.queue = q;
    this.spawnI = Math.min(12, 8 + w * 0.12) / q.length;
    this.spawnT = 0.2;
    this.waveEndT = 0;
    let sub = twin ? 'Zwei Bosse nähern sich' : boss ? 'Ein Boss nähert sich' : '';
    const ms = this.milestone(w);
    if (ms.k) sub = `+${fmtN(Math.max(1, ms.k))} ${ms.k < 2 ? 'Kern' : 'Kerne'} für ${w - 1} Wellen`;
    if (ms.p)
      sub =
        `Meilenstein: +${fmtN(Math.max(1, ms.p))} ${ms.p < 2 ? 'Prisma' : 'Prismen'}` +
        (twin ? ' · Doppelboss naht' : boss ? ' · Boss naht' : '');
    const neu = WAVE_MIX.find(t => ETYPES[t].from === w && ETYPES[t].text);
    if (neu) sub = (sub ? sub + ' · ' : '') + 'Neu: ' + ETYPES[neu].name;
    if (w > this.save.best && this.save.best > 0 && !this.record) {
      this.record = true;
    }
    this.h.banner && this.h.banner(`Welle ${w}`, sub);
    this.h.sfx && this.h.sfx(boss ? 'bosswave' : 'wave');
  }
  bossName() {
    const used = this.en.filter(e => e.boss && e.hp > 0).map(e => e.name),
      free = BOSS_NAMES.filter(n => !used.includes(n)),
      l = free.length ? free : BOSS_NAMES;
    return l[Math.floor(Math.random() * l.length)];
  }
  spawnPt() {
    const W = this.hw + 40,
      H = this.hh + 40;
    let u = Math.random() * (4 * W + 4 * H);
    if (u < 2 * W) return [-W + u, -H];
    u -= 2 * W;
    if (u < 2 * H) return [W, -H + u];
    u -= 2 * H;
    if (u < 2 * W) return [W - u, H];
    u -= 2 * W;
    return [-W, H - u];
  }
  spawnEnemy(type, elite, x, y, shiny) {
    const T = ETYPES[type],
      w = this.w,
      hm = this.hpScale(w),
      dm = this.dmgScale(w);
    let hp = T.hp * hm * (type === 'boss' ? (500 / 900) * (1 + w * 0.03) * (this.twin ? TWIN_HP : 1) : 1),
      r = T.r,
      val = T.val;
    if (elite) {
      hp *= 5;
      r *= 1.35;
      val *= 4;
    }
    if (shiny) hp *= SHINY_HP;
    this.en.push({
      type,
      x,
      y,
      r,
      hp,
      max: hp,
      sp: T.sp * rnd(0.9, 1.1) * (elite ? 0.85 : 1),
      dmg: T.dmg * dm * (elite ? 2 : 1),
      val,
      elite,
      boss: type === 'boss',
      ranged: !!T.ranged,
      col: T.col,
      flash: 0,
      name: type === 'boss' ? this.bossName() : null,
      atkT: rnd(0, 1),
      ang: Math.atan2(-y, -x),
      sumT: 4,
      wob: rnd(0, TAU),
      stop:
        type === 'siege' || type === 'sniper'
          ? Math.min(rnd(250, 270), Math.min(this.hw, this.hh) - 14)
          : rnd(200, 240),
      sh: 0,
      sh0: 0,
      bd: 0,
      shiny: !!shiny,
      healT: rnd(0, 1),
      cloak: type === 'cloaker',
      heavy: type === 'giant',
      acc: 1,
      down: 0,
      rev: false,
      qT: QUEEN_CD,
      aimT: 0,
      tgA: null,
      mirT: -9,
      mate: null,
      rage: false,
      jT: JUMP_CD * rnd(0.5, 1),
      phT: PHASE_OFF * rnd(0.3, 1),
      eggT: EGG_T,
      cast: 0,
      cast0: 0,
      abT: rnd(4, 7),
      armorT: 0,
      // Alle später benutzten Felder schon hier anlegen: Gegner haben dann immer dieselbe Form, das hält den Rechenkern schnell.
      mute: false,
      mark: 1,
      spMul: 1,
      vuln: 1,
      dmgMul: 1,
      critB: 0,
      combo: 0,
      perma: false,
      shat: false,
      nullp: false,
      tw: [],
      frozen: 0,
      chill: 0,
      frzImm: 0,
      sF: false,
      sZ: false,
      sK: false,
      kbT: 0,
      psn: 0,
      psT: 0,
      acid: 0,
    });
    if (type === 'shield') {
      const e = this.en[this.en.length - 1];
      e.sh = e.sh0 = SHIELD_HITS + Math.floor(w / SHIELD_PER);
    }
  }
  updWaves(dt) {
    if (this.queue.length) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        const k = Math.min(this.queue.length, 1 + Math.floor(Math.random() * 3));
        const [x, y] = this.spawnPt();
        for (let i = 0; i < k; i++) {
          const q = this.queue.shift();
          let px = x,
            py = y;
          // der zweite Boss eines Doppelbosses kommt von der gegenüberliegenden Seite
          if (q.type === 'boss') {
            if (q.twin && this.bossPt) {
              px = -this.bossPt[0];
              py = -this.bossPt[1];
            } else this.bossPt = [x, y];
          }
          this.spawnEnemy(q.type, q.elite, px + rnd(-22, 22), py + rnd(-22, 22), q.shiny);
          if (q.drop) this.en[this.en.length - 1].drop = true;
          if (q.type === 'pair') {
            const a = this.en[this.en.length - 1];
            this.spawnEnemy('pair', false, a.x + rnd(-30, 30), a.y + rnd(-30, 30));
            const m = this.en[this.en.length - 1];
            a.mate = m;
            m.mate = a;
          }
        }
        this.spawnT = this.spawnI * k * rnd(0.7, 1.3);
      }
    } else {
      this.waveEndT += dt;
      if (this.en.length <= 3 || this.waveEndT > 9) {
        this.waveGap -= dt;
        if (this.waveGap <= 0) {
          this.nextWave();
          this.waveGap = 1.5;
        }
      }
    }
  }

  /* ---------- base ---------- */
  updBase(dt) {
    const b = this.base,
      S = this.S;
    b.rot += dt * 0.6;
    b.flash -= dt;
    if (S.regen) b.hp = Math.min(b.max, b.hp + b.max * S.regen * dt);
    b.shDelay -= dt;
    if (b.shMax > 0 && b.shDelay <= 0) b.sh = Math.min(b.shMax, b.sh + b.shMax * 0.12 * this.S.shRegen * dt);
    if (b.ov > 0) b.ov = Math.max(0, b.ov - b.max * 0.04 * dt);
    for (const tu of b.turrets) {
      tu.t -= dt;
      const x = Math.cos(tu.a) * 44,
        y = Math.sin(tu.a) * 44,
        tg = this.nearest(x, y, S.turretRange);
      if (tg) {
        tu.aim = Math.atan2(tg.y - y, tg.x - x);
        if (tu.t <= 0) {
          tu.t = 1 / (1.5 * S.turretRate);
          this.shootAt(x + Math.cos(tu.aim) * 8, y + Math.sin(tu.aim) * 8, tg, 560, S.turretDmg, '#3df5ff', {
            num: false,
            size: 3,
          });
          this.h.sfx && this.h.sfx('turret');
        }
      }
    }
    if (S.pulse) {
      b.pulseT -= dt;
      if (b.pulseT <= 0) {
        let any = false;
        for (const e of this.en) {
          if (e.hp <= 0) continue;
          const d = hyp(e.x, e.y) || 1;
          if (d < S.pulseR + e.r) {
            any = true;
            if (!e.boss) {
              e.x += (e.x / d) * 35;
              e.y += (e.y / d) * 35;
            }
            this.hitE(e, S.pulseDmg + e.max * (S.pulsePct || 0) * (e.boss ? 0.2 : 1), { col: '#3df5ff' });
          }
        }
        if (any) {
          this.ring(0, 0, 30, S.pulseR + 15, '#3df5ff', 0.5, 10);
          b.pulseT = S.pulseCd;
          this.h.sfx && this.h.sfx('pulse');
        } else b.pulseT = 0.3;
      }
    }
  }

  /* ---------- heroes ---------- */
  updHeroes(dt) {
    for (const h of this.heroes) {
      if (h.dead > 0) {
        h.dead -= dt;
        if (h.dead <= 0) {
          h.dead = 0;
          h.hp = h.max;
          h.x = Math.cos(h.idleA) * 40;
          h.y = Math.sin(h.idleA) * 40;
          this.ring(h.x, h.y, 4, 40, h.col, 0.4, 5);
        }
        continue;
      }
      h.flash -= dt;
      h.atkT -= dt;
      h.abT -= dt;
      if (this.S.heroRegen && h.hp < h.max) h.hp = Math.min(h.max, h.hp + h.max * this.S.heroRegen * dt);
      if (h.cast) h.cast = Math.max(0, h.cast - dt);
      if (h.id !== 'klinge') h.lunge = Math.max(0, h.lunge - dt);
      this['ai_' + h.id](h, dt);
    }
  }
  idle(h, dt, R = 55) {
    h.idleA += dt * 0.25;
    this.moveTo(h, Math.cos(h.idleA) * R, Math.sin(h.idleA) * R, dt, h.sp * 0.6);
  }
  kite(h, tg, dt) {
    const dx = tg.x - h.x,
      dy = tg.y - h.y,
      dd = hyp(dx, dy);
    h.face = Math.atan2(dy, dx);
    if (dd > h.range * 0.95) this.moveTo(h, tg.x, tg.y, dt);
    else if (dd < h.range * 0.4) this.moveTo(h, h.x - dx, h.y - dy, dt, h.sp * 0.8);
    return dd;
  }
  cluster() {
    let best = null,
      bn = 0;
    const list =
      this.en.length > 30
        ? Array.from({ length: 30 }, () => this.en[Math.floor(Math.random() * this.en.length)])
        : this.en;
    for (const e of list) {
      if (e.hp <= 0 || e.cloak || hyp(e.x, e.y) > 320) continue;
      let n = 0;
      this.query(e.x, e.y, 60, o => {
        if (hyp(o.x - e.x, o.y - e.y) < 60) n++;
      });
      if (n > bn) {
        bn = n;
        best = e;
      }
    }
    return best;
  }
  ai_klinge(h, dt) {
    h.lunge = Math.max(0, h.lunge - dt);
    h.spin = Math.max(0, h.spin - dt);
    const tg = this.aim(h, 300) || this.nearest(h.x, h.y, 380);
    if (h.abT <= 0 && this.en.length) {
      const c = this.cluster();
      if (c) {
        const sx = h.x,
          sy = h.y,
          tx = c.x + rnd(-6, 6),
          ty = c.y + rnd(-6, 6),
          da = Math.atan2(ty - sy, tx - sx);
        for (let i = 1; i <= 6; i++) {
          const k = i / 7;
          this.headless ||
            this.ghosts.push({
              id: h.id,
              col: h.col,
              x: sx + (tx - sx) * k,
              y: sy + (ty - sy) * k,
              a: da,
              l: -i * 0.025,
              m: 0.28,
            });
        }
        this.headless ||
          this.bolts.push({
            pts: [
              [sx, sy],
              [tx, ty],
            ],
            l: 0,
            m: 0.18,
            col: h.col,
            w: 4,
          });
        h.x = tx;
        h.y = ty;
        h.spin = 0.45;
        h.face = da;
        for (let i = 0; i < 3; i++)
          this.headless ||
            this.slashes.push({
              x: h.x,
              y: h.y,
              a: da + (i * TAU) / 3,
              dir: 1,
              r: 58 + i * 6,
              l: -i * 0.07,
              m: 0.32,
              col: i === 1 ? '#ffffff' : h.col,
              w: 11,
              full: 1,
            });
        this.aoe(h.x, h.y, 75, h.dmg * 3 * h.pow, { col: h.col, big: true, kb: [h.x, h.y, 20] });
        this.ring(h.x, h.y, 10, 95, h.col, 0.4, 12);
        this.burst(h.x, h.y, 28, h.col, 320, 0.5, 3);
        this.burst(h.x, h.y, 14, '#ffffff', 260, 0.3, 2);
        h.abT = h.cd;
        this.shake = Math.max(this.shake, 8);
        this.h.sfx && this.h.sfx('whirl');
      }
    }
    if (tg) {
      const dx = tg.x - h.x,
        dy = tg.y - h.y,
        dd = hyp(dx, dy);
      if (h.lunge <= 0) h.face = Math.atan2(dy, dx);
      if (dd > tg.r + h.r + 12) this.moveTo(h, tg.x, tg.y, dt);
      else if (h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.hits++;
        const heavy = h.hits % 3 === 0;
        h.swDir = -h.swDir;
        h.lunge = 0.16;
        const hc = Math.random() < this.S.heroCrit,
          dm = h.dmg * (heavy ? 1.8 : 1) * (hc ? 2.5 : 1),
          fx = Math.cos(h.face),
          fy = Math.sin(h.face);
        this.hitE(tg, dm, { col: h.col, big: heavy, crit: hc });
        this.aoe(tg.x, tg.y, heavy ? 42 : 28, dm * 0.5, { num: false, skip: tg, kb: [h.x, h.y, heavy ? 10 : 4] });
        this.knock(tg, h.x, h.y, heavy ? 16 : 7);
        this.headless ||
          this.slashes.push({
            x: h.x + fx * 10,
            y: h.y + fy * 10,
            a: h.face,
            dir: h.swDir,
            r: heavy ? 44 : 34,
            l: 0,
            m: heavy ? 0.3 : 0.22,
            col: h.col,
            w: heavy ? 13 : 9,
          });
        if (heavy)
          this.headless ||
            this.slashes.push({
              x: h.x + fx * 10,
              y: h.y + fy * 10,
              a: h.face,
              dir: -h.swDir,
              r: 38,
              l: -0.06,
              m: 0.26,
              col: '#ffffff',
              w: 7,
            });
        const ix = tg.x - fx * tg.r,
          iy = tg.y - fy * tg.r;
        this.burst(ix, iy, heavy ? 12 : 6, '#ffffff', 280, 0.22, 2);
        this.burst(ix, iy, heavy ? 10 : 5, h.col, 220, 0.35, 2.6);
        if (heavy) this.shake = Math.max(this.shake, 3.5);
        this.h.sfx && this.h.sfx(heavy ? 'heavy' : 'slash');
      }
    } else this.idle(h, dt);
    this.leash(h, 320);
  }
  // Kopfjäger: nimmt das zäheste große Ziel (Elite, Hüne, Boss) in Reichweite, sonst das übliche Ziel
  bigGame(h, R) {
    let b = null,
      bh = 0;
    for (const e of this.en) {
      if (e.hp <= 0 || e.cloak || !(e.elite || e.boss || e.heavy) || e.max <= bh) continue;
      if (hyp(e.x - h.x, e.y - h.y) < R) {
        bh = e.max;
        b = e;
      }
    }
    return b;
  }
  ai_kopfjaeger(h, dt) {
    const tg = this.bigGame(h, 420) || this.aim(h, 380);
    if (tg) {
      const dd = this.kite(h, tg, dt),
        big = tg.elite || tg.boss || tg.heavy ? HUNT_MUL : 1,
        mx = h.x + Math.cos(h.face) * 14,
        my = h.y + Math.sin(h.face) * 14;
      if (h.abT <= 0 && dd <= h.range * 1.2) {
        h.abT = h.cd;
        h.atkT = 1 / h.rate;
        h.lunge = 0.2;
        this.headless ||
          this.bolts.push({
            pts: [
              [mx, my],
              [tg.x, tg.y],
            ],
            l: 0,
            m: 0.25,
            col: h.col,
            w: 5,
          });
        this.ring(tg.x, tg.y, 4, 46, h.col, 0.35, 6);
        this.burst(tg.x, tg.y, 14, h.col, 260, 0.4, 3);
        this.hitE(tg, h.dmg * HUNT_SHOT * h.pow * big, { col: h.col, big: true });
        this.shake = Math.max(this.shake, 4);
        this.h.sfx && this.h.sfx('abil');
      } else if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.lunge = 0.1;
        const hc = Math.random() < this.S.heroCrit;
        this.shootAt(mx, my, tg, 760, h.dmg * (hc ? 2.5 : 1) * big, h.col, { size: 4, num: true });
        this.h.sfx && this.h.sfx('shoot');
        this.ring(mx, my, 2, 11, h.col, 0.14, 2);
      }
    } else this.idle(h, dt);
    this.leash(h, 250);
  }
  // Ingenieurin: mehr Energie, solange sie lebt (engiAt); Verstärker lässt Gegner im Turmradius mehr Schaden nehmen (ampT, wirkt in updTowers)
  ai_ingenieurin(h, dt) {
    this.engiAt = this.t;
    const tg = this.aim(h, 320);
    if (h.abT <= 0 && this.towers.length && this.en.length) {
      h.abT = h.cd;
      this.ampT = ENGI_DUR;
      for (const T of this.towers) this.ring(T.x, T.y, 8, T.r, h.col, 0.5, 5);
      this.ring(h.x, h.y, 4, 40, h.col, 0.4, 5);
      this.h.sfx && this.h.sfx('abil');
    }
    if (tg) {
      const dd = this.kite(h, tg, dt);
      if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.lunge = 0.1;
        const mx = h.x + Math.cos(h.face) * 12,
          my = h.y + Math.sin(h.face) * 12,
          hc = Math.random() < this.S.heroCrit;
        this.shootAt(mx, my, tg, 620, h.dmg * (hc ? 2.5 : 1), h.col, { size: 3, num: true });
        this.h.sfx && this.h.sfx('shoot');
      }
    } else this.idle(h, dt);
    this.leash(h, 250);
  }
  ai_schuetzin(h, dt) {
    const tg = this.aim(h, 360);
    if (h.abT <= 0 && tg) {
      const a0 = Math.atan2(tg.y - h.y, tg.x - h.x);
      for (let i = 0; i < 12; i++)
        this.shoot(h.x, h.y, a0 + (i - 5.5) * 0.09, 640, h.dmg * 1.5 * h.pow, h.col, { pierce: 3, size: 4, num: true });
      h.abT = h.cd;
      this.h.sfx && this.h.sfx('abil');
      this.h.sfx && this.h.sfx('turret');
    }
    if (tg) {
      const dd = this.kite(h, tg, dt);
      if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        h.lunge = 0.1;
        const mx = h.x + Math.cos(h.face) * 14,
          my = h.y + Math.sin(h.face) * 14;
        {
          const hc = Math.random() < this.S.heroCrit;
          this.shootAt(mx, my, tg, 660, h.dmg * (hc ? 2.5 : 1), h.col, { size: 3.5, num: true });
        }
        this.h.sfx && this.h.sfx('shoot');
        this.ring(mx, my, 2, 11, h.col, 0.14, 2);
        this.burst(mx, my, 3, '#ffffff', 140, 0.15, 1.6);
      }
    } else this.idle(h, dt);
    this.leash(h, 250);
  }
  chain(from, first, dmg, n, col, o = {}) {
    const hit = new Set();
    let cur = first,
      fx = from[0],
      fy = from[1];
    for (let i = 0; i <= n && cur; i++) {
      this.headless || this.bolts.push({ pts: jag(fx, fy, cur.x, cur.y, 6, 8), l: 0, m: 0.22, col, w: 3 });
      hit.add(cur);
      this.hitE(cur, dmg, o);
      if (o.each) o.each(cur);
      fx = cur.x;
      fy = cur.y;
      dmg *= 0.8;
      let nx = null,
        nd = 110 * 110;
      for (const e of this.en) {
        if (e.hp <= 0 || hit.has(e)) continue;
        const d = sq(e.x - fx) + sq(e.y - fy);
        if (d < nd) {
          nd = d;
          nx = e;
        }
      }
      cur = nx;
    }
    return hit;
  }
  strike(x, y, dmg, col) {
    this.headless || this.bolts.push({ pts: jag(x + rnd(-30, 30), y - 240, x, y, 9, 14), l: 0, m: 0.3, col, w: 5 });
    this.aoe(x, y, 42, dmg, { col, big: true });
    this.ring(x, y, 4, 50, col, 0.3, 6);
    this.burst(x, y, 8, col, 160, 0.4);
  }
  ai_arkanist(h, dt) {
    const tg = this.aim(h, 340);
    if (h.abT <= 0 && this.en.length) {
      const list = this.en
        .filter(e => e.hp > 0)
        .sort((a, b) => a.x * a.x + a.y * a.y - (b.x * b.x + b.y * b.y))
        .slice(0, 14);
      for (let i = 0; i < 8 && list.length; i++) {
        const e = list[Math.floor(Math.random() * list.length)];
        this.strike(e.x, e.y, h.dmg * 4 * h.pow, h.col);
      }
      h.abT = h.cd;
      this.shake = Math.max(this.shake, 5);
      this.h.sfx && this.h.sfx('abil');
    }
    if (tg) {
      const dd = this.kite(h, tg, dt);
      if (dd <= h.range && h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        {
          const hc = Math.random() < this.S.heroCrit;
          this.chain([h.x, h.y], tg, h.dmg * (hc ? 2.5 : 1), 3, h.col, { col: h.col, crit: hc });
        }
        this.ring(h.x, h.y, 22, 16, h.col, 0.3, 2);
        h.cast = 0.3;
        this.h.sfx && this.h.sfx('zap');
      }
    } else this.idle(h, dt);
    this.leash(h, 240);
  }
  ai_waechterin(h, dt) {
    const b = this.base;
    h.healT -= dt;
    if (h.healT <= 0) {
      h.healT = 1;
      const amt = b.max * 0.012 * h.pow;
      if (b.hp < b.max) {
        b.hp = Math.min(b.max, b.hp + amt);
        this.num(0, -40, '+' + fmtN(Math.max(1, amt)), '#8cff4f', false);
      }
      for (const a of [...this.heroes, ...this.drones])
        if (a !== h && !(a.dead > 0) && hyp(a.x - h.x, a.y - h.y) < 130)
          a.hp = Math.min(a.max, a.hp + a.max * 0.08 * h.pow);
      this.ring(h.x, h.y, 6, 130, h.col, 0.6, 2);
    }
    if (h.abT <= 0 && this.en.length) {
      b.ov = Math.max(b.ov, b.max * 0.3 * h.pow);
      for (const a of [...this.heroes, ...this.drones]) if (!(a.dead > 0)) a.hp = a.max;
      this.ring(0, 0, 20, 90, h.col, 0.6, 10);
      h.abT = h.cd;
      this.h.sfx && this.h.sfx('abil');
    }
    const tg = this.nearest(h.x, h.y, h.range);
    if (tg) {
      h.face = Math.atan2(tg.y - h.y, tg.x - h.x);
      if (h.atkT <= 0) {
        h.atkT = 1 / h.rate;
        this.shootAt(h.x, h.y, tg, 560, h.dmg, h.col, { size: 3, num: true });
        this.h.sfx && this.h.sfx('shoot2');
      }
    }
    this.idle(h, dt, 62);
  }

  /* ---------- drones ---------- */
  // Nächste Drohne bauen: die Klasse, die gemessen an der eingestellten Verteilung am weitesten zurückliegt
  spawnDrone() {
    const F = this.save.fleet,
      S = this.S,
      ids = F ? DRONE_IDS.filter(id => F[id] && F[id].p > 0 && droneUnlocked(this.save, id)) : [];
    let id = 'jaeger';
    const tot = ++this.droneIdx;
    if (ids.length) {
      let sum = 0,
        best = -Infinity;
      for (const i of ids) sum += F[i].p;
      for (const i of ids) {
        const def = (F[i].p / sum) * tot - (this.dcount[i] || 0);
        if (def > best) {
          best = def;
          id = i;
        }
      }
    }
    this.dcount[id] = (this.dcount[id] || 0) + 1;
    const D = DRONES[id],
      l = (F && F[id] && F[id].l) || 1,
      lm = droneLm(l),
      hp = S.droneHp * lm * D.hp;
    this.drones.push({
      cls: id,
      x: 0,
      y: 0,
      r: D.r,
      max: hp,
      hp,
      dmg: S.droneDmg * lm * D.dmg,
      rate: D.rate,
      sp: D.sp * (S.droneSp || 1),
      shots: D.shots || 1,
      splash: D.splash || 0,
      heal: id === 'repair' ? repairMul(l) : 0,
      healT: rnd(0.2, 1),
      atkT: 0.5,
      big: id === 'kreuzer',
      orb: rnd(0, TAU),
      off: rnd(0, TAU),
      flash: 0,
      col: D.col,
      face: 0,
    });
    this.ring(0, 0, 10, 36, D.col, 0.3, 3);
  }
  updDrones(dt) {
    const S = this.S,
      leash = 200 + (S.droneRange - 90);
    if (this.drones.length < S.drones) {
      this.droneT -= dt;
      if (this.droneT <= 0) {
        this.droneT = S.droneSpawn;
        this.spawnDrone();
      }
    }
    if (this.drones.length) for (const e of this.en) e.bd = hyp(e.x, e.y); // einmal pro Schritt statt einmal pro Drohne
    const hk = this.en.filter(e => e.type === 'hacker' && e.hp > 0 && !e.mute);
    for (const d of this.drones) {
      d.flash -= dt;
      d.atkT -= dt;
      if (S.droneRegen && d.hp < d.max) d.hp = Math.min(d.max, d.hp + d.max * S.droneRegen * dt);
      d.hack = hk.length > 0 && hk.some(e => hyp(e.x - d.x, e.y - d.y) < HACK_R);
      // Reparaturdrohne: kreist nah an der Basis, repariert sie und heilt Verbündete in ihrer Nähe
      if (d.heal) {
        d.healT -= dt;
        if (d.healT <= 0) {
          d.healT = 1;
          const b = this.base;
          if (b.hp < b.max) b.hp = Math.min(b.max, b.hp + b.max * REPAIR_BASE * d.heal);
          for (const a of this.heroes)
            if (!(a.dead > 0) && a.hp < a.max && hyp(a.x - d.x, a.y - d.y) < REPAIR_R)
              a.hp = Math.min(a.max, a.hp + a.max * REPAIR_ALLY * d.heal);
          for (const a of this.drones)
            if (a !== d && a.hp < a.max && hyp(a.x - d.x, a.y - d.y) < REPAIR_R)
              a.hp = Math.min(a.max, a.hp + a.max * REPAIR_ALLY * d.heal);
          this.ring(d.x, d.y, 4, 26, d.col, 0.4, 2);
        }
        d.orb += dt * 0.9;
        this.moveTo(d, Math.cos(d.orb) * 58, Math.sin(d.orb) * 58, dt, d.sp);
        d.face = d.orb + PI / 2;
        continue;
      }
      let tg = null,
        bd = Infinity;
      const pr = d.cls === 'abfang';
      for (const e of this.en) {
        if (e.hp <= 0 || e.cloak) continue;
        const bdist = e.bd;
        if (bdist > leash + S.droneRange * 0.9) continue;
        const dd =
          sq(e.x - d.x) +
          sq(e.y - d.y) * 1 -
          (e.ranged && bdist < e.stop + 10 ? 9000 : 0) -
          (pr && DRONE_PRIO[e.type] ? 60000 : 0);
        if (dd < bd) {
          bd = dd;
          tg = e;
        }
      }
      if (tg) {
        const dist = hyp(tg.x - d.x, tg.y - d.y);
        if (!this.headless) d.face = Math.atan2(tg.y - d.y, tg.x - d.x);
        if (dist > S.droneRange * 0.8)
          this.moveTo(d, tg.x + Math.cos(d.off) * 14, tg.y + Math.sin(d.off) * 14, dt, d.sp);
        if (dist <= S.droneRange && d.atkT <= 0 && !d.hack) {
          d.atkT = 1 / (1.2 * S.droneRate * d.rate);
          const dd_ = d.dmg * (1 + S.swarmInt * this.drones.length);
          if (d.splash) {
            this.headless ||
              this.bolts.push({
                pts: [
                  [d.x, d.y],
                  [tg.x, tg.y],
                ],
                l: 0,
                m: 0.14,
                col: d.col,
                w: 4,
              });
            this.aoe(tg.x, tg.y, d.splash, dd_, { num: false });
            this.ring(tg.x, tg.y, 4, d.splash, d.col, 0.25, 3);
            this.h.sfx && this.h.sfx('turret');
          } else if (S.droneBeam) {
            for (let k = 0; k < d.shots && tg.hp > 0; k++) this.hitE(tg, dd_, { num: false });
            this.headless ||
              this.bolts.push({
                pts: [
                  [d.x, d.y],
                  [tg.x, tg.y],
                ],
                l: 0,
                m: 0.12,
                col: d.col,
                w: 2,
              });
            this.h.sfx && this.h.sfx('beam');
          } else {
            for (let k = 0; k < d.shots; k++)
              this.shootAt(d.x + (k ? rnd(-5, 5) : 0), d.y + (k ? rnd(-5, 5) : 0), tg, 520, dd_, d.col, {
                num: false,
                size: d.shots > 1 ? 1.7 : 2.2,
              });
            this.h.sfx && this.h.sfx('drone');
          }
        }
      } else {
        d.orb += dt * 0.7;
        this.moveTo(d, Math.cos(d.orb) * 70, Math.sin(d.orb) * 70, dt, 90);
        d.face = d.orb + PI / 2;
      }
      this.leash(d, leash);
    }
    this.drones = this.drones.filter(d => d.hp > 0);
  }

  /* ---------- enemies ---------- */
  updEnemies(dt) {
    const b = this.base,
      allies = [];
    for (const h of this.heroes) if (!(h.dead > 0)) allies.push(h);
    for (const d of this.drones) allies.push(d);
    // Rechteck um alle Verbündeten: Gegner außerhalb können niemanden berühren und überspringen die teure Einzelprüfung
    let ax0 = Infinity,
      ax1 = -Infinity,
      ay0 = Infinity,
      ay1 = -Infinity,
      ar = 0;
    for (const a of allies) {
      if (a.x < ax0) ax0 = a.x;
      if (a.x > ax1) ax1 = a.x;
      if (a.y < ay0) ay0 = a.y;
      if (a.y > ay1) ay1 = a.y;
      if (a.r > ar) ar = a.r;
    }
    const n0 = this.en.length;
    const cmd = this.en.filter(e => e.type === 'commander' && e.hp > 0 && !e.mute);
    for (let i = 0; i < n0; i++) {
      const e = this.en[i];
      if (e.hp <= 0) continue;
      e.flash -= dt;
      if (e.down > 0) {
        e.down -= dt;
        if (e.down <= 0) {
          e.down = 0;
          e.cloak = false;
          this.ring(e.x, e.y, 4, e.r * 3, e.col, 0.4, 4);
        }
        continue;
      }
      if (e.type === 'egg') {
        e.eggT -= dt;
        if (e.eggT <= 0) {
          for (let j = 0; j < EGG_N; j++) this.pend.push(['swarm', e.x + rnd(-14, 14), e.y + rnd(-14, 14), 0]);
          e.hp = 0;
          this.ring(e.x, e.y, 4, 40, e.col, 0.4, 4);
          this.burst(e.x, e.y, 10, e.col, 160, 0.4, 2);
        }
        continue;
      }
      if (e.type === 'phaser' && !e.mute) {
        e.phT -= dt;
        if (e.phT <= 0) {
          e.cloak = !e.cloak;
          e.phT = e.cloak ? PHASE_ON : PHASE_OFF;
          this.ring(e.x, e.y, e.r * 2, 4, e.col, 0.25, 2);
        }
      }
      if (e.frozen > 0) continue;
      e.atkT -= dt;
      const d = hyp(e.x, e.y) || 1;
      if (e.type === 'jumper' && !e.mute) {
        e.jT -= dt;
        if (e.jT <= 0 && d > b.r + e.r + 30) {
          e.jT = JUMP_CD;
          const j = Math.min(JUMP_D, d - b.r - e.r - 6);
          this.ring(e.x, e.y, e.r * 2, 3, e.col, 0.3, 3);
          e.x -= (e.x / d) * j;
          e.y -= (e.y / d) * j;
          this.ring(e.x, e.y, 3, e.r * 2.4, e.col, 0.3, 3);
          continue;
        }
      }
      let buff = false;
      if (cmd.length)
        for (const c of cmd)
          if (c !== e && hyp(c.x - e.x, c.y - e.y) < CMD_R) {
            buff = true;
            break;
          }
      if (e.mate) {
        if (e.mate.hp > 0) {
          if (!e.mute && e.hp < e.max) e.hp = Math.min(e.max, e.hp + e.max * PAIR_HEAL * dt);
        } else if (!e.rage) {
          e.rage = true;
          e.acc = PAIR_RAGE;
          this.ring(e.x, e.y, e.r, e.r * 3, '#ff4f4f', 0.4, 4);
        }
      }
      if (e.type === 'ram') e.acc = Math.min(RAM_MAX, e.acc + RAM_ACC * dt);
      if (e.type === 'queen' && !e.mute) {
        e.qT -= dt;
        if (e.qT <= 0) {
          e.qT = QUEEN_CD;
          for (let j = 0; j < 2; j++) this.pend.push(['swarm', e.x + rnd(-20, 20), e.y + rnd(-20, 20), 0]);
        }
      }
      const dm = e.dmg * (e.dmgMul || 1) * (buff ? CMD_DMG : 1),
        spd = e.sp * (e.spMul || 1) * (this.rushT > 0 ? 1.5 : 1) * e.acc * (buff ? CMD_SP : 1);
      if (e.boss) {
        e.sumT -= dt;
        if (e.sumT <= 0) {
          e.sumT = 4;
          for (let j = 0; j < 3; j++) this.spawnEnemy('swarm', false, e.x + rnd(-30, 30), e.y + rnd(-30, 30));
        }
        if (e.armorT > 0) e.armorT -= dt;
        // Fähigkeit: erst in Reichweite der Basis, dann aufladen (Boss steht still), dann auslösen
        if (e.cast > 0) {
          e.cast -= dt;
          if (e.cast <= 0) {
            e.cast = 0;
            this.bossAbility(e, dm, allies);
          }
          continue;
        }
        e.abT -= dt;
        if (e.abT <= 0 && d < BOSS_ABIL_RANGE) {
          const K = BOSS_KINDS[e.name];
          e.cast = e.cast0 = K.charge;
          e.abT = K.cd;
          this.h.sfx && this.h.sfx('bosswave');
          continue;
        }
      }
      if (e.type === 'healer' && !e.mute) {
        e.healT -= dt;
        if (e.healT <= 0) {
          e.healT = 1;
          let any = false;
          this.query(e.x, e.y, HEAL_R, o => {
            if (o === e || o.hp >= o.max || hyp(o.x - e.x, o.y - e.y) > HEAL_R) return;
            o.hp = Math.min(o.max, o.hp + o.max * HEAL_PCT * (o.boss ? 0.25 : 1));
            any = true;
          });
          if (any) this.ring(e.x, e.y, 8, HEAL_R, '#6dffb0', 0.5, 3);
        }
      }
      if (e.cloak && e.type === 'cloaker' && d < CLOAK_R) {
        e.cloak = false;
        this.ring(e.x, e.y, 4, e.r * 3, '#9aa7ff', 0.4, 4);
        this.burst(e.x, e.y, 10, '#9aa7ff', 160, 0.4, 2);
      }
      let bl = null;
      const am = e.r + ar + 3;
      if (
        !e.ranged &&
        e.type !== 'bomber' &&
        e.type !== 'thief' &&
        e.x > ax0 - am &&
        e.x < ax1 + am &&
        e.y > ay0 - am &&
        e.y < ay1 + am
      )
        for (const a of allies) {
          const rr = e.r + a.r + 3;
          if (Math.abs(a.x - e.x) < rr && Math.abs(a.y - e.y) < rr && hyp(a.x - e.x, a.y - e.y) < rr) {
            bl = a;
            break;
          }
        }
      if (bl) {
        if (e.atkT <= 0) {
          this.hurtAlly(bl, dm);
          e.atkT = 1;
        }
        continue;
      }
      if (e.type === 'mortar' && d < e.stop) {
        e.ang = Math.atan2(-e.y, -e.x);
        if (e.atkT <= 0) {
          e.atkT = MORTAR_CD;
          let t = null,
            bd = MORTAR_RANGE * MORTAR_RANGE;
          for (const a of allies) {
            const q = sq(a.x - e.x) + sq(a.y - e.y);
            if (q < bd) {
              bd = q;
              t = a;
            }
          }
          if (t) {
            this.zones.push({
              kind: 'shell',
              x: t.x,
              y: t.y,
              r: MORTAR_R,
              t: MORTAR_DELAY,
              t0: MORTAR_DELAY,
              dmg: dm * MORTAR_MUL,
              col: e.col,
            });
            e.ang = Math.atan2(t.y - e.y, t.x - e.x);
          } else
            this.ep.push({
              x: e.x,
              y: e.y,
              vx: (-e.x / d) * 200,
              vy: (-e.y / d) * 200,
              dmg: dm,
              col: e.col,
              big: false,
            });
        }
        continue;
      }
      if (e.type === 'sniper' && d < e.stop) {
        if (e.tgA && (e.tgA.dead > 0 || e.tgA.hp <= 0)) e.tgA = null;
        if (!e.tgA && e.aimT === 0) {
          let bh = 0;
          for (const a of this.heroes)
            if (!(a.dead > 0) && a.max > bh) {
              bh = a.max;
              e.tgA = a;
            }
        }
        const tx = e.tgA ? e.tgA.x : 0,
          ty = e.tgA ? e.tgA.y : 0;
        e.ang = Math.atan2(ty - e.y, tx - e.x);
        e.aimT += dt;
        if (e.aimT >= SNIPE_T) {
          e.aimT = 0;
          this.headless ||
            this.bolts.push({
              pts: [
                [e.x, e.y],
                [tx, ty],
              ],
              l: 0,
              m: 0.2,
              col: '#ffffff',
              w: 4,
            });
          if (e.tgA) this.hurtAlly(e.tgA, dm * SNIPE_MUL);
          else this.damageBase(dm * SNIPE_BASE);
          e.tgA = null;
          this.burst(tx, ty, 10, e.col, 220, 0.3, 3);
          this.h.sfx && this.h.sfx('turret');
        }
        continue;
      }
      if (e.ranged && d < e.stop) {
        e.ang = Math.atan2(-e.y, -e.x);
        if (e.atkT <= 0) {
          const sg = e.type === 'siege',
            v = sg ? 150 : 220;
          e.atkT = sg ? 3.6 : 1.8;
          this.ep.push({ x: e.x, y: e.y, vx: (-e.x / d) * v, vy: (-e.y / d) * v, dmg: dm, col: e.col, big: sg });
        }
        continue;
      }
      if (d < b.r + e.r + 2) {
        if (e.type === 'thief') {
          const st = this.energy * THIEF_PCT;
          this.energy -= st;
          e.hp = 0;
          this.num(e.x, e.y - 16, '−' + fmtN(Math.max(1, st)) + ' Energie', '#ffd24f', true);
          this.ring(e.x, e.y, 4, 40, e.col, 0.4, 5);
          this.burst(e.x, e.y, 12, e.col, 200, 0.4, 2);
          this.h.sfx && this.h.sfx('down');
          continue;
        }
        if (e.type === 'bomber') {
          this.damageBase(dm);
          e.hp = 0;
          this.ring(e.x, e.y, 6, 70, '#ff5a3d', 0.4, 10);
          this.burst(e.x, e.y, 26, '#ff5a3d', 260, 0.5, 3);
          this.shake = Math.max(this.shake, 7);
          this.h.sfx && this.h.sfx('killbig');
          continue;
        }
        if (e.atkT <= 0) {
          this.damageBase(dm);
          e.atkT = 1;
        }
        continue;
      }
      e.wob += dt * 3;
      const ux = -e.x / d,
        uy = -e.y / d,
        lat = e.boss ? 0 : Math.sin(e.wob) * 0.25;
      e.x += (ux - uy * lat) * spd * dt;
      e.y += (uy + ux * lat) * spd * dt;
      if (!this.headless) e.ang = Math.atan2(uy, ux);
    }
  }
  // Fähigkeit eines Bosses auslösen (dm = sein aktueller Schaden, allies = lebende Helden und Drohnen)
  bossAbility(e, dm, allies) {
    const k = e.name;
    if (k === 'Titan') {
      for (const a of allies) {
        const dx = a.x - e.x,
          dy = a.y - e.y,
          L = hyp(dx, dy) || 1;
        if (L > BOSS_SHOCK_R) continue;
        this.hurtAlly(a, dm * 1.5);
        a.x += (dx / L) * 60;
        a.y += (dy / L) * 60;
      }
      this.ring(e.x, e.y, e.r, BOSS_SHOCK_R, '#ff6b84', 0.5, 10);
      this.shake = Math.max(this.shake, 10);
      this.h.sfx && this.h.sfx('pulse');
    } else if (k === 'Koloss') {
      e.armorT = 4;
      this.ring(e.x, e.y, e.r * 2, e.r * 1.2, '#ffffff', 0.5, 8);
      this.h.sfx && this.h.sfx('shield');
    } else if (k === 'Nemesis') {
      const d = hyp(e.x, e.y) || 1;
      this.ep.push({
        x: e.x,
        y: e.y,
        vx: (-e.x / d) * 170,
        vy: (-e.y / d) * 170,
        dmg: dm * 3,
        col: '#ff3b5c',
        big: true,
      });
      this.h.sfx && this.h.sfx('turret');
    } else if (k === 'Vortex') {
      for (const a of allies) {
        const dx = e.x - a.x,
          dy = e.y - a.y,
          L = hyp(dx, dy) || 1;
        if (L > BOSS_PULL_R) continue;
        const p = Math.min(70, Math.max(0, L - e.r));
        a.x += (dx / L) * p;
        a.y += (dy / L) * p;
        this.hurtAlly(a, dm * 0.5);
      }
      this.ring(e.x, e.y, BOSS_PULL_R, e.r, '#b98cff', 0.6, 8);
      this.h.sfx && this.h.sfx('whirl');
    } else if (k === 'Hydra') {
      for (let j = 0; j < 8; j++) {
        const a = (j * TAU) / 8;
        this.spawnEnemy('swarm', false, e.x + Math.cos(a) * (e.r + 14), e.y + Math.sin(a) * (e.r + 14));
      }
      this.ring(e.x, e.y, e.r, e.r * 2.6, '#ff8a3d', 0.5, 8);
      this.h.sfx && this.h.sfx('killbig');
    } else if (k === 'Leviathan') {
      this.rushT = 4;
      this.ring(0, 0, Math.max(this.hw, this.hh), 40, '#3df5ff', 0.9, 10);
      this.h.banner && this.h.banner('Flut', 'Alle Gegner werden schneller');
      this.h.sfx && this.h.sfx('wave');
    }
  }
  separate() {
    for (const e of this.en) {
      if (e.boss) continue;
      this.query(e.x, e.y, e.r + 36, o => {
        if (o === e) return;
        const dx = e.x - o.x,
          dy = e.y - o.y,
          rr = e.r + o.r,
          dd = dx * dx + dy * dy;
        if (dd < rr * rr && dd > 0.01) {
          const d = Math.sqrt(dd),
            p = ((rr - d) / d) * (o.boss ? 0.8 : 0.5);
          e.x += dx * p;
          e.y += dy * p;
        }
      });
      const d = hyp(e.x, e.y) || 1,
        m = this.base.r + e.r;
      if (d < m) {
        e.x *= m / d;
        e.y *= m / d;
      }
    }
  }

  /* ---------- projectiles ---------- */
  updProj(dt) {
    const lim = Math.max(this.hw, this.hh) + 120;
    for (const p of this.pr) {
      p.life -= dt;
      if (p.tg && p.tg.hp > 0 && !p.pierce) {
        const dx = p.tg.x - p.x,
          dy = p.tg.y - p.y,
          d = hyp(dx, dy) || 1;
        p.vx += ((dx / d) * p.sp - p.vx) * Math.min(1, dt * 10);
        p.vy += ((dy / d) * p.sp - p.vy) * Math.min(1, dt * 10);
      }
      p.tx += (p.x - p.tx) * Math.min(1, dt * 18);
      p.ty += (p.y - p.ty) * Math.min(1, dt * 18);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      let hitE = null;
      this.query(p.x, p.y, p.size + 20, e => {
        if (hitE || (p.hitSet && p.hitSet.has(e))) return;
        if (hyp(e.x - p.x, e.y - p.y) < e.r + p.size) hitE = e;
      });
      if (hitE && p.o.splash && this.explodeAt) {
        this.explodeAt(p, hitE);
        p.life = 0;
      } else if (hitE) {
        this.src = p.src;
        this.hitE(hitE, p.dmg, { num: p.o.num, col: p.col });
        this.burst(p.x, p.y, 3, p.col, 120, 0.25, 2);
        if (p.pierce > 0) {
          p.pierce--;
          p.hitSet.add(hitE);
        } else p.life = 0;
      }
      if (Math.abs(p.x) > lim || Math.abs(p.y) > lim) p.life = 0;
    }
    this.pr = this.pr.filter(p => p.life > 0);
    for (const q of this.ep) {
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      if (hyp(q.x, q.y) < this.base.r + 4) {
        q.dead = 1;
        this.damageBase(q.dmg * (this.S.rangedRes || 1));
        this.burst(q.x, q.y, 5, q.col, 140, 0.3);
      }
    }
    this.ep = this.ep.filter(q => !q.dead);
  }

  /* ---------- tap ---------- */
  // Autofeuer der Basis (Basis-Ast): eigener Schaden wie die Geschütze, kleine Fläche, keine Sonderfähigkeiten des Zeigers
  autoShot(x, y) {
    if (this.over) return 0;
    const S = this.S,
      hit = this.aoe(x, y, AUTO_R, S.turretDmg * S.autoDmg, { col: '#3df5ff' });
    this.ring(x, y, 4, AUTO_R + 4, '#3df5ff', 0.2, 2);
    this.headless || this.bolts.push({ pts: jag(0, 0, x, y, 5, 5), l: 0, m: 0.12, col: '#3df5ff', w: 1.6 });
    this.h.sfx && this.h.sfx(hit.length ? 'drone' : 'tapmiss');
    return hit.length;
  }
  // Impuls am Zeiger (Fokus-Ast). Zähler laufen immer weiter, auch wenn nichts getroffen wird.
  /* ---------- Abwürfe ---------- */
  spawnDrop(x, y, kind) {
    const mx = Math.max(60, (this.hw || 330) - 40),
      my = Math.max(60, (this.hh || 700) - 40);
    x = clamp(x, -mx, mx);
    y = clamp(y, -my, my);
    const d = hyp(x, y);
    if (d < 70) {
      const a = d > 1 ? Math.atan2(y, x) : rnd(0, TAU);
      x = Math.cos(a) * 70;
      y = Math.sin(a) * 70;
    }
    kind = kind || DROP_IDS[Math.floor(Math.random() * DROP_IDS.length)];
    this.drops.push({ x, y, kind, col: DROPS[kind].col, hits: 0, life: DROP_LIFE, t: 0, flash: 0 });
    this.ring(x, y, 6, 60, DROPS[kind].col, 0.6, 5);
    this.h.banner && this.h.banner('Abwurf', DROPS[kind].name + ' · ' + DROP_HITS + ' Impulse');
    this.h.sfx && this.h.sfx('abil');
  }
  dropTap(x, y, r) {
    if (!this.drops.length) return;
    let used = false;
    for (const d of this.drops) {
      if (x === null || hyp(d.x - x, d.y - y) < r + DROP_R) {
        d.hits++;
        d.life = DROP_LIFE;
        d.flash = 0.15;
        if (d.hits >= DROP_HITS) {
          d.life = 0;
          used = true;
          this.useDrop(d);
        }
      } else d.hits = 0;
    }
    if (used) this.drops = this.drops.filter(d => d.life > 0);
  }
  useDrop(d) {
    const D = DROPS[d.kind];
    this.dropN++;
    this.h.banner && this.h.banner(D.name, D.text);
    this.ring(d.x, d.y, 8, 90, D.col, 0.5, 8);
    this.burst(d.x, d.y, 20, D.col, 240, 0.5);
    if (d.kind === 'bomb') {
      const hit = [];
      this.query(d.x, d.y, BOMB_R + 40, e => {
        if (e.hp > 0 && hyp(e.x - d.x, e.y - d.y) < BOMB_R + e.r) hit.push(e);
      });
      for (const e of hit) this.hitE(e, e.max * (e.boss ? BOMB_BOSS : BOMB_PCT), { col: D.col, big: true });
      this.ring(d.x, d.y, 20, BOMB_R, D.col, 0.6, 14);
      this.shake = Math.max(this.shake, 12);
      this.h.sfx && this.h.sfx('pulse');
    } else {
      this.buff[d.kind] = DROP_DUR;
      this.h.sfx && this.h.sfx('abil');
    }
  }
  updDrops(dt) {
    const B = this.buff;
    for (const k in B) if (B[k] > 0) B[k] -= dt;
    if (B.repair > 0) {
      const b = this.base;
      if (b.hp < b.max) b.hp = Math.min(b.max, b.hp + b.max * DROP_REPAIR * dt);
    }
    if (this.drops.length) {
      for (const d of this.drops) {
        d.life -= dt;
        d.t += dt;
        d.flash -= dt;
      }
      this.drops = this.drops.filter(d => d.life > 0);
    }
  }
  /* ---------- Zonen: angekündigte Granaten (shell) und Giftwolken (gas) treffen nur Helden und Drohnen ---------- */
  updZones(dt) {
    if (!this.zones.length) return;
    for (const z of this.zones) {
      z.t -= dt;
      const hit = z.kind === 'gas' || z.t <= 0;
      if (!hit) continue;
      for (const a of this.heroes)
        if (!(a.dead > 0) && hyp(a.x - z.x, a.y - z.y) < z.r + a.r)
          this.hurtAlly(a, z.kind === 'gas' ? a.max * GAS_PCT * dt : z.dmg);
      for (const a of this.drones)
        if (a.hp > 0 && hyp(a.x - z.x, a.y - z.y) < z.r + a.r)
          this.hurtAlly(a, z.kind === 'gas' ? a.max * GAS_PCT * dt : z.dmg);
      if (z.kind === 'shell') {
        this.ring(z.x, z.y, 6, z.r + 8, z.col, 0.35, 8);
        this.burst(z.x, z.y, 14, z.col, 220, 0.4, 3);
        this.shake = Math.max(this.shake, 3);
        this.h.sfx && this.h.sfx('killbig');
      }
    }
    this.zones = this.zones.filter(z => z.t > 0);
  }
  shaded(x, y) {
    for (const e of this.en)
      if (e.type === 'shade' && e.hp > 0 && !e.mute && hyp(e.x - x, e.y - y) < SHADE_R) return true;
    return false;
  }
  tap(x, y) {
    if (this.over) return;
    const S = this.S,
      n = ++this.imps;
    this.taps = n;
    let dmg = S.tapDmg * S.impMul,
      beat = false;
    if (S.beat && n % BEAT_N === 0) {
      dmg *= 1 + S.beat;
      beat = true;
    }
    if (S.megaTap && n % S.megaTap === 0) {
      for (const e of this.en) if (e.hp > 0) this.hitE(e, dmg * MEGA_MUL, { col: '#ffe14f', big: true, imp: true });
      this.ring(0, 0, 20, Math.max(this.hw, this.hh) * 1.4, '#ffe14f', 0.8, 14);
      this.shake = Math.max(this.shake, 12);
      this.h.sfx && this.h.sfx('pulse');
      this.dropTap(null);
      return 1;
    }
    const crit = Math.random() < S.tapCrit;
    if (crit) dmg *= 2.5;
    const over = S.overload && n % 10 === 0;
    let r = S.tapR;
    if (over) {
      dmg *= 4 + 2 * S.overload;
      r = Math.max(r, 90);
    }
    if (this.shaded(x, y)) r *= this.S.shadeMul || SHADE_MUL;
    const hit = this.aoe(x, y, r, dmg, { col: beat ? '#ff4fd8' : '#ffffff', crit, big: over || beat, imp: true });
    this.dropTap(x, y, r);
    this.ring(
      x,
      y,
      4,
      r + 6,
      over ? '#ff8a3d' : beat ? '#ff4fd8' : '#ffffff',
      over || beat ? 0.45 : 0.25,
      over || beat ? 8 : 3,
    );
    if (over) {
      this.shake = Math.max(this.shake, 8);
      this.burst(x, y, 24, '#ff8a3d', 260, 0.5);
    }
    if (S.chain && hit.length) {
      const f = hit[0];
      let nx = null,
        nd = 130 * 130;
      for (const e of this.en) {
        if (e.hp <= 0 || hit.includes(e)) continue;
        const d = sq(e.x - f.x) + sq(e.y - f.y);
        if (d < nd) {
          nd = d;
          nx = e;
        }
      }
      if (nx) this.chain([f.x, f.y], nx, dmg * 0.5, S.chain - 1, '#ff8a3d', { col: '#ff8a3d', imp: true });
    }
    if (hit.length && this.h.sfx) this.h.sfx(crit || over || beat ? 'crit' : 'tap');
    return hit.length;
  }

  /* ---------- main ---------- */
  fx(dt) {
    for (const p of this.parts) {
      p.l += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - dt * 3;
      p.vy *= 1 - dt * 3;
    }
    this.parts = this.parts.filter(p => p.l < p.m);
    for (const n of this.nums) {
      n.l += dt;
      n.y += n.v * dt;
      n.v *= 1 - dt * 2.5;
    }
    this.nums = this.nums.filter(n => n.l < 0.9);
    for (const r of this.rings) r.l += dt;
    this.rings = this.rings.filter(r => r.l < r.m);
    for (const b of this.bolts) b.l += dt;
    this.bolts = this.bolts.filter(b => b.l < b.m);
    for (const s of this.slashes) s.l += dt;
    this.slashes = this.slashes.filter(s => s.l < s.m);
    for (const s of this.ghosts) s.l += dt;
    this.ghosts = this.ghosts.filter(s => s.l < s.m);
    this.shake *= Math.exp(-dt * 9);
  }
  step(dt) {
    if (this.over) {
      this.overT += dt;
      this.fx(dt);
      this.shake = Math.max(0, this.shake - dt * 26);
      if (!this.boomed && this.overT >= BOOM_T) {
        this.boomed = true;
        this.burst(0, 0, 90, '#3df5ff', 420, 1.3, 5);
        this.burst(0, 0, 50, '#ff4fd8', 320, 1.1, 4);
        this.burst(0, 0, 30, '#ffffff', 520, 0.7, 3);
        this.ring(0, 0, 10, 360, '#3df5ff', 1.1, 16);
        this.ring(0, 0, 10, 240, '#ff4fd8', 0.9, 10);
        this.ring(0, 0, 6, 130, '#ffffff', 0.5, 8);
        this.shake = 26;
        this.h.sfx && this.h.sfx('boss');
      }
      return;
    }
    this.t += dt;
    if (this.rushT > 0) this.rushT -= dt;
    this.src = 'basis';
    this.updBase(dt);
    this.updWaves(dt);
    this.src = 'tuerme';
    this.updTowers(dt);
    this.src = 'helden';
    this.updHeroes(dt);
    this.src = 'flotte';
    this.updDrones(dt);
    this.src = 'basis';
    if (this.S.autoRate > 0 && this.en.length) {
      this.autoT = (this.autoT || 0) - dt;
      if (this.autoT <= 0) {
        const tg = (this.S.autoAim && this.cluster()) || this.threat(420);
        if (tg) {
          this.autoShot(tg.x, tg.y);
          this.autoT = 1 / this.S.autoRate;
        }
      }
    }
    // Impuls am Zeiger: feste Taktung, unabhängig davon, ob dort Gegner stehen
    this.src = 'impuls';
    if (this.S.impInt > 0 && !this.noImpulse) {
      this.impT -= dt;
      for (let n = 0; this.impT <= 0 && n < 4; n++) {
        this.impT += this.S.impInt * (this.buff.haste > 0 ? DROP_HASTE : 1);
        this.tap(this.cx, this.cy);
      }
      if (this.impT < 0) this.impT = 0;
    }
    this.updDrops(dt);
    this.updEnemies(dt);
    this.updZones(dt);
    this.en = this.en.filter(e => e.hp > 0);
    this.buildGrid();
    if ((this.sepT = (this.sepT || 0) + 1) % 2 === 0) this.separate();
    this.updProj(dt);
    if (this.pend.length) {
      for (const [t, x, y, hp] of this.pend) {
        this.spawnEnemy(t, false, x, y);
        const m = this.en[this.en.length - 1];
        if (hp) {
          m.hp = m.max = hp;
        }
      }
      this.pend.length = 0;
    }
    this.en = this.en.filter(e => e.hp > 0);
    this.fx(dt);
  }
}
if (typeof module !== 'undefined') module.exports = { Run };
