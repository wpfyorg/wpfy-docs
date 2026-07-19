# `wpfy site list`

## Purpose
List managed sites.

## Status
- Implemented: lists managed sites from the JSON registry after filesystem reconciliation.
- Implemented: output uses a sectioned summary with domain, flavor, SSL, and cache columns for easy scanning.

## Syntax
```bash
wpfy site list
```

## Examples
```bash
wpfy site list
```

## Expected Files Touched
- Reads authoritative scaffolds under `/opt/wpfy/sites/`.
- May atomically repair `/var/lib/wpfy/sites.json` when filesystem and cache differ.

## Idempotency Behaviour
- Safe to run repeatedly. An already-reconciled registry is not rewritten and its timestamp remains unchanged.

## Failure Modes
- State directory missing.
- Malformed site metadata.

## Security Notes
- Must not print secrets from `.env` or state files.
