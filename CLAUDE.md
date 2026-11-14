# Neon Bastion – Projektwissen für Claude Code

Neon-Incremental-Tower-Defense im Browser (Desktop, iOS, Android). Live unter https://neonbastion.de, Vorschau unter https://neonbastion.de/beta/, Arbeitsstand unter https://neonbastion.de/bottest/ (GitHub Pages aus `docs/`, Repository `Akaino/NeonBastion`).
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
python3 build.py                 # baut die Testausgabe dist/web/ (komplette Website inkl. beta/), veröffentlicht nichts
python3 build.py --bottest       # zusätzlich docs/bottest/ → Arbeitsstand unter neonbastion.de/bottest/, darf unfertig sein
python3 build.py --beta          # zusätzlich docs/beta/  → Vorschau unter neonbastion.de/beta/, das echte Spiel bleibt unverändert
python3 build.py --release       # zusätzlich docs/       → komplette Website (Spiel, Rechtsseiten, beta/)
python3 tests/run_all.py         # alle Browser-Tests (Playwright, Chromium), 4 gleichzeitig, ca. 30 s
python3 tests/run_all.py --jobs 1  # nacheinander (ca. 90 s), um Wackler einzugrenzen
node sim/sim.js --seeds 8        # Karriere-Simulation, Zeiger ruht (Idle-Spieler), Auswertung in sim/ergebnisse/
node sim/sim.js --seeds 8 --zeiger zielt   # Bot zieht den Impuls alle 0,25 s auf die dichteste Gruppe (Idealspieler); --zeiger aus = kein Impuls
node sim/sim.js upgrades --at 25,50,75   # Wirkung einzelner Upgrades an Kontrollpunkten
node sim/sim.js aeste --seeds 3 --stunden 4 --zeiger zielt   # Ast-Vergleich: Karriere mit jeder Kombination der fünf Skilltree-Äste
node sim/sim.js probe --at 25,45,70 --runs 10              # Probe am festen Spielstand: Sekunden statt Minuten; --gegen <src-Ordner> vergleicht zwei Fassungen
```

Voraussetzungen: Python 3, Node.js ab 18, `pip install playwright && playwright install chromium`.
Testen im Browser: `dist/web/index.html` direkt öffnen oder `python3 -m http.server -d dist/web 8000`. Die Tests laufen gegen `dist/web/`.

## 3. Beta und Release

Der Nutzer testet auf iPhone und MacBook im Browser. **Jede Änderung am Spiel geht zuerst in die Beta und erst auf sein „Release“ auf die Hauptadresse.** Artefakte werden nicht mehr verwendet (er kann sie am Handy nicht öffnen).

**Nichts bleibt nur lokal.** Der Nutzer will jeden Stand im Browser ansehen können (Vorgabe vom 14.11.2026: „Lokal gebaut und nicht in der Beta sollte es zukünftig nicht mehr geben“). Ist eine Änderung noch nicht reif für die Beta – etwa mitten in einem mehrstufigen Balancing mit Messläufen –, geht sie nach `/bottest/`: `python3 build.py --bottest`, Tests, Commit „Bottest vX.Y.Z: …“, Push. Im Bericht immer sagen, was unter `/bottest/` liegt und was daran noch fehlt. Sobald sie reif ist, in die Beta.

Beta (nach „Umsetzen“):
1. `VERSION` in `src/core.js` erhöhen (Schema 0.MINOR.PATCH; Features → MINOR, reine Fixes → PATCH).
2. `python3 build.py --beta && python3 tests/run_all.py`
3. Commit „Beta vX.Y.Z: …“ (Quelltext, Tests, `docs/beta/`), Push auf `main`. **Kein Tag, `docs/index.html` nicht anfassen.**
4. Prüfen, dass `https://neonbastion.de/beta/` die neue Version ausliefert, dem Nutzer Bescheid geben.

