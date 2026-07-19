#!/usr/bin/env bash
# ci.sh: local CI gate for curaos-docs-site (default merge gate).
#
# A green run here is the merge authority (GitHub auto-CI is workflow_dispatch-
# only). Mirrors the step order a reactivated GitHub Actions run would use.
#
# Steps:
#   1 install (bun, frozen lockfile)
#   2 shellcheck (scripts + ci.sh) if present
#   3 pin-guard (SHA-pin actions + digest-pin images + exact python pins)
#   4 typecheck (tsc)
#   5 API docs (TypeDoc → Markdown, in-repo fixture)
#   6 external static site (MkDocs Material strict): skipped-with-notice if
#     mkdocs absent (the offline smoke + bun tests still cover behaviour)
#   7 offline smoke (zero-egress static render + offline search) when site built
#   8 em/en dash gate (no U+2014 / U+2013 in authored docs content)
#   9 TechDocs harness (per-service): skipped-with-notice if mkdocs absent
#  10 bun test (unit + contract)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

step() { printf '\n========== %s ==========\n' "$*"; }
MKDOCS_OK=0

step "1 install (bun, frozen lockfile)"
bun install --frozen-lockfile

step "2 shellcheck (scripts + ci.sh)"
if command -v shellcheck >/dev/null 2>&1; then
  shellcheck -S warning ci.sh scripts/*.sh
else
  printf 'SKIP: shellcheck, not installed (bun test still covers script behaviour)\n'
fi

step "3 pin-guard"
bash scripts/pin-guard.sh

step "4 typecheck"
bun run typecheck

step "5 API docs (TypeDoc → Markdown)"
bash scripts/build-api-docs.sh

step "5b public API docs (OpenAPI + AsyncAPI, DENY-BY-DEFAULT tiering)"
# Exercises the deny-by-default framework against the in-repo fixture: the
# public-tier surface is emitted, the internal surface is denied. The real
# public list is UD-8-gated (config/api-tiers.json publishes nothing yet).
bun scripts/public-api-docs.ts

step "6 external static site (MkDocs Material strict)"
if command -v mkdocs >/dev/null 2>&1; then
  bash scripts/build-external.sh --api-dir .build-ref/api --reference-dir .build-ref/public-api
  MKDOCS_OK=1
else
  printf 'SKIP: mkdocs, not installed (run: pip install -r requirements.txt)\n'
fi

step "7 offline smoke (zero-egress + offline search)"
if [[ "$MKDOCS_OK" -eq 1 ]]; then
  bash scripts/offline-smoke.sh
else
  printf 'SKIP: offline smoke, depends on the MkDocs build (step 6 skipped)\n'
fi

step "8 em/en dash gate (no U+2014 em-dash / U+2013 en-dash in repo OR staged docs)"
# Per the no-em-dash rule: NO tracked text file anywhere in the repo, AND no
# authored docs content staged for the build, may contain an em/en dash. The gate
# (invoked with no args) defaults to BOTH the whole tracked repo (git ls-files)
# AND the staged authored content under .build-workspace/{docs,techdocs} -- the
# content build-external.sh / build-techdocs.sh resolve the docs into for MkDocs.
# Only truly-generated output is excluded (node_modules, site, techdocs-site,
# .build-workspace/cache, .venv, .git). Running AFTER steps 5-6 means the staged
# content (incl. generated API Markdown) exists for the gate to scan.
# Delegated to scripts/em-dash-gate.sh: fail-closed + host-portable (PCRE grep
# when available, else an LC_ALL=C byte scan), and it scans whole text trees
# with -I so no extension (.yml, .yaml, .sh, Dockerfile, ...) can bypass the rule.
bash scripts/em-dash-gate.sh

step "9 TechDocs harness (per-service)"
if command -v mkdocs >/dev/null 2>&1 || command -v npx >/dev/null 2>&1; then
  bash scripts/build-techdocs.sh
else
  printf 'SKIP: TechDocs, neither mkdocs nor npx available\n'
fi

step "10 bun test (unit + contract)"
bun test

printf '\nlocal CI gate: PASS\n'
