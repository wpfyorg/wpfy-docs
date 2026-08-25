# Project Memory

## Purpose
- Build `wpfy`: a VPS installer and WordPress/server management CLI using Docker/Compose instead of host-installed Nginx/PHP/MariaDB/Redis.
- Target install UX: `curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash`.

## Implemented
- Panel rebuild on Tabler (2026-08-15, ADR 0032): the loopback panel client is
  rebuilt from scratch on vendored Tabler 1.4.0. Site detail is five tabs
  (Overview, Settings, Data, Access, Automation) with the old fourteen paths
  redirecting for one release; the site-creation wizard reads back what it
  collects and sends only the eleven fields the server accepts; all ten admin
  pages ship; running operations live in a header popover, not a page, with an
  indeterminate bar because jobs report steps and never a total. `panel_jobs`
  is still an in-memory dict, so a panel restart loses in-flight jobs -- the
  client says so rather than spinning.
- Host port management (2026-08-15): `firewall_ports.py` wraps `ufw` behind
  `/api/firewall/ports|enable|disable`. `enable()` allows the SSH port read from
  `sshd_config` before the firewall comes up; deny and delete refuse that port
  unless the request carries it as a typed confirmation. wpfy never installs
  `ufw`. Validated on the VPS 2026-08-15: rules are read from `ufw show added`
  while the firewall is off (an inactive ufw prints no rule list), the IPv6 twin
  of a rule is folded into one row, and the rule comment is split out of the
  `From` column -- glued on it broke both the dedupe and the delete path.
- Managed panel-edge UFW rule (implemented, 2026-08-23): wpfy dynamically
  discovers Docker `wpfy-panel-edge` private bridge facts and stages an exact
  UFW INPUT rule limited to the bridge interface, private subnet, gateway
  destination, and TCP panel port; it never opens public 8642. Panel expose,
  service install, and firewall enable converge the rule. Disable removes
  wpfy marker-owned rules across ports while preserving operator rules. Live
  security verification received Oracle APPROVE: focused 324 tests passed,
  public panel/site HTTPS returned 200, bridge upstream returned 200, exactly
  one managed rule existed, and direct public 8642 was closed. The first
  post-restart 502 lasted 1--2 seconds during the restart gap, then recovered;
  it was not a regression. The full suite was not completed locally because of
  duration.
- Domainless panel exposure validated on the VPS 2026-08-15 (ADR 0033), after
  five defects including two security ones: setup over a public address was
  ungated, and the panel is reached with `wpfy panel --public`, which did not
  exist. Panel basic auth uses APR1 -- Traefik cannot verify sha512crypt.
- Write-only secrets keep their stored value when the field is blank
  (2026-08-15): `PUT /api/backup/remote` and `PUT /api/notifications/smtp`.
- Password minimum enforced in `panel_auth._validate_password` (2026-08-15), so
  every write path gets it rather than only first-run setup.
- Site field vocabulary validation (2026-08-05): lifecycle create/update
  validates PHP image, Let's Encrypt mode, and DNS provider values before
  preflight or scaffold writes, including persisted site state.
- Event-log redaction correction (2026-08-05): event assignments whose
  boundary-delimited key includes `PWD`, `PASS`, `PASSWORD`, `SECRET`, `TOKEN`,
  `KEY`, `CREDENTIAL`, `AUTH`, or `AUTHORIZATION` now mask full quoted or
  unquoted values, including HTTP Authorization headers, so cron command
  secrets do not reach JSONL or the panel. Token boundaries also preserve
  harmless diagnostics such as `monkey=12` and `authority=high`.
  This remains best-effort key-pattern matching; a secret with no recognizable
  key can still be logged. No ADR required.
- Password argv hardening (2026-08-05): `site create --pass`, grouped `site
  update --password`, and `sftp --password` accept only `-` for one stdin line
  or `prompt` on a TTY. Raw values fail with exit code 2. Omitting `site create
  --pass` or `sftp --password` keeps existing password generation. Raw
  `panel --token` also fails; use `--token-file` or `WPFY_PANEL_TOKEN`.
