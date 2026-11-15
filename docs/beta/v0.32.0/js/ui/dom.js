/* Schattenbaum für die gesamte Oberfläche (alles außer dem Spielfeld).
   Hintergrund (15.11.2026, beim Nutzer in Safari gemessen und mit Perf.aus('frz') bestätigt): Ein fremdes Skript im Browser beobachtet die Seite und arbeitet nach jeder Änderung
   am Dokument einmal pro Sekunde 50 bis 150 ms lang – das waren die Ruckler im Sekundentakt, im Run durch die laufende Anzeige, in den Menüs durch jeden Kauf.
   Änderungen innerhalb eines Schattenbaums sieht ein solcher Beobachter nicht. Deshalb ziehen beim Start alle Bildschirme in einen Schattenbaum um; die Stilregeln der Seite
   werden übernommen (Regeln, die am <html>-Element hängen, stehen in den CSS-Dateien zusätzlich für den Träger: :host(…)). $ und $$ suchen in beiden Bäumen. */
export const UI = (() => {
  const app = document.querySelector('#app'),
    host = document.createElement('div');
  host.id = 'ui';
  const root = host.attachShadow({
    mode: 'open',
  });
  // Die Stilregeln der Seite gelten im Schattenbaum nicht von selbst. Sie werden als eigene Stilblätter übernommen (ohne das Schriften-Blatt:
  // Schriften gelten seitenweit, und seine Dateipfade wären hier falsch). Ältere Browser ohne diese Möglichkeit bekommen Kopien der <link>-Elemente.
  const sheets = [...document.styleSheets].filter(sh => sh.ownerNode && sh.ownerNode.dataset.ui !== 'no');
  try {
    root.adoptedStyleSheets = sheets.map(sh => {
      const c = new CSSStyleSheet();
      c.replaceSync([...sh.cssRules].map(r => r.cssText).join('\n'));
      return c;
    });
  } catch (e) {
    for (const sh of sheets) root.appendChild(sh.ownerNode.cloneNode(true));
  }
  const kids = [...app.children].filter(e => e.id !== 'cv');
  app.appendChild(host);
  for (const e of kids) root.appendChild(e);
  return root;
})();

export const $ = s => document.querySelector(s) || UI.querySelector(s),
  $$ = s => [...document.querySelectorAll(s), ...UI.querySelectorAll(s)];
