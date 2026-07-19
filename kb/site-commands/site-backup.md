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
- Includes app files, `.env`, `compose.yaml`, nginx config, and a database dump when runtime access is available
- Backup is not world-readable
- Does not stop the running site
- Stages SQL privately, verifies the archive before publishing it, and removes loose SQL/staging files on every exit
- Labels intentional offline filesystem-only backups as `database not included`; failed/empty dumps are failures

## Backup Contents

| Path in archive | Content |
|-----------------|---------|
| `app/` | WordPress files |
| `<domain>/backups/<archive>.sql` | MariaDB dump when included |
| `.env` | Environment variables (secrets preserved) |
| `compose.yaml` | Compose project definition |
| `nginx/` | Nginx configuration |

## Related Commands

- [wpfy site restore](/site-commands/site-restore)