Release (wenn der Nutzer „Release“ oder „deploy“ sagt):
1. `python3 build.py --release && python3 tests/run_all.py`
2. Commit „Release vX.Y.Z“, Tag `vX.Y.Z`, Push auf `main`.
3. Prüfen, dass `https://neonbastion.de` die neue `const VERSION='X.Y.Z'` ausliefert (Pages cached einige Minuten).

`docs/` und `dist/` sind Build-Ausgaben. Nie direkt bearbeiten, immer `src/` oder `assets/` ändern und neu bauen. `dist/` ist nicht im Repository.

Beta und Bottest sind dieselbe Datei wie das Spiel mit angepassten Pfaden (`build.py`). Das Spiel erkennt die Stufe zur Laufzeit am Pfad `/beta/` bzw. `/bottest/` (`STAGE`, `IS_BETA` in `core.js`): Kennzeichnung „Beta“ bzw. „Bottest“ an der Version, eigener Spielstand `neon-bastion-beta` bzw. `neon-bastion-bottest`, Knopf „Live-Spielstand übernehmen“ in den Einstellungen (kopiert `neon-bastion-v1` in den Beta-Spielstand, nie umgekehrt), `noindex`. Reine Werkzeug-Änderungen (Tests, Simulation, Dokumentation) brauchen keine Beta.

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

## 5. Gameplay-Systeme (Stand 0.17.0, `/bottest/`)

**Welt 1 „Neon-Sektor“:** Basis in der Mitte, Gegner (Schwärmer, Brecher, Fernkämpfer, Elite, Boss alle 10 Wellen, **Doppelboss alle 25 Wellen**) aus allen Richtungen. Drohnen spawnen aus der Basis. Vier Helden (Klinge, Schützin, Arkanist, Wächterin) agieren selbstständig, müssen freigeschaltet werden, haben Stufen (bis 60) und Aufstiege (bis 5). Der **Impuls** ersetzt das Tippen (siehe unten), „Autofeuer“ lässt zusätzlich die Basis selbst schießen. Nächste Welle startet nach 9 s auch mit lebenden Gegnern → Runs enden, wenn die Basis den Schaden gestauter Gegner nicht mehr aushält.

- **Währungen:** Splitter (jeder Gegner), Kerne (Elite, alle 5 Wellen), Prismen (Bosse, Meilenstein alle 10 Wellen, 0,6 % Elite-Drop), Sternenstaub (erster Bosssieg ab Welle 20 je Zyklus, ab Welle 30 jeder Bosssieg), Quanten (Supernova).
- **Skilltree:** 68 Knoten, 5 Äste (Basis, Flotte, Helden, Impuls, Ertrag; bis 0.17.0 hießen Flotte „Einheiten“ und Impuls „Fokus“, ältere Abschnitte dieses Dokuments nutzen noch die alten Namen). Jeder Astname steht einmal im Baum, parallel zu einer Grenze seines Sektors (welche, legt `ls` in `BR` fest – vom Nutzer so vorgegeben: Basis rechts, Flotte unten, Helden unten, Impuls oben, Ertrag oben); der Hintergrund hat farbige Sektoren, Tiefenringe und ein Punktraster (`treeBackdrop` in `ui.js`), Tiefe bis 9, innen Splitter, außen Kerne/Prismen/Sternenstaub. Fünf Splitter-Leitern und „Schnellstart“ haben keine Obergrenze (`max` 999 wird als ∞ angezeigt). Nicht freigeschaltete Knoten sind verdeckt („?“). „Schnellstart“ hat unendlich Stufen, Startwelle frei wählbar (Stepper im Hub).
- **Supernova (Prestige):** ab Welle 25. Quanten = `2·1.1^(w−25)` × Boni. Setzt Baum, Währungen, Helden- und Turmstufen zurück. 9 Quanten-Upgrades (Urkraft ×1,25/Stufe usw.).
- **Gegner-Skalierung:** Leben `1.15^(w−1)·1.08^max(0,w−35)·1.06^max(0,w−60)`, Schaden `1.06^(w−1)·1.07^max(0,w−35)·1.05^max(0,w−60)`.
- **Türme (Unterstützung, kein Schaden):** Frost (verlangsamt), Zerfall (mehr Schaden genommen, weniger verursacht), Kryo (friert periodisch ein, danach 2 s Immunität). Bau mit Energie im Run, Antippen öffnet Turm-Menü (Aufwerten, Verschieben, Abbauen). Bauen pausiert das Spiel. Startstufe 1–25 im Turm-Menü.
- **Stapeln:** max. 3 Türme pro Gegner, abnehmend (100 % / 50 % / 25 %), Deckel: Verlangsamung 65 %, Schadensreduktion 50 %, Schadensbonus +80 %.
- **Kombinationen** in Überschneidungen: Sturmfront, Vergiftung, Schwachstelle, Permafrost, Zersplittern, Nullpunkt (Welt 1) plus 9 Schaden×Unterstützung-Kombis (Welt 2).

