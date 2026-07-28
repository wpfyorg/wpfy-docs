# ADR 0017: Per-site cron specifications and scheduling

- Status: Accepted
- Date: 2026-07-24

## Context

wpfy needs operator-defined recurring commands without weakening the per-site isolation boundary. A scheduler bug can be silent when a job never fires, or severe when a job fires every minute. A malformed expression must not be discovered inside the shared minute tick, where one site's bad state could prevent other sites from being considered. The selected service is also security-sensitive: an unchecked container or service name could redirect operator-supplied commands into another site's runtime or the shared Traefik proxy.

The existing interval-based `wpfy cron` surface runs WordPress cron events through host-level systemd timers. Per-site custom jobs are a separate feature and require their own persisted specification and matcher.

## Decision

Store each site's custom jobs in `<site>/cron.json` as a JSON list. Every entry has exactly these fields:

```json
{
  "id": "12-lowercase-hex-characters",
  "schedule": "minute hour day-of-month month day-of-week",
  "command": "operator command stored verbatim",
  "service": "app",
  "enabled": true,
  "timeout": 300
}
```

The identifier is generated once, persisted, short enough for operator output, and safe for the per-job lock filename introduced by the runner phase. The state file is written atomically with no-follow handling and mode `0600`. It is included in site backups and is not a generated scaffold file, so routine scaffold regeneration preserves it byte for byte.

Schedules use the standard five fields `minute hour day-of-month month day-of-week`. Supported syntax is `*`, single values, comma lists, inclusive ranges, `*/step`, and `range/step`. Sunday is accepted as both `0` and `7`, with `7` normalized to Sunday for matching. The matcher receives the moment explicitly; it does not read the clock or perform I/O.

When both day-of-month and day-of-week are restricted, matching uses the traditional Vixie cron rule: **either field may match**. When only one is restricted, that field must match. This OR convention is chosen for compatibility with operator expectations and common cron implementations; using AND would silently make familiar expressions run much less often.

All validation happens before a write. Invalid field counts, values, ranges, steps, control characters, and non-cron syntax are rejected before `cron.json` is replaced. The complete candidate job list is validated before persistence, so rejection leaves the prior file unchanged. Commands are not filtered for shell-like content because the site owner already has arbitrary command capability inside their own site container. Commands are stored verbatim; only values that cannot form a command/JSON round trip, such as an empty command, invalid UTF-8, or a NUL byte, are refused.

The `service` field is selected only from running services emitted for that site's Compose definition: `web` and `app`, plus `db`, `redis`, `sftp`, and `adminer` only when those services are configured for the site. The profile-only `wpcli` service is intentionally excluded because it has no long-running container for `compose exec`; WP-CLI commands run through `app`, which uses the same PHP image, has `wp` on `PATH`, and starts in `/var/www/html`. Jobs persisted by the immediately preceding runner phase with `service: wpcli` migrate to `app` on load so one legacy entry cannot invalidate the site's whole job list. Validation of new writes uses exact membership, never a pattern intended to recognize suspicious strings. This fail-closed whitelist rejects sibling container names, path-shaped values, injected delimiters/newlines/NULs, empty names, and the shared `wpfy-traefik` service.

The runner holds one non-blocking `flock` per site/job and invokes the command as container argv through the site's explicitly named Compose project. The authoritative bound runs inside the selected container as `timeout -k 5 <job-timeout>` around a fixed supervisor. That supervisor starts the operator command in a new session with `setsid`, sends `TERM` to the entire command process group on expiry, waits two seconds, then sends `KILL` to the group before returning. This process-group step is required because BusyBox `timeout` kills only its direct child and otherwise leaves background descendants running. The host-side subprocess timeout is 25 seconds longer than the configured job timeout: 15 seconds reserved for Docker/Compose exec startup before the in-container timer begins, five seconds for the outer in-container kill grace, and five seconds as a client-wedge backstop. Killing only the host `docker compose exec` client is insufficient because the exec'd container process can survive the disconnected client after the lock is released.

All supported target images currently provide both `timeout` and `setsid`. Raw Alpine/BusyBox `timeout` returns 143 when it expires after sending `TERM`, while the MariaDB Debian/coreutils implementation returns 124. The fixed supervisor emits a per-run random marker only from its timeout trap, so wpfy does not infer timeout from an ambiguous exit status: marker-bearing expiry is normalized to `outcome="timeout"`, `exit_code=124`, while a command that naturally exits 124 remains a failure. After a failed exec, Compose runtime state is probed with `compose ps --status running -q <service>`. An empty authoritative runtime result is skipped; the job's own stdout/stderr never decides whether the site is stopped.

Phase 4a.3 owns the specification and pure matcher. Phase 4a.4 added the minute tick, runner, locks, event recording, and CLI; Phase 4a.5 corrected timeout containment, runtime classification, and the selectable service set.

## Alternatives considered

- **One systemd service/timer per job:** rejected. It expands host-level mutable state, complicates lifecycle cleanup, and makes per-site isolation and fleet-wide failure handling harder to audit.
- **Write jobs into the host crontab or `/etc/cron*`:** rejected. Operator commands must never execute directly on the host, and wpfy does not mutate host crontab state for per-site jobs.
- **Validate only when the minute tick fires:** rejected. A typo would become a silently dead job or an exception in shared scheduling work.
- **Accept any container-looking service name:** rejected. Pattern validation cannot prove ownership; exact per-site service membership can.
- **Use AND when both day fields are restricted:** rejected because it diverges from traditional cron behavior and operator expectations.

## Consequences

- Job definitions fail early and prior valid state remains unchanged after a rejected write.
- Matcher behavior is deterministic and can be exhaustively tested without time or filesystem seams.
- A later site-definition change can make a previously configured service unavailable; the runner must fail closed for that site and continue processing other sites.
- Arbitrary command content remains confined by the execution boundary, not by brittle content filtering. Phase 4a.4 must pass commands as container argv and must not interpolate them into a host shell.
- Per-site job state follows backups and restores while remaining independent of scaffold regeneration.
- Host systemd is limited to the shared minute-tick mechanism, not one unit per operator job; host crontab mutation remains prohibited.
- A reported timeout means the in-container supervisor has ended the job before the lock is released; the longer host timeout is only a backstop for a wedged Compose client.
- Runtime-down skips come from Compose state, so application output such as `not running` cannot hide a failed job.
- Operators schedule WP-CLI work on `app`; the one-shot profile-only `wpcli` service is not a valid per-site cron target.
