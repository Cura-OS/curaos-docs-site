# Changelog

All notable changes to `curaos-docs-site` are documented here. Format follows
Conventional Commits; versions follow semver.

## [0.1.0] - 2026-06-06

### Added

- MkDocs Material external/offline docs site: `mkdocs.yml` (Material theme,
  strict build, client-side `search`, `font: false` for zero-egress air-gap) +
  `requirements.txt` (exact-pinned `mkdocs`/`mkdocs-material`).
- Build scripts: `build-external.sh` (stage content + `mkdocs build --strict`),
  `build-api-docs.sh` (TypeDoc → Markdown), `build-techdocs.sh` (per-service
  Backstage-TechDocs build harness), `build-all.sh`, and `offline-smoke.sh`
  (zero-egress static-render + offline-search proof).
- Hosting: `hosting/nginx` (digest-pinned NGINX image + server block),
  `hosting/k8s` (Deployment + Service), `hosting/zarf` (air-gap component input).
- `.github/workflows/pages.yml`: `workflow_dispatch`-only GitHub Pages mirror
  with SHA-pinned actions.
- `ci.sh` + `justfile`: local CI gate (default merge gate).
- `scripts/pin-guard.sh`: SHA-pin actions + digest-pin images + exact python pins.
- In-repo fixtures under `examples/` (content, TypeScript API, TechDocs) so the
  build is exercisable standalone.
- Bun unit + contract test suite under `tests/`.
- Repo scaffolding: `package.json`, `tsconfig.json`, `.tool-versions`,
  `renovate.json`, `.gitignore`, `.dockerignore`.
