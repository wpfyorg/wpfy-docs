# Project Memory

## Purpose
- Build `wpfy`: a VPS installer and WordPress/server management CLI using Docker/Compose instead of host-installed Nginx/PHP/MariaDB/Redis.
- Target install UX: `curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash`.

## Implemented
- First-run panel setup and telemetry (2026-07-28): the printed run token authorizes a two-step browser wizard only while no users exist; account setup then closes permanently with HTTP 410, and edge-bound creation is refused. User profiles and install state are mode 0600, TOTP is verified before persistence, skip preserves the existing exposure refusal, and setup events omit credentials/email. Anonymous telemetry is opt-out but strictly limited to install UUID, wpfy/Python/OS versions, and site/active counts; the built-in endpoint is empty, `WPFY_TELEMETRY=0` overrides state, and the CLI prints the exact payload. See ADRs 0025 and 0026.
- Phase 5a metrics sampler (2026-07-27): `metrics.py` stores host and exact managed-domain samples in a WAL-mode stdlib SQLite database under the state directory, with indexed range reads and 14-day retention. One bounded whole-machine Docker stats call joins the existing minute tick after per-site cron; daily pruning and failures are contained and logged. `wpfy metrics sample|show|prune` is implemented; panel graphs remain Phase 5b. See ADR 0018.
- Phase 4b security and cron panel (2026-07-27): loopback panel API routes and responsive tabs expose the accepted Phase 4 operation layers. Security previews validate and preflight without mutating, unproxied Cloudflare-only changes require a deliberate acknowledgement, and generated basic-auth passwords use the existing one-time credential panel. Cron lists site-derived services and real run outcomes, with add, enable/disable, run-now, and confirmed delete controls.
- Phase 4a.5 per-site cron correction (2026-07-27): job timeouts are authoritative inside the selected container. A fixed supervisor runs the command in a new `setsid` process group, terminates that whole group, and emits a random timeout marker; the host Compose timeout remains a longer client-wedge backstop. Failed execs use `compose ps --status running -q` to distinguish a stopped service from a failed job, never the job's own output. The profile-only `wpcli` service is excluded for new jobs and legacy entries migrate to `app`, which has the same image, `wp` on `PATH`, and `/var/www/html` as its working directory. See ADR 0017.
- Phase 4a.2 per-site security controls (2026-07-27): basic auth stores only a `{SHA}` htpasswd hash at `nginx/htpasswd` mode `0640`, outside `app/`; the individually mounted file is rotated in place so running containers see revocations. Cloudflare-only uses a Traefik edge `ipAllowList` from effective Cloudflare ranges, with DNS lockout warnings and CLI `--force`; real-IP trust uses the discovered wpfy edge CIDR plus Cloudflare hops when needed, and discovery failure installs fail-closed rules. The managed health endpoint is exempted from server-level auth. See ADR 0016.
- Phase 3a native cache integration (2026-07-24): page and object cache selection are orthogonal and persisted through `SiteDefinition`; free cache plugins, BYO upload staging, wpfy's FastCGI cache, Redis Object Cache wiring, safe Nginx bypass snippets, layered purge, and `wpfy cache show|set|object|purge` are implemented. Panel adoption remains Phase 3b and is intentionally pending. The FastCGI cache uses a site-uid-owned sibling `cache-data/` bind-mounted to `/var/cache/nginx/fastcgi`, outside backups, rather than the image's unwritable default cache directory. Generated files mounted individually by Compose are updated in place with no-follow writes so running containers retain the live inode; running Nginx configuration is checked by status/diagnostics and cache reload failures are non-zero.
- Phase 2b panel parity (2026-07-24): browser Databases, PHP Settings, and Vhost tabs now consume the Phase 2a API with typed destructive confirmations, one-time database credentials, Adminer loopback/tunnel guidance, PHP previews, and verbatim Nginx validation output; operational refusals map to 400/404/503/422 instead of generic 500. The current API still does not expose generated `nginx/default.conf` content, so the Vhost tab shows its owned path and read-only limitation.
- Phase 2a per-site configuration parity (2026-07-24): isolated database/user operations, loopback-only Adminer, persisted PHP settings rendered to `php/zz-wpfy.ini`, operator-owned `php/custom.ini` and `nginx/extra/custom.conf`, fail-closed in-container Nginx validation, plus CLI and panel API routes. See ADR 0013 and `docs/commands/db.md`.
- Phase F bounded runtime performance: Cloudflare networks cache per effective CIDR set; public-IP fallbacks stop after first valid IPv4; site health batches all discovered IDs into one Docker inspect and service waits batch once per poll; unchanged scaffolds do not rewrite registry state. CLI/output, SSL preflight safety, health mapping, and registry metadata remain compatible.
- Phase E primitives: stored SMTP/DNS/S3 config uses `site_paths.read_env()` and rejects symlinks with shaped domain errors; `redaction.py` handles exact configured values including overlaps; `systemd.py` owns shared cron/backup unit mechanics; CLI secret input, project naming, and health defaults have one source. Scheduler/domain policy and key/pattern redaction remain separate.
- Phase D deep operations: `stack.py` owns shared-stack selection/pulls/status/upgrade/remove/purge; `cache_operations.py` owns cache selection/execution/outcomes; public `site_runtime.py` APIs own log capture/follow/reset, WP-CLI capture/streaming, HTTP probes, and readiness. CLI/panel render or transport these results. `stack purge` requires `--force`; requested cache failures return non-zero.
- Phase B CLI correctness: authoritative structured service inspection, canonical filesystem-to-registry reconciliation through `site list`, neutral update-version reporting, resolvable runtime annotations, and fail-fast site-handler construction.
- Python package under `src/wpfy/` with deep modules for managed-site lifecycle, authoritative site definition, certificate lifecycle, and operational inspection, plus lower-level site runtime, Traefik, registry, SFTP, PHP runtime, settings, and CLI rendering.
- Repository split is in progress as of 2026-06-30: application/installer source stays in `/Users/arnab/Desktop/_Projects/wpfy-pvt`, website source lives in `/Users/arnab/Desktop/_Projects/wpfy-website`, and documentation/knowledge-base source lives in `/Users/arnab/Desktop/_Projects/wpfy-docs`.
- Console entrypoint in `pyproject.toml`: `wpfy = "wpfy.cli:main"`.
- Argparse CLI with all command groups: `site`, `stack`, `debug`, `clean`, `info`, `log`, `secure`, `maintenance`, `update`.
- Root installer script `wpfy` bootstraps Ubuntu hosts, installs or verifies Docker and the Compose plugin, creates core directories, syncs the source tree, installs `wpfy` into `/opt/wpfy/venv`, exposes `/usr/local/bin/wpfy`, writes `/etc/wpfy/wpfy.conf`, and runs smoke checks.
- Root installer source updates are staged through `/opt/wpfy/app.next`; the previous app tree is retained as `/opt/wpfy/app.previous` and restored if a later install step fails.
- Public bootstrap script `install.sh` downloads the GitHub source archive for `WPFY_REF` (default `main`), optionally verifies it with `WPFY_SOURCE_SHA256`, and runs the bundled `wpfy` installer with `--skip-wpfy-install`.
- Public release export script `scripts/export-public.sh` copies only `.gitignore`, `LICENSE`, `README.md`, `install.sh`, `pyproject.toml`, `wpfy`, `src/`, public-safe `tests/`, `docker/`, and `.github/workflows/php-images.yml` into a separate public checkout under `.context/public-export/wpfy`. It supports a new-root export and rejects internal paths and known infrastructure identifiers.
- Disposable-VPS validation tooling now exists as `scripts/vps-release-validation.sh` for local packaging/staging and `scripts/vps-release-validation-remote.sh` for numbered evidence capture on the target VPS.
- VPS validation runner HTTP probes now use HTTP for non-SSL sites and HTTPS only for SSL-enabled sites; post-restore status/Compose evidence is captured after successful and rejected restore attempts.
- Package metadata uses the SPDX license expression `AGPL-3.0-only` without the legacy AGPL trove classifier so current setuptools can build/install it.
- All CLI commands have real implementations (no scaffold messages).
- Beta marketing website lives in `website/` (static HTML/CSS/JS, MotherDuck-style design; `website-linear-backup/` keeps the earlier Linear-style version). It includes a MotherDuck-style ecosystem diagram (hub-and-spoke with JS-drawn colored SVG pipes into the center node, **static** labelled component chips with brand + inline line icons — the earlier click-to-explore detail panel and its `ECO` script were removed; box hover still highlights its pipe), alternating cream/sky-blue section backgrounds with doodles straddling the borders, "Who is it for?" and "Use cases" sections, drifting background doodles, a fixed-height hero terminal animation, click-to-copy command chips on the feature cards (copy glyph → teal check, icon appended by `main.js`), and a placeholder subscribe ribbon (no backend yet). Nav/footer link forum.wpfy.org and docs.wpfy.org (neither subdomain resolves yet, 2026-06-12). `scripts/export-public.sh` does NOT export `website/`; publishing it is a separate decision.
- `site_lifecycle.py` owns the create/update/SSL-enable mutation sequence: preflight ordering, desired site specification, scaffold/runtime changes, WordPress provisioning, and registry updates. `cli.py` now owns only parsing, prompts, progress, and rendering for those flows.
- `site_definition.py` owns the persisted site vocabulary, including optional SFTP; Compose, `.env`, and registry metadata regenerate from one definition.
- `site_paths.py` owns validated site paths and env reads; `site_runtime.py` owns Docker/Compose execution, cached capability checks, and site health. `site_layout.py` remains the scaffold/backup/restore owner.
- `certificate_lifecycle.py` owns preflight, ACME reads/matching, metadata/expiry, and renewal. `traefik.py` owns proxy runtime only.
- `operational_inspection.py` returns structured facts used by aggregate info, diagnostics, and security audit renderers.
- Enabling SSL on an existing WordPress site updates both WordPress `home` and `siteurl` to `https://<domain>` after runtime restart so admin and canonical redirects do not fall back to HTTP.
- CLI output is now human-friendly first: top-level and subcommand help include descriptions/examples, and the site/stack/update/install flows use sectioned summaries and phase banners instead of semicolon-chained prose. [ad-hoc note]
- CLI VM release Page 2 added flat shortcuts for existing grouped behavior: `wpfy run`, `backup`, `restore`, `rm`, `wp`, and `version`. On 2026-07-03, the product direction changed: flat CLI is the canonical VM/operator target surface, and grouped `wpfy site ...` / `wpfy stack ...` commands are compatibility surfaces. Page 3 added canonical flat runtime commands: `wpfy compose`, `up`, `down`, `exec`, `cp`, and `pull`. Page 4 added safe flat config commands: `wpfy config`, `edit`, and `refresh`, with sanitized config output, prompt/stdin password handling, editor backups, and scaffold refresh from authoritative state. Page 5 added operator commands: `wpfy healthcheck`, `motd`, and `utility`, with offline-safe disk/load/site health checks, safe MOTD summaries, and stdlib value generators. Page 6 added backup/restore ergonomics: archive listing, restore listing, verified destination copies, upload-only S3-compatible backup uploads, and sorted `backup all` aggregation while preserving restore validation-before-stop safety. Permanent backup storage/schedule support now adds `backup storage set|status|test|clear` and one systemd timer via `backup schedule daily|weekly|status|disable`. Page 7 added `wpfy cron` interval runners and per-interval systemd timers plus `wpfy log cron`; backups remain separate on `backup schedule`. Page 7 also added SMTP config/status/test/clear under `wpfy smtp` with redacted output and explicit test sends only. Page 8 updates docs and the disposable-VPS runner to exercise flat commands where they exist. Page 9 retains grouped `site`/`stack` commands for this release; flat `run`, `backup`, `restore`, `wp`, `rm`, and `config` remain primary where exact equivalents exist.
- Demyx parity build (2026-07-08) adds local backup retention/prune, explicit `restore --latest`, named S3-compatible storage profiles, remote backup list/restore/delete/prune, Traefik/ACME edge backup/restore, Cloudflare-only wildcard SSL through `wpfy dns cloudflare`, and pull-only phpMyAdmin/Adminer/Composer helper images. MySQLTuner skips until a vetted pinned image exists. OpenLiteSpeed/Bedrock, panel/API/UI, automatic SMTP notifications, and host-stack migration remain out of scope.
- Public docs production pass (2026-07-09) keeps `kb/` as the public VitePress source, restyles it to the Cohere-inspired `DESIGN.md`, makes flat commands primary in the sidebar, adds public command/runbook/reference/release pages, and adds `npm run docs:qa` for internal link plus forbidden private-string scanning.
- KB design and SEO follow-up (2026-07-09) adds product-register context in `PRODUCT.md`, VitePress sitemap/robots metadata, visible interaction states, reduced-motion handling, and an eighth home feature card so the desktop grid does not leave an empty slot.
- Interactive `stack install` runs announce each selected component before its pull/start operation so long Docker work does not appear stalled; redirected and scripted output remains unchanged.
- The root installer starts with a bounded `WPFY` logo and live host summary; values are detected from the machine and the output stays within 80 columns.
- Public installation now uses one step-based 16-step progress sequence across archive bootstrap and root installation. Interactive terminals get color and in-place updates; non-TTY output stays plain; raw command output is log-only unless `--verbose` is set.
- Security audit artifacts exist at `SECURITY_AUDIT_REPORT.md` and `SECURITY_TEST_PLAN.md`.
- Safe audit/smoke scripts exist for static/security orchestration, installer dry-run handoff, exposed ports, generated Nginx sensitive paths, Docker hardening, WordPress hardening, backup/restore smoke, and local-only web vulnerability smoke testing.
- `tests/vps-validation-runner.sh` verifies the local validation bundle shape, archive exclusions, and remote-runner availability without touching a VPS.
- Full VPS beta validation pass completed 2026-06-04 on <redacted-host> (Ubuntu 24.04, *.wpfydev.top). All 13 phases clean. Real ACME cert issued, post-reboot persistence confirmed, HTTP hardening probed live. Accepted residual: php-fpm images run as root (USER www-data deferred — needs volume ownership strategy).
- Current security smoke status: pytest, backup/restore, exposed-port, installer, generated Nginx sensitive-path, Docker hardening, and WordPress hardening checks pass locally. VPS live probes confirm Nginx hardening, security headers, ACME, and reboot persistence. Remaining: testssl.sh/nuclei not run; php-fpm non-root user deferred; Traefik Docker socket residual risk documented.
- PHP runtime provisioning is pull-only as of 2026-06-05: `stack install` never builds PHP images on customer VPS hosts. PHP 8.4 is the default runtime; explicit support now spans `7.4`, `8.0`, `8.1`, `8.2`, and `8.3` for compatibility and upgrade/downgrade flows.
- Public PHP image publishing logs in to GHCR with the built-in `GITHUB_TOKEN` (`github.actor`). No PAT is used: the `wpfyorg/php-fpm` package grants the `wpfy` repo Write access via its "Manage Actions access" setting, which resolves the `permission_denied: write_package` push denial. (A `PUBLICPUSH` PAT was tried and reverted — it failed login with `denied: denied`.)
- `site create` WordPress flavors now perform full WP-CLI provisioning after runtime startup: DB readiness wait, core download if needed, config creation if missing, DB create, and `wp core install`.
- `site create` accepts WordOps-style WordPress admin flags `--user`, `--email`, and `--pass`; missing password defaults to generation and is printed once only for a fresh install.
- Installer logging is implemented at `/var/log/wpfy/install.log` with `WPFY_INSTALL_LOG` override and failed line/command reporting.
- Installer adaptive swap is implemented before package/Docker installation: skips existing active swap, skips below 8 GB free on `/`, creates 2 GB swap for 8-29 GB free, creates 4 GB swap for 30 GB+ free, and supports `WPFY_SWAP=0`, `WPFY_SWAP_SIZE_MB`, and `WPFY_SWAP_FILE`.
- Non-root operator UX (2026-06-05, ADR 0008): the `/usr/local/bin/wpfy` wrapper self-elevates via `sudo` for non-root logins (forwards `WPFY_*`/`ACME_*`), so the `ubuntu` cloud user runs plain `wpfy …` with no typed `sudo`. Root logins exec the venv binary directly; `WPFY_NO_SELF_ELEVATE=1` disables it. `handle_site_wp` now always injects wp-cli `--allow-root`. Validation harness targets `ubuntu@<redacted-host>` / `m.wpfydev.top`, stages to operator home, runs `wpfy` bare, sudo-prefixes only raw probes. Step 2 live run as `ubuntu` completed through `all`; ACME did not issue because external inbound 443 timed out despite Traefik listening locally, so the harness now records missing certs as validation failures and uses bounded curl timeouts.
- `wpfy secure` reports per-site file permissions plus running-container hardening signals for privileged mode, no-new-privileges, dropped `NET_RAW`, PID limits, memory limits, log rotation, root user warnings, and host port bindings.
- 2026-06-11 remediation pass (12 fixes, see CHANGELOG): generated Nginx gained `client_max_body_size 64m`/`fastcgi_read_timeout 300s`/conditional HSTS/case-insensitive PHP handler with `try_files =404`; `site update --password` goes over stdin and targets the resolved administrator login; SFTP `--password` rotation works and generated SFTP passwords print once; WordPress tarball extraction uses the `data` tar filter; Compose project-name collisions are refused; operator-added `.env` keys survive regeneration (spec-owned keys in `MANAGED_ENV_KEYS` stay authoritative); SSL enablement requires a valid ACME contact email (`acme_email_problem()` in `traefik.py` — set `WPFY_ACME_EMAIL`); Redis/MariaDB tags are single constants (`REDIS_IMAGE`/`MARIADB_IMAGE` in `site_layout.py`); `site_exists` validates domains; `stop_site_runtime(remove_volumes=...)` defaults non-destructive; `site restore` preserves live DB credentials when `db-data/` is initialized.

