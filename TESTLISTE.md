# Testliste für die Beta 0.27.0

Stand: 15.11.2026 · Adresse: https://neonbastion.de/beta/ · Das echte Spiel steht bei 0.19.0.

Zum schnellen Einstieg: In der Beta unter „Einstellungen“ den Knopf „Live-Spielstand übernehmen“ nutzen. Für späte Gegner im Hub die Startwelle hochstellen.

Zum Testen später Inhalte: Entwicklermodus einschalten, dann in den Einstellungen „Testhilfen“ (Ressourcen, Rekordwelle, Startwelle, Abwurf in jeder Welle).

Alles hier ist automatisch getestet (30 Testläufe) und mit der Simulation gemessen. Offen ist jeweils, wie es sich anfühlt und aussieht – das kann nur ein Mensch beurteilen.

## A. Neue Gegner (0.24.0)

| Gegner | ab Welle | Woran du ihn erkennst | Was er tut |
|---|---|---|---|
| Springer | 28 | gelbgrüner Doppelpfeil | springt alle drei Sekunden ein Stück auf die Basis zu |
| Schattenwerfer | 38 | violetter Kreis mit dunklem Hof | in seinem Schatten ist der Impuls nur halb so groß |
| Phasenläufer | 58 | zwei versetzte rosa Rauten | ist immer wieder anderthalb Sekunden lang nicht zu treffen |
| Hacker | 68 | grüne eckige Klammern mit Punkt | Drohnen in seinem gepunkteten Kreis feuern nicht |
| Brüter | 90 | orange Ellipse mit drei Kreisen | hinterlässt ein Ei, aus dem nach vier Sekunden vier Schwärmer schlüpfen |

- [ ] Mit der Testhilfe „Startwelle“ auf Welle 95 stellen: Sind alle fünf auf einen Blick zu unterscheiden?
- [ ] Schattenwerfer: Sieht man, dass der Impuls-Kreis im dunklen Hof schrumpft?
- [ ] Phasenläufer: Ist klar, wann er nicht zu treffen ist (er wird blass)?
- [ ] Hacker: Werden die Drohnen in seinem Kreis sichtbar blass?
- [ ] Brüter: Schafft man es, das Ei rechtzeitig zu zerstören? Sind vier Sekunden passend?
- [ ] Springer: Wirkt der Sprung fair oder überrumpelnd?

## B. Neue Türme (0.25.0)

- [ ] Im Turm-Menü stehen „Stör-Turm“ (25 Kerne) und „Markier-Turm“ (4 Prismen). Sind die Texte verständlich?
- [ ] Stör-Turm: Heiler, Schwarmkönigin, Kommandant, Störsender, Hacker, Schattenwerfer und Springer verlieren in seinem Radius ihre Fähigkeit; Tarner und Phasenläufer werden sichtbar. Merkt man das?
- [ ] Markier-Turm: Markierte Gegner tragen vier gelbe Striche und nehmen deutlich mehr Schaden durch den Impuls (Stufe 1: +55 %). Lohnt es sich, den Zeiger dort zu halten?
- [ ] Die beiden kombinieren nicht mit Frost, Zerfall und Kryo. Vermisst du das?

## C. Neue Helden (0.26.0)

- [ ] Im Helden-Menü stehen „Kopfjäger“ (8 Prismen) und „Ingenieurin“ (40 Kerne).
- [ ] Kopfjäger: sucht sich Elite-Gegner, Hünen und Bosse und trifft sie dreifach; „Fangschuss“ alle zwölf Sekunden. Fühlt er sich gegen Bosse nützlich an?
- [ ] Ingenieurin: bringt 25 % mehr Energie für Türme, „Verstärker“ lässt Gegner im Turmradius sechs Sekunden lang 30 % mehr Schaden nehmen. Merkt man sie?
- [ ] Sehen beide ordentlich aus und sind von den anderen vier zu unterscheiden?

## D. Skilltree (0.27.0)

