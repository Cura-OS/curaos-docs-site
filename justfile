# curaos-docs-site — task runner.
# Local CI (`just ci`) is the default merge gate; GitHub Actions (Pages publish)
# is workflow_dispatch-only.

default:
    @just --list

# Local CI gate (default merge gate).
ci:
    bash ci.sh

# Typecheck only.
typecheck:
    bun run typecheck

# Run the unit + contract test suite.
test:
    bun test

# Static supply-chain pin guard (SHA-pin actions + digest-pin images).
pin-guard:
    bash scripts/pin-guard.sh

# Generate TypeScript API docs (TypeDoc → Markdown). Pass flags through, e.g.:
#   just api --entry ../pkg/src/index.ts --out ../../ai/curaos/pkg/docs/api
api *ARGS:
    bash scripts/build-api-docs.sh {{ARGS}}

# Build the external MkDocs Material static site (offline, browser search).
#   just external --content-dir ../../ai/curaos/curaos-docs-site/docs-content
external *ARGS:
    bash scripts/build-external.sh {{ARGS}}

# Build the per-service TechDocs harness output.
techdocs *ARGS:
    bash scripts/build-techdocs.sh {{ARGS}}

# Full build: API → external site → TechDocs.
build *ARGS:
    bash scripts/build-all.sh {{ARGS}}

# Prove the built static site renders with zero network egress.
offline-smoke *ARGS:
    bash scripts/offline-smoke.sh {{ARGS}}
