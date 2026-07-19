# wpfy backup remote

List, restore, delete, and prune backup objects in configured S3-compatible storage.

## Status

Implemented as `wpfy backup-remote` in the parser and shown to users as `wpfy backup remote`.

## Syntax

```bash
wpfy backup remote list|restore|delete|prune <domain> [options]
```

## Options

| Option | Purpose |
|---|---|
| `--profile <name>` | Use a named storage profile. |
| `--key <object-key>` | Select one remote object for delete or restore. |
| `--latest` | Restore the newest remote archive explicitly. |
| `--keep <count>` | Retain newest remote archives during prune. |
| `--force` | Confirm destructive remote delete or prune. |

## Safe Examples

```bash
wpfy backup remote list example.com --profile weekly
wpfy backup remote restore example.com --latest --profile weekly
wpfy backup remote prune example.com --keep 7 --profile weekly --force
```

## Expected Behavior

Remote restore downloads in bounded chunks to a private temporary file and validates the completed archive before touching live runtime. Malformed and truncated archives fail without stopping the site. Restore rejects symlinks in the live restore tree and replaces archive-owned entries without following destination symlinks. The temporary file is removed after successful, rejected, or interrupted restores. Delete and prune operate only under the managed domain prefix.

## Files And Services Touched

Configured S3-compatible storage and temporary local download files during restore.

## Idempotency Notes

Listing is read-only. Restore is explicit. Delete and prune require `--force`.

## Failure Modes

Missing storage config, provider errors, missing object keys, invalid archive, or failed restore.

## Recovery Steps

Run `backup remote list`, choose a known archive, and retry restore or prune with explicit options.

## Related Commands

[`wpfy backup storage`](./backup-storage), [`wpfy restore`](./restore), [`wpfy backup`](./backup).
