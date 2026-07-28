# Changelog

## Unreleased

### Phase 6 Native Path-Jailed File Manager (2026-07-27)
- Added native per-site file operations restricted to `app/`, with traversal rejection, `lstat` symlink-component refusal, retained directory descriptors, no-follow descriptor-relative operations, atomic writes/uploads, site-UID ownership, safe chmod modes, and typed non-empty-directory deletion.
- Added panel browse/edit/upload/download/mkdir/rename/chmod/delete routes, pre-read upload limits, size-coherent editor JSON limits, and forced sanitized octet-stream attachment downloads.
- Added the Files tab with breadcrumbs, drag-and-drop upload, textarea editing, `wp-config.php` caution, permissions/rename controls, and exact-name destructive confirmation; added thin `wpfy site files ...` scripting commands and ADR 0019.

### Phase 5b Dashboard, Events, And Services Panel (2026-07-27)
- Added host and per-site canvas graphs over the accepted metrics range vocabulary, labelled axes, accessible tabular data, and an actionable empty state.
- Added Events domain/action filters with visible job IDs and a Services view covering Traefik plus site-derived container services.
- Added exact allowlist validation before per-site Compose restart arguments and a separate destructive Traefik restart requiring typed `wpfy-traefik` confirmation.

### Phase 5a Metrics sampler (2026-07-27)
- Added a WAL-mode stdlib SQLite time-series store, indexed scope/range reads, 14-day retention, host sampling, and exact managed-domain Docker stats attribution.
- Added `wpfy metrics sample|show|prune`, minute-tick sampling, daily pruning, and contained/logged metrics failures.
- Fixed daily health reporting to use shared `HealthResult` readiness semantics, and added ADR 0018 plus the metrics command specification.

### Phase 4b Security And Cron Panel (2026-07-27)
- Added authenticated panel API routes and browser tabs for per-site security controls and scheduled jobs.
- Made security previews write-free, required explicit acknowledgement before an unproxied Cloudflare-only change, and surfaced generated basic-auth passwords once.
- Added site-derived cron service choices, enable/disable/delete/run controls, last-run summaries, and distinct skipped/failed/timeout outcomes.
- Made real warning badges coral and high-contrast while routine PLAN badges remain neutral.

### Phase 4a.5 Per-site Cron Runner Correction (2026-07-27)
- Enforced per-site job timeouts inside the selected container with a longer host-side Compose client backstop, preventing timed-out jobs from surviving after their lock is released.
- Removed the profile-only `wpcli` service from cron targets; WP-CLI work runs through the long-running `app` service with the same image and WordPress working directory.
- Replaced job-output text matching with an authoritative Compose running-service probe after failed execution.

### Phase 4a.2 Per-site security lockout controls (2026-07-27)
- Added per-site basic auth with one-time generated passwords, redacted events, an out-of-document-root `nginx/htpasswd` hash, and in-place rotation for the individually mounted credential file.
- Added Traefik edge Cloudflare-only allow lists sourced from effective Cloudflare ranges, plus DNS lockout preflight warnings and CLI `--force` handling.
- Replaced hostname real-IP trust with the discovered wpfy edge CIDR and added Cloudflare hop trust for proxied sites; discovery failures return non-zero after installing fail-closed rules.
- Verified 33 Phase 4 security gates, real-image `nginx -t`, Compose config validation, and live old-password rejection/new-password acceptance after rotation. Cron gates remain on their separate branch.

### Phase 3a Native Cache Integration (2026-07-24)
- Added orthogonal `page_cache` and `object_cache` persistence with automatic migration from legacy cache flavors.
- Added native free-plugin installation, paid/BYO staging, wpfy FastCGI cache rules, Redis Object Cache wiring, layered purge, and the `wpfy cache` CLI surface.
- Fixed wpfc startup by creating a site-uid-owned `cache-data/` bind mount at `/var/cache/nginx/fastcgi`; the directory remains outside the backup archive.
- Fixed generated single-file bind mounts so updates preserve the host inode seen by running containers; Nginx reload failures now return non-zero, and site status/diagnostics run `nginx -t` to expose rejected generated configuration.
- Added ADRs 0014/0015 and the cache command specification. Panel integration remains Phase 3b.

### Phase 2b Panel Parity (2026-07-24)
- Added Databases, PHP Settings, and Vhost tabs to the browser panel with responsive table wrappers, typed exact-name destructive confirmations, asynchronous one-time database credential delivery, Adminer loopback/tunnel guidance, PHP dry-run previews, and verbatim Nginx validation output.
- Corrected panel HTTP status mapping for operational refusals: invalid input is 400, missing sites are 404, unavailable runtime validation is 503, and rejected Nginx content is 422 while preserving response bodies.
- The generated `nginx/default.conf` content remains unavailable to the current panel API; the Vhost tab identifies its server path and ownership rather than widening the API in this UI-only phase.

### RC2 Release Closure (2026-07-19)
- Prepared `v1.0.0-rc2` with matching package/CLI identity `1.0.0rc2`.
- Local gates passed: 552 pytest cases, installer/export contracts, package
  membership inspection, and security audit. Disposable-VPS and provider proof
  remain deferred and block final `v1.0.0`.

### Phase F Bounded Runtime Performance (2026-07-19)
- Cached parsed Cloudflare networks by effective default or environment-override CIDR set; invalid ranges remain ignored and override changes remain visible in-process.
- Stopped ordered public-IP fallback probing after the first valid IPv4 while preserving malformed/error fallback, prior IPv6 observations, and deterministic test overrides.
- Batched discovered container IDs into one `docker inspect` for site health and one inspect per service-wait poll; empty and failed batches retain `unknown` health semantics.
- Skipped registry mutation when scaffold metadata is exactly unchanged, preserving registry bytes, mtime, `created_at`, and maintenance state.
- Verified 552 pytest cases, 175 focused cases, 59 pinned flake8 findings, hardening checks, package builds, docs QA/build, import smoke, and offline CLI QA. Disposable-VPS timing remains deferred.

### Phase E Consolidated Configuration And Operational Primitives (2026-07-18)
- Routed stored SMTP, Cloudflare DNS, and S3 config through descriptor-relative no-follow env reads with domain-shaped failures.
- Centralized exact-value redaction for SMTP, DNS, S3, and WordPress errors, including empty, duplicate, repeated, and overlapping values.
- Centralized mechanical systemd root, quoting, execution, install, disable, and owned-file cleanup behavior while retaining cron/backup policy and unit contents.
- Reused one CLI-local required-secret input path, canonical project naming, and named healthcheck defaults without changing public syntax or values.
- Verified 542 pytest cases outside sandbox, focused safety/failure suites, hardening scripts, package builds, and 59 pinned flake8 findings. Live disposable-VPS systemd QA remains deferred.

