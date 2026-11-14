# Neon Bastion – Balancing-Simulation

Simuliert Spielerkarrieren im Neon-Sektor **ohne Tippen** mit dem originalen Spielcode aus `src/`.
Läuft ohne Grafik und ohne Wartezeit, also so schnell, wie der Prozessor rechnet. Mehrere Simulationen laufen parallel, eine pro Prozessorkern.

## Voraussetzung

Node.js ab Version 18. Auf dem Mac am einfachsten:

```
brew install node
```

oder den Installer von https://nodejs.org verwenden. Prüfen mit `node -v`.

## 1. Karriere-Simulation: Wie lange dauert es bis Welle 100?

```
cd pfad/zum/projekt
node sim/sim.js --seeds 8
```

- `--seeds 8` startet 8 unabhängige Durchläufe mit verschiedenen Zufallswerten (sinnvoll: Anzahl deiner Kerne).
- Der Bot spielt Runs, kauft danach Skilltree-Knoten, Heldenstufen, Turmstufen und Bauplätze (immer die gewichtet billigste Option), baut im Run Türme, wählt seine Startwelle (Rekord minus 10) und zündet die Supernova, wenn der Rekord 4 Runs lang nicht steigt.
- Jeder Run wird live angezeigt.

Ergebnisse im Ordner `ergebnisse/`:

| Datei | Inhalt |
|---|---|
| `karriere_zusammenfassung.md` | Zeit bis Welle 25, 50, 75, 100, 150, 200 als Median über alle Durchläufe, umgerechnet in Menschzeit bei 1×, 4× und 8×. Dazu: wofür der Bot seine Währungen ausgegeben hat. |
| `karriere_runs.csv` | Jeder einzelne Run (für Excel/Numbers: Trennzeichen Semikolon) |

Nützliche Optionen:

```
--ziel 100        Zielwelle
--stunden 300     Abbruch nach so vielen Stunden Spielzeit (1×)
--pause 20        Sekunden, die ein Mensch zwischen zwei Runs in Menüs verbringt
--stall 4         Supernova nach so vielen Runs ohne neuen Rekord
```

## 2. Upgrade-Messung: Welche Upgrades bringen am meisten?

```
node sim/sim.js upgrades --at 25,50
```

1. Der Bot erspielt sich Spielstände, bei denen sein Rekord Welle 25 bzw. 50 erreicht.
2. Für jeden Spielstand testet er jedes verfügbare Upgrade einzeln: Er gibt testweise 5 Stufen gratis dazu und spielt einen Run ab Welle 1 (4 Wiederholungen mit festen Zufallswerten). Verglichen wird mit demselben Spielstand ohne Änderung.

Ergebnis je Kontrollpunkt: `ergebnisse/upgrades_welle25.md` (und `.csv`) mit

- **Δ Wellen**: wie viele Wellen das Upgrade zusätzlich bringt
- **Kosten** der getesteten Stufen
- **Effizienz**: zusätzliche Wellen pro 1.000 gewichteter Kosten. Sehr hohe Werte deuten auf ein zu starkes oder zu billiges Upgrade hin, Werte um 0 auf ein wirkungsloses.

Optionen: `--stufen 5`, `--wiederholungen 4`.

## Hinweise zur Interpretation

- Alles ohne Tippen. Upgrades, die nur auf Tippschaden wirken, zeigen deshalb nur über Autofeuer einen Effekt.
- „Schnellstart“ spart Zeit, bringt aber keine höheren Wellen. In der Upgrade-Messung starten alle Test-Runs bei Welle 1, dort zeigt es also 0.
- Der Bot ist einfach gestrickt (billigste Option zuerst). Ein guter menschlicher Spieler ist eher schneller.
- Zufall spielt eine Rolle (Elite-Gegner, Drops). Deshalb mehrere Seeds bzw. Wiederholungen.
- `--dt 0.05` ist der Simulationsschritt (20 Schritte pro Sekunde). **Nicht vergrößern:** Mit 0.1 funktionieren Treffer nicht mehr zuverlässig, die Ergebnisse werden unbrauchbar. Kleinere Werte sind genauer, aber langsamer.
- Grafik-freier Modus: Partikel, Schadenszahlen und Effekte werden in der Simulation nicht erzeugt. Das ändert den Spielausgang nicht (geprüft über mehrere Seeds), spart aber 10 bis 30 % Rechenzeit.
- Einzelne Seeds können stark voneinander abweichen, weil sich kleine Zufallsunterschiede über viele Runs aufschaukeln. Für belastbare Aussagen lieber mehr Seeds verwenden.

## Spielcode

Die Simulation lädt den Spielcode direkt aus `src/`. Änderungen am Spiel sind also sofort in der Simulation enthalten.
