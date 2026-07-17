# Party Core Service Events

Version: `1.0.0`

Domain events produced by the party-core-service Diamond root. snake_case ON THE WIRE - the shared envelope contract (do NOT camelCase).

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
| `partyRegistered` | `curaos.core.party.registered.v1` | PartyRegistered |
| `partyUpdated` | `curaos.core.party.updated.v1` | PartyUpdated |
| `partyDeleted` | `curaos.core.party.deleted.v1` | PartyDeleted |
| `partyMerged` | `curaos.core.party.merged.v1` | PartyMerged |
| `partyUnmerged` | `curaos.core.party.unmerged.v1` | PartyUnmerged |
| `partyRoleAssigned` | `curaos.core.party.role-assigned.v1` | PartyRoleAssigned |
| `partyRoleRevoked` | `curaos.core.party.role-revoked.v1` | PartyRoleRevoked |

