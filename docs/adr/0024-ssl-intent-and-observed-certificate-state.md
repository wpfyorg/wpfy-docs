# ADR 0024: Separate SSL intent from observed certificate state

- Status: Accepted
- Date: 2026-07-28
- Extends: ADR 0005 Traefik edge proxy; ADR 0010 deep domain modules

## Context

A site's `SiteDefinition` persists the operator's desired TLS routing through `letsencrypt` and `ssl_enabled`. That state proves only that wpfy rendered a TLS router and asked Traefik to use an ACME resolver. It does not prove that ACME registration or certificate issuance succeeded. A bad contact address, rate limit, later DNS change, or firewall can leave Traefik serving its default certificate while `wpfy site list` says `ssl=enabled`.

Issuance is asynchronous and owned by Traefik. Making every list or status command perform a public TLS request would make local inspection network-dependent, slow, and vulnerable to unrelated DNS and routing failures. Persisting a second certificate-success flag would also become stale whenever Traefik renews, loses, or replaces its ACME state outside a site mutation.

## Decision

Keep `SiteDefinition` authoritative for desired configuration and derive observed certificate state from Traefik's local `acme.json`, through `certificate_lifecycle.get_cert_info`. No network request is added to `site list`, `site info`, or `site status`.

The CLI reports three distinct states:

- `ssl=disabled`: no TLS routing was requested in the site definition.
- `ssl=requested`: TLS routing is configured, but no matching certificate is present in local ACME state.
- `ssl=enabled`: TLS routing is configured and a matching issued certificate is present in local ACME state.

`site info` also reports the observed certificate status and issuer when available. `site status` reports both the desired/observed SSL summary and the certificate observation. Enabling SSL is described as a request, not completed issuance; the command tells the operator that the certificate is not yet verified and to make an HTTPS request before checking status.

## Alternatives considered

- Persist `requested`, `issued`, and `failed` in `SiteDefinition`: rejected because Traefik can change certificate state asynchronously, making persisted observations stale without a reconciliation daemon.
- Probe the public HTTPS endpoint on every list/status command: rejected because routine local inspection would become slow and network-fallible, and a successful TLS handshake still would not identify which local Traefik state produced it.
- Keep displaying `enabled` as intent and require `site ssl --status` for truth: rejected because the default list is the operator's primary fleet summary and must not present an unissued certificate as healthy.
- Block the SSL command until issuance completes: rejected because issuance is asynchronous, can exceed a bounded CLI wait, and may require the first public request to trigger it.

## Consequences

- `ssl=enabled` now means a certificate was observed in local ACME state, not merely requested.
- `ssl=requested` is intentionally conservative when ACME state is unavailable or a domain is absent from it.
- The local observation avoids network latency but cannot prove what a remote client currently receives through external DNS, CDN, or firewall layers; live validation remains required for release acceptance.
- The registry and `.env` remain records of desired configuration. No asynchronous certificate fact is duplicated into persisted site state.
