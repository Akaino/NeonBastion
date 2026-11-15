# Abschluss-Testliste für Welt 1 (Beta 0.31.0)

Stand: 15.11.2026 · Adresse: https://neonbastion.de/beta/ · Das echte Spiel steht bei 0.30.1.

Zum Testen: In der Beta den Entwicklermodus einschalten, dann in den Einstellungen „Testhilfen“ (Ressourcen, Rekordwelle, Startwelle, Abwurf in jeder Welle, schillernder Gegner, Leistungsmessung). „Live-Spielstand übernehmen“ holt deinen echten Spielstand in die Beta.

Alles hier ist automatisch getestet (34 Testläufe) und mit der Simulation gemessen. Offen ist, wie es sich anfühlt und aussieht.

## 1. Ruckeln und Ton in Safari (wichtig zuerst)

Die Ursache ist gefunden: Ein fremdes Skript in deinem Safari reagiert auf jede Textänderung der Seite mit einem Hänger pro Sekunde. Seit 0.30.1 liegt die gesamte Oberfläche so, dass es ihre Änderungen nicht mehr sieht, im Run und in den Menüs.

- [ ] Beta 0.30.1 laden, ein paar Runs auf 4× oder 8× spielen, zwischendurch die Seite neu laden: Bleibt es flüssig, bleibt der Ton sauber?
- [ ] In der Konsole `Perf.live()`: Steht dort dauerhaft „Ruckler in 5 s: 0“, auch beim Klicken durch die Menüs und beim schnellen Kaufen im Skilltree?
- [ ] Sehen alle Menüs aus wie vorher (Hub, Skilltree, Helden, Flotte, Türme, Enzyklopädie, Erfolge, Supernova, Welten, Einstellungen, Pause, Endbildschirm)?
- [ ] Schnellstart: Die Startwelle lässt sich nie höher stellen als deine Rekordwelle, auch mit vielen Stufen.
- [ ] Sieht die Anzeige im Run aus wie vorher (Welle, Lebensbalken, Währungen, Bossbalken, Heldenkreise, Bauen-Knopf, Banner, Hinweise)?
- [ ] Funktionieren Pause, Tempo, Bauen und das Turm-Menü wie vorher?

## 1b. Umbau des Quelltexts (0.31.0, nur in der Beta)

Das Spiel wird jetzt aus getrennten Dateien geladen (68 Module statt einer großen Datei). Am Spiel selbst ist nichts geändert; die Simulation rechnet exakt dieselben Zahlen wie vorher.

- [ ] Die Beta lädt wie gewohnt, auf dem iPhone und dem MacBook, auch nach „Zum Home-Bildschirm“.
- [ ] Erster Start nach dem Update: Dauert das Laden spürbar länger als bisher?
- [ ] Spielstand der Beta ist noch da.
- [ ] Ton, Musik und alle Menüs funktionieren wie vorher.
- [ ] Mit eingeschalteter Erweiterung in Safari weiterhin keine Ruckler.

## 2. Flotte

- [ ] Anteile in 5er-Schritten, nichts wird automatisch umverteilt. Plus geht nur, solange Prozente frei sind. So gewollt?
- [ ] Alle Klassen auf 0 % stellen: Die Basis baut dann nur Jäger. In Ordnung?
- [ ] Je 20 % für fünf Klassen lässt sich einstellen.
- [ ] Eine neu freigeschaltete Klasse startet mit 0 %.
- [ ] Sehen die fünf Drohnen im Run unterschiedlich genug aus?
- [ ] Abfänger stürzen sich zuerst auf Bomber, Sprinter und Tarner. Fällt das auf?
- [ ] Reparaturdrohnen: Merkt man ihre Heilung?
- [ ] Nach einer Supernova stehen die Drohnenstufen auf 1, Freischaltungen und Verteilung bleiben.

## 3. Gegner (28 Arten, 30 Einträge in der Enzyklopädie)

Mit der Testhilfe „Startwelle“ kommst du direkt zu den späten Arten.

