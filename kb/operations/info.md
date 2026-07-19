# wpfy info

Show aggregate state across all managed sites and stack components.

## Syntax

```bash
wpfy info
wpfy info <domain>
wpfy info <domain> --nginx
wpfy info <domain> --php
wpfy info <domain> --mysql
```

## Examples

```bash
wpfy info
wpfy info example.com
wpfy info example.com --nginx
```

## Expected Output

**Aggregate (no domain):**
- Site count
- Traefik status
- Docker version
- Registry health

**Per-site:**
- Same output as `wpfy site info <domain>` with sanitized secrets

**Service inspection:**
- `--nginx`, `--php`, and `--mysql` are mutually exclusive and require a domain.
- Nginx output shows the authoritative generated web-service block and mounted Nginx config without resolved secrets.
- PHP and MySQL report stopped or unavailable runtimes without probing; attempted live-query failures return non-zero.
- MySQL reports not applicable for site flavors without a database.

## Related Commands

- [wpfy site info](/site-commands/site-info) — detailed per-site metadata
- [wpfy stack status](/stack-commands/stack-status)