### Site Management
- Phase A safety gates (2026-07-17): backups publish only after verification and never retain loose SQL; delete requires a complete database backup plus confirmed runtime stop; maintenance records state only after Compose success; ACME renewal is backup/write/reload gated; unexpected WordPress bootstrap failures block runtime and provisioning.
- Phase C transfer/integrity gates (2026-07-17): S3-compatible archives use signed fixed-length file-backed uploads; remote restores stream to private temporary storage and clean up before/after validation; fresh WordPress bootstrap verifies the versioned official tarball's published SHA-1 before extraction.
- Phase C repair closure (2026-07-18): file-backed SigV4 declarations now match canonical headers; managed environment/scaffold and health/core files use descriptor-relative no-follow reads/writes; ownership failures gate all scaffold-driven runtime starts; active-runtime partial retries are blocked before app mutation; and CLI remote restore uses the real validator for clean valid/malformed/truncated/non-directory-root outcomes before runtime stop. Restore also rejects archive `db-data/` and special-file payloads, preserves the live database volume defensively, and returns a controlled failure if descriptor-safe replacement fails after runtime stop.
- `site create` parses concise site flags: `--html`, `--php {7.4|8.0|8.1|8.2|8.3|8.4}`, `--mysql`, `--wp`, `--wpfc`, `--wpredis`, `--wpsc`, `--wprocket`, `--wpce`, `--wpsubdir`, `--wpsubdomain`, `-le`, `--letsencrypt`, `--dns`.
- `site create` generates an idempotent per-site scaffold under `/opt/wpfy/sites/<site>/` with `compose.yaml`, `.env`, and support directories.
- `site create -le` runs DNS/IP preflight before changing files; failed preflight blocks file changes.
- `site create` bootstraps WordPress-style filesystem under the site `app/` directory and writes `healthz.html`.
- `site create` attempts `docker compose up -d` when Docker and Compose are available, otherwise reports a skip.
- `site update` supports `--php`, `--wpfc`, `--wpredis`, `-le`, `--password` flags; regenerates compose.yaml and restarts runtime.
- `site ssl <domain>` with `--letsencrypt`, `--renew`, `--status`, `--preflight-only` flags; ACME issuance via Traefik, renewal via acme.json manipulation, status via certificate metadata.
- `site backup` writes timestamped tarball backups under `/var/lib/wpfy/backups/<site>/`.
- `backup --list` and `restore --list` list local `*.tar.gz` archive candidates without reading archive contents; `backup --path` copies a verified archive to a destination directory; `backup --s3` uploads only after local verification using environment-provided or stored S3-compatible settings; `backup all` continues through per-site failures and returns nonzero if any site fails. Stored S3-compatible config lives at `/etc/wpfy/backup-storage.env` with mode `0600`, while environment variables override it; recurring backups use one systemd timer that runs `wpfy backup all`.
- `site restore` restores scaffold files from backup archives, restarts runtime, and imports SQL dumps after DB readiness when present.
- `site restore` validates backup archive members before stopping runtime or extracting, and rejects path traversal, absolute paths, links, device files, archives rooted at a different domain, and database-volume payloads under `db-data/`.
- `site delete` stops runtime and removes scaffold.
- `site delete` returns a clean `site not found` error for missing sites.
- `site list` enumerates managed sites from the JSON registry.
- `site status` reports scaffold, bootstrap, runtime, HTTP readiness, container health, and flavor-aware service checks.
- `site info` reports filesystem and registry metadata with sanitized secrets.
- `site show` displays the compose.yaml content.
- `site wp` passes through WP-CLI commands to the site's wpcli service container.

