# Matchtracker: Spielzeit und Wortschatz

Stand: 22.10.2026. Gilt ausschließlich für den bestehenden Matchtracker (`match-tracker.html`), nicht für den Service.

`public/match-timing.js` ist ein unabhängiges, ohne DOM/Firebase testbares Modul. Browser: `MatchTiming`, Node: CommonJS-Export. Die Oberfläche ist der Adapter; Firebase und Gerätespeicher übernehmen den Zustand im Feld `matchTiming` mit dem restlichen Spiel-Snapshot.

- `configure({count,minutes,breaks,message})`: 1–4 Abschnitte; gleiche Dauer je Abschnitt (1–120 Minuten), getrennte Pausendauern (0–60 Minuten), optionale Nachricht (240 Zeichen). Unterscheidet Spiel, Halbzeiten, Drittel, Viertel.
- `describe(state,elapsed,options)`: liefert Uhrtext, Ereignisminute und Wortschatz-basierten Informationstext mit Ergebnis und optionaler Nachricht. Reine Berechnung; now ist für Tests injizierbar.
- `endPeriod(state,elapsed,now)`: speichert die tatsächliche bisherige Spielzeit, rückt zum nächsten Abschnitt vor und beginnt die geplante Pause.
- `resume(state)`: beendet die Pause. Der Reporter startet die Uhr ausdrücklich; keine automatische Veröffentlichung und kein automatischer Anpfiff.
- `vocabulary`: zentraler deutscher Wortschatz für Abschnitte, Pause und Nachspielzeit.

Beispiel 2 × 25 Minuten: bei 26:12 tatsächlicher Spielzeit zeigt die Uhr `25:00 +1:12`. Nach Abschnittsende und Wiederanpfiff beginnt der zweite Abschnitt bei `25:00`, die zuvor gespielte Nachspielzeit wird nicht nochmals auf seine Sollzeit addiert. Ereignisminuten nutzen dieselbe Abschnittsrechnung. Pausen verbrauchen keine Spielzeit; ihr Countdown basiert auf der Wandzeit und übersteht Neuladen.

Ein manueller Klick auf „Pause“ stoppt nur die Uhr. „Abschnitt beenden & Pause“ ist eine bestätigte Abschnittsgrenze. Vor dem ersten Start müssen Dauer und Pausen übernommen werden, danach sind sie festgeschrieben. Beim letzten Abschnitt beendet der Reporter das Spiel mit der bisherigen Abschlussfunktion.

Textbeispiel: „Ergebnis: 0:0. 1. Halbzeit · noch 1 Minute bis zur Halbzeit.“ Texte werden live angezeigt, nicht sekündlich als neue Events in Firebase geschrieben. Benutzertext wird mit textContent ausgegeben. Die Darstellung steht außerhalb des kompakten Sticky-Headers, damit dessen Größenberechnung unverändert bleibt.

Bestehende Spiele ohne matchTiming behalten ihre bisherige Uhr. Für schon laufende Spiele wird weder ein Format geraten noch die Zeit zurückgesetzt. Neue Spiele bekommen die Konfiguration vor Anpfiff. Lokaler Speicher, Firebase-Snapshot und Wiederaufnahme tragen das Feld gemeinsam.

Validierung: Modulgrenzen, Nachspielzeit, Abschnittswechsel, Pausenende, Drittel/Viertel, Wortschatz und bestehende Ticker-Tests.

Prüfstand 22.10.2026: 159 automatisierte Tests und Produktionsbuild erfolgreich. Nachspielzeitanzeige sowie Erhalt der Konfiguration nach Neuladen im lokalen Dev-Ticker geprüft. Abschließende Browserprüfung des Pausenwechsels durch eine unterbrochene Browserverbindung nicht abgeschlossen.

## Gesamtspielzeit und visuelle Formatwahl

Die Oberfläche übergibt die Gesamtspielzeit ohne Pausen (`duration`, Minuten), die gewählte Aufteilung (`count`) und gegebenenfalls Pausendauern. `configure(50)` genügt für die Standardaufteilung in zwei Halbzeiten à 25 Minuten mit zehn Minuten Pause. `configure({duration:60,count:3,breaks:[5,5]})` erzeugt drei Drittel à 20 Minuten. Die bisherige `minutes`-Schnittstelle bleibt für bestehende Integrationen kompatibel.

`plan({duration,count})` liefert die berechnete Aufteilung samt Vorschautext. Vier auswählbare Varianten visualisieren durchgehendes Spiel, Halbzeiten, Drittel und Viertel. Die Gesamtzeit muss in ganze Minuten pro Abschnitt aufteilbar sein. Formatwechsel erhalten bereits eingegebene Pausen, soweit vorhanden.

Bestätigte Produktentscheidung: Abpfiff/Abschnittsende bestätigt der Reporter. Zeitgrenzen lösen automatisch Nachspielzeitanzeige und passende Texte aus, stoppen aber keine laufende Spielzeit. Wiederanpfiff bleibt ausdrücklich ausgelöst. Ergebnis und aktuelle Uhr sind Laufzeitdaten des Tickers; dafür braucht es keine zusätzliche manuelle Texteinstellung.

