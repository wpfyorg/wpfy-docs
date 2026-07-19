# wpfy backup storage

Store, inspect, test, or clear the default S3-compatible backup storage configuration.

## Status

Implemented as `wpfy backup-storage` in the parser and shown to users as `wpfy backup storage`.

## Syntax

```bash
wpfy backup storage set|status|test|clear
```

## Options

| Option | Purpose |
|---|---|
| `--endpoint <url>` | S3-compatible endpoint. |
| `--bucket <name>` | Backup bucket name. |
| `--region <name>` | Provider region or `auto`. |
| `--access-key <key>` | Access key value. |
| `--secret-key-stdin` | Read the secret key from stdin. |
| `--profile <name>` | Store a named profile when supported. |

## Safe Examples

```bash
printf '%s\n' "$S3_SECRET" | wpfy backup storage set --endpoint https://s3.example.com --bucket site-backups --region auto --access-key "$S3_ACCESS" --secret-key-stdin
wpfy backup storage status
wpfy backup storage test
```

## Expected Behavior

Status and test output redact stored credentials. `test` uploads a small test object to verify configuration.

## Files And Services Touched

`/etc/wpfy/backup-storage.env` and `/etc/wpfy/backup-storage.d/<profile>.env`, both mode `0600`.

## Idempotency Notes

Running `set` again replaces the stored configuration for the selected profile.

## Failure Modes

Missing required fields, missing secret input, provider authentication failure, or upload failure.

## Recovery Steps

Rerun `set` with corrected values, then run `status` and `test`.

## Related Commands

[`wpfy backup`](./backup), [`wpfy backup remote`](./backup-remote), [`wpfy backup schedule`](./backup-schedule).
