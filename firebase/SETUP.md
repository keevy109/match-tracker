# Admin-Speicherung auf GitHub Pages

## Verhalten

Die veröffentlichte Vereinswebsite und der Admin lesen dieselben Daten unter
`website/kader`, `website/spielplan`, `website/vereine` und `website/trainer`
im vorhandenen Firebase-Projekt `match-tracker-891ac`.

Wenn eine Sammlung noch nicht existiert, wird die bisher veröffentlichte
JSON-Datei geladen. Die erste erfolgreiche Bearbeitung speichert diese Sammlung
in Firebase. Absichtlich leere Sammlungen bleiben leer. Eine Veröffentlichung
auf GitHub Pages setzt Firebase-Daten nicht zurück.

Die Daten liegen jeweils als `{ "schema": 1, "items": "<JSON-Array>" }` vor.
Der JSON-String erhält leere Listen, null-Werte und die ursprüngliche Reihenfolge.
Bilder werden in den vorhandenen Storage-Bucket unter `website/` hochgeladen.
Bereits vorhandene relative Bildpfade funktionieren weiterhin auf GitHub Pages.

Der lokale Entwicklungsserver verwendet weiterhin `public/data` und lokale
Uploads. Die separate ältere Seite `match-tracker.html` mit ihren Firebase-
Pfaden `app` und `matches` ist von dieser Änderung nicht betroffen.

## Einmalige Einrichtung im vorhandenen Projekt

1. Unter **Authentication → Sign-in method** die Anmeldemethode des bestehenden
   Admin-Kontos aktivieren (E-Mail/Passwort oder Google). Unter **Settings →
   Authorized domains** `keevy109.github.io` eintragen, sofern noch nicht vorhanden.
2. Unter **Authentication → Users** die UID des Admin-Kontos kopieren. Kein
   Passwort oder Service-Account-Schlüssel gehört in den Quellcode.
3. In beiden Beispiel-Regeldateien `REPLACE_WITH_ADMIN_UID` durch diese UID
   ersetzen. Die UID ist kein Passwort.
4. Die vorhandenen Datenbankregeln sichern und den `website`-Abschnitt aus
   `database.rules.example.json` in die vorhandenen Regeln integrieren.
   **Nicht die gesamte Datei über vorhandene Regeln kopieren:** Die Regeln für
   den Live-Ticker (`app`, `matches`) müssen separat erhalten und geprüft werden.
   Ein bereits global gewährtes `.write: true` auf einem übergeordneten Pfad
   würde die neue Beschränkung aushebeln; solche Freigaben müssen zuerst auf die
   jeweils tatsächlich benötigten alten Pfade begrenzt werden.
5. Ebenso den `match /website/...`-Abschnitt aus `storage.rules.example` in die
   vorhandenen Storage-Regeln integrieren. Bereits vorhandene breite Freigaben
   prüfen. Der konfigurierte Bucket muss verfügbar sein; ohne Storage können
   Texte/Zahlen gespeichert werden, neue Bild-Uploads zeigen einen Fehler.
6. Regeln in Firebase prüfen und veröffentlichen. In den Regeln darf ein
   nicht angemeldeter oder anderer Nutzer nicht schreiben; der Admin darf die
   vier genannten Sammlungen und die zugehörigen Bilder schreiben.
7. `npm ci`, `npm test` und `VITE_BASE=/match-tracker/ npm run build` ausführen.
   Nach Veröffentlichung über den vorhandenen GitHub-Pages-Workflow den Admin
   öffnen und anmelden. Eine vorhandene Angabe ändern, speichern und in einem
   zweiten Browser auf der Website nach erneutem Laden prüfen. Danach die
   Teständerung zurücksetzen.

## Fehlerfälle

Der Admin wird bei fehlgeschlagenem Laden nicht mit leeren Ersatzdaten geöffnet.
Fehlgeschlagenes Speichern lässt das Formular offen; der interne Datenstand wird
auf den zuletzt bestätigten Stand zurückgesetzt. Gleichzeitige Änderungen
werden über Firebase-ETags erkannt, sodass ein veralteter Editor keine neueren
Änderungen überschreibt. Die öffentliche Website kann bei einem Firebase-Ausfall
weiter die zuletzt veröffentlichten JSON-Daten anzeigen.

## Verifikation dieser Änderung

`npm test` prüft den Speicherweg mit einer simulierten Firebase-REST-Schnittstelle:
alle vier Sammlungen, erneutes Laden, leere Listen, fehlende Anmeldung,
Schreib-/Lesefehler, konkurrierende Bearbeitung und lokale Speicherung.
Das ersetzt keinen Test mit den tatsächlich veröffentlichten Firebase-Regeln.
