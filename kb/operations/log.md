# wpfy log

View or reset site container logs.

## Syntax

```bash
wpfy log show <domain> --nginx
wpfy log show <domain> --php
wpfy log show <domain> --mysql
wpfy log show <domain> -f
wpfy log show <domain> --lines 100
wpfy log reset <domain>
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `show` | subcommand | Display logs |
| `reset` | subcommand | Restart containers to clear logs |
| `--nginx` | bool | Nginx access/error logs |
| `--php` | bool | PHP-FPM logs |
| `--mysql` | bool | MariaDB logs |
| `-f`, `--follow` | bool | Follow log output (tail -f) |
| `--lines` | int | Number of lines to show (default: 50) |

## Examples

```bash
wpfy log show example.com --nginx -f
wpfy log show example.com --php --lines 200
wpfy log reset example.com
```

## Related Commands

- [wpfy debug](/operations/debug)