**Welt 2 „Gitterfestung“** (Freischaltung Welle 100 in Welt 1, Test-Freischaltung nur im Entwicklermodus): nur Türme, offene Arena. Vor jeder Welle Umbauphase mit Timer und „Bereit“-Knopf, Richtungsanzeige (Pfeile + Vorschau), Verschieben nur in der Umbauphase und nur mit Umbaupunkten. Schadenstürme Laser/Raketen/Tesla. Eigene Währungen (Schaltkreise, Matrixchips), eigener Skilltree (25 Knoten), Sturmregel nach 20 s ohne Nachschub. Weltenbonus: W2-Rekord ×(1+0,02/Welle) Schaden in W1, W1-Rekord ×(1+0,01/Welle) Turmschaden in W2.

**Gegnertypen** (Tabelle `ETYPES` in `game.js`, Mischung über `WAVE_MIX`/`waveShare`): Schwärmer, Brecher (ab Welle 3), Fernkämpfer (5), seit 0.16.0 Sprinter (15, sehr schnell), Schildträger (30, Schild schluckt die ersten 4 + Welle/30 Treffer vollständig, `e.sh`), Spalter (45, zerfällt in drei Splitterlinge mit je 15 % Leben, verzögert über `run.pend`), Belagerer (60, bleibt am Feldrand stehen und schießt 2,5-mal so stark wie ein Fernkämpfer). Die erste Fassung (Belagerer doppelt so stark und häufiger, mehr Schildladungen) hat die Karriere bis Welle 100 von 12 h 15 min auf 19 h 16 min verlängert und wurde entschärft. Jeder neue Typ wird bei seiner Einstiegswelle im Banner angekündigt. Ein neuer Typ braucht: Eintrag in `ETYPES` (mit `from`, `step`, `max`, `text`), Platz in `WAVE_MIX`, eine Form in `Renderer.enemySprite`, einen Fall in `tests/test_gegner.py`. Welt 2 nutzt eine eigene Wellenmischung und bekommt die neuen Typen noch nicht. Besiegte Gegner werden je Typ gezählt (`run.killsBy` → `save.kills`), als Grundlage für die Enzyklopädie.

**Schillernde Gegner** (seit 0.17.0): Jeder Wellen-Gegner ist mit 1 zu 5.000 schillernd (`SHINY_P`, etwa einer je zwei bis drei Runs bis Welle 50): 3,5-faches Leben (`SHINY_HP`), eigener Schimmer-Effekt, sonst keinerlei Wirkung (gleiche Beute, gleicher Schaden). Nie Bosse, Splitterlinge oder beschworene Gegner. Beim Sieg Banner „Schillernd!“ und Zählung `save.kills['shiny:<typ>']`. Vorgabe des Nutzers: bewusst selten und reine Sammelsache; **kein Erfolg „alle Schillernden“** (zu viel Glück), nur „Erstes Schillern“.

