# Apps guide

CuraOS ships a suite of generated frontend apps. Most are web apps exposed as
vanity web hosts under your deployment domain; a few (for example Builder Studio)
run as cluster apps without a public vanity host.

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
| Admin | `https://admin.<your-host>` | Tenant, identity, and platform administration console. |
| Builder | `https://builder.<your-host>` | Low-code app and site builder that generates surfaces from BPM definitions and domain contracts. |
| Front office | `https://front-office.<your-host>` | Staff-facing operations desk: tasks, calendaring, and day-to-day workflows. |
| Fleet | `https://fleet.<your-host>` | Vehicle and asset fleet tracking and dispatch. |
| Login | `https://login.<your-host>` | Shared OIDC sign-in surface (Authorization Code with PKCE via Pocket-ID). |

## Cluster apps

These app projects are tracked in the repo but are not public vanity web hosts.

| App | Surface | What it does |
| --- | --- | --- |
| Builder Studio | Cluster web app | Studio surface for generated builder workflows and site publishing. |

## Project inventory

Every frontend project has a stable slug. Public host is `none` when the app is
cluster-only or mobile-only.

| Project slug | Surface | Public host |
| --- | --- | --- |
| `admin-app` | Web | `https://admin.<your-host>` |
| `builder-studio` | Web, cluster-only | none |
| `business-automation` | Web | `https://biz-automation.<your-host>` |
| `business-donation` | Web | `https://biz-donation.<your-host>` |
| `business-shop` | Web | `https://biz-shop.<your-host>` |
| `business-site` | Web | `https://biz-site.<your-host>` |
| `business-workflow` | Web | `https://biz-workflow.<your-host>` |
| `fleet-manager` | Web | `https://fleet.<your-host>` |
| `front-office` | Web | `https://front-office.<your-host>` |
| `hosted-login` | Web | `https://login.<your-host>` |
| `personal-automation` | Web | `https://my-automation.<your-host>` |
| `personal-calendar` | Web | `https://my-calendar.<your-host>` |
| `personal-donation` | Web | `https://my-donation.<your-host>` |
| `personal-notes` | Web | `https://my-notes.<your-host>` |
| `personal-shop` | Web | `https://my-shop.<your-host>` |
| `personal-site` | Web | `https://my-site.<your-host>` |
| `personal-tasks` | Web | `https://my-tasks.<your-host>` |
| `personal-tracking` | Web | `https://my-tracking.<your-host>` |
| `personal-workflow` | Web | `https://my-workflow.<your-host>` |
| `workflow-designer` | Web | `https://builder.<your-host>` |

## Business suite

Run an organization. These are the `biz-*` apps.

| App | URL | What it does |
| --- | --- | --- |
| Business workflow | `https://biz-workflow.<your-host>` | Design and run org-level BPM workflows and approvals. |
| Business automation | `https://biz-automation.<your-host>` | Low-code automation: connectors, actions, and schedules. |
| Business site | `https://biz-site.<your-host>` | Build and publish public-facing organization sites. |
| Business shop | `https://biz-shop.<your-host>` | Commerce and storefront for an organization. |
| Business donation | `https://biz-donation.<your-host>` | Donation campaigns and fundraising for an organization. |

## Personal suite

For an individual. These are the `my-*` apps.

| App | URL | What it does |
| --- | --- | --- |
| My workflow | `https://my-workflow.<your-host>` | Personal workflows and task pipelines. |
| My automation | `https://my-automation.<your-host>` | Personal low-code automations and connectors. |
| My tasks | `https://my-tasks.<your-host>` | Personal task and to-do management. |
| My calendar | `https://my-calendar.<your-host>` | Personal calendar and reminders. |
| My notes | `https://my-notes.<your-host>` | Personal notes and documents. |
| My tracking | `https://my-tracking.<your-host>` | Personal location and asset tracking. |
| My site | `https://my-site.<your-host>` | Build and publish a personal site. |
| My shop | `https://my-shop.<your-host>` | Personal storefront and commerce. |
| My donation | `https://my-donation.<your-host>` | Personal donation and fundraising pages. |

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
