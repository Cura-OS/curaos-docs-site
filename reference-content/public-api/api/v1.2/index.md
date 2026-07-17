# Public HTTP API reference (v1.2)

Generated from the services' OpenAPI specs.
DENY-BY-DEFAULT: only surfaces in the public tier of `config/api-tiers.json` appear here.

!!! warning "Deny-by-default authentication"
    Every published operation requires a valid OIDC bearer access token
    unless its `Auth` column reads `Public`. Authorization is deny-by-default:
    a principal holds only the roles explicitly granted to it, and any service
    surface outside the public tier is internal and is never published here.
    Obtain a token with the OIDC Authorization Code + PKCE flow (see the Auth
    setup page) and send it as `Authorization: Bearer <token>`.

## Published surfaces

- [party-core-service](services/party-core-service.md)

