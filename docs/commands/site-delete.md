# `wpfy site delete`

## Purpose
Remove a managed site and its Docker/Compose resources.

## Status
- Implemented: stops the per-site Compose runtime, removes containers/volumes, deletes the per-site scaffold directory, and removes registry metadata.
- Implemented: missing sites return a clean `site not found` error.
- Implemented: the user-facing summary now reports backup, runtime stop, and file removal as separate lines.

## Syntax
```bash
wpfy site delete <domain>
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
- Implemented: runtime stop/remove is skipped safely when Docker is unavailable.

## Failure Modes
- Site not found.
- Containers fail to stop.
- Volume removal blocked.

## Security Notes
- Must not delete resources belonging to another site.
- Destructive data removal should require explicit confirmation or a documented force flag.
