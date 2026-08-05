# Worklog

## 2026-08-05 - S3 backup transport and redirect guard
- Required HTTPS for S3 backup configuration; `--allow-insecure` deliberately persists the only HTTP opt-out as `WPFY_BACKUP_S3_ALLOW_INSECURE=1`, while legacy plaintext files now fail closed with migration guidance.
- Replaced default `urlopen` with a shared opener that refuses a redirect whose host:port differs from the signed request, keeping SigV4 authorization material at the configured endpoint.
- Added CLI regression coverage and verified protected F3 endpoint/redirect gates.

## 2026-08-05 - Per-site security controls reach the running edge
- Corrected runtime convergence: stopped sites stage reload controls and report startup application, while Cloudflare-only compares live `web` labels and skips matching state; stale or unreadable labels still trigger recreation.
- Made basic-auth, deny-IP, user-agent, and login-rate-limit mutations reload the affected Nginx service after successful render; made Cloudflare-only force-recreate `web` after regenerating its Traefik labels.
- A runtime failure now returns non-success while preserving staged state and explicitly reports that configuration was not applied; repeat CLI and panel requests retry application safely.
- Preserved scaffold-time/file-only security rendering and offline `WPFY_SKIP_RUNTIME` or unavailable-Docker behavior. Verified protected mocked and real-Docker F1 gates plus focused regression coverage.

## 2026-07-28 - First-run panel setup and telemetry
- Added private install state, forward-compatible user profile fields, run-token setup status/create routes, permanent post-setup closure, edge refusal, shared client throttling, and a 12-character password minimum.
- Added a responsive two-step wizard with separate licence/telemetry choices, verified TOTP enrollment, explicit skip consequences, and pinned MIT QRCode.js provenance under the unchanged CSP.
- Added exhaustive seven-field opt-out telemetry, daily lock-serialized background delivery, an intentionally empty built-in endpoint, environment override, and exact-payload CLI controls.
- Added focused setup/auth/telemetry tests and ADRs 0025/0026. Live VPS proof remains to be recorded separately.

## 2026-07-27 - Phase 5b dashboard, Events, and Services panel
- Added authenticated metrics and structured services endpoints plus site-scoped and separately confirmed edge restart routes.
- Reused `site_cron._allowed_services(domain)` through its validator before any service name reaches `docker compose --project-name <site> restart <service>`.
- Added responsive host/per-site canvas graphs, explicit no-sample guidance, Events domain/action filters with visible job IDs, and a Services page whose edge warning says every site is affected.
- Added focused loopback endpoint tests including real argument-vector assertions; all 312 immutable gates and all 1098 tests passed.

## 2026-07-27 - Phase 5a metrics sampler
- Added a mode-0600 SQLite database with WAL, exact-scope range and timestamp retention indexes, host `/proc` sampling, and one bounded whole-machine Docker stats call.
- Resolved container names against whole candidates built from (project x known service), accepting `{project}-{service}` with an optional replica index, so strict-prefix projects, the shared Traefik container, and unrelated Compose stacks cannot be misattributed. Requiring the replica index would have discarded every wpfy container, since each generated service sets an explicit `container_name`; the gate fixture was corrected to production naming so that parser can no longer pass.
- Joined sampling to the minute tick and pruning to the daily tick with explicit failure lines while preserving other cron tenants; corrected daily `HealthResult` handling through shared readiness semantics.
- Added `wpfy metrics sample|show|prune`, focused parser/storage/concurrency tests, ADR 0018, and the metrics command specification. Real-Docker and full-suite evidence is recorded in the Phase 5a report.

## 2026-07-27 - Phase 4b security and cron panel
- Added bearer-protected security and cron routes with mutating metadata derived by the existing authorization gates.
- Security dry-run builds and validates desired state plus preflight warnings without calling operation-layer mutators; unacknowledged Cloudflare lockout warnings return before mutation.
- Added responsive Security and Cron tabs, one-time basic-auth credential rendering, site-derived service choices, real run outcomes, and a coral high-contrast WARN badge distinct from neutral PLAN.
- Added focused live-loopback endpoint tests for dry-run immutability, acknowledgement, credentials, leak scans, cron CRUD, service isolation, and skipped execution outcomes.

## 2026-07-27 - Phase 4a.5 per-site cron runner correction
- Moved the authoritative timeout into the selected site container as `timeout -k 5` around a fixed supervisor; the host subprocess timeout adds 15 seconds for exec startup, five for in-container kill grace, and five as a Compose-client wedge backstop.
- Confirmed all PHP versions, Nginx, MariaDB, Redis, SFTP, and Adminer images provide both `timeout` and `setsid`. Because raw BusyBox timeout leaves background descendants alive, the supervisor uses a new process group, TERM then KILL, and a random marker that distinguishes expiry from a command's natural exit 124.
- Removed profile-only `wpcli` from selectable cron services, migrating prior `wpcli` entries to `app`; a live `app` container confirmed `wp` at `/usr/local/bin/wp` and working directory `/var/www/html`.
- Replaced job-output string matching with a failed-exec Compose running-service probe. Two live 2-second timeout ticks using `sleep 61 & wait` left no command, timeout, supervisor, or descendant process after either run.
- Verified 44 cron gates (with 33 expected security-branch failures), 707 non-gate tests, and the immutable gate checksum.

## 2026-07-27 - Phase 4a.2 per-site security lockout controls
- Completed basic auth, Cloudflare-only edge enforcement, DNS lockout preflight, and dynamic real-IP trust on top of the Phase 4a.1 security state/rendering contract.
- Kept `nginx/htpasswd` outside `app/`, mode `0640`, and updated it in place with no-follow flags because Compose mounts the individual file; live Docker rotation preserved host inode `62464967` and container inode `300`, with 43 bytes on both before and after.
- Real Docker evidence: `nginx -t` succeeded; old basic-auth credentials returned HTTP 401 while the rotated credential returned HTTP 200; the managed healthcheck became healthy after explicitly disabling inherited auth for `/healthz.html`.
- Cloudflare-only labels use the effective published ranges and `docker compose config --quiet` returned 0. The first 33 Phase 4 security gates passed; the full suite had 818 passes and 44 expected cron failures because `site_cron` is absent on this branch; non-gate tests had 661 passes.
- Extended ADR 0016 and the decision log with edge-vs-origin enforcement, CIDR trust trade-off, credential mount/revocation behavior, and preflight scope.

