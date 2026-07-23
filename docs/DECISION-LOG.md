# Decision Log

## 2026-05-20: Ubuntu-first v1
- Decision: Support Ubuntu first for v1.
- Reason: Minimizes installer and support surface while core Docker architecture is still forming.
- Alternatives considered: Ubuntu plus Debian from day one.
- Consequence: Debian support is documented as later roadmap work.
- Status: Accepted.

## 2026-05-20: Per-site Compose isolation
- Decision: Use one Compose project per site with per-site containers, networks, volumes, DB, and optional Redis.
- Reason: Strong per-site container isolation is a core product requirement.
- Alternatives considered: Shared PHP and DB containers across all sites.
- Consequence: Higher resource usage but better blast-radius boundaries.
- Status: Accepted.

## 2026-05-20: Automatic SSL DNS/IP preflight
- Decision: When `-le` or `--letsencrypt` is requested, run DNS/IP preflight automatically before ACME issuance.
- Reason: Avoid failed or wasteful certificate attempts when DNS does not point to the VPS.
- Alternatives considered: Require an explicit `--check-ip` flag.
- Consequence: SSL flow is safer and simpler for users.
- Status: Accepted.

## 2026-05-20: Idempotent CLI commands
- Decision: Day-to-day `wpfy ...` commands must be idempotent.
- Reason: VPS automation should be retry-safe after partial failures.
- Alternatives considered: One-shot imperative commands without state checks.
- Consequence: Commands need careful state detection and clear partial-failure behavior.
- Status: Accepted.

## 2026-05-22: Traefik as edge proxy
- Decision: Use Traefik v3 as the global edge proxy for routing ports 80/443 to per-site containers via Docker label auto-discovery.
- Reason: Traefik's Docker provider and built-in ACME eliminate the need for host-level nginx and separate ACME tooling. Label-based routing means no proxy config regeneration on site changes.
- Alternatives considered: Caddy, nginx with acme.sh, nginx container with manual config.
- Consequence: Traefik becomes a required infrastructure component managed as its own Compose project. Per-site containers must join the shared `wpfy` network and include Traefik routing labels.
- Status: Accepted.

## 2026-05-22: ACME handled by Traefik (no acme.sh)
- Decision: Let's Encrypt certificate issuance and renewal are handled entirely by Traefik's built-in ACME integration using TLS challenge. No external ACME client (certbot, acme.sh).
- Reason: Traefik's ACME support is battle-tested, handles renewal automatically, and stores certificates in a Docker volume. Eliminates a host-level dependency and simplifies the certificate lifecycle.
- Alternatives considered: acme.sh with DNS challenge, certbot standalone.
- Consequence: ACME configuration lives in Traefik's static config and Docker labels. Certificate monitoring and force-renewal are done through `wpfy` CLI commands that read Traefik's `acme.json`.
- Status: Accepted.

## 2026-05-22: JSON site registry as state store
- Decision: Maintain a JSON registry at `/var/lib/wpfy/sites.json` as a metadata cache. Filesystem remains authoritative. Sync from filesystem when needed.
- Reason: Avoids repeated `.env` parsing for every `list`/`info` command. JSON needs no database dependency, is human-readable, and uses atomic writes for safety.
- Alternatives considered: Filesystem-only (no registry), SQLite database.
- Consequence: Every site mutation command must update the registry. `wpfy debug` validates consistency. Concurrent multi-process writes are not safe (single-operator VPS design).
- Status: Accepted.

## 2026-05-22: Per-site PHP version via Docker image tags
- Decision: PHP version is selected per site by referencing versioned `ghcr.io/wpfyorg/php-fpm:<version>` image tags in each site's `compose.yaml`. Default is 8.4, with explicit support for `7.4`, `8.0`, `8.1`, `8.2`, and `8.3` for compatibility and upgrade/downgrade flows.
- Reason: Docker image tags provide clean per-container PHP runtime selection without host-level PHP installations or version-switching scripts.
- Alternatives considered: Host-level multi-version PHP-FPM, single image with bundled versions, build-time PHP version selection.
- Consequence: Curated images must be published to `ghcr.io/wpfyorg/php-fpm` for each supported version. The public release workflow publishes 7.4, 8.0, 8.1, 8.2, 8.3, and 8.4 images from `docker/php-fpm/<version>/`. Customer VPS hosts pull those images and never build PHP images locally.
- Status: Accepted.

