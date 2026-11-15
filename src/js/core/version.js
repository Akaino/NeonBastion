export const VERSION = '0.34.0';

// Vorschau-Stufen, erkannt am Pfad: /beta/ (zum Testen freigegeben) und /bottest/ (Arbeitsstand, kann unfertig sein).
// Jede Stufe hat einen eigenen Spielstand, damit Tests den echten Fortschritt nie berühren. In Node (Simulation) gibt es kein location.
export const STAGE =
  typeof location === 'undefined'
    ? ''
    : /\/bottest\//.test(location.pathname)
      ? 'Bottest'
      : /\/beta\//.test(location.pathname)
        ? 'Beta'
        : '';

export const IS_BETA = !!STAGE,
  LIVE_KEY = 'neon-bastion-v1';
