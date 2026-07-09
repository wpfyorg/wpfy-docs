# Roadmap

## v0 Bootstrap
- Documentation and memory system.
- CLI scaffold.
- Installer skeleton with Ubuntu/root checks and directory creation.
- Docker/Compose detection smoke checks.

## v1 WordPress Site Lifecycle
- Generate per-site Compose projects.
- Create WordPress site with per-site PHP and MariaDB.
- List, inspect, update, and delete sites idempotently.

## v1 SSL
- Automatic DNS/IP preflight for `-le`/`--letsencrypt`.
- ACME issuance only after preflight passes.
- Clear retry guidance for failed preflight.
- Cloudflare-only wildcard SSL via DNS challenge.

## v1 Backups
- Per-site backup command.
- Restore command with safe overwrite handling.
- Explicit latest restore.
- Local retention/prune.
- S3-compatible named profiles and remote list/restore/delete/prune.
- Traefik/ACME edge backup and restore.

## v1 SFTP
- Per-site SFTP access without weakening isolation.

## v1 Hardening
- Filesystem permissions.
- Secret handling.
- Container user review.
- Optional fail2ban/security tooling.

## Later Debian Support
- Add Debian installer support after Ubuntu v1 is stable.

## Later DNS Providers
- Add providers beyond Cloudflare only after a concrete user need.

## Deferred
- Host-stack migration remains out of v1.
- Panel/API/UI remains out of the CLI parity build.
- Automatic SMTP notifications remain out; SMTP config/test is explicit only.
- Provider bucket lifecycle API automation remains out; wpfy-managed prune is implemented.
