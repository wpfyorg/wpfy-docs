# `wpfy site backup`

## Purpose
Create a backup for one managed site.

## Status
- Implemented: reads per-site scaffold/runtime data and writes a timestamped tarball backup.

## Syntax
```bash
wpfy site backup <domain>
```

## Examples
```bash
wpfy site backup example.com
```

## Expected Files Touched
- Implemented: `/var/lib/wpfy/backups/<domain>/<domain>-<timestamp>.tar.gz`.
- Implemented: may add a database dump to the backup archive when Docker runtime access is available.

## Idempotency Behaviour
- Implemented: each run creates a distinct timestamped backup artifact.

## Failure Modes
- Site not found.
- Database dump failure.
- Insufficient disk space.
- Permission errors.

## Security Notes
- Backup archives may contain secrets and must not be world-readable.
