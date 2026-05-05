#!/usr/bin/env bash
# sync-content.sh
# After editing shared/content.js, run this to propagate changes to the
# extension and PWA.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "→ Copying shared/content.js to extension/shared/content.js"
cp shared/content.js extension/shared/content.js

echo "→ Generating shared/content.json from shared/content.js"
node -e "
const fs = require('fs');
let src = fs.readFileSync('shared/content.js', 'utf8');
src = src.replace(/\/\/ Usable in both[\s\S]*$/, '');
src = src.replace('const ANCHOR_CONTENT', 'var ANCHOR_CONTENT');
eval(src);
fs.writeFileSync('shared/content.json', JSON.stringify(ANCHOR_CONTENT, null, 2));
"

echo "→ Copying shared/content.json to pwa/src/data/content.json"
cp shared/content.json pwa/src/data/content.json

echo "Done. Reload the extension in Chrome and restart the PWA dev server."
