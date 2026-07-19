# wpfy backup

Create or list site backup archives. This is the primary flat backup command.

## Status

Implemented. `wpfy site backup` is retained for compatibility.

## Syntax

```bash
wpfy backup <domain|all> [options]
```

## Options

| Option | Purpose |
|---|---|
| `--list` | List local archives for the site. |
| `--path <directory>` | Copy the verified archive to a destination directory. |
| `--keep-local <count>` | Keep only the newest local archives after backup. |
| `--profile <name>` | Use a named storage profile for upload. |
| `--s3` | Upload the verified archive to configured S3-compatible storage. |

## Safe Examples

```bash
wpfy backup example.com
wpfy backup example.com --list
wpfy backup example.com --s3 --profile weekly --keep-local 7
wpfy backup all
```

## Expected Behavior

The command creates a local archive first, verifies it, and only then copies or uploads it. S3-compatible archive uploads are file-backed, fixed-length, signed single requests, so Python memory stays bounded as archive size grows. `all` processes managed sites in a deterministic order and returns nonzero if any site fails.

## Files And Services Touched

`/var/lib/wpfy/backups/<domain>/`, optional destination directories, and optional configured S3-compatible storage.

## Idempotency Notes

Each backup creates a new timestamped archive. Listing does not inspect archive contents.

## Failure Modes

Missing site, unreadable app files, archive verification failure, destination copy failure, or upload failure.

Multipart upload, resume, and progress reporting are not implemented.

## Recovery Steps

Keep the local archive when upload fails, fix destination or storage settings, and rerun. Use `backup-prune` only after verifying the retention target.

## Related Commands

[`wpfy backup storage`](./backup-storage), [`wpfy backup remote`](./backup-remote), [`wpfy restore`](./restore).