### Stack Management
- `stack install` pulls and starts Traefik (as `--nginx`), pulls PHP-FPM images (`--php` defaults to 8.4; explicit requests support `7.4`, `8.0`, `8.1`, `8.2`, and `8.3`), pulls MariaDB (`--mysql`/`--mariadb`), pulls Redis (`--redis`), pulls the default PHP image for WP-CLI (`--wpcli`). Flags non-Docker services as not applicable.
- `stack status` reports Traefik status, Docker version, and pulled wpfy images.
- `stack upgrade` pulls updated Traefik image and restarts.
- `stack remove` stops Traefik.
- `stack purge` removes Traefik compose project including volumes.

### Edge Proxy (Traefik)
- `traefik.py` module: scaffold generation (`compose.yaml`, `traefik.yml`), shared `wpfy` Docker network creation, start/stop/status/reload.
- Traefik v3.6.17 with Docker provider, label-based auto-discovery, TLS challenge ACME, read-only Docker socket.
- The `le` ACME certificate resolver is generated into `traefik.yml`; `WPFY_ACME_EMAIL` is read when the Traefik scaffold is written.
- ACME certificate status queries via `acme.json` read from the Traefik container.
- ACME certificate domain matching is case-insensitive to match Traefik's lowercased stored domains.
- Force certificate renewal by removing domain entry from acme.json and reloading Traefik.
- TLS challenge only; HTTP challenge deferred.

