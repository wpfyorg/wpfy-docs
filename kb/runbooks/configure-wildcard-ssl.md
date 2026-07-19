# Configure Wildcard SSL

## Goal

Configure Cloudflare-backed wildcard SSL for supported sites.

## Prerequisites

- Cloudflare manages the zone.
- A Cloudflare token with the required DNS permissions is available.
- Traefik is installed through wpfy.
- The target site is managed by wpfy.

## Steps

1. Store Cloudflare credentials with `wpfy dns cloudflare set`.
2. Run `wpfy dns cloudflare status`.
3. Run `wpfy dns cloudflare test`.
4. Configure the site with Cloudflare DNS mode, for example `wpfy config example.com --dns cloudflare`.
5. Enable SSL through the retained grouped SSL command.

## Verification

Confirm `wpfy site ssl example.com --status` reports certificate state after issuance.

## Failure Recovery

If the provider test fails, replace the token and rerun the test before retrying SSL.

## Cleanup

Use `wpfy dns cloudflare clear` only when the stored token should be removed.

## Related Reference Pages

[`wpfy dns cloudflare`](../commands/dns-cloudflare), [`SSL flow`](../reference/ssl-flow).
