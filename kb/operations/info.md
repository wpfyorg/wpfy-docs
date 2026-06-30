# wpfy info

Show aggregate state across all managed sites and stack components.

## Syntax

```bash
wpfy info
wpfy info <domain>
```

## Examples

```bash
wpfy info
wpfy info example.com
```

## Expected Output

**Aggregate (no domain):**
- Site count
- Traefik status
- Docker version
- Registry health

**Per-site:**
- Same output as `wpfy site info <domain>` with sanitized secrets

## Related Commands

- [wpfy site info](/site-commands/site-info) — detailed per-site metadata
- [wpfy stack status](/stack-commands/stack-status)
