# `wpfy site restore`

## Purpose
Restore a managed site from a backup.

## Status
- Implemented: validated archive restore for per-site scaffold/app/config data.
- Implemented: runtime restart after restore and SQL import after DB readiness when SQL dumps are present.
- Implemented: local restore candidate listing without reading archive contents.

## Syntax
```bash
wpfy restore <domain> --list
wpfy restore <domain> <backup>
wpfy site restore <domain> --list
wpfy site restore <domain> <backup>
```

## Examples
```bash
wpfy restore example.com --list
wpfy site restore example.com /var/lib/wpfy/backups/example.com/backup.tar.gz
```

## Expected Files Touched
- Implemented: per-site files, backup archive extraction, and scaffold directories.
- Implemented: backup archives in `/var/lib/wpfy/backups/<domain>/`.
- Implemented: `--list` prints matching local `*.tar.gz` archive paths only; it does not inspect archive contents or start a restore.
- Implemented: validates archive members before extraction and rejects unsafe paths, links, device files, and archives rooted at another domain.
- Implemented: SQL dump import into the site's DB service when Docker is available.
- Implemented: restoring onto a site whose MariaDB volume (`db-data/`) is already initialized keeps the live `DB_NAME`/`DB_USER`/`DB_PASSWORD`/`DB_ROOT_PASSWORD` in `.env` instead of the archive's stale values (backups carry the SQL dump, not the DB volume, so the initialized volume only accepts its current credentials). Fresh restores keep the archive's values.

## Idempotency Behaviour
- Implemented for scaffold files: repeated restore from the same backup converges to the archive contents.
- Implemented for runtime: containers are stopped without deleting volumes, then restarted before SQL import.

## Failure Modes
- Backup not found.
- Backup integrity failure.
- Unsafe backup member path.
- Backup rooted at a different site domain.
- Existing site conflict.
- Database restore failure.
- Missing backup argument when `--list` is not used.

## Security Notes
- Must not restore one site’s secrets or data into another site accidentally.
- Must preserve per-site isolation boundaries.
- Restored `.env` files and SQL dumps must remain non-world-readable.
- Explicit `--latest`, remote restore/list/delete/prune, retention/prune, and Traefik/ACME restore are implemented on the flat backup/restore surfaces. Provider bucket lifecycle API automation remains deferred.