### Phase D Thin CLI And Deep Operations (2026-07-18)
- Added `stack.py` as shared-stack operation owner and `cache_operations.py` as cache selection/execution owner; CLI handlers now render structured results instead of constructing Docker commands.
- Added public site-runtime operations for captured/followed logs, ordered log reset, captured/interactive WP-CLI, HTTP probing, and service readiness; CLI and panel now share those runtime paths.
- Made `stack purge` require `--force`, block teardown after stop failure/skip, and propagate Compose teardown failure without false success output.
- Made requested cache-operation failures return non-zero while retaining successful and skipped per-site messages.
- Added focused stack, cache, runtime, CLI/panel delegation, and static-boundary tests without new runtime dependencies.

### Phase C Bounded Transfers And WordPress Integrity (2026-07-17)
- Repaired file-backed SigV4 requests so `Content-Length` appears in both the canonical header block and declared `SignedHeaders`, with independent reconstruction coverage for empty/non-empty files and both site/edge consumers.
- Repaired WordPress bootstrap so pre-existing destination file/directory symlinks, including nested components, fail closed without changing external targets; partial retries also fail while the site runtime is active.
- Added real-validator CLI remote-restore coverage for valid, malformed, truncated, interrupted, and unexpected-failure paths; truncated gzip `EOFError` now returns a clean validation failure before runtime stop.
- Excluded `db-data/` payloads from restore validation and descriptor-safe replacement so live MariaDB volume contents remain untouched; post-stop replacement errors now return a controlled failure without restarting a partial site.
- Moved scaffold healthcheck writes behind the same no-follow boundary as WordPress bootstrap and reject non-directory archive roots before runtime stop.
- Rejected symlinks across scaffold-managed paths before secret reads or file writes, propagated scaffold ownership failures to update/SSL runtime gates, blocked active WordPress retries before healthcheck mutation, and rejected special archive members.
- Moved shared managed-site `.env` reads plus compose, environment, and Nginx scaffold writes to descriptor-relative no-follow operations, including deterministic post-validation symlink coverage.
- Made site and edge S3-compatible archive uploads file-backed, fixed-length, and fully payload-signed while retaining the byte path for storage tests.
- Streamed remote restore objects into private temporary files with bounded reads, advertised-length checking, cleanup on every exit path, and validation before live mutation.
- Resolved the latest stable en_US WordPress release, verified its versioned tarball against the published SHA-1 before extraction, and failed closed on missing, malformed, or mismatched metadata.
- Kept multipart/resumable upload and WP-CLI artifact verification as explicit residual work; SHA-1 is documented as integrity checking, not signature verification.

### Phase B CLI Correctness And State Reconciliation (2026-07-17)
- Moved Nginx/PHP/MySQL service facts and probes behind the operational-inspection boundary; Nginx now renders the complete authoritative web service and mounted config.
- Made service flags mutually exclusive, with stopped/unavailable/not-applicable states informational and attempted query failures non-zero.
- Rebuilt registry reconciliation from canonical `SiteDefinition` state, scoped scans to the supplied root, preserved creation/maintenance metadata, and avoided no-op writes.
- Made `site list` repair drift before rendering and removed the previously ignored `--enabled`/`--disabled` flags.
- Made update mismatches neutral, update actions mutually exclusive, runtime/certificate annotations truthful, and unknown site handlers fail immediately.

### Phase A Safety Blockers (2026-07-17)
- Made local backup publication transactional: failed/empty dumps and corrupt archives are non-zero, SQL staging is always removed, and strict database completeness is available to destructive callers.
- Made site deletion require strict backup success and a confirmed non-skipped runtime stop; `--force` now bypasses confirmation only.
- Gated maintenance registry updates, ACME renewal mutation/reload, and WordPress create lifecycle steps on confirmed prerequisites.
- Added focused failure-injection coverage for backup/delete, maintenance, ACME renewal, and bootstrap lifecycle behavior.

### Runtime Performance And Module Ownership (2026-07-11)
- Reduced `site_health()` to one container-ID lookup per required service and skipped DB/Redis probes for flavors that do not use them.
- Cached Docker Compose availability for each short-lived CLI process and batched the five `wpfy secure` container inspections into one Docker call.
- Streamed WordPress downloads and MariaDB dump/restore data through files, avoiding archive/database-sized Python buffers; failed dumps remain unpublished and unarchived.
- Split stable path/env helpers and runtime/health adapters into `site_paths.py` and `site_runtime.py`, leaving scaffold generation and persisted layout in `site_layout.py`.

### Public Docs Site Production Pass (2026-07-09)
- Restyled the VitePress knowledge base from the old MotherDuck treatment to the active Cohere-inspired design system.
- Reworked the public docs information architecture around flat commands first, with grouped site/stack commands documented as retained surfaces.
- Added public command articles for flat site, backup, restore, runtime, cron, SMTP, DNS, healthcheck, MOTD, utility, log, SFTP, and retained grouped commands.
- Added public runbooks for fresh install, WordPress site creation, SSL, wildcard SSL, restore, backups, disposable-VPS validation, and debugging.
- Added release/reference pages for site isolation, ADR index, release matrix, and `v1.0.0-rc1`.
- Added `npm run docs:qa` for internal link scanning and forbidden private-string scanning.
- Added the design/SEO audit follow-up: product context, sitemap/robots metadata, visible interaction states, reduced-motion handling, and a completed home feature grid.

### CLI VM Release Page 9 Grouped Retention (2026-07-09)
- Retained grouped `wpfy site ...` and `wpfy stack ...` commands for this release instead of removing parser surfaces.
- Classified `wpfy stack install|remove|purge|migrate|upgrade|status` as the canonical grouped stack namespace.
- Kept grouped site-only operations (`site ssl`, `site list`, `site info`, `site show`, `site status`) and duplicate grouped site commands for compatibility, while documenting flat `run`, `backup`, `restore`, `wp`, `rm`, and `config` as primary where exact equivalents exist.

### Demyx Feature Parity Build (2026-07-08)
- Added local backup retention/prune, explicit `restore --latest`, named S3-compatible storage profiles, remote backup list/restore/delete/prune, and Traefik/ACME edge backup/restore.
- Added Cloudflare-only wildcard SSL via DNS challenge plus `wpfy dns cloudflare set|status|test|clear` with token redaction.
- Added opt-in helper image pulls for phpMyAdmin, Adminer, and Composer. `--mysqltuner` now skips with a precise pinned-image reason.
- Kept OpenLiteSpeed/Bedrock, panel/API/UI, automatic SMTP notifications, and host-stack migration out of scope.