- [ ] „Heldenimpuls“ hat jetzt fünf Stufen statt einer. Hattest du ihn schon, steht er auf Stufe 5 mit voller Wirkung.
- [ ] Neun neue Knoten: Bunker, Fernrohr (Basis), Feldreparatur, Nachbrenner (Flotte), Feldsanitäter, Fünfter Platz (Helden), Brennpunkt, Schattenlicht (Impuls), Energiekern (Ertrag). Passen Namen und Plätze im Baum?
- [ ] Jeder neue Knoten zeigt Vorher und Nachher.
- [ ] „Fünfter Platz“ kostet 8 Sternenstaub. Zu billig, zu teuer?

## E. Entwicklermodus nur noch in der Beta (0.25.1)

- [ ] Im echten Spiel gibt es nach dem nächsten Release keinen Entwicklermodus mehr: kein Code-Feld, keine Testhilfen, keine Test-Freischaltung der Gitterfestung. In der Beta bleibt alles wie gehabt. So gewollt?

## 0. Abwürfe (neu in 0.22.0)

- [ ] Mit der Testhilfe „Abwurf in jeder Welle“ fällt in jeder Welle ein Sechseck aus einem besiegten Gegner. Ist es gut zu sehen?
- [ ] Fünf Impulse hintereinander zerstören den Abwurf, die fünf Punkte darüber zählen mit. Ein Impuls daneben setzt sie zurück. Ist das verständlich?
- [ ] Der Bogen unter dem Abwurf zeigt die Frist von 3 Sekunden und wird am Ende rot. Passt die Frist, auch ohne „Taktgeber“ (Impuls alle 2 Sekunden)?
- [ ] Aufheben: mit einzelnen Treffern am Leben halten und später auslösen. Fühlt sich das gut an?
- [ ] Bombe: nimmt Gegnern im Umkreis 40 % ihres Lebens (Bossen 8 %). Stark genug?
- [ ] Doppelter Schaden, schneller Impuls, Reparatur, Splitterregen wirken je 5 Sekunden. Der Bogen um die Basis zeigt die Restzeit. Merkt man die Wirkung?
- [ ] Sind die fünf Zeichen (Bombe, Kreuz, Blitz, Plus, Raute) auseinanderzuhalten?
- [ ] Ohne Testhilfe: 10 % je Welle, also etwa drei Abwürfe bis Welle 30. Zu selten, zu oft?

## 0b. Basis: Aussehen und Zerfall (neu in 0.23.0)

- [ ] Fällt die Basis, flackert sie kurz, explodiert und zerfällt in Trümmer. Ist der Effekt ordentlich genug?
- [ ] Der Endbildschirm kommt jetzt etwa 0,7 Sekunden später, damit man den Zerfall sieht. Zu lang?
- [ ] Beim Beenden über das Pausenmenü zerfällt die Basis nicht. Richtig so?
- [ ] Mit den Testhilfen Ressourcen holen und im Basis-Ast kaufen: Panzerung ab Stufe 10, 25 und 50 bringt Panzerplatten. Sieht man den Unterschied?
- [ ] Bollwerk (Bastionen), Festungskern (goldene Krone), Kernreaktor (goldener Innenkern), Autofeuer und Sturmfeuer (Läufe): Passt das Aussehen?
- [ ] Kleinere Zeichen: Reparatur (grüne Punkte), Schildmatrix (zweiter Ring), Abwehrnetz (Linien), Kaliber (längere Läufe), Schockwelle und Nova-Ring, Unzerstörbar (weißer Schein). Zu viel, zu wenig?
- [ ] Voll ausgebaut: Ist die Basis noch gut lesbar oder überladen?
- [ ] Die Basis im Hub zeigt denselben Ausbau.

## 1. Flotte (neu)