| Gegner | ab Welle | Woran du ihn erkennst | Was er tut |
|---|---|---|---|
| Schwarmkönigin | 25 | rosa Kreis mit sechs Stacheln | bringt alle drei Sekunden zwei Schwärmer hervor |
| Springer | 28 | gelbgrüner Doppelpfeil | springt alle drei Sekunden ein Stück auf die Basis zu |
| Dieb | 33 | gelbe Pfeilspitze mit Punkt | läuft zur Basis und stiehlt ein Fünftel deiner Energie |
| Schattenwerfer | 38 | violetter Kreis mit dunklem Hof | in seinem Schatten ist der Impuls nur halb so groß |
| Rammbock | 40 | orange Pfeilspitze | wird immer schneller |
| Mörser | 48 | rotes Quadrat mit Rohr | beschießt Helden und Drohnen mit Granaten, ein Kreis kündigt den Einschlag an |
| Panzer | 55 | graues doppeltes Quadrat | kein Treffer nimmt ihm mehr als 12 % |
| Phasenläufer | 58 | zwei versetzte rosa Rauten | ist immer wieder anderthalb Sekunden nicht zu treffen |
| Giftträger | 63 | drei grüne Blasen | hinterlässt eine Giftwolke, die Helden und Drohnen schadet |
| Wiedergänger | 65 | mintgrüne Raute mit Kreuz | steht einmal mit halbem Leben wieder auf |
| Hacker | 68 | grüne eckige Klammern | Drohnen in seinem Kreis feuern nicht |
| Scharfschütze | 73 | pinkes Rechteck mit langem Lauf | zielt drei Sekunden auf den stärksten Helden, die Linie zeigt das Ziel |
| Spiegel | 78 | helle schräge Scheibe | wirft bei Treffern Schaden auf den nächsten Helden oder die nächste Drohne zurück |
| Kommandant | 80 | roter Stern mit gepunktetem Kreis | Gegner in seinem Umkreis sind schneller und stärker |
| Brüter | 90 | orange Ellipse mit drei Kreisen | hinterlässt ein Ei, aus dem vier Schwärmer schlüpfen |
| Gespann | 95 | zwei orange Kreise mit Verbindungslinie | heilen sich gegenseitig, fällt einer, rast der andere |

- [ ] Sind alle Arten auf einen Blick zu unterscheiden?
- [ ] Jede wird bei ihrer Einstiegswelle im Banner angekündigt.
- [ ] Mörser: Ist der Kreis früh genug zu sehen, um zu verstehen, was passiert?
- [ ] Scharfschütze: Ist die Ziellinie deutlich?
- [ ] Giftwolke: gut sichtbar, nicht zu aufdringlich?
- [ ] Dieb: Tut der Energieverlust weh genug, ohne zu nerven?
- [ ] Spiegel: Versteht man, warum Helden plötzlich Schaden nehmen?
- [ ] Gespann: Sieht man die Verbindung und das Rasen?
- [ ] Schattenwerfer, Phasenläufer, Hacker, Brüter, Springer: wie in der letzten Liste, falls noch nicht angesehen.
- [ ] Heiler, Bomber, Tarner, Störsender, Hüne (seit 0.18.0), falls noch nicht angesehen.

## 4. Türme und Helden

- [ ] Stör-Turm (25 Kerne): nimmt Gegnern in seinem Radius die Fähigkeiten, macht Tarner und Phasenläufer sichtbar. Merkt man das?
- [ ] Markier-Turm (4 Prismen): markierte Gegner tragen vier gelbe Striche und nehmen mehr Impulsschaden. Lohnt es sich, den Zeiger dort zu halten? Zu stark, zu schwach?
- [ ] Kopfjäger (8 Prismen): gegen Elite, Hünen und Bosse nützlich?
- [ ] Ingenieurin (40 Kerne): Merkt man mehr Energie und den „Verstärker“?
- [ ] Sehen beide Helden ordentlich aus?

## 5. Skilltree (81 Knoten)

- [ ] Neue Knoten „Feuerleitstand“ (Basis), „Heldengeschwader“ (Flotte), „Kampfrausch“ (Helden): je fünf Stufen, Kosten 1, 1, 2, 2, 2 Sternenstaub. Sie lassen Basis, Flotte und Helden spät mitwachsen. Sind die Texte verständlich?
- [ ] „Heldenimpuls“ hat fünf Stufen. Hattest du ihn schon, steht er auf Stufe 5.
- [ ] Übrige neue Knoten: Bunker, Fernrohr, Feldreparatur, Nachbrenner, Feldsanitäter, Fünfter Platz, Brennpunkt, Schattenlicht, Energiekern. Passen Namen und Plätze?
- [ ] Jeder Knoten zeigt Vorher und Nachher.
- [ ] Ist der Baum noch übersichtlich?

## 6. Abwürfe

