# Tenancy Core Service Events

Version: `1.0.0`

Tenant lifecycle events produced by the tenancy-core-service Diamond root. snake_case ON THE WIRE - the shared envelope contract (do NOT camelCase).

!!! warning "Deny-by-default authentication"
    Every published operation requires a valid OIDC bearer access token
    unless its `Auth` column reads `Public`. Authorization is deny-by-default:
    a principal holds only the roles explicitly granted to it, and any service
    surface outside the public tier is internal and is never published here.
    Obtain a token with the OIDC Authorization Code + PKCE flow (see the Auth
    setup page) and send it as `Authorization: Bearer <token>`.

## Channels

| Channel | Address | Messages |
| --- | --- | --- |
| `tenantCreated` | `curaos.core.tenancy.tenant.created.v1` | TenantCreated |
| `tenantUpdated` | `curaos.core.tenancy.tenant.updated.v1` | TenantUpdated |
| `tenantSuspended` | `curaos.core.tenancy.tenant.suspended.v1` | TenantSuspended |
| `tenantDeleted` | `curaos.core.tenancy.tenant.deleted.v1` | TenantDeleted |

