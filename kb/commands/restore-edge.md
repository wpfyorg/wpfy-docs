# wpfy restore edge

Restore Traefik configuration and ACME state from an edge backup archive.

## Status

Implemented as `wpfy restore-edge` in the parser and shown to users as `wpfy restore edge`.

## Syntax

```bash
wpfy restore edge <archive> --force
```

## Options

| Option | Purpose |
|---|---|
| `--force` | Confirm restoration of managed edge state. |

## Safe Examples

```bash
wpfy restore edge /root/wpfy-edge-backups/edge-20260708120000.tar.gz --force
```

## Expected Behavior

The archive is validated before managed Traefik config or ACME state is written.

## Files And Services Touched

Managed Traefik files and ACME certificate state.

## Idempotency Notes

Restoring the same archive should return the same managed edge state.

## Failure Modes

Missing archive, unsafe archive members, missing `--force`, or Traefik reload failure.

## Recovery Steps

Choose a known edge backup and rerun with `--force` only after confirming it is the intended restore point.

## Related Commands

[`wpfy backup edge`](./backup-edge), [`SSL flow`](../reference/ssl-flow), [`wpfy stack`](./grouped-stack).