## 2026-07-24 - Phase 3a.3 single-file bind mount fix
- Changed generated `nginx/cache-path.conf` installation from atomic replacement to an inode-preserving no-follow write because Compose mounts the file individually and a running container remains pinned to the original inode.
- Kept `nginx/extra/wpfy-cache.conf` on candidate-plus-atomic-swap semantics inside its directory bind mount, with non-`.conf` candidate names and cleanup on every exit path.
- Made cache reload rejection non-zero and actionable, retrying briefly for delayed shared-folder propagation, and added running `nginx -t` checks to site health and diagnostics so an HTTP-healthy site cannot report ready when Nginx rejected generated configuration.
- Added offline inode-identity and reload-reporting regression coverage; application and real-Docker verification are recorded in the Phase 3a.3 report.

## 2026-07-24 - Phase 3a.1 FastCGI cache startup fix
- Fixed wpfc startup by creating a per-site `cache-data/` directory before Compose rendering, adding it to the managed-path symlink guard and site-uid ownership pass, and bind-mounting it at `/var/cache/nginx/fastcgi`.
- Kept plugin-based cache modes unchanged: their cache-path snippet remains empty and they do not mount or create `cache-data/`.
- Verified 113 gates, 720 full pytest tests, immutable gate checksum, double-refresh byte stability, and real-image `nginx -t` as uid 100000.

## 2026-07-24 - Phase 3a native cache integration
- Split page-cache and Redis object-cache selection into independent persisted axes with legacy `SITE_FLAVOR` migration.
- Added native free-plugin installation, paid/BYO staging, wpfy FastCGI cache rendering, Redis Object Cache wiring, safe bypass rules, and layered purge operations.
- Added `wpfy cache <domain> show|set|object|purge` plus orthogonal create/update shortcuts; panel files remain reserved for Phase 3b.
- Added ADRs 0014 and 0015 and the cache command specification. Verified 718 pytest cases and 113 immutable gates in the application worktree.

## 2026-07-24 - Phase 2b panel parity
- Added browser tabs for Databases, PHP Settings, and Vhost with typed exact-name confirmations, one-time database credential rendering, Adminer loopback/tunnel guidance, PHP dry-run previews, and verbatim Nginx validation output.
- Centralized panel operation status mapping so invalid input, missing sites, unavailable runtime, and rejected Nginx content use 400, 404, 503, and 422 respectively.
- Recorded generated `nginx/default.conf` API exposure as a remaining limitation; UI identifies the wpfy-owned path without widening the Phase 2a API.

## 2026-07-24 - Phase 2a per-site databases and config overrides
- Added isolated database/user operations with exact identifier validation and in-container MariaDB secret expansion.
- Added durable PHP settings, operator-owned PHP/Nginx override files, fail-closed Nginx validation, loopback-only Adminer, CLI commands, and panel routes.
- Added Phase 2a operation/API regression tests and ADR 0013; final verification is recorded in the application repository report.

## 2026-07-19 - RC2 release closure
- Created separate A–F implementation, payload/export, and private-evidence commits.
- Verified clean-commit tests, installer/export contracts, test-free wheel/sdist,
  installed-wheel CLI identity, and local security audit.
- Deferred public publication, anonymous artifact/image validation, disposable-VPS
  lanes, provider S3 checks, and optional available scanner runs.

## 2026-07-19 - Phase F bounded runtime performance
- Cached effective Cloudflare CIDR parsing and stopped public-IP probing after first valid IPv4.
- Replaced per-container health inspection with one batch for `site_health()` and one batch per `wait_for_service()` poll.
- Suppressed exact no-op scaffold registry writes while preserving creation and maintenance metadata.
- Verified 552 pytest cases outside sandbox, 175 focused cases, 59 pinned flake8 findings, WordPress/Docker hardening, package builds, import smoke, docs QA/build, and temp-root CLI QA. Disposable-VPS timing remains deferred.

## 2026-07-18 - Phase E configuration and operations consolidation
- Reused no-follow env reads for stored SMTP, Cloudflare DNS, and S3 configuration; symlink/read failures now return domain errors.
- Added exact-value overlap-safe redaction and shared systemd mechanics; retained domain policies, unit contents, and distinct key/pattern masking.
- Consolidated matching CLI secret input, canonical project slugs, and health defaults.
- Verified 542 pytest cases outside sandbox, 170 focused cases, WordPress/Docker/security hardening, sdist/wheel builds, 59 flake8 findings, and temp-root CLI scheduler/SMTP QA. Disposable-VPS systemd QA remains deferred.

## 2026-07-09 - KB design and SEO audit follow-up
- Added `PRODUCT.md` context for the KB product-register surface.
- Tightened VitePress crawl metadata with sitemap generation, robots.txt, and global robots/theme/social hints.
- Improved KB interaction polish with visible focus, touch-action, hover/active feedback, reduced-motion handling, balanced headings, and a completed home feature grid.

## 2026-07-09 - CLI VM release Page 9 grouped retention
- Retained grouped `wpfy site ...` and `wpfy stack ...` commands for this release instead of removing parser branches.
- Kept `wpfy stack install|remove|purge|migrate|upgrade|status` as the canonical grouped stack namespace.
- Kept grouped site-only operations (`site ssl`, `site list`, `site info`, `site show`, `site status`) and duplicate grouped site commands for compatibility, while documenting flat `run`, `backup`, `restore`, `wp`, `rm`, and `config` as primary where exact equivalents exist.

## 2026-07-08 - Demyx feature parity build
- Added local backup retention/prune, explicit latest restore, named S3-compatible storage profiles, remote backup list/restore/delete/prune, and Traefik/ACME edge backup/restore.
- Added Cloudflare-only wildcard SSL with redacted `wpfy dns cloudflare` config and Traefik DNS resolver labels.
- Added opt-in helper image pulls for phpMyAdmin, Adminer, and Composer; MySQLTuner skips until a vetted pinned image exists.
- Kept OpenLiteSpeed/Bedrock, panel/API/UI, automatic SMTP notifications, and host-stack migration out of scope.
- Verified focused parity tests with `rtk proxy env PYTHONPATH=src pytest tests/test_site_layout.py tests/test_cli.py tests/test_traefik.py tests/test_ssl_flow.py -q`.

## 2026-07-03 - CLI VM release Page 8 validation surface
- Added split command docs for flat runtime, config, operator, and backup storage/schedule surfaces.
- Updated the disposable-VPS validation runner so the real install lifecycle now exercises flat creation, runtime, config/refresh, backup/restore, delete, WordPress CLI, cron, SMTP, log cron, and operator utility commands where the flat CLI exists.
- Reviewed operator run 20260703T102801Z-page8 as a near-pass and tightened the runner so unexpected non-zero exits are recorded, SMTP clear uses `--force`, restore/pre-reboot wait for WordPress readiness, and skipped optional scanners are labelled as skipped rather than full scanner coverage.
- Kept grouped `stack install|status` and grouped site status/SSL/list probes in validation where grouped namespaces are retained.

