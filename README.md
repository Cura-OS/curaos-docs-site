# curaos-docs-site

Documentation build + hosting for CuraOS.

Three surfaces from one Markdown source:

- **External docs** — MkDocs Material standalone static site with browser-side
  search, renderable fully offline / air-gap.
- **Internal TechDocs** — per-service Backstage-TechDocs-compatible build harness.
- **API docs** — TypeScript API reference generated as Markdown via TypeDoc.

The build is **deliberate**: GitHub Actions (Pages publish) is
`workflow_dispatch`-only. The local gate (`just ci`) is the merge authority for
this repo's own changes.

## Usage

Authored content is supplied by the caller via `--content-dir`; this repo ships
in-repo fixtures under `examples/` so every build is exercisable standalone.

```bash
bun install
pip install -r requirements.txt

# Full build (API docs → external static site → TechDocs) against the fixtures:
just build

# External site from a real content dir + generated API Markdown:
just api      --entry ../path/to/pkg/src/index.ts --out ../path/to/api-out
just external --content-dir ../path/to/docs-content --api-dir ../path/to/api-out
just offline-smoke           # prove zero-egress static render + offline search
```

## Layout

| Path | Purpose |
|---|---|
| `mkdocs.yml` | MkDocs Material config for the external/offline site. |
| `scripts/build-external.sh` | Stage content + `mkdocs build --strict`. |
| `scripts/build-api-docs.sh` | TypeDoc → Markdown API docs. |
| `scripts/build-techdocs.sh` | Per-service Backstage TechDocs build harness. |
| `scripts/offline-smoke.sh` | Zero-egress static-render + offline-search proof. |
| `scripts/pin-guard.sh` | SHA-pin actions + digest-pin images + exact python pins. |
| `hosting/nginx/` | NGINX image + server block for K8s static hosting. |
| `hosting/k8s/` | K8s Deployment + Service. |
| `hosting/zarf/` | Zarf component input (air-gap). |
| `examples/` | In-repo content / API / TechDocs fixtures. |
| `ci.sh` / `justfile` | Local CI gate (default merge gate). |
| `tests/` | Bun unit + contract tests. |
| `.github/workflows/pages.yml` | `workflow_dispatch`-only GitHub Pages mirror. |

## Hosting profiles

- **Cloud / on-prem / hybrid:** `hosting/nginx` image + `hosting/k8s` manifests.
- **Public mirror:** GitHub Pages (secondary), via `pages.yml` (dispatch-only).
- **Air-gap:** `hosting/zarf` component input — the signed bundle host composes
  the digest-pinned NGINX docs image + manifests with zero external egress.

## Local gate

```bash
just ci   # install → shellcheck → pin-guard → typecheck → api docs →
          # mkdocs strict → offline smoke → techdocs → bun test
```

`mkdocs` (Python) is required for the static-site + offline + techdocs steps;
when absent the gate emits an explicit `SKIP:` notice (never a silent pass) and
the bun tests still cover script + config behaviour.

## Tooling

- Runtime: Bun + Node (see `.tool-versions`).
- External site: MkDocs Material (Python).
- API docs: TypeDoc + typedoc-plugin-markdown.
- TechDocs: `@techdocs/cli` (npx) with an MkDocs fallback.
- Hosting: NGINX (digest-pinned), K8s, Zarf.
