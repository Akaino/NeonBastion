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
python3 tests/run_all.py         # alle Browser-Tests (Playwright, Chromium), 4 gleichzeitig, ca. 30 s
python3 tests/run_all.py --jobs 1  # nacheinander (ca. 90 s), um Wackler einzugrenzen
node sim/sim.js --seeds 8        # Karriere-Simulation, Zeiger ruht (Idle-Spieler), Auswertung in sim/ergebnisse/
node sim/sim.js --seeds 8 --zeiger zielt   # Bot zieht den Impuls alle 0,25 s auf die dichteste Gruppe (Idealspieler); --zeiger aus = kein Impuls
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

## 5. Gameplay-Systeme (Stand 0.13.0)

**Welt 1 „Neon-Sektor“:** Basis in der Mitte, Gegner (Schwärmer, Brecher, Fernkämpfer, Elite, Boss alle 10 Wellen) aus allen Richtungen. Drohnen spawnen aus der Basis. Vier Helden (Klinge, Schützin, Arkanist, Wächterin) agieren selbstständig, müssen freigeschaltet werden, haben Stufen (bis 60) und Aufstiege (bis 5). Der **Impuls** ersetzt das Tippen (siehe unten), „Autofeuer“ lässt zusätzlich die Basis selbst schießen. Nächste Welle startet nach 9 s auch mit lebenden Gegnern → Runs enden, wenn die Basis den Schaden gestauter Gegner nicht mehr aushält.

- **Währungen:** Splitter (jeder Gegner), Kerne (Elite, alle 5 Wellen), Prismen (Bosse, Meilenstein alle 10 Wellen, 0,6 % Elite-Drop), Sternenstaub (erster Bosssieg ab Welle 20 je Zyklus, ab Welle 30 jeder Bosssieg), Quanten (Supernova).
- **Skilltree:** 68 Knoten, 5 Äste (Basis, Einheiten, Helden, Fokus, Ertrag), Tiefe bis 9, innen Splitter, außen Kerne/Prismen/Sternenstaub. Fünf Splitter-Leitern und „Schnellstart“ haben keine Obergrenze (`max` 999 wird als ∞ angezeigt). Nicht freigeschaltete Knoten sind verdeckt („?“). „Schnellstart“ hat unendlich Stufen, Startwelle frei wählbar (Stepper im Hub).
- **Supernova (Prestige):** ab Welle 25. Quanten = `2·1.1^(w−25)` × Boni. Setzt Baum, Währungen, Helden- und Turmstufen zurück. 9 Quanten-Upgrades (Urkraft ×1,25/Stufe usw.).
- **Gegner-Skalierung:** Leben `1.15^(w−1)·1.08^max(0,w−35)·1.06^max(0,w−60)`, Schaden `1.06^(w−1)·1.07^max(0,w−35)·1.05^max(0,w−60)`.
- **Türme (Unterstützung, kein Schaden):** Frost (verlangsamt), Zerfall (mehr Schaden genommen, weniger verursacht), Kryo (friert periodisch ein, danach 2 s Immunität). Bau mit Energie im Run, Antippen öffnet Turm-Menü (Aufwerten, Verschieben, Abbauen). Bauen pausiert das Spiel. Startstufe 1–25 im Turm-Menü.
- **Stapeln:** max. 3 Türme pro Gegner, abnehmend (100 % / 50 % / 25 %), Deckel: Verlangsamung 65 %, Schadensreduktion 50 %, Schadensbonus +80 %.
- **Kombinationen** in Überschneidungen: Sturmfront, Vergiftung, Schwachstelle, Permafrost, Zersplittern, Nullpunkt (Welt 1) plus 9 Schaden×Unterstützung-Kombis (Welt 2).

**Welt 2 „Gitterfestung“** (Freischaltung Welle 100 in Welt 1, Test-Freischaltung nur im Entwicklermodus): nur Türme, offene Arena. Vor jeder Welle Umbauphase mit Timer und „Bereit“-Knopf, Richtungsanzeige (Pfeile + Vorschau), Verschieben nur in der Umbauphase und nur mit Umbaupunkten. Schadenstürme Laser/Raketen/Tesla. Eigene Währungen (Schaltkreise, Matrixchips), eigener Skilltree (25 Knoten), Sturmregel nach 20 s ohne Nachschub. Weltenbonus: W2-Rekord ×(1+0,02/Welle) Schaden in W1, W1-Rekord ×(1+0,01/Welle) Turmschaden in W2.

