# wpfy site show

Display the generated `compose.yaml` for a site.

## Syntax

```bash
wpfy site show <domain>
```

## Examples

```bash
wpfy site show example.com
```

## Expected Output

The full Docker Compose definition for the site — services, networks, volumes, labels. Useful for debugging or manual inspection.

## Related Commands

- [wpfy site info](/site-commands/site-info) — parsed metadata
- [wpfy debug](/operations/debug) — full diagnostics
