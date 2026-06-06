#!/usr/bin/env bash
# ci.sh — local CI gate for curaos-docs-site (default merge gate).
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
#   6 external static site (MkDocs Material strict) — skipped-with-notice if
#     mkdocs absent (the offline smoke + bun tests still cover behaviour)
#   7 offline smoke (zero-egress static render + offline search) when site built
#   8 TechDocs harness (per-service) — skipped-with-notice if mkdocs absent
#   9 bun test (unit + contract)
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
  printf 'SKIP: shellcheck — not installed (bun test still covers script behaviour)\n'
fi

step "3 pin-guard"
bash scripts/pin-guard.sh

step "4 typecheck"
bun run typecheck

step "5 API docs (TypeDoc → Markdown)"
bash scripts/build-api-docs.sh

step "6 external static site (MkDocs Material strict)"
if command -v mkdocs >/dev/null 2>&1; then
  bash scripts/build-external.sh --api-dir .build-workspace/api
  MKDOCS_OK=1
else
  printf 'SKIP: mkdocs — not installed (run: pip install -r requirements.txt)\n'
fi

step "7 offline smoke (zero-egress + offline search)"
if [[ "$MKDOCS_OK" -eq 1 ]]; then
  bash scripts/offline-smoke.sh
else
  printf 'SKIP: offline smoke — depends on the MkDocs build (step 6 skipped)\n'
fi

step "8 TechDocs harness (per-service)"
if command -v mkdocs >/dev/null 2>&1 || command -v npx >/dev/null 2>&1; then
  bash scripts/build-techdocs.sh
else
  printf 'SKIP: TechDocs — neither mkdocs nor npx available\n'
fi

step "9 bun test (unit + contract)"
bun test

printf '\nlocal CI gate: PASS\n'
