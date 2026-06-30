# wpfy site status

Show site readiness: scaffold, bootstrap, runtime, HTTP health, and service checks.

## Syntax

```bash
wpfy site status <domain>
```

## Examples

```bash
wpfy site status example.com
```

## Expected Output

| Check | What it verifies |
|-------|-----------------|
| Scaffold | `compose.yaml` and `.env` exist |
| Bootstrap | WordPress files exist in `app/` |
| Runtime | Containers are running (`docker compose ps`) |
| HTTP | `healthz.html` returns 200 |
| SSL | Certificate metadata (issuer, expiry, SANs) |
| Services | Flavor-aware: MariaDB, Redis, WP-CLI |

## When Docker is Unavailable

If `WPFY_SKIP_RUNTIME=1` is set or Docker is missing, status falls back to scaffold-only checks and reports `runtime unavailable`.

## Related Commands

- [wpfy site list](/site-commands/site-list) — all sites at a glance
- [wpfy debug](/operations/debug) — deep diagnostic audit
