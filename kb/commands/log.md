# wpfy log

Inspect or reset service logs, including cron logs.

## Status

Implemented.

## Syntax

```bash
wpfy log show <domain> [options]
wpfy log reset <domain>
wpfy log cron [--lines <n>]
```

## Options

| Option | Purpose |
|---|---|
| `--nginx`, `--php`, `--mysql` | Select service logs. |
| `--follow` | Follow container log output. |
| `--lines <n>` | Limit output lines. |

## Safe Examples

```bash
wpfy log show example.com --php --lines 100
wpfy log cron --lines 100
```

## Expected Behavior

The command reads managed service logs or restarts containers for reset.

## Files And Services Touched

Container logs and `/var/log/wpfy/cron.log`; `reset` restarts containers.

## Idempotency Notes

Log reads are read-only. Reset is operationally safe but mutates runtime state by restarting containers.

## Failure Modes

Missing site, Docker unavailable, missing cron log, or container restart failure.

## Recovery Steps

Use `wpfy healthcheck` and service-specific log selection to narrow the issue.

## Related Commands

[`wpfy cron`](./cron), [`wpfy healthcheck`](./healthcheck), [`Debug site`](../runbooks/debug-site).