## 2026-07-03 - Cron and SMTP operator surface
- Added `wpfy cron minute|five-minute|hourly|six-hour|daily|weekly` to run due WordPress cron events across managed WordPress sites in sorted order.
- Added systemd-backed `wpfy cron install|status|disable`, safe custom cron hooks, cron log writing, and `wpfy log cron`.
- Added `wpfy smtp set|status|test|clear` with `/etc/wpfy/smtp.env` mode `0600`, password stdin/prompt handling, credential redaction, dry-run validation, and explicit test sends.
- Kept backup automation on the existing `wpfy backup schedule` surface; `wpfy cron daily` does not run backups or forced updates.
- Verified Page 7 CLI behavior with `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`.

## 2026-07-03 - Backup storage and schedule CLI
- Added permanent upload-only S3-compatible backup config through `wpfy backup storage set|status|test|clear`.
- Added one systemd-backed recurring backup timer through `wpfy backup schedule daily|weekly|status|disable`, running `wpfy backup all`.
- Stored S3-compatible config uses `/etc/wpfy/backup-storage.env` with `0600`; env vars still override stored config; status/test output redacts key values.
- Verified storage config loading, env precedence, schedule unit/timer rendering, and secret redaction with focused pytest and temp-home CLI QA.

## 2026-07-03 - CLI VM release Page 6 backup restore ergonomics
- Added local archive listing for backup and restore, verified destination-copy support, upload-only S3-compatible backup uploads, and sorted `backup all` aggregation.
- Kept local archives canonical, preserved restore validation-before-stop behavior, and deferred retention, restore-latest, remote restore/list/delete, lifecycle policies, scheduling, and Traefik/ACME backup.
- Verified backup copy/upload/list behavior and CLI aggregation with `rtk proxy env PYTHONPATH=src pytest tests/test_site_layout.py -q` and `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`.

## 2026-07-03 - CLI VM release Page 5 operator commands
- Added canonical flat operator commands: `wpfy healthcheck`, `motd`, and `utility`.
- Reused operational inspection and site health helpers; disk/load/password/token/htpasswd utilities use only stdlib and do not mutate site state.
- Verified parser/help, disk/load thresholds, runtime-skip system warning behavior, single/all-site health exits, secret-safe MOTD rendering, and offline utility generation with `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`.

## 2026-07-03 - CLI VM release Page 4 safe config commands
- Added canonical flat safe config commands: `wpfy config`, `edit`, and `refresh`.
- Routed controlled config mutations through `UpdateSiteRequest`/`update_site`; password updates use TTY prompt or `--password-stdin` and do not accept a raw password argument.
- Verified sanitized config status, editor refusal/success safety, refresh restart behavior, deterministic `refresh all`, invalid/missing site safety, and unmanaged `.env` key preservation with `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`.

## 2026-07-03 - CLI VM release Page 3 runtime commands
- Added canonical flat runtime commands: `wpfy compose`, `up`, `down`, `exec`, `cp`, and `pull`.
- Reused `compose_command`, `start_site_runtime`, and `stop_site_runtime`; invalid domains and missing sites return before Docker/Compose helpers run.
- Verified parser/help, dispatch, missing-site/invalid-domain safety, `down --volumes`, `cp` broad-path rejection, service validation, stderr fallback, and subprocess return-code preservation with `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`.

## 2026-07-03 - CLI VM flat-canonical direction decision
- Recorded flat CLI as the canonical VM/operator target surface.
- Reclassified grouped `wpfy site ...` and `wpfy stack ...` commands as compatibility surfaces during migration. Page 9 later retained them for this release.

## 2026-07-03 - CLI VM release Page 2 flat aliases
- Added top-level shortcuts for existing grouped behavior: `wpfy run`, `backup`, `restore`, `rm`, `wp`, and `version`.
- Preserved grouped `wpfy site ...` commands at the time; Page 2 is now documented as the first migration step toward the flat-canonical CLI.
- Verified alias parser/help, dispatch, `rm` non-TTY safety, WP-CLI command construction, and version output with `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`.

## 2026-07-03 - CLI VM release Page 1 baseline
- Added `docs/CLI-VM-RELEASE-MATRIX.md` with all 24 planned command labels mapped to existing grouped commands, planned aliases, planned new commands, or current baseline commands.
- Captured current help output for `wpfy --help`, `wpfy site --help`, `wpfy stack --help`, and `wpfy log --help` in `/Users/arnab/Desktop/_Projects/wpfy-pvt/.omo/evidence/task-1-wpfy-cli-vm-release-five-hour-pages.txt`.
- Verified the parser baseline with `rtk proxy env PYTHONPATH=src pytest tests/test_cli.py -q`: 40 passing tests, plus direct CLI checks for `log --help` and unknown-command behavior.

## 2026-06-30 - Repository split refresh
- Fast-forwarded `/Users/arnab/Desktop/_Projects/wpfy-pvt` `main` to `origin/main` at `59bb078`.
- Re-ran the split on `codex/split-code-website-docs` after the pull.
- Moved the remaining docs/KB deployment residue (`docs/FORUM.md`, KB theme components, KB public icons, `.github/workflows/deploy-kb.yml`, and `scripts/deploy-kb.sh`) into `/Users/arnab/Desktop/_Projects/wpfy-docs`.
- Staged those residual docs/KB files for removal from the application repository branch.

## 2026-06-07 - Remaining architecture review candidates
- Restored the original architecture review from the Codex session record to `/Users/arnab/Desktop/architecture-review-20260607-130017.html`.
- Added an authoritative site definition spanning Compose, env, registry metadata, and optional SFTP; removed SFTP string surgery.
- Collapsed SSL preflight, ACME state, certificate metadata/expiry, and renewal into one certificate lifecycle module.
- Moved aggregate, diagnostic, and security fact collection out of CLI handlers into an operational inspection module.

## 2026-06-07 - Managed-site lifecycle deepening
- Added `src/wpfy/site_lifecycle.py` as the interface for site create, update, and SSL enablement.
- Moved preflight ordering, desired site specification, scaffold/runtime sequencing, WordPress provisioning, and registry updates out of `cli.py`.
- Retargeted CLI tests to the lifecycle interface and added direct lifecycle tests for operation ordering, preflight safety, registry updates, and preservation of existing site settings.
- Live VPS validation on `<redacted-host>` found that later SSL enablement left WordPress canonical URLs on HTTP; fixed the lifecycle to update `home` and `siteurl` through WP-CLI.
- Verified the full test suite with 161 passing tests before redeployment.


