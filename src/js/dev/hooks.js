import { Dev } from '../core/dev-hooks.js';
import { devTaps, setDevTaps } from './mode.js';
import { updW2Btn } from './tools.js';
import { $ } from '../ui/dom.js';

/* ---------- Haken ins Spiel ---------- */
Dev.stats = (save, S) => {
  if (save.dev && save.devStart) {
    S.startMax = Math.max(S.startMax, save.devStart);
    S.startWave = save.devStart;
  }
}; // Testhilfe: Startwelle frei wählbar

// Testhilfe: Startwelle frei wählbar
Dev.wave = run =>
  run.save && run.save.dev
    ? {
        shiny: !!run.save.devShiny,
        drop: !!run.save.devDrop,
      }
    : null; // ein schillernder Gegner bzw. ein Abwurf je Welle

// ein schillernder Gegner bzw. ein Abwurf je Welle
Dev.w2 = save => !!save.w2test; // Test-Freischaltung der Gitterfestung

// Test-Freischaltung der Gitterfestung
Dev.openSettings = () => {
  setDevTaps(0);
  $('#devCode').hidden = true;
  updW2Btn();
};

/* Leistungsmessung (Testhilfe): hält jedes Bild fest, das länger als HITCH_MS dauert, und was in dieser Lücke gerechnet wurde.
   Die Lücke zwischen zwei Bildern enthält die Arbeit des vorigen Bildes, deshalb wird dessen Aufteilung notiert. „Rest“ ist Zeit außerhalb des Spiels (Browser, System). */