**Enzyklopädie** (seit 0.17.0, Knopf im Hub, `renderCodex` in `ui.js`): zwei Abteilungen „Gegner“ und „Bosse“. Je Eintrag Form, Name, Einstiegswelle, Beschreibung und Anzahl besiegt; nicht Besiegtes ist verdeckt („?“, kein Name). Schillernde Funde stehen als Stern am normalen Eintrag. Speist sich aus `save.kills` (je Typ, `elite`, `boss:<Art>`, `twin`, `shiny:<typ>`). Ein neuer Gegnertyp gehört in `CODEX_TYPES`.

**Erfolge** (seit 0.17.0, `ACH` in `ui.js`): jeder mit Bronze, Silber, Gold (`tiers`), berechnet aus dem Spielstand; „Erstes Schillern“ ist ein Einzel-Erfolg. Gold-Stufen sind teils bewusst sehr schwer (Welle 300, 10 Mio. Gegner, 250 Supernovas). **Erfolge geben keinen Vorteil** (Annahme, dem Nutzer mitgeteilt). Ein Erfolg ist verdeckt (kein Name, keine Beschreibung, keine Schwellen), bis seine erste Stufe erreicht ist; danach sind auch die weiteren Stufen sichtbar (Vorgabe des Nutzers). Neue Stufen werden nach dem Run gemeldet (`achCheck`); beim ersten Start mit altem Spielstand wird bereits Erreichtes still übernommen (`save.ach`).

**Boss-Arten** (seit 0.16.0, `BOSS_KINDS` in `game.js`): Titan (Erdstoß: wirft Helden und Drohnen zurück), Koloss (Panzerung: 4 s lang −80 % Schaden), Nemesis (Vernichter: schweres Geschoss auf die Basis), Vortex (Sog: zieht Verbündete heran), Hydra (Brut: acht Schwärmer), Leviathan (Flut: alle Gegner 4 s lang +50 % Tempo). Der Boss bleibt zum Aufladen stehen (`e.cast`), ein goldener Ring füllt sich und die Anzeige nennt die Fähigkeit (`bossLabel`). Eine neue Art braucht: Eintrag in `BOSS_KINDS`, einen Fall in `Run.bossAbility`, einen Fall in `tests/test_boss_faehigkeiten.py`. Besiegte Bosse werden je Art gezählt (`save.kills['boss:Titan']`). Probe an vier Spielständen: Schwierigkeit gegenüber Bossen ohne Fähigkeiten unverändert.

**Doppelboss** (seit 0.14.0, nur Welt 1): Auf jeder 25. Welle (25, 50, 75, 100, …) kommen zwei Bosse von gegenüberliegenden Seiten, jeder mit 75 % des normalen Bosslebens (`TWIN_EVERY`, `TWIN_HP` in `game.js`; der Nutzer will den Doppelboss bewusst als Hürde, danach dürfen sich die Wellen leicht anfühlen; mit 65 % war das Spiel bis Welle 100 rund 13 % schneller als ohne Doppelbosse, vor allem durch den zusätzlichen Sternenstaub auf Welle 25 und 75 – der bleibt vorerst und wird später beim Balancing betrachtet). Welle 25 und 75 sind dadurch neue Bosswellen. Beide geben Prismen, Sternenstaub gibt es höchstens einmal pro Welle (`dustW`). Der Bossbalken im HUD zählt beide zusammen („Doppelboss · A & B“).

