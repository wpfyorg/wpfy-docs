# `wpfy site list`

## Purpose
List managed sites.

## Status
- Implemented: lists managed sites from the JSON registry after filesystem reconciliation.
- Implemented: `--enabled` and `--disabled` are accepted for compatibility with the current command surface.
- Implemented: output uses a sectioned summary with domain, flavor, SSL, and cache columns for easy scanning.

## Syntax
```bash
wpfy site list
wpfy site list --enabled
wpfy site list --disabled
```

## Examples
```bash
wpfy site list
```

## Expected Files Touched
- Read-only access to `/opt/wpfy/sites/` scaffold directories.
- Read-only access to `/var/lib/wpfy/sites.json`.

## Idempotency Behaviour
- Read-only command; safe to run repeatedly.

## Failure Modes
- State directory missing.
- Malformed site metadata.

## Security Notes
- Must not print secrets from `.env` or state files.
