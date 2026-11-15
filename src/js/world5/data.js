import { gearBonus5 } from './gear.js';

/* ================= WELT 5: Expedition (Arbeitstitel) – Daten =================
   Idle-Runner mit Heldensammlung (Idee des Nutzers vom 15.11.2026). Eine Gruppe von bis zu fünf Helden läuft von selbst von links
   nach rechts und kämpft sich durch Zonen zu je zehn Wellen; die zehnte ist ein Boss. Der Spieler handelt nicht selbst: Er sammelt
   Helden, wertet sie auf und bestimmt, wer wo steht.
   Diese Welt hat ein eigenes Grundspiel und teilt mit den anderen Welten nichts als den Rahmen (Weltenkarte, Spielstand-Datei).
   Alle Zahlen hier sind ein erster Wurf für den Prototyp und noch nicht ausbalanciert. */

// Klassen. hp/atk = Grundwerte auf Stufe 1, cd = Sekunden zwischen zwei Aktionen, melee = kämpft nur aus den vorderen zwei Plätzen,
// en = Energie je Sekunde (Fähigkeit bei 100), ess = Name des Materials für den Durchbruch alle 10 Stufen.
export const CLASSES5 = {
  tank: {
    name: 'Verteidiger',
    hp: 260,
    atk: 9,
    cd: 1.3,
    melee: true,
    en: 8,
    ess: 'Panzerkern',
    col: '#5ab8ff',
    abil: 'Bollwerk',
    text: 'Hält vorn die Stellung. „Bollwerk“ gibt ihm einen Schild und senkt den Schaden an der ganzen Gruppe.',
  },
  striker: {
    name: 'Angreifer',
    hp: 150,
    atk: 19,
    cd: 0.9,
    melee: true,
    en: 10,
    ess: 'Klingensplitter',
    col: '#ff6b84',
    abil: 'Wuchtschlag',
    text: 'Hoher Schaden im Nahkampf. „Wuchtschlag“ trifft den vordersten Gegner sehr hart und den nächsten halb so stark.',
  },
  mage: {
    name: 'Magier',
    hp: 95,
    atk: 15,
    cd: 1.4,
    melee: false,
    en: 7,
    ess: 'Funkenstaub',
    col: '#c79bff',
    abil: 'Entladung',
    text: 'Greift aus der Ferne an, jeder Treffer streut auf Gegner daneben. „Entladung“ trifft alle Gegner.',
  },
  healer: {
    name: 'Heiler',
    hp: 85,
    atk: 6,
    cd: 1.3,
    melee: false,
    en: 9,
    ess: 'Lebenstau',
    col: '#6dffb0',
    abil: 'Heilwelle',
    text: 'Heilt den am schwersten Verletzten und greift nur an, wenn niemand Hilfe braucht. „Heilwelle“ heilt die ganze Gruppe.',
  },
  support: {
    name: 'Unterstützer',
    hp: 105,
    atk: 8,
    cd: 1.2,
    melee: false,
    en: 11,
    ess: 'Resonanzspule',
    col: '#ffe14f',
    abil: 'Ansporn',
    text: 'Macht die anderen besser. „Ansporn“ lässt die Gruppe sechs Sekunden schneller handeln und Energie sammeln.',
  },
};
export const CLASS_IDS5 = Object.keys(CLASSES5);

// Seltenheiten. mul = Faktor auf Leben und Angriff, maxRank = höchster Rang, sync = Wert eines Kerns in Synchron-Staub
// (so viel Staub kostet auch ein fehlender Kern), max = so viele dürfen gleichzeitig in der Gruppe stehen.
export const RARITY5 = {
  basis: { name: 'Basis', mul: 1, maxRank: 5, sync: 1, col: '#9fb4d8' },
  elite: { name: 'Elite', mul: 1.3, maxRank: 5, sync: 3, col: '#5ab8ff' },
  legend: { name: 'Legendär', mul: 1.7, maxRank: 5, sync: 8, col: '#ffb14f' },
  champ: { name: 'Champion', mul: 2.3, maxRank: 6, sync: 20, col: '#ff4fd8' },
};
export const RARITY_IDS5 = Object.keys(RARITY5);
// Vorgabe des Nutzers: in der Gruppe 1 Champion, 2 Legendäre, 2 Basis/Elite. Umgesetzt als Obergrenze für Champions und Legendäre;
// Basis- und Elite-Helden füllen die übrigen Plätze (sonst bestünde die Gruppe am Anfang aus höchstens zwei Helden).
/* Aufstellung (seit 0.39.0, Vorgabe des Nutzers): drei Reihen – vorn, Mitte, hinten – mit je drei Feldern, also ein 3×3-Raster.
   Feld i liegt in Reihe floor(i / 3) (0 = vorn) und Spur i % 3 (0 = oben). Höchstens TEAM_SIZE5 Helden stehen im Raster.
   Nahkämpfer treffen aus der vordersten besetzten Reihe und der direkt dahinter. */