## 2026-06-07 - Public repository history reset
- Audited the complete public Git history and confirmed that deleted internal docs, agent/session artifacts, validation logs, infrastructure identifiers, and copied third-party documentation remained retrievable from old commits.
- Tightened `scripts/export-public.sh`, added fresh-history export support, removed internal audit and validation material from the public allowlist, and added public-surface guards.

## 2026-06-07 - Installer identity and host summary
- Added a compact `WPFY` ASCII logo and 80-column live host summary to the root installer.
- Added deterministic shell coverage for build, OS, hostname, virtualization, disk, RAM, swap, CPU, IPv4, IPv6, and output width.
- Replaced phase-by-phase raw terminal output with one color-coded 16-step progress sequence spanning `install.sh` and the bundled installer.
- Added log-only command capture by default, `--verbose`, `--no-color`/`NO_COLOR`, SKIP/WARN states, elapsed-time success summaries, failure log tails, and interruption cleanup.
- Added focused shell coverage for TTY rendering, non-TTY stability, verbose/log behavior, progress continuity, success, failure, and signals.

## 2026-06-06 - Live WordOps UX verification
- Installed WordOps 3.22.0 and its recommended stack on the disposable VPS at `<redacted-host>`.
- Verified a live WordPress and Let's Encrypt flow on `ux.wpfydev.top`, including HTTP redirect, HTTPS response, and WordPress core installation.
- Added TTY-only progress messages to `wpfy stack install` before each selected component pull/start operation, based on the observed value of WordOps' long-running step feedback.

## 2026-06-06
- Reworked wpfy CLI help and command summaries to be human-first: top-level and subcommand help now have descriptions/examples, and the site/stack/status/update/maintenance flows render sectioned summaries with clearer status labels.
- Added phase banners to the root `wpfy` installer and `install.sh` so installation reads as guided progress instead of an unstructured stream.
- Updated CLI tests to pin the new help text and summary shapes; `pytest`, installer-idempotency, and installer-swap checks all pass.

## 2026-06-05
- Added adaptive installer swap before package/Docker installation: skip existing active swap, skip when `/` has less than 8 GB free, create 2 GB for 8-29 GB free, create 4 GB for 30 GB+ free, and support `WPFY_SWAP=0`, `WPFY_SWAP_SIZE_MB`, and `WPFY_SWAP_FILE`.
- Added `tests/installer-swap.sh` and wired it into `scripts/security-audit.sh` for deterministic dry-run coverage of swap sizing, disables, overrides, and no file creation.
- Step 1 of non-root (`ubuntu`) operator support: made `/usr/local/bin/wpfy` self-elevate via `sudo` (forwards `WPFY_*`/`ACME_*`), so non-root logins run plain `wpfy …` (ADR 0008). Root logins unchanged; `WPFY_NO_SELF_ELEVATE=1` escape hatch.
- Fixed `handle_site_wp` to always inject wp-cli `--allow-root` (wpcli container runs as root; host-uid gate broke non-root operators).
- Retargeted validation harness to `ubuntu@<redacted-host>` / `m.wpfydev.top`: home-based staging dir, remote runner runs unprivileged with `wpfy` bare and `$SUDO` only on raw non-wpfy probes.
- Updated docs: ADR 0008, DECISION-LOG, SECURITY (operator privilege model), INSTALLER (root/sudo), CHANGELOG, MEMORY.
- Step 2 live VPS run as `ubuntu`: full `all` run completed and evidence was pulled to `.context/vps-validation/20260604T233922Z`; wrapper self-elevation worked, but ACME failed because external port 443 timed out while the VPS listened on 443.
- Tightened the validation harness so missing ACME certs record a validation failure and bounded curl timeouts keep blocked 443 probes short.
- Improved `wpfy site create` CLI output: short progress lines now show while scaffold/bootstrap/runtime/WordPress provisioning run, and the final create result is formatted as a readable summary with the generated password on its own line when applicable.

## 2026-06-03
- Added `scripts/vps-release-validation.sh` to package the current workspace into a reproducible archive, collect local DNS/build evidence, optionally stage the bundle to a disposable VPS, and print the remote runner command.
- Added `scripts/vps-release-validation-remote.sh` with numbered validation phases and evidence files for baseline capture, installer checks, stack bootstrap, site lifecycle, SSL, hardening probes, operations, SFTP, backup/restore, delete, scanners, and reboot checkpoints.
- Added `tests/vps-validation-runner.sh` and wired it into `scripts/security-audit.sh`.
- Verified the new validation scripts with `bash -n` and the local runner test.
- Followed up on live VPS findings by making rejected restore archives validate before runtime stop, binding non-SSL Traefik routers explicitly to the `web` entrypoint, and fixing validation HTTP probes to use HTTP for non-SSL domains.
- Added post-restore status/Compose evidence capture to the VPS runner and regression coverage for restore validation ordering, non-SSL router labels, and SSL preflight-only exit codes.
- Made the WordPress hardening smoke deterministic by forcing the fallback bootstrap path instead of depending on a live wordpress.org download.
- Added optional `WPFY_SOURCE_SHA256` verification to `install.sh` and local smoke coverage for matching and mismatched source archive checksums.
- Changed the root installer to stage source updates through `/opt/wpfy/app.next` and restore `/opt/wpfy/app.previous` if a later install step fails.
- Removed the unused shell-string helper from the root installer.
- Expanded `wpfy secure` container checks to report no-new-privileges, dropped `NET_RAW`, PID limits, memory limits, and log rotation.
- Implemented full WordPress provisioning for `site create` WordPress flavors after runtime startup.
- Added `site create --user`, `--email`, and `--pass` for WordPress admin setup, with TTY prompts, Git config defaults, generated-password fallback, and one-time generated password output.
- Added WP-CLI provisioning flow: DB readiness wait, core download if absent, `wp-config.php` creation if missing, `wp db create`, and idempotent `wp core install`.
- Kept admin password out of persisted wpfy state and redacted it from provisioning error messages.
- Added installer logging to `/var/log/wpfy/install.log` with failed line/command reporting and `WPFY_INSTALL_LOG` override support.
- Reconciled stale scaffold-era command docs, runbooks, SSL flow docs, installer docs, security docs, README, changelog, and memory.
- Verified `pytest` passes with 118 tests.
- Verified `scripts/security-audit.sh` passes locally with `PASS=8 WARN=5 FAIL=0`; warnings remain missing external scanners, no Docker runtime inspection on this Mac, local web target not provided, and accepted Traefik Docker socket risk.

