# wpfy backup schedule

Configure one systemd timer that runs recurring all-site backups.

## Status

Implemented as `wpfy backup-schedule` in the parser and shown to users as `wpfy backup schedule`.

## Syntax

```bash
wpfy backup schedule daily|weekly|status|disable [options]
```

## Options

| Option | Purpose |
|---|---|
| `--time HH:MM` | Scheduled run time. |
| `--weekday <day>` | Weekly schedule day. |
| `--path <directory>` | Copy archives after backup. |
| `--s3` | Upload archives with configured storage. |
| `--profile <name>` | Use a named storage profile when uploading. |

## Safe Examples

```bash
wpfy backup schedule daily --time 02:30
wpfy backup schedule weekly --weekday sun --time 03:00 --s3 --profile weekly
wpfy backup schedule status
```

## Expected Behavior

The timer runs `wpfy backup all`. Backups remain separate from `wpfy cron`.

## Files And Services Touched

`/etc/systemd/system/wpfy-backup.service` and `/etc/systemd/system/wpfy-backup.timer`.

## Idempotency Notes

Installing a schedule replaces the managed service and timer. `disable` removes the managed timer files.

## Failure Modes

Invalid time, missing systemd, permission errors, or invalid storage settings.

## Recovery Steps

Run `status`, correct schedule or storage settings, then rerun `daily` or `weekly`.

## Related Commands

[`wpfy backup`](./backup), [`wpfy backup storage`](./backup-storage), [`wpfy cron`](./cron).
