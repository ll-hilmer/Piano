#!/usr/bin/env bash
# Baut die Webseite für GitHub Pages: index.html bekommt einen vollständigen Dokumentkopf,
# dazu kommen App-Symbole und das Manifest (für "Zum Startbildschirm hinzufügen").
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf _site
mkdir -p _site
{ cat site/head.html; cat index.html; printf '\n</body>\n</html>\n'; } > _site/index.html
cp site/manifest.webmanifest site/*.png _site/
touch _site/.nojekyll
echo "Fertig: _site/index.html"