## Automatische Nachrichten und Zweisprachigkeit

`public/match-texts.js` ist das eigenständige, DOM-freie Modul für Textbausteine, Validierung und Regelauswertung. `public/match-text-editor.js` bildet den visuellen Editor ab. Die Konfiguration liegt in `matchTiming.automation` und wird mit dem bestehenden Spiel-Snapshot gespeichert und an Zuschauer übertragen.

Im aufklappbaren Bereich vor Anpfiff: Nachrichtensprache DE/EN, Regeln hinzufügen/deaktivieren/entfernen, Zeitpunkt oder Zeitraum, Bezug (offizielle Spielzeit seit Beginn / vor nächster Pause / vor regulärem Spielende), Spielstand (beliebig / 0:0 / unentschieden) und Textbaustein wählen. Bausteine werden getrennt auf Deutsch und Englisch gepflegt und von mehreren Regeln wiederverwendet. Verwendete Bausteine lassen sich erst nach Änderung der zugehörigen Regeln entfernen. Beide Übersetzungen sind Pflicht; unbekannte Platzhalter werden abgewiesen. Maximal je 30 Regeln und Texte, 500 Zeichen pro Übersetzung.

Platzhalter: `{score}`, `{remaining}` (aufgerundete Restminuten im Abschnitt), `{minute}` (abgelaufene offizielle Spielminuten), `{period}` (Abschnittsnummer). Ausgabe erfolgt als Text, nicht HTML. Beispielregel: 0:0 UND eine Minute vor der nächsten Pause → „Noch keine Tore: 0:0. Noch 1 Minute bis zur Pause.“

Zeitpunkte sind minutenlange Anzeigefenster: „1 Minute vor Pause“ gilt bei 1–60 Restsekunden. Zeiträume schließen beide gewählten Minuten ein. Regeln laufen nur bei laufender Spieluhr; nicht vor Anpfiff, in Pausen oder nach Abschluss/Abbruch. Vor-Pause-Regeln gelten nicht im letzten Abschnitt, Vor-Ende-Regeln nur dort. Mehrere Treffer werden in Reihenfolge angezeigt, identische Texte einmal. Keine dauerhaften Feed-Events: Neuladen berechnet den aktuellen Hinweis neu, verpasste Fenster werden nicht nachträglich veröffentlicht. Ein Tor lässt eine nicht mehr passende Spielstandbedingung sofort entfallen.

Die Sprachwahl gilt aktuell für benutzerdefinierte automatische Nachrichten; die bestehende Ticker-Oberfläche und Zeitbeschreibungen bleiben deutsch. Konfiguration vor Anpfiff, danach unverändert. 162 Tests und Produktionsbuild erfolgreich; die neue Editor-Oberfläche ist noch nicht visuell im Browser abgenommen.

## Einstellungen statt Spielkonfiguration (22.10.2026)

Der Menüpunkt „Einstellungen“ enthält jetzt den Automationseditor mit eigenem Speichern. Die Vorlage liegt getrennt vom Spiel in `matchtracker_automation_v1` (Dev: `matchtracker_dev_automation_v1`) im lokalen Browser. Künftig konfigurierte Spiele übernehmen eine unabhängige Kopie. Bereits konfigurierte Spiele behalten ihre Automationsregeln, auch beim erneuten Übernehmen der Spielzeit. Nicht gespeicherte Editoränderungen beeinflussen kein Spiel. Geräteübergreifende Synchronisation der Vorlage ist derzeit nicht enthalten; die Spielkopie wird weiterhin mit dem Ticker übertragen.

Pausendauern und Pausen-Countdown wurden aus der Oberfläche entfernt. Abschnittsende und Wiederanpfiff bleiben manuell. „Vor der nächsten Pause“ bezeichnet weiterhin das Ende eines Spielabschnitts; dazu ist keine Pausenlänge nötig. Alte gespeicherte `breaks`-Felder bleiben kompatibel, haben jedoch keine Wirkung auf die Anzeige. Diese Änderung ersetzt die früheren Angaben zur Pflege je Spiel und zum Pausen-Countdown.

Zuschaueransicht: Timing-Infos sind vorerst ausgeblendet (auch in der Dev-Zuschauervorschau). Die Uhr und ihre Nachspielzeitanzeige bleiben sichtbar; der Eintragende sieht die Timing-Infos weiterhin.

### Fehlerdiagnose und Vorschau
Automatische Nachrichten besitzen jetzt einen eigenen sichtbaren Bereich `automationInfo`; das Ausblenden der technischen Timing-Infos versteckt sie nicht mehr. Unter Einstellungen erlaubt „Regeln testen“ eine Simulation von Spielstand, abgelaufener Spielzeit, Restzeit und letztem/nicht letztem Abschnitt ohne Spieländerung. Im Browser mit 0:0 und einer Restminute erfolgreich geprüft. „Gespeicherte Vorlage ins aktuelle Spiel übernehmen“ ersetzt nach Bestätigung ausschließlich dessen Automationskonfiguration; Timer und Ereignisse bleiben erhalten. Das ist eine ausdrückliche Ausnahme zur Standardregel „nur zukünftige Spiele“.
