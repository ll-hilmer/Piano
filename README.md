# Notenleser

Eine kleine Web-App zum Üben des Notenlesens am Klavier.

## Benutzen

**Im Internet:** https://ll-hilmer.github.io/Piano/
Auf dem Handy oder Tablet über das Browser-Menü „Zum Startbildschirm hinzufügen“ wie eine App ablegen.
Ein E-Piano per USB funktioniert dort direkt in Chrome und Edge.

**Ohne Internet:** `index.html` im Browser öffnen (Doppelklick genügt).

## Veröffentlichung

Jede Änderung auf `main` wird automatisch als Webseite veröffentlicht
(`.github/workflows/pages.yml`, baut mit `site/build.sh`).

## Funktionen

- Einzelnoten, kurze Melodien (zwei Takte) oder Akkorde (Dur- und Moll-Dreiklänge, mit Hilfslinien auch Umkehrungen)
- Violinschlüssel, Bassschlüssel oder beide (Klaviersystem)
- Tonarten von C-Dur bis 6 ♯ und 6 ♭ mit Vorzeichen am Zeilenanfang, auch wechselnd
- Optional zusätzliche Vorzeichen (♯, ♭, ♮) mitten im Stück
- Tonumfang „Im System“ oder „Mit Hilfslinien“
- Antworten per Notenname (C D E F G A H) oder per Klaviertaste (mit richtiger Oktave)
- 60-Sekunden-Test mit Rekord
- Statistik der schwierigsten Noten und Akkorde; diese kommen häufiger dran
- Tastatur-Kürzel C D E F G A H (# für ♯, - für ♭) und MIDI-Keyboard (Chrome/Edge)
- Darstellung automatisch, hell oder dunkel
