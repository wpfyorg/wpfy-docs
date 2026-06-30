# wpfy site ssl

Enable or manage Let's Encrypt SSL for a site.

## Syntax

```bash
wpfy site ssl <domain> --letsencrypt
wpfy site ssl <domain> --status
wpfy site ssl <domain> --renew
wpfy site ssl <domain> --preflight-only
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--letsencrypt` | bool | Enable SSL (runs DNS preflight first) |
| `--status` | bool | Show certificate issuer, validity, SANs, expiry |
| `--renew` | bool | Force certificate renewal |
| `--preflight-only` | bool | Run DNS/IP checks without changing anything |
| `--proxied` | bool | Force HTTP-01 challenge (for proxied domains) |
| `--no-proxied` | bool | Force TLS-ALPN-01 (direct connection) |

## Examples

```bash
wpfy site ssl example.com --letsencrypt
wpfy site ssl example.com --status
wpfy site ssl example.com --renew
wpfy site ssl example.com --preflight-only
```

## Expected Behavior

**`--letsencrypt`:**
- Runs DNS A/AAAA vs public IP preflight
- Blocks file changes if preflight fails
- Updates site scaffold with Traefik router labels
- Restarts runtime so Traefik picks up the new labels
- For WordPress: updates `home` and `siteurl` to `https://`

**`--status`:**
- Reads Traefik ACME storage (`acme.json`)
- Reports issuer, validity period, SANs, days until expiry
- Warns when expiry is < 30 days

**`--renew`:**
- Removes domain entry from `acme.json`
- Reloads Traefik so it reissues on next request

## Proxied Domains (Cloudflare)

WPFY auto-detects Cloudflare-proxied domains during preflight. When detected:
- Uses HTTP-01 challenge instead of TLS-ALPN-01
- Cloudflare forwards `/.well-known/acme-challenge/` to origin on port 80
- Set CF SSL mode to **Full** or **Full (strict)**

Override auto-detection with `--proxied` or `--no-proxied`.

## Preflight Requirement

Requires `WPFY_ACME_EMAIL` to be set before SSL enrollment. Fix by running:

```bash
export WPFY_ACME_EMAIL=you@example.com
wpfy stack install --nginx
```

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| No ACME email configured | Blocked, no file changes |
| DNS doesn't point to VPS | Preflight fails, blocked |
| Public IP detection fails | Preflight fails, blocked |
| Traefik ACME storage unavailable | Status read fails |
| ACME issuance fails | Non-zero exit after preflight passes |

## Related Commands

- [wpfy site create -le](/site-commands/site-create)
- [Stack install](/stack-commands/stack-install)
