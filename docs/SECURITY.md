# Security

## Implemented
- Per-site `.env` files are written with `0600` permissions.
- Backup archives are written with `0600` permissions under `/var/lib/wpfy/backups/<site>/`.
- Restore validates backup archive members before extraction and rejects path traversal, absolute paths, links, device files, and archives rooted at a different domain.
- SFTP is an optional per-site sidecar, bound to a loopback-only host port and mounted only to that site's `./app` directory.
- SFTP status reports whether a password is configured but does not print the password value.
- `wpfy secure` audits per-site file permissions and container security basics, including privileged mode, no-new-privileges, dropped raw networking capability, resource limits, log rotation, and host port bindings.
- WordPress admin passwords passed to `site create --wp` are not stored in `.env`, registry, or logs; generated passwords are printed once only when a fresh install runs.
- Generated Nginx configs block common sensitive WordPress paths, uploads PHP execution, dotfiles except `.well-known`, backups/dumps/log files, and add baseline browser security headers.
- Generated Compose services include `no-new-privileges`, dropped `NET_RAW`, resource limits, restart policies, healthchecks where practical, and log rotation.

## Planned Goals
- Strong per-site container isolation.
- Least-privilege mounts for global edge proxy.
- Avoid shared writable volumes across sites.
- Consider rootless or non-root containers where practical.

## Operator Privilege Model
- wpfy runs as root (manages root-owned system paths and the system Docker daemon). The `/usr/local/bin/wpfy` wrapper self-elevates via `sudo` for non-root operators so the UX stays `wpfy …` without a typed `sudo` (ADR 0008).
- Trust assumption: the operator has passwordless `sudo` (default on Ubuntu cloud images). Self-elevation is therefore root-equivalent for that operator — equivalent in effect to adding them to the `docker` group, but without a directory-ownership re-architecture.
- True non-root containers (per-image `USER`) remain separate planned hardening (see below) and are independent of this host operator model.

## Docker Daemon Risk
- Docker daemon access is effectively host-root equivalent.
- A host-level or Docker-daemon compromise can affect all sites.
- Documentation and marketing must not claim perfect isolation.
- Accepted v1 residual risk: Traefik mounts `/var/run/docker.sock` read-only for Docker provider auto-discovery. Read-only reduces accidental mutation but does not make the socket low-risk if Traefik is compromised.
- Future hardening option: evaluate a dedicated Docker socket proxy with a minimal API allowlist before claiming stronger daemon isolation.

## Secrets Handling
- Implemented: generated passwords for DB and WordPress salts.
- Implemented: per-site `.env` and SFTP secrets are stored in root-readable per-site files.
- Open question: exact secret storage mechanism.

## Backup Safety
- Implemented: backups avoid world-readable archive permissions.
- Implemented: restore validates archive paths before extraction and remains domain-bound.
- Planned: more explicit restore confirmation or pre-restore backup workflow for existing live sites.

## Hardening
- Planned: fail2ban/security hardening after core site lifecycle.
- Planned: explicit non-root users and read-only root filesystems where compatible with the PHP, Nginx, DB, Redis, WP-CLI, Traefik, and SFTP images.

## Supply Chain
- Implemented: `install.sh` defaults to a GitHub source archive for `WPFY_REF` and allows `WPFY_SOURCE_ARCHIVE` for release validation.
- Implemented: `install.sh` can verify the source archive with `WPFY_SOURCE_SHA256` when a release checksum is published or supplied by the operator.
- Implemented: PHP-FPM images are built from the public repository workflow for supported PHP tags.
- Residual v1 risk: WordPress core and WP-CLI image/artifact trust still depends on upstream distribution channels; checksum or signature verification remains future hardening.