### State Store (JSON Registry)
- `registry.py` module: `Registry` class with atomic writes (`os.replace()` on `.tmp` file).
- Registry at `/var/lib/wpfy/sites.json` tracks domain, flavor, PHP version, SSL status, cache type, creation timestamp.
- Module-level API: `add_site()`, `update_site()`, `remove_site()`, `get_site()`, `list_sites()`, `sync_from_filesystem()`.
- Filesystem is authoritative; `sync_from_filesystem()` reconciles registry against on-disk scaffold files.
- `wpfy debug` validates registry/filesystem consistency and reports orphaned/unregistered sites.

### Diagnostics & Operations
- `wpfy debug` runs full diagnostic: Docker availability, Traefik health, disk usage, registry consistency, per-site compose/config/HTTP/SSL/DB checks. Reports PASS/WARN/FAIL.
- `wpfy info` shows aggregate state (site count, Traefik status, Docker version) or per-site details.
- `wpfy clean` clears caches: nginx (fastcgi/proxy/uwsgi), Redis (FLUSHALL), PHP OPcache (kill -USR2).
- `wpfy log show` with `--nginx`, `--php`, `--mysql`, `--follow`, `--lines` flags.
- `wpfy log cron [--lines N]` reads `/var/log/wpfy/cron.log`.
- `wpfy log reset` stops and restarts containers to clear logs.
- `wpfy sftp <domain> --enable/--disable/--status` manages an atmoz SFTP sidecar for a site, allocates a per-site loopback-only host port, waits for that port on enable, and never prints the SFTP password value in status output.

