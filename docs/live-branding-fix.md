# Live-Ticker: Vereinsdarstellung (10.10.2026)

Auslöser: Spiel 221205012 enthielt „Inter Monheim E1“, aber kein Gegnerwappen und keine Gegnerfarbe. Die Zuschaueransicht lud die Vereinsstammdaten nicht nach.

Die Zuschaueransicht abonniert jetzt app/teams. resolveMatch gleicht Mannschaftsnamen mit dem bestehenden suffix-toleranten Vereinsabgleich ab und ergänzt Anzeigename, Wappen (badge/logo) und Primärfarbe (color1/color). Die Auflösung verändert ausschließlich eine Kopie zur Darstellung. Spielstand, Ereignisse, Uhr und Spiel-ID werden nicht geschrieben. Weitere Meldungen aus einem älteren Reporter-Tab können die korrigierte Darstellung daher nicht zurücksetzen.

Bereits offene Zuschaueransichten müssen nach Veröffentlichung einmal neu geladen werden. Der Berichtende muss das Spiel nicht neu starten. Wappen und Farben müssen im Vereinsbestand gepflegt sein.

Validierung: 25 Tests (team-data, persistence, ticker-theme) bestanden; Vite-Produktionsbuild erfolgreich.

## Nachbesserung der Eingabeansicht

Die erste Korrektur deckte die Zuschaueransicht ab. In der Eingabeansicht hing das Nachladen weiterhin am großen globalen Datenabruf; Eingabebuttons verwendeten außerdem den unveränderten Spieltitel. Nun lädt auch der Berichtende Vereinsdaten unabhängig über einen Live-Listener. Nach Eintreffen werden Spieltitel, Torbuttons, Wappen und Farben gemeinsam aktualisiert. Der Listener ruft weder save noch eine Wiederherstellung des Spielstands auf. getMatchTeams löst Namen für Buttons und Exporte ebenfalls auf. Regressionstests prüfen, dass die Aktualisierung ohne Speichern oder Zurücksetzen erfolgt.

## Kader und Saisontore: gemeinsamer Datenweg

Am 10.10.2026 wurde zusätzlich die Abweichung zwischen Reporter- und Zuschaueransicht korrigiert. Der Reporter lud den Kader einmalig aus dem großen app-Abruf bzw. aus localStorage, während Zuschauer bereits app/squad abonnierten. Die Reporterstatistik baute auf zwischengespeicherten Spielplanresultaten auf; Torereignisse enthielten eingefrorene seasonGoals-Werte. Fehlende/verspätete Historie konnte damit dauerhaft falsche Anzeigewerte erzeugen.

public/live-roster.js abonniert jetzt für beide Ansichten app/squad, app/schedule und matches. Portraits erscheinen sofort nach Eintreffen des Kaders. Tore werden erst nach Eintreffen der vollständigen beiden Statistikquellen neu berechnet. Gezählt werden wie auf der Vereinsseite die nicht archivierten Spiele des Spielplans, eigene reguläre Tore und goalAdjustment. Auch noch nicht beendete Spiele zählen. Die laufende lokale Eingabe überlagert in der Reporterberechnung das Serverexemplar, damit ungesendete Tore nicht verloren gehen.

Die Saisontor-Nummer einer Meldung wird nach Ereignis-ID (Erfassungszeitpunkt) aus den Toren berechnet, statt den alten seasonGoals-Snapshot ungeprüft anzuzeigen. Nachträglich erfasste Tore werden entsprechend ihrer Erfassungsreihenfolge gezählt. Es gibt keine Migration, keine Schreibzugriffe aus den neuen Abonnements und keine Änderung von Uhr, Spielstand, Ereignissen oder Spielstatus. Neue Hilfsskripte tragen eine Cache-Version. Bereits offene Tabs benötigen einmaliges Neuladen.

Der neue Service ist hiervon technisch getrennt: matchtracker-service/server/dev.ts verwendet .local/pilot.sqlite; der veröffentlichte alte Ticker verwendet Firebase. Die Fehler liegen in den unterschiedlichen Datenwegen des alten Tickers, nicht in einer Service-Datenmigration. Änderungen am alten Ticker während der Weiterentwicklung sind davon zu unterscheiden.

Validierung: 143 Node-Tests bestanden, darunter Live-Kaderwechsel, historische Torkorrektur, Archivfilter, manuelle Toranpassung und Unveränderlichkeit eines pausierten Spiels; Produktionsbuild erfolgreich.

