# Security

## Implemented
- Per-site `.env` files are written with `0600` permissions.
- Backup archives are written with `0600` permissions under `/var/lib/wpfy/backups/<site>/`.
- Database SQL is staged with `0600`, embedded once in a verified archive, and removed as a loose file on success or failure.
- Restore validates backup archive members before extraction and rejects path traversal, absolute paths, links, device files, non-directory site roots, archives rooted at a different domain, and database-volume payloads under `db-data/`.
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
- Implemented: stored SMTP, Cloudflare DNS, and S3 secret config reads reject symlink-backed files and shape expected filesystem failures without tracebacks.
- Implemented: exact configured values are redacted longest-first from SMTP, DNS, S3, and WordPress failure text, ignoring empty/duplicate values. Key-based environment sanitization and SFTP field-pattern masking remain separate controls.
- Open question: exact secret storage mechanism.

## Backup Safety
- Implemented: backups avoid world-readable archive permissions.
- Implemented: strict pre-delete backups require database completeness; failed/skipped backup or runtime-stop prerequisites cannot be bypassed by `--force`.
- Implemented: restore validates archive paths before extraction and remains domain-bound.
- Implemented: verified site/edge archives upload as fixed-length signed file streams whose canonical headers match the declared SigV4 `SignedHeaders`; upload failure preserves the local archive. Remote restore streams to a mode-`0600` temporary file, rejects malformed or truncated archives and `db-data/` payloads before runtime mutation, rejects symlinks in the live restore tree, replaces archive-owned entries with descriptor-relative no-follow operations while preserving the live database volume, and removes the temporary file on every exit path.
- Limitation: S3-compatible archive upload is a single request without multipart or resume support.
- Planned: more explicit restore confirmation or pre-restore backup workflow for existing live sites.

