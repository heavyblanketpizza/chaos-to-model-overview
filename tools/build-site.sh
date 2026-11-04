#!/bin/sh
# Assembles the GitHub Pages site in _site/: the page, plus the charts and media it plays.
set -e
cd "$(dirname "$0")/.."
rm -rf _site
mkdir -p _site
cp site/index.html _site/
cp -R assets media _site/
touch _site/.nojekyll
echo "_site/ ready: python3 -m http.server -d _site 8000"