- [ ] Im Hub gibt es den Knopf „Flotte“. Passt er neben „Enzyklopädie“ und „Erfolge“, auch auf dem iPhone?
- [ ] Das Flotten-Menü zeigt fünf Klassen: Jäger, Abfänger, Schwarm, Reparaturdrohne, Kreuzer.
- [ ] Abfänger (8 Kerne), Schwarm (20 Kerne) und Reparaturdrohne (3 Prismen) lassen sich freischalten. Sind die Preise stimmig?
- [ ] Der Kreuzer ist gesperrt, bis im Skilltree „Mutterschiff“ gekauft ist. Ist das verständlich?
- [ ] Anteil je Klasse mit − und + in Zehnerschritten verstellen. Die anderen Klassen geben anteilig ab, der Balken oben zeigt die Verteilung. Fühlt sich das richtig an, oder willst du lieber freie Zahlen?
- [ ] Aufwerten zeigt Vorher und Nachher für Schaden und Leben.
- [ ] Im Run: Sehen die fünf Drohnen unterschiedlich genug aus? (Jäger türkis, Abfänger gelb und schmal, Schwarm grün als Dreiergruppe, Reparaturdrohne mintgrün mit Kreuz, Kreuzer orange und groß)
- [ ] Abfänger stürzen sich zuerst auf Bomber, Sprinter und Tarner. Fällt das auf?
- [ ] Reparaturdrohnen kreisen nah an der Basis und greifen nicht an. Merkt man ihre Heilung?
- [ ] Nach einer Supernova stehen die Drohnenstufen wieder auf 1, Freischaltungen und Verteilung bleiben.
- [ ] Dein alter Spielstand: Hattest du „Mutterschiff“, sollte die Flotte auf 80 % Jäger und 20 % Kreuzer stehen.

## 2. Neue Gegner (fünf weitere, jetzt 18 Arten)

| Gegner | ab Welle | Woran du ihn erkennst | Was er tut |
|---|---|---|---|
| Schwarmkönigin | 25 | rosa Kreis mit sechs Stacheln | bringt alle drei Sekunden zwei Schwärmer hervor |
| Rammbock | 40 | orange Pfeilspitze | wird immer schneller, je länger er lebt |
| Panzer | 55 | graues doppeltes Quadrat | kein Treffer nimmt ihm mehr als 12 % seines Lebens |
| Wiedergänger | 65 | mintgrüne Raute mit Kreuz | steht nach dem ersten Tod mit halbem Leben wieder auf |
| Kommandant | 80 | roter Stern mit gepunktetem Kreis | Gegner in seinem Umkreis sind schneller und schlagen härter zu |

- [ ] Jeder wird bei seiner Einstiegswelle im Banner angekündigt („Neu: …“).
- [ ] Sind alle fünf auf einen Blick von den anderen zu unterscheiden?
- [ ] Wiedergänger: Liegt er nach dem ersten Tod sichtbar am Boden, bevor er aufsteht?
- [ ] Kommandant: Ist der gepunktete Kreis deutlich genug?
- [ ] Panzer: Merkt man, dass große Einzeltreffer an ihm verpuffen und viele kleine besser wirken?
- [ ] Alle fünf tauchen in der Enzyklopädie auf, sobald du sie besiegt hast.

## 3. Gegner aus 0.18.0 (schon live, falls noch nicht angesehen)

- [ ] Heiler (20), Bomber (35), Tarner (50), Störsender (70), Hüne (85).
- [ ] Störsender: Türme in seinem gestrichelten Kreis werden blass und wirken nicht.
- [ ] Tarner: fast unsichtbar, bis er nahe an der Basis auftaucht.

## 4. Umbenannte Knoten im Impuls-Ast

- [ ] „Fingerspitze“ heißt „Impulsstärke“, „Tippgewitter“ heißt „Impulsgewitter“, „Göttlicher Finger“ heißt „Heldenimpuls“. Passen die Namen, oder hast du bessere?

## 5. Balancing – bitte beim Spielen darauf achten

