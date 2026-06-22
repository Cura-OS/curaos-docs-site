# Services catalogue

CuraOS is composed of many small services rather than one monolith. Each service
owns one capability, ships independently, and is reachable through the API
gateway under a stable path prefix. This page is the catalogue: what exists, how
it is grouped, and the naming convention that tells you a service's layer at a
glance.

!!! note "Repository versus deployment"
    The platform repository defines around 95 services across the neutral core,
    the HealthStack overlay, the EducationStack overlay, and the personal and
    business variants. The live reference deployment runs roughly 60 of them; the
    remainder are scaffolded and filling in along the roadmap. A first set
    (commerce, orders, fleet, calendar, donation, site, automation,
    plugin-runtime) already serves real seeded data through live read endpoints.

## Naming convention

The name of a service tells you which layer it belongs to:

`<domain>-core-service`
:   A neutral, vertical-agnostic capability. The default owner of a domain.

`personal-<domain>-service`
:   A personal variant: the subject is an individual, and the data isolation
    follows personal ownership.

`business-<domain>-service`
:   A business variant: the subject is an organization, with org-level data
    isolation.

`healthstack-<domain>-service`
:   A HealthStack overlay service. The clinical overlay also uses a few plain
    `<domain>-service` names (for example `encounter-service`); the HealthStack
    boundary is carried in namespaces, events, and schemas rather than in every
    file name.

`education-<scope>-service`
:   An EducationStack overlay service.

Personal and business variants exist **only** where the subject owner and data
isolation genuinely differ. Where they do not, a single neutral
`*-core-service` owns the capability. See
[Capabilities](../capabilities/index.md) for the rule behind the split.

## Neutral core

Vertical-agnostic capability services. Each is reusable across every market and
holds references and metadata only, never protected data.

| Service | Capability |
| --- | --- |
| `identity-service` | Authentication subjects, sessions, credentials, OIDC brokering |
| `tenancy-core-service` | Tenants, organizations, isolation boundaries |
| `org-core-service` | Organization structure and hierarchy |
| `party-core-service` | People and organizations modelled as parties |
| `audit-core-service` | Tamper-evident audit trail |
| `settings-service` | Per-tenant and per-user settings |
| `notify-service` | Notifications across channels |
| `search-service` | Cross-domain search |
| `reports-service` | Reporting and analytics surfaces |
| `storage-service` | Object and file storage references |
| `document-core-service` | Document management |
| `calendar-core-service` | Scheduling and calendars |
| `tasks-core-service` | Work items and task management |
| `geospatial-core-service` | Geospatial primitives |
| `fleet-core-service` | Vehicle and asset fleet |
| `commerce-core-service` | Commerce primitives |
| `sales-core-service` | Sales pipeline |
| `procurement-core-service` | Procurement |
| `inventory-core-service` | Inventory |
| `hr-core-service` | Human resources |
| `crm-core-service` | Customer relationship management |
| `accounting-core-service` | Accounting |
| `esign-core-service` | Electronic signature |
| `conversion-core-service` | File and format conversion |
| `donation-core-service` | Donations and fundraising |
| `event-core-service` | Events (the domain, for example bookable events) |
| `integrations-core-service` | External integration connectors |
| `site-core-service` | Site and page authoring |

### Platform foundation

Three of the neutral services are the spine every domain routes through:

| Service | Role |
| --- | --- |
| `workflow-core-service` | Workflow / BPM engine: human tasks, automation, SLA timing |
| `builder-core-service` | App and site builder: generates surfaces from BPM definitions and contracts |
| `automation-core-service` | Low-code actions, connectors, and scheduling |
| `plugin-runtime-service` | Runs extension plugins in a sandboxed runtime |

See [Workflow & builder](../builder/index.md) for how these three work together.

## HealthStack overlay

The clinical overlay extends the core. All clinical PHI stays inside the overlay
schemas, never in the neutral core.

| Service | Capability |
| --- | --- |
| `healthstack-patient-service` | Patient records |
| `encounter-service` | Clinical encounters |
| `healthstack-problems-service` | Problem lists |
| `clinical-doc-service` | Clinical documents |
| `healthstack-lab-service` | Lab orders and results |
| `healthstack-meds-service` | Medications |
| `healthstack-imaging-service` | Imaging |
| `healthstack-claims-service` | Claims |
| `healthstack-billing-service` | Clinical billing |
| `healthstack-consent-service` | Consent management |
| `healthstack-careplans-service` | Care plans |
| `healthstack-devices-service` | Medical devices |
| `healthstack-ems-service` | Emergency medical services |
| `healthstack-interop-service` | Interoperability (clinical exchange) |
| `healthstack-quality-service` | Quality measures |
| `terminology-service` | Clinical terminology |
| `healthstack-scheduling` (`business-scheduling-service`, `scheduling-service`) | Clinical scheduling |
| `healthstack-workflow-service` | Clinical workflow extensions |
| `healthstack-automation-service` | Clinical automation extensions |
| `healthstack-messaging-service` | Clinical messaging |
| `healthstack-notes-service` | Clinical notes |
| `healthstack-education-service` | Patient education |

## EducationStack overlay

| Service | Capability |
| --- | --- |
| `education-core-service` | Neutral education capability (student lifecycle, course authoring) |
| `education-organization-service` | Organization-scoped education |
| `education-personal-service` | Individual-scoped education |

## Personal and business variants

Where a domain's subject owner genuinely differs, a `personal-*` and a
`business-*` variant exist alongside (or instead of) the neutral core service.

| Domain | Personal | Business |
| --- | --- | --- |
| Workflow | `personal-workflow-service` | `business-workflow-service` |
| Automation | `personal-automation-service` | `business-automation-service` |
| Site | `personal-site-service` | `business-site-service` |
| Shop / commerce | `personal-shop-service` | `business-shop-service` |
| Donation | `personal-donation-service` | `business-donation-service` |
| CRM | `personal-crm-service` | `crm-service` |
| HR | `personal-hr-service` | `hr-service` |
| E-Sign | `personal-esign-service` | `business-esign-service` |
| Conversion | `personal-conversion-service` | `business-conversion-service` |
| Tasks | `personal-tasks-service` | (neutral `tasks-core-service`) |
| Notes | `personal-notes-service` | `business-docs-service` |
| Tracking | `personal-tracking-service` | (neutral `fleet-core-service`) |
| Calendar | `personal-calendar-service` | (neutral `calendar-core-service`) |
| Patient | `personal-patient-service` | `business-patient-service` |

The business suite also includes `business-cases-service` and
`business-projects-service` for case and project management.

## Calling a service

Every service is reached the same way: through the API gateway, under its path
prefix, with an OIDC bearer token (health endpoints excepted).

```bash
# Unauthenticated liveness probe.
curl -i https://api.abualruz.com/identity/healthz

# Authenticated read.
curl https://api.abualruz.com/tenancy/tenants \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```

The full path convention and authentication details are in the
[API reference](../api/index.md). The durable event topics each service
publishes are described in [Event contracts](../events/index.md).
