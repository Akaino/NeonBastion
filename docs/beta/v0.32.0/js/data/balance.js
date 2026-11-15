// Leitern ohne Obergrenze: bis Stufe LADDER[0] normales Wachstum, darüber zusätzlich ×LADDER[1] je Stufe
export const LADDER = [50, 1.12],
  QUICK_G = 1.4,
  PULSE_PCT = 0.012,
  BASE_GUN = 8,
  DRONE_DMG = 2.6,
  MEGA_MUL = 2; // BASE_GUN: % Geschütz-/Autofeuer-Schaden je Stufe Panzerung; DRONE_DMG: Grundschaden einer Drohne; MEGA_MUL: Schadensfaktor des Weltenbrechers   // PULSE_PCT: Anteil des Gegnerlebens je Stufe Schockwelle
// Impuls: löst am Zeiger automatisch aus. Start alle 2 s, „Taktgeber“ verkürzt um 8 % je Stufe bis 0,1 s.
// Schaden je Impuls = Grundschaden × IMP_MUL × √(Intervall/2): schnellere Impulse treffen schwächer, der Schaden pro Sekunde steigt trotzdem.

// Impuls: löst am Zeiger automatisch aus. Start alle 2 s, „Taktgeber“ verkürzt um 8 % je Stufe bis 0,1 s.
// Schaden je Impuls = Grundschaden × IMP_MUL × √(Intervall/2): schnellere Impulse treffen schwächer, der Schaden pro Sekunde steigt trotzdem.
export const IMP_BASE = 2,
  IMP_MIN = 0.1,
  IMP_STEP = 0.92,
  IMP_LV = 36,
  IMP_MUL = 4,
  BEAT_N = 5;

export const impInterval = l => Math.max(IMP_MIN, IMP_BASE * Math.pow(IMP_STEP, l));

export const HERO_SELF = 0.35; // Kampfrausch: Exponent auf Stufe 5
export const HERO_SAGA = 0.3; // Heldensaga: zusätzlicher Exponent auf Stufe 5

export const F5_MAX = 5; // Heldenimpuls: früher ein Knoten mit einer Stufe (Sprung), seit 0.27.0 fünf Stufen

export const HUNT_MUL = 3,
  HUNT_SHOT = 12,
  ENGI_AMP = 1.3,
  ENGI_DUR = 6,
  ENGI_ENERGY = 1.25; // Kopfjäger und Ingenieurin

export const BOOM_T = 0.35; // Sekunden vom Fall der Basis bis zur Explosion

export const CELL = 40,
  AIM_STICK = 60,
  AUTO_R = 30; // AUTO_R: Trefferradius eines Autofeuer-Schusses   // AIM_STICK: so viel näher an der Basis muss ein anderer Gegner sein, damit ein Held das Ziel wechselt