## 2026-05-22: Ubuntu LTS support matrix
- Decision: Target Ubuntu 22.04 LTS (Jammy) and 24.04 LTS (Noble) for v1 support. Installer validates Ubuntu distribution and warns on unsupported versions.
- Reason: These are the two current Ubuntu LTS releases with active support. Both ship compatible Docker Engine and Compose plugin versions.
- Alternatives considered: Support all Ubuntu releases, support Ubuntu plus Debian.
- Consequence: Testing and installer validation focus on 22.04 and 24.04. Other Ubuntu versions may work but are not explicitly tested or supported.
- Status: Accepted.

## 2026-05-22: Release packaging via pip-installable Python package
- Decision: Distribute `wpfy` as a standard Python package with `pyproject.toml` and setuptools. The installer script clones/syncs the source tree and runs `pip install`.
- Reason: Standard Python packaging works across Ubuntu versions, integrates with pip for dependency management, and supports editable installs for development. No need for deb/rpm packaging complexity in v1.
- Alternatives considered: deb package, snap, static binary, single-script distribution.
- Consequence: Requires Python >=3.10 on the target host. Installation is handled by the `wpfy` shell installer script. Version upgrades use standard pip workflows.
- Status: Accepted.

## 2026-06-01: Installer uses internal virtual environment
- Decision: The installer installs the Python package into `/opt/wpfy/venv` and exposes `/usr/local/bin/wpfy` as a wrapper.
- Reason: Ubuntu 24.04 enforces PEP 668 and rejects direct system-pip package installation.
- Alternatives considered: `--break-system-packages`, distro package, pipx.
- Consequence: Installer smoke checks validate the wrapper and venv-installed CLI instead of relying on system Python package state.
- Status: Accepted.

## 2026-06-01: Traefik pinned to v3.6.17
- Decision: Use `traefik:v3.6.17` for the edge proxy.
- Reason: The previous `traefik:v3.3-alpine` tag is unavailable, and older Traefik v3.3 is incompatible with Docker 29's minimum API behavior.
- Alternatives considered: Downgrade Docker, set Docker daemon minimum API compatibility, use the floating `traefik:v3` tag.
- Consequence: Stack validation must pull the pinned tag and verify Docker provider routing on Docker 29+.
- Status: Accepted.

## 2026-06-05: Non-root operator support via wrapper self-elevation
- Decision: The `/usr/local/bin/wpfy` wrapper self-elevates via `sudo` when run by a non-root user, forwarding `WPFY_*`/`ACME_*` env, so a non-root login (e.g. `ubuntu`) runs plain `wpfy …` with no typed `sudo`. Root logins exec the venv binary directly. `WPFY_NO_SELF_ELEVATE=1` disables it. See ADR 0008.
- Reason: wpfy genuinely needs root (system paths + system Docker), and containers write root-owned files into site app dirs; self-elevation delivers the no-sudo UX while leaving the entire root-based model unchanged.
- Alternatives considered: true rootless (docker group + setgid wpfy-group dirs), require typed `sudo wpfy`, setuid wrapper.
- Consequence: Assumes operator passwordless `sudo` (Ubuntu cloud default). Validation harness now targets `ubuntu@…`, stages to the operator home, runs `wpfy` bare, and sudo-prefixes only raw non-wpfy probes. Also fixed `handle_site_wp` to always inject wp-cli `--allow-root` (host-uid gate broke non-root operators).
- Status: Accepted.

## 2026-06-07: Deep domain modules for persisted state and inspection
- Decision: Make site definition, certificate lifecycle, and operational inspection explicit deep modules. Path/env primitives and Docker/Compose runtime inspection were later split into `site_paths.py` and `site_runtime.py` without changing mutation ownership. See ADR 0010.
- Reason: SFTP state edits, certificate matching, and operational probes leaked across callers and could drift independently.
- Alternatives considered: Keep caller-side coordination and add repair/formatting helpers.
- Consequence: Persisted site representations regenerate from one definition; certificate state has one owner; CLI commands render structured inspection facts.
- Status: Accepted.