**Impuls** (seit 0.13.0, ersetzt Klicken/Tippen): Am Zeiger löst in festen Abständen automatisch ein Flächenangriff aus (`run.cx/cy`, `impT`, in `Run.step`). Ein Ring um die Angriffsfläche füllt sich bis zum nächsten Impuls (`render.js`); seine Farbe kündigt Sondertreffer an (Magenta Taktschlag, Orange Überladung, Gold Weltenbrecher). Die Maus führt den Zeiger direkt (`aimAt` in `ui.js`). Der Finger arbeitet seit 0.13.1 wie ein Trackpad, damit er das Feld nicht verdeckt: Wischen irgendwo schiebt den Zeiger um die gewischte Strecke × 1,5 (`aimBy`, `AIM_GAIN`), kurzes Antippen setzt ihn direkt, beim Loslassen bleibt er liegen. Klicks machen keinen Schaden mehr. Start alle 2 s, Knoten „Taktgeber“ (`f1b`, 36 Stufen, −8 % je Stufe) bis 0,1 s. Schaden je Impuls = Grundschaden × 4 × √(Intervall/2): schneller heißt schwächer je Treffer, der Schaden pro Sekunde steigt über alle Stufen etwa auf das 4,5-Fache (Konstanten `IMP_*` in `core.js`). **Sonderfähigkeiten zählen Impulse bzw. Schüsse, nicht Treffer** (Vorgabe des Nutzers: wer nichts trifft, wartet wieder n ab): „Taktschlag“ (`f3a`, früher „Combo“) verstärkt jeden 5. Impuls, „Überladung“ und „Weltenbrecher“ zählen Impuls und Autofeuer gemeinsam. In der Simulation steuert `--zeiger ruht|zielt|aus` den Zeiger (`aimPointer` in `sim/bot2.js`).

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

Ast-Vergleich 0.13.0 (`node sim/sim.js aeste`, 3 Seeds, je 4 h Spielzeit, Rekord-Welle; Zeiger zielt / ruht):

| Erlaubte Äste | zielt | ruht |
|---|---|---|
| kein Ast | 7 | 4 |
| Ertrag allein | 7 | 3 |
| Basis allein | 22 | 21 |
| Einheiten allein | 26 | 25 |
| Helden allein | 30 | 30 |
| Fokus allein | 48 | 45 |
| Fokus + Ertrag | 67 | 62 |
| Helden + Fokus + Ertrag | **75** | **71** |
| alle außer Fokus | 52 | 54 |
| alle fünf | 70 | 66 |

| Ast | Ø Gewinn über alle Kombinationen (zielt / ruht) | als letzter zu den vier anderen |
|---|---|---|
| Fokus | +22,1 / +19,8 | +18 / +12 |
| Ertrag | +15,5 / +16,8 | +28 / +24 |
| Helden | +11,3 / +12,0 | +9 / +7 |
| Einheiten | +5,5 / +5,8 | −1 / −5 |
| Basis | +1,3 / +3,0 | +1 / +1 |

