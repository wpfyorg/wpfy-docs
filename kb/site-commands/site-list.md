# wpfy site list

List all managed sites from the JSON registry.

## Syntax

```bash
wpfy site list
wpfy site list --enabled
wpfy site list --disabled
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--enabled` | bool | Show only SSL-enabled sites |
| `--disabled` | bool | Show only non-SSL sites |

## Examples

```bash
wpfy site list
wpfy site list --enabled
```

## Expected Behavior

- Reads `/var/lib/wpfy/sites.json`
- Outputs a table: domain, flavor, PHP version, SSL status, creation date

## Related Commands

- [wpfy site status](/site-commands/site-status) — detailed health per site
- [wpfy info](/operations/info) — aggregate state
