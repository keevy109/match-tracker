# Dev-Datenlabor
Aufruf: `/ticker-dev.html`, verlinkt in Share & Embed. Fünf echte Zuschauer-iframes: leerer Renderer-Input, fachliches Minimum, Maximum, beendet und abgebrochen. Hell/Dunkel umschaltbar, Inputs als JSON aufklappbar.

Die Daten stammen aus `public/ticker-fixtures.js`; Spielverlauf und Vereine sind synthetisch, Spielerbilder vorhandene lokale Beispielbilder. Kommentare benötigen derzeit base64 PNG/JPEG/WebP, deshalb verwendet die Fixture ein eingebettetes PNG.

## Vertrag des bestehenden Trackers
Technisch genügt ein Objekt (auch {}); der Renderer ergänzt Namen und Nullstände. Fachliches Minimum: homeTeam, awayTeam, homeScore, awayScore. Die Transport-ID gehört zum Abruf, nicht zu diesen Renderer-Props. Optionale Gruppen sind Branding, Zeitmodell/Automation, Events, Kader und Teilnehmer/Trainer. Ereignisse haben typabhängige Felder; die Max-Fixture demonstriert die tatsächlich konsumierten Felder. Das ist eine Beschreibung des bestehenden Renderers, kein neuer validierter API-Vertrag.

Maximum umfasst alle unterstützten Zuschauer-Inhaltsarten; nicht sämtliche Service-Module. Gegenseitig ausschließende Zustände wie live/beendet/abgebrochen sind eigene Szenarien. Reporter-Split und Bearbeitung gehören nicht zur Einbettung; Overlays benötigen Ereignisänderungen statt eines initialen Snapshots.

## Isolation
Nur dev=1 zusammen mit fixture aktiviert die feste Fixture-Auswahl. Die Galerie setzt ticker=dev-fixture, wodurch die normale lokale Spielwiederherstellung übersprungen wird. Der Fixture-Start kehrt vor Firebase-Initialisierung und Subscriptions zurück. Keine Spielschreibvorgänge, kein Import echter Ticker. Bestehende externe SDK-Skripte werden weiterhin geladen, aber nicht für die Fixture initialisiert. Unbekannte Fixture zeigt Fehler statt Produktions-Fallback.

Validiert: 166 Tests, Produktionsbuild, Browserdarstellung von Minimum, Maximum mit Automation und Abschlusszuständen.

Gelbe-Karte-Card: Ereignistyp `gelbe-karte`, Felder `id, team, minute`, optional `playerId, playerName, playerPhoto, reason`. Spielerportrait und Name werden bevorzugt aus dem Kader aufgelöst, ohne Spieler wird der Mannschaftsname angezeigt. Im Maximum als Beispiel enthalten. Im Eintragenden-Modus stehen zwei Buttons wie bei der Tor-Erfassung bereit (Heim/Gast). Der Dialog übernimmt die laufende Minute, erlaubt Korrektur (0–480), optional Kaderspieler beim eigenen Team bzw. Freitext beim Gegner und einen optionalen Grund. Speichern verwendet den bestehenden Ereignis-/Sync-Pfad, verändert aber nicht den Spielstand. Zuschauer können keine Karten anlegen. Validierung: 169 Tests und Build erfolgreich.

Gelbe Karten verwenden den neutralen Text-Bild-Stil mit gelbem linken Rand: Name → Gelbe Karte, Portrait rechts, Kartenillustration direkt unter der Minute. Kein TOR!-Text und kein Ergebnis. Der erfasste Grund bleibt im Ereignis gespeichert.

Karten-Erfassung unterstützt Gelb, Gelb-Rot und Rot über die Auswahl „Karte“. Ereignistypen: gelbe-karte, gelb-rote-karte, rote-karte. Gleiche Spieler-/Minutenfelder, kein Einfluss auf den Spielstand. Rot und Gelb-Rot haben roten linken Rand, Gelb-Rot zwei versetzte Karten (Gesamtbreite höchstens 20 px). Keine automatische Umwandlung zweier gelber Karten; die Kartenart wird bewusst ausgewählt. Alle drei Varianten sind im Dev-Maximum enthalten.

Layout-Korrektur: Karten ohne Minute bleiben dreispaltig. Die allgemeine Fullwidth-Regel für Vor-Spielbeginn-Meldungen gilt nicht für Strafkarten. Symbol bleibt sichtbar; Löschen-Button ist absolut positioniert und erzeugt keine zusätzliche Grid-Zeile. Dev-Gelb demonstriert diesen Fall ohne Minute.

## Karten als optionales Feature
Unter Einstellungen → Features & Rechte liegt die neue Seite feature-settings.html. tracker-features.js kapselt die browserlokale Abwahl (separater Schlüssel für dev=1). Buttons und Öffnen/Speichern des Dialogs prüfen dieselbe Einstellung; Storage-Events aktualisieren andere Tabs. Ein Entzug verlangt Bestätigung, historische Cards bleiben sichtbar. Das ist eine Erfassungspräferenz, keine sichere Vertragsberechtigung.

Das vorhandene Service-Paketrecht cards in server/packages.ts bleibt die serverseitige Berechtigungsquelle des Service. Die neue Seite verlinkt lokal auf Port 4319/operator (im Dev-Modus ausdrücklich Operator-Demo). Kein automatisches Verknüpfen der Identitäten des eigenständigen Trackers mit Service-Kunden, keine Bezahl-/Checkout-Funktion und keine Änderung bestehender Paketzuweisungen. Auf öffentlichen Hosts wird keine unbekannte Service-Domain geraten. 171 Tests und Produktionsbuild erfolgreich.
