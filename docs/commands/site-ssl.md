# `wpfy site ssl`

## Purpose
Enable or manage SSL for a site.

## Status
- Implemented: `site create` parses `-le`/`--letsencrypt` and runs DNS/IP preflight before changing files.
- Implemented: `site ssl <domain> --letsencrypt` runs DNS/IP preflight for an existing scaffold site, enables Traefik labels, and restarts runtime.
- Implemented: `site ssl <domain> --status` reads Traefik ACME storage and reports issued certificate metadata when available.
- Implemented: `site ssl <domain> --renew` removes the existing ACME entry and reloads Traefik so it can reissue on the next request.
- Implemented: domains behind Cloudflare are auto-detected during preflight and issued via the HTTP-01 challenge resolver (`le-http`).
- Implemented: wildcard SSL via Cloudflare DNS challenge with `--letsencrypt wildcard --dns cloudflare`.
- Implemented: preflight, status, renewal, and enable flows now emit sectioned summaries with readable certificate fields and next-step guidance.
- Implemented: SSL enablement uses the managed-site lifecycle module so preflight always completes before scaffold/runtime mutation and existing flavor/PHP settings are preserved.
- Implemented: for WordPress flavors, enabling SSL updates WordPress `home` and `siteurl` to `https://<domain>` and returns a non-zero result if either WP-CLI update fails.
- Implemented: preflight, ACME state reads, case-insensitive domain matching, metadata, expiry, and renewal share the `certificate_lifecycle.py` interface.
- Implemented: renewal confirms ACME backup creation and copy before rewrite, confirms rewrite before reload, and reports rewrite/reload partial failures truthfully while preserving the backup.
- Implemented: enabling SSL (via `site create -le`, `site update -le`, or `site ssl --letsencrypt`) requires a valid ACME contact email before preflight runs. The effective email is the one already written to the Traefik scaffold (`traefik.yml`), else `WPFY_ACME_EMAIL`; the historical `admin@localhost` default is rejected because Let's Encrypt refuses it at registration. Fix by setting `WPFY_ACME_EMAIL=you@example.com` and re-running `wpfy stack install --nginx`.

## Proxied domains (Cloudflare)
- TLS-ALPN-01 (the default `le` resolver) cannot validate behind a proxy because the proxy
  terminates TLS at its edge. Preflight also fails because the A record points at the proxy,
  not the VPS.
- When preflight resolves the domain to Cloudflare's published IP ranges, wpfy marks the site
  **proxied**, passes preflight, and routes ACME through the HTTP-01 resolver. Cloudflare
  forwards the `/.well-known/acme-challenge/` path to the origin on port 80 (it does not
  redirect it, even with "Always Use HTTPS"), so the challenge validates with no API token.
- Set Cloudflare's SSL mode to **Full** or **Full (strict)** (not "Flexible") and keep the
  domain proxied on port 80 so the challenge reaches the origin.
- Use `--proxied` / `--no-proxied` to override auto-detection (e.g. for a non-Cloudflare proxy,
  or to force the default TLS-ALPN path).

## Syntax
```bash
wpfy site create <domain> --wp -le [--proxied|--no-proxied]
wpfy site ssl <domain> --letsencrypt [--proxied|--no-proxied]
wpfy dns cloudflare set --token-stdin
wpfy site ssl <domain> --letsencrypt wildcard --dns cloudflare
wpfy site ssl <domain> --status
wpfy site ssl <domain> --renew
```

## Examples
```bash
wpfy site create example.com --wp -le              # auto-detects Cloudflare
wpfy site ssl proxied.example.com --letsencrypt --proxied
printf '%s\n' '<cloudflare-token>' | wpfy dns cloudflare set --token-stdin
wpfy site ssl example.com --letsencrypt wildcard --dns cloudflare
```

## Expected Files Touched
- `--preflight-only` is read-only.
- `--letsencrypt` updates the site scaffold and registry after DNS/IP preflight passes.
- Certificates are stored by Traefik in its ACME storage.
- Cloudflare DNS tokens are stored in `/etc/wpfy/dns-cloudflare.env`, mode `0600`, and are redacted in status/test output.

## Idempotency Behaviour
- Preflight-only command is read-only and safe to run repeatedly.
- Re-running SSL enablement keeps the site scaffold consistent and restarts runtime without deleting application data.

## Failure Modes
- ACME contact email not configured or invalid (set `WPFY_ACME_EMAIL`, re-run `wpfy stack install --nginx`).
- DNS A/AAAA records do not point to this VPS.
- Public IP detection fails.
- Traefik ACME storage is unavailable.
- ACME backup, rewrite, or Traefik reload fails; later mutation steps are blocked and partial state is reported.
- ACME client failure after preflight passes.

## Security Notes
- Do not call ACME if DNS/IP preflight fails.
- Wildcard certificates are Cloudflare-only for v1; no generic DNS abstraction is implemented.