export const TEAM_CELLS5 = 9,
  ROW_NAMES5 = ['Vorn', 'Mitte', 'Hinten'];
export const rowOf5 = i => Math.floor(i / 3),
  colOf5 = i => i % 3;
export const TEAM_SIZE5 = 5,
  TEAM_MAX5 = { champ: 1, legend: 2, low: 5 };
export const teamKey5 = rar => (rar === 'champ' || rar === 'legend' ? rar : 'low');

// 26 Helden: 10 Basis (jede Klasse zweimal), 6 Elite (Angreifer doppelt), 5 Legendäre, 5 Champions.
// hue = Grundfarbe, v = Variante der Form (jeder Held sieht anders aus), en = Zuschlag auf die Energie je Sekunde.
// Champions haben eine eigene Fähigkeit (abil, text) statt der ihrer Klasse.
const H = (id, name, cls, rar, hue, v, en, abil, text) => ({ id, name, cls, rar, hue, v, en: en || 0, abil, text });
export const HEROES5 = Object.fromEntries(
  [
    H('riegel', 'Riegel', 'tank', 'basis', 205, 0, 0),
    H('poller', 'Poller', 'tank', 'basis', 185, 1, 1),
    H('funke', 'Funke', 'striker', 'basis', 350, 0, 0),
    H('kerbe', 'Kerbe', 'striker', 'basis', 15, 1, 1),
    H('glimmer', 'Glimmer', 'mage', 'basis', 270, 0, 0),
    H('zunder', 'Zunder', 'mage', 'basis', 295, 1, 1),
    H('flick', 'Flick', 'healer', 'basis', 150, 0, 0),
    H('tupfer', 'Tupfer', 'healer', 'basis', 130, 1, 1),
    H('takt', 'Takt', 'support', 'basis', 52, 0, 0),
    H('signal', 'Signal', 'support', 'basis', 38, 1, 1),
    H('bastion', 'Bastion', 'tank', 'elite', 215, 2, 1),
    H('schnitter', 'Schnitter', 'striker', 'elite', 340, 2, 1),
    H('sichel', 'Sichel', 'striker', 'elite', 25, 3, 2),
    H('lohe', 'Lohe', 'mage', 'elite', 282, 2, 1),
    H('balsam', 'Balsam', 'healer', 'elite', 160, 2, 1),
    H('fanal', 'Fanal', 'support', 'elite', 45, 2, 2),
    H('monolith', 'Monolith', 'tank', 'legend', 195, 3, 2),
    H('vesper', 'Vesper', 'striker', 'legend', 5, 4, 2),
    H('aurora', 'Aurora', 'mage', 'legend', 305, 3, 2),
    H('seraph', 'Seraph', 'healer', 'legend', 140, 3, 2),
    H('orakel', 'Orakel', 'support', 'legend', 58, 3, 3),
    H(
      'aegis',
      'Aegis',
      'tank',
      'champ',
      200,
      4,
      2,
      'Unantastbar',
      'Die ganze Gruppe nimmt drei Sekunden lang keinen Schaden, Aegis bekommt dazu einen großen Schild.',
    ),
    H(
      'fenris',
      'Fenris',
      'striker',
      'champ',
      355,
      5,
      3,
      'Hinrichtung',
      'Ein Schlag mit siebenfachem Schaden. Fällt das Ziel dabei, ist die Fähigkeit schon wieder zu 60 % geladen.',
    ),
    H(
      'astra',
      'Astra',
      'mage',
      'champ',
      288,
      4,
      2,
      'Sternensturz',
      'Trifft alle Gegner schwer und betäubt sie zwei Sekunden lang.',
    ),
    H(
      'phoenix',
      'Phönix',
      'healer',
      'champ',
      28,
      4,
      3,
      'Wiedergeburt',
      'Holt einen gefallenen Helden mit 60 % Leben zurück. Ist niemand gefallen, heilt er die ganze Gruppe stark.',
    ),
    H(
      'chronos',
      'Chronos',
      'support',
      'champ',
      62,
      4,
      4,
      'Zeitkrümmung',
      'Alle anderen Helden erhalten sofort 45 Energie, die Gruppe handelt sechs Sekunden schneller.',
    ),
  ].map(h => [h.id, h]),
);
export const HERO_IDS5 = Object.keys(HEROES5);

