# wpfy debug

Run full diagnostics across Docker, Traefik, and all managed sites.

## Syntax

```bash
wpfy debug
wpfy debug <domain>
```

## Examples

```bash
wpfy debug
wpfy debug example.com
```

## Expected Output

Reports PASS / WARN / FAIL for each check:

| Category | Checks |
|----------|--------|
| Docker | Engine availability, Compose plugin, version |
| Traefik | Container status, network, ACME config |
| Disk | Usage under `/opt/wpfy/`, `/var/lib/wpfy/` |
| Registry | Filesystem consistency, orphaned/unregistered sites |
| Per-site | Compose config, container health, HTTP response, SSL cert, DB connectivity |

## Related Commands

- [wpfy site status](/site-commands/site-status) — single site health
- [wpfy secure](/operations/secure) — security audit
