#!/usr/bin/env bash
# build-all.sh: full docs build: API Markdown → external static site → TechDocs.
#
# Convenience entrypoint that chains the three builders against the in-repo
# fixtures (standalone) or caller-supplied dirs. The external static site is the
# primary GA artifact (NGINX/K8s + Pages mirror + Zarf component input).
#
# Usage:
#   scripts/build-all.sh [--content-dir DIR] [--api-entry FILE --api-out DIR]
set -euo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/lib.sh"

CONTENT_DIR="$(parse_flag content-dir "$@")"
API_ENTRY="$(parse_flag api-entry "$@")"
API_OUT="$(parse_flag api-out "$@")"

log "A: API docs (TypeDoc → Markdown)"
# Outside .build-workspace: build-external.sh wipes that dir at the start of its
# run (same reason A2's REF_STAGE lives under .build-ref below), so the
# generated API Markdown must be staged from a sibling that survives.
API_STAGE="${REPO_ROOT}/.build-ref/api"
if [[ -n "$API_ENTRY" ]]; then
  bash "${REPO_ROOT}/scripts/build-api-docs.sh" --entry "$API_ENTRY" --out "${API_OUT:-$API_STAGE}"
else
  bash "${REPO_ROOT}/scripts/build-api-docs.sh" --out "${API_OUT:-$API_STAGE}"
fi

log "A2: public API/event reference (OpenAPI + AsyncAPI, DENY-BY-DEFAULT, versioned)"
# --specs-root is optional: absent, the generator falls back to the in-repo
# fixture so build-all runs standalone. A real build passes --api-specs pointing
# at the workspace contract output.
# Outside .build-workspace: build-external.sh wipes that dir at the start of its
# run, so the generated reference must be staged from a sibling that survives.
REF_STAGE="${REPO_ROOT}/.build-ref/public-api"
SPECS_ROOT="$(parse_flag api-specs "$@")"
REF_ARGS=(--out "$REF_STAGE")
[[ -n "$SPECS_ROOT" ]] && REF_ARGS+=(--specs-root "$SPECS_ROOT")
bun "${REPO_ROOT}/scripts/public-api-docs.ts" "${REF_ARGS[@]}"

log "B: external static site (MkDocs Material, offline)"
EXT_ARGS=(--api-dir "${API_OUT:-$API_STAGE}" --reference-dir "$REF_STAGE")
[[ -n "$CONTENT_DIR" ]] && EXT_ARGS=(--content-dir "$CONTENT_DIR" "${EXT_ARGS[@]}")
bash "${REPO_ROOT}/scripts/build-external.sh" "${EXT_ARGS[@]}"

log "C: TechDocs harness (per-service, Backstage-consumable)"
bash "${REPO_ROOT}/scripts/build-techdocs.sh"

printf '\nbuild-all: PASS\n'
