# `wpfy cron`

## Purpose
Run WordPress due events and small operator interval tasks, manually or through systemd timers.

## Status
- Implemented: manual interval runners for `minute`, `five-minute`, `hourly`, `six-hour`, `daily`, and `weekly`.
- Implemented: each interval runs `wp cron event run --due-now --allow-root` for managed WordPress sites in sorted order.
- Implemented: one systemd service/timer pair per interval through `wpfy cron install|status|disable`.
- Implemented: safe custom hooks at `/etc/wpfy/custom/cron/<interval>.sh`.
- Implemented: cron output at `/var/log/wpfy/cron.log` and `wpfy log cron [--lines N]`.

## Syntax
```bash
wpfy cron minute
wpfy cron five-minute
wpfy cron hourly
wpfy cron six-hour
wpfy cron daily
wpfy cron weekly
wpfy cron install
wpfy cron status
wpfy cron disable
wpfy log cron [--lines N]
```

## Built-in Interval Tasks
- `minute`: WordPress due events only.
- `five-minute`: WordPress due events plus load health.
- `hourly`: WordPress due events plus disk health.
- `six-hour`: WordPress due events; no host mutation tasks.
- `daily`: WordPress due events, all-site health summary, and cron log rotation.
- `weekly`: WordPress due events plus update-check guidance only.

## Expected Files Touched
- Implemented: `/var/log/wpfy/cron.log`.
- Implemented: `/etc/systemd/system/wpfy-cron-<interval>.service`.
- Implemented: `/etc/systemd/system/wpfy-cron-<interval>.timer`.
- Optional operator hook: `/etc/wpfy/custom/cron/<interval>.sh`.

## Idempotency Behaviour
- Implemented: `wpfy cron install` overwrites the managed service/timer files.
- Implemented: `wpfy cron disable` removes managed cron timer and service files.
- Implemented: interval runners skip Docker/WP-CLI execution when runtime is skipped or Docker is unavailable.

## Failure Modes
- WordPress cron failures for one site are reported without hiding later cleanup/reporting.
- Unsafe custom hooks are refused.
- Custom hook failures are logged and reported.
- Missing `systemctl` or systemd failures can make timer install/disable fail.

## Security Notes
- Custom hooks run only when the hook path is a regular executable file and is not world-writable.
- Built-in cron intervals do not run backups, automatic host package updates, or forced `wpfy update`.
- Backups remain independent through `wpfy backup all` and `wpfy backup schedule`.