## 2026-06-02
- Added `SECURITY_AUDIT_REPORT.md` and `SECURITY_TEST_PLAN.md` for the defensive security audit pass.
- Added safe local audit scripts: `scripts/security-audit.sh`, installer idempotency, exposed ports, Nginx sensitive paths, Docker hardening, WordPress hardening, backup/restore smoke, and web vulnerability smoke checks.
- Verified `pytest` passes with 103 tests.
- Verified backup/restore smoke and exposed-port checks pass; installer dry-run handoff passes locally with bundled Ubuntu dry-run skipped on macOS.
- Confirmed current hardening gaps with failing checks for generated Nginx sensitive paths, Docker hardening controls, and WordPress/Nginx hardening.
- Hardened generated Nginx for uploads PHP denial, sensitive file blocking, directory-listing disablement, and browser security headers.
- Added generated Compose hardening for site, Traefik, and SFTP services, including `no-new-privileges`, `cap_drop: NET_RAW`, process/resource limits, and log rotation.
- Added Traefik ping/healthcheck generation and pytest regression coverage for the new hardening.
- Re-ran `pytest` with 108 passing tests and `scripts/security-audit.sh` with `PASS=7 WARN=5 FAIL=0`.

## 2026-06-01
- Added `install.sh` as the public bootstrap script for `curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash`.
- Kept the root `wpfy` script as the system installer and made `install.sh` download a source archive before invoking `wpfy --skip-wpfy-install`.
- Documented `WPFY_REF`, `WPFY_SOURCE_ARCHIVE`, `WPFY_REPO_OWNER`, and `WPFY_REPO_NAME` for release validation and forks.
- Added AGPL-3.0 license metadata and license text.
- Removed the legacy AGPL trove classifier from package metadata after current setuptools rejected it during editable install validation.
- Hardened the installer after VPS validation by moving package installation into `/opt/wpfy/venv` with a `/usr/local/bin/wpfy` wrapper.
- Replaced unavailable `traefik:v3.3-alpine` with `traefik:v3.6.17`, tightened `.env` and backup archive permissions, and made restore restart runtime before SQL import.
- Fixed Traefik v3.6 ACME resolver generation by writing resolver `le` into `traefik.yml` instead of Compose command flags.
- Fixed `site ssl --status` to read ACME storage from the Traefik container when `/letsencrypt/acme.json` is backed by a Docker volume.
- Added `.github/workflows/php-images.yml` so public releases can publish `ghcr.io/wpfyorg/php-fpm:8.2` and `8.3`.
- Added PHP 8.4 as the default runtime, switched stack provisioning back to pull-only PHP images, and expanded image publishing to include `ghcr.io/wpfyorg/php-fpm:8.4`.
- Expanded explicit PHP runtime support and public image publication to include `7.4`, `8.0`, and `8.1`.
- Dropped `7.2`, `7.3`, and `8.5` from the supported matrix for the time being.
- Removed bundled third-party reference docs before public release.
- Reworded public README, package metadata, and docs to describe the project without external project comparisons.
- Added `scripts/export-public.sh` for one-way private-to-public exports with an allowlist that excludes `AGENTS.md` and internal docs.
- Updated the public export allowlist to include the PHP image publishing workflow.
- Repointed `origin` to `wpfyorg/wpfy-pvt.git` and added `public` for `wpfyorg/wpfy.git`.
- Fixed VPS pressure-test blockers: `stack status` before Traefik scaffold, mixed-case ACME status lookup, missing-site delete tracebacks, and SFTP readiness/status output.
- Fixed rebuilt-VPS validation follow-ups: ACME status now tolerates missing Docker, certificate metadata can fall back to OpenSSL, debug no longer reports issued certs as missing when expiry metadata is unavailable, and the validation runner preserves negative command exit codes.
- Hardened restore against malicious backup archives by validating tar members before extraction and preserving private permissions on restored secrets.
- Tightened SFTP to use per-site loopback-only host ports stored in `.env`, keep `.env` private after SFTP changes, and include SFTP containers in `wpfy secure` audits.
- Reconciled security, isolation, SFTP, and restore docs with implemented hardening state.

## 2026-05-20
- Created initial `wpfy` Python CLI scaffold with site and stack command groups.
- Captured project direction in `AGENTS.md`.
- Added documentation and agent memory system covering architecture, server layout, installer, SSL flow, isolation, commands, runbooks, ADRs, and decision log.
- Marked Docker installer, real site lifecycle, ACME, backups, restore, and SFTP as planned rather than implemented.
- Updated root `AGENTS.md` and `README.md` to direct future agents to the docs-first workflow.
- Added root `wpfy` installer script with Ubuntu/root checks, Docker and Compose bootstrap, runtime directory creation, source sync, editable package install, config write, smoke checks, and dry-run support.
- Implemented per-site Compose scaffold generation for `wpfy site create` with idempotent `compose.yaml` and `.env` output.
- Added a safe SSL gate in `site create` that refuses issuance until DNS/IP preflight is implemented.
- Implemented scaffold-backed `site list`, `site info`, `site show`, and `site delete` commands.
- Wired `site create` to attempt `docker compose up -d` when Docker is available and added `site status` for scaffold/runtime inspection.
- Added `WPFY_SKIP_RUNTIME=1` so runtime orchestration can be skipped during offline verification.
- Implemented DNS/IP SSL preflight and `site ssl` preflight command without ACME issuance.
- Added deterministic DNS/IP test overrides so preflight can be verified offline.
- Added minimal WordPress-style filesystem bootstrap plus scaffold backup/restore commands.
- Moved backups into the shared state tree so deleting a site does not erase its backup archives.
- Added site health reporting with scaffold, bootstrap, and runtime readiness fields.
- Confirmed `site status` surfaces `needs-bootstrap` when WordPress files have not been bootstrapped.
- Confirmed `site status` surfaces `degraded` when bootstrap exists but Docker/Compose cannot be inspected.
- Updated `site status` to inspect running container health with `docker inspect` and to treat required services by site flavor.
- Added a per-site `web` container and HTTP probe fixture so `site status` can verify actual HTTP readiness.
- Hardened PHP-FPM image builds against imagick 3.8.x PHP-Parser download flakiness by retrying `pecl install` and clearing `/tmp/pear` between attempts (fixes the failing `Publish PHP Images` workflow).
- Fixed the public-mirror publish workflow (git identity now set globally so commits in the cloned export worktree succeed) and scoped PHP image publishing to the public mirror only (private repo builds-only), resolving the GHCR `write_package` denial; recorded in ADR 0011.
- Switched the public PHP image workflow GHCR login to the public repo `PUBLICPUSH` PAT secret after the public mirror's built-in `GITHUB_TOKEN` still received `permission_denied: write_package` for `ghcr.io/wpfyorg/php-fpm`.
- 2026-06-09: Reverted that PAT switch — the `PUBLICPUSH` PAT failed at login (`denied: denied`, expired/insufficient scope). Restored GHCR login to the built-in `GITHUB_TOKEN` (`github.actor`). The real cause of the earlier `write_package` denial is the pre-existing `wpfyorg/php-fpm` package not granting the `wpfy` repo Write access; fix is the package's "Manage Actions access" setting, not a PAT. Amended ADR 0011 accordingly. **Action still required:** grant the `wpfy` repo Write access on the `php-fpm` package before re-running.
- 2026-06-11: Made `test_ensure_sftp_container_waits_for_port_when_restarting` hermetic by also monkeypatching `wpfy.sftp.ensure_site_scaffold`; it previously leaked through to the real `PATHS` (`/opt/wpfy`) and failed when `test_sftp.py` ran in isolation. Pre-existing issue found during the 2026-06-11 remediation pass.

