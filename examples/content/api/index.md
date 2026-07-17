# API reference

CuraOS exposes its capabilities through an API gateway in front of the backend
services. The gateway is reached at your deployment host (`https://<your-host>`),
and it routes to each published service by a path prefix.

!!! note "Event-led first"
    CuraOS is event-led: durable, versioned events are the primary cross-service
    contract, and synchronous APIs are secondary. Use the HTTP API for queries
    and commands where request/response latency matters; use the event
    contracts for cross-service integration. See
    [Integration](../integration/index.md).

## Calling the gateway

Each public domain lives under a versioned gateway path. The shape is:

```
https://<your-host>/api/v1/<domain>/<resource>
```

For example, the tenancy service health check:

```bash
curl -i https://<your-host>/api/v1/tenancy/healthz
# HTTP/2 200
```

Health endpoints (`/api/v1/<domain>/healthz`) are unauthenticated so you can
probe liveness without a token. Everything else requires an OIDC access token.

## Authentication

The API accepts a bearer access token issued by Pocket-ID via the Authorization
Code with PKCE flow. Acquire a token through the OIDC flow (see
[Auth setup](../auth/index.md)), then send it on each request:

```bash
curl https://<your-host>/api/v1/tenancy \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

Tokens are scoped per tenant and per role. RBAC (with optional ABAC) governs
what a token may do.

## The public surface

The public API reference is deny-by-default: a service surface is documented
publicly only when it is explicitly approved. Anything outside the public tier
is internal by construction and is not published here. The current public
neutral-core surface is:

| Prefix | Capability |
| --- | --- |
| `/api/v1/party` | People and organizations modelled as parties |
| `/api/v1/tenancy` | Tenants, organizations, isolation boundaries |

The naming and layering of the wider service set are described neutrally in the
[Services catalogue](../services/index.md); overlay and internal surfaces are not
part of the public reference.

### Vertical overlays

Overlay services (the opt-in Health, Education, and ERP verticals) extend the
neutral core through documented seams. Overlay surfaces, and any protected data
they own, stay inside the overlay and are internal; they are not part of the
public reference.

### Personal and business variants

Where a domain genuinely differs by subject owner, a `personal-*` and
`business-*` variant exists alongside the neutral core service.

## Versioning

APIs are versioned with deprecation sunset dates and backward-compatible
migrations. All active versions are honored until they are deactivated, so an
integration built against a current version keeps working through the
deprecation window.

## Contract sources

The wire contracts are the source of truth and travel with the services and SDK
packages:

| Contract surface | Description |
| --- | --- |
| HTTP | TypeSpec / OpenAPI describes the HTTP surface |
| Durable events | AsyncAPI describes the durable event schemas |
| Generated SDK clients | Typed clients are generated from the published HTTP contracts |

Gateway routing, ingress rules, and route-contract checks are generated from a
single source of truth, so the docs, the gateway paths, and the generated
clients stay aligned.

## Generated reference

A generated TypeScript API reference (TypeDoc) is produced at build time for the
SDK and contract packages. Contract specifications are the source of truth for
the wire format: OpenAPI / TypeSpec for HTTP and AsyncAPI for durable events.
Service-local `specs/` directories hold those contracts, and SDK packages with
`openapi-ts.config.ts` consume the published HTTP contracts. TypeDoc documents
the code-level API, not the wire contract.

Next: [Auth setup](../auth/index.md) for the OIDC flow,
[Event contracts](../events/index.md) for the durable event surface, and
[Integration](../integration/index.md) for the end-to-end integration flow.