/* Eigenheit je Held (seit 0.38.0, Rückmeldung des Nutzers: zwei Verteidiger, die sich nur in den Werten unterscheiden, sind „Quatsch“).
   Jeder Held außer den Champions – die haben ihre eigene Fähigkeit – bekommt etwas, das nur er kann. name/text stehen im Menü,
   die übrigen Felder wertet heroStats5 (hp, atk, cd als Faktoren) bzw. Run5 aus:
   thorns = Anteil des Nahkampfschadens zurück · shieldMul/guardT = Bollwerk · dr = eigener Schaden gesenkt · nth = jeder n-te Schlag doppelt
   cleave = Anteil auf einen zweiten Gegner · leech = heilt sich um Anteil des Schadens · exec = [unter Anteil Leben, Faktor]
   splash = Streuanteil des Magiers · abil = Faktor auf die Fähigkeit · chain = Grundangriff trifft zwei Ziele · stunAbil = Betäubung in s
   healMul = Faktor auf Heilungen · abilShield = Schild in Anteil des Lebens · angel = rettet einmal je Welle vor dem Tod
   hasteT = Dauer des Ansporns · auraAtk/auraDr = solange er lebt · hasteAtk = Angriffsbonus während des Ansporns · abilEn = Energie für alle */
const TRAITS5 = {
  riegel: { name: 'Standfest', text: '20 % mehr Leben.', hp: 1.2 },
  poller: { name: 'Dornen', text: 'Wirft 25 % des Schadens aus dem Nahkampf auf den Angreifer zurück.', thorns: 0.25 },
  bastion: { name: 'Schildwall', text: 'Der Schild aus „Bollwerk“ ist um die Hälfte größer.', shieldMul: 1.5 },
  monolith: {
    name: 'Fels',
    text: 'Nimmt selbst 20 % weniger Schaden; „Bollwerk“ hält sechs statt vier Sekunden.',
    dr: 0.2,
    guardT: 6,
  },
  funke: { name: 'Flink', text: 'Greift 15 % schneller an.', cd: 0.85 },
  kerbe: { name: 'Kerbschlag', text: 'Jeder vierte Schlag trifft doppelt.', nth: 4 },
  schnitter: {
    name: 'Rundschlag',
    text: 'Jeder Schlag trifft auch den zweiten Gegner in Reichweite mit 40 %.',
    cleave: 0.4,
  },
  sichel: { name: 'Blutdurst', text: 'Heilt sich um 15 % des Schadens, den sie austeilt.', leech: 0.15 },
  vesper: { name: 'Todesstoß', text: 'Dreifacher Schaden gegen Gegner mit weniger als 30 % Leben.', exec: [0.3, 3] },
  glimmer: { name: 'Streulicht', text: 'Treffer streuen mit 80 % statt 50 % auf Gegner daneben.', splash: 0.8 },
  zunder: { name: 'Feuerkopf', text: 'Seine Fähigkeit trifft 40 % härter.', abil: 1.4 },
  lohe: { name: 'Doppelschlag', text: 'Der Grundangriff trifft zwei Ziele voll.', chain: true },
  aurora: { name: 'Polarlicht', text: '„Entladung“ betäubt alle Gegner eine Sekunde lang.', stunAbil: 1 },
  flick: { name: 'Schnelle Hand', text: 'Handelt 20 % schneller.', cd: 0.8 },
  tupfer: { name: 'Gründlich', text: 'Alle Heilungen sind 25 % stärker.', healMul: 1.25 },
  balsam: {
    name: 'Salbe',
    text: '„Heilwelle“ gibt jedem zusätzlich einen Schild in Höhe von 10 % seines Lebens.',
    abilShield: 0.1,
  },
  seraph: {
    name: 'Schutzengel',
    text: 'Einmal je Welle überlebt ein Verbündeter einen tödlichen Treffer mit einem Lebenspunkt.',
    angel: true,
  },
  takt: { name: 'Metronom', text: '„Ansporn“ hält acht statt sechs Sekunden.', hasteT: 8 },
  signal: { name: 'Leuchtfeuer', text: 'Solange Signal lebt, greift die Gruppe 8 % stärker an.', auraAtk: 0.08 },
  fanal: {
    name: 'Kampfruf',
    text: 'Während des „Ansporns“ greift die Gruppe zusätzlich 20 % stärker an.',
    hasteAtk: 0.2,
  },
  orakel: {
    name: 'Voraussicht',
    text: 'Solange Orakel lebt, nimmt die Gruppe 10 % weniger Schaden; „Ansporn“ gibt allen 20 Energie.',
    auraDr: 0.1,
    abilEn: 20,
  },
};
for (const id of HERO_IDS5) HEROES5[id].trait = TRAITS5[id] || {};