## 2026-06-11
- Security & correctness remediation pass over the Python package (12 fixes, no feature work): nginx upload size/timeouts/HSTS/case-insensitive PHP handler, `site update --password` via stdin with real admin-login resolution and redacted failures, SFTP password rotation honoured plus generated password shown once, WordPress tarball extraction via the `data` tar filter, Compose project-name collision detection, operator `.env` keys preserved across regeneration, ACME contact email gate before SSL enablement, Redis/MariaDB image tags centralized so `stack install` pulls what compose runs, `site_exists` validates domains, `stop_site_runtime` volume removal made explicit (delete-only), and `site restore` keeps live DB credentials when the DB volume is already initialized.
- Test suite grew from 177 to 201 (24 new tests across site_layout, site_lifecycle, sftp, traefik); `tests/conftest.py` now sets `WPFY_ACME_EMAIL` for SSL-path tests. No new flake8 violations versus the previous tree.
- Known pre-existing test issue (not introduced here): `tests/test_sftp.py::test_ensure_sftp_container_waits_for_port_when_restarting` fails when the file runs in isolation because it depends on a prior test's module reload pointing `PATHS` at a writable directory; it passes in full-suite order.

## 2026-06-12
- Website: added "The modern WordPress stack" interactive ecosystem section (MotherDuck-style stack explorer) with three layers (shared edge / per-site stack / host) and a detail panel per component; copy verified against the actual CLI surface (`--php 7.4-8.4`, `--wpredis`, `wpfy sftp --enable`, image tags `nginx-unprivileged:1.27-alpine`, `mariadb:11.4`, `redis:7.2-alpine`).
- Website: fixed the hero terminal growth pushing the page down on every typing cycle by reserving a fixed em-based height for `.term-body` (7 lines, the tallest scene); verified via browser sampling that body scrollHeight stays constant across full scene loops on desktop and mobile.
- Website: dropped the duplicate teal command marquee, added a "Stack" nav link, and added `scroll-margin-top` so anchors land below the sticky header.
- Note: `scripts/export-public.sh` does not copy `website/`; publishing the site publicly needs an explicit decision (separate hosting or adding it to the export allowlist).
- Website (same day, second pass per feedback): replaced the blue architecture band AND the explorer board with a single MotherDuck-style hub-and-spoke ecosystem diagram (sky band + clouds, grid paper, six pastel logo boxes, dashed pipes, central wpfy terminal node, clickable chips feeding a detail panel with 15 component entries); added "Who is it for?" and "Use cases" sections; added drifting bg doodles (clouds/padlock/brand marks) with scroll-driven animation-timeline and reduced-motion off-switch; clouds straddle the CTA band. Verified with headless-Chrome full-page renders + live preview DOM measurement (note: headless --window-size at 390px lays out wider than the capture, a tooling artifact; the live engine confirms mobile fits). Added ?v= cache-busting to asset URLs after stale-cache blanks in the preview capture context.
- Website (third pass per feedback + MotherDuck video reference): ecosystem diagram now has JS-drawn colored SVG pipes (rounded orthogonal paths per box accent color, measured from layout, resize-aware, hidden when stacked; box hover lifts and brightens its pipe); section bgs alternate cream/--blue-deep (problem/features/who + new subscribe band, with --ink-soft bumped to ink inside blue for AA) with cloud/padlock/brand doodles straddling each blue section's top border; removed the "Honest about where we are" section (security links now point at docs/SECURITY.md on GitHub); nav/footer/CTA gained Forum (forum.wpfy.org) and Docs (docs.wpfy.org) links plus a "Join the forum" CTA button; added a "Stay in the loop" subscribe ribbon above the footer (placeholder form, local confirmation only, no backend). Verified via live preview evals (6 pipes, hover hot-state, subscribe swap, AA contrast on blue, no mobile overflow, stable page height) and headless full-page renders (with --virtual-time-budget so below-fold reveals fire; the 390px right-edge clipping in headless shots remains a capture artifact - live engine shows content right edges at 366px).

## 2026-06-13
- Website (cleanup/polish pass via /autopilot with /gpt-taste + /emil-design-eng + /impeccable lenses): simplified the ecosystem section to match the static MotherDuck reference — removed the click-to-explore detail panel (default "Shared edge / Traefik" tab) and the `ECO` explorer script, and converted the component chips from `<button data-eco>` to static `<span>` legend items (box-hover pipe highlight retained).
- Website: senior-UI icon pass beyond the five glyphs the user flagged — replaced the diagram's weak text glyphs (`>_`, `wp`, three identical `$`) with distinct inline line icons (SFTP transfer arrows, WP-CLI terminal, backup archive, restore rotate, diagnostics activity-pulse), added a matching line icon to each of the eight feature cards beside its tag, and swapped the three identical "Who is it for?" stars for a building / person / server trio (filled, ink-outlined, on-brand).
- Website: feature-card command chips are now click-to-copy `<button>`s — `main.js` appends a copy glyph that flips to a teal check on success (~1.5s), `scale(0.97)` press feedback, `aria-label` for SR, icon swaps in place so there's no layout shift; degrades to a plain labelled chip without JS or clipboard.
- Website: fixed the doubled border between the blue problem band and the blue ecosystem sky strip via `.section-sky:has(+ .eco-section) { border-bottom: 0 }` so the two same-color bands read as one. Bumped asset cache-busters to `?v=5`.
- Verified on the live preview (panel capped at 846px, so desktop pipes are confirmed unchanged by code rather than re-rendered): eco-detail gone, 15 static chips, 5 diagram line icons, 8 card icons + 8 copy buttons (copy→check toggle confirmed), 3 distinct who-icons, problem border-bottom 0, no console errors, AA contrast 5.8:1 on blue, and `documentElement.scrollWidth === innerWidth` (no real horizontal overflow) at 375px. The synthetic-click clipboard test returns false (no user-activation) — expected; matches the existing hero copy button.
- PR #38 review follow-up: per a CodeRabbit a11y comment, the copy result is now exposed to assistive tech — the chip's `aria-label` swaps to `Copied: <command>` / `Copy failed` alongside the visual `.copied` state and restores after ~1.5s (shared `restore()` closure, single `timer` to avoid races). Bumped cache-busters to `?v=5` since `main.js` changed. Verified both paths via stubbed `navigator.clipboard` in the live preview (success → "Copied: …", failure → "Copy failed", restore → base label + class cleared). Round 2 of the same review: the `.catch` now also `classList.remove("copied")` so a failing retry can't leave a stale check-mark visible while the label says "Copy failed" (verified: success sets `.copied`, an immediate failing retry clears it). Cache-buster `main.js?v=6`.
- PR #38 CI (`pytest 3.10`/`3.12`) shows "fail" but the jobs never started: GitHub annotation is "The job was not started because recent account payments have failed or your spending limit needs to be increased." This is an Actions billing/account issue, not a code failure (local `pytest -q` = 201 passed); resolve via GitHub Billing & plans, then re-run.

