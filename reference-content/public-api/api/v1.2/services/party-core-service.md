# Party Core Service

Version: `0.0.0`

Gateway base path: `https://{host}/api/v1/party`

!!! warning "Deny-by-default authentication"
    Every published operation requires a valid OIDC bearer access token
    unless its `Auth` column reads `Public`. Authorization is deny-by-default:
    a principal holds only the roles explicitly granted to it, and any service
    surface outside the public tier is internal and is never published here.
    Obtain a token with the OIDC Authorization Code + PKCE flow (see the Auth
    setup page) and send it as `Authorization: Bearer <token>`.

## Operations

| Method | Path | Operation | Auth | Summary |
| --- | --- | --- | --- | --- |
| GET | `/parties/health` | `Parties_health` | Bearer | Liveness probe. |
| GET | `/parties/protected` | `Parties_protectedProbe` | Bearer + role | Role-gated probe (clinician, tenant-admin). |
| POST | `/parties/protected-write` | `Parties_protectedWrite` | Bearer + role | Demonstration write - actor bound to the JWT principal. |
| GET | `/parties/whoami` | `Parties_whoami` | Bearer + role | Principal-echo - returns the JWT-verified actor (header-trust proof). |
| GET | `/parties/{id}/candidate-matches` | `Parties_candidateMatches` | Bearer + role | Scored duplicate candidates for a party; the person-facing 'is this you?' surface + management merge-console source. |
| POST | `/parties/{id}/merge` | `Parties_merge` | Bearer + role | Merge duplicates into the survivor → golden record (most-complete fields + unioned identifiers). Reversible via unmerge. |
| POST | `/parties/{id}/unmerge` | `Parties_unmerge` | Bearer + role | Reverse the active merge into the survivor, restoring tombstoned losers. |

