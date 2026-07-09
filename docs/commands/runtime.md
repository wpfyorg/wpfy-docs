# Flat Runtime Commands

## Purpose
Operate one managed site's Docker Compose runtime through the canonical flat CLI.

## Status
- Implemented: `wpfy compose <domain> -- <compose args>`.
- Implemented: `wpfy up <domain>`.
- Implemented: `wpfy down <domain> [--volumes]`.
- Implemented: `wpfy exec <domain> [service] -- <command>`.
- Implemented: `wpfy cp <domain> <source> <destination>`.
- Implemented: `wpfy pull <domain> [--all|--service <service>]`.

## Syntax
```bash
wpfy compose example.com -- ps
wpfy compose example.com -- config
wpfy up example.com
wpfy down example.com
wpfy down example.com --volumes
wpfy exec example.com -- php -v
wpfy exec example.com web -- nginx -v
wpfy cp example.com ./local.txt app:/tmp/local.txt
wpfy pull example.com --service app
wpfy pull example.com --all
```

## Safety Notes
- Commands validate the domain and managed-site existence before invoking Docker Compose.
- `down` keeps volumes by default; volumes are removed only when `--volumes` is explicitly passed.
- `exec` validates service names and avoids shell interpolation.
- `cp` requires explicit source and destination and rejects broad local paths such as `/`, `.`, `..`, `/etc`, and `/var`.

## Compatibility
- These are the canonical VM/operator runtime commands.
- Grouped `wpfy site ...` commands remain supported for retained and compatibility operations this release.
