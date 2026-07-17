# API and event reference

Versioned, generated from the CuraOS contract pipeline (TypeSpec -> OpenAPI /
AsyncAPI). Reference surfaces are DENY-BY-DEFAULT: a service appears only when
its key is in the public tier of `config/api-tiers.json`.

!!! warning "Deny-by-default authentication"
    Every published operation requires a valid OIDC bearer access token
    unless its `Auth` column reads `Public`. Authorization is deny-by-default:
    a principal holds only the roles explicitly granted to it, and any service
    surface outside the public tier is internal and is never published here.
    Obtain a token with the OIDC Authorization Code + PKCE flow (see the Auth
    setup page) and send it as `Authorization: Bearer <token>`.

- [HTTP API reference](api/index.md)
- [Event contracts](events/index.md)