- Basic-auth credential hardening (2026-08-05): new `nginx/htpasswd` entries
  use OpenSSL sha512crypt (`$6$`) hashes with password input on stdin. Without
  OpenSSL, wpfy falls back to fresh-salt APR1 (`$apr1$`) and records the scheme
  in the operation event. Restore reapplies mode `0640` and site uid:gid
  ownership to the credential file. See amended ADR 0016.
- Secret file creation modes (2026-08-05): site `.env`, stored S3/Cloudflare/SMTP
  configuration, and downloaded remote archives now open with mode `0600`, so
  no umask-dependent readable creation window exists. Non-secret generated
  bind mounts remain unchanged. No ADR required.
- Panel slow-client bound (2026-08-05): accepted panel sockets use the module-level `PANEL_SOCKET_TIMEOUT = 30` idle timeout. Incomplete unauthenticated request lines or headers are closed after the timeout; HTTP/1.1 keep-alive remains valid across shorter idle gaps. No architecture change or new dependency.
- S3 backup transport guard (2026-08-05): S3 endpoints require HTTPS by default; the explicit `backup storage set --allow-insecure` opt-out persists `WPFY_BACKUP_S3_ALLOW_INSECURE=1` for trusted-LAN HTTP only. Plaintext configuration fails closed unless that opt-out is set. The shared S3 opener refuses cross-host redirects, preventing SigV4 headers from reaching another host. See ADR 0030.
- Per-site security runtime application (2026-08-05): successful CLI and panel security mutations now mean the running edge has applied them, or that a stopped site has staged the change for startup. Basic auth, deny-IP, user-agent blocks, and login rate limits reload Nginx only for running `web`; Cloudflare-only compares rendered and inspected labels before recreating, skipping an already-applied state. Failed runtime application is non-success but leaves staged state retryable; runtime skip/unavailable Docker behavior remains unchanged. See amended ADR 0016.
- First-run panel setup and telemetry (2026-07-28): the printed run token authorizes a two-step browser wizard only while no users exist; account setup then closes permanently with HTTP 410, and edge-bound creation is refused. User profiles and install state are mode 0600, TOTP is verified before persistence, skip preserves the existing exposure refusal, and setup events omit credentials/email. Anonymous telemetry is opt-out but strictly limited to install UUID, wpfy/Python/OS versions, and site/active counts; the built-in endpoint is empty, `WPFY_TELEMETRY=0` overrides state, and the CLI prints the exact payload. See ADRs 0025 and 0026.
- Live-verification tour (2026-08-01): the panel HTTP surface is live-verified. Six shipped fixes are verified live: FlyingPress uses `purge-everything`; cache purge audit records per-layer status and a `partial` outcome when only some layers clear; rendered Traefik static config is authoritative for ACME changes and force-recreate; panel failed-login throttling resolves the real client through the trusted edge; panel tokens support `--token-file` and `WPFY_PANEL_TOKEN` while `--token` warns; and disabling Redis no longer leaves an orphaned container. L6 is a non-defect because cron timers were never installed; L5 remains retracted because per-site cron runs inside its own site container.
- Phase 5a metrics sampler (2026-07-27): `metrics.py` stores host and exact managed-domain samples in a WAL-mode stdlib SQLite database under the state directory, with indexed range reads and 14-day retention. One bounded whole-machine Docker stats call joins the existing minute tick after per-site cron; daily pruning and failures are contained and logged. `wpfy metrics sample|show|prune` is implemented. The panel metrics API is live-verified across all six supported ranges, as are the Events and Services endpoints; browser graph rendering is implemented but has not been verified live. See ADR 0018.
- Phase 4b security and cron panel (2026-07-27): loopback panel API routes and responsive tabs expose the accepted Phase 4 operation layers. Security previews validate and preflight without mutating, unproxied Cloudflare-only changes require a deliberate acknowledgement, and generated basic-auth passwords use the existing one-time credential panel. Cron lists site-derived services and real run outcomes, with add, enable/disable, run-now, and confirmed delete controls.
- Phase 4a.5 per-site cron correction (2026-07-27): job timeouts are authoritative inside the selected container. A fixed supervisor runs the command in a new `setsid` process group, terminates that whole group, and emits a random timeout marker; the host Compose timeout remains a longer client-wedge backstop. Failed execs use `compose ps --status running -q` to distinguish a stopped service from a failed job, never the job's own output. The profile-only `wpcli` service is excluded for new jobs and legacy entries migrate to `app`, which has the same image, `wp` on `PATH`, and `/var/www/html` as its working directory. See ADR 0017.
- Phase 4a.2 per-site security controls (2026-07-27): basic auth stores an APR1 htpasswd hash at `nginx/htpasswd` mode `0640`, outside `app/`; legacy `{SHA}` hashes remain accepted until operators rotate them. The individually mounted file is rotated in place so running containers see revocations. Cloudflare-only uses a Traefik edge `ipAllowList` from effective Cloudflare ranges, with DNS lockout warnings and CLI `--force`; real-IP trust uses the discovered wpfy edge CIDR plus Cloudflare hops when needed, and discovery failure installs fail-closed rules. The managed health endpoint is exempted from server-level auth. See ADR 0016.
- WP Rocket static serving (2026-08-02): `page_cache=wp-rocket` renders an adapted Rocket-Nginx 3.1.2 block (MIT) so nginx answers an anonymous hit from WP Rocket's own cache file with no PHP, WordPress or MySQL in the request path, reporting `X-Wpfy-Cache: HIT`. wpfy's `$wpfy_skip_cache` rules remain the sole authority on eligibility; upstream's own cookie/method conditions, query-string ignore lists, pre-gzipped `.html_gzip` variants and browser expiration blocks are deliberately not carried. The cached-page location re-emits `BASE_SECURITY_HEADERS` because nginx drops every inherited `add_header` from a location that sets one. Purge gains a `rocket` layer that deletes the files regardless of the plugin command's exit status. Verified against real nginx 1.27, not only offline. See ADR 0029.
- Phase 3a native cache integration (2026-07-24): page and object cache selection are orthogonal and persisted through `SiteDefinition`; free cache plugins, BYO upload staging, wpfy's FastCGI cache, Redis Object Cache wiring, safe Nginx bypass snippets, layered purge, and `wpfy cache show|set|object|purge` are implemented. Panel cache routes are implemented and live-verified. The FastCGI cache uses a site-uid-owned sibling `cache-data/` bind-mounted to `/var/cache/nginx/fastcgi`, outside backups, rather than the image's unwritable default cache directory. Generated files mounted individually by Compose are updated in place with no-follow writes so running containers retain the live inode; running Nginx configuration is checked by status/diagnostics and cache reload failures are non-zero.
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
- The `le` ACME certificate resolver is generated into `traefik.yml`, with `WPFY_ACME_EMAIL` read when the Traefik scaffold is written; direct sites use TLS-ALPN-01, Cloudflare-proxied sites use HTTP-01 through `le-http`, and wildcard SSL uses the Cloudflare DNS challenge.
- ACME certificate status queries via `acme.json` read from the Traefik container.
- ACME certificate domain matching is case-insensitive to match Traefik's lowercased stored domains.
- Force certificate renewal by removing domain entry from acme.json and reloading Traefik.
- Direct sites use TLS-ALPN-01; Cloudflare-proxied sites use HTTP-01 through `le-http`; wildcard SSL uses the Cloudflare DNS challenge.

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

