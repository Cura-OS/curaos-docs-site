<div align="center">


# curaos-docs-site

**The public documentation entry point for CuraOS adoption.**

Part of the CuraOS (Care Oriented Stack) platform. CuraOS public documentation site. Domain: neutral.

[![Status](https://img.shields.io/badge/status-public--alpha-informational)](#status)
[![License: Apache-2.0](https://img.shields.io/badge/license-Apache--2.0-blue)](./LICENSE)
[![Exposure: Open](https://img.shields.io/badge/exposure-Open-brightgreen)](#license)
[![Module: Website](https://img.shields.io/badge/module-Website-informational)](#how-it-works)

[Why](#why) · [Quick Start](#quick-start) · [Capabilities](#capabilities) · [How it Works](#how-it-works) · [Status](#status) · [Security](#security)

</div>

---

## Why

The docs site publishes safe adoption material, concepts, and public guides while keeping internal roadmaps, generators, and strategy docs private.

<!-- curaos:keep -->
<!-- Add runnable repo-specific setup, local URLs, required env vars, and smoke checks here.
     This section survives re-emit. -->
<!-- /curaos:keep -->

---

## Quick Start

```bash
cd curaos-docs-site
bun install
bun run dev
```

<!-- curaos:keep -->
<!-- Add architecture notes, events, APIs, data ownership, and dependency diagrams here.
     This section survives re-emit. -->
<!-- /curaos:keep -->

---

## Capabilities

- Public docs navigation for CuraOS adopters
- Safe documentation boundary for open-source exposure
- Canonical links back to public website and examples



---

## How it Works

| Area | Detail |
|---|---|
| Package | `@curaos/curaos-docs-site` |
| Source | `curaos-docs-site` |
| Domain | `neutral` |
| Layer | `plain` |
| Exposure | Open |

- Public docs site separated from private ai-docs and internal ADRs
- Publishes only reviewed adoption content
- Carries public-open license and community health files



---

## API and Usage

See [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com) (interim).

See the public documentation at [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com).



---

## Status

public alpha

- Docs generated from `tools/codegen/src/repo-docs-emit.ts`.
- Public documentation: [docs.curaos.abualruz.com](https://docs.curaos.abualruz.com).
- Changelog: [CHANGELOG.md](./CHANGELOG.md) when present.

---

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting policy.

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
