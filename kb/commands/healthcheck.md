# wpfy healthcheck

Run flat operator health checks.

## Status

Implemented.

## Syntax

```bash
wpfy healthcheck [all|system|disk|load|app]
```

## Options

| Option | Purpose |
|---|---|
| `--warn <percent>` | Disk warning threshold where supported. |
| `--fail <percent>` | Disk failure threshold where supported. |
| `--all-sites` | Run app checks across managed sites. |

## Safe Examples

```bash
wpfy healthcheck
wpfy healthcheck disk --warn 80 --fail 90
wpfy healthcheck app example.com
wpfy healthcheck app --all-sites
```

## Expected Behavior

The command returns nonzero when a checked surface fails. `WPFY_SKIP_RUNTIME=1` is reported as a warning rather than hidden.

## Files And Services Touched

Read-only checks over host state, registry state, and selected site runtime state.

## Idempotency Notes

Read-only.

## Failure Modes

High disk usage, load issues, missing runtime, unhealthy site, or Docker unavailable.

## Recovery Steps

Use `wpfy debug`, `wpfy log`, and the site-specific status output to isolate the failed check.

## Related Commands

[`wpfy motd`](./motd), [`wpfy log`](./log), [`wpfy site status`](./grouped-site).
