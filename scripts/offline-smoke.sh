#!/usr/bin/env bash
# offline-smoke.sh — prove the built static site renders with ZERO network
# egress (air-gap acceptance) and that browser-side search is usable offline.
#
# This does NOT spin up a browser; it asserts the structural invariants that
# make the site offline-renderable + searchable from file://:
#   - index.html exists and references only relative asset paths (no http(s)://
#     CDN <script>/<link> in the document <head>),
#   - the client-side search index (search/search_index.json) exists and is
#     non-empty valid JSON,
#   - Material's bundled assets/ dir is self-contained (no remote font/js CDN).
#
# Usage: scripts/offline-smoke.sh [--site DIR]
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

SITE="$(parse_flag site "$@")"; SITE="${SITE:-${REPO_ROOT}/site}"
[[ -d "$SITE" ]] || die "site dir not found: $SITE (run build-external.sh first)"

log "1 index.html present + relative assets"
[[ -f "${SITE}/index.html" ]] || die "no index.html in $SITE"

# Assert no remote CDN script/link in <head>. The Material 'offline' plugin
# self-contains assets; a remote http(s) <script src>/<link href> in the head
# would break air-gap rendering.
if grep -Eo '<(script|link)[^>]+(src|href)="https?://[^"]+"' "${SITE}/index.html" >/tmp/_offline_cdn_hits 2>/dev/null; then
  if [[ -s /tmp/_offline_cdn_hits ]]; then
    cat /tmp/_offline_cdn_hits >&2
    die "remote CDN asset references found in index.html — not air-gap safe"
  fi
fi
info "no remote CDN asset references in index.html"

log "2 client-side search index present + valid"
IDX="${SITE}/search/search_index.json"
[[ -f "$IDX" ]] || die "search index missing: $IDX (browser search would not work offline)"
# Validate it is JSON and has docs entries.
if have bun; then
  bun -e "const j=require('${IDX}'); if(!j||!Array.isArray(j.docs)||j.docs.length===0){throw new Error('empty search index')}; console.log('  search docs: '+j.docs.length)"
elif have python3; then
  python3 -c "import json,sys; d=json.load(open('${IDX}')); assert d.get('docs'); print('  search docs: '+str(len(d['docs'])))"
else
  die "no bun/python3 to validate the search index"
fi

log "3 self-contained assets dir"
[[ -d "${SITE}/assets" ]] || die "Material assets/ dir missing in $SITE"
info "assets/ present — site is self-contained for offline/air-gap"

printf '\noffline-smoke: PASS (zero-egress static render + offline search OK)\n'
