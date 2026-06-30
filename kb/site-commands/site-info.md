# wpfy site info

Show detailed metadata and file paths for a site. Secrets are sanitized.

## Syntax

```bash
wpfy site info <domain>
```

## Examples

```bash
wpfy site info example.com
```

## Expected Output

- Domain, flavor, PHP version, SSL status
- File paths: compose.yaml, .env, app root, nginx config
- Container names and image tags
- Registry metadata from `/var/lib/wpfy/sites.json`

## Security Notes

WPFY never prints secrets from `.env` or state files. Password fields are redacted.

## Related Commands

- [wpfy site status](/site-commands/site-status) — runtime health
- [wpfy site show](/site-commands/site-show) — raw compose.yaml
