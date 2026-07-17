# Security and compliance

Security and privacy are charter commitments in CuraOS, not features bolted on
late. This page collects the security model, the privacy and compliance posture
(GDPR and HIPAA), and the data-isolation boundary that protects tenant data.

!!! note "Pre-1.0"
    CuraOS targets GDPR and HIPAA alignment by design. The platform is pre-1.0
    and hardening along its roadmap; the boundaries and patterns below are the
    commitments the architecture is built to satisfy. Compliance is a property of
    a configured deployment plus the operator's controls, not of the software
    alone.

## Defense in depth

The security model is layered, so a single failure does not expose tenant data.

Authentication
:   OpenID Connect (OIDC) with the Authorization Code flow plus PKCE. The
    reference identity provider is Pocket-ID. The apps are browser-based public
    clients with no client secret; PKCE binds an authorization code to the client
    that requested it. Strong-auth options (MFA, modern password hashing,
    hardware keys) are supported at the provider. See [Auth setup](../auth/index.md).

Authorization
:   Role-based access control (RBAC) with optional attribute-based access control
    (ABAC). Tokens are scoped per tenant and per role; the gateway and services
    enforce what a token may do.

Audit
:   A tamper-evident audit trail (`audit-core-service`) records security-relevant
    actions. Privileged actions follow an approval path.

Emergency access
:   Emergency access is available but always logged with a reason, so the
    exceptional path stays accountable.

Privilege escalation
:   Escalation requires approval and is recorded, so elevated access is never
    silent.

## Tenant data isolation

The single most important boundary in CuraOS is where protected data lives.

> PHI and PII stay in overlay schemas. Neutral services hold references and
> metadata only, never protected data.

This boundary is enforced at two layers:

- **Schema layer.** Each tenant gets its own PostgreSQL database (provisioned by
  the CloudNativePG operator), so one tenant's data is physically separate from
  another's. Protected data lives in overlay schemas, not in the neutral core's
  schemas.
- **Service layer.** Neutral core services are written to carry references and
  metadata only. Anything that touches PHI or PII goes through the relevant
  opt-in overlay, under that tenant's isolation.

An integration that needs protected data therefore goes through the overlay that
owns it, never through the neutral core. See [Integration](../integration/index.md)
for the integration-side view of this rule.

## Regulated-data deployments

For deployments that handle protected data under a regulated vertical, the
data-isolation boundary is the foundation of the compliance posture:

- **Protected data stays inside the overlay schemas.** The neutral core never
  stores it. It lives in the relevant opt-in overlay, isolated per tenant.
- **Lawful basis is enforced.** Access to protected data respects the recorded
  lawful basis and the data subject's rights.
- **Access is audited.** Reads and writes against protected data are recorded in
  the tamper-evident audit trail, supporting the accountability regulators
  expect.
- **Minimum exposure.** Surfaces and APIs are scoped per role, so a token sees
  only what its role permits.

## GDPR: personal data and subject rights

CuraOS targets GDPR alignment through the same isolation boundary plus
subject-rights tooling:

- **PII lives in overlay schemas**, isolated per tenant, with neutral services
  holding references only.
- **Lawful-basis enforcement** applies to personal data across every overlay.
- **Subject-rights tooling** supports the data-subject requests GDPR requires
  (access, rectification, erasure, portability), operating against the tenant's
  isolated data.
- **Per-deployment legal and branding bundles** let an operator apply the legal
  text and notices appropriate to their jurisdiction.

## Reliability as a security property

Data integrity is part of the security posture, not separate from it:

- **Idempotent writes**, so a retried command does not double-apply.
- **Outbox/inbox plus durable events**, so cross-service messages are neither
  lost nor duplicated.
- **Retries with backoff and dead-letter handling** for poison messages.
- **Correlation IDs** threaded through logs, traces, and events, so an incident
  can be reconstructed end to end.

## Supply-chain and build integrity

- **Signed images.** The reference deployment publishes signed container images,
  so an operator can verify provenance before running them.
- **Pinned dependencies.** Dependencies are pinned and dependency surfaces are
  scanned.
- **Air-gap viable.** Images and charts contain no remote dependencies, so a
  zero-egress install keeps the security boundary intact without reaching the
  public internet. See [Install](../install/index.md#air-gap).

## What the operator owns

Compliance is a shared responsibility. The platform provides the boundaries and
tooling; the operator configures and runs them. An operator deploying CuraOS for
a regulated workload is responsible for:

- Configuring the OIDC provider with the required strong-auth controls.
- Mapping provider groups and claims onto CuraOS roles correctly.
- Running backups and testing recovery (see [Operations](../operations/index.md)).
- Applying the jurisdiction-appropriate legal and lawful-basis configuration.
- Restricting and monitoring the emergency-access path.

Next: [Operations](../operations/index.md) for the day-2 runbooks, and
[Auth setup](../auth/index.md) for wiring the identity provider.
