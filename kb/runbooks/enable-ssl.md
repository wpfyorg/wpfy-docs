# Enable SSL

## Goal

Enable TLS for a managed site without attempting ACME issuance before DNS is ready.

## Prerequisites

- A managed site exists.
- Traefik is installed and running through `wpfy stack install --nginx`.
- A valid ACME contact email is configured.
- DNS A or AAAA records point at the server.

## Steps

1. Confirm DNS points at the host.
2. Run `wpfy site ssl example.com --preflight-only`.
3. Run `wpfy site ssl example.com --letsencrypt`.
4. Run `wpfy site ssl example.com --status`.

## Verification

The status output should show certificate metadata when Traefik has issued a certificate. WordPress sites should use the HTTPS home and site URL after SSL enablement.

## Failure Recovery

If preflight fails, fix DNS before retrying. Do not force ACME issuance around a failed preflight.

## Cleanup

No cleanup is required. Failed preflight should not change site files.

## Related Reference Pages

[`SSL flow`](../reference/ssl-flow), [`wpfy dns cloudflare`](../commands/dns-cloudflare), [`wpfy stack`](../commands/grouped-stack).
