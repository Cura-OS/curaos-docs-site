#!/usr/bin/env bash
# build-external.sh — build the MkDocs Material external/offline static site.
#
# Stages authored Markdown (from --content-dir, the workspace mirror source of
# truth) + optional generated API Markdown (--api-dir) into the build workspace,
# then runs `mkdocs build --strict`. The output (site/) is a self-contained
# offline static site with client-side search — hostable behind NGINX/K8s, on
# GitHub Pages (secondary mirror), or shipped inside a Zarf bundle (air-gap).
#
# Usage:
#   scripts/build-external.sh [--content-dir DIR] [--api-dir DIR] [--out DIR]
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

CONTENT_DIR="$(resolve_content_dir "$(parse_flag content-dir "$@")")"
API_DIR="$(parse_flag api-dir "$@")"
OUT_DIR="$(parse_flag out "$@")"; OUT_DIR="${OUT_DIR:-${REPO_ROOT}/site}"
WORKSPACE="${REPO_ROOT}/.build-workspace/docs"

log "1 stage authored content"
rm -rf "${REPO_ROOT}/.build-workspace"
mkdir -p "$WORKSPACE"
cp -R "${CONTENT_DIR}/." "$WORKSPACE/"
info "staged authored content from: $CONTENT_DIR"

if [[ -n "$API_DIR" && -d "$API_DIR" ]]; then
  info "staging generated API Markdown from: $API_DIR"
  mkdir -p "${WORKSPACE}/api"
  cp -R "${API_DIR}/." "${WORKSPACE}/api/"
fi
# Guarantee the nav anchors exist so --strict does not fail on a sparse content
# dir (the in-repo fixture provides all of them; a real content dir may not).
for sub in install integration operations api; do
  if [[ ! -f "${WORKSPACE}/${sub}/index.md" ]]; then
    mkdir -p "${WORKSPACE}/${sub}"
    printf '# %s\n\n_Section placeholder — populate from the docs-content mirror._\n' \
      "$(printf '%s' "$sub" | tr '[:lower:]' '[:upper:]')" > "${WORKSPACE}/${sub}/index.md"
  fi
done
[[ -f "${WORKSPACE}/index.md" ]] || die "content dir is missing index.md (site home): $CONTENT_DIR"

log "2 mkdocs build --strict (Material, offline + client-side search)"
if have mkdocs; then
  ( cd "$REPO_ROOT" && mkdocs build --strict --site-dir "$OUT_DIR" )
else
  die "mkdocs not installed — run: pip install -r requirements.txt"
fi

log "3 assert offline static output"
[[ -f "${OUT_DIR}/index.html" ]] || die "no index.html in $OUT_DIR"
# Material's client-side search ships a search index; assert it is present so the
# 'browser-side search works offline' acceptance is provable.
if [[ -f "${OUT_DIR}/search/search_index.json" ]]; then
  info "client-side search index present: search/search_index.json"
else
  die "search index missing — browser-side search would not work offline"
fi
info "external static site: $OUT_DIR"
printf '\nbuild-external: PASS\n'
