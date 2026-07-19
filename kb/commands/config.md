# wpfy config

Inspect or safely update one managed site's configuration without printing raw `.env` contents.

## Status

Implemented.

## Syntax

```bash
wpfy config <domain> [options]
```

## Options

| Option | Purpose |
|---|---|
| `--php 7.4\|8.0\|8.1\|8.2\|8.3\|8.4` | Change the PHP runtime. |
| `--wpfc`, `--wpredis`, `--wpsubdir`, `--wpsubdomain` | Enable supported WordPress modes. |
| `-le`, `--letsencrypt [on\|off]` | Enable or disable SSL intent. |
| `--dns <provider>` | Set DNS provider metadata. |
| `--proxied`, `--no-proxied` | Force proxied mode on or off. |
| `--password` | Prompt for a new WordPress admin password. |
| `--password-stdin` | Read one WordPress admin password from stdin. |

## Safe Examples

```bash
wpfy config example.com
wpfy config example.com --php 8.4
printf '%s\n' "$NEW_PASSWORD" | wpfy config example.com --password-stdin
```

## Expected Behavior

Without mutation flags, the command prints sanitized status. With mutation flags, it routes through the same lifecycle path used by site updates.

## Files And Services Touched

The authoritative per-site `.env`, generated Compose files, and runtime when a change requires restart.

## Idempotency Notes

Applying the same setting again should leave the site in the same state. `refresh` can regenerate scaffold files from current state.

## Failure Modes

Missing site, invalid domain, invalid PHP version, unsafe password input, SSL preflight failure, and runtime restart failure.

## Recovery Steps

Run `wpfy config <domain>` to inspect sanitized state, correct the failing option, and rerun. Use `wpfy refresh <domain>` after manual config edits.

## Related Commands

[`wpfy edit`](./runtime), [`wpfy refresh`](./runtime), [`wpfy site update`](./grouped-site).
