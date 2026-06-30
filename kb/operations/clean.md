# wpfy clean

Clear site caches.

## Syntax

```bash
wpfy clean <domain> --all
wpfy clean <domain> --nginx
wpfy clean <domain> --redis
wpfy clean <domain> --opcache
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--all` | bool | Clear all caches |
| `--nginx` | bool | Clear Nginx FastCGI, proxy, and uwsgi caches |
| `--redis` | bool | Run `FLUSHALL` on Redis |
| `--opcache` | bool | Reset PHP OPcache via `kill -USR2` |

## Examples

```bash
wpfy clean example.com --all
wpfy clean example.com --redis
```

## Expected Behavior

Each flag targets a specific cache layer inside the site's containers. No files are deleted. Site stays running.

## Related Commands

- [wpfy debug](/operations/debug)
