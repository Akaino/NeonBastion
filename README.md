# Neon Bastion

Neon-Incremental-Tower-Defense im Browser. Läuft auf Desktop, iOS und Android.

**Spielen:** https://neonbastion.de · Vorschau: https://neonbastion.de/beta/

## Aufbau

- `src/index.html` – Gerüst, `src/css/` – Stilregeln, `src/js/` – das Spiel als ES-Module (Spiellogik in `core`, `data`, `run`, `world2`; Grafik in `render`; Ton in `audio`; Oberfläche in `ui`; Entwicklermodus in `dev`)
- `build.py` – kopiert die Quellen in einen Ordner mit der Versionsnummer und schreibt `index.html`; `docs/` wird von GitHub Pages ausgeliefert
- `tests/` – Browser-Tests (Playwright)
- `sim/` – Balancing-Simulation: spielt die Spiellogik in Node
- `CLAUDE.md` – Projektwissen für Entwickler und Claude Code

## Befehle

```
npm install                  # einmalig, nur Entwicklungswerkzeuge (Prettier, ESLint)
python3 build.py             # baut dist/web/ zum Testen
python3 tests/run_all.py     # alle Browser-Tests
node sim/sim.js --hilfe      # Balancing-Simulation
npm run lint && npm run format:check
python3 -m http.server -d dist/web 8000   # lokal spielen: http://localhost:8000
```

Das Spiel selbst hat keine Abhängigkeiten.
