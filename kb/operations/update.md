# wpfy update

Check for new WPFY CLI releases.

## Syntax

```bash
wpfy update --check
wpfy update --force
```

## Examples

```bash
wpfy update --check
```

## Expected Output

- Installed version and latest published version from PyPI
- Equal versions are reported as up to date
- Different versions are reported neutrally without guessing which is newer
- `--force` explicitly runs the pip upgrade command; it does not claim a version transition unless proven

`--check` and `--force` are mutually exclusive.

## Related Commands

- [Stack upgrade](/stack-commands/stack-upgrade) — update Traefik
