#!/usr/bin/env bash
# download-fonts.sh
# Downloads EB Garamond and Manrope (woff2) from Google Fonts static servers.
# This is a one-time setup step — fonts are self-hosted, never loaded from CDN at runtime.

set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

EXT_FONTS="$REPO_ROOT/extension/fonts"
PWA_FONTS="$REPO_ROOT/pwa/public/fonts"
mkdir -p "$EXT_FONTS" "$PWA_FONTS"

echo "Downloading EB Garamond (Regular + Italic)…"

# These are the static woff2 file URLs from fonts.gstatic.com
# To find current URLs: visit fonts.google.com, inspect the @font-face CSS for the font

curl -sSL -o "$EXT_FONTS/EBGaramond-Regular.woff2" \
  "https://fonts.gstatic.com/s/ebgaramond/v26/SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUA4V-e6yHgQ.woff2"

curl -sSL -o "$EXT_FONTS/EBGaramond-Italic.woff2" \
  "https://fonts.gstatic.com/s/ebgaramond/v26/SlGWmQSNjdsmc35JDF1K5GRwSDw_ZgPG-FAn1xbT_gFxKR0.woff2"

echo "Downloading Manrope (Regular + Medium)…"

curl -sSL -o "$EXT_FONTS/Manrope-Regular.woff2" \
  "https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk59FN_C-bnX9Q.woff2"

curl -sSL -o "$EXT_FONTS/Manrope-Medium.woff2" \
  "https://fonts.gstatic.com/s/manrope/v15/xn7_YHE41ni1AdIRqAuZuw1Bx9mbZk6FE9_C-bnX9Q.woff2"

echo "Copying fonts to PWA…"
cp "$EXT_FONTS"/*.woff2 "$PWA_FONTS/"

echo ""
echo "Done. Fonts installed in:"
echo "  extension/fonts/"
echo "  pwa/public/fonts/"
echo ""
echo "Reload the Chrome extension and restart 'npm run dev' for the PWA."