**Impuls** (seit 0.13.0, ersetzt Klicken/Tippen): Am Zeiger löst in festen Abständen automatisch ein Flächenangriff aus (`run.cx/cy`, `impT`, in `Run.step`). Ein Ring um die Angriffsfläche füllt sich bis zum nächsten Impuls (`render.js`); seine Farbe kündigt Sondertreffer an (Magenta Taktschlag, Orange Überladung, Gold Weltenbrecher). Maus bewegt den Zeiger, der Finger zieht ihn mit und lässt ihn beim Loslassen liegen (`aimAt` in `ui.js`); Klicks machen keinen Schaden mehr. Start alle 2 s, Knoten „Taktgeber“ (`f1b`, 36 Stufen, −8 % je Stufe) bis 0,1 s. Schaden je Impuls = Grundschaden × 4 × √(Intervall/2): schneller heißt schwächer je Treffer, der Schaden pro Sekunde steigt über alle Stufen etwa auf das 4,5-Fache (Konstanten `IMP_*` in `core.js`). **Sonderfähigkeiten zählen Impulse bzw. Schüsse, nicht Treffer** (Vorgabe des Nutzers: wer nichts trifft, wartet wieder n ab): „Taktschlag“ (`f3a`, früher „Combo“) verstärkt jeden 5. Impuls, „Überladung“ und „Weltenbrecher“ zählen Impuls und Autofeuer gemeinsam. In der Simulation steuert `--zeiger ruht|zielt|aus` den Zeiger (`aimPointer` in `sim/bot2.js`).

**Entwicklermodus** (seit 0.11.2): In den Einstellungen 7× kurz hintereinander auf die Versionsnummer tippen, dann Code eingeben (kennt der Nutzer; im Quelltext steht nur ein Prüfwert, der Code gehört weder in dieses Dokument noch in Tests – das Repository ist öffentlich). Gespeichert als `save.dev`. Zeigt die Knöpfe „Gitterfestung testweise freischalten“ und „Entwicklermodus beenden“. Weitere Testhilfen hier andocken (`updW2Btn` in `ui.js`). Tests setzen `save.dev` direkt im Spielstand.

**Audio:** Effekte sind Analog-Synth-Stimmen (verstimmte Oszillatoren, Verzerrung, Bitcrusher, Sub-Kicks). Musik: generativer Synthwave-Komponist mit Abschnitten (Groove, Melodie, Breakdown, Drop), 8 Akkordfolgen, regelbasierter Melodie (Akkordtöne auf betonten Zählzeiten). Tempo 112→172 BPM **nur abhängig von der Welle**. Welt 2 eine Quarte höher.

## 6. Balancing-Stand (Simulation 0.12.0, 8 Seeds, ohne Tippen)

| Meilenstein | Runs | Supernovas | Spielzeit 1× | Mensch 8× |
|---|---|---|---|---|
| Welle 25 | 17 | 0 | 42 min | 11 min |
| Welle 50 | 33 | 0 | 2 h 15 min | 28 min |
| Welle 75 | 69 | 1 | 6 h 34 min | 1 h 12 min |
| Welle 100 | 102 | 2 | 11 h 48 min | 2 h 3 min |

Zum Vergleich 0.11.2 (gleicher Rechner, gleiche Seeds): Welle 100 nach 192 Runs, 8 Supernovas, 15 h 49 min. Rohdaten liegen lokal in `sim/ergebnisse/` (nicht im Repository).

Änderungen in 0.12.0 und ihre Wirkung:
- **Splitter-Leitern ohne Obergrenze** (Panzerung, Drohnenwaffen, Ausbildung, Fingerspitze, Sammler): bis Stufe 50 wie zuvor, darüber zusätzlich ×1,12 je Stufe (`LADDER` in `core.js`). Allein dadurch sinkt der Schnellstart-Anteil an den Ausgaben von 31 % auf 13 %; die fünf Leitern und Schnellstart liegen jetzt alle bei 13–16 %.
- **Schnellstart** kostet ×1,40 statt ×1,30 je Stufe (`QUICK_G`). Wirkung in der Simulation: weniger Supernovas bis Welle 100 (2 statt 6), Seeds streuen viel weniger (11,3–12,6 h statt 10,4–22,5 h), weniger große Rekordsprünge (größter Sprung 7 statt 14 Wellen). Preis: Runs dauern spät etwa doppelt so lang (Median 9,9 statt 4,8 min bei 1×), weil früher gestartet wird.
- **Helden behalten ihr Ziel** (`aim()` in `game.js`, `AIM_STICK=60`): Wechsel nur, wenn das Ziel tot/außer Reichweite ist oder ein anderer Gegner um mehr als 60 Einheiten bedrohlicher ist (Fernkämpfer in Schussposition zählen −150, das Patt aus Abschnitt 8 bleibt gelöst). Zielwechsel trotz lebendem Ziel: von 14–19 auf etwa 2 pro Minute, Stärke unverändert.

