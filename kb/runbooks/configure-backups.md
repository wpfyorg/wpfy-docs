# Configure Backups

## Goal

Create local backups, optionally configure S3-compatible storage, and schedule recurring all-site backups.

## Prerequisites

- At least one managed site exists.
- Optional S3-compatible credentials if remote storage is needed.
- systemd available if recurring backups are needed.

## Steps

1. Run `wpfy backup example.com`.
2. Run `wpfy backup example.com --list`.
3. Configure remote storage with `wpfy backup storage set` if needed.
4. Run `wpfy backup storage test`.
5. Install a recurring schedule with `wpfy backup schedule daily --time 02:30`.
6. Test recovery with `wpfy backup remote restore example.com --latest`; the object downloads to private temporary storage and is validated before live mutation.

## Verification

Confirm local archive listing, remote storage test output, and `wpfy backup schedule status`.

## Failure Recovery

If upload fails, the verified local archive remains available; correct storage settings and rerun upload. Interrupted remote downloads are removed and never reach restore validation.

## Cleanup

Use `wpfy backup prune example.com --keep <count> --dry-run` before destructive pruning.

## Related Reference Pages

[`wpfy backup`](../commands/backup), [`wpfy backup storage`](../commands/backup-storage), [`wpfy backup schedule`](../commands/backup-schedule).