- **Der Fokus-Ast trägt das Spiel fast allein** (45–48 von 66–70 Wellen). Ertrag bringt allein nichts, ist aber der stärkste Verstärker. Helden liegen in der Mitte.
- **Basis und Einheiten sind nahezu wertlos**: Drei Äste (Helden + Fokus + Ertrag) kommen weiter als alle fünf. Wer Splitter in Basis und Einheiten steckt, wird langsamer. Der Bot kauft immer das Billigste und verteilt deshalb gleichmäßig; ein Mensch, der gezielt kauft, käme mit allen fünf etwas weiter, der Befund bleibt aber.
- **Schritt 1 des Angleichens (0.15.0, Stand `/bottest/`):** „Autofeuer“, „Zielsystem“ und „Sturmfeuer“ sitzen im Basis-Ast (Knoten-IDs `f2c`, `f3c`, `f7` bleiben wegen der Spielstände) und nutzen den Geschützschaden (`autoShot` in `game.js`, fester Radius `AUTO_R`). Der Fokus-Ast wirkt nur noch auf den Impuls; „Überladung“ und „Weltenbrecher“ zählen nur Impulse. Ast-Vergleich danach (3 Seeds, 4 h, Zeiger zielt, in Klammern vorher): Basis allein 26 (22), Einheiten 26 (26), Helden 31 (30), Fokus 27 (48), alle fünf 68 (70). Die Äste liegen allein jetzt beieinander. Noch offen: Basis (−2) und Einheiten (−4) kosten als letzter Ast weiterhin Wellen, und vier Äste ohne Einheiten (72) kommen weiter als alle fünf. Nächster Hebel: Basis und Einheiten im späten Spiel aufwerten (z. B. Schockwelle mit dem Basisleben wachsen lassen, Drohnen robuster machen), danach den Impuls für Idle-ferne Spieler weiter stärken.
- **Schritt 2 des Angleichens (0.16.0, Stand `/bottest/`):** Schockwelle nimmt zusätzlich 1,2 % des Gegnerlebens je Stufe (`PULSE_PCT`, Bosse ein Fünftel), weil fester Schaden und Basisleben gegen das Gegnerleben (×1,15 je Welle) nicht mitwachsen. „Nanoschmiede“ und „Admiral“ erhöhen auch das Drohnenleben. Probe: +1,2 Wellen bei Rekord 46 und 52, unverändert bei 26. Ast-Vergleich (3 Seeds, 4 h, zielt; Werte nach neuen Gegnern und Boss-Fähigkeiten, davor/danach): alle fünf 67 → 68, Basis als letzter Ast −4 → −2, Einheiten als letzter Ast −4 → −4, Fokus als letzter +17 → +16, Helden +5 → +6, Ertrag +19 → +20. Allein unverändert: Basis 27, Einheiten 26, Helden 31, Fokus 27.
- **Kaufregel `--kauf nutzen`** (Bot wählt nach geschätztem Nutzen je Kosten, Faustformel `power()` in `sim/bot2.js`): Der Bot wird damit viel stärker (vier Äste ohne Basis oder ohne Einheiten: 87–88 statt 70–72 Wellen in 4 h), aber Basis (−11) und Einheiten (−12) schneiden als letzter Ast noch schlechter ab; alle fünf 76 (Seeds 76/76/88). Deutung: Die Faustformel überschätzt Basisleben und Drohnen, so wie es ein Mensch nach Gefühl auch täte – das Geld dort bringt wenig. Der Befund „Basis und Einheiten liefern zu wenig je Kosten“ ist damit keine reine Bot-Eigenart. Die Faustformel ist kein Messwert; für Entscheidungen über einzelne Knoten die Upgrade-Messung nehmen.
- **Noch offen:** Einheiten kosten als letzter Ast weiter 4 Wellen, Basis 2; der Fokus mit zielendem Zeiger ist in der Kombination der stärkste Beitrag. Ein Teil davon ist Eigenart des Bots (er kauft das Billigste und steckt seltene Währungen in schwache Knoten). Nächste Schritte: (1) dem Bot eine Kaufregel nach Nutzen statt nach Preis geben, um Bot-Eigenart und echtes Ungleichgewicht zu trennen; (2) Einheiten grundsätzlicher aufwerten (Drohnen skalieren schlechter als Helden: kein Äquivalent zu Heldenstufen und Aufstieg); (3) Upgrade-Messung je Knoten bei Rekord 50 wiederholen und schwache Knoten gezielt anheben.
- Ziel für den Ausbau von Welt 1: Jeder Ast soll allein spielbar und in jeder Kombination ein Gewinn sein, kein Ast soll allein mehr als etwa die Hälfte tragen. Stellschrauben: Basis und Einheiten deutlich aufwerten, Autofeuer (Fokus) bremsen oder vom Impuls trennen, Impuls stärker mitwachsen lassen.

Neue Gegner und die Kante bei Welle 50 (0.16.0, `/bottest/`, 8 Seeds, Zeiger ruht):

