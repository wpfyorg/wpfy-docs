# Handoff

## Read First
- `docs/MEMORY.md`
- `docs/CHANGELOG.md`
- `docs/DECISION-LOG.md`
- Relevant ADRs in `docs/adr/`
- Relevant command docs in `docs/commands/`

## Current State
- The first panel administrator now comes from a run-token-authorized browser wizard. Setup routes return HTTP 410 after creation, edge-bound setup is refused, verified TOTP or an explicit skip completes the flow, and anonymous telemetry remains inert until an endpoint is configured. `wpfy telemetry status` prints the exact seven-field payload; see ADRs 0025 and 0026.
- The repo has a runnable Python CLI and Ubuntu installer for Docker-backed WordPress/server administration.
- Phase F bounds SSL discovery, Docker health inspection, and no-op registry writes. Local proof covers exact parser/opener/inspect/write counts plus full regression; real disposable-VPS timing remains optional and deferred.
- Commands now have real implementations for installer bootstrap, per-site Compose scaffolds, Traefik, SSL preflight, full WordPress provisioning, backups, restore, diagnostics, and SFTP lifecycle.
- Current parity surface includes backup retention/prune, explicit latest restore, named S3-compatible profiles, remote backup list/restore/delete/prune, Traefik/ACME edge backup/restore, Cloudflare-only wildcard SSL, and opt-in helper image pulls.
- Managed-site mutations now cross one interface in `src/wpfy/site_lifecycle.py`; create, update, and SSL-enable ordering no longer lives in `cli.py`.
- Persisted site representations regenerate from `src/wpfy/site_definition.py`; SFTP no longer edits generated YAML in place.
- Validated paths/env reads now live in `src/wpfy/site_paths.py`; Docker/Compose lifecycle and optimized health probes live in `src/wpfy/site_runtime.py`; scaffold/backup/restore stay in `src/wpfy/site_layout.py`.
- Certificate state and renewal live in `src/wpfy/certificate_lifecycle.py`; operational facts live in `src/wpfy/operational_inspection.py`.
- Phase D routes shared-stack operations through `src/wpfy/stack.py`, cache operations through `src/wpfy/cache_operations.py`, and CLI/panel logs/reset/WP through public `src/wpfy/site_runtime.py` APIs. Purge now requires `--force`; cache failures are non-zero.
- Phase E routes stored SMTP/DNS/S3 reads through the no-follow env reader, exact-value error masking through `redaction.py`, and cron/backup unit mechanics through `systemd.py`. CLI syntax, unit contents, and domain policy remain unchanged; symlink-backed secret configs now fail cleanly.
- Disposable-VPS validation tooling now exists in `scripts/vps-release-validation.sh` and `scripts/vps-release-validation-remote.sh`, with a local shape test at `tests/vps-validation-runner.sh`.
- Live-run follow-up fixes are in the current branch: rejected restore archives validate before stopping runtime, non-SSL routers bind to the HTTP `web` entrypoint, and validation HTTP probes no longer treat HTTPS 404s as non-SSL site failures.
- Installer hardening follow-ups are in the current branch: optional `WPFY_SOURCE_SHA256` source archive verification, staged source activation with rollback, and broader `wpfy secure` baseline reporting.
- Phase C keeps archive-sized S3 transfers out of Python memory, uses private cleanup-safe remote restore files, and verifies versioned WordPress tarballs against WordPress.org's published SHA-1 before extraction.
- Phase C repair is locally closed: strict SigV4 reconstruction passes; managed environment/scaffold and bootstrap paths use descriptor-relative no-follow operations; ownership failures gate scaffold-driven runtime starts; active-runtime partial bootstrap retries are blocked before app mutation; truncated/non-directory-root/special-member remote archives fail through the real validator before runtime stop; and restore rejects or defensively skips `db-data/` archive content so the live database volume is never replaced.
- Disposable-VPS proof for wildcard/Traefik behavior is complete for the release-candidate branch. Phase C real-provider S3 interoperability and the repaired bootstrap/restore paths on a disposable VPS remain deferred until credentials/host are available. Remaining release work is the clean public export/tag/push path, plus optional external scanner runs and hardening follow-ups such as Traefik socket risk reduction, release checksum publishing, and WP-CLI artifact verification.

## Safe Continuation Rules
- Before edits, check `docs/MEMORY.md` and `docs/CHANGELOG.md`.
- Do not silently change architecture decisions; update `docs/DECISION-LOG.md` and add or amend an ADR.
- Keep commands idempotent.
- Keep implemented vs planned status explicit.
- Preserve strong per-site isolation: no shared PHP, DB, Redis, or writable app volumes.
- Do not attempt ACME issuance unless DNS/IP preflight passes.

## Recommended Next Step
- RC2 private commit is locally gated. Publish through the canonical exporter,
  then repeat the public tagged install path on a disposable VPS before final
  promotion.
- Optionally measure Phase F SSL preflight and fleet-health timing on a disposable Ubuntu VPS with real network and Docker latency; local closure uses deterministic call counts, not wall-clock claims.
- On a disposable VPS, exercise live stack image pulls/upgrade/forced purge, log follow/reset, cache container failures, and CLI/panel WP parity; local Phase D verification intentionally avoids destructive shared-stack mutation.
- On a disposable Ubuntu VPS, exercise real cron/backup timer install, trigger, status, partial failure, and disable paths; Phase E local QA used a fake `systemctl` and temporary unit root.
