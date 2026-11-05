# Share & Embed

Eigenes Modul im ursprünglichen Tracker: `public/share-embed.js` und `.css`. Kein Service-Umbau.

„Share & Embed“ öffnet den bestehenden Link-/QR-Dialog mit Formatwahl und kopierbarem iframe-Code. Varianten: Feed (720 px Höhe), Kompakt (440 px), Spielstand (200 px), Spielstand kompakt (100 px), jeweils hell/dunkel. Breite 100%, maximal 600 px. Die Höhen sind Startwerte im erzeugten HTML und können auf der Zielwebsite angepasst werden. Keine automatische iframe-Höhenkommunikation. Nur öffentliche Zuschauerlinks werden eingebettet, kein Reporterzugang. `ticker`, `embed` und `style` sind URL-Parameter; Varianten werden gegen feste Listen geprüft. Dev-Modus bietet ausschließlich eine gekennzeichnete Code-Vorschau, keine Veröffentlichung. Produktivcodes funktionieren nach Veröffentlichung dieser Änderungen und nur für vorhandene öffentliche Ticker.

Bildteilen bereitet eine PNG-Datei asynchron mit `toBlob` vor und zeigt eine Vorschau. Erst ein eigener unmittelbarer Klick auf „Bild teilen“ ruft Web Share mit der fertigen Datei auf; dadurch geht die Benutzeraktivierung nicht beim Laden der Wappen verloren. Dateifreigabe wird über `canShare` geprüft. Download bleibt verfügbar; Abbruch des nativen Dialogs lädt nichts ungefragt herunter. Blob-URLs werden nach Schließen verzögert freigegeben. HTTPS/localhost und Browserunterstützung sind für natives Teilen erforderlich. Das vorhandene Feed-Bildlayout bleibt unverändert.

163 Tests erfolgreich, einschließlich Dateifreigabe beim Klick, Abbruch, Fehlerhinweis, Downloadoption und URL-Encoding. Physisches Smartphone noch nicht geprüft.

## Eigene Galerie
`share-embed.html` zeigt alle acht Kombinationen als echte, lazy geladene Zuschauer-iframes. Auswahl über Ticker-ID oder Zuschauerlink, gespeichert im Seitenparameter. Standardbeispiel ist der bereits bekannte öffentliche Ticker 221205012; keine erfundenen Demodaten. Die Vorschau verwendet die aktuelle Installation, Exportcodes die öffentliche Website. Im Share-Dialog verlinkt und als Vite-Build-Einstieg registriert. Produktionsbuild erfolgreich, echte Einbettung Berghausen–Inter Monheim im Browser geprüft.

Spielstand-Einbettungen scrollen nicht und reagieren nicht auf Scrollpositionen. Der normale Spielstand bleibt vollständig ausgeklappt; „Spielstand kompakt“ (`embed=score-compact`) verwendet dauerhaft den kompakten Header inklusive Uhr/Status. Beide sind im Formatwähler und der Galerie in Hell und Dunkel verfügbar.

Unter Einstellungen sind Automation, Embed und Dev als Unternavigation erreichbar. Embed und Dev öffnen eigene Tabs, damit ein laufendes Spiel im Tracker geöffnet bleibt. Embed übernimmt die aktive Spiel-ID außerhalb des Testmodus.

## crossTracker-Embed (Dev)
`cross-tracker.html` ist ein eigener, im Build enthaltener iframe-Einstieg für die synthetische Vereinskonferenz. Responsive Breite, empfohlene Höhe 720 px, Vollbild mit `allow="fullscreen"`. Dev-Seite und Share-&-Embed-Galerie zeigen die Einbettung samt kopierbarem Code. Gleicher Konferenzcontroller wie im Datenlabor; keine Backend-Verbindungen. Reale Ticker-IDs werden noch nicht unterstützt. Die URL im Code verwendet den aktuellen Host; für externe Seiten muss der Build öffentlich gehostet sein.

Kompakte Mehrspielansicht: `cross-tracker.html?view=compact`. Alle drei Demo-Spiele untereinander, pro Spiel das originale `score-compact`-Embed mit 100 px Höhe. Gesamthöhe 300 px; ohne Konferenzrotation oder Overlay. Beide Varianten mit Vorschau und eigenem Code in Dev/Galerie. Bei weiteren Spielen wächst die Liste; kleinere Einbettungsfenster scrollen die Liste.

Mehrspiel-Embeds unterstützen `view=score` (200 px/Spiel) und `view=score-compact` (100 px/Spiel), jeweils `style=light` oder `style=dark`. Die Galerie enthält alle vier Kombinationen sowie die Konferenz. Bei drei Demo-Spielen beträgt die iframe-Höhe 600 bzw. 300 px. Theme wird an jeden originalen Spielstand-Renderer weitergegeben; Embed-URLs sind HTML-escaped und enthalten eine Referrer-Policy.

Ausklappbare Varianten (hell/dunkel): `view=accordion` öffnet höchstens ein Spiel; `view=expandable` erlaubt mehrere offene Spiele. Jede Zeile hat einen per Tastatur bedienbaren Button mit `aria-expanded` und `aria-controls`. Eingeklappt 100 px, ausgeklappt normaler Spielstand 200 px, zusätzlich 40 px Bedienzeile. Der bestehende iframe schaltet über die ausschließlich im Fixture-Modus verfügbare Renderbrücke um, ohne Reload oder Verlust des Spielstands. Feste Embed-Höhe 520 px; längere Listen scrollen innerhalb des Embeds.

Tor-Simulation: In jeder Galerie-Variante öffnet „Tore simulieren“ dieselbe Einbettung mit `simulate=1` und Buttons je Mannschaft. In Mehrspielansichten wird die betroffene Zeile per FLIP-Animation zuerst einsortiert; danach zeigt ein über der gesamten Einbettung liegender Original-Tracker die Feed-Tor-Card. Nach rund vier Sekunden wird die Liste freigegeben. Weitere Tore werden seriell abgespielt. Normale Embed-Codes bleiben ohne Testbuttons. Die Simulation verwendet weiterhin nur synthetische Daten.

Ein Klick auf einen Spielstand oder dessen Begegnung öffnet den originalen Feed-Ticker inline (600 px, innen scrollbar). Andere Spiele bleiben als schmale Begegnungsheader verfügbar. Klick auf einen anderen Header wechselt den Ticker; erneuter Klick auf den geöffneten Header stellt die Übersicht wieder her. Der iframe bleibt bestehen, nur das Format wechselt zu `feed`. Die Spielstand-Klickfläche ist in der Detailansicht entfernt, damit der Feed bedienbar bleibt.

Aktualisierung: Die separate Aktion „Spielstand ausklappen“ entfällt. „Ticker öffnen“ in der Namenszeile ist der gemeinsame Einstieg. Im kompakten Header werden 30 px für diese dauerhaft sichtbare Zeile reserviert (100 px Gesamthöhe statt 70 px ohne Namenszeile).