### SSL & DNS
- DNS/IP preflight implemented with test overrides via `WPFY_TEST_DNS_IPS` and `WPFY_TEST_PUBLIC_IPS`.
- Certificate metadata exposed via `get_cert_info()` and `cert_expiry_days()`; ACME reads tolerate missing Docker and fall back to OpenSSL parsing when `cryptography` is unavailable.
- `site ssl --status` reports issuer, validity period, SANs, and expiry warning thresholds.

### PHP Versioning
- Per-site PHP version via Docker image tags: `ghcr.io/wpfyorg/php-fpm:8.4` (default), plus explicit `7.4`, `8.0`, `8.1`, `8.2`, and `8.3` choices.
- Public PHP images are built by `.github/workflows/php-images.yml`, which publishes `ghcr.io/wpfyorg/php-fpm:7.4`, `8.0`, `8.1`, `8.2`, `8.3`, and `8.4` from `docker/php-fpm/<version>/`.
- `SiteSpec.php_version` field drives image tag in `compose_content()`.
- `site update --php` regenerates compose.yaml with new image tag and restarts.
- Registry and `.env` both store `PHP_VERSION`.

## Planned / Deferred
- Remediate remaining security audit findings: Traefik socket risk reduction, WP-CLI artifact verification, explicit non-root users/read-only root filesystems where compatible, and live execution of the disposable-VPS validation flow.
- Additional DNS providers for wildcard SSL.
- ACME HTTP challenge as alternative to TLS challenge.
- Installer file logging and stronger partial-install diagnostics.
- Per-site `php.ini` overrides via mounted config files.
- Traefik dashboard behind authentication for debugging.
- Dashboard tools: phpMyAdmin, Adminer, Netdata (deferred to v2).

