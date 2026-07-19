# wpfy backup edge

Back up Traefik configuration and ACME state.

## Status

Implemented as `wpfy backup-edge` in the parser and shown to users as `wpfy backup edge`.

## Syntax

```bash
wpfy backup edge [options]
```

## Options

| Option | Purpose |
|---|---|
| `--path <directory>` | Copy the edge archive to a destination directory. |
| `--s3` | Upload to configured S3-compatible storage. |
| `--profile <name>` | Use a named storage profile. |

## Safe Examples

```bash
wpfy backup edge --path /root/wpfy-edge-backups
wpfy backup edge --s3 --profile weekly
```

## Expected Behavior

The command archives managed Traefik configuration and certificate state separately from site backups.

## Files And Services Touched

Traefik managed config, ACME state, `/var/lib/wpfy/backups/edge/`, optional destination directory, and optional S3-compatible storage.

## Idempotency Notes

Each run writes a new timestamped archive.

## Failure Modes

Missing Traefik state, unreadable ACME data, archive validation failure, copy failure, or upload failure.

## Recovery Steps

Fix file permissions or storage configuration and rerun. Do not hand-edit ACME state to make a backup succeed.

## Related Commands

[`wpfy restore edge`](./restore-edge), [`wpfy stack`](./grouped-stack), [`SSL flow`](../reference/ssl-flow).
