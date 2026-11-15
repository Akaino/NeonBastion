// Doppelboss: alle TWIN_EVERY Wellen kommen zwei Bosse von gegenüberliegenden Seiten, jeder mit TWIN_HP (75 %) des normalen Bosslebens
// Boss-Arten: jede hat eine Fähigkeit. Der Boss bleibt stehen und lädt sie charge Sekunden lang sichtbar auf (Ring + Name), danach cd Sekunden Pause.
export const BOSS_KINDS = {
  Titan: {
    abil: 'Erdstoß',
    charge: 2.5,
    cd: 10,
    text: 'Schleudert Helden und Drohnen in seiner Nähe zurück und verletzt sie.',
  },
  Koloss: {
    abil: 'Panzerung',
    charge: 2,
    cd: 11,
    text: 'Nimmt vier Sekunden lang 80 % weniger Schaden.',
  },
  Nemesis: {
    abil: 'Vernichter',
    charge: 3,
    cd: 10,
    text: 'Feuert ein schweres Geschoss auf die Basis.',
  },
  Vortex: {
    abil: 'Sog',
    charge: 2.5,
    cd: 10,
    text: 'Zieht Helden und Drohnen zu sich heran und verletzt sie.',
  },
  Hydra: {
    abil: 'Brut',
    charge: 2,
    cd: 9,
    text: 'Setzt auf einen Schlag acht Schwärmer frei.',
  },
  Leviathan: {
    abil: 'Flut',
    charge: 2.5,
    cd: 12,
    text: 'Alle Gegner werden vier Sekunden lang 50 % schneller.',
  },
};

export const BOSS_ABIL_RANGE = 420,
  BOSS_SHOCK_R = 170,
  BOSS_PULL_R = 260;

export const bossLabel = e => 'BOSS · ' + e.name + (e.cast > 0 ? ' · ' + BOSS_KINDS[e.name].abil : '');

export const TWIN_EVERY = 25,
  TWIN_HP = 0.75,
  BOSS_NAMES = Object.keys(BOSS_KINDS);