## Important Paths
- Repo package code: `/Users/arnab/Desktop/_Projects/wpfy-pvt/src/wpfy/`.
- Website source: `/Users/arnab/Desktop/_Projects/wpfy-website`.
- Documentation and knowledge-base source: `/Users/arnab/Desktop/_Projects/wpfy-docs`.
- Install root: `/opt/wpfy`.
- Config root: `/etc/wpfy`.
- State root: `/var/lib/wpfy`.
- Logs root: `/var/log/wpfy`.
- Per-site runtime path: `/opt/wpfy/sites/<site>`.
- Backup root: `/var/lib/wpfy/backups/<site>/`.
- Traefik dir: `/opt/wpfy/traefik/`.
- Registry file: `/var/lib/wpfy/sites.json`.
- Installer venv: `/opt/wpfy/venv`.
- CLI wrapper: `/usr/local/bin/wpfy`.

## Runtime Notes
- `WPFY_SKIP_RUNTIME=1` disables Docker Compose startup/stopping/status checks for offline-safe verification.
- Tests that drive `ensure_sftp_container` with `tmp_path` instead of `tmp_wpfy_home` must also monkeypatch `wpfy.sftp.ensure_site_scaffold`; otherwise the scaffold writes through the real `PATHS` (`/opt/wpfy`) and the test only passes when a prior `tmp_wpfy_home` test happened to leave reloaded modules pointing at a temp dir (fixed 2026-06-11 in `tests/test_sftp.py`).
- `site status` falls back to `runtime unavailable` when Docker or Compose is missing.
- Traefik lifecycle respects `WPFY_SKIP_RUNTIME=1`.
- Static website preview convention: serve `website/` at `http://127.0.0.1:8766/` with `python3 -m http.server 8766 --bind 127.0.0.1 -d website` unless a task explicitly needs another port.
- VitePress docs preview convention: from the docs repository, use `npm run docs:preview -- --host 127.0.0.1 --port 4173` after `npm run docs:build`.

