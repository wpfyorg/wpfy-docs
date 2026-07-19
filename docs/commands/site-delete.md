# `wpfy site delete`

## Purpose
Remove a managed site and its Docker/Compose resources.

## Status
- Implemented: stops the per-site Compose runtime, removes containers/volumes, deletes the per-site scaffold directory, and removes registry metadata.
- Implemented: missing sites return a clean `site not found` error.
- Implemented: the user-facing summary now reports backup, runtime stop, and file removal as separate lines.
- Implemented: deletion requires a complete database-aware safety backup and a confirmed runtime stop before scaffold or registry removal.

## Syntax
```bash
wpfy site delete <domain> [--force]
```

## Examples
```bash
wpfy site delete example.com
```

## Expected Files Touched
- Implemented: `/opt/wpfy/sites/<domain>/`.
- Implemented: per-site Docker containers, network, and volumes when Docker is available.
- Implemented: registry metadata under `/var/lib/wpfy/sites.json`.

## Idempotency Behaviour
- Implemented: deleting an already deleted site exits with `site not found`.
- Implemented: failed/skipped/incomplete backup and failed/skipped runtime stop are non-bypassable blockers.

## Failure Modes
- Site not found.
- Containers fail to stop.
- Volume removal blocked.
- Safety backup failed, was incomplete, or could not include the database.

## Security Notes
- Must not delete resources belonging to another site.
- `--force` bypasses interactive confirmation only; it never bypasses backup or runtime-stop safeguards.
