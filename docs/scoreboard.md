# Scoreboard-Modul im ursprünglichen Tracker

Ab 1024 px ersetzt ein zweispaltiges Dashboard die rechtsbündige Darstellung. Links: Spielstand, Uhr, Spielzeitkonfiguration, Ereignisbuttons, Teilen und Spielabschluss. Rechts: Feed, maximal 600 px breit. Der linke Bereich bleibt sticky und kann bei geringer Fensterhöhe selbst scrollen. Der Gesamtrahmen ist auf 1280 px begrenzt.

Unter 1024 px bleibt die zentrierte 600-px-Ansicht mit kompakt werdendem Sticky-Header erhalten. `public/scoreboard.css` kapselt die Darstellung; `public/scoreboard.js` stellt den Breakpoint bereit und verschiebt bestehende Export-/Abschlusscontrols mit Rückkehrmarkern. Keine geklonten IDs, keine eigene Spielzustandsverwaltung. `updateFeedScrollState` deaktiviert die Kompaktanimation ausschließlich im Desktop-Splitscreen.

Der Service ist nicht betroffen. 163 bestehende Tests und Produktionsbuild erfolgreich. Desktopaufteilung bei 1280 px sowie mobile Ansicht im Browser geprüft.

Zuschauer bleiben bei jeder Fensterbreite in der zentrierten einspaltigen Ansicht (maximal 600 px), inklusive kompakter Sticky-Uhr. Splitscreen gilt nur für Eintragende. Der Dev-Ansichtswechsel aktualisiert das Layout unmittelbar ohne Neuladen.

## Aktualisiertes Desktoplayout
Eintragende ab 1024 px: gesamte Fensterbreite, 300 px hoher Spielstand-Header über beiden gleich breiten Spalten. Darunter links Steuerung einschließlich Teilen, Abschluss und „Alle löschen“, rechts der Feed. Die ursprünglichen DOM-Positionen werden beim Wechsel zu Mobil/Zuschauer wiederhergestellt. Zuschauer bleiben zentriert bei maximal 600 px. Produktionsbuild erfolgreich und Desktopansicht bei 1280 px visuell geprüft.

## Scrollverhalten im Splitview
Die Eintragenden-Desktopansicht ist auf die Fensterhöhe begrenzt. Die rechte Feedspalte scrollt unabhängig; ihr Scrollstand steuert die Verkleinerung des Headers von 300 auf 100 px. Die linke Bedienung besitzt bei Platzmangel ihren eigenen Scrollbereich. Scrollbewegungen werden nicht an den Body weitergereicht. Mobil/Zuschauer bleiben unverändert. 163 Tests und Build erfolgreich; Einklappen beim Scrollen im Browser geprüft.

## Touch-to-score (23.10.2026)
Eigenes Präsentationsmodul public/touch-scoreboard.js/.css, geöffnet über Scoreboard in der Tracker-Navigation oder ?dev=1&scoreboard=1. Keine Zuschauer-URLs. Zwei große Teamflächen zählen Tore ohne Kaderzuordnung, 400-ms-Doppeltap-Schutz, letzte Toraktion rückgängig, Start/Pause, bestätigter Abpfiff, Browser-Vollbild mit Fallback. Landscape und Portrait behalten zwei Touch-Flächen; Fensterhöhe und Safe Areas werden berücksichtigt.

TrackerScoreboard delegiert an addGoal, deleteEvent, toggleTimer, startMatchFromSchedule, endCurrentMatch und save. Kein zweiter Datenbestand. Vorhandene Spiele laufen unverändert weiter; zum Erweitern Zum Ticker wählen. Ohne aktives Spiel: Gegner und Spielzeit (zwei Abschnitte); eigener Verein stammt aus bestehendem Unterbau. Kein anonymes SaaS-Onboarding oder neue Zahlungslogik. Service-Paketfreigaben bleiben im Service; dieser lokale Tracker-Modus vergibt keine Rechte.

Testmodus bleibt im bisherigen Dev-Speicher, normale Spiele nutzen den bestehenden Sync. Zuschauer, ungeladener Speicher und laufende Spielwechsel dürfen keine Touch-Kommandos ausführen.

Touch-Design: Wappen wie in der Tor-Card rechts unten übergroß, angeschnitten und mit 40 % Deckkraft hinter dem Inhalt. Ergebnis-Schrift dreifache Ausgangsgröße (60vmin statt 20vmin), bei mehrstelligen Ergebnissen auf verfügbare Teamflächenbreite begrenzt.

