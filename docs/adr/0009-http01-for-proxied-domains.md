# ADR 0009: HTTP-01 challenge for proxied domains

Date: 2026-06-05
Status: Accepted

## Context
SSL issuance fails when a domain sits behind a TLS-terminating reverse proxy such as Cloudflare
in "orange-cloud" mode, for two independent reasons:
1. The DNS/IP preflight (ADR 0003) rejects the domain because its A record points at the proxy,
   not the VPS.
2. The default TLS-ALPN-01 challenge (resolver `le`, ADR 0005) cannot validate because the proxy
   terminates TLS at its edge, so Let's Encrypt's `acme-tls/1` handshake never reaches the origin.

We do not hold a Cloudflare API token, so DNS-01 is not available.

## Decision
Detect proxied domains and issue via the HTTP-01 challenge:
- Add a second Traefik resolver `le-http` using `httpChallenge` on the `web` (:80) entrypoint.
- `preflight_ssl` compares resolved IPs against Cloudflare's published CIDR ranges
  (vendored in `src/wpfy/cloudflare_ranges.py`). All-Cloudflare → `mode="proxied"`, preflight
  passes, and the site routes to `le-http`. Direct domains keep `le`/TLS-ALPN unchanged.
- `--proxied`/`--no-proxied` overrides auto-detection.

## Reasoning
Cloudflare forwards `/.well-known/acme-challenge/...` to the origin over plain HTTP on port 80
and does not redirect it (even with "Always Use HTTPS"), so HTTP-01 validates with no
credentials. Auto-detection keeps the default `-le` flow working without a new flag.

## Alternatives Considered
- DNS-01 via a Cloudflare API token — rejected: we will not hold the token.
- Cloudflare Origin Certificates — rejected: not ACME, requires manual cert installation.
- Relax preflight but keep TLS-ALPN-01 — rejected: the challenge still cannot reach the origin.

## Consequences
- The vendored Cloudflare CIDR table must be refreshed if Cloudflare changes its ranges
  (`WPFY_CLOUDFLARE_RANGES` overrides it for tests / edge cases).
- Cloudflare must use SSL mode "Full" or "Full (strict)" and keep port 80 proxied.
- `acme.json` now holds two resolvers; status/renew code iterates all resolver keys.

## Follow-up Tasks
- Optional: live HTTP-01 round-trip probe in preflight.
- Optional: DNS-01 path + wildcard certs once a token-bearing flow is in scope.