## Reporter: verbleibender Fehler in der Ladereihenfolge

Rückmeldung: Mats zeigte beim Eintragenden 6 statt 7, Jonah 6 statt 10; die Vereins-Kaderseite war korrekt. Die erste Korrektur berücksichtigte einen Seiteneffekt nicht: renderKaderList rief selbst recalculatePlayerStats auf und konnte dadurch frisch geladene Statistikwerte mit dem noch nicht wiederhergestellten lokalen Spiel überschreiben. Nach der abschließenden Wiederherstellung und Neuberechnung fehlte außerdem das erneute Zeichnen der Tormeldungen.

renderKaderList stellt jetzt ausschließlich die bereits berechneten Werte dar. Nach dem Wiederherstellen des Spiels werden Kader, Spielerauswahl und Tormeldungen gemeinsam aktualisiert. Auch nach lokalen Änderungen werden Saisontor-Labels nach der Berechnung neu gezeichnet. Keine Migration und kein zusätzlicher Datenbank-Schreibzugriff; Status, Uhr und Ereignisse bleiben bestehen.

Zwei neue Regressionstests schlugen vor der Korrektur fehl und bestehen danach: unveränderte frische Statistik beim Zeichnen des Kaders und erneute Darstellung nach abgeschlossener Startberechnung. Alle 145 Tests und der Produktionsbuild bestehen.

## Feed, Teilen-Bild und Ladeübergang

Der Bildexport verwendet nun den Feed-Stil: zweifarbiger Vereinskopf, Wappen, helle Anzeigetafel mit schwarzem Statusband und kompakte Torzeilen. Es werden ausschließlich Tore exportiert, keine Wechsel oder Kommentare. Vereinsfarben werden pro exportierter Begegnung aufgelöst. Wappen werden mit CORS vorab geladen; bei nicht erreichbaren Bildern bleibt ein Textkürzel als Fallback, damit der Export möglich bleibt. Lange Teamnamen und Zeilentexte werden auf die verfügbare Breite begrenzt.

Textmeldungen mit Foto zeigen das Foto über dem Text in voller Kartenbreite ohne Höhenbeschränkung. Ereignisse ohne Minutenangabe erhalten keine leere Minutenspalte. Beide Regeln gelten für Reporter und Zuschauer, auch bei bereits gespeicherten Meldungen.

public/ticker-loader.js blendet beim ersten Laden eine gestrichelte Kreispfeil-Animation ein. Der Zuschauer wartet auf Match, Kader/Statistik, Vereinsdaten, Trainer und Aufstellung; der Reporter auf die Wiederherstellung des Matches, Kader/Statistik und Vereinsdaten. Vor dem Einblenden werden die Headerwappen dekodiert. Bei ausbleibenden Daten erscheint nach 15 Sekunden ein Verbindungshinweis mit Neuladen-Schaltfläche. Fehlende Bilddateien blockieren die Darstellung höchstens fünf Sekunden. Reduced Motion wird respektiert. Die Ladeanzeige führt keine Datenbank-Schreibzugriffe aus.

Validierung: 148 Tests und Produktionsbuild erfolgreich. Browserprüfung des bestehenden Spiels ausschließlich im Zuschauer-Modus; außerdem isolierte Vorschau für eine kombinierte Bild/Text-Karte (gemessen: Bildbreite = Kartenbreite, Text darunter, Minute ausgeblendet) und den Canvas-Export. Keine Spieldaten verändert.

## Reporter-Spielplan: laufende Aktualisierung und Sortierung

Der gespeicherte Spielplan enthält HSV Langenfeld (Testspiel, 07.10.2026, ID 1791182778226); das Spiel ist mit 20:0 beendet. Solingen-Wald (ID 221205005) ist mit matchFinished=true und abandoned=true korrekt abgeschlossen. Beide Datensätze wurden ausschließlich lesend geprüft.

Die gemeinsame Live-Abfrage gab bisher den aktualisierten Spielplan nur für die Statistikberechnung intern weiter. Der Reporter behielt dagegen seinen einmalig geladenen Spielplan. Der Listener liefert nun auch die aktuellen Termine; reporterSchedule übernimmt neue Einträge und verknüpft abgeschlossene Ergebnisse sowie Abbrüche mit den Match-Daten. Vorhandene Teilnahmeinformationen bleiben erhalten. Keine neuen Termine werden erfunden, archivierte bleiben ausgeblendet, keine Datenbankänderung ist erforderlich.

