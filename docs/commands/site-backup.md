# `wpfy site backup`

## Purpose
Create a backup for one managed site.

## Status
- Implemented: reads per-site scaffold/runtime data and writes a timestamped tarball backup.
- Implemented: lists local backup archives without reading archive contents.
- Implemented: copies verified archives to an operator-provided destination directory.
- Implemented: upload-only S3-compatible offsite backup after local archive verification.
- Implemented: `backup all` aggregation for every managed site in sorted order.
- Implemented: one stored default S3-compatible target and one systemd timer for daily or weekly all-site backups.

## Syntax
```bash
wpfy backup <domain> [--list|--path <directory>|--s3]
wpfy backup all [--path <directory>] [--s3]
wpfy backup storage set --endpoint <url> --bucket <name> --region <region> --access-key <key> --secret-key-stdin
wpfy backup storage status
wpfy backup storage test
wpfy backup schedule daily --time HH:MM [--path <directory>] [--s3]
wpfy backup schedule weekly --weekday sun --time HH:MM [--path <directory>] [--s3]
wpfy site backup <domain> [--list|--path <directory>|--s3]
```

## Examples
```bash
wpfy backup example.com --list
wpfy backup example.com --path /root/wpfy-backups
wpfy backup example.com --s3
wpfy backup all --path /root/wpfy-backups
wpfy backup storage status
wpfy backup schedule daily --time 02:30 --s3
wpfy site backup example.com
```

## Expected Files Touched
- Implemented: `/var/lib/wpfy/backups/<domain>/<domain>-<timestamp>.tar.gz`.
- Implemented: may add a database dump to the backup archive when Docker runtime access is available.
- Implemented: optional verified copy to the directory passed with `--path`.
- Implemented: optional upload to `<prefix>/<domain>/<archive-name>` in configured S3-compatible storage.
- Implemented: stored storage config at `/etc/wpfy/backup-storage.env`, mode `0600`.
- Implemented: systemd unit and timer at `/etc/systemd/system/wpfy-backup.service` and `/etc/systemd/system/wpfy-backup.timer`.

## Idempotency Behaviour
- Implemented: each run creates a distinct timestamped backup artifact.
- Implemented: `backup all` continues after per-site failures and returns nonzero if any site failed.
- Implemented: one active daily or weekly systemd timer can be replaced by rerunning the schedule command.

## Failure Modes
- Site not found.
- Database dump failure.
- Insufficient disk space.
- Permission errors.
- Missing S3-compatible upload environment when `--s3` is requested.
- Offsite upload failure after local archive creation.
- Missing stored or environment S3-compatible config when scheduling with `--s3`.
- Missing `systemctl` or systemd failure when installing/disabling schedules.

## Security Notes
- Backup archives may contain secrets and must not be world-readable.
- S3-compatible upload settings come from environment variables: `WPFY_BACKUP_S3_ENDPOINT`, `WPFY_BACKUP_S3_BUCKET`, `WPFY_BACKUP_S3_REGION`, `WPFY_BACKUP_S3_ACCESS_KEY`, `WPFY_BACKUP_S3_SECRET_KEY`, and optional `WPFY_BACKUP_S3_PREFIX`.
- Stored S3-compatible upload settings live in `/etc/wpfy/backup-storage.env`; environment variables override the file.
- Command output must not print S3 access keys, secret keys, archive contents, SQL contents, `.env` contents, salts, tokens, or passwords.
- Remote restore/list/delete/prune, retention, restore-latest, named storage profiles, and Traefik/ACME backup are implemented on the flat `wpfy backup ...` / `wpfy restore ...` surfaces. Provider bucket lifecycle API automation remains deferred.
