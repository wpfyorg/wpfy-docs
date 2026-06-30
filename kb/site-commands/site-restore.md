# wpfy site restore

Restore a site from a backup archive.

## Syntax

```bash
wpfy site restore <domain> /path/to/backup.tar.gz
```

## Examples

```bash
wpfy site restore example.com /var/lib/wpfy/backups/example.com/example.com-20260601-120000.tar.gz
```

## Expected Behavior

1. Validates archive members (no path traversal, absolute paths, links, devices)
2. Rejects archives rooted at a different domain
3. Stops existing runtime if present
4. Extracts scaffold files (`.env`, `compose.yaml`, `nginx/`, `app/`)
5. Starts runtime
6. Waits for MariaDB readiness
7. Imports SQL dump if present in archive
8. Preserves live DB credentials when `db-data/` is initialized

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Archive contains path traversal | Rejected before extraction |
| Archive domain mismatch | Rejected before extraction |
| Runtime start fails | Files extracted, error reported |
| SQL import fails | Runtime left running, import error reported |

## Related Commands

- [wpfy site backup](/site-commands/site-backup)
- [wpfy site create](/site-commands/site-create)