### Two-Step Panel Sign-In (rc6)

`POST /api/auth/login` verifies the password first. No TOTP on the account: session token as before. TOTP enabled: `{mfa_required: true, challenge}` and no session. The challenge is an opaque `secrets.token_urlsafe(32)` id bound to the requesting client, expires in 120 s (`PENDING_LOGIN_TTL_SECONDS`), is single-use (burned under the state lock before any check), and is exchanged for a session at `POST /api/auth/login/totp`. Caps: `MAX_PENDING_LOGINS` 256 global, 8 per user; refusal counts as a client failure with auth-log reason "throttled". Lockout and client throttle are rechecked atomically inside the final `_STATE_LOCK` + `_store_lock()` transaction in `complete_login()` -- pre-checks alone are racy against concurrent redemptions. Presence of a `totp` key (even null) selects the preserved combined form. Failure accounting and reason vocabulary ("invalid_credentials"/"totp_failed"/"locked"/"throttled") are identical across both steps so fail2ban sees one surface. UI: step swap on `mfa_required`, rejected codes cleared on reset (visibility-tracked `required`, never static), dead-challenge 401s bounce to the password step.

## Panel Account Self-Service (rc6)
- Every signed-in user gets account pages: profile (name, email), password change (current secret required; other sessions revoked, acting session kept), TOTP enroll/disable behind reauthentication, and per-session revocation.
- Routes are keyed to the session identity (`/api/auth/profile`, `/api/auth/password`, `/api/auth/sessions`, `/api/auth/totp`, `/api/auth/totp/pending`), so site managers get them via an explicit allowlist without system-scoped access.
- `/api/auth/me` carries profile fields and `totp_enabled` so session-scoped pages prefill without overview access.
- Panel basic auth is manageable from Settings: `GET/PUT/DELETE /api/settings/basic-auth` with a server-derived `auth_state` (`enforced`/`staged`/`stale`/`unknown`/`off`) read from the router's own content — `stale` covers both a mismatched credential and an orphaned one (router prompts while nothing is stored); disable restores the credential on router-rewrite failure and refuses (409) when the panel is exposed but no managed router is recognized.

