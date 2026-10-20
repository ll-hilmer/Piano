# Notenleser

Private Klavier-App: Notenlesen üben, Theorie nachlesen und (im Aufbau) die eigenen Noten verwalten.

## Aufbau

| Seite | Inhalt |
|---|---|
| `index.html` – **Heute** | Stück des Tages aus den eigenen Noten (Wiederholungsplan), als Nächstes fällige Stücke, Weiter üben, Schnellstart, Übungstage (Serie mit einem Joker-Tag pro Woche, Woche, Kalender), Google-Drive-Konto |
| `ueben.html` – **Üben** | alle Übungen (bisher `index.html`; alte Links mit `#ueben-…` werden weitergeleitet) |
| `bibliothek.html` – **Bibliothek** | eigene Noten: PDF-Import (auch mehrere per Drag & Drop), Scannen (Ecken ziehen, entzerren, „Saubere Noten“), Angaben (Komponist, Genre, Schwierigkeit, Stand: Offen / Lerne ich / Holprig / Sitzt, Sammlungen), Suche, Filter; Bewertung nach dem Spielen (lief gut / holprig / vergessen) mit Wiederholungsplan; Notenansicht mit zwei Seiten im Querformat, halbem Umblättern, Blätterpedal, Zoom, Bildschirm bleibt an, offline; Mitspielen wie bei Synthesia oder Flowkey mit einer MIDI-Datei je Stück (fallende Noten oder mitlaufendes Notenblatt mit Violin- und Bassschlüssel, Wartemodus am E-Piano, Im Tempo mit Trefferquote, Anhören, Hände einzeln, Tempo, Schleife, schwierigste Takte; MIDI-Datei liegt neben dem PDF in Drive); Lieblingsstücke mit Stern (Filter „Favoriten“); mehrere Stücke auswählen und gemeinsam ändern (Favorit, Stand, Schwierigkeit, Komponist, Genre, Sammlungen, Wiederholungsplan, Löschen); Ränder zuschneiden (automatisch oder von Hand, je Stück); Metronom mit Tempo je Stück; Übestellen aus Klammerpaaren mit Tempo-Plan (Start, Ziel, Schritt), auch auf „Heute“; Markierungen mit Apple Pencil, Maus oder Finger (Stift mit Druckstärke, Textmarker, Radierer, Text, Fingersatz 1–5, Rückgängig) sowie Haken, Kreuz, Übe-Klammern und Sprungmarken (mit Rücksprung) als eigene Ebene, je Stück als kleine Datei im versteckten Drive-Bereich abgeglichen; PDFs im Drive-Ordner „Klavier-App“, Kopie auf jedem Gerät |
| `theorie.html` – **Theorie** | Musiktheorie mit Notenbeispielen |
| `shared.js`, `shared.css` | Navigation mit Symbolen, Hell/Dunkel, Abgleich über Google Drive |
| `sw.js` | Offline-Speicher der App (Service Worker); Version wird beim Bauen gesetzt |
| `vendor/` | PDF.js 3.11.174 (Mozilla, Apache-2.0) für die Notenansicht, jsPDF 2.5.1 (MIT) für Scans |

## Abgleich über Google Drive

Fortschritt, Statistik, Übungstage und Einstellungen werden in einer versteckten Datei im eigenen Google Drive
(App-Datenordner) gespeichert und zwischen PC und iPad zusammengeführt; für die Noten legt die App den Ordner „Klavier-App“ an.
Die App sieht nur diese beiden Dinge (Berechtigungen `drive.appdata` und `drive.file`). Anmeldung per Weiterleitung zu Google,
die Anmeldung gilt jeweils eine Stunde und wird beim Öffnen der Startseite still erneuert.
Einrichtung (Client-ID aus der Google Cloud Console) Schritt für Schritt auf der Startseite unter „Google Drive“.

## Benutzen

**Im Internet:** https://ll-hilmer.github.io/Piano/
Auf dem Handy oder Tablet über das Browser-Menü „Zum Startbildschirm hinzufügen“ wie eine App ablegen.
Ein E-Piano per USB funktioniert dort direkt in Chrome und Edge.

**Ohne Internet:** `ueben.html` im Browser öffnen (Doppelklick genügt).

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
