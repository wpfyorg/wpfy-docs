# wpfy site backup

Create a timestamped backup archive of site files and database.

## Syntax

```bash
wpfy site backup <domain>
```

## Examples

```bash
wpfy site backup example.com
```

## Expected Behavior

- Creates tarball at `/var/lib/wpfy/backups/<domain>/<domain>-<timestamp>.tar.gz`
- Includes: app files, database dump, `.env`, `compose.yaml`, nginx config
- Backup is not world-readable
- Does not stop the running site

## Backup Contents

| Path in archive | Content |
|-----------------|---------|
| `app/` | WordPress files |
| `db-dump.sql` | MariaDB dump |
| `.env` | Environment variables (secrets preserved) |
| `compose.yaml` | Compose project definition |
| `nginx/` | Nginx configuration |

## Related Commands

- [wpfy site restore](/site-commands/site-restore)
