# wpfy cron

Run WordPress due events and small operator interval tasks manually or through systemd timers.

## Status

Implemented.

## Syntax

```bash
wpfy cron minute|five-minute|hourly|six-hour|daily|weekly
wpfy cron install|status|disable
```

## Options

| Option | Purpose |
|---|---|
| Interval name | Select the manual interval runner. |
| `install` | Install managed systemd timer units. |
| `status` | Show timer status. |
| `disable` | Remove managed timer units. |

## Safe Examples

```bash
wpfy cron hourly
wpfy cron install
wpfy cron status
wpfy log cron --lines 100
```

## Expected Behavior

Intervals run due WordPress cron events for managed WordPress sites. Backups are not run by `cron`; they stay under `wpfy backup schedule`.

## Files And Services Touched

`/var/log/wpfy/cron.log`, `/etc/systemd/system/wpfy-cron-<interval>.service`, `/etc/systemd/system/wpfy-cron-<interval>.timer`, and optional hooks under `/etc/wpfy/custom/cron/`.

## Idempotency Notes

Installing timers overwrites the managed unit files. Disabling removes managed units.

## Failure Modes

Docker unavailable, WP-CLI failures, unsafe custom hooks, hook failures, or systemd failures.

## Recovery Steps

Check `wpfy log cron`, fix the reported site or hook issue, and rerun the interval manually before relying on timers.

## Related Commands

[`wpfy log`](./log), [`wpfy backup schedule`](./backup-schedule), [`wpfy wp`](./wp).
