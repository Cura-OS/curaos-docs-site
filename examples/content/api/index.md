# API reference

CuraOS exposes its capabilities through an API gateway in front of the backend
services. In the live reference deployment the gateway is at
`https://api.abualruz.com`, and it routes to each service by a path prefix.

!!! note "Event-led first"
    CuraOS is event-led: durable, versioned events are the primary cross-service
    contract, and synchronous APIs are secondary. Use the HTTP API for queries
    and commands where request/response latency matters; use the event
    contracts for cross-service integration. See
    [Integration](../integration/index.md).

## Calling the gateway

Each service lives under its own path prefix. The shape is:

```
https://api.abualruz.com/<service>/<resource>
```

For example, the identity service health check:

```bash
curl -i https://api.abualruz.com/identity/healthz
# HTTP/2 200
```

Health endpoints (`/<service>/healthz`) are unauthenticated so you can probe
liveness without a token. Everything else requires an OIDC access token.

## Authentication

The API accepts a bearer access token issued by Pocket-ID via the Authorization
Code with PKCE flow. Acquire a token through the OIDC flow (see
[Auth setup](../auth/index.md)), then send it on each request:

```bash
curl https://api.abualruz.com/tenancy/tenants \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

Tokens are scoped per tenant and per role. RBAC (with optional ABAC) governs
what a token may do.

## The service catalog

The deployment runs 51 backend services: the neutral core, the HealthStack
overlay, and personal/business variants. They group as follows.

### Neutral core

Vertical-agnostic capability services, each under its own prefix. Examples:

| Prefix | Capability |
| --- | --- |
| `/identity` | Authentication subjects, sessions, credentials |
| `/tenancy` | Tenants, organizations, isolation boundaries |
| `/party` | People and organizations as parties |
| `/audit` | Tamper-evident audit trail |
| `/notify` | Notifications across channels |
| `/search` | Cross-domain search |
| `/storage` | Object and file storage references |
| `/calendar` | Scheduling and calendars |
| `/tasks` | Work items and task management |
| `/documents` | Document management |
| `/commerce` | Commerce primitives |

(The full set covers settings, reports, geospatial, fleet, sales, procurement,
inventory, HR, CRM, accounting, e-sign, donation, event, integrations, and site.)

### Vertical overlays

Overlay services extend the core. The HealthStack overlay adds clinical
capabilities (patient, encounter, scheduling, clinical documents, orders, lab,
meds, imaging, claims, consent, interop, terminology, devices, care plans). Its
PHI stays inside overlay schemas.

### Personal and business variants

Where a domain genuinely differs by subject owner, a `personal-*` and
`business-*` variant exists alongside the neutral core service.

## Versioning

APIs are versioned with deprecation sunset dates and backward-compatible
migrations. All active versions are honored until they are deactivated, so an
integration built against a current version keeps working through the
deprecation window.

## Generated reference

A generated TypeScript API reference (TypeDoc) is produced at build time for the
SDK and contract packages. Contract specifications (OpenAPI / AsyncAPI) are the
source of truth for the wire format and are linked from the relevant service
docs; TypeDoc documents the code-level API, not the wire contract.

Next: [Auth setup](../auth/index.md) for the OIDC flow, and
[Integration](../integration/index.md) for the event contracts.
