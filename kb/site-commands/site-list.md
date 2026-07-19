# wpfy site list

List all managed sites from the JSON registry.

## Syntax

```bash
wpfy site list
```

## Examples

```bash
wpfy site list
```

## Expected Behavior

- Reconciles `/var/lib/wpfy/sites.json` from authoritative site scaffolds before rendering
- Repairs registry drift atomically and leaves an already-current registry untouched
- Outputs domain, flavor, SSL status, and cache type

## Related Commands

- [wpfy site status](/site-commands/site-status) — detailed health per site
- [wpfy info](/operations/info) — aggregate state
