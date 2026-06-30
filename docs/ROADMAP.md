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

## v1 Backups
- Per-site backup command.
- Restore command with safe overwrite handling.

## v1 SFTP
- Per-site SFTP access without weakening isolation.

## v1 Hardening
- Filesystem permissions.
- Secret handling.
- Container user review.
- Optional fail2ban/security tooling.

## Later Debian Support
- Add Debian installer support after Ubuntu v1 is stable.

## Later Wildcard SSL
- DNS provider validation for wildcard certificates.