## Latest Decisions
- 2026-07-19: RC2 local release gates passed for app commit `5c90ad2`; final
  promotion remains blocked on public-artifact and disposable-VPS evidence.
- 2026-07-18: Extend ADR 0010 with no-follow stored-config reads, exact-value redaction, and shared mechanical systemd lifecycle ownership; domain policy stays in SMTP/DNS/S3, cron, backup schedule, and CLI.
- 2026-07-18: Extend ADR 0010 ownership to stack, cache, and public site runtime operations; CLI/panel keep validation, presentation, and transport policy.
- 2026-05-20: v1 is Ubuntu-first targeting 22.04 LTS and 24.04 LTS.
- 2026-05-20: each site uses its own Compose project and isolated runtime resources.
- 2026-05-20: SSL remains opt-in via `-le`/`--letsencrypt`; DNS/IP preflight runs automatically when SSL is requested.
- 2026-05-20: commands must be idempotent and must not mutate host package stacks.
- 2026-05-20: installer should be restartable and support dry-run verification.
- 2026-05-22: Traefik v3 is the edge proxy with Docker label auto-discovery and built-in ACME (TLS challenge).
- 2026-05-22: JSON file registry at `/var/lib/wpfy/sites.json` with atomic writes; filesystem remains authoritative.
- 2026-06-05: PHP version selected per site via versioned `ghcr.io/wpfyorg/php-fpm:<version>` image tags; 8.4 default, with explicit support for `7.4`, `8.0`, `8.1`, `8.2`, and `8.3`.
- 2026-05-22: Release packaging via pip-installable Python package with setuptools and pyproject.toml.
- 2026-06-01: Private repository is canonical; public repository is updated only through an allowlisted one-way export.
- 2026-06-01: Installer uses an internal venv plus `/usr/local/bin/wpfy` wrapper to avoid Ubuntu PEP 668 system-pip failures.
- 2026-06-01: Traefik image tag is pinned to `traefik:v3.6.17`.
- 2026-06-02: SSL diagnostics distinguish missing certificates from issued certificates whose expiry metadata cannot be parsed.
- 2026-06-02: Backup restore is archive-member validated before extraction, and SFTP uses per-site loopback-only host ports stored in `.env`.
- 2026-06-03: WordPress flavors are fully provisioned with WP-CLI during `site create`; generated admin passwords are printed once and not persisted by wpfy.
- 2026-06-03: The installer writes `/var/log/wpfy/install.log` and reports failed line/command details.
- 2026-06-03: Restore archive validation now happens before runtime stop, and non-SSL Traefik routers explicitly bind to the HTTP `web` entrypoint.

## Safety Warnings
- Do not run third-party server-panel installers/tests locally when they require root and mutate `/etc`, `/usr`, `/var`, packages, or services.
- Do not issue certificates unless DNS/IP preflight passes.
- Do not weaken per-site isolation by sharing PHP, DB, Redis, or writable app volumes.
- Do not claim perfect isolation; Docker daemon or host compromise can affect all sites.
- After meaningful changes, update `docs/CHANGELOG.md`, this file, `docs/logs/worklog.md`, and relevant architecture/command/runbook docs.
