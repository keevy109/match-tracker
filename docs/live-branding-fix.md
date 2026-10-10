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