sortReporter sortiert auf einer Kopie: laufendes Spiel zuerst, anschließend kommende Spiele nach Datum/Uhrzeit aufsteigend (Termine ohne Datum zuletzt in dieser Gruppe), danach vergangene, abgeschlossene und abgebrochene Spiele chronologisch. Die Tagesgrenze wird in Europe/Berlin bestimmt. Abbrüche behalten die sichtbare Abbruch-Kennzeichnung und bieten keinen Neustart-Button.

Validierung: 150 Tests und Produktionsbuild bestanden, einschließlich neu hinzugefügtem HSV-Testspiel, abgeschlossenem Abbruch, kommenden Testspielen und unverändertem Quelldatensatz bei Sortierung.

## Sticky-Header nach Fade-in korrigiert

Die Fade-in-Animation auf .feed-result-space mit animation-fill-mode:both erzeugte einen bleibenden Stacking Context um den fixierten Header. Dadurch konnten die nachfolgenden Karten den Header trotz z-index:40 überdecken. Der Fade liegt jetzt direkt auf .feed-result-header; er hält nach seinem Ende keine Animationsebene fest. Reduced Motion bleibt berücksichtigt.

Browserprüfung vor dem Fix: Header fixed, top=0, Höhe=70px, aber am Headerpunkt lag eine Karte vorne. Nach dem Fix: gleiche Position/Höhe, Wrapper ohne Animation, Header liegt nach dem Scrollen vorne. Produktionsbuild erfolgreich. Keine Spieldaten verändert.

## Öffentlicher Spielplan verlinkt vergangene Ticker

Abgeschlossene Matches erhalten beim Zusammenführen der Daten eine tickerId aus ihrer bestehenden Match-ID. Die gesamte öffentliche Spielkarte verlinkt auf match-tracker.html?ticker=<ID>, einschließlich abgebrochener Spiele. „Ticker ansehen →“ macht die Aktion sichtbar; der Link ist per Tastatur bedienbar und besitzt eine Fokusmarkierung. Zukünftige Termine und reine lokale Ergebnis-Fallbacks ohne bestätigten Match-Datensatz erhalten keinen möglicherweise toten Link. Es werden keine Spieldaten geschrieben.

Validierung: 151 Tests und Produktionsbuild bestanden; Test prüft abgeschlossene und abgebrochene Matches sowie unverlinkte zukünftige Termine und Ergebnis-Fallbacks.

## Taktikgrafik als Ladeanimation

Das vom Nutzer gelieferte Taktikmotiv wurde als skalierbare SVG nachgezeichnet: drei Kreuze, vier Kreise, diagonaler Passpfeil und geschwungene gestrichelte Laufroute. In einem 3,6-Sekunden-Zyklus zeichnet sich zuerst die durchgezogene Linie samt Pfeilspitze, danach die gestrichelte Route samt Pfeilspitze. Eine SVG-Maske erhält die einzelnen Striche während des Zeichnens. Markierungen bleiben statisch. Reduced Motion zeigt das vollständige Motiv ohne Animation. Datenbereitschaft, Timeout und Fade-in bleiben unverändert; keine künstliche Mindestladezeit.

Browserprüfung mit isolierter Ladeansicht: beide Zeichenphasen und vollständiges Motiv sichtbar. Bestehende Loader-Tests und Produktionsbuild erfolgreich. Skript-URL versioniert, damit die neue Grafik nach Neuladen geladen wird.

## Schnellere Animation und Loader auf der Vereinswebseite

Der vollständige Animationszyklus dauert jetzt 1,8 statt 3,6 Sekunden und wiederholt sich unbegrenzt, bis die erforderlichen Daten geladen sind. Ticker und Vereinswebseite teilen public/ticker-loader.css und denselben SVG-Loader. Die Vereinswebseite ersetzt ihren bisherigen klickpflichtigen Splashscreen durch den automatischen Loader. Kader, Nachrichten, Statistiken, Spielplan und Spieltagsprüfung werden parallel abgewartet; anschließend blendet #app ohne bleibenden Stacking Context ein. Bereits vorhandene Fehler-/Fallbackanzeigen der Module bleiben erhalten. Es wird keine Mindestwartezeit erzwungen. Reduced Motion bleibt unterstützt.

Validierung: 151 Tests und Produktionsbuild bestanden. Browser zeigt zunächst ausschließlich „Webseite wird geladen …“ und anschließend die Vereinsinhalte automatisch.