/* Eigene Fähigkeit statt der der Klasse (Rückmeldung des Nutzers: „Kein Held innerhalb einer Seltenheit sollte die gleiche Fähigkeit
   haben wie ein anderer“). Betrifft die Klassen, die in einer Seltenheit doppelt vorkommen: je der zweite Basisheld und beide
   Elite-Angreifer. ak = Schlüssel, den Run5.ability und Run5.useful auswerten. */
const ABIL5 = {
  poller: {
    ak: 'spikes',
    abil: 'Stachelpanzer',
    text: 'Fünf Sekunden lang wirft er den ganzen Schaden aus dem Nahkampf zurück und bekommt einen kleinen Schild.',
  },
  kerbe: { ak: 'whirl', abil: 'Wirbel', text: 'Trifft alle Gegner in Reichweite mit 1,6-fachem Schaden.' },
  zunder: {
    ak: 'fireball',
    abil: 'Feuerball',
    text: 'Trifft den vordersten Gegner mit vierfachem Schaden und alle daneben mit 1,5-fachem.',
  },
  tupfer: {
    ak: 'firstaid',
    abil: 'Notverband',
    text: 'Heilt den am schwersten Verletzten sehr stark und gibt ihm einen Schild.',
  },
  signal: { ak: 'mark', abil: 'Zielmarke', text: 'Sechs Sekunden lang nehmen alle Gegner 25 % mehr Schaden.' },
  schnitter: {
    ak: 'scythe',
    abil: 'Sense',
    text: 'Ein weiter Hieb: alle Gegner in Reichweite nehmen 2,2-fachen Schaden.',
  },
  sichel: {
    ak: 'bleed',
    abil: 'Aderlass',
    text: 'Trifft den vordersten Gegner mit dreifachem Schaden und heilt sich um die Hälfte davon.',
  },
};
for (const id in ABIL5) Object.assign(HEROES5[id], ABIL5[id]);
// Name der Fähigkeit eines Helden (eigene oder die seiner Klasse)
export const abilName5 = id => HEROES5[id].abil || CLASSES5[HEROES5[id].cls].abil;
export const START_HERO5 = 'funke'; // der Basisheld, mit dem man beginnt

// Aufwerten. Stufe: Leben und Angriff ×LVL_MUL5 je Stufe, Kosten in Lumen; alle 10 Stufen ein Durchbruch, der Material der Klasse kostet.
// Rang: +RANK_MUL5 je Rang, kostet Kerne des Helden (Rang r → r+1: r+1 Kerne). Jeder doppelt gefundene Held wird zu einem Kern.
export const LVL_MAX5 = 200,
  LVL_MUL5 = 1.07,
  RANK_MUL5 = 0.15;
export const lvlCost5 = l => Math.ceil(20 * Math.pow(1.16, l - 1));
export const breakCost5 = l => (l % 10 === 0 ? 3 * Math.pow(2, l / 10 - 1) : 0); // Material für den Schritt von Stufe l auf l+1
export const rankCost5 = r => r + 1;

