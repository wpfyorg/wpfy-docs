# wpfy restore

Restore one managed site from a local backup archive.

## Status

Implemented. `wpfy site restore` is retained for compatibility.

## Syntax

```bash
wpfy restore <domain> [backup] [--list|--latest]
```

## Options

| Option | Purpose |
|---|---|
| `--list` | List local archive candidates. |
| `--latest` | Restore the newest local archive explicitly. |

## Safe Examples

```bash
wpfy restore example.com --list
wpfy restore example.com /var/lib/wpfy/backups/example.com/example.tar.gz
wpfy restore example.com --latest
```

## Expected Behavior

The command validates archive members before stopping runtime or extracting files. It imports SQL dumps after database readiness when present.

## Files And Services Touched

The managed site scaffold, app files, runtime containers, and database import path when the archive includes SQL.

## Idempotency Notes

Restoring the same validated archive should produce the same file state. `--latest` is explicit to avoid accidental newest-archive restores.

## Failure Modes

Missing site, missing archive, unsafe archive members, domain mismatch, Docker/database readiness failure, or SQL import failure.

## Recovery Steps

Run `--list`, select a known archive, and retry. Unsafe archives are rejected before live runtime is stopped.

## Related Commands

[`wpfy backup`](./backup), [`wpfy backup remote`](./backup-remote), [`wpfy restore edge`](./restore-edge).
