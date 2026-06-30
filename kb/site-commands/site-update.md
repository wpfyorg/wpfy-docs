# wpfy site update

Change a site's PHP version, cache configuration, or admin password.

## Syntax

```bash
wpfy site update <domain> --php 8.4
wpfy site update <domain> --wpredis
wpfy site update <domain> --password
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--php` | string | PHP version: `7.4`, `8.0`, `8.1`, `8.2`, `8.3`, `8.4` |
| `--wpfc` | bool | Enable Nginx FastCGI cache |
| `--wpredis` | bool | Enable Redis object cache |
| `--wpsc` | bool | Enable WP Super Cache |
| `--wprocket` | bool | Enable WP Rocket |
| `--wpce` | bool | Enable WP Cache Enabler |
| `-le`, `--letsencrypt` | bool | Enable SSL (same as `wpfy site ssl --letsencrypt`) |
| `--password` | bool | Rotate WordPress admin password (prompts over stdin) |

## Examples

```bash
wpfy site update example.com --php 8.4
wpfy site update example.com --wpredis
wpfy site update example.com --password
wpfy site update example.com -le
```

## Expected Behavior

- Regenerates `compose.yaml` with new PHP image tag or cache labels
- Restarts site runtime (`docker compose up -d`)
- For `--password`: finds the WordPress administrator user, prompts for new password over stdin, never prints the value
- For `-le`: runs DNS preflight before changes, same as SSL enablement

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Site not found | `site not found` error |
| Invalid PHP version | Rejected, lists valid versions |
| PHP change fails to restart | Compose project left in previous state |

## Related Commands

- [wpfy site create](/site-commands/site-create)
- [wpfy site ssl](/site-commands/site-ssl)
- [wpfy site status](/site-commands/site-status)
