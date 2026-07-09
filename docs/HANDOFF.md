# Handoff

## Read First
- `docs/MEMORY.md`
- `docs/CHANGELOG.md`
- `docs/DECISION-LOG.md`
- Relevant ADRs in `docs/adr/`
- Relevant command docs in `docs/commands/`

## Current State
- The repo has a runnable Python CLI and Ubuntu installer for Docker-backed WordPress/server administration.
- Commands now have real implementations for installer bootstrap, per-site Compose scaffolds, Traefik, SSL preflight, full WordPress provisioning, backups, restore, diagnostics, and SFTP lifecycle.
- Current parity surface includes backup retention/prune, explicit latest restore, named S3-compatible profiles, remote backup list/restore/delete/prune, Traefik/ACME edge backup/restore, Cloudflare-only wildcard SSL, and opt-in helper image pulls.
- Managed-site mutations now cross one interface in `src/wpfy/site_lifecycle.py`; create, update, and SSL-enable ordering no longer lives in `cli.py`.
- Persisted site representations regenerate from `src/wpfy/site_definition.py`; SFTP no longer edits generated YAML in place.
- Certificate state and renewal live in `src/wpfy/certificate_lifecycle.py`; operational facts live in `src/wpfy/operational_inspection.py`.
- Disposable-VPS validation tooling now exists in `scripts/vps-release-validation.sh` and `scripts/vps-release-validation-remote.sh`, with a local shape test at `tests/vps-validation-runner.sh`.
- Live-run follow-up fixes are in the current branch: rejected restore archives validate before stopping runtime, non-SSL routers bind to the HTTP `web` entrypoint, and validation HTTP probes no longer treat HTTPS 404s as non-SSL site failures.
- Installer hardening follow-ups are in the current branch: optional `WPFY_SOURCE_SHA256` source archive verification, staged source activation with rollback, and broader `wpfy secure` baseline reporting.
- Disposable-VPS proof for wildcard/Traefik behavior is complete for the release-candidate branch. Remaining release work is the clean public export/tag/push path, plus optional external scanner runs and hardening follow-ups such as Traefik socket risk reduction, release checksum publishing, and upstream WordPress/WP-CLI artifact verification.

## Safe Continuation Rules
- Before edits, check `docs/MEMORY.md` and `docs/CHANGELOG.md`.
- Do not silently change architecture decisions; update `docs/DECISION-LOG.md` and add or amend an ADR.
- Keep commands idempotent.
- Keep implemented vs planned status explicit.
- Preserve strong per-site isolation: no shared PHP, DB, Redis, or writable app volumes.
- Do not attempt ACME issuance unless DNS/IP preflight passes.

## Recommended Next Step
- Publish the release-candidate public export from a clean committed app tree, then repeat the public install path on a clean VPS once the public archive is reachable without credentials.