### CLI VM Release Page 8 Validation Surface (2026-07-03)
- Added split command docs for flat runtime commands, safe config commands, operator health/utility commands, and backup storage/schedule.
- Updated the disposable-VPS validation runner to exercise flat commands where they exist: `run`, `wp`, `config`, `refresh`, `compose`, `up`, `down`, `exec`, `cp`, `pull`, `backup`, `restore`, `rm`, `healthcheck`, `motd`, `utility`, `cron`, `smtp`, and `log cron`.
- Tightened validation evidence semantics after the 20260703T102801Z-page8 near-pass: unexpected non-zero command exits now write `validation-failures.txt`, SMTP clear is forced for non-interactive ops validation, restored WordPress readiness is polled before restore/pre-reboot evidence, and skipped optional scanners are labelled explicitly.
- Kept grouped `stack install|status` in VM validation because stack remains a retained grouped namespace.
- Superseded by Page 9: grouped stack/status/SSL/list/show surfaces are retained for this release instead of removed.

### Cron And SMTP Operator Surface (2026-07-03)
- Added `wpfy cron minute|five-minute|hourly|six-hour|daily|weekly` manual interval runners. Each interval runs due WordPress cron events for managed WordPress sites in sorted order through the existing WP-CLI container path.
- Added `wpfy cron install|status|disable`, backed by one systemd service/timer pair per interval and the existing `WPFY_SYSTEMD_DIR` test hook.
- Added safe custom hooks at `/etc/wpfy/custom/cron/<interval>.sh`; hooks run only when regular, executable, and not world-writable.
- Added `/var/log/wpfy/cron.log` output and `wpfy log cron [--lines N]`.
- Added `wpfy smtp set|status|test|clear` with `/etc/wpfy/smtp.env` mode `0600`, redacted status output, dry-run validation, and explicit `--to` test sends through stdlib SMTP only.
- Backups remain independent on `wpfy backup all` and `wpfy backup schedule`; cron intervals do not execute backups or forced updates.

### Backup Storage And Schedule CLI (2026-07-03)
- Added permanent S3-compatible backup storage config under `/etc/wpfy/backup-storage.env` with `0600` permissions, plus `wpfy backup storage set|status|test|clear`.
- Environment `WPFY_BACKUP_S3_*` values continue to override stored backup storage config.
- Added `wpfy backup schedule daily|weekly|status|disable`, backed by one systemd timer running `wpfy backup all`.
- Secret keys are accepted through stdin or TTY prompt only; status/test output redacts access and secret key values.
- Superseded on 2026-07-08: remote restore/list/delete, retention/rotation, restore-latest, named storage profiles, and Traefik/ACME backup are now implemented; provider bucket lifecycle API automation remains deferred.

### CLI VM Backup Restore Ergonomics (2026-07-03)
- Added Page 6 backup/restore ergonomics: `wpfy backup <domain> --list`, `wpfy restore <domain> --list`, `wpfy backup <domain> --path <directory>`, upload-only `wpfy backup <domain> --s3`, and `wpfy backup all`.
- Backup listing and restore listing read local archive filenames only; restore remains explicit and still requires a backup path unless `--list` is used.
- S3-compatible upload uses environment configuration, uploads only after local archive verification, keeps the local archive on upload failure, and redacts configured access/secret key values from output.
- Superseded on 2026-07-08: retention/rotation, restore-latest, remote restore/list/delete, and Traefik/ACME backup are now implemented; provider bucket lifecycle API automation remains deferred.

### CLI VM Operator Commands (2026-07-03)
- Added canonical flat operator commands: `wpfy healthcheck`, `motd`, and `utility`.
- `wpfy healthcheck` covers disk, load, system diagnostics, single-site health, all-site summaries, and an `all` default while treating `WPFY_SKIP_RUNTIME=1` as a warning rather than a failure by itself.
- `wpfy motd` prints a safe login-style summary with version, Docker, Traefik, managed site count, site summaries, and warning count without dumping `.env` values or secrets.
- `wpfy utility` generates offline passwords, tokens, normalized usernames, deterministic site UID/project guidance, and stdlib `{SHA}` htpasswd lines without Docker, site mutation, or new dependencies.

### CLI VM Safe Config Commands (2026-07-03)
- Added canonical flat safe config commands: `wpfy config`, `edit`, and `refresh`.
- `wpfy config` prints sanitized status only and routes controlled mutations through `UpdateSiteRequest`/`update_site`; password updates use a prompt or `--password-stdin`, not a raw CLI argument value.
- `wpfy edit` prints only the authoritative `.env` path with `--print-path`; editor mode requires a TTY/editor, creates a timestamped backup, and refreshes scaffold files after a successful edit.
- `wpfy refresh` regenerates scaffold files from authoritative `.env` state, preserves unmanaged env keys, supports `refresh all` in sorted order, and restarts runtime only with `--restart`.

### CLI VM Runtime Commands (2026-07-03)
- Added canonical flat runtime commands: `wpfy compose`, `up`, `down`, `exec`, `cp`, and `pull`.
- Runtime commands validate domain and site existence before invoking Docker Compose helpers.
- `wpfy down` keeps volumes by default and removes volumes only with `--volumes`; grouped `site`/`stack` parsers remain compatibility surfaces until the deferred cleanup page.

### CLI Direction Decision (2026-07-03)
- Recorded flat CLI as the canonical VM/operator target surface.
- Reclassified grouped `wpfy site ...` and `wpfy stack ...` commands as compatibility surfaces during migration. Superseded by Page 9 retention for this release.

### CLI VM Release Aliases (2026-07-03)
- Added flat shortcuts for existing grouped site behavior: `wpfy run`, `backup`, `restore`, `rm`, and `wp`.
- Added `wpfy version` as a script-friendly equivalent to `wpfy --version`.
- Page 2 remains valid as the first flat-alias migration step; runtime operator commands and backup/restore ergonomics remain planned for later pages.

### CLI VM Release Planning (2026-07-03)
- Added the Page 1 CLI VM release matrix mapping every planned command label against the current grouped CLI baseline before flat aliases and operator commands are implemented.
- Captured the current top-level, site, stack, and log help output plus parser/test baseline evidence for the CLI VM release plan.

### Internal Cleanup (2026-07-02)
- Consolidated wpfy flavor ownership in the application code and removed stale compatibility/test-helper surfaces without changing runtime behavior.

### Repository Split (2026-06-30)
- Split application code, website source, and documentation/knowledge-base source into separate local repositories: `wpfy-pvt`, `wpfy-website`, and `wpfy-docs`.
- Imported the historical `docs/` tree, VitePress `kb/` tree, and KB package metadata into the docs repository.
- Cleaned the application repository index by removing generated/local tool-state artifacts that were already covered by `.gitignore`.

### Documentation: Website Preview URL Convention (2026-06-23)
- Documented `http://127.0.0.1:8766/` as the standard local preview URL for the static `website/` directory, including the canonical `python3 -m http.server 8766 --bind 127.0.0.1 -d website` command.