- Bis Welle 45 sind alle Varianten gleich schnell (1,8–2,2 h). Am selben Spielstand bei Rekord 45 ändert keiner der vier neuen Typen die erreichte Welle messbar (Ø 45,4–46,1 über je 10 Runs).
- Bei Welle 47–50 steht der Bot auf der Kippe: Entweder er kommt direkt über Welle 50 (2,4–2,9 h) oder er bleibt hängen, zündet nach vier Runs ohne Rekord eine Supernova und braucht rund 4 h. Seeds mit Supernova kurz vor Welle 50: ohne neue Gegner 2 von 8, mit neuen Gegnern und Doppelboss 80 % 6 von 8, mit neuen Gegnern und Doppelboss 65 % 3 von 8. Daraus entsteht der gemessene Zeitverlust (Welle 100: 12 h 15 min ohne, 15 h 46 min mit neuen Gegnern), nicht aus den Gegnern selbst.
- Folgerung: Die Kante gehört zur Bosswelle 50 und wird durch das Doppelboss-Leben und jede zusätzliche Erschwernis verschärft. Karriere-Zeiten reagieren dort sprunghaft; kleine Änderungen nicht an der Gesamtzeit beurteilen, sondern am Anteil der Seeds, die hängen bleiben, und mit der Probe am festen Spielstand. Die Entscheidung, ob der Doppelboss eine Hürde sein soll (80 %) oder nicht, liegt beim Nutzer.
- Der Stand nach Autofeuer-Umzug und Doppelboss 80 % ist ohne neue Gegner langsamer als 0.14.0 (Welle 100: 12 h 15 min statt 10 h 12 min, Welle 25: 50 statt 38 min). Anteile nicht getrennt gemessen.

Messwerkzeuge und Rechenzeit (Stand 14.11.2026):

- **Zuerst die Probe, dann die Karriere.** `node sim/sim.js probe` nimmt aufbewahrte Spielstände (`sim/ergebnisse/staende/stand_<Rekord>.json`, einmal erspielt, `--neu` erspielt sie neu) und spielt wenige Runs. Zwei Spielstände mit je 10 Runs gegen zwei Fassungen: 20 s. Für „ist diese Änderung an dieser Stelle schwerer oder leichter?“ ist das genauer und viel schneller als ein Karriere-Lauf. Vergleich mit einem älteren Stand: `git worktree add <Ordner> <Tag>` und `--gegen <Ordner>/src`.
- Karriere-Läufe nur für Fragen zum Gesamtverlauf (Zeit bis Welle X, Supernovas, Ausgaben) und nie mehrere gleichzeitig; zwei Varianten lieber mit je 4 Seeds und `--kerne 4`.
- Der Rechenkern ist seit 0.16.0 gut doppelt so schnell (Karriere bis Welle 62: 30 statt 65 s, identisches Ergebnis). Gemessen mit `node --cpu-prof`: 62 % der Zeit steckten in der Abstandsberechnung Drohne × Gegner und der Prüfung Gegner × Verbündete. Jetzt liegen `buildGrid` (22 %) und `hyp` (22 %) vorn. Drei Vermutungen ohne Messung waren falsch (fremdes Math-Objekt im vm-Kontext, wechselnde Objektform der Gegner, `**2`) – erst messen, dann optimieren.
- Größere Rechenschritte (`dt`) bleiben tabu, siehe Abschnitt 4.

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
   - **Gegnervielfalt: Ziel 25–30 Typen** (Vorgabe des Nutzers). Stand 0.16.0: 7 normale Typen plus Splitterling, Elite-Variante und Boss. Jeder Typ soll eine eigene Antwort verlangen, damit jeder Ast eine Aufgabe hat. Ideenvorrat für die nächsten Schübe (mit dem Nutzer auswählen, je Schub 3–5 Typen, danach Ast-Vergleich):
     - Tempo und Masse: Schwarmkönigin (bringt laufend Schwärmer mit), Springer (überspringt Türme und Helden), Rammbock (wird immer schneller, je länger er lebt).
     - Schutz: Heiler (repariert Gegner in der Nähe, muss zuerst weg), Spiegel (wirft einen Teil des Schadens auf Helden/Drohnen zurück), Panzer (nimmt pro Treffer höchstens einen festen Anteil seines Lebens – braucht viele Treffer), Phasenläufer (zeitweise unverwundbar), Tarner (erst nahe der Basis sichtbar und angreifbar).
     - Störung: Störsender (schaltet Türme in seinem Radius ab), Dieb (stiehlt Energie statt Leben), Hacker (lähmt Drohnen), Schattenwerfer (verkleinert den Impulsradius in seiner Nähe), Magnet (zieht den Impuls-Zeiger an).
     - Fernkampf: Mörser (Flächenschaden auf Helden), Scharfschütze (ein Ziel, sehr hoher Schaden, lange Ladezeit mit Anzeige), Bomber (explodiert an der Basis, vorher abfangen).
     - Tod und Nachwirkung: Brüter (hinterlässt ein Ei, aus dem später Gegner schlüpfen), Giftwolke (hinterlässt ein Feld, das Verbündete schwächt), Wiedergänger (steht einmal mit halbem Leben wieder auf).
     - Schwergewichte: Koloss (Mini-Boss, sehr langsam, sehr viel Leben), Zwilling (zwei Gegner, die sich gegenseitig heilen, solange beide leben), Kommandant (verstärkt alle Gegner in seinem Radius).
   - Erfolge ausbauen, wenn neue Inhalte dazukommen (neue Gegner, Helden, Welten); Ideen: Runs ohne bestimmten Ast, Boss ohne Basisschaden besiegt.
   - **Balancing-Ziel: Der Zeiger (Impuls) soll nicht weniger wichtig sein als Einheiten, Türme und Helden** – und umgekehrt. Stand Upgrade-Messung 0.12.0: Der Fokus-Ast dominiert über das Autofeuer, Basis-Verteidigung (Panzerung, Schild, Reparatur, Geschütze) bringt bei Welle 25 +0,0 Wellen. Eher die anderen Äste aufwerten als den Fokus schwächen.
   - Turm-Menü (erledigt in 0.13.0): öffnet sich nur noch bei kurzem Antippen ohne Bewegung (`towerTap`, `TAP_MOVE`, `TAP_MS` in `ui.js`); aufsetzen und ziehen bewegt den Impuls-Zeiger. Beim Nutzer nachfragen, ob das versehentliche Öffnen damit weg ist.
