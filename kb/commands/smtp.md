# wpfy smtp

Store and test outbound SMTP settings.

## Status

Implemented for configuration and explicit test sends. Automatic notifications are not implemented.

## Syntax

```bash
wpfy smtp set|status|test|clear
```

## Options

| Option | Purpose |
|---|---|
| `--host <host>` | SMTP host. |
| `--port <port>` | SMTP port. |
| `--sender <email>` | Sender address. |
| `--username <user>` | SMTP username. |
| `--tls starttls\|ssl\|none` | TLS mode. |
| `--password-stdin` | Read password from stdin. |
| `--dry-run` | Validate stored config without network send. |
| `--to <email>` | Send one explicit test email. |
| `--force` | Confirm clearing stored config. |

## Safe Examples

```bash
printf '%s\n' "$SMTP_PASSWORD" | wpfy smtp set --host smtp.example.com --port 587 --sender ops@example.com --username ops@example.com --tls starttls --password-stdin
wpfy smtp test --dry-run
wpfy smtp test --to owner@example.com
```

## Expected Behavior

Status redacts credentials. Test sends are explicit only.

## Files And Services Touched

`/etc/wpfy/smtp.env`, mode `0600`.

## Idempotency Notes

`set` replaces the stored SMTP config. `clear --force` removes it when present.

## Failure Modes

Missing config, missing password stdin, missing `--dry-run` or `--to`, network failure, or authentication failure.

## Recovery Steps

Run `status`, correct stored settings, run `test --dry-run`, then send one explicit test.

## Related Commands

[`wpfy cron`](./cron), [`wpfy log`](./log).
