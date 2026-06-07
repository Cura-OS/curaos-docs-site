#!/usr/bin/env bash
# build-techdocs.sh: generate a Backstage-TechDocs-compatible build for one
# service entity from its mirror Markdown.
#
# S4 ships the build HARNESS, not a Backstage runtime deploy and not per-repo
# `docs/`+`catalog-info.yaml` seeded into the 91 service repos (that would
# violate the repo-boundary rule). The harness:
#   1. takes a service name + its mirror docs dir (--service, --docs-dir),
#   2. synthesizes a Backstage `catalog-info.yaml` entity descriptor + a
#      techdocs `mkdocs.yml` in a throwaway workspace,
#   3. runs `@techdocs/cli generate` when available (else `mkdocs build`),
#   4. emits a TechDocs-publisher-ready site under --out.
#
# `@techdocs/cli` is invoked via npx at a pinned version; when it is absent
# (local gate without the optional tool) we fall back to `mkdocs build` so the
# per-service docs still render and the harness is exercised. Never `|| true`.
#
# Usage:
#   scripts/build-techdocs.sh --service NAME --docs-dir DIR [--out DIR] [--owner TEAM]
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

SERVICE="$(parse_flag service "$@")"
DOCS_DIR="$(parse_flag docs-dir "$@")"
OUT_DIR="$(parse_flag out "$@")"
OWNER="$(parse_flag owner "$@")"; OWNER="${OWNER:-platform-team}"

if [[ -z "$SERVICE" ]]; then
  info "no --service supplied; using in-repo examples/techdocs-fixture"
  SERVICE="example-service"
  DOCS_DIR="${REPO_ROOT}/examples/techdocs-fixture/docs"
fi
OUT_DIR="${OUT_DIR:-${REPO_ROOT}/techdocs-site/${SERVICE}}"
[[ -d "$DOCS_DIR" ]] || die "docs dir not found: $DOCS_DIR"
[[ -f "${DOCS_DIR}/index.md" ]] || die "TechDocs requires docs/index.md in: $DOCS_DIR"

WS="${REPO_ROOT}/.build-workspace/techdocs/${SERVICE}"
log "1 synthesize TechDocs workspace for ${SERVICE}"
rm -rf "$WS"; mkdir -p "${WS}/docs"
cp -R "${DOCS_DIR}/." "${WS}/docs/"

cat > "${WS}/catalog-info.yaml" <<YAML
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: ${SERVICE}
  description: CuraOS ${SERVICE} generated TechDocs entity (build-time, not committed to the service repo).
  annotations:
    backstage.io/techdocs-ref: dir:.
spec:
  type: service
  lifecycle: production
  owner: ${OWNER}
YAML

cat > "${WS}/mkdocs.yml" <<YAML
site_name: ${SERVICE} - CuraOS TechDocs
docs_dir: docs
strict: true
theme:
  name: material
plugins:
  - search
markdown_extensions:
  - admonition
  - toc:
      permalink: true
  - pymdownx.superfences
YAML

log "2 generate TechDocs site"
mkdir -p "$(dirname "$OUT_DIR")"

# `@techdocs/cli generate` injects the `techdocs-core` MkDocs plugin into the
# config; that plugin (pip `mkdocs-techdocs-core`) must be installed for it to
# succeed. Use the cli ONLY when that plugin is present (the Backstage publish
# path). Otherwise fall back to a plain `mkdocs build` of the search-only config
# synthesized above, an equivalent render that exercises the harness in the
# local gate without the heavier Backstage toolchain. Never `|| true`.
techdocs_core_present() {
  have python3 && python3 -c "import importlib.util,sys; sys.exit(0 if importlib.util.find_spec('mkdocs_techdocs_core') else 1)" >/dev/null 2>&1
}

if have npx && techdocs_core_present && npx --yes @techdocs/cli@1.10.7 --version >/dev/null 2>&1; then
  ( cd "$WS" && npx --yes @techdocs/cli@1.10.7 generate --source-dir . --output-dir "$OUT_DIR" --no-docker )
  info "generated via @techdocs/cli (techdocs-core present)"
elif have mkdocs; then
  ( cd "$WS" && mkdocs build --strict --site-dir "$OUT_DIR" )
  info "generated via mkdocs (techdocs-core absent, equivalent search-only render)"
else
  die "neither a techdocs-core-enabled @techdocs/cli nor mkdocs is available"
fi

[[ -f "${OUT_DIR}/index.html" ]] || die "TechDocs build produced no index.html in $OUT_DIR"
info "TechDocs site: $OUT_DIR"
printf '\nbuild-techdocs: PASS\n'
