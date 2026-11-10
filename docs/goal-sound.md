# Torsound im Vereins-Ticker

`match-tracker.html` verwendet `public/goal-sound.js` und die Datei
`public/audio/tor-fuer-uns.mp3`. Die MP3 stammt aus „Tor für uns!.mp3“.

Nur in der Zuschaueransicht fragt beim ersten Öffnen ein vorgelagertes Dialogfenster nach der Erlaubnis für
Torsounds und erklärt den Lautsprecher-Button ganz unten neben dem Hell-/Dunkel-
Schalter. „Ohne Ton“ und Escape lassen den Ton aus. „Torsound erlauben“ schaltet
neue Berghausener Tore frei, ohne hörbaren Testsound. Der runde Footer-Button
schaltet den Ton um; Ausschalten beendet auch die laufende Wiedergabe.
Es gibt keine Test- oder Stopp-Buttons und keinen zusätzlichen Bereich im Feed.
Zuschauer sehen Dialog und Button erst, wenn der Spielstand geladen ist. Bei einem
beendeten oder abgebrochenen Spiel erscheinen beide nicht. Endet ein Spiel, während der
Ticker offen ist, verschwindet der Button. Ein angesetztes, noch nicht angepfiffenes
Spiel (Vorschau mit 0:0 und Anstoßzeit) fragt wie ein laufendes.

Eintragende erhalten keinen Dialog und bedienen ausschließlich den Footer-Schalter.
Bei `dev=1` erscheint der Dialog bei jedem initialen Laden, unabhängig von
der gespeicherten Auswahl. Eingebettete Vorschauen bleiben davon ausgenommen.

Die Wahl wird pro Gerät/Browser gespeichert, getrennt für Zuschauer und Reporter.
Nach Neuladen wird eine erlaubte Wiedergabe bei der nächsten Seiteninteraktion
stumm freigeschaltet, da Browser eine neue Geste verlangen können. Bis dahin zeigt
der Footer-Button den tatsächlich ausgeschalteten Zustand. Bei blockiertem Speicher
funktioniert die Auswahl für die aktuelle Seite. Eingebettete Vorschauen fragen
nicht nach und bleiben stumm. Eine Bluetoothbox wird weiterhin über die
Audioeinstellungen des Geräts als Ausgabe gewählt.

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