// Werte eines Helden bei Stufe l und Rang r
// gear = angelegte Ausrüstung des Helden ({ Platz: Gegenstand }) oder nichts
export function heroStats5(id, l, r, gear) {
  const h = HEROES5[id],
    C = CLASSES5[h.cls],
    m = RARITY5[h.rar].mul * Math.pow(LVL_MUL5, l - 1) * (1 + RANK_MUL5 * r);
  const T = h.trait,
    G = gearBonus5(gear);
  return {
    hp: Math.round(C.hp * m * (T.hp || 1) * (1 + G.hp)),
    atk: Math.round(C.atk * m * (T.atk || 1) * (1 + G.atk) * 10) / 10,
    cd: (C.cd * (T.cd || 1)) / (1 + G.haste),
    en: C.en + h.en + G.en,
    dr: G.dr, // Anteil, um den Ausrüstung den Schaden senkt
  };
}
/* Wertung „UP“ (Wunsch des Nutzers: eine Zahl, die sagt, wie stark ein Held insgesamt ist; danach wird die Heldenübersicht sortiert).
   Leben und Schaden je Sekunde, Stufe, Rang und Seltenheit stecken über heroStats5 darin; dazu ein Zuschlag für Energie (häufigere
   Fähigkeit) und für Schadensminderung. Angelegte Ausrüstung zählt mit. Die Zahl ist ein Richtwert, kein Kampfergebnis. */
export const heroPower5 = (id, l, r, gear) => {
  const s = heroStats5(id, l, r, gear);
  return Math.round((s.hp / (4 * (1 - s.dr)) + (s.atk / s.cd) * 6) * (1 + (s.en - 7) * 0.015));
};

// Kryo-Kristalle: Zufallspakete mit je einem Helden. p = Chancen in Prozent für Basis, Elite, Legendär, Champion.
// (Die vom Nutzer genannten 50/25/10/3 ergaben nur 88 %; Champion 3 % im einfachen Kristall ist gesetzt.)
export const CRYSTALS5 = {
  einfach: { name: 'Kryo-Kristall', cost: 20, p: [62, 25, 10, 3], col: '#9fd8ff' },
  selten: { name: 'Seltener Kryo-Kristall', cost: 60, p: [40, 35, 18, 7], col: '#c79bff' },
  prisma: { name: 'Prismatischer Kryo-Kristall', cost: 180, p: [0, 50, 35, 15], col: '#ff4fd8' },
};
export const CRYSTAL_IDS5 = Object.keys(CRYSTALS5);
export const START_KRYON5 = 20; // reicht für den ersten Kristall

// Währungen: Lumen (jeder Gegner; Heldenstufen), Kryon (Bosse, erste Siege, selten aus Wellen; Kristalle im Shop),
// Synchron-Staub (aus Kernen von Basishelden, selten auch als Beute; ersetzt fehlende Kerne).
export const CUR5 = {
  l: { name: 'Lumen', col: '#9fd8ff' },
  k: { name: 'Kryon', col: '#c79bff' },
  d: { name: 'Synchron-Staub', col: '#ffe14f' },
  x: { name: 'Schrott', col: '#b9c6d6' }, // aus recycelter Ausrüstung, für Ausrüstungsboxen
};

