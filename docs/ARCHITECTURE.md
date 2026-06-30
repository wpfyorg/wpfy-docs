# Architecture

## Implemented
- `wpfy` is a Python package using argparse. `cli.py` parses and renders commands; managed-site lifecycle, site definition, certificate lifecycle, and operational inspection are deep modules over the lower-level runtime adapters.
- All CLI commands have real implementations covering site lifecycle, stack management, diagnostics, caching, logging, and WP-CLI passthrough.
- A downloadable Bash installer bootstraps Ubuntu VPS hosts with Docker, Compose plugin, core directories, source sync, a `/opt/wpfy/venv` package install, and a `/usr/local/bin/wpfy` wrapper. Supports `--dry-run` and `WPFY_DRY_RUN=1`.

### Site Runtime
- `site_lifecycle.py` is the interface used by CLI handlers for site create, update, and SSL enablement. It owns preflight-before-mutation ordering, desired `SiteDefinition` construction, scaffold/runtime sequencing, WordPress provisioning, and registry updates.
- Each site is a per-site Docker Compose project under `/opt/wpfy/sites/<domain>/`.
<<<<<<< HEAD
- `compose.yaml` and `.env` are generated idempotently from a `SiteSpec` dataclass. Runtime containers include `web` (nginx+PHP), `app` (PHP-FPM), `db` (MariaDB, when mysql flavor), `redis` (when wpredis flavor), and `wpcli` (WP-CLI profile).
=======
- `compose.yaml`, `.env`, and registry metadata are generated idempotently from one `SiteDefinition`. It includes flavor, PHP, SSL, Redis, and optional SFTP state.
- SFTP runtime management allocates ports and starts/stops the sidecar, but does not patch YAML or persisted metadata independently.
>>>>>>> origin/main
- PHP version selected per site via Docker image tag: `ghcr.io/wpfyorg/php-fpm:8.4` by default, with explicit support for `7.4`, `8.0`, `8.1`, `8.2`, and `8.3` for compatibility, upgrade, and downgrade flows.
- Site isolation: dedicated Compose project, network, volumes, database, and optional Redis per site. No shared PHP, DB, Redis, or writable app volumes.
- Site bootstrap populates `app/` with WordPress-style filesystem and `healthz.html` for HTTP probes.
- `site status` reports scaffold, bootstrap, runtime, HTTP readiness, and inspects container health via `docker inspect`.
- `site backup` creates timestamped tarballs in `/var/lib/wpfy/backups/<site>/`. `site restore` restores from archives.
- `site update` regenerates compose.yaml and restarts runtime for PHP version, flavor, and SSL changes.

### Edge Proxy (Traefik)
- Traefik v3.6.17 runs as its own Compose project (`wpfy-traefik`).
- Docker provider watches the Docker socket read-only for label-based auto-discovery.
- Ports 80 (web) and 443 (websecure) mapped to host.
- Shared `wpfy` bridge network connects the proxy to per-site containers.
- Built-in ACME with TLS challenge. Certificates stored in `letsencrypt_data` Docker volume.
- No external ACME clients (no certbot, no acme.sh).
- `traefik.py` manages proxy scaffold, network, and runtime start/stop/status/reload.

### State Store (JSON Registry)
- JSON file at `/var/lib/wpfy/sites.json` caches site metadata (domain, flavor, PHP version, SSL status, cache type, creation timestamp).
- Atomic writes: write to `.tmp`, then `os.replace()` to prevent corruption.
- Filesystem is authoritative. `sync_from_filesystem()` reconciles registry against on-disk scaffold files.
- Module-level singleton API: `add_site()`, `update_site()`, `remove_site()`, `get_site()`, `list_sites()`, `sync_from_filesystem()`.
- `wpfy debug` validates registry/filesystem consistency.

### SSL & Certificates
- DNS/IP preflight runs automatically when `-le` is requested. Failed preflight blocks certificate issuance and file changes.
- Test overrides: `WPFY_TEST_DNS_IPS` and `WPFY_TEST_PUBLIC_IPS`.
- `certificate_lifecycle.py` owns DNS/IP preflight, ACME state reads, domain matching, certificate metadata/expiry, and force-renewal via Traefik's `acme.json`.
- Wildcard SSL not yet supported.

### Diagnostics
- `operational_inspection.py` collects structured aggregate, diagnostic, and security facts. `info`, `debug`, and `secure` retain distinct CLI rendering and exit policies.
- `wpfy clean` clears nginx caches, Redis, and PHP OPcache across sites.
- `wpfy log show`/`log reset` for container log management.

## Proposed Components
- Installer script: `wpfy` shell script at repo root, delivered as release asset.
- CLI package: source synced to `/opt/wpfy/app/`, installed into `/opt/wpfy/venv`, and exposed as `/usr/local/bin/wpfy`.
- Edge proxy: **Traefik v3** with Docker provider and built-in ACME.
- State store: **JSON file** at `/var/lib/wpfy/sites.json` with atomic writes.
- PHP runtimes: **Per-site Docker image tags** (`ghcr.io/wpfyorg/php-fpm:8.X`).
- Certificate management: **Traefik built-in ACME** (TLS challenge).

## Resolved Questions
- **Ubuntu LTS versions**: 22.04 LTS (Jammy) and 24.04 LTS (Noble) are the v1 target.
- **Edge proxy**: Traefik v3 with Docker label auto-discovery and built-in ACME (ADR-0005).
- **State store**: JSON file with filesystem authority (ADR-0006).
- **PHP versioning**: Per-site Docker image tags (ADR-0007).
- **ACME ownership**: Traefik handles issuance, renewal, and storage. No external ACME client.
- **Release packaging**: pip-installable Python package with `pyproject.toml` and setuptools.

## Open Questions
- Should per-site `php.ini` overrides be supported via mounted config files?
- Should the Traefik dashboard be exposed behind authentication for debugging?
- Should a metrics/monitoring endpoint be added to Traefik?
