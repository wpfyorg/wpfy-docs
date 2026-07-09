# Backup Storage And Schedule

## Purpose
Configure S3-compatible backup storage profiles, remote backup operations, and one recurring all-site backup timer.

## Status
- Implemented: `wpfy backup storage set|status|test|clear`.
- Implemented: named storage profiles with `--profile NAME`.
- Implemented: `wpfy backup prune <domain|all> --keep N [--dry-run]`.
- Implemented: `wpfy backup remote list|restore|delete|prune <domain> [--profile NAME]`.
- Implemented: `wpfy backup edge` and `wpfy restore edge`.
- Implemented: `wpfy backup schedule daily|weekly|status|disable`.
- Implemented: scheduled backups run `wpfy backup all`.
- Deferred: provider bucket lifecycle API automation.

## Syntax
```bash
printf '%s\n' '<secret-key>' | wpfy backup storage set --profile weekly \
  --endpoint https://s3.example.com \
  --bucket site-backups \
  --region auto \
  --access-key <access-key> \
  --secret-key-stdin
wpfy backup storage status
wpfy backup storage test
wpfy backup storage clear
wpfy backup example.com --s3 --profile weekly --keep-local 7
wpfy backup prune example.com --keep 7 --dry-run
wpfy backup remote list example.com --profile weekly
wpfy backup remote restore example.com --latest --profile weekly
wpfy backup remote delete example.com --key weekly/example.com/archive.tar.gz --force
wpfy backup remote prune example.com --keep 7 --profile weekly --force
wpfy backup edge --path /root/wpfy-edge-backups
wpfy restore edge /root/wpfy-edge-backups/edge-20260708120000.tar.gz --force
wpfy backup schedule daily --time 02:30 --path /root/wpfy-backups
wpfy backup schedule weekly --weekday sun --time 03:00 --s3
wpfy backup schedule status
wpfy backup schedule disable
```

## Files Touched
- `/etc/wpfy/backup-storage.env`, mode `0600`.
- `/etc/wpfy/backup-storage.d/<profile>.env`, mode `0600`.
- `/var/lib/wpfy/backups/edge/`.
- `/etc/systemd/system/wpfy-backup.service`.
- `/etc/systemd/system/wpfy-backup.timer`.

## Security Notes
- The stored access key and secret key are redacted in status/test output.
- Environment variables override the default stored config only.
- Remote delete/prune require `--force` and operate only under `<prefix>/<domain>/`.
- Remote restore downloads to a temp file and validates the archive before touching live runtime.
- Edge restore validates archive members before writing Traefik config or ACME state.
