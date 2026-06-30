# Runbook: Enable SSL

## Status
- Implemented with DNS/IP preflight and Traefik ACME.

## Goal
Enable Let’s Encrypt SSL for a site.

## Steps
1. Point domain A/AAAA records to the VPS.
2. Run `wpfy site create example.com --wp -le` or `wpfy site ssl example.com --letsencrypt`.
3. `wpfy` automatically checks DNS/IP records.
4. If records match, `wpfy` attempts ACME issuance.
5. If records do not match, `wpfy` stops before ACME.
6. Check certificate state with `wpfy site ssl example.com --status`.
7. Expect `site ssl` to report preflight and certificate status as sectioned summaries.

## Recovery
- Fix DNS records and retry.
- See `unblock-failed-ssl.md`.
