# Live-Ticker: Vereinsdarstellung (10.10.2026)

Auslöser: Spiel 221205012 enthielt „Inter Monheim E1“, aber kein Gegnerwappen und keine Gegnerfarbe. Die Zuschaueransicht lud die Vereinsstammdaten nicht nach.

Die Zuschaueransicht abonniert jetzt app/teams. resolveMatch gleicht Mannschaftsnamen mit dem bestehenden suffix-toleranten Vereinsabgleich ab und ergänzt Anzeigename, Wappen (badge/logo) und Primärfarbe (color1/color). Die Auflösung verändert ausschließlich eine Kopie zur Darstellung. Spielstand, Ereignisse, Uhr und Spiel-ID werden nicht geschrieben. Weitere Meldungen aus einem älteren Reporter-Tab können die korrigierte Darstellung daher nicht zurücksetzen.

Bereits offene Zuschaueransichten müssen nach Veröffentlichung einmal neu geladen werden. Der Berichtende muss das Spiel nicht neu starten. Wappen und Farben müssen im Vereinsbestand gepflegt sein.

Validierung: 25 Tests (team-data, persistence, ticker-theme) bestanden; Vite-Produktionsbuild erfolgreich.

## Nachbesserung der Eingabeansicht

Die erste Korrektur deckte die Zuschaueransicht ab. In der Eingabeansicht hing das Nachladen weiterhin am großen globalen Datenabruf; Eingabebuttons verwendeten außerdem den unveränderten Spieltitel. Nun lädt auch der Berichtende Vereinsdaten unabhängig über einen Live-Listener. Nach Eintreffen werden Spieltitel, Torbuttons, Wappen und Farben gemeinsam aktualisiert. Der Listener ruft weder save noch eine Wiederherstellung des Spielstands auf. getMatchTeams löst Namen für Buttons und Exporte ebenfalls auf. Regressionstests prüfen, dass die Aktualisierung ohne Speichern oder Zurücksetzen erfolgt.