Impuls in 0.13.0 (8 Seeds, gleiche Regeln, nur der Zeiger unterscheidet sich):

| Meilenstein | Zeiger ruht | Zeiger zielt |
|---|---|---|
| Erster Run ohne Upgrades (10 Seeds) | Ø Welle 2,1, 16 Splitter | Ø Welle 4,8, 73 Splitter |
| Welle 25 | 15 Runs, 38 min | 9 Runs, 30 min |
| Welle 50 | 30 Runs, 2 h 5 min | 24 Runs, 1 h 59 min |
| Welle 75 | 66 Runs, 6 h 43 min | 55 Runs, 6 h 5 min |
| Welle 100 | 98 Runs, 11 h 47 min | 89 Runs, 11 h 24 min |

- Ein ruhender Zeiger ist wirkungslos (entspricht 0.12.0). Zielen bringt früh viel (−40 % Runs bis Welle 25) und spät fast nichts (−3 % Spielzeit bis Welle 100). **Der Impuls skaliert zu schwach mit**: voll ausgebaut etwa 10 Impulse/s mit ×0,9 Grundschaden, Autofeuer dagegen bis 30 Schüsse/s mit bis zu ×3. Das widerspricht dem Ziel „Zeiger so wichtig wie Einheiten/Türme/Helden“ und ist beim Ausbau von Welt 1 zu lösen.
- Wand bei Welle 70–72: In beiden Läufen zünden fast alle Seeds dort ihre erste Supernova; danach Rekordsprünge von 5–9 Wellen pro Run. Nicht durch den Zeiger verursacht.

Befunde:
- Einzelne Seeds streuen weiterhin (Zufall schaukelt sich auf). Immer mehrere Seeds verwenden.
- Der Bot kauft stets die billigste Option. Der Ausgaben-Anteil sagt deshalb mehr über die Kostenkurven als über die Wirkung; für die Wirkung `node sim/sim.js upgrades` nutzen.
- Ob es nach Welle 100 abflacht, ist offen (Lauf mit `--ziel 150` steht aus).

## 7. Offene Punkte (priorisiert)

Reihenfolge laut Nutzer (Stand 14.11.2026): erst Welt 1 rund machen, Welt 2 ruht bis dahin.

1. Simulation mit `--ziel 150` und Upgrade-Messung bei 25/50/75 auswerten (der Nutzer lässt sie selbst laufen).
2. **Welt 1 ausbauen** (Inhalte erst mit dem Nutzer besprechen):
   - Deutlich umfangreicherer Skilltree; bestehende Skills dürfen aufgeteilt werden, wo es sinnvoll ist (Kandidat: „Göttlicher Finger“ bringt bei Welle 25 allein +6 Wellen – ein Sprung).
   - Weitere Helden, weitere Türme.
   - **Balancing-Ziel: Der Zeiger (Impuls) soll nicht weniger wichtig sein als Einheiten, Türme und Helden** – und umgekehrt. Stand Upgrade-Messung 0.12.0: Der Fokus-Ast dominiert über das Autofeuer, Basis-Verteidigung (Panzerung, Schild, Reparatur, Geschütze) bringt bei Welle 25 +0,0 Wellen. Eher die anderen Äste aufwerten als den Fokus schwächen.
   - Turm-Menü (erledigt in 0.13.0): öffnet sich nur noch bei kurzem Antippen ohne Bewegung (`towerTap`, `TAP_MOVE`, `TAP_MS` in `ui.js`); aufsetzen und ziehen bewegt den Impuls-Zeiger. Beim Nutzer nachfragen, ob das versehentliche Öffnen damit weg ist.