### Website: Static Ecosystem Legend, Icon Pass, Click-to-Copy Command Chips (2026-06-13)
- Ecosystem section simplified to match the static MotherDuck reference: removed the click-to-explore detail panel (the default "Shared edge / Traefik" tab) and its `ECO` explorer script; the component chips are now static labelled legend items. The hub diagram and colored pipes carry the architecture; hovering a box still highlights its pipe.
- Icon pass (senior UI/UX): the five weak text glyphs in the diagram (`>_`, `wp`, and three identical `$`) are now distinct inline line icons (SFTP transfer arrows, WP-CLI terminal, backup archive, restore rotate, diagnostics activity-pulse); each of the eight feature cards gained a matching line icon beside its tag; and the three identical "Who is it for?" stars became a building / person / server trio.
- Feature-card command chips are now click-to-copy buttons: a copy glyph (appended by `main.js`) flips to a teal check on success with a ~1.5s confirmation and `scale(0.97)` press feedback; `aria-label` announces the command and the icon swaps in place (no layout shift). Falls back to a plain labelled chip without JS.
- Removed the doubled border between the blue problem band and the blue ecosystem sky strip: `.section-sky:has(+ .eco-section)` drops the redundant bottom rule so the two same-color bands read as one continuous band resolving on the sky strip's single border.
- Made the copy result available to assistive tech: the chip's accessible name announces `Copied: <command>` / `Copy failed` alongside the visual state, then restores after ~1.5s; the failure path also clears any stale `.copied` visual state from a prior success.
- Bumped asset cache-busters (`main.js?v=6`).