// Zonen: je zehn Wellen, die zehnte ist der Boss. Jede Zone gibt vor allem das Material einer Klasse – so lohnt es sich,
// gezielt in einer früheren Zone zu sammeln. Nach fünf Zonen wiederholen sich die Namen mit einer Nummer.
export const ZONE_LEN5 = 10;
export const ZONES5 = [
  { name: 'Glasfelder', ess: 'striker', hue: 190 },
  { name: 'Signalwald', ess: 'tank', hue: 140 },
  { name: 'Aschebecken', ess: 'mage', hue: 20 },
  { name: 'Stillwasser', ess: 'healer', hue: 225 },
  { name: 'Sternwarte', ess: 'support', hue: 285 },
];
const ROMAN = ['', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
export const zone5 = z => {
  const Z = ZONES5[(z - 1) % ZONES5.length],
    c = Math.floor((z - 1) / ZONES5.length);
  return { ...Z, z, name: Z.name + (ROMAN[c] !== undefined ? ROMAN[c] : ' ' + (c + 1)) };
};
// Erste Zone, die vor allem das Material dieser Klasse gibt (danach jede fünfte weitere)
export const essZone5 = cls => ZONES5.findIndex(Z => Z.ess === cls) + 1;
// Stufe = durchgehende Nummer aller Wellen (Zone 2, Welle 9 = Stufe 19)
export const stage5 = (z, w) => (z - 1) * ZONE_LEN5 + w;
export const zoneOf5 = s => Math.floor((s - 1) / ZONE_LEN5) + 1;
export const waveOf5 = s => ((s - 1) % ZONE_LEN5) + 1;
export const stageName5 = s => `${zoneOf5(s)}-${waveOf5(s)}`;

// Gegner. hp/atk = Faktoren auf die Grundwerte der Stufe, ranged = bleibt auf Abstand und trifft reihum alle Helden.
export const ENEMIES5 = {
  grunt: { name: 'Läufer', hp: 1, atk: 1, cd: 1.3, sp: 78, r: 13, loot: 1, col: '#ff8a3d' },
  swarm: { name: 'Schwärmling', hp: 0.45, atk: 0.55, cd: 0.9, sp: 105, r: 9, loot: 0.5, col: '#ffd24f' },
  brute: { name: 'Brocken', hp: 3.2, atk: 2, cd: 2, sp: 52, r: 19, loot: 3, col: '#ff4f6d' },
  shooter: { name: 'Schütze', hp: 0.7, atk: 0.9, cd: 1.7, sp: 70, r: 12, loot: 1.5, col: '#b98cff', ranged: true },
  boss: { name: 'Wächter', hp: 24, atk: 3, cd: 1.6, sp: 46, r: 32, loot: 25, col: '#ff4fd8', boss: true },
};
// Wachstum je Stufe: Gegnerleben, Gegnerschaden, Lumen
export const E_HP5 = 26,
  E_HP_G5 = 1.17,
  E_ATK5 = 5,
  E_ATK_G5 = 1.115,
  LOOT5 = 3,
  LOOT_G5 = 1.15,
  BOSS_CLEAVE_CD5 = 7, // der Boss trifft in diesem Abstand die ganze Gruppe
  BOSS_CLEAVE5 = 0.7;

/* Feste Welle einer Stufe: Liste der Gegnerarten in der Reihenfolge, in der sie anrücken. */
export function wave5(s) {
  const z = zoneOf5(s),
    w = waveOf5(s);
  if (w === ZONE_LEN5) return ['boss', 'grunt', 'grunt'];
  const n = 3 + Math.floor(w / 2) + Math.min(3, Math.floor(z / 2)),
    out = [];
  for (let i = 0; i < n; i++)
    out.push(
      s >= 3 && i % 4 === 3 ? 'brute' : s >= 5 && i % 3 === 2 ? 'shooter' : z >= 2 && i % 5 === 1 ? 'swarm' : 'grunt',
    );
  if (z >= 2) out.push('swarm', 'swarm');
  return out;
}
export const enemyHp5 = (s, t) => Math.round(E_HP5 * Math.pow(E_HP_G5, s - 1) * ENEMIES5[t].hp);
export const enemyAtk5 = (s, t) => E_ATK5 * Math.pow(E_ATK_G5, s - 1) * ENEMIES5[t].atk;
export const enemyLoot5 = (s, t) => Math.max(1, Math.round(LOOT5 * Math.pow(LOOT_G5, s - 1) * ENEMIES5[t].loot));
export const waveLoot5 = s => wave5(s).reduce((a, t) => a + enemyLoot5(s, t), 0);

// Beute neben Lumen
export const ESS_P5 = 0.5, // Material der Zone je gewonnener Welle
  ESS_BOSS5 = 3,
  KRYON_P5 = 0.25, // Kryon je gewonnener Welle
  KRYON_FIRST5 = 3, // erster Sieg in einer Welle
  DUST_P5 = 0.01, // Synchron-Staub je gewonnener Welle (relativ selten)
  DUST_BOSS_P5 = 0.25;
export const kryonBoss5 = (z, first) => (first ? 15 + 3 * z : 5);

// Abwesenheit (Vorgabe: eine Stunde weg ≈ fünf Minuten aktiv, kein Deckel): aktiv schafft man etwa fünf Wellen je Minute
export const IDLE_WPM5 = 5 / 12;