## 2026-06-23
- Documentation: standardized the static website local preview URL on `http://127.0.0.1:8766/` and recorded the serving command in `AGENTS.md`, `docs/MEMORY.md`, and `website/MIGRATION.md` so future sessions use the same port by default.
# 2026-06-30

- Created the repository split branch in the application repo (`codex/split-code-website-docs`).
- Imported tracked website files into `/Users/arnab/Desktop/_Projects/wpfy-website` as a new local git repository.
- Imported tracked `docs/`, `kb/`, KB package metadata, and KB screenshots into `/Users/arnab/Desktop/_Projects/wpfy-docs` on `codex/import-project-docs`.
- Removed website/docs/KB files from the application repository branch, leaving code, installer, Docker assets, tests, and release automation.

# 2026-07-09

- Docs site production pass: kept `kb/` as the public VitePress source and restyled `kb/.vitepress/theme/custom.css` from MotherDuck-era borders/shadows to Cohere-inspired white canvas, soft stone surfaces, hairline rules, pill CTAs, and dark code blocks.
- Reworked `kb/.vitepress/config.ts` IA so flat commands are primary and grouped site/stack commands are documented as retained surfaces.
- Added public command pages for flat site, backup, restore, runtime, cron, SMTP, DNS, healthcheck, MOTD, utility, log, SFTP, and retained grouped commands; added runbooks, reference pages, and `releases/v1.0.0-rc1`.
- Added `scripts/qa-kb.mjs` and `npm run docs:qa` to scan KB Markdown links plus forbidden private strings before publishing.
- Verified `npm ci`, `npm run docs:qa`, `npm run docs:build`, and VitePress preview at `http://127.0.0.1:4173/` with desktop/mobile screenshots and local-search checks for `backup remote`, `wildcard SSL`, `cron`, `smtp`, and `site status`.

# 2026-07-11

- Optimized runtime inspection: cached Docker Compose availability, removed duplicate per-service health lookups, skipped irrelevant DB/Redis probes, and batched security inspection into one Docker call.
- Switched WordPress downloads plus MariaDB dump/restore to bounded streaming; failed/empty dumps use a partial file and never enter backup archives.
- Extracted `site_paths.py` and `site_runtime.py` from the oversized layout module; updated internal imports while preserving the existing `site_layout` import surface.
- Added focused subprocess-count, streaming, partial-inspect, and malformed-inspect regressions; full pytest reached 364 passing tests.

# 2026-07-17

- Implemented Phase A safety blockers for transactional SQL/archive backups, strict pre-delete backup and runtime-stop gates, maintenance commit ordering, ACME backup/write/reload ordering, and truthful lifecycle-blocking WordPress bootstrap failures.
- Added failure-injection and no-downstream-side-effect tests. Verification: 394 pytest tests passed (including the loopback panel), `tests/wordpress-hardening.sh` passed, package sdist/wheel build passed, docs QA/build passed, Graphify refreshed and queried the mutation paths, and disposable-root CLI QA confirmed offline backup labelling plus strict delete blocking with files kept.
- Flake8 7.3 ran from an isolated `/tmp` environment and reported 89 pre-existing findings across the wider dirty tree; new Phase A line-length findings were fixed, but unrelated lint debt was left unchanged. Python/Bash LSP servers were unavailable and were not installed globally.
- Live database dump, destructive delete, and real certificate renewal were not run against a VPS in this local pass; those production-sensitive scenarios remain for a disposable VPS.
- Implemented Phase B CLI correctness: complete authoritative Nginx inspection, structured PHP/MySQL state and failure reporting, exact-root canonical registry reconciliation with metadata preservation/no-op stability, list-time drift repair, removed ignored list flags, neutral update mismatch wording, resolved annotations, and fail-fast handler construction.
- Verification: 219 focused tests and 412 full tests passed; `tests/wordpress-hardening.sh`, sdist/wheel backend builds, docs QA/build, type-hint smoke, Graphify refresh/explains, and app/docs diff checks passed. The later pinned Phase C rerun established that the project-configured flake8 7.3 command reports 71 findings, correcting this entry's earlier 74 count; no new Phase B finding was left in changed lines.
- Disposable-root CLI QA observed the complete authoritative Nginx block/config, stable registry bytes and mtime across a no-op list, argparse exit 2 for conflicting/removed flags, and immediate failure for an unknown handler. Live PHP/MySQL probes remain deferred to a disposable VPS; the optional Python LSP was unavailable and not installed globally.
- Implemented Phase C bounded transfers and WordPress integrity: verified archive uploads now use fixed-length file-backed signed requests, remote restores stream into private cleanup-safe temporary files, and fresh WordPress bootstrap verifies the latest stable en_US versioned tarball against WordPress.org's published SHA-1 before extraction.
- Phase C verification: 306 focused tests and 427 full tests passed; `tests/wordpress-hardening.sh`, isolated sdist/wheel build, docs QA/build, Graphify refresh/explains, and both repository diff checks passed. Flake8 7.3 remained at the authoritative 71-finding baseline.
- Manual QA: a live loopback sink received 1 MiB and 64 MiB signed uploads with only 2.8 MiB peak-RSS growth; a 16 MiB download completed with mode `0600`; live remote restore accepted a valid archive, rejected a malformed gzip before runtime stop, and cleaned both temporary files; WordPress.org live bootstrap resolved and verified 7.0.1 before creating core files.
- Live S3-provider interoperability was not run because no disposable provider credentials were supplied. Multipart/resumable upload and independent WP-CLI artifact verification remain out of scope. Python LSP remained unavailable and was not installed globally.

