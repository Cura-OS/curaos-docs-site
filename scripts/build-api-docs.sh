#!/usr/bin/env bash
# build-api-docs.sh — generate TypeScript API docs as Markdown via TypeDoc.
#
# TypeDoc + typedoc-plugin-markdown emit Markdown API docs for a TypeScript
# package's public entrypoint. Output is written to --out (the caller points this
# at the workspace mirror `ai/curaos/<package>/docs/api/` so the docs join the
# doc graph). This script intentionally takes paths as args — it never hardcodes
# a workspace path (repo-boundary rule).
#
# Usage:
#   scripts/build-api-docs.sh --entry PATH/to/index.ts --tsconfig PATH --out DIR [--name NAME]
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

ENTRY="$(parse_flag entry "$@")"
TSCONFIG="$(parse_flag tsconfig "$@")"
OUT_DIR="$(parse_flag out "$@")"
NAME="$(parse_flag name "$@")"; NAME="${NAME:-API}"

# Fixture fallback: when no entry is supplied, document the in-repo example TS so
# the generator is exercisable standalone in the local gate.
if [[ -z "$ENTRY" ]]; then
  info "no --entry supplied; using in-repo examples/api-fixture"
  ENTRY="${REPO_ROOT}/examples/api-fixture/index.ts"
  TSCONFIG="${TSCONFIG:-${REPO_ROOT}/examples/api-fixture/tsconfig.json}"
  OUT_DIR="${OUT_DIR:-${REPO_ROOT}/.build-workspace/api}"
fi
[[ -n "$OUT_DIR" ]] || die "--out is required"
[[ -f "$ENTRY" ]] || die "entry not found: $ENTRY"

log "TypeDoc → Markdown ($NAME)"
mkdir -p "$OUT_DIR"
TYPEDOC_BIN="${REPO_ROOT}/node_modules/.bin/typedoc"
[[ -x "$TYPEDOC_BIN" ]] || die "typedoc not installed — run: bun install"

ARGS=(
  --plugin typedoc-plugin-markdown
  --entryPoints "$ENTRY"
  --out "$OUT_DIR"
  --name "$NAME"
  --readme none
  --hideGenerator
  --gitRevision main
)
[[ -n "$TSCONFIG" && -f "$TSCONFIG" ]] && ARGS+=(--tsconfig "$TSCONFIG")

"$TYPEDOC_BIN" "${ARGS[@]}"

# typedoc-plugin-markdown emits an index named README.md by default; rename to
# index.md so it slots under the MkDocs `api/` nav anchor.
if [[ -f "${OUT_DIR}/README.md" && ! -f "${OUT_DIR}/index.md" ]]; then
  mv "${OUT_DIR}/README.md" "${OUT_DIR}/index.md"
fi
[[ -f "${OUT_DIR}/index.md" ]] || die "TypeDoc produced no Markdown index in $OUT_DIR"
info "API Markdown: $OUT_DIR"
printf '\nbuild-api-docs: PASS\n'
