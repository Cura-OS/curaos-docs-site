# Services catalogue

CuraOS is composed of many small services rather than one monolith. Each service
owns one capability, ships independently, and is reachable through the API
gateway under a stable, versioned path prefix. This page explains how services
are named and layered, and documents the surfaces that are part of the public
API reference.

## Naming convention

A service's name tells you which layer it belongs to:

`<domain>-core-service`
:   A neutral, vertical-agnostic capability. The default owner of a domain.

`personal-<domain>-service`
:   A personal variant: the subject is an individual, with personal-ownership
    data isolation.

`business-<domain>-service`
:   A business variant: the subject is an organization, with org-level data
    isolation.

Personal and business variants exist **only** where the subject owner and data
isolation genuinely differ. Where they do not, a single neutral
`*-core-service` owns the capability. See
[Capabilities](../capabilities/index.md) for the rule behind the split.

## Layers

CuraOS separates a generic, reusable core from opt-in vertical overlays:

- **Neutral core.** Vertical-agnostic capability services (for example party,
  tenancy, org, audit, settings, notify, search, storage, calendar, tasks,
  documents, commerce, and more). Each holds references and metadata only, never
  protected data.
- **Platform foundation.** A workflow / BPM engine, an app / site builder, and an
  automation core that every domain routes through.
- **Vertical overlays (opt-in).** Health, Education, and ERP verticals extend the
  neutral core through documented seams. Overlay surfaces are internal and are
  not part of the public API reference.

The dependency direction is always overlay to core, never the reverse.

## Public reference surface

The public API and event reference is deny-by-default: a surface is documented
publicly only when it is explicitly approved. The current public surface is the
neutral core party and tenancy contracts:

| Service | Public HTTP surface | Public events |
| --- | --- | --- |
| `party-core-service` | `/api/v1/party` (parties) | `curaos.core.party.*` |
| `tenancy-core-service` | events only (no public HTTP) | `curaos.core.tenancy.tenant.*` |

Everything else is internal by construction and is not published. See the
[API reference](../api/index.md) and [Event contracts](../events/index.md) for
the published surface, and the generated
[API & event reference](../reference/index.md) for the versioned contracts.

## Calling a service

Every published service is reached the same way: through the API gateway, under a
versioned `/api/v1/<domain>` path, with an OIDC bearer token (health probes
excepted).

```bash
# Unauthenticated liveness probe.
curl -i https://<your-host>/api/v1/party/healthz

# Authenticated read.
curl https://<your-host>/api/v1/party \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

The full path convention and authentication details are in the
[API reference](../api/index.md). The durable event topics each published service
emits are described in [Event contracts](../events/index.md).