## Login Shield
- Implemented: WPFY Login Shield protects the panel login and, per-site opt-in, WordPress authentication. Detection is server-side from real authentication failures; enforcement is a host Fail2ban ban. It is not a CAPTCHA: no CAPTCHA, Turnstile, reCAPTCHA, hCaptcha, ALTCHA, browser/device fingerprinting, IP reputation service, or external threat feed is used. Live-verified end to end on the dev host 2026-08-06/07 (16/16 checks PASS, including a real ban and rollback drill). See ADR 0023 (amended) and `runbooks/login-shield.md`.
- Layer 1, panel (always on, in-process): per-account lockout (5 failures / 5 min) and per-client cooldown (10 failures / 60 s) with HTTP 429 and `Retry-After`; stays active even when Fail2ban is stopped.
- Layer 2, panel (host jail): jail `wpfy-panel-auth` reads `/var/log/wpfy/panel-auth.log`; policy maxretry 8 / findtime 10m / bantime 15m; `ignoreip` loopback only.
- WordPress (per-site opt-in, default disabled): `wpfy site security <domain> fail2ban on|off` (or the panel Security tab toggle) enables the official wp-fail2ban plugin 5.4.1 (integrity-verified against the pinned WordPress.org checksum manifest, auto-update disabled) plus a WPFY-owned MU-plugin bridge that writes structured auth-failure records to `<site>/security/wp-auth.log`; per-site jail `wpfy-<sha256[:16]>` policy maxretry 5 / findtime 10m / bantime 1h.
- Ban scope: a ban blocks TCP 80/443 through Docker's `DOCKER-USER` chain, server-wide. Exact disclosure: "Only enabled sites can trigger Login Shield bans. A resulting HTTP ban may block the attacker from all websites on this WPFY server." SSH (port 22) is never a ban target, and recovery through root key login always works. The ban covers forwarded/foreign traffic only; traffic that originates host-locally, through docker-proxy userland, or from a compromised container is not blocked by the ban rule.
- Installation: `wpfy stack install --nginx`, `--all`, or `--fail2ban` installs and manages the host fail2ban package idempotently (Branch C) with WPFY-owned filter/jail/action files, validation before service start, and rollback; the panel jail activates with the install and per-site jails activate at site enable.
- Trusted proxy: forwarded client IPs are trusted only from exact Traefik `/32` and `/128` container addresses with a 30-second monotonic TTL (discovery failures never cached); never a shared Docker subnet. Never-ban identities (loopback, Docker bridge, Cloudflare ranges when configured, Traefik edges, panel backend) are redacted to the `0.0.0.0` sentinel at resolution and again at emission; Fail2ban `ignoreip` stays loopback-only.
- Cloudflare: proxied sites trust Cloudflare ranges as an additional hop in site nginx; Cloudflare edge addresses are never bannable.
- IPv4/IPv6: IPv4 enforcement is active where Docker publishes 80/443. IPv6 bans are gated on real capability: status reports `ipv6_protection: inactive` with `health: degraded` until an IPv6-capable action is rendered (stale-action detection), so there is no silent unprotected public IPv6.
- Log paths: panel `/var/log/wpfy/panel-auth.log` (0600, `O_NOFOLLOW`, in-process copytruncate rotation 10 MB x 3); per-site `<site>/security/wp-auth.log` (0640, logrotate `maxsize 100M` / rotate 12 / compress / copytruncate); Fail2ban service log and bounded sqlite database. Blocked requests write 0 bytes.
- Log rotation uses `copytruncate` because every monitored file is bind-mounted as a single file and must keep its inode.
- Plugin ownership: `wpfy-installed` and `activated-by-wpfy` plugins are deactivated on disable and never uninstalled; `admin-installed` and `already-active` plugins are preserved with admin auto-update policy intact.
- Enable/disable lifecycle: idempotent; enable runs install -> bridge -> activate -> jail render -> validate -> reload with a fixture pipeline proof and full rollback on any failure; disable removes only this site's jail and bridge guard and preserves logs and the host Fail2ban install.
- Upgrade behavior: the plugin is pinned to 5.4.1 with per-file checksum verification (array-tolerant for repack manifests); auto-updates are disabled for WPFY-managed installs; any upgrade re-verifies.
- Performance (measured 2026-08-06, 2-CPU dev host, N>=24 per metric): no meaningful additional work on ordinary frontend requests; an enabled site shows ~10% plugin-bootstrap cost (+0.0107 s mean), a disabled site writes 0 B; a failed login appends ~230-253 B; blocked traffic costs zero server work; fail2ban RSS stays 38-42 MB flat; time from threshold to active ban ~1 s.
- Known limitation: under a sustained blocked burst, the kernel ICMP reply rate limit on `icmp-port-unreachable` produces ~1 s median client-side latency; `--reject-with tcp-reset` is the recommended future improvement.

## Hardening
- Implemented: Login Shield (host Fail2ban + per-site opt-in WordPress protection), see above.
- Planned: explicit non-root users and read-only root filesystems where compatible with the PHP, Nginx, DB, Redis, WP-CLI, Traefik, and SFTP images.

## Supply Chain
- Implemented: `install.sh` defaults to a GitHub source archive for `WPFY_REF` and allows `WPFY_SOURCE_ARCHIVE` for release validation.
- Implemented: `install.sh` can verify the source archive with `WPFY_SOURCE_SHA256` when a release checksum is published or supplied by the operator.
- Implemented: PHP-FPM images are built from the public repository workflow for supported PHP tags.
- Implemented: managed site environments and scaffold files use descriptor-relative no-follow reads/writes and reject symlinks before exposing secrets or changing external targets; fresh WordPress core bootstrap applies the same boundary to health/core files. Ownership failures gate create, update, and SSL runtime starts. Fresh core matches a versioned official tarball against WordPress.org's published SHA-1 before extraction. Partial retries, including a missing healthcheck, are blocked before mutation while the site runtime could change the destination. The SHA-1 check detects mismatch/corruption but is not signature or provenance verification.
- Residual v1 risk: WP-CLI image/artifact trust still depends on upstream distribution channels; independent signature verification remains future hardening.