3. **Welten 3–10:** sind eingeplant (`WORLD_MAX`, `worldUnlockWave(id)=(id−1)·100` in `core2.js`, Karte „Weitere Welten“ im Welten-Menü), aber ohne Inhalt. Welt 2 ist der erste Test für das Prinzip „alle 100 Wellen in Welt 1 eine neue Welt“. Ideenfindung steht aus und läuft mit dem Nutzer. **Vorgabe: Das Kernsystem bleibt in jeder Welt SEHR ähnlich – Basis beschützen, Impulse mit dem Zeiger.** Welten unterscheiden sich über Regeln und Inhalte, nicht über ein anderes Grundspiel.
4. Welt 2 (erst wenn Welt 1 dem Nutzer gefällt): eigene Supernova, Balancing per Simulation (es gibt noch keinen Welt-2-Bot in `sim/`), Turmstufen jenseits der Wand bei ~Welle 80.
5. Rechtliches: Impressum und Datenschutzerklärung liegen als eigene Seiten in `assets/impressum.html` und `assets/datenschutz.html` (seit 0.11.1, verlinkt in den Einstellungen; `build.py` macht die Links für die Website relativ, im Artefakt bleiben sie absolut). **Das Impressum enthält bewusst keine Anschrift** (Entscheidung des Nutzers, rechtlich unvollständig). Vor einem Spenden-/Coffee-Link oder anderer Monetarisierung: Anschrift ergänzen (ggf. c/o-Dienst) und Datenschutzerklärung erweitern.
6. Langfristig: Verpackung für App Stores (Capacitor) und Steam (Tauri/Electron).

Erledigt in 0.12.0: Zahlen-Notation über 10^18 (`numUnit` in `core.js`: nach Qi folgen aa, ab, … zz), Fingerspitze-Beschreibung.

Vom Nutzer abgelehnt (nicht erneut vorschlagen): Zähler „So viele spielen gerade“ (14.11.2026).

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
