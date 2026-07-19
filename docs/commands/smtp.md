# `wpfy smtp`

## Purpose
Store and test outbound SMTP settings for operators.

## Status
- Implemented: stores SMTP config at `/etc/wpfy/smtp.env` with mode `0600`.
- Implemented: accepts SMTP password only through stdin or an interactive prompt.
- Implemented: status output redacts credentials.
- Implemented: `test --dry-run` validates local config without opening a network connection.
- Implemented: `test --to <address>` sends one explicit test email through stdlib SMTP.
- Not implemented: automatic notifications, cron email, alert routing, or templated outbound mail.

## Syntax
```bash
wpfy smtp set --host <host> --port <port> --sender <email> --username <user> [--tls starttls|ssl|none] --password-stdin
wpfy smtp status
wpfy smtp test --dry-run
wpfy smtp test --to <email>
wpfy smtp clear --force
```

## Examples
```bash
printf '%s\n' "$SMTP_PASSWORD" | wpfy smtp set \
  --host smtp.example.com \
  --port 587 \
  --sender ops@example.com \
  --username ops@example.com \
  --tls starttls \
  --password-stdin

wpfy smtp status
wpfy smtp test --dry-run
wpfy smtp test --to owner@example.com
```

## Expected Files Touched
- Implemented: `/etc/wpfy/smtp.env`, mode `0600`.

## Idempotency Behaviour
- Implemented: rerunning `smtp set` replaces the stored SMTP config.
- Implemented: `smtp clear --force` removes the stored config if present.

## Failure Modes
- Missing config returns exit code 2.
- `smtp set` in non-interactive mode requires `--password-stdin`.
- `smtp test` requires either `--dry-run` or explicit `--to`.
- Network or authentication failures return a nonzero exit and redact configured credentials.
- Symlink-backed or unreadable stored config returns a controlled configuration error; wpfy does not follow the config file into another host path.

## Security Notes
- Do not pass SMTP passwords on the command line.
- Command output must not print SMTP username or password values.
- SMTP is config/test only; it does not send automatic operational notifications.
