# wpfy motd

Print a safe operator login summary.

## Status

Implemented.

## Syntax

```bash
wpfy motd [--compact]
```

## Options

| Option | Purpose |
|---|---|
| `--compact` | Print a shorter summary. |

## Safe Examples

```bash
wpfy motd
wpfy motd --compact
```

## Expected Behavior

The command summarizes version, Docker, Traefik, managed-site state, and warnings without dumping secrets.

## Files And Services Touched

Read-only host and wpfy state.

## Idempotency Notes

Read-only.

## Failure Modes

Unavailable Docker or unreadable state can appear as warnings.

## Recovery Steps

Run `wpfy healthcheck` or `wpfy debug` for a fuller breakdown.

## Related Commands

[`wpfy healthcheck`](./healthcheck), [`wpfy version`](./version).
