# Neon Bastion – Projektwissen für Claude Code

Neon-Incremental-Tower-Defense im Browser (Desktop, iOS, Android). Live unter https://neonbastion.de (GitHub Pages aus `docs/`).
Dieses Dokument ist die Übergabe aus der bisherigen Entwicklung in einem claude.ai-Chat. Lies es vollständig, bevor du etwas änderst.

## 1. Zusammenarbeit mit dem Nutzer

- **Sprache:** Deutsch, du-Form. Alle Texte im Spiel auf Deutsch, mit deutschen Anführungszeichen „…“ und typografischem Apostroph ’.
- Der Nutzer testet auf **iPhone und MacBook**. Mobile first, Hochformat, Touch und Maus gleichwertig.
- Er will **Belege statt Behauptungen**: Balancing-Änderungen mit der Simulation (`sim/`) begründen und vorher/nachher zeigen.
- Er gibt Feedback in kurzen Sätzen. Bei Unklarheit lieber einmal kurz nachfragen als in die falsche Richtung bauen.
- **Jede Änderung vor dem Ausliefern testen** (`python3 tests/run_all.py`), Versionsnummer erhöhen, dann deployen.
- Ehrlich bleiben: Wenn etwas nicht geprüft wurde oder nicht geht, sag es.

## 2. Befehle

```
python3 build.py                 # baut docs/index.html (Website) aus src/
python3 build.py --artifact      # zusätzlich dist/neon-bastion-artifact.html (Google Fonts statt lokaler Schrift)
python3 tests/run_all.py         # alle Browser-Tests (Playwright, Chromium)
node sim/sim.js --seeds 8        # Karriere-Simulation ohne Tippen, Auswertung in sim/ergebnisse/
node sim/sim.js upgrades --at 25,50,75   # Wirkung einzelner Upgrades an Kontrollpunkten
```

Voraussetzungen: Python 3, Node.js ab 18, `pip install playwright && playwright install chromium`.
Testen im Browser: `docs/index.html` direkt öffnen oder `python3 -m http.server -d docs 8000`.

## 3. Release

1. `VERSION` in `src/core.js` erhöhen (Schema 0.MINOR.PATCH; Features → MINOR, reine Fixes → PATCH).
2. `python3 build.py && python3 tests/run_all.py`
3. Commit „Release vX.Y.Z“, Tag `vX.Y.Z`, Push auf `main`. GitHub Pages veröffentlicht `docs/` automatisch.
4. Prüfen, dass `https://neonbastion.de` die neue `const VERSION='X.Y.Z'` ausliefert (Pages cached einige Minuten).

`docs/` ist Build-Ausgabe. Nie direkt bearbeiten, immer `src/` ändern und neu bauen.

## 4. Architektur

Eine einzige HTML-Datei, kein Framework, keine Abhängigkeiten. `build.py` setzt `src/shell.html` (HTML + CSS) und die JS-Dateien in dieser Reihenfolge zusammen (alles im globalen Scope):

| Datei | Inhalt |
|---|---|
| `core.js` | `VERSION`, Hilfsfunktionen (`fmtN`, `fmtD`), Währungen Welt 1, Skilltree Welt 1 (`NODE_DEFS` → `NODES`), Helden, Türme (`TOWERS`), Kombinationen (`COMBOS`), Supernova (`PRESTIGE_DEFS`), Spielstand (`freshSave`, `loadSave`, `Store`), `stats(save)` |
| `core2.js` | Welt 2 „Gitterfestung“: Währungen, Schadenstürme, weitere Kombinationen, Skilltree (`NODES2`), `stats2(save)`, Weltenboni |
| `game.js` | `class Run` – komplette Simulation eines Runs in Welt 1 (Wellen, Gegner, Helden, Drohnen, Basis, Türme, Tippen, Belohnungen). Reine Logik, kein DOM. |
| `game2.js` | `class Run2 extends Run` – Welt 2: Umbau-/Kampfphase, Richtungswellen, Umbaupunkte, Laser/Raketen/Tesla |
| `render.js` | `class Renderer` – Canvas-Grafik, Sprite-Cache mit Glow, Zoom, Weltthemen |
| `audio.js` | Web-Audio: Mischpult, Synth-Effekte (`SFX`), generativer Synthwave-Komponist (`Music`), Lautstärke |
| `ui.js` | Bildschirme (Hub, HUD, Skilltree, Helden, Türme, Supernova, Welten, Einstellungen), Eingabe, Hauptschleife |

Wichtige Konzepte:

- **Welt-Kontext `W`** in `ui.js` (`WORLDS[1|2]`): liefert Knoten, Währungen, Spielstand-Teil (`W.s()`), Stats, Türme und Run-Klasse der aktiven Welt. Neue Welten hier andocken.
- **Spielstand:** `localStorage['neon-bastion-v1']`. Welt 2 liegt in `save.w2`. `loadSave` füllt fehlende Felder aus `freshSave` auf. **Spielstände dürfen nie kaputtgehen**: neue Felder immer mit Standardwert, Migrationen in `loadSave`.
- **Run-Logik ist DOM-frei** und läuft unverändert in Node (`sim/bot2.js` lädt `src/` per `vm`). Das muss so bleiben. `run.headless=true` überspringt Effekte (Partikel, Zahlen, Ringe) für die Simulation.
- Feste Logik-Taktrate 1/60 s im Spiel, Geschwindigkeit 1×/2×/4×/8× über mehrere Schritte pro Frame. In der Simulation `dt=0.05`. **Nicht 0.1** – dann treffen Projektile nicht mehr zuverlässig.
- Erweiterungspunkte in `Run`, die `Run2` überschreibt: `reward(e)`, `energyMul(e)`, `towerStats(type,l)`, `towerSlots()`, `hpScale(w)`, `dmgScale(w)`, `milestone(w)`, `updWaves(dt)`, `updTowers(dt)`.

## 5. Gameplay-Systeme (Stand 0.11.0)

**Welt 1 „Neon-Sektor“:** Basis in der Mitte, Gegner (Schwärmer, Brecher, Fernkämpfer, Elite, Boss alle 10 Wellen) aus allen Richtungen. Drohnen spawnen aus der Basis. Vier Helden (Klinge, Schützin, Arkanist, Wächterin) agieren selbstständig, müssen freigeschaltet werden, haben Stufen (bis 60) und Aufstiege (bis 5). Tippen macht Schaden, „Autofeuer“ tippt automatisch. Nächste Welle startet nach 9 s auch mit lebenden Gegnern → Runs enden, wenn die Basis den Schaden gestauter Gegner nicht mehr aushält.

- **Währungen:** Splitter (jeder Gegner), Kerne (Elite, alle 5 Wellen), Prismen (Bosse, Meilenstein alle 10 Wellen, 0,6 % Elite-Drop), Sternenstaub (erster Bosssieg ab Welle 20 je Zyklus, ab Welle 30 jeder Bosssieg), Quanten (Supernova).
- **Skilltree:** 68 Knoten, 5 Äste (Basis, Einheiten, Helden, Fokus, Ertrag), Tiefe bis 9, innen Splitter, außen Kerne/Prismen/Sternenstaub. Nicht freigeschaltete Knoten sind verdeckt („?“). „Schnellstart“ hat unendlich Stufen, Startwelle frei wählbar (Stepper im Hub).
- **Supernova (Prestige):** ab Welle 25. Quanten = `2·1.1^(w−25)` × Boni. Setzt Baum, Währungen, Helden- und Turmstufen zurück. 9 Quanten-Upgrades (Urkraft ×1,25/Stufe usw.).
- **Gegner-Skalierung:** Leben `1.15^(w−1)·1.08^max(0,w−35)·1.06^max(0,w−60)`, Schaden `1.06^(w−1)·1.07^max(0,w−35)·1.05^max(0,w−60)`.
- **Türme (Unterstützung, kein Schaden):** Frost (verlangsamt), Zerfall (mehr Schaden genommen, weniger verursacht), Kryo (friert periodisch ein, danach 2 s Immunität). Bau mit Energie im Run, Antippen öffnet Turm-Menü (Aufwerten, Verschieben, Abbauen). Bauen pausiert das Spiel. Startstufe 1–25 im Turm-Menü.
- **Stapeln:** max. 3 Türme pro Gegner, abnehmend (100 % / 50 % / 25 %), Deckel: Verlangsamung 65 %, Schadensreduktion 50 %, Schadensbonus +80 %.
- **Kombinationen** in Überschneidungen: Sturmfront, Vergiftung, Schwachstelle, Permafrost, Zersplittern, Nullpunkt (Welt 1) plus 9 Schaden×Unterstützung-Kombis (Welt 2).

**Welt 2 „Gitterfestung“** (Freischaltung Welle 100 in Welt 1, Test-Freischaltung in den Einstellungen): nur Türme, offene Arena. Vor jeder Welle Umbauphase mit Timer und „Bereit“-Knopf, Richtungsanzeige (Pfeile + Vorschau), Verschieben nur in der Umbauphase und nur mit Umbaupunkten. Schadenstürme Laser/Raketen/Tesla. Eigene Währungen (Schaltkreise, Matrixchips), eigener Skilltree (25 Knoten), Sturmregel nach 20 s ohne Nachschub. Weltenbonus: W2-Rekord ×(1+0,02/Welle) Schaden in W1, W1-Rekord ×(1+0,01/Welle) Turmschaden in W2.

**Audio:** Effekte sind Analog-Synth-Stimmen (verstimmte Oszillatoren, Verzerrung, Bitcrusher, Sub-Kicks). Musik: generativer Synthwave-Komponist mit Abschnitten (Groove, Melodie, Breakdown, Drop), 8 Akkordfolgen, regelbasierter Melodie (Akkordtöne auf betonten Zählzeiten). Tempo 112→172 BPM **nur abhängig von der Welle**. Welt 2 eine Quarte höher.

## 6. Balancing-Stand (Simulation 0.11.0, 8 Seeds, ohne Tippen)

