# Feature-Merkliste

## crossTracker – Vereinskonferenz

Erfasst am 23.10.2026. Status: zukünftiges Modul, noch nicht umgesetzt.

Ein Verein mit mehreren Mannschaften kann mehrere zeitgleich laufende Spiele und deren einzelne Ticker in einem gemeinsamen Vereinstracker zeigen. Vorbild ist eine Bundesliga-Konferenz.

- Der Vereinstracker wechselt in Sequenzen automatisch zwischen den laufenden Spielen.
- Wichtige Ereignisse wie Tore unterbrechen die normale Reihenfolge und holen das betreffende Spiel in den Vordergrund.
- Grundlage sind die bestehenden Einzelspiel-Ticker der Mannschaften des Vereins.

Bei der Ausarbeitung zu klären: Dauer und Reihenfolge der Sequenzen, Prioritäten bei gleichzeitigen Ereignissen, Rückkehr zur Rotation nach einem Ereignis sowie Auswahl der teilnehmenden Mannschaften. „In den Vordergrund“ meint hier die Konferenzansicht; externe Push-Benachrichtigungen sind damit noch nicht festgelegt.

## crossTracker · Dev-Prototyp
Im Ticker-Datenlabor (`ticker-dev.html`) ist die Vereinskonferenz mit U11, U13 und Frauen umgesetzt: drei persistente Original-Ticker-Iframes, Hauptansicht und zwei seitliche Overlays, Rotation alle 10 Sekunden (pausierbar), manuelle Auswahl und Tor-Simulation. Tore priorisieren ein Spiel für 6 Sekunden; eine Warteschlange erhält mehrere Ereignisse. Mobil stehen Seitentracker unter der Hauptansicht.

`public/cross-tracker-dev.js/.css` kapseln die Demo. Der Fixture-Zweig stellt ausschließlich mit `dev=1&fixture=max&crossdev=1` eine Same-Origin-Renderbrücke bereit. Kein Firebase und keine Änderung gespeicherter Spiele. Reale Vereinszuordnung, Live-Abonnements, Rechte/Pakete und Produktivbetrieb sind noch anzubinden.