3. **Welten 3–10:** sind eingeplant (`WORLD_MAX`, `worldUnlockWave(id)=(id−1)·100` in `core2.js`, Karte „Weitere Welten“ im Welten-Menü), aber ohne Inhalt. Welt 2 ist der erste Test für das Prinzip „alle 100 Wellen in Welt 1 eine neue Welt“. Ideenfindung steht aus und läuft mit dem Nutzer. **Vorgabe: Das Kernsystem bleibt in jeder Welt SEHR ähnlich – Basis beschützen, Impulse mit dem Zeiger.** Welten unterscheiden sich über Regeln und Inhalte, nicht über ein anderes Grundspiel.
4. Welt 2 (erst wenn Welt 1 dem Nutzer gefällt): eigene Supernova, Balancing per Simulation (es gibt noch keinen Welt-2-Bot in `sim/`), Turmstufen jenseits der Wand bei ~Welle 80.
5. Rechtliches: Impressum und Datenschutzerklärung liegen als eigene Seiten in `assets/impressum.html` und `assets/datenschutz.html` (seit 0.11.1, verlinkt in den Einstellungen; `build.py` macht die Links für die Website relativ, im Artefakt bleiben sie absolut). **Das Impressum enthält bewusst keine Anschrift** (Entscheidung des Nutzers, rechtlich unvollständig). Vor einem Spenden-/Coffee-Link oder anderer Monetarisierung: Anschrift ergänzen (ggf. c/o-Dienst) und Datenschutzerklärung erweitern.
6. Langfristig: Verpackung für App Stores (Capacitor) und Steam (Tauri/Electron).

Erledigt in 0.12.0: Zahlen-Notation über 10^18 (`numUnit` in `core.js`: nach Qi folgen aa, ab, … zz), Fingerspitze-Beschreibung.

## 8. Fallstricke aus der bisherigen Entwicklung

- **Klicks gehen verloren, wenn ein Knopf per `innerHTML` neu aufgebaut wird**, während er gedrückt ist. HUD-Elemente einmal aufbauen, danach nur `textContent` ändern (siehe `updBuildBtn`, `updPhase`).
- **Keine Zeitlupe** beim Bauen – fühlt sich wie Lag an. Bauen pausiert stattdessen das Spiel.
- `data-world` war am `<html>`-Element gesetzt und hat jeden Klick als „Welt betreten“ gewertet. Theme-Attribut heißt jetzt `data-wtheme`.
- Kryo + Permafrost konnte Gegner dauerhaft einfrieren → 2 s Immunität nach dem Auftauen (`frzImm`).
- Sturmfront-Rückstoß konnte Gegner endlos pendeln lassen → seltener/schwächer, während Sturmangriff aus.
- Der Nutzer hat oft aus Versehen das Turm-Menü geöffnet. Aktionen auf dem Spielfeld deshalb erst beim Loslassen auslösen und nur, wenn der Finger sich nicht bewegt hat.
- Fernkämpfer außer Reichweite + Reparatur → Patt. Helden/Drohnen priorisieren Fernkämpfer (`threat()`), Welt 2 hat die Sturmregel.
- Musik klang „schief“: Delay-Zeit darf nicht mit dem Tempo moduliert werden (Tonhöhen-Leier). Melodie nur aus Akkordtönen auf betonten Zählzeiten, keine absichtlichen Dissonanzen. Der Nutzer reagiert empfindlich auf unsaubere Musik.
- Bitcrusher schneidet leise Signale auf null → Signal vor dem Crusher verstärken (ist umgesetzt).
- Effekte, die der Nutzer „lasch“ fand: zu viel Hall, Filter-Resonanz („ping“). Knackige, verzerrte, wiedererkennbare Sounds bevorzugt.
- Performance: kein `shadowBlur` pro Objekt und Frame, stattdessen gecachte Glow-Sprites. Kein `Math.hypot` in heißen Schleifen (`hyp()` nutzen).
- Schriften lokal (`assets/fonts`), nicht von Google laden (Datenschutz in Deutschland).

## 9. Designvorgaben des Nutzers

- Neon-Stil, „ordentlich“, keine matschigen einfachen Formen. Top-down, Basis in der Mitte.
- Inkrementeller Fortschritt ist das Wichtigste: stetig, keine Sprünge um 15 Wellen durch 1–2 Upgrades, Spiel praktisch endlos.
- Idle muss funktionieren; aktives Zielen mit dem Impuls ist ein Bonus, keine Pflicht. Kein Klicken oder Tippen für Schaden.
- **Jedes Upgrade zeigt eine Vorher-Nachher-Vorschau** (Skilltree, Helden, Türme, Supernova).
- Seltenere Währung für höhere Upgrades; seltenere Währungen nie vor häufigeren.
- Türme: Einzel-Upgrade per Antippen im Run bleibt so, wie es ist.
- Welt 2: keine festen Wege, Richtungsanzeige, Umbauphase, begrenztes Verschieben.
- Musik soll mit der Welle zackiger werden und „fast Stress verursachen“, aber sauber klingen.