- [ ] Fühlt sich die Flotte nach dem Umbau zu stark, zu schwach oder richtig an?
- [ ] Gibt es eine Stelle, an der du plötzlich viele Wellen auf einmal schaffst (Sprung) oder lange hängst (Wand)? Bitte die Welle notieren.
- [ ] Doppelbosse auf Welle 25, 50, 75, 100 sind mit 75 % Leben je Boss als Hürde gedacht. Passt die Höhe?
- [ ] Schillernde Gegner: Ist dir einer begegnet? Wie oft ungefähr?

## 6. Was aus früheren Versionen noch auf dein Urteil wartet

- [ ] Astnamen im Skilltree: Stehen sie jetzt so, wie du sie haben willst?
- [ ] Skilltree-Hintergrund: genug Details, oder soll noch mehr hinein?
- [ ] Wischen auf dem iPhone: Passt die 1,5-fache Übersetzung des Impuls-Zeigers?
- [ ] Erfolge: Sind verdeckte Erfolge so, wie du es dir vorgestellt hast?

## 7. Nicht gebaut – hier brauche ich deine Entscheidung

Diese Punkte standen auf der Liste. Ich habe sie nachts nicht gebaut, weil du für sie gesagt hattest, dass wir die Inhalte erst besprechen, und weil hier fast alles an deinem Geschmack hängt.

- **Neue Helden.** Vorschläge: eine Ingenieurin, die Türme verstärkt; ein Jäger, der gezielt Elite-Gegner und Bosse angeht; ein Beschwörer, der eigene kleine Einheiten ruft.
- **Neue Türme.** Vorschläge: ein Störturm, der Gegner-Fähigkeiten unterbricht (gegen Heiler, Kommandant, Schwarmkönigin); ein Magnetturm, der Gegner zusammenzieht (gut für Flächenschaden); ein Markierturm, der dem Impuls Zusatzschaden gibt.
- **Größerer Skilltree.** „Heldenimpuls“ (früher „Göttlicher Finger“) in mehrere Stufen aufteilen; je Ast zwei bis drei neue Knoten, die auf die neuen Gegner antworten.
- **Welten 3 bis 10.** Vorgabe von dir: gleiches Kernsystem, Basis beschützen, Impuls mit dem Zeiger. Ideen für den Unterschied je Welt: andere Gegnermischung, eine Sonderregel (z. B. Dunkelheit, in der nur der Impuls-Kreis leuchtet), eigene Währung.
- **Welt 2** ruht weiterhin und hat die neuen Gegner nicht.
- **Noch 7 bis 12 Gegnerarten** bis zu deinem Ziel von 25 bis 30. Im Ideenvorrat stehen unter anderem Spiegel, Phasenläufer, Dieb, Hacker, Mörser, Scharfschütze, Brüter, Giftwolke, Zwilling.

## Messwerte zu 0.21.0

Probe am festen Spielstand gegen 0.19.0 (je 16 Runs, erreichte Welle):

| Spielstand | 0.19.0 | 0.21.0 |
|---|---|---|
| Rekord 25 | 26,8 | 27,0 |
| Rekord 46 | 44,6 | 44,9 |
| Rekord 52 | 49,9 | 51,4 |
| Rekord 76 | 77,3 | 77,0 |
| Rekord 97 | 97,1 | 97,5 |

Äste allein nach 4 Stunden Spielzeit (5 Seeds, Zeiger zielt): Basis 32, Flotte 28, Helden 26, Impuls 26, alle fünf zusammen 67.

Karriere mit ruhendem Zeiger (8 Seeds): Welle 25 nach 51 min, Welle 50 nach 2 h 11 min, Welle 75 nach 7 h 15 min, Welle 100 nach 14 h 34 min.

## 8. Bekannte Einschränkungen

- Gemessen wurde mit dem Bot, nicht mit einem Menschen. Die Zahlen sind Vergleichswerte.
- Die Flotte kostet in der Messung als letzter Ast weiterhin Wellen, obwohl sie allein gleichauf liegt. Der Wert schwankt zwischen Messläufen stark.
- Welt 2 hat weder die neue Flotte noch die neuen Gegner.