## Drei explizite Ansichten
Touch bleibt Reporter-Bedienung. Zuschauer wählen im normalen Feed „Scoreboard · Mobil“ oder „Scoreboard · TV“. Deep-Links: ticker=ID&scoreboard=mobile bzw. scoreboard=tv. Beide sind reine Anzeige ohne Schreibbefehle. viewer-scoreboard.js projiziert den bereits live aktualisierten Header per MutationObserver; keine zweite Verbindung oder separate Spielberechnung. Mobil optimiert iPhone quer, TV blendet Navigation nach Inaktivität aus (Pointer/Tastatur/Fokus zeigen sie). Escape/Zum Feed kehrt zurück; Vollbild ist browserabhängig. Embed-Feeds zeigen keine zusätzliche Navigation, explizite Deep-Links funktionieren auch mit Fixtures. Im Dev-Maximum sind beide Links vorhanden. Feature-/Paketfreigabe der Varianten ist noch nicht separat angebunden.

## Anonymer Einstieg
`scoreboard.html` führt direkt zu `match-tracker.html?scoreboard=guest`. Mannschaft, Gegner und Spielzeit genügen. Kein Login, kein PIN und keine Firebase-Initialisierung: Tore und Uhr verwenden weiterhin die bestehenden Tracker-Kommandos. Der getrennte LocalStorage-Schlüssel `matchtracker_scoreboard_guest_v1` verhindert Änderungen an bestehenden Reporter- oder Testspielen. Neuladen erhält das Spiel. Beim erneuten Öffnen werden Daten nach 24 Stunden ohne Speicherung verworfen; „Spiel verwerfen“ löscht sie sofort nach Bestätigung. Browserdaten löschen entfernt das Spiel ebenfalls.

Das lokale Spiel ist nicht über andere Geräte teilbar. Kontoübernahme, Live-Freigabe und Paketbuchung sind noch nicht angebunden. Die Zuschaueransichten Mobil/TV bleiben Ansichten bestehender veröffentlichter Ticker.

## Toranimation
Touch (auch anonym), Mobil und TV zeigen nach einem neuen Tor für drei Sekunden die originale Feed-Tor-Card innerhalb der Fläche der erfolgreichen Mannschaft. Die gegnerische Fläche bleibt sichtbar; danach kehrt der Spielstand zurück. `showScoreboardGoalCard` nutzt `buildEventItemHtml` ohne Reporterbuttons und die bestehenden Card-Styles. Kein Modal, kein zweiter Card-Renderer. Die Ereigniswarteschlange erhält mehrere Tore in Reihenfolge. Andere Ereignisse öffnen im Scoreboard kein Modal. Der verdeckte Feed wird nicht gescrollt. Historische Tore werden beim Öffnen nicht abgespielt. Die Card liegt innerhalb der Scoreboard-Ansicht und funktioniert dadurch auch im nativen Vollbild.

Die Scoreboard-Animation übernimmt die gerenderte Feed-Card inklusive aufgelöster Spielerdaten, entfernt nur Bearbeitungsbuttons und spielt dieselbe `feed-goal-animate`-Animation. Breite maximal 600 px und Feed-Typografie werden gegenüber geerbten Touch-Button-Styles abgesichert. Fehlt die Feed-Card, dient der gemeinsame Renderer als Fallback.

## Mehrere Displays: Heim/Gast
Derselbe Zuschauer-Ticker kann über `scoreboard=tv&side=left` (Heim) und `scoreboard=tv&side=right` (Gast) auf zwei Fenstern/TVs angezeigt werden. Ohne `side` bleiben beide Mannschaften sichtbar; unbekannte Werte fallen auf beide zurück. Jede Seite füllt ihre Anzeige, Uhr und Status bleiben auf beiden vorhanden. Die TV-Navigation enthält direkte Links für beide Teilansichten, ebenso die Maximum-Fixture im Datenlabor. Tore erscheinen ausschließlich auf der zugehörigen Seite. Beide Fenster abonnieren dieselbe Ticker-ID; es entsteht kein neues Spiel. Netzwerkzustellung und lokale Uhren sind nicht framegenau synchronisiert. Dies ist die erste Aufteilung in zwei Mannschaftsflächen, noch keine frei konfigurierbare Videowand mit beliebig vielen Segmenten.
