<div align="center">


# curaos-docs-site

**Provide the CuraOS documentation site: one Markdown source rendered to three surfaces - an external MkDocs Material standalone static site (customer/operator, offline/air-gap, client-side search), an internal Backstage TechDocs build harness (per-service developer portal), and TypeScript API docs as Markdown (TypeDoc). Hostable behind NGINX/K8s, on GitHub Pages (secondary mirror), and inside a Zarf air-gap bundle. The docs are the surface Stories 6/7/8 link.**

Part of the CuraOS (Care Oriented Stack) platform. Provide the CuraOS documentation site: one Markdown source rendered to three surfaces - an external MkDocs Material standalone static site (customer/operator, offline/air-gap, client-side search), an internal Backstage TechDocs build harness (per-service developer portal), and TypeScript API docs as Markdown (TypeDoc). Hostable behind NGINX/K8s, on GitHub Pages (secondary mirror), and inside a Zarf air-gap bundle. The docs are the surface Stories 6/7/8 link. Domain: neutral.

[![Status](https://img.shields.io/badge/status-public--alpha-informational)](#status)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)
[![Exposure: Open](https://img.shields.io/badge/exposure-Open-brightgreen)](#license)
[![Module: Website](https://img.shields.io/badge/module-Website-informational)](#how-it-works)

[Why](#why) · [Quick Start](#quick-start) · [Capabilities](#capabilities) · [How it Works](#how-it-works) · [Status](#status) · [Security](#security)

</div>

---

## At a Glance

| Field | Detail |
|---|---|
| Audience | Evaluators, operators, and community adopters. |
| Homepage | [https://docs.curaos.abualruz.com](https://docs.curaos.abualruz.com) |
| Exposure | Open |
| License | Apache-2.0 |
| Topics | `curaos` `website` `public-open`  |

---

## Why

Provide the CuraOS documentation site: one Markdown source rendered to three surfaces - an external MkDocs Material standalone static site (customer/operator, offline/air-gap, client-side search), an internal Backstage TechDocs build harness (per-service developer portal), and TypeScript API docs as Markdown (TypeDoc). Hostable behind NGINX/K8s, on GitHub Pages (secondary mirror), and inside a Zarf air-gap bundle. The docs are the surface Stories 6/7/8 link.

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Quick Start

```bash
cd curaos-docs-site
bun install
bun run dev
```

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Capabilities

- Website boundary for curaos-docs-site
- Neutral domain alignment
- Plain layer ownership

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Surfaces

- Website surface
- Plain ownership boundary

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## Media

- Approved public brand assets only.

<!-- curaos:keep -->
<!-- /curaos:keep -->

---

## How it Works

| Area | Detail |
|---|---|
| Package | `@curaos/curaos-docs-site` |
| Source | `curaos-docs-site` |
| Domain | `neutral` |
| Layer | `plain` |
| Exposure | Open |

- Source path: `curaos-docs-site`
- Generated documentation owner: `tools/codegen/src/repo-docs-emit.ts`



---

## API and Usage

See [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com) (interim).

See the public documentation at [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com).



---

## Status

public alpha

- Docs generated from `tools/codegen/src/repo-docs-emit.ts`.
- Public documentation: [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com).
- Changelog: [CHANGELOG.md](./CHANGELOG.md).

---

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting policy.

Public docs must not expose internal generator, tenant ops, roadmap, pricing, or private deployment details.

Private material stays out of this README:

- Generator templates
- Internal deployment automation
- Tenant operations data
- Roadmap and pricing internals

---

## Maintainers

- CuraOS Team - [GitHub](https://github.com/Cura-OS)

---

## Contributing

Contributions are handled through the repository maintainers. Public contribution guidelines are emitted for open and source-available repositories.

By contributing, you agree that your contributions will be licensed under the same license as this project.

---

## License

Apache-2.0 - CuraOS (Care Oriented Stack). See [LICENSE](./LICENSE) for details.