| Meilenstein | Runs | Supernovas | Spielzeit 1× | Mensch 8× |
|---|---|---|---|---|
| Welle 25 | 17 | 0 | 39 min | 11 min |
| Welle 50 | 40 | 0 | 2 h 21 min | 31 min |
| Welle 75 | 105 | 2 | 7 h 27 min | 1 h 31 min |
| Welle 100 | 160 | 6 | 13 h 1 min | 2 h 31 min |

Befunde:
- **Splitter verlieren im späten Zyklus ihren Sinn.** 35 % aller Ausgaben gehen in Schnellstart, weil alle anderen Splitter-Knoten pro Zyklus schnell maximiert sind. Helden- und Turmstufen ebenfalls. Fortschritt kommt dann nur noch über die Supernova.
- Jede Supernova bringt zwischen Welle 75 und 100 nur ~6 Wellen. Ob es danach abflacht, ist offen (Lauf mit `--ziel 150` steht aus).
- „Fingerspitze“ wirkt auch auf Autofeuer, die Beschreibung sagt nur „Tippschaden“.
- Einzelne Seeds streuen stark (Zufall schaukelt sich auf). Immer mehrere Seeds verwenden.

## 7. Offene Punkte (priorisiert)

1. **Große Splitter-Leitern ohne Obergrenze** (Panzerung, Drohnenwaffen, Ausbildung, Fingerspitze, Sammler): ab Stufe 50 steilere Kosten, Wirkung gleich. Ziel: Splitter bleiben sinnvoll.
2. **Schnellstart steiler verteuern**, damit es nicht alle Splitter schluckt.
3. **Fingerspitze-Beschreibung**: „Tippschaden und Autofeuer“.
4. Simulation mit `--ziel 150` und Upgrade-Messung bei 25/50/75 laufen lassen und auswerten.
5. Welt 2: eigene Supernova, Balancing per Simulation (es gibt noch keinen Welt-2-Bot in `sim/`), Turmstufen jenseits der Wand bei ~Welle 80.
6. Zahlen-Notation über 10^18 (aa, ab, …) für endloses Spiel.
7. Rechtliches für die Website prüfen: Impressum, Datenschutzerklärung (Hinweis: GitHub verarbeitet IP-Adressen).
8. Langfristig: weitere Welten, Verpackung für App Stores (Capacitor) und Steam (Tauri/Electron).

## 8. Fallstricke aus der bisherigen Entwicklung

- **Klicks gehen verloren, wenn ein Knopf per `innerHTML` neu aufgebaut wird**, während er gedrückt ist. HUD-Elemente einmal aufbauen, danach nur `textContent` ändern (siehe `updBuildBtn`, `updPhase`).
- **Keine Zeitlupe** beim Bauen – fühlt sich wie Lag an. Bauen pausiert stattdessen das Spiel.
- `data-world` war am `<html>`-Element gesetzt und hat jeden Klick als „Welt betreten“ gewertet. Theme-Attribut heißt jetzt `data-wtheme`.
- Kryo + Permafrost konnte Gegner dauerhaft einfrieren → 2 s Immunität nach dem Auftauen (`frzImm`).
- Sturmfront-Rückstoß konnte Gegner endlos pendeln lassen → seltener/schwächer, während Sturmangriff aus.
- Fernkämpfer außer Reichweite + Reparatur → Patt. Helden/Drohnen priorisieren Fernkämpfer (`threat()`), Welt 2 hat die Sturmregel.
- Musik klang „schief“: Delay-Zeit darf nicht mit dem Tempo moduliert werden (Tonhöhen-Leier). Melodie nur aus Akkordtönen auf betonten Zählzeiten, keine absichtlichen Dissonanzen. Der Nutzer reagiert empfindlich auf unsaubere Musik.
- Bitcrusher schneidet leise Signale auf null → Signal vor dem Crusher verstärken (ist umgesetzt).
- Effekte, die der Nutzer „lasch“ fand: zu viel Hall, Filter-Resonanz („ping“). Knackige, verzerrte, wiedererkennbare Sounds bevorzugt.
- Performance: kein `shadowBlur` pro Objekt und Frame, stattdessen gecachte Glow-Sprites. Kein `Math.hypot` in heißen Schleifen (`hyp()` nutzen).
- Schriften lokal (`assets/fonts`), nicht von Google laden (Datenschutz in Deutschland).

## 9. Designvorgaben des Nutzers

- Neon-Stil, „ordentlich“, keine matschigen einfachen Formen. Top-down, Basis in der Mitte.
- Inkrementeller Fortschritt ist das Wichtigste: stetig, keine Sprünge um 15 Wellen durch 1–2 Upgrades, Spiel praktisch endlos.
- Idle muss funktionieren; Tippen ist ein Bonus, keine Pflicht.
- **Jedes Upgrade zeigt eine Vorher-Nachher-Vorschau** (Skilltree, Helden, Türme, Supernova).
- Seltenere Währung für höhere Upgrades; seltenere Währungen nie vor häufigeren.
- Türme: Einzel-Upgrade per Antippen im Run bleibt so, wie es ist.
- Welt 2: keine festen Wege, Richtungsanzeige, Umbauphase, begrenztes Verschieben.
- Musik soll mit der Welle zackiger werden und „fast Stress verursachen“, aber sauber klingen.
