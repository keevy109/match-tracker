# Torsound im Vereins-Ticker

`match-tracker.html` verwendet `public/goal-sound.js` und die Datei
`public/audio/tor-fuer-uns.mp3`. Die MP3 stammt aus „Tor für uns!.mp3“.

Zuschauer aktivieren den Torsound unter dem Spielstand. Die Aktivierung spielt
die Datei einmal als Test und schaltet anschließend neue Berghausener Tore frei.
Das Eintragungsgerät besitzt einen unabhängigen Schalter am gleichen Ort.
Eine Bluetoothbox wird in den Audioeinstellungen des Geräts gekoppelt und als
Ausgabe gewählt. „Testen“ spielt nur eine Probe, „Stoppen“ beendet die aktuelle
Wiedergabe, „Torsound ausschalten“ deaktiviert außerdem weitere automatische
Wiedergaben. Nach jedem Neuladen muss der Ton erneut aktiviert werden.

Neue bestätigte Tore werden über Ereignis-ID und Heim-/Auswärtszuordnung erkannt.
Eigentore zählen für die begünstigte Mannschaft. Der erste Zuschauer-Snapshot
bleibt stumm, ebenso Korrekturen, gelöschte/wiederkehrende IDs, Kommentare,
Gegentore und eingebettete Vorschauen. Beim Eintragen startet die Datei erst nach
erfolgreicher Firebase-Übertragung. Der lokale Testmodus spielt ohne Übertragung.
Die Datei ist bewusst nur für Spiele der eigenen Mannschaft Berghausen aktiv.

Während die Seite verborgen ist, werden keine neuen Töne gestartet und laufende
Töne gestoppt. Ereignisse, deren Zeitstempel mehr als 30 Sekunden zurückliegt,
werden nicht nachgespielt. Das verhindert alten Torjubel bei Wiederverbindungen;
bei langer Verzögerung kann deshalb ein Ton ausbleiben. Die Seite muss geöffnet
und sichtbar bleiben. Wiedergaben verschiedener Geräte sind nicht synchronisiert.
Bei Browserblockaden oder Ladefehlern erscheint ein Hinweis zur erneuten Aktivierung.

Prüfung: `node --test tests/*.test.cjs` und `npm run build`.
Ein Bluetoothgerät und mobile Browser müssen auf echten Geräten geprüft werden.