# 2026-07-18

- Implemented Phase D thin CLI/deep operations: extracted shared-stack and cache ownership, exposed public runtime log/reset/WP/probe/readiness APIs, and delegated CLI/panel surfaces.
- Corrected destructive/automation truth: `stack purge` requires `--force` and propagates stop/teardown failure; requested cache failures now exit non-zero.
- Added focused domain, surface, ordering, streaming/capture, argument-list, and static-boundary coverage. Live destructive Docker scenarios remain deferred to a disposable VPS.

- Closed the Phase C repair plan: aligned file-backed SigV4 `SignedHeaders` with canonical headers; rejected WordPress destination file, directory, and nested-component symlinks with descriptor-relative no-follow merge and ownership operations; blocked partial bootstrap retries while runtime containers are active; and classified truncated gzip `EOFError` as an invalid restore archive.
- Added independent fixed-time SigV4 reconstruction, real shared-uploader site/edge coverage, external symlink sentinels, safe-existing-tree and lifecycle gates, plus real CLI/real-validator valid, malformed, truncated, interrupted, and unexpected restore coverage. No ADR was required because the repairs restore accepted behavior without changing architecture.
- Follow-up review closed a restore invariant: archive `db-data/` payloads are rejected before runtime stop and excluded defensively from descriptor-safe removal/merge, while post-stop replacement failures return a controlled nonzero result without restarting a partially restored site.
- A second filesystem review moved scaffold `healthz.html` behind descriptor-relative no-follow reads/writes and made non-directory archive roots fail validation before runtime stop.
- A third filesystem audit moved the active-runtime gate ahead of WordPress health mutation, rejected symlinks across scaffold-managed paths before environment reads/writes, propagated scaffold ownership failures to update/SSL runtime gates, and explicitly rejected special archive members.
- The final filesystem audit moved shared managed-site `.env` reads and compose/environment/Nginx scaffold writes to descriptor-relative no-follow operations, closing both pre-guard reads and post-validation symlink swaps across create, update, SSL, and ownership paths.
- Verification on the working tree: 356 focused and 475 full pytest tests passed; `tests/wordpress-hardening.sh`, sdist/wheel build, type-hint import smoke, docs QA/build, Graphify refresh/query, app/docs diff checks, and the 71-finding flake8 7.3 baseline passed. Manual disposable-root QA independently reconstructed SigV4, preserved external WordPress and restore symlink sentinels, accepted a valid CLI remote restore, rejected a truncated archive before runtime stop, and removed all remote temporary files.
- Real S3-provider interoperability and disposable-VPS create/retry/restore validation remain deferred because no provider credentials or target host were supplied. Multipart/resumable transfer, WP-CLI artifact verification, and restore expansion limits remain out of scope.

## 2026-08-01 - Live-verification tour and shipped fixes
- Completed the live-verification tour for the panel HTTP surface; the live server confirmed the shipped behavior beyond offline tests.
- Fixed L13 FlyingPress purge to use `purge-everything`, fixed L12 cache purge reporting to preserve per-layer status and a `partial` outcome, and fixed L8 so rendered Traefik static configuration reaches the running proxy and triggers the required force-recreate.
- Fixed L7 failed-login throttling to resolve the real client through the trusted edge, fixed L9 token handling with `--token-file` and `WPFY_PANEL_TOKEN` while warning on `--token`, and fixed L11 so disabling Redis does not leave an orphaned container.
- Resolved L6 as a non-defect because cron timers were never installed, and kept L5 retracted because per-site cron is positively proven to run inside the site's own container.

## 2026-08-05 - F2 Traefik trust sources

- Replaced shared-network real-IP trust with inspected Traefik `/32` and `/128` addresses; proxied-site Cloudflare ranges now feed both real-IP and forwarded-scheme source sets.
- Edge startup refreshes trust snippets for all managed sites and reloads only changed running nginx services. A refresh failure returns non-zero for retry.

## 2026-08-02 - WP Rocket page cache served from nginx
- Implemented the directed rocket-nginx integration: `page_cache=wp-rocket` now renders an adapted Rocket-Nginx 3.1.2 block (MIT) into `nginx/extra/wpfy-cache.conf`, so an anonymous hit is answered from WP Rocket's cache file with no PHP, WordPress or MySQL in the request path. wpfy's server-side configuration for this option was previously inert — it emitted `fastcgi_cache_bypass` directives that mean nothing without a FastCGI cache zone.
- Kept `$wpfy_skip_cache` as the sole authority on cache eligibility rather than carrying upstream's own cookie and method conditions, so the two halves cannot drift apart across an upstream release. Dropped the pre-gzipped `.html_gzip` path so Content-Encoding is never set by hand, and dropped upstream's browser CSS/JS/media expiration blocks, which would have been matched ahead of wpfy's own security locations.
- Fixed an inheritance hazard the change exposed: nginx drops every inherited `add_header` from a location that sets one, so the cached-page location would have served HTML without the site's security headers. The header set now has one definition in `site_layout.py` that both the vhost and the cache snippet read.
- Added a `rocket` purge layer that deletes the cached files whether or not `wp rocket clean` succeeded, because nginx answers from those files without consulting PHP.
- Verified against real nginx 1.27 in a container rather than only offline: `nginx -t` accepts the generated vhost, an anonymous GET returns 200 `X-Wpfy-Cache: HIT` with the cached body and the full security header set, and logged-in, comment-author, password-protected-post, POST, query-string and uncached-path requests all return `MISS` and fall through to PHP. Recorded as ADR 0029.
- Amended two frozen L3 gate cases rather than working around them, at the user's decision after escalation. `test_byo_plugins_emit_no_status_header` rested on a premise that no longer describes `wp-rocket`; `test_snippet_opens_no_location_block` rested on a premise that still holds, but with a remedy broader than its concern. Both were narrowed to the options they still fit and replaced with gates enforcing what they stood in for. Mutation testing caught the amendment being insufficient: deleting one line — the bypass guard — left every case green while making all six bypass conditions decorative, so a gate tracing the rewrite's guard back to `$wpfy_skip_cache` was added. Gates now 256, suite 1369, 13 manifest checksums with 0 mismatches.