## Planned / Deferred
- WordPress Multisite (scheduled 1.1, ADR 0035): both subdirectory and
  subdomain modes; subdomain requires a Cloudflare DNS wildcard record plus a
  passing wildcard TLS preflight before any mutation; network children share
  one WPFY site runtime/database and the product must disclose that, while
  separately managed WPFY sites remain isolated. Implementation blocked
  pending offline and disposable-VPS evidence. Nothing implemented yet.
- FileBrowser Quantum (ADR 0031, amended 2026-08-25): stays disabled/parked
  through 1.0 stable; reassess at 1.1 planning; no code deletion.
- Remediate remaining security audit findings: Traefik socket risk reduction, WP-CLI artifact verification, explicit non-root users/read-only root filesystems where compatible, and live execution of the disposable-VPS validation flow.
- Additional DNS providers for wildcard SSL.
- Additional ACME challenge/provider support beyond the implemented direct TLS-ALPN-01, Cloudflare-proxied HTTP-01, and Cloudflare DNS wildcard flows.
- Stronger partial-install diagnostics beyond the implemented installer log and staged app rollback.
- Traefik dashboard behind authentication for debugging.
- Integrated dashboard UI and Netdata remain deferred to v2; phpMyAdmin, Adminer, and Composer are available only as prep-only helper image pulls.

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
- 2026-08-25: Quantum stays disabled/parked through 1.0 stable, reassessed at
  1.1 planning; no code deleted. ADR 0031 amended.
- 2026-08-25: Multisite scheduled for 1.1 with both modes (ADR 0035);
  subdomain requires Cloudflare DNS wildcard plus a passing wildcard TLS
  preflight before any mutation; children share one WPFY site runtime/database
  and this is disclosed while WPFY sites stay isolated from each other;
  implementation blocked pending offline/VPS evidence.
- 2026-08-25: 1.0 scope confirmed — telemetry inert-by-default, SMTP
  test-only, named S3-compatible storage CLI-only.
- 2026-08-25: Flat CLI canonical; grouped compatibility surfaces and confirmed
  legacy removals deprecate in 1.0 and are removed no earlier than 1.1, each
  with actionable migration guidance.
- 2026-08-25: `stack migrate` deprecated in 1.0, removed in 1.1.
- 2026-08-05: F2 limits forwarded client and scheme trust to inspected Traefik addresses, then refreshes managed sites after edge start; see ADR 0016.
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
