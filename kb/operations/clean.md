# wpfy clean

Clear site caches.

## Syntax

```bash
wpfy clean <domain> --all
wpfy clean <domain>
wpfy clean <domain> --redis
wpfy clean <domain> --opcache
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--all` | bool | Clear all caches |
| `--redis` | bool | Run `FLUSHALL` on Redis |
| `--opcache` | bool | Reset PHP OPcache via `kill -USR2` |

## Examples

```bash
wpfy clean example.com --all
wpfy clean example.com --redis
```

## Expected Behavior

No flag defaults to Nginx FastCGI, proxy, and uwsgi cache. Other flags target their named layer; `--all` selects all three. No site files are deleted. Any requested execution failure returns non-zero while successful and skipped per-site messages remain visible.

## Related Commands

- [wpfy debug](/operations/debug)
