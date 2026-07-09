# SSL Flow

## Implemented
- CLI parses `-le` and `--letsencrypt` on `wpfy site create`.
- DNS/IP preflight is implemented using A/AAAA lookup and VPS public IP detection.
- `wpfy site create <domain> -le` runs preflight before changing site files.
- `wpfy site ssl <domain> --letsencrypt` runs preflight for an existing scaffold site.
- Traefik handles ACME issuance after a preflight-passing site is configured with TLS labels.
- `wpfy site ssl --status` reads Traefik ACME certificate metadata when available.
- `wpfy site ssl --renew` forces renewal by removing the matching ACME entry and reloading Traefik.

## Behaviour
- SSL is opt-in through `-le` or `--letsencrypt`.
- When SSL is requested, `wpfy` automatically runs DNS/IP preflight.
- If preflight fails, `wpfy` must not attempt ACME issuance.
- If preflight passes, `wpfy` updates the site scaffold/registry, restarts runtime, and lets Traefik request the certificate.

## Current Commands
- `wpfy site create <domain> --wp -le`
- `wpfy site ssl <domain> --letsencrypt`

## DNS/IP Preflight
- Implemented: resolve A/AAAA records with Python `socket.getaddrinfo`.
- Implemented: detect public IPv4/IPv6 through public IP services.
- Implemented: compare domain records to VPS public IPs.
- Implemented: stop with a clear error if records do not point to this VPS.

## Challenge Reachability
- Implemented: TLS challenge via Traefik's `le` resolver (direct domains).
- Implemented: HTTP-01 challenge via Traefik's `le-http` resolver (proxied domains).

## Proxied Domains (Cloudflare)
- Behind an "orange-cloud" proxy SSL fails twice: (1) preflight rejects because the A record
  resolves to the proxy, not the VPS; (2) TLS-ALPN-01 cannot validate because the proxy
  terminates TLS before the origin.
- Fix: detect the proxy and switch to HTTP-01. Cloudflare proxies port 80 and forwards
  `/.well-known/acme-challenge/...` to the origin without redirecting it, so a plain-HTTP
  challenge validates with no API token.
- Detection: `preflight_ssl` checks the resolved IPs against Cloudflare's published CIDRs
  (`src/wpfy/cloudflare_ranges.py`). All-Cloudflare → `mode="proxied"` → resolver `le-http`.
  Mixed or non-Cloudflare mismatch → fail as before. `--proxied`/`--no-proxied` overrides.
- Requirement: Cloudflare SSL mode must be "Full" or "Full (strict)" (not "Flexible") and the
  domain must stay proxied on port 80.

## Failure Message Requirements
- Show the domain checked.
- Show resolved A/AAAA records.
- Show detected VPS public IPs.
- Explain that Let’s Encrypt was not attempted.
- Tell the user to update DNS and retry.
- Current preflight failure path satisfies these requirements.

## Wildcard Path
- Implemented for Cloudflare DNS: store the token with `wpfy dns cloudflare set --token-stdin`, then use `--letsencrypt wildcard --dns cloudflare`.
- Base-domain DNS/IP preflight still runs before scaffold/runtime mutation.
- IP preflight alone is insufficient for wildcard certificates; provider credentials are required.
