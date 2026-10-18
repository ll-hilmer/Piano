#!/usr/bin/env bash
# Baut die Webseite für GitHub Pages: jede Seite (Heute, Üben, Theorie, Bibliothek) bekommt einen vollständigen Dokumentkopf,
# dazu kommen App-Symbole und das Manifest (für "Zum Startbildschirm hinzufügen").
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf _site
mkdir -p _site
for page in index ueben theorie bibliothek; do
  { cat site/head.html; cat "$page.html"; printf '\n</body>\n</html>\n'; } > "_site/$page.html"
done
cp shared.js shared.css site/manifest.webmanifest site/*.png _site/
touch _site/.nojekyll
echo "Fertig: _site/index.html"