## 2026-07-18: Deep ownership for stack, cache, and site runtime operations
- Decision: Extend ADR 0010 so `stack.py` owns shared-stack operations, `cache_operations.py` owns cache selection/execution, and public `site_runtime.py` APIs own logs, reset, WP-CLI, HTTP probes, and service readiness. CLI and panel retain validation, rendering, and transport policy.
- Reason: Raw Docker/Compose orchestration and failure interpretation were duplicated across CLI and panel, making destructive and automation outcomes drift-prone.
- Alternatives considered: Keep orchestration in handlers; add a second log adapter; introduce a command bus or CLI framework.
- Consequence: `stack purge` requires `--force` and propagates teardown failures; requested cache failures return non-zero; CLI/panel log and WP surfaces share runtime construction without new dependencies.
- Status: Accepted.

## 2026-07-18: Consolidated configuration and operational primitives
- Decision: Extend ADR 0010 with canonical no-follow stored-config reads, exact-value redaction, and shared mechanical systemd lifecycle operations. SMTP/DNS/S3 validation, cron/backup policy, CLI interaction, key-based sanitization, and SFTP pattern masking remain in their existing domains.
- Reason: Duplicated parsers, replacement loops, and scheduler mechanics could drift on symlinks, overlapping secrets, and partial failures.
- Alternatives considered: New configuration framework, universal secret object, systemd D-Bus integration, or continued caller duplication.
- Consequence: Symlink-backed secret config reads fail cleanly; overlapping values redact consistently; systemd cleanup targets only explicit owned paths; no dependency or CLI syntax changes.
- Status: Accepted.

## 2026-06-08: Publish PHP images only from the public mirror
- Decision: The shared `php-images.yml` gates GHCR login and `push` on `github.repository == 'wpfyorg/wpfy'`, so images publish only from the public mirror; the private repo builds them as a validation gate. See ADR 0011.
- Reason: The private repo's `GITHUB_TOKEN` cannot write the org package (`permission_denied: write_package`), and a push from the private repo would stamp a private URL into `org.opencontainers.image.source`.
- Alternatives considered: Grant `wpfy-pvt` write access to the org package; remove `php-images.yml` from the private repo.
- Consequence: The private repo needs no GHCR permissions; images publish after `docker/php-fpm/**` changes reach the public mirror. Depends on the imagick retry fix being mirrored first.
- Status: Accepted.

## 2026-06-09: Publish PHP images with GITHUB_TOKEN, not a PAT
- Decision: The public mirror logs in to GHCR with the built-in `GITHUB_TOKEN` (`github.actor`). The pre-existing `wpfyorg/php-fpm` package grants the `wpfy` repo Write access via its "Manage Actions access" setting. See ADR 0011.
- Reason: The `PUBLICPUSH` PAT was rejected at login (`denied: denied`). The earlier `permission_denied: write_package` denial was a package-access setting, not a token-scope problem, so the correct fix is the package access grant — which avoids PAT expiry/rotation.
- Alternatives considered: A `write:packages` PAT in `PUBLICPUSH` (tried; reverted — expires, failed login).
- Consequence: No Actions secret/PAT is required; the package must keep the `wpfy` repo's Write access. Amends the 2026-06-08 PAT decision.
- Status: Accepted.

## 2026-07-23: In-process panel jobs and append-only redacted events
- Decision: Run panel mutations as in-process jobs with progress and read-once credential payloads, and record operations in a size-rotated append-only redacted JSONL event log. Route metadata flows through `authorize(principal, meta, domain)`; today every authenticated request uses one implicit admin principal.
- Reason: The panel needs non-blocking site lifecycle operations, live progress, one-time credential delivery, and inspectable operation history without adding a database, external queue, or persistent secret store. A centralized authorization seam preserves a path to future authentication and roles.
- Alternatives considered: Synchronous HTTP mutations; persistent database or external job queue; persisted credential payloads; SQLite events; mandatory event writes; and handler-local authorization checks.
- Consequence: Jobs and payloads do not survive a panel restart, and credentials cannot be recovered after the one read. Event writes are best-effort and may be absent if logging fails, but cannot break the operation; key-based redaction keeps known secret fields out of the log. The panel remains loopback-only, bearer-token protected, single-token, and single-operator.
- Status: Accepted.