### Website: Alternating Sky Sections, Ecosystem Pipes, Forum/Docs CTAs, Subscribe Ribbon (2026-06-12)
- Ecosystem diagram now draws MotherDuck-style colored pipes: one rounded orthogonal SVG path per category box, in that box's accent color, routed behind the boxes into the central wpfy node (drawn by `main.js` from measured layout, redrawn on resize, hidden on the stacked <=1024px layout). Replaces the dashed stubs and center spine. Hovering a box lifts it (radius 14px + shadow) and brightens its pipe.
- Section backgrounds now alternate cream / `--blue-deep` down the page (problem, features, who, and the new subscribe band are sky-blue; `--ink-soft` is bumped to ink inside blue sections for AA contrast), with cloud/padlock/brand-icon doodles straddling each blue section's top border like the ecosystem sky clouds.
- Removed the "Honest about where we are" security section; the use-cases "Security model" button and the footer Security link now point at `docs/SECURITY.md` on GitHub.
- Added community links: nav and footer link Forum (https://forum.wpfy.org) and Docs (https://docs.wpfy.org); the CTA band gained a "Join the forum" button.
- Added a "Stay in the loop" subscribe ribbon above the footer (placeholder form, no backend wired yet; `main.js` swaps in a local aria-live confirmation).

### Website: MotherDuck-style Ecosystem Diagram, Who/Use-Cases Sections, Ambient Doodles (2026-06-12)
- Rebuilt the stack section as a hub-and-spoke ecosystem diagram (modeled on MotherDuck's "Modern Duck Stack"): sky-blue band with clouds straddling the edge, grid-paper backdrop, six pastel category boxes (shared edge / site runtime / data & cache / host / access / safety nets) with colored brand logos, dashed pipes into a central wpfy terminal node, and a detail panel below; every component chip is clickable (15 entries incl. WP-CLI, Backups, Restore, Diagnostics). This replaces both the blue "How we isolate" band and the previous explorer board.
- Added "Who is it for?" (agencies & studios / freelance developers / self-hosters) and a two-row "Use cases" section (client fleets, migrate & recover) with real command listings.
- Added ambient drifting doodles site-wide (clouds, padlocks, Docker/WordPress/Let's Encrypt marks at low opacity) using scroll-driven `animation-timeline: view()` where supported with a float-loop fallback, plus clouds straddling the CTA band border; all disabled under reduced motion and hidden on small screens.
- Asset URLs now carry a `?v=` cache-busting query.
### Website: Stack Explorer Section & Hero Terminal Fix (2026-06-12)
- Added "The modern WordPress stack" ecosystem section to `website/index.html` (MotherDuck-style interactive stack explorer): three layers (shared edge / one isolated stack per site / host) with clickable component tiles (Traefik, Let's Encrypt, WordPress, Nginx, PHP-FPM, MariaDB, optional Redis, SFTP, Ubuntu, Docker Engine, Docker Compose) and a detail panel describing each component's role plus the wpfy command that touches it. Tile logos come from the Simple Icons CDN; tiles are buttons with `aria-pressed`, the panel is `aria-live`, and on stacked mobile layouts the panel scrolls into view after selection.
- Fixed the hero terminal layout shift: `.term-body` now reserves a fixed height sized to the tallest animated scene (`--term-lines: 7`, em-based so it scales with the responsive font size), so the typing loop no longer pushes the sections below it down and back on every cycle (previously `min-height: 216px` desktop / `0` mobile let the box grow and snap).
- Removed the second (teal command) marquee; its commands already appear as chips on the feature cards, and one marquee band per page keeps the rhythm.
- Added a "Stack" nav link and `scroll-margin-top` on sections so anchor jumps land below the sticky header.

### Test Hermeticity Fix (2026-06-11)
- Fixed `tests/test_sftp.py::test_ensure_sftp_container_waits_for_port_when_restarting`, which failed when `test_sftp.py` ran in isolation: it monkeypatched `site_exists`/`compose_path`/`env_path` onto `tmp_path` but let `ensure_sftp_container` call the real `ensure_site_scaffold`, which wrote to the real `PATHS` (`/opt/wpfy`) unless a prior test's `tmp_wpfy_home` reload had redirected them. The test now also monkeypatches `wpfy.sftp.ensure_site_scaffold`, so it is hermetic and no longer touches host paths.
### Security & Correctness Remediation Pass (2026-06-11)
- Generated Nginx now sets `client_max_body_size 64m` and `fastcgi_read_timeout 300s` to match the PHP images (uploads over 1 MB previously failed with 413; long admin operations could 504), makes the PHP handler case-insensitive with a `try_files $uri =404` guard, and emits HSTS only when SSL is enabled.
- `site update --password` now sends the WordPress password over stdin (`--prompt=user_pass`) instead of process argv, targets the site's actual administrator login (resolved via wp-cli, falling back to `admin`), and redacts the password from failure output.
- `sftp --enable --password` now actually rotates an existing password (explicit value wins over the stored one); a newly auto-generated SFTP password is printed exactly once in the enable summary, mirroring the generated WordPress admin password behaviour.
- WordPress core tarball extraction during bootstrap uses the stdlib `data` tar filter (with a member-validation fallback on older Pythons), closing the unfiltered `extractall` gap.
- `site create`/`update` now refuse two domains that fold to the same Compose project name (e.g. `a-b.example.com` vs `a.b.example.com`), which previously collided on containers, networks, and Traefik routers.
- Regenerating a site's `.env` preserves operator-added keys (e.g. `WP_DEBUG`, API keys); spec-owned keys remain fully managed and are still dropped when disabled.
- Enabling SSL is gated on a valid ACME contact email: the effective email (scaffolded `traefik.yml`, else `WPFY_ACME_EMAIL`) must be a real address, since Let's Encrypt rejects the previous `admin@localhost` default at registration.
- `stack install` now pulls the same Redis/MariaDB image tags the generated compose runs (`redis:7.2-alpine` was previously generated while `redis:7-alpine` was pulled); tags live in single constants in `site_layout.py`.
- `site_exists` validates the domain before touching the filesystem, so every existence-gated command rejects traversal-shaped input.
- `stop_site_runtime` no longer removes volumes by default; only `site delete` passes `remove_volumes=True`.
- `site restore` onto a site with an initialized DB volume keeps the live DB credentials instead of restoring the archive's stale ones (backups carry the SQL dump but not `db-data/`, so the old credentials no longer matched the volume).

### CI Publish Fixes (2026-06-08)
- Fixed the `Publish public mirror` workflow, which failed with `fatal: empty ident name` on the first export that carried a real diff: git identity is now set with `git config --global` so it applies to the freshly cloned export worktree where `export-public.sh` commits.
- Restricted PHP image publishing to the public mirror only (`github.repository == 'wpfyorg/wpfy'`): the private repo now builds the images as a validation gate but no longer logs in or pushes, fixing `denied: permission_denied: write_package` and the private `image.source` label. See ADR 0011.

### PHP Image Build Resilience (2026-06-08)
- Wrapped `pecl install redis imagick` in the PHP-FPM Dockerfiles (7.4–8.4) with a 5-attempt retry loop that clears the poisoned `/tmp/pear` cache between tries.
- Fixes the `Publish PHP Images` workflow, which failed across all PHP versions when imagick 3.8.x's build-time download of the nikic/PHP-Parser tarball hit a transient `504 Gateway Time-out` and left a corrupt archive (`gzip: invalid magic` → `Failed to extract PHP-Parser tarball`).

### Architecture Review Completion (2026-06-07)
- Added an authoritative `SiteDefinition` for Compose, `.env`, and registry metadata, including optional per-site SFTP state.
- Removed SFTP YAML text surgery and independent env/registry mutation; SFTP now regenerates persisted state through the site definition interface.
- Added `certificate_lifecycle.py` as the single owner of SSL preflight, ACME state, domain matching, certificate metadata/expiry, and renewal; `ssl_flow.py` remains a compatibility import.
- Removed certificate-state ownership from `traefik.py`, which now focuses on proxy scaffold and runtime lifecycle.
- Added `operational_inspection.py` to collect structured aggregate, diagnostic, and security facts for `info`, `debug`, and `secure`; CLI handlers retain rendering and exit policy.

### PHP Image Publishing Credentials (2026-06-09)
- Reverted the public PHP image workflow GHCR login to the built-in `GITHUB_TOKEN` (`github.actor`). The `PUBLICPUSH` PAT was rejected at login (`denied: denied` — expired/insufficient scope); the original `write_package` denial was the `wpfyorg/php-fpm` package not granting the `wpfy` repo Write access, fixed by the package's "Manage Actions access" setting rather than a PAT. See ADR 0011.
- Bumped the Docker actions in `php-images.yml` to their Node 24 majors (`setup-qemu-action@v4`, `setup-buildx-action@v4`, `login-action@v4`, `build-push-action@v7`), clearing the Node.js 20 deprecation warnings ahead of the 2026-06-16 forced cutover.

### Public Repository History Reset (2026-06-07)
- Tightened the public export to code, packaging, installer, runtime images, workflow, and public-safe tests only.
- Removed internal audit reports, validation tooling, private documentation, and changelog history from the public export surface.
- Added a fresh-history export mode plus guards for internal paths and known infrastructure identifiers.

### Installer Identity And Host Summary (2026-06-07)
- The root installer now opens with a compact `WPFY` logo and an 80-column host summary covering the build, OS, hostname, virtualization, disk, memory, swap, CPU, and IP addresses.
- Host detection is informational and falls back cleanly when an FQDN, route, or platform probe is unavailable.
- Replaced verbose phase transcripts with one honest 16-step progress bar across `install.sh` and the bundled installer; interactive output is color-coded while pipes and CI receive stable plain status lines.
- Full apt, Docker, curl, rsync, and pip output now stays in the install log by default. `--verbose` mirrors it to the terminal, while `--no-color`, `WPFY_NO_COLOR=1`, and `NO_COLOR` disable ANSI output.
- Successful installs end with versions, elapsed time, log path, and the next command. Failures show the failed step, exit status, safe command name, log path, and the last 15 step lines.

### Human-Friendly CLI And Installer UX (2026-06-06)
- Reworked the CLI help and command summaries so `wpfy` reads as a human-first tool: top-level and subcommand help now include descriptions/examples, and the main site/stack/status flows present sectioned summaries instead of flat semicolon chains.
- `site create`, `site update`, `site ssl`, `site status`, `site list`, `site info`, `site delete`, `stack install/status/upgrade/remove/purge`, `log reset`, `clean`, `maintenance`, and `update` now use clearer headings and status labels in their user-facing summaries.
- `stack install` now reports each selected component before its potentially slow pull/start operation on interactive terminals, while keeping non-interactive output unchanged.
- The root installer and `install.sh` now emit phase banners for download, checksum, extraction, swap, Docker, source sync, venv setup, and smoke checks so long installs read like a guided process instead of a log dump.

### Adaptive Installer Swap (2026-06-05)
- Added an idempotent installer swap setup step before base package and Docker installation to keep small VPS hosts responsive during Docker/image-heavy setup and validation.
- The installer now skips when active swap already exists, skips when `/` has less than 8 GB free, creates 2 GB swap for 8-29 GB free, and creates 4 GB swap for 30 GB+ free.
- Added `WPFY_SWAP=0`, `WPFY_SWAP_SIZE_MB`, and `WPFY_SWAP_FILE` installer controls, with dry-run logging and focused shell coverage in `tests/installer-swap.sh`.

### Pull-only PHP images and PHP 8.4 default (2026-06-05)
- Changed `stack install` to **only pull** prebuilt `ghcr.io/wpfyorg/php-fpm:<version>` images. It no longer builds bundled PHP Dockerfiles on customer VPS hosts, avoiding resource-heavy local builds on small servers.
- Added PHP 8.4 support and made 8.4 the default for new sites, `stack install --php`, `stack install --all`, and `stack install --wpcli`.
- Kept explicit version selection for compatibility and downgrade flows, and expanded it to `7.4`, `8.0`, `8.1`, `8.2`, and `8.3`.
- Added `docker/php-fpm/8.4/Dockerfile` and expanded the PHP image publishing workflow to publish the supported runtime set to GHCR.
- Updated VPS validation defaults to install only the default PHP image first, while retaining an explicit 8.3 coverage path for downgrade/runtime-switch validation.
- Limited the supported matrix for now by dropping `7.2`, `7.3`, and `8.5` from the CLI and public image workflow.

### Non-root Operator Support (2026-06-05)
- Installed `/usr/local/bin/wpfy` wrapper now **self-elevates** via `sudo` when run by a non-root user, forwarding `WPFY_*`/`ACME_*` env across sudo's env reset, so a non-root login (e.g. the `ubuntu` cloud user) runs plain `wpfy …` with no typed `sudo`. Root logins exec the venv binary directly (unchanged). `WPFY_NO_SELF_ELEVATE=1` disables elevation. See ADR 0008.
- Fixed `handle_site_wp` (`wpfy site wp`) to **always** inject wp-cli `--allow-root` (the wpcli container runs as root). The previous `os.getuid()==0` gate dropped it for a non-root operator and broke the command.
- Validation harness retargeted for a non-root login: `scripts/vps-release-validation.sh` defaults to `ubuntu@203.0.113.80` / `m.wpfydev.top` and stages to `/home/<user>/wpfy-validation`; `scripts/vps-release-validation-remote.sh` runs unprivileged, invokes `wpfy` bare (exercising self-elevation), and sudo-prefixes only raw non-wpfy probes (raw `docker`/`ss`/`nft`/`iptables`, reads of root-owned files, `install.sh`, scanners over `/opt/wpfy/app`).
- Tightened live validation: missing ACME issuance now records `SSL_CERT_NOT_ISSUED` and makes `all` exit nonzero; HTTP/HTTPS probes use bounded curl timeouts so blocked inbound 443 does not stall phases for minutes.
- Improved `wpfy site create` terminal UX: provisioning now emits short progress updates to `stderr` on TTYs, and the final result is printed as a readable multi-line summary instead of a semicolon-chained sentence. Generated WordPress passwords are still shown once on successful fresh installs.

### VPS Beta Validation Pass (2026-06-04)
- Historical note: this pass temporarily fixed `stack install` by building php-fpm images from bundled Dockerfiles first. This has since been superseded by the 2026-06-05 pull-only behavior above.
- Fixed `bootstrap_site_files` to be flavor-aware: `--html` sites get a static HTML placeholder; `--php`/`site` sites get a PHP placeholder; only WordPress flavors download WordPress core from wordpress.org.
- Fixed `site_health` `bootstrap_ready` check to be flavor-aware (html checks `index.html`; WP flavors check `index.php + wp-config.php`).
- Fixed app container healthcheck to use `php -v` instead of `index.php` existence (flavor-independent; html sites never have `index.php`).
- Fixed `handle_site_wp` (user-facing `wpfy site wp`) to inject `--allow-root` automatically when running as root; wp-cli refuses root without it and wpfy is a root-level managed tool.
- Fixed `_parse_cert_data` in `ssl_flow.py` to detect PEM vs DER by header byte; Traefik stores base64-encoded PEM in `acme.json`, not DER — `load_der_x509_certificate` was silently returning empty cert info.
- Fixed validation harness: `run_and_capture` now always returns 0 and appends `[exit N]` annotations; added `run_must_succeed` for installer/stack phases; fixed `run_expected_failure` to capture exit code directly.
- Fixed `wpfy secure` in ops validation phase to use `--all` flag.
- Fixed SSL validation phase: waits up to 90s polling for ACME cert issuance before probing status.
- Fixed `stack status` image glob pattern (was `ghcr.io/wpfy/*`, now uses `PHP_IMAGE_REPOSITORY` prefix).
- All 13 validation phases passed: baseline, installer-dry-run, installer-full, stack, sites, ssl, http, ops, sftp, backup, delete, scanners, pre-reboot, post-reboot.
- Verified live HTTP hardening: uploads PHP execution, `.env`, `wp-config.php`, `xmlrpc.php`, dotfiles, backup extensions all return 404.
- Verified real ACME cert issued for `ssl.wpfydev.top`; cert info (issuer, dates, SANs) now correctly parsed.
- Verified reboot persistence: all 6 sites auto-restarted with `restart: unless-stopped`.
- Scanner results: gitleaks clean, trivy 0 critical/high (DS-0002 non-root USER accepted residual), nikto clean.

### Disposable VPS Validation Tooling
- Added `scripts/vps-release-validation.sh` to prepare a reproducible source archive, collect local build metadata and DNS evidence, stage artifacts to a disposable VPS, and print the exact remote runner command.
- Added `scripts/vps-release-validation-remote.sh` with numbered phases for baseline capture, installer dry-run/full install, stack bootstrap, site lifecycle, SSL, HTTP hardening checks, operations flows, SFTP, backup/restore, delete, scanners, and reboot checkpoints.
- Added `tests/vps-validation-runner.sh` and wired it into `scripts/security-audit.sh` to verify the bundle shape, archive exclusions, and remote-runner availability without mutating a VPS.
- Added a disposable-VPS validation runbook and updated memory/handoff docs to point future work at the new validation tooling rather than an implicit/manual workflow.
- Fixed the remote validation HTTP phase to test non-SSL sites over HTTP and reserve HTTPS probes for SSL-enabled sites.
- Added post-restore site status and Compose state capture after successful and rejected restore attempts.
- Fixed restore safety so rejected backup archives are validated before stopping the live site runtime.
- Added explicit non-SSL Traefik `web` entrypoint labels so HTTP routing does not rely on Traefik defaults.
- Made the WordPress hardening smoke test deterministic by forcing the fallback bootstrap path instead of contacting wordpress.org.

### WordPress Provisioning
- Added full WordPress provisioning for `site create` WordPress flavors after runtime startup.
- Added WordOps-style admin flags to `site create`: `--user`, `--email`, and `--pass`.
- Missing WordPress admin credentials now default to interactive prompts on TTYs, Git user/email fallbacks where available, and a generated password when no password is supplied.
- Generated WordPress admin passwords are printed once only for fresh installs and are not written to `.env`, registry, or logs.
- Provisioning waits for DB readiness, downloads core if needed, creates `wp-config.php` if missing, runs `wp db create`, and runs `wp core install` idempotently without rotating credentials on re-run.
- Added pytest coverage for admin flag parsing, non-interactive credential defaults, generated password output, idempotent installed-site behavior, WP-CLI command order, core download, and password redaction from errors.

### Installer Logging
- Added `/var/log/wpfy/install.log` logging to the root installer, with `WPFY_INSTALL_LOG` override support.
- Installer failures now report the failed line, command, and log path.
- `install.sh` now reports archive download/copy/extraction failures more clearly before handing off to the bundled installer.
- `install.sh` now supports optional source archive verification with `WPFY_SOURCE_SHA256`.
- The root installer now stages source updates before activating `/opt/wpfy/app` and restores the previous app tree if a later install step fails.

### Documentation Reconciliation
- Reconciled stale scaffold-era command docs and runbooks for site create, SSL, stack install, site delete, site list, site status, restore, fresh install, debug, and failed SSL recovery.
- Documented the accepted v1 residual Traefik Docker socket risk and remaining WordPress/WP-CLI supply-chain validation gap.

### Security Audit Artifacts
- Added `SECURITY_AUDIT_REPORT.md` with defensive security findings for generated Nginx, generated Compose, Traefik Docker socket exposure, installer integrity/rollback gaps, PHP image supply-chain risks, and skipped DAST work.
- Added `SECURITY_TEST_PLAN.md` with P0/P1/P2, manual, automated, and disposable-VPS-only security validation scenarios.
- Added safe audit scripts for local/static security checks, installer dry-run handoff, exposed-port checks, generated Nginx sensitive-path checks, Docker hardening checks, WordPress hardening checks, backup/restore smoke checks, and local-only web vulnerability smoke checks.
- Verified the new audit scripts locally; initial hardening failures were captured and then resolved in the security hardening pass below.

### Security Hardening
- Hardened generated Nginx configs to deny PHP execution under uploads, block `wp-config.php`, `xmlrpc.php`, WordPress metadata files, dotfiles except `.well-known`, Docker Compose files, backup/dump/log extensions, and disable directory listing.
- Added baseline browser security headers to generated Nginx configs.
- Added generated Compose hardening for site, Traefik, and SFTP services: `no-new-privileges`, `cap_drop: NET_RAW`, process/resource limits, and JSON log rotation.
- Expanded `wpfy secure` to report no-new-privileges, dropped `NET_RAW`, PID limits, memory limits, and log rotation for running containers.
- Added a Traefik ping endpoint and container healthcheck.
- Added pytest regression coverage for generated Nginx hardening, generated Compose hardening, Traefik hardening, and SFTP hardening.
- Re-ran `scripts/security-audit.sh`; it now passes with warnings only for missing external scanners, missing Docker runtime inspection, local web target absence, and residual Traefik Docker socket risk.

### Installer
- Added `install.sh` as the public one-line bootstrap entrypoint for `curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash`.
- `install.sh` downloads the GitHub source archive for `WPFY_REF` (default `main`) and runs the bundled root `wpfy` installer with `--skip-wpfy-install`, keeping public install validation independent of PyPI publication.
- Updated installer docs and README install UX to reflect the implemented public bootstrap flow.
- Changed the system installer to install `wpfy` inside `/opt/wpfy/venv` and expose a `/usr/local/bin/wpfy` wrapper, avoiding Ubuntu 24.04 PEP 668 system-pip failures.

### Release Validation Fixes
- Made ACME status reads tolerate hosts where Docker is unavailable instead of raising `FileNotFoundError`.
- Added an OpenSSL fallback for ACME certificate metadata so the installer venv can report issuer/validity without requiring the optional `cryptography` package.
- Changed `wpfy debug` SSL diagnostics to report issued certificates with unavailable expiry metadata as `certificate found; expiry unavailable` instead of `no certificate found`.
- Fixed the VPS validation runner's negative-command checks so they preserve the tested command's exit code through redaction.
- Updated Traefik from the unavailable `traefik:v3.3-alpine` tag to `traefik:v3.6.17` for Docker 29 compatibility.
- Made `stack install` return a non-zero exit code when required image pulls fail.
- Tightened per-site `.env` permissions to `0600` and backup archive permissions to `0600`.
- Changed restore to stop containers without deleting volumes, restart runtime after file restore, and wait for DB readiness before importing SQL dumps.
- Added a GitHub Actions workflow to build and publish `ghcr.io/wpfyorg/php-fpm:7.4`, `8.0`, `8.1`, `8.2`, `8.3`, and `8.4` from the public repo.
- Moved the Traefik `le` ACME certificate resolver into generated `traefik.yml` so routers can use it on Traefik v3.6.
- Made SSL status read `acme.json` from the running Traefik container when the storage is a Docker volume.
- Made `stack status` safe before Traefik has been scaffolded.
- Made ACME certificate lookup case-insensitive so mixed-case CLI input matches Traefik's lowercased certificate domains.
- Made missing-site delete return a clean `site not found` error instead of a traceback.
- Made SFTP enable wait for port `2222` readiness and removed password fields from SFTP status output.
- Hardened backup restore extraction to reject path traversal, absolute paths, links, device files, and archives rooted at a different domain before extracting.
- Changed SFTP to allocate per-site loopback-only host ports, store `SFTP_PORT` in `.env`, preserve `.env` `0600` after SFTP changes, and include SFTP in `wpfy secure` host-port audits.
- Updated security and isolation docs to reflect implemented hardening controls.

### Public Release Cleanup
- Added AGPL-3.0 licensing metadata and license text.
- Removed the legacy AGPL trove classifier so installs work with current setuptools license-expression validation.
- Removed bundled third-party reference docs from the public source tree.
- Reworded public docs and package metadata to describe `wpfy` directly as a Docker-first WordPress/server administration CLI.
- Added a one-way public export script that publishes only the approved release surface from the private repository to the public repository.
- Included the PHP image publishing workflow in the public export allowlist.

## v0.2.0 (2026-05-22)

### New Modules
- Added `traefik.py` (345 lines): Traefik v3 edge proxy lifecycle management. Scaffold generation, shared Docker network creation, start/stop/status/reload, ACME certificate status queries and force-renewal via acme.json manipulation. Docker label-based auto-discovery for per-site routing.
- Added `registry.py` (160 lines): JSON site registry at `/var/lib/wpfy/sites.json` with atomic writes (`os.replace()`). Registry class with add/update/remove/get/list/sync_from_filesystem API. Module-level convenience functions.

### Edge Proxy (Traefik)
- Resolved edge proxy decision: Traefik v3.3-alpine replaces undecided candidates (was Traefik/Caddy/nginx).
- Traefik runs as its own Compose project (`wpfy-traefik`) on a shared `wpfy` bridge network.
- Built-in ACME with TLS challenge. No external acme.sh or certbot dependency.
- `traefik.yml` static config with Docker provider, exposedByDefault=false, web (80) and websecure (443) entrypoints.
- `stack install --nginx` pulls and starts Traefik. `stack status` reports Traefik health. `stack upgrade` pulls and restarts. `stack remove`/`stack purge` manage lifecycle.
- ACME certificate status exposed via `check_acme_status()` and `force_renew_cert()`. CLI: `wpfy site ssl <domain> --renew` and `--status`.
- `wpfy debug` validates Traefik running state.

### State Store (JSON Registry)
- Resolved state store decision: JSON file at `/var/lib/wpfy/sites.json` (was undecided between file-only and SQLite).
- `sync_from_filesystem()` reconciles registry against on-disk scaffold files. Filesystem remains authoritative.
- Every site create/update/delete/ssl command updates the registry.
- `wpfy info` reports registry metadata alongside filesystem state.
- `wpfy debug` checks registry/filesystem consistency and reports orphaned/unregistered sites.
- Module-level singleton via `_get_registry()` for convenience.

### Per-Site PHP Versioning
- Resolved PHP versioning decision: Docker image tags `ghcr.io/wpfyorg/php-fpm:{7.4,8.0,8.1,8.2,8.3,8.4}`.
- `site create --php {7.4|8.0|8.1|8.2|8.3|8.4}` selects PHP version. Default 8.4.
- `site update --php {7.4|8.0|8.1|8.2|8.3|8.4}` regenerates compose.yaml with new image tag.
- `stack install --php {7.4|8.0|8.1|8.2|8.3|8.4}` pulls the image. `--wpcli` pulls the wp-cli-bundled default PHP image.
- `SiteSpec.php_version` field, stored in `.env` (`PHP_VERSION`) and registry (`php_version`).

### CLI Improvements
- `wpfy debug`: Full diagnostic report including Docker availability, Traefik health, disk usage, registry consistency, and per-site checks (compose ps, compose config, HTTP probe, SSL expiry, DB ping). Reports PASS/WARN/FAIL with per-check labels.
- `wpfy info`: Aggregate view (site count, Traefik, Docker version) and per-site view (registry metadata, compose.yaml, sanitized .env).
- `wpfy info --nginx/--php/--mysql`: Per-service introspection with live compose exec queries.
- `wpfy clean`: Cache clearing with `--redis` (FLUSHALL), `--opcache` (kill -USR2), and nginx cache directory cleanup. `--all` clears everything. Operates on all sites or a specific domain.
- `wpfy log show`: Container log display with `--nginx`, `--php`, `--mysql`, `--follow`, `--lines` flags.
- `wpfy log reset`: Stops and restarts containers to reset logs.
- `wpfy site wp <domain> <wp-cli args>`: WP-CLI passthrough via the site's `wpcli` service container.
- `wpfy site update`: Now supports `--php`, `--wpfc`, `--wpredis`, `-le`, `--password`, `--wpsubdir`, `--wpsubdomain`. Regenerates compose.yaml, updates registry, restarts runtime.
- `wpfy site ssl`: Added `--renew` (force certificate renewal via acme.json), `--status` (cert info with expiry warnings), `--preflight-only` flags.
- `wpfy site delete`: Now stops runtime before removing scaffold.
- Env secrets sanitized in `wpfy info` output (passwords, keys, salts, tokens redacted).

### Architecture Decisions (New ADRs)
- ADR-0005: Traefik edge proxy with built-in ACME, Docker label auto-discovery.
- ADR-0006: JSON site registry at `/var/lib/wpfy/sites.json` with atomic writes, filesystem authoritative.
- ADR-0007: Per-site PHP version via `ghcr.io/wpfyorg/php-fpm:8.X` Docker image tags.

### Resolved Decisions
- Edge proxy: Traefik v3 (was undecided between Traefik/Caddy/nginx).
- ACME owner: Traefik built-in (was external acme.sh planned).
- State store: JSON file with filesystem authority (was undecided between file-only and SQLite).
- PHP versioning: Docker image tags per site (was host-level multi-version planned).
- Ubuntu LTS matrix: 22.04 and 24.04 (was undecided).
- Release packaging: pip-installable Python package with pyproject.toml (was undecided).

### Notes
- SFTP container (`sftp.py`) is planned but not yet implemented.
- Superseded on 2026-07-08: wildcard SSL is Cloudflare-only through DNS challenge.
- Full WordPress provisioning (wp core download, wp config create) is still planned.
- Per-site `php.ini` overrides and Traefik dashboard remain deferred.

---

## v0.1.0 (2026-05-20)

Implemented:
- Added Python package scaffold for `wpfy` under `src/wpfy/`.
- Added `pyproject.toml` with `wpfy` console entrypoint.
- Added argparse CLI scaffold for site and stack command groups.
- Added project documentation and agent memory system.
- Updated root `AGENTS.md` and `README.md` to reflect current scaffold and project direction.
- Added root `wpfy` installer script with Ubuntu checks, Docker/Compose bootstrap, directory creation, source sync, pip install, config write, smoke checks, and dry-run support.
- Added per-site Compose scaffold generation for `wpfy site create` with idempotent `compose.yaml` and `.env` output.
- `wpfy site create` now rejects SSL requests until DNS/IP preflight exists.
- `wpfy site list`, `wpfy site info`, `wpfy site show`, and `wpfy site delete` now operate on per-site scaffold files.
- `wpfy site create` now attempts `docker compose up -d` when Docker and Compose are available.
- Added `wpfy site status` to report scaffold metadata and runtime state.
- `wpfy site status` now reports scaffold, bootstrap, and runtime readiness fields.
- `wpfy site status` now surfaces `needs-bootstrap` for scaffolded sites without bootstrapped WordPress files.
- `wpfy site status` now surfaces `degraded` when bootstrap is ready but Docker/Compose are unavailable.
- `wpfy site status` now inspects running container health with `docker inspect` and is flavor-aware for required services.
- `wpfy site status` now performs an HTTP probe against the per-site web container when Docker is available.
- Added `WPFY_SKIP_RUNTIME=1` to disable runtime orchestration for offline-safe verification.
- Added DNS/IP SSL preflight and `wpfy site ssl <domain> --letsencrypt` preflight command.
- Added deterministic test overrides for DNS/IP preflight via `WPFY_TEST_DNS_IPS` and `WPFY_TEST_PUBLIC_IPS`.
- Added minimal WordPress-style filesystem bootstrap plus `wpfy site backup` and `wpfy site restore` for scaffold archives.
- Moved backups out of the removable site tree into `/var/lib/wpfy/backups/<site>/`.

Planned:
- Installer file logging and stronger partial-install diagnostics.
- HTTP probe validation and broader WordPress health checks.
- ACME issuance after successful DNS/IP preflight.

Notes:
- Real Docker, site lifecycle, SSL, backup, restore, and SFTP behavior is not implemented yet.