- [ ] Mit der Testhilfe „Abwurf in jeder Welle“: Sechseck gut zu sehen?
- [ ] Fünf Impulse hintereinander zerstören ihn, ein Impuls daneben setzt zurück. Verständlich?
- [ ] Frist von 3 Sekunden, jeder Treffer setzt sie zurück. Passt das, auch ohne „Taktgeber“?
- [ ] Bombe (40 % Leben im Umkreis, Bosse 8 %): stark genug?
- [ ] Doppelter Schaden, schneller Impuls, Reparatur, Splitterregen: Merkt man die 5 Sekunden?
- [ ] Ohne Testhilfe 10 % je Welle: zu selten, zu oft?

## 7. Basis

- [ ] Zerfall der Basis: ordentlich genug? Endbildschirm 0,7 Sekunden später: zu lang?
- [ ] Sichtbare Upgrades (Panzerplatten ab Panzerung 10/25/50, Bastionen, Krone, Läufe, Innenkern und die kleineren Zeichen): Passt das Aussehen? Voll ausgebaut überladen?

## 8. Erfolge und Enzyklopädie

- [ ] 27 Erfolge, zehn neue: Glücksgriff, Königsmörder, Enttarner, Riesentöter, Nesträuber, Diebesfänger, Heldenriege, Flottenadmiral, Baumeister, Baumpfleger. Passen Namen und Schwellen?
- [ ] Enzyklopädie: 30 Einträge bei den Gegnern, alle mit Form und Text.

## 9. Balancing – bitte beim Spielen darauf achten

- [ ] Gibt es eine Stelle mit einem Sprung (plötzlich viele Wellen) oder einer Wand (lange hängen)? Bitte die Welle notieren.
- [ ] Doppelbosse auf Welle 25, 50, 75, 100 mit 75 % Leben je Boss: Passt die Hürde?
- [ ] Fühlen sich Basis, Flotte, Helden und Impuls ähnlich wichtig an?
- [ ] Schillernde Gegner: Ist dir einer begegnet?

## 10. Entwicklermodus

- [ ] Im echten Spiel gibt es nach dem Release keinen Entwicklermodus mehr, in der Beta bleibt er. So gewollt?

## Messwerte

Schadensanteile an späten Spielständen (Zeiger ruht), vor und nach den neuen Verbund-Knoten:

| Spielstand | | Basis | Flotte | Helden | Impuls | erreichte Welle |
|---|---|---|---|---|---|---|
| Rekord 76 | vorher | 3 % | 16 % | 16 % | 65 % | 78,8 |
| Rekord 76 | Knoten auf Stufe 5 | 15 % | 43 % | 15 % | 27 % | 86,4 |
| Rekord 97 | vorher | 2 % | 11 % | 14 % | 73 % | 96,6 |
| Rekord 97 | Knoten auf Stufe 5 | 18 % | 39 % | 14 % | 30 % | 107,9 |

Karriere mit ruhendem Zeiger (4 Seeds):

| Meilenstein | 0.28.1 | 0.29.0 |
|---|---|---|
| Welle 25 | 51 min | 51 min |
| Welle 50 | 2 h 19 min | 2 h 23 min |
| Welle 75 | 8 h 3 min | 7 h 29 min |
| Welle 100 | 13 h 21 min | 12 h 13 min |
| Welle 150 | von keinem Seed erreicht | 55 h 54 min, alle vier Seeds |

Äste allein nach 4 Stunden (5 Seeds, Zeiger zielt): Basis 31, Flotte 35, Helden 29, Impuls 31.

## Bekannte Einschränkungen

- Gemessen wurde mit dem Bot. Mit der einfachen Kaufregel (immer das Billigste) verteilt er den seltenen Sternenstaub auf alle vier Verbund-Knoten und kommt in vier Stunden mit allen fünf Ästen nur bis Welle 61. Mit der besseren Kaufregel (nach geschätztem Nutzen) erreicht er Welle 75; Basis und Flotte sind dann als letzter Ast etwa neutral (−2 und −1 Wellen), Helden bringen +9, Impuls +23, Ertrag +28.
- Die Helden selbst machen spät nur etwa 14 % des Schadens. Ihr Ast bleibt trotzdem der wichtigste, weil die anderen von seinem Bonus leben.
- Die Wirkung von Stör-Turm und Markier-Turm für einen Menschen ist nicht gemessen.
- Welt 2 hat nichts von den Neuerungen.
- Von wem das fremde Skript in deinem Safari stammt, ist nicht geklärt. Das Spiel umgeht es seit 0.30.0; Das Spiel umgeht es seit 0.30.1 vollständig.
