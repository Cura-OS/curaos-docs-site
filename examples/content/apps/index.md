# Apps guide

CuraOS tracks 22 frontend app projects: 20 web apps plus 2 Expo mobile apps.
The local real-data render gate exercises the 20 web apps, and the public
reference deployment exposes 19 vanity web hosts today. The remaining web app,
Builder Studio, is deployed as a cluster app without a public vanity host. The
mobile apps do not have web subdomains.

Every web app is generated from the same workflow definitions and domain
contracts, themed by one shared design system (`@curaos/ui`). Dark mode and
right-to-left Arabic are built in and persist across reloads. Sign-in is OIDC
through Pocket-ID, brokered by the identity service into a CuraOS session; some
apps require an account.

The public web apps fall into three groups: the **Platform** apps for operating
and building the system, the **Business suite** for running an organization, and
the **Personal suite** for an individual.

## Platform

Operate and build the system itself.

| App | URL | What it does |
| --- | --- | --- |
| Admin | `https://admin.abualruz.com` | Tenant, identity, and platform administration console. |
| Builder | `https://builder.abualruz.com` | Low-code app and site builder that generates surfaces from BPM definitions and domain contracts. |
| Front office | `https://front-office.abualruz.com` | Staff-facing operations desk: tasks, scheduling, and day-to-day workflows. |
| Fleet | `https://fleet.abualruz.com` | Vehicle and asset fleet tracking and dispatch. |
| Login | `https://login.abualruz.com` | Shared OIDC sign-in surface (Authorization Code with PKCE via Pocket-ID). |

## Cluster and mobile apps

These app projects are tracked in the repo but are not public vanity web hosts.

| App | Surface | What it does |
| --- | --- | --- |
| Builder Studio | Cluster web app | Studio surface for generated builder workflows and site publishing. |
| Clinician app | Expo mobile app | Mobile clinical workflow shell. |
| Patient app | Expo mobile app | Mobile patient workflow shell. |

## Business suite

Run an organization. These are the `biz-*` apps.

| App | URL | What it does |
| --- | --- | --- |
| Business workflow | `https://biz-workflow.abualruz.com` | Design and run org-level BPM workflows and approvals. |
| Business automation | `https://biz-automation.abualruz.com` | Low-code automation: connectors, actions, and scheduling. |
| Business site | `https://biz-site.abualruz.com` | Build and publish public-facing organization sites. |
| Business shop | `https://biz-shop.abualruz.com` | Commerce and storefront for an organization. |
| Business donation | `https://biz-donation.abualruz.com` | Donation campaigns and fundraising for an organization. |

## Personal suite

For an individual. These are the `my-*` apps.

| App | URL | What it does |
| --- | --- | --- |
| My workflow | `https://my-workflow.abualruz.com` | Personal workflows and task pipelines. |
| My automation | `https://my-automation.abualruz.com` | Personal low-code automations and connectors. |
| My tasks | `https://my-tasks.abualruz.com` | Personal task and to-do management. |
| My calendar | `https://my-calendar.abualruz.com` | Personal calendar and scheduling. |
| My notes | `https://my-notes.abualruz.com` | Personal notes and documents. |
| My tracking | `https://my-tracking.abualruz.com` | Personal location and asset tracking. |
| My site | `https://my-site.abualruz.com` | Build and publish a personal site. |
| My shop | `https://my-shop.abualruz.com` | Personal storefront and commerce. |
| My donation | `https://my-donation.abualruz.com` | Personal donation and fundraising pages. |

## How the apps are built

Apps are not hand-coded one by one. They are generated from BPM definitions and
domain contracts and share the `@curaos/ui` design system, so the look, the
interaction patterns, and the auth flow are consistent across the web suite.
Each app talks to the backend through the API gateway and authenticates through
Pocket-ID.

The personal (`my-*`) and business (`biz-*`) variants of a domain (workflow,
automation, site, shop, donation) share the same neutral capability underneath;
the variant exists where the subject owner and the data isolation differ
(personal data versus organization data).

See [Capabilities](../capabilities/index.md) for the platform underneath, and the
[API reference](../api/index.md) for the services the apps call.
