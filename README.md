# Notenleser

Eine kleine Web-App zum Üben des Notenlesens am Klavier.

## Benutzen

**Im Internet:** https://ll-hilmer.github.io/Piano/
Auf dem Handy oder Tablet über das Browser-Menü „Zum Startbildschirm hinzufügen“ wie eine App ablegen.
Ein E-Piano per USB funktioniert dort direkt in Chrome und Edge.

**Ohne Internet:** `index.html` im Browser öffnen (Doppelklick genügt).

## Musiktheorie

`theorie.html` (im Internet: https://ll-hilmer.github.io/Piano/theorie.html): Grundlagen von Notensystem bis Umkehrungen,
Rhythmus (Punkte, Bögen, Triolen, Synkopen), Dynamik und Artikulation, Wiederholungen mit Ablaufplänen,
dazu Quintenzirkel (interaktiv, mit Fingersätzen je Tonleiter), Stufen und Funktionen, Kadenz in jeder Tonart, Moll-Tonleitern, Septakkorde, typische Akkordfolgen sechs Begleitmuster für die linke Hand sowie Pentatonik und 12-Takt-Blues zum Mitspielen,
jeweils mit Notenbeispielen zum Anhören. „Jetzt üben“-Knöpfe öffnen die App direkt mit der passenden Übung (Adresse mit `#ueben-…`).

## Veröffentlichung

Jede Änderung auf `main` wird automatisch als Webseite veröffentlicht
(`.github/workflows/pages.yml`, baut mit `site/build.sh`).

## Funktionen

- Einzelnoten, kurze Melodien (zwei Takte) oder Akkorde (Dur- und Moll-Dreiklänge, mit Hilfslinien auch Umkehrungen)
- **Stücke**: echte, gemeinfreie Stücke vom Blatt (Ausschnitte), sortiert nach Kategorien: Bekannt aus Filmen (Pachelbel, Satie, Tschaikowsky), Episch & dramatisch (Grieg, Mozart, Beethoven), Klassik (Für Elise, Kleine Nachtmusik, Bach-Präludium) und Traditionals (Greensleeves, Amazing Grace, Auld Lang Syne). Originaltonart und -takt mit Auftakt, Pausen, Punktierungen, Haltebögen und Vorzeichen bis zum Taktstrich. Im Takt mit Metronom (das Notenbild rückt Takt für Takt weiter, Tempo je Stück frei wählbar) oder Note für Note; danach das ganze Stück mit Auswertung
- **Akkordsymbole**: Symbole wie Am, G7, Cmaj7, Dsus4 oder F/A lesen und die Töne wählen oder spielen (am E-Piano in beliebiger Lage, bei Slash-Akkorden muss der Basston unten liegen). Stufen: Dur & Moll, + Septakkorde, + sus, vermindert, Slash
- **Metronom** mit frei eingebbarem Tempo (30–240), Taktart, Tempo tippen und Schlaganzeige; das Übungstempo ist ebenfalls frei eingebbar
- Violinschlüssel, Bassschlüssel oder beide (Klaviersystem)
- Tonarten von C-Dur bis 6 ♯ und 6 ♭ mit Vorzeichen am Zeilenanfang, auch wechselnd
- Optional zusätzliche Vorzeichen (♯, ♭, ♮) mitten im Stück
- Tonumfang „Im System“ oder „Mit Hilfslinien“
- Antworten per Notenname (C D E F G A H) oder per Klaviertaste (mit richtiger Oktave)
- 60-Sekunden-Test mit Rekord
- Statistik der schwierigsten Noten und Akkorde; diese kommen häufiger dran
- Tastatur-Kürzel C D E F G A H (# für ♯, - für ♭) und MIDI-Keyboard (Chrome/Edge)
- Darstellung automatisch, hell oder dunkel
