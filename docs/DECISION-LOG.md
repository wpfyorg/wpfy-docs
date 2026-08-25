# Decision Log

## 2026-08-25: Park FileBrowser Quantum through 1.0 stable
- Decision: The FileBrowser Quantum file-manager integration remains disabled
  and parked through 1.0 stable. Reassessment happens at 1.1 planning. No code
  is deleted: `file_manager_providers/quantum.py`, `deploy/file-manager/`, the
  pinned image lock, and the `WPFY_FM_ENABLED`/`WPFY_FM_LEGACY_API` flags stay
  in the tree exactly as shipped. Recorded as an amendment to ADR 0031.
- Owner: Product maintainer.
- Target: No promotion in any 1.0 release; reassess at 1.1 planning.
- Reason: The integration is implemented but unpromoted (`WPFY_FM_ENABLED`
  defaults off). Promoting it inside the 1.0 stabilization window would add an
  unaudited-at-scale surface to a release whose goal is stability, while
  deleting it would discard reviewed, digest-pinned, rollback-capable work for
  no gain.
- Alternatives: promote in 1.0 (rejected: stabilization window); delete the
  code (rejected: loses pinned, security-reviewed work and its rollback lane).
- Compatibility: no operator-visible change; the legacy file-manager API
  remains the default path.
- Migration: none while the feature stays parked.
- Rollback: unchanged from ADR 0031 — previous release plus the legacy API;
  the Quantum container is never reachable without the panel proxy.
- Status: Accepted.

## 2026-08-25: Schedule WordPress Multisite for 1.1 with both modes
- Decision: Multisite is scheduled for 1.1 with both subdirectory and
  subdomain modes. Subdomain mode requires a Cloudflare DNS wildcard record
  and a passing wildcard TLS preflight before any mutation. The product must
  disclose that a network's child sites share one WPFY site runtime and one
  database, while separately managed WPFY sites remain isolated from each
  other as today. Implementation is blocked pending offline and disposable-VPS
  evidence. Recorded as ADR 0035.
- Owner: Product maintainer.
- Target: WPFY 1.1.
- Reason: Recurring operator demand for both network modes. Subdomain mode
  cannot be supported honestly without the wildcard DNS and wildcard TLS
  preconditions, and the shared-runtime disclosure keeps the isolation
  guarantee from being overstated.
- Alternatives: ship in 1.0 (rejected: stabilization window, no runtime
  evidence); subdirectory-only (rejected: forces a disruptive second
  migration later); present network children as isolated sites (rejected:
  false).
- Compatibility: additive in 1.1; single-site behavior and per-WPFY-site
  isolation are unchanged.
- Migration: none defined yet; converting an existing single site into a
  network, if supported at all, is part of the 1.1 design.
- Rollback: nothing implemented to roll back; a future implementation must
  define rollback for partially provisioned networks before it ships.
- Status: Accepted (scheduling); implementation blocked on evidence.

## 2026-08-25: Confirm 1.0 scope for telemetry, SMTP, and named S3 storage
- Decision: For 1.0, telemetry stays inert by default — nothing is sent unless
  an endpoint is deliberately configured, and `WPFY_TELEMETRY=0` still
  overrides state. SMTP stays test-only: a stored transport plus explicit test
  sends, never automatic notifications. Named S3-compatible backup storage
  profiles remain CLI-only. This decision pins existing behavior for the 1.0
  scope; no source change is made by it. Telemetry design stands as ADR 0026.
- Owner: Product maintainer.
- Target: WPFY 1.0.
- Reason: Each surface already behaves the way the product wants for 1.0;
  recording the scope prevents accidental expansion (automatic alerting,
  outbound telemetry delivery, or a parallel storage-configuration surface)
  during stabilization.
- Alternatives: automatic SMTP notifications (rejected, again: a shared
  credential readable by any site's PHP cuts against site isolation);
  enabling telemetry delivery (rejected: no endpoint configured and the opt-out
  payload discipline of ADR 0026 stands); moving named S3 profiles out of the
  CLI (deferred; not 1.0 scope).
- Compatibility: no interface changes; all three surfaces behave exactly as
  shipped.
- Migration: none.
- Rollback: none needed; behavior is unchanged.
- Status: Accepted.

## 2026-08-25: Flat CLI stays canonical; compatibility surfaces deprecate in 1.0
- Decision: The flat command surface remains canonical. Grouped `wpfy site
  ...`/`wpfy stack ...` compatibility surfaces and confirmed legacy removals
  are deprecated in 1.0 and are not removed earlier than 1.1. Every removal
  must ship with actionable migration guidance naming the replacement command,
  published in the same release that removes the surface. Deprecation in 1.0
  is a documented-status change; whether a surface also emits a runtime
  warning is left to the implementing change.
- Owner: Product maintainer.
- Target: Deprecation recorded in 1.0; earliest removal in 1.1.
- Reason: Operators and scripts need one canonical surface plus a predictable
  runway. Removing compatibility aliases during stabilization would break
  working automation without giving users time to migrate.
- Alternatives: keep both surfaces indefinitely (rejected: permanent dual
  maintenance and drift); remove grouped commands in 1.0 (rejected: breaks
  automation inside a stabilization release).
- Compatibility: nothing is removed in 1.0.
- Migration: each removal pairs with a published command mapping before the
  removal lands.
- Rollback: re-adding a removed alias remains technically possible until the
  parser stabilizes; the migration guidance is the primary recovery path.
- Status: Accepted.

## 2026-08-25: Deprecate `stack migrate`; remove in 1.1
- Decision: `wpfy stack migrate` is deprecated in 1.0 and will be removed no
  earlier than 1.1. The command was never implemented — Docker-first v1 has no
  host-level stack to migrate from — so deprecation is a documented status
  change, not a behavior change. The 1.1 removal must include actionable
  guidance for operators coming from host-managed stacks.
- Owner: Product maintainer.
- Target: Deprecated in 1.0; removed no earlier than 1.1.
- Reason: The Docker-first architecture eliminated the problem the command
  name promised to solve; keeping a permanently unimplemented placeholder in
  the parser misleads operators scanning `wpfy stack --help`.
- Alternatives: implement host-stack migration (rejected previously; out of
  scope for the Docker-first product); keep the silent placeholder
  indefinitely (rejected: misleading surface).
- Compatibility: no behavior change in 1.0 — there is nothing to deprecate at
  runtime; the parser entry goes away in 1.1 alongside the guidance.
- Migration: operators on host-level stacks are directed to the Docker-first
  install path; the 1.1 removal notes must state this explicitly.
- Rollback: restoring the placeholder after removal has no value; removal is
  final absent new product direction.
- Status: Accepted.

## 2026-08-21: Traefik reads Docker through an allowlisted socket proxy
- Decision: Traefik no longer mounts `/var/run/docker.sock`. A digest-pinned
  `wollomatic/socket-proxy` holds the socket on a new `internal: true`
  `wpfy-docker-socket` network, publishes no host port, and allows only
  `GET /version`, `GET /v1.NN/(version|containers/.*|events.*)` and
  `HEAD /_ping`. Traefik's provider endpoint is `tcp://socket-proxy:2375`.
  Recorded as ADR 0034.
- Reason: A read-only socket mount restricts the file, not the API. Traefik
  could create containers, bind-mount any host path, and exec into a site --
  root on the host, indirectly -- while needing only the container list and the
  event stream. Both pentests recorded it as unremediated debt.
- Alternatives: keep the direct mount (the finding stands); drop the Docker
  provider for generated file config (removes the socket, but every site
  mutation becomes an edge config write and every site's labels move);
  `tecnativa/docker-socket-proxy` (category flags grant whole namespaces
  including POST, where the wollomatic regex is per method and path).
- Consequence: This is reach reduction, not confidentiality. `containers/.*` is
  what Traefik needs to route, and it returns container environment, so an
  attacker owning the edge can still read site database credentials. Traefik
  `depends_on` the proxy; a dead proxy means file-provider routes only. Live
  proxy behaviour is still unproven -- Docker Desktop denied the proxy the
  socket, so `tests/docker-runtime-hardening.sh` skipped every live API
  assertion. It needs a Linux host before any release claim.

## 2026-08-21: Close the rc5 pentest findings in the runtime and the panel
- Decision: Five changes, none of which alter a documented interface. The
  generated Nginx serves `/healthz.html` only to `127.0.0.1` and `::1`;
  `system_diagnostics()` maps every subprocess result to an allowlisted state
  (`running`/`stopped`/`unavailable`/`available`/`consistent`/`mismatch`) with
  fixed messages instead of returning raw `docker compose ps` output; a
  self-signed or domainless panel answers `421` to any Host other than its
  configured one; `auth.login` caps its body at 8 KiB, rejects malformed
  material before any KDF, and admits scrypt work through a non-blocking gate
  (2 global, 1 per client) that returns a generic `429` with `Retry-After`;
  and every runtime image reference moves into `src/wpfy/image_references.py`
  pinned by digest, with `docs/IMAGE_UPDATE_POLICY.md` owning the update
  procedure.
- Reason: The rc5 pentest confirmed a public liveness oracle on
  `/healthz.html`, container names, images, commands, and host port bindings
  leaking through the admin diagnostics endpoint, and measured 0.18s of scrypt
  per login -- cheap saturation for anyone with a handful of addresses.
  Mutable image tags were carried over from rc4 as supply-chain debt.
- Alternatives: rate-limit login instead of admitting it (a queue still spends
  the CPU, and the domainless listener has no Traefik limiter in front of it);
  redact diagnostics strings by pattern (an allowlist of states cannot leak a
  string nobody wrote into it).
- Consequence: Login can now fail with `429` before any credential is checked,
  which is a new response for a correct password under load. `scrypt`
  parameters, the dummy KDF for unknown users, TOTP, CSRF and the per-user
  throttles are unchanged. `atmoz/sftp:alpine` stays unpinned as a documented
  exception -- its manifest is amd64-only and WPFY supports arm hosts.

## 2026-08-15: Validate the panel rebuild against a real host before merging
- Decision: The ufw port management and the domainless exposure were run against
  the validation VPS, and seven defects found there were fixed with a test each.
  The two mode-defining ones: `wpfy panel --public` did not exist, so domainless
  exposure was unreachable by the command it told operators to run; and the
  first-run setup secret was keyed to `edge_bind`, which a domainless panel is
  not, so an administrator could be created over the open internet with no
  secret at all.
- Reason: The offline suite stubs `subprocess.run` and builds `PanelConfig`
  directly, so it exercises neither the real `ufw` nor the command an operator
  types. Every one of these passed offline. Real ufw prints rule comments inside
  the `From` column and prints no rule list at all while inactive; real Traefik
  accepts a sha512crypt basicAuth line and then rejects the correct password
  forever. None of that is visible from a green suite.
- Alternatives: Merge on the strength of the offline tests. Rejected: two of the
  findings were security defects in the path the whole feature exists for.

## 2026-08-15: Publish the panel without a domain, over self-signed TLS
- Decision: `wpfy panel expose --no-domain` binds the panel on the host's public
  address over a self-signed certificate and prints its SHA-256 fingerprint next
  to the URL. First-run account creation over that address requires a one-time
  secret, printed only by that command, hashed at rest, expiring after an hour,
  and carried in the URL fragment. Basic auth is available in front of the
  exposed Traefik router only. Recorded as ADR 0033.
- Reason: Operators without a DNS name had no supported way to reach the panel
  except an SSH tunnel. Taken literally the request -- a bare IP on port 3939
  with a secret link -- would send the first-run password, the TOTP secret, the
  session token and the gating secret itself across the internet in the clear,
  because no CA issues certificates for a bare address.
- Alternatives considered: plaintext with a loud warning (the credentials still
  cross unencrypted); allow login but never account creation over the edge
  (does not deliver the request, and login is equally exposed without TLS);
  refusing the mode entirely (leaves the operator with no path at all).
- Consequence: This relaxes a deliberate loopback-only decision. The secret's
  properties are what make it acceptable and none is optional. `openssl` becomes
  a hard requirement for this mode. Still unvalidated on a real host: public
  address detection, firewall interaction on 3939, and the Traefik middleware
  reload need a validation-VPS pass.

## 2026-08-15: Rebuild the panel client on Tabler, and make every long operation a job
- Decision: Replace the panel client rather than reskin it. Vendor Tabler 1.4.0
  (CSS + JS) flat in `panel_static/`, collapse site detail from fourteen tabs to
  five, convert every long operation to a `202 {job_id}` job, add one SSE stream
  in place of three pollers, and add host port management (`firewall_ports.py`)
  over `ufw`. Recorded as ADR 0032.
- Reason: Two audits found the client broken, not untidy. The seven-step wizard
  never read steps 2-6 and shipped defaults regardless of what was typed; six
  destructive actions fired with no confirmation; six `refresh*` functions had
  no post-`await` domain guard, so switching site mid-flight could write site
  A's values to site B. A component library on top of that logic would only have
  made it better looking.
- Alternatives considered: reskin the existing client (preserves the defects);
  a CDN or build step for Tabler (the panel CSP is `default-src 'self'`, a wpfy
  box may have no outbound HTTPS, and `package-data` is non-recursive so a
  `vendor/` directory vanishes from the wheel); keeping fourteen tabs (five of
  them were the same refresh/preview/apply job repeated).
- Consequence: Old tab paths redirect for one release. `panel_jobs` remains an
  in-memory dict, so a panel restart still loses in-flight jobs -- the client now
  reports that honestly instead of spinning forever. Three gates hold the line:
  every shipped `.js` must parse, every module issuing a destructive request must
  load the confirmation helper, and the riskiest four must use a typed keyword.

## 2026-08-15: Write-only secrets keep their stored value on a blank field
- Decision: `PUT /api/backup/remote` and `PUT /api/notifications/smtp` accept a
  request with the secret omitted or empty, meaning "keep the stored one". Only
  a non-empty value replaces it. The first write still requires one.
- Reason: Both endpoints demanded the secret on every write while no read path
  returns it, so changing a bucket prefix forced the operator to re-type an S3
  secret key, and a client sending `""` to satisfy a required field silently
  overwrote a working credential with an empty one. Nothing failed until the
  next scheduled upload, at night, quietly.
- Alternatives considered: require the secret on every edit (an operator who has
  lost the original can never change the prefix again); delete-and-recreate only
  (leaves a window with no destination during which a scheduled backup fails).
- Consequence: The write-only property is unchanged -- no read path returns a
  secret, and the panel never round-trips one. No ADR: this narrows a request
  contract, it does not change ownership or architecture.

## 2026-08-15: Enforce the password minimum in one validator
- Decision: Move the 12-character floor into `panel_auth._validate_password`,
  which `add_user`, `update_user`, `set_password` and first-run setup all call.
  `panel_setup.PASSWORD_MIN_LENGTH` becomes a re-export.
- Reason: The floor was enforced only by the first-run setup form. The admin who
  was made to pick twelve characters could then create a site-manager with a
  one-character password, on a panel `wpfy panel expose` can publish to the
  internet.
- Alternatives considered: client-side only (a direct API call or the CLI
  bypasses it, so the guarantee is cosmetic).
- Consequence: Stored passwords are unaffected -- validation runs on write, so
  existing accounts keep working until someone changes them.

## 2026-08-05: Validate site field vocabularies at lifecycle entry
- Decision: Define one vocabulary for PHP versions, Let's Encrypt modes, and
  DNS providers; validate create/update requests at the shared lifecycle before
  any preflight, render, or persistence. CLI and panel perform matching early
  validation from those same constants.
- Reason: An unchecked value could write an unusable PHP image tag or silently
  turn a misspelled wildcard request into ordinary SSL.
- Alternatives considered: parser-only checks (panel/direct callers bypass
  them), panel-only checks (CLI/direct callers bypass them), or scattered
  literals (drift risk).
- Consequence: Existing invalid stored values remain readable for repair but
  block unrelated lifecycle updates until replaced by an accepted value. No ADR
  is required because lifecycle ownership and persisted-state architecture are unchanged.
- Status: Accepted.

## 2026-08-05: Use boundary-delimited secret labels in event redaction
- Decision: Apply centralized event redaction to assignments labelled `PWD`,
  `PASS`, `PASSWORD`, `SECRET`, `TOKEN`, `KEY`, `CREDENTIAL`, `AUTH`, or
  `AUTHORIZATION` only when the label is not adjacent to a letter or digit;
  mask complete quoted or unquoted values.
- Reason: The prior labels missed cron secrets such as `MYSQL_PWD=...`, while
  unbounded `KEY` matching corrupted harmless operational diagnostics such as
  `monkey=12`.
- Alternatives considered: match space-separated forms (would incorrectly
  redact prose such as `password reset requested`), or share the exact-value
  configured-secret helper (it lacks assignment-label context).
- Consequence: Event log and panel records retain useful text and cover more
  recognizable secret assignments. This is best-effort pattern matching, not a
  guarantee: unlabelled secrets can still be logged. No ADR is required because
  event persistence architecture is unchanged.
- Status: Accepted.

## 2026-08-05: Reject passwords and panel tokens in command-line arguments
- Decision: `site create --pass`, grouped `site update --password`, and `sftp --password` accept only `-` for one stdin line or `prompt` from a TTY; raw values return exit code 2. Raw `panel --token` values are refused in favour of `--token-file` or `WPFY_PANEL_TOKEN`.
- Reason: Every local user can inspect process argv, so a raw WordPress administrator password can lead to wp-admin access and then site PHP execution; SFTP passwords and long-running panel tokens have the same exposure.
- Alternatives considered: retain raw values during a transition (continues the disclosure), or add a separate parser (would drift from the existing database password standard).
- Consequence: Existing automation must pass the password on stdin. Fresh `site create` without `--pass` continues to generate and show one password once. No ADR is required because this hardens CLI input handling without changing architecture.
- Status: Accepted.

## 2026-08-05: Generate sha512crypt basic-auth credentials
- Decision: Write new `nginx/htpasswd` credentials as OpenSSL sha512crypt (`$6$`) hashes, passing passwords on stdin. Use fresh-salt APR1 (`$apr1$`) only when OpenSSL is absent, and record the scheme in the basic-auth operation event. Restore reapplies `0640` and the site's uid:gid to the credential file.
- Reason: sha512crypt is salted and SHA-512 based; `openssl passwd -6 -stdin` is available on supported Ubuntu targets without a Python runtime dependency or process-argv password exposure.
- Alternatives considered: retaining APR1 as the default (MD5-based), bcrypt (not available without a runtime dependency), retaining `{SHA}` for new credentials (unsalted SHA-1).
- Consequence: OpenSSL failures fail closed. Hosts lacking OpenSSL receive the explicit APR1 fallback event. Nginx also accepts `{SHA}` entries. See amended ADR 0016.
- Status: Accepted.

## 2026-08-05: Create secret files with final mode
- Decision: Open managed site `.env` files, stored S3/Cloudflare/SMTP configuration, and downloaded remote archives with mode `0600`; retain existing post-write mode enforcement and ownership behavior.
- Reason: Opening first with a readable mode creates an owner-only secret file only after a local-readable window; umask cannot be relied on for this boundary.
- Alternatives considered: tighten every generated file (breaks non-owner container bind mounts) or rely on umask (not an invariant).
- Consequence: Existing legacy secret files become `0600` on their next managed rewrite. No ADR is required because this corrects file-write mechanics without changing system architecture.
- Status: Accepted.

## 2026-08-05: Bound panel idle sockets
- Decision: Apply module-level `PANEL_SOCKET_TIMEOUT = 30` seconds to every accepted panel connection. The timeout is read when each connection is accepted, allowing tests and future maintenance to tune the constant without adding production configuration.
- Reason: Request-line and header parsing precede authentication; an incomplete unauthenticated request must not occupy a worker indefinitely.
- Alternatives considered: an environment variable (unnecessary production surface), changing `HTTP/1.1` to close every connection (breaks deliberate keep-alive), or authenticating before HTTP parsing (not supported by the stdlib handler flow).
- Consequence: A legitimately slow client that exceeds 30 seconds between bytes is disconnected; normal requests and keep-alive gaps shorter than 30 seconds are unchanged. No ADR is required because this is an operational hardening detail, not an architecture change.
- Status: Accepted.

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

## 2026-07-24: Orthogonal native cache selection and integration tiers
- Decision: Keep `flavor` as the base site type and persist independent `page_cache` and `object_cache` values. Automate free repository plugin installation, stage paid/BYO plugins without fetching or deleting their files, and keep wpfy's FastCGI cache plus Redis wiring in the operation layer and CLI. See ADRs 0014 and 0015.
- Reason: The old overloaded cache flavors could not express page-cache plus Redis object-cache combinations, while paid plugin licensing and drifting cache-file conventions make one universal installer/snippet unsafe.
- Alternatives considered: Keep one cache flavor, store choices only in registry metadata, fetch paid slugs from WordPress.org, delete operator-owned plugin files, or hard-code plugin-specific cache directories.
- Consequence: Legacy `SITE_FLAVOR` values migrate on load; generated snippets enforce the shared bypass invariant; files mounted through a directory may be atomically installed, while every individually bind-mounted generated file must be updated in place with no-follow symlink protection so the container keeps the live inode. Running-site reload failures are non-zero and `nginx -t` is exposed through status/diagnostics. Plugin major upgrades require integration review; panel fields remain Phase 3b work.
- Status: Accepted.

## 2026-07-24: Per-site config overrides and validated Nginx includes
- Decision: Keep generated Nginx server blocks and wpfy PHP settings authoritative, expose operator-owned `nginx/extra/custom.conf` and `php/custom.ini`, validate Nginx snippets inside each site's web container before atomic installation, and expose Adminer only on a loopback port on the site's private network.
- Reason: This closes the database/PHP/vhost parity gap without permitting raw vhost replacement, cross-site mounts, public Adminer exposure, SQL identifier injection, or PHP ini directive injection.
- Alternatives considered: raw vhost editor, host-side or skipped-runtime Nginx validation, shared PHP override directories, and public/Traefik Adminer publication.
- Consequence: Nginx custom updates fail closed when Docker is unavailable; generated files are deterministic while operator-owned files survive refresh; database root credentials stay inside the database container and generated panel passwords use read-once job payloads. See ADR 0013.
- Status: Accepted.

## 2026-07-23: In-process panel jobs and append-only redacted events
- Decision: Run panel mutations as in-process jobs with progress and read-once credential payloads, and record operations in a size-rotated append-only redacted JSONL event log. Route metadata flows through `authorize(principal, meta, domain)`; today every authenticated request uses one implicit admin principal.
- Reason: The panel needs non-blocking site lifecycle operations, live progress, one-time credential delivery, and inspectable operation history without adding a database, external queue, or persistent secret store. A centralized authorization seam preserves a path to future authentication and roles.
- Alternatives considered: Synchronous HTTP mutations; persistent database or external job queue; persisted credential payloads; SQLite events; mandatory event writes; and handler-local authorization checks.
- Consequence: Jobs and payloads do not survive a panel restart, and credentials cannot be recovered after the one read. Event writes are best-effort and may be absent if logging fails, but cannot break the operation; key-based redaction keeps known secret fields out of the log. The panel remains loopback-only, bearer-token protected, single-token, and single-operator.
- Status: Accepted.

## 2026-07-27: Per-site access lockout controls
- Decision: Store basic-auth, deny-list, user-agent, and Cloudflare-only state in `security.json`; render deterministic Nginx rules; enforce Cloudflare-only as a Traefik `ipAllowList`; discover real-IP trust from the actual wpfy network plus Cloudflare ranges when applicable; and require a warning/`--force` for direct-DNS Cloudflare-only activation. Keep the individually mounted `nginx/htpasswd` file outside `app/` and rotate it in place.
- Reason: These controls can produce a healthy but unreachable site. Edge rejection prevents non-Cloudflare requests from reaching the origin, real-IP discovery avoids hostname/DNS startup coupling, in-place writes revoke credentials seen by running containers, and preflight makes the direct-DNS lockout explicit.
- Alternatives considered: Nginx-only Cloudflare rejection; trusting a Traefik hostname or wildcard; putting `htpasswd` under `app/`; atomic replacement of the individually mounted credential file; and silent activation without a preflight warning.
- Consequence: The edge subnet is broader than one Traefik container but is wpfy-controlled and dynamically discovered. Basic auth leaves the managed health endpoint unauthenticated; unknown external webhook/WP-Cron callers are not warned because wpfy cannot inventory them reliably. See ADR 0016.
- Status: Accepted.

## 2026-07-27: SQLite metrics sampled on the existing minute tick
- Decision: Store host and managed-domain time-series samples in a WAL-mode stdlib SQLite database under the state directory, sample once per existing cron minute tick, and prune to 14 days on the daily tick. Use one bounded whole-machine `docker stats --no-stream --format json` call and exact Compose project parsing. See ADR 0018.
- Reason: SQLite provides indexed exact-scope range reads, retention, and concurrent processes without a dependency or resident service. Reusing the existing scheduler avoids another daemon while keeping the sampling frequency aligned with the initial graph requirements.
- Alternatives considered: resident daemon, sub-minute sampling, JSONL, one Docker stats process per site, streaming Docker stats, and daily `VACUUM`.
- Consequence: Sampling shares the minute tick's failure domain, so every Docker call has a timeout and sampler/pruner failures are contained and logged without stopping other tick tenants. Per-site CPU/memory are container-derived; disk/load remain host/filesystem measurements. Phase 5b can query bounded rows without changing storage.
- Status: Accepted.

## 2026-07-27: Native file manager jailed to each site's app directory
- Decision: Put all file-manager operations behind `files.py`, jail every source and destination to `app/`, reject every symlink component with an `lstat` walk, and retain directory file descriptors for descriptor-relative operations with `O_NOFOLLOW` plus a final containment assertion. Stream fixed-length capped uploads, force every download to a sanitized octet-stream attachment, chown created paths to `SITE_UID`, and whitelist safe chmod strings. See ADR 0019.
- Reason: `.env`, Compose/config files, and database storage are sensitive siblings of `app/`; a wider root plus blocklist is fragile. `realpath` containment alone accepts contained links and cannot prevent a link-repoint race. Renderable site files served from the panel origin would also create stored XSS against the operator token.
- Alternatives considered: jail the whole site directory with a blocklist, containment-only symlink handling, buffered JSON uploads, inferred download MIME types, and a third-party editor/upload library.
- Consequence: The panel and thin CLI can browse and mutate only site web-root content. Symlinks are visible in listings but never traversed. Large/binary files remain downloadable but are not editor-buffered; non-empty directory deletion requires exact basename confirmation.
- Status: Accepted.

## 2026-07-28: Named panel users, roles, and TOTP replace the single run token
- Decision: Store panel users in `<config>/panel-users.json` (mode 0600) with `hashlib.scrypt` password hashes, a role of `admin` or `site-manager`, assigned sites, and an optional TOTP secret. Sessions are in-memory bearer tokens with both idle and absolute expiry, so a panel restart invalidates every session. TOTP is RFC 6238 over stdlib `hmac`/`struct`/`base64`. `authorize(principal, meta, domain)` keeps its Phase 1 signature and gains real role checks; the ad-hoc run token stays full-admin only while no users exist and is disabled the moment login is required. Site managers are default-deny — an explicit action allowlist plus their assigned domains, derived from the route table rather than enumerated by hand. See ADR 0020.
- Reason: A single shared token cannot express "this person manages these two sites". Bearer tokens rather than cookies keep CSRF structurally out of scope. scrypt and a stdlib TOTP keep the no-new-dependencies rule intact. Deriving the site-manager allowlist from the route table means a route added later is refused until someone decides otherwise, instead of being silently reachable.
- Alternatives considered: cookie sessions with CSRF tokens; persisted sessions surviving restart; a third-party TOTP or QR library; PBKDF2 instead of scrypt; enumerating allowed actions per role by hand.
- Consequence: Restarting the panel logs everyone out, which is documented and acceptable for a self-hosted tool. Demoting the last admin is refused, because nothing else could restore it. Failed logins are throttled with a lockout and recorded as events; the lockout path performs the same key-derivation work as an unknown user so it does not leak account existence by timing.
- Status: Accepted.

## 2026-07-28: Panel exposure through Traefik on its own network, gated on 2FA
- Decision: Keep the panel a host process and reach it from Traefik through a dedicated `wpfy-panel-edge` network and a file-provider router with TLS and a rate-limit middleware. `expose` runs the existing SSL preflight, never skips it, and refuses unless at least one user has an enrolled TOTP factor. Binding the panel to a non-loopback address is refused unless login is required, a TOTP factor exists, and an exposure router is already active. `validate_loopback_host` is left untouched; edge binding goes through a separate `validate_edge_bind`. Any router file present counts as exposed, with an unparseable file reporting exposure but no domain. See ADR 0021.
- Reason: Containerising the panel would need the Docker socket and every site directory mounted into something edge-adjacent, so a compromise there would be a full host compromise. A dedicated network keeps the reachability grant to one TCP connection instead of widening the shared bridge. Fail-safe exposure reporting matters more than precision: an operator told "not exposed" about a panel that is exposed acts on the wrong belief.
- Alternatives considered: running the panel in a container; reusing the shared wpfy network; relaxing `validate_loopback_host` to accept the edge case; treating an unparseable router file as not exposed.
- Consequence: wpfy manages no host firewall rules, per the standing stance. Exposure is reversible with `--disable`, which removes the router idempotently. An operator who prefers not to expose the panel at all keeps the SSH tunnel, which remains the documented default.
- Status: Accepted.

## 2026-07-28: Opt-in WordPress login rate limiting keyed on the real client
- Decision: Render a per-site `limit_req_zone`/`limit_conn_zone` pair into an http-context file and reference them from the site's server-context snippet, keyed on `$binary_remote_addr` and nothing request-controlled. Protect `wp-login.php` with an exact-match location that repeats the full FastCGI directive set. Hoist real-IP resolution out of the deny-list path so it is rendered for every site unconditionally. See ADR 0022.
- Reason: `limit_req_zone` is http-context and `limit_req` is server-context; referencing an undefined zone is a hard Nginx startup failure, so the two must be generated together. An exact-match location beats the regex PHP location, and omitting the FastCGI directives there would make Nginx serve `wp-login.php` as a static file — PHP source disclosure. Keying on anything a client can set would let an attacker choose their own bucket; keying on Traefik's address would put every visitor in one bucket.
- Alternatives considered: a shared zone across sites; keying on `X-Forwarded-For` directly; a regex location for the login path; leaving real-IP resolution conditional on the deny list being non-empty.
- Consequence: Zone memory is charged per site. Rate limiting is opt-in and off by default. The real-IP prerequisite is now unconditional, which the fail2ban work in ADR 0023 depends on.
- Status: Accepted.

## 2026-07-28: Per-site host access logs and fail2ban jails in the DOCKER-USER chain
- Decision: Give every site a private host-visible `nginx/wpfy-access.log` in `combined` format, bind-mounted into its own Nginx container, owned by the site UID at mode 0640, rotated weekly with a `maxsize 100M` ceiling and `copytruncate`. `wpfy site security <domain> fail2ban on|off` is opt-in and refuses cleanly when `fail2ban-client` is absent. Each enabled site gets its own hashed jail section pointing at its own log, with an `iptables-multiport` action in Docker's `DOCKER-USER` chain. The filter matches failed `POST /wp-login.php` only. See ADR 0023.
- Reason: Container stdout gives fail2ban nothing to read and no stable per-site path. A shared log lets one tenant's traffic ban another tenant's visitors. Container-destined traffic traverses `FORWARD`, so the stock `INPUT` action bans nothing while reporting success. `copytruncate` is required because the log is bind-mounted as a single file: a rotation mode that renames it would leave the mount on the old inode and Nginx writing to an unlinked file. An `xmlrpc.php` rule was dropped rather than shipped, because WordPress answers a failed XML-RPC authentication with HTTP 200 and a status-independent rule would ban ordinary Jetpack clients.
- Alternatives considered: reading Docker's JSON log driver; a shared log and jail; the stock `INPUT` action; the default `create` rotation mode; keeping an `xmlrpc.php` rule keyed on 401/403, or widening it to any status.
- Consequence: Existing sites need one `wpfy refresh <domain>` to pick up the bind mount. wpfy installs no firewall rules of its own; fail2ban owns only the jail action it is explicitly enabled to run. fail2ban's failure mode is silence — a filter matching nothing is indistinguishable from a quiet week — so a gate compiles the shipped regex against real log lines and fails if it matches none of the abusive ones or any of the ordinary ones.
- Status: Accepted.

## 2026-07-28: Separate SSL intent from observed certificate state
- Decision: Keep `SiteDefinition` authoritative for requested TLS routing, but derive the displayed certificate state from Traefik's local ACME data. Report `disabled`, `requested`, or `enabled`; reserve `enabled` for a matching issued certificate. See ADR 0024.
- Reason: Rendering a TLS router does not prove ACME issuance succeeded, while persisting an asynchronous issuance flag would become stale and public network probes would make routine list/status commands slow and fallible.
- Alternatives considered: persisted requested/issued/failed state, public HTTPS probes on every status command, or continuing to display intent as enabled.
- Consequence: `site list`, `site info`, and `site status` remain local and fast but no longer report an unissued certificate as green. External DNS/CDN delivery still requires live validation.
- Status: Accepted.

## 2026-07-28: Run-token-authorized first-run panel setup
- Decision: Keep the existing run-token bootstrap model, add first-user setup status/create routes that close permanently with HTTP 410, refuse account creation while edge-bound, and complete TOTP through a temporary setup session with verification before persistence or an explicit consequence-confirmed skip. See ADR 0025.
- Reason: Direct verification disproved the original claim that a userless panel was unauthenticated; the run token already protects every API and is proven by immutable anti-vacuity gates. The administrator-minting path still needs one-time closure, exposure refusal, and shared throttling.
- Alternatives considered: unauthenticated setup, pre-setup API lockdown, reusable admin setup, edge-bound setup, and storing an unverified TOTP seed.
- Consequence: The run token remains powerful until first-user creation; narrowing it is separate future hardening. Setup events carry no password, TOTP seed, or email. Skipping TOTP keeps tunnel access but blocks exposure.
- Status: Accepted.

## 2026-07-28: Opt-out anonymous install telemetry with an exhaustive payload
- Decision: Store a stable setup-generated UUID and opt-out preference, send at most daily in a best-effort background stdlib request, keep the built-in endpoint empty, honor `WPFY_TELEMETRY=0`, and restrict the payload exactly to install ID, wpfy/Python/OS versions, site count, and active-site count. See ADR 0026.
- Reason: Install/environment counts can guide compatibility work, but domains and operator/site identifiers are commercially sensitive. Visibility, an exact key contract, easy disablement, an inert endpoint, and failure isolation are mandatory for an opt-out choice.
- Alternatives considered: opt-in, domain hashes, an analytics SDK, synchronous retries, and per-process install IDs.
- Consequence: Nothing is received until a service URL is deliberately configured. Adding a payload field requires an ADR amendment and test change; sender failure never changes panel/CLI output or exit status.
- Status: Accepted.

## 2026-08-01: ACME contact email resolution and applied state
- Decision: Resolve the ACME contact by valid environment value, persisted `acme.env`, valid existing rendered value, then default; expose it through `wpfy stack acme-email`. Treat `traefik.yml` as authoritative for static-config drift and use the recorded hash only to determine whether the running container loaded an already-current file. See ADR 0027.
- Reason: Defect #11 let a render without the environment variable downgrade a configured address, while L8 showed that a recorded hash could disagree with the rendered file and suppress the restart Traefik requires for static configuration.
- Alternatives considered: require the environment value on every command, ignore an existing rendered migration value, trust the recorded hash alone, or recreate Traefik on every stack install.
- Consequence: Configured addresses survive later renders; a file mismatch always requires an apply; unchanged static configuration does not restart the shared edge.
- Status: Accepted.

## 2026-08-01: Trusting a forwarded client address in the panel
- Decision: Honour a forwarded panel client address only when the socket peer belongs to the discovered edge network, then walk the chain right-to-left past trusted hops; otherwise key failed-login throttling on the peer. See ADR 0028.
- Reason: The socket peer is Traefik for every exposed-panel request, which turned a per-client cooldown into one global bucket, while unconditional header trust would let callers evade their own cooldown or pin one onto another address.
- Alternatives considered: keep the proxy-keyed bucket, trust the header unconditionally, use the leftmost forwarded value, or trust the header when edge discovery fails.
- Consequence: Remote callers receive distinct buckets when the edge is known; direct callers cannot spoof their key; discovery failure safely degrades to the previous shared-peer behavior.
- Status: Accepted.

## 2026-08-02: Serving the WP Rocket page cache from nginx
- Decision: Render an adapted Rocket-Nginx 3.1.2 block into `wpfy-cache.conf` for `page_cache=wp-rocket` so nginx serves WP Rocket's cached HTML without PHP, with `$wpfy_skip_cache` as the sole authority on cache eligibility, no pre-gzipped variants, and the vhost security headers re-emitted inside the cached-HTML location. Purge gains a `rocket` layer that deletes the files regardless of the plugin command's exit status. See ADR 0029.
- Reason: wpfy's server-side contribution for WP Rocket was inert — `fastcgi_cache_bypass` means nothing without a FastCGI zone — so every request still traversed PHP. A cached file served by nginx is never seen by WordPress, so the bypass rules must live in one place or a logged-in visitor can be handed another visitor's page.
- Alternatives considered: vendor upstream's PHP parser and per-site `.ini`, keep upstream's own cookie/method conditions alongside wpfy's, add the query-string ignore lists, override `location /`, or leave purge to the plugin.
- Consequence: Anonymous hits report `X-Wpfy-Cache: HIT` with no PHP involvement; `_bypass_conditions()` now governs WP Rocket too; any header added to the vhost must go through `BASE_SECURITY_HEADERS` or cached pages lose it. Query strings still bypass cache, which upstream avoids for tracking parameters.
- Status: Accepted.

## 2026-08-05: Reconcile interactive security controls with the running edge
- Decision: Treat a successful interactive security mutation as applied to the running edge: reload Nginx for snippet-carried controls, and force-recreate `web` for Cloudflare-only label changes only when the running `traefik.` label slice differs from the rendered slice. Stage changes successfully when `web` is stopped or runtime application is unavailable, and report genuine running-container failures as not applied so retries converge. See ADR 0016.
- Reason: Persisted state is written before runtime reconciliation, so the previous persisted-state `current != desired` guard could suppress retries after a failed apply. Applying only when the running edge is stale keeps the operator-visible success contract truthful without disrupting already-applied containers.
- Alternatives considered: Recreate `web` on every change regardless of state; keep the persisted-state `current != desired` guard; compare the full label set exactly; or detect stale labels by substring-matching `cloudflare-only` / `ipallowlist`.
- Consequence: Security controls become active on the running edge after successful interactive mutations, stale Cloudflare-only labels are revoked as well as missing labels, and stopped sites apply on next start. Compose/image labels outside the `traefik.` slice do not cause needless recreation. See ADR 0016.
- Status: Accepted.

## 2026-08-05: Trust only Traefik container addresses for forwarded client data
- Decision: Render Traefik's inspected `/32` and `/128` addresses on `wpfy`, plus Cloudflare ranges only for proxied/Cloudflare-only sites. After every successful edge start, re-render all managed sites and reload only changed running nginx services.
- Reason: The shared subnet contains every site's web container; trusting it lets a neighbouring site select another site's logged, denied, rate-limited, and fail2ban-banned client address.
- Alternatives considered: Trust the shared CIDR; trust a hostname; require manual refresh after every edge recreate.
- Consequence: A refresh failure makes edge start non-zero and is retryable. An out-of-band Traefik address change without a subsequent wpfy edge start leaves a site attributing requests to Traefik until refresh; it does not widen forwarded-header trust. ADR 0016 amended.
- Status: Accepted.

## 2026-08-05: Require encrypted S3 backup transport and reject cross-host redirects
- Decision: Require HTTPS for S3-compatible backup endpoints, with `backup storage set --allow-insecure` persisting the only deliberate HTTP opt-out. Use a shared uploader opener that rejects redirects to another host:port. See ADR 0030.
- Reason: Backup archives and SigV4 material are sensitive; warnings leave routine scheduled backups exposed, and urllib otherwise forwards signing headers across a redirect.
- Alternatives considered: warn but permit HTTP, strip credentials and follow cross-host redirects, and guard only today's GET methods.
- Consequence: Plaintext configs fail closed unless `--allow-insecure` consciously accepts that risk; redirecting providers must use their final endpoint.
- Status: Accepted.

## 2026-08-07: WPFY Login Shield — Branch C host install, DOCKER-USER action, per-site opt-in
- Decision: Implement Login Shield as two layers. Panel: keep the existing in-memory throttling (Layer 1) and add host jail `wpfy-panel-auth` over `/var/log/wpfy/panel-auth.log` (Layer 2, maxretry 8 / findtime 10m / bantime 15m). WordPress: per-site opt-in, default disabled, using the official wp-fail2ban plugin 5.4.1 (pinned, checksum-verified) plus a WPFY-owned MU-plugin bridge that writes structured failures to `<site>/security/wp-auth.log`, consumed by per-site jail `wpfy-<sha256[:16]>` (maxretry 5 / findtime 10m / bantime 1h). Host fail2ban is installed and managed idempotently by `wpfy stack install --nginx|--all|--fail2ban` (Branch C) instead of refusing on a missing binary. All bans use the WPFY-owned action `action.d/wpfy-docker-http.conf` on Docker's `DOCKER-USER` chain for TCP 80/443 with `--reject-with icmp-port-unreachable`; never `INPUT`, never SSH. Forwarded client IPs are trusted only from exact Traefik `/32` `/128` addresses (30 s TTL); never-ban identities are redacted at resolution and emission; Fail2ban `ignoreip` stays loopback-only. Each per-site jail renders exactly one `logpath`. fail2ban >= 1.0 requires `ip4`/`ip6` failure-id groups, enforced by in-process validation before `fail2ban-client -t`; stale-action detection gates IPv6 enforcement and reports degraded status until an IPv6-capable action is re-rendered. See ADR 0023 (amended).
- Reason: A filter/jail that matches nothing is indistinguishable from a quiet week, so the panel and WordPress layers must end in a real, verifiable ban. Container-destined traffic traverses `FORWARD`/`DOCKER-USER`, so an `INPUT` action reports success while banning nothing; banning the Traefik edge would take every site offline, so the trusted-proxy boundary is exact and never-ban identities are redacted at emission. Branch C removes the old silent availability trap where `fail2ban-client` absence made the feature unavailable. Live evidence (16/16 checks) proved event -> log -> filter -> jail -> ban -> unban with SSH untouched.
- Alternatives considered: refusing site enable without a preinstalled package (rejected: availability trap); stock `iptables-multiport` `INPUT` action (rejected: does not block container traffic); trusting the shared Docker subnet or the Traefik hostname (rejected: peer/forgery hazard); CAPTCHA or external reputation services (rejected: non-goals, no new dependencies); a coarse nginx access-log jail with two `logpath` keys (rejected: fail2ban 1.0 rejects dual keys at reload while `-t` passes).
- Consequence: `wpfy stack install` now also manages host fail2ban; enabling a site is self-service and idempotent; bans are server-wide HTTP and disclosed verbatim ("Only enabled sites can trigger Login Shield bans. A resulting HTTP ban may block the attacker from all websites on this WPFY server."); existing sites need one `wpfy refresh <domain>` for the new bind mounts; disabled sites and admin-owned fail2ban configuration are untouched. Performance measured: no meaningful frontend overhead, ~10% plugin-bootstrap cost on enabled sites, 0 B log writes when disabled, zero server cost for blocked traffic.
- Status: Accepted.

## 2026-08-21: Panel rate-limits its own requests; Mail page renamed to SMTP
- Decision: Add a per-client-IP token-bucket limiter to `PanelHandler`, checked once per request from all five `do_*` methods, keyed on `resolve_client_address` and returning `429` with `Retry-After`. Defaults: burst 40, refill 10/s, exposed as `PanelConfig.rate_limit_burst`/`rate_limit_refill_per_second`; the bucket table belongs to the handler built by `make_panel_server`, not the module. Separately, rename the panel's Mail page and nav entry to SMTP without touching the route, API paths, or stored keys. ADR 0033 amended.
- Reason: `expose --no-domain` binds the panel directly and never passes through Traefik, so it inherited none of the panel router's `rateLimit` middleware; only credential-guessing was priced. Placing the guard in the handler rather than behind a domainless branch covers all three exposure modes with one guard. The Mail page only stores an SMTP transport and sends a test message — nothing in wpfy sends mail on an event — so the name described software that does not exist.
- Alternatives considered: a domainless-only branch (rejected: larger diff, leaves direct-bind and loopback uncovered); raising burst to accommodate full route sweeps (rejected: on `ThreadingHTTPServer` the burst is the thread-spike an attacker gets, so this weakens the control to suit an artificial access pattern); an env-var bypass for tests (rejected: a defence silently disabled by environment is a footgun); building the mail/alerting stage (rejected: a shared credential readable by any site's PHP cuts against site isolation, and it was not wanted).
- Consequence: Callers that legitimately enumerate the whole 101-route surface — this project's own `tests/gates/` — raise `rate_limit_burst` on their own server rather than the production default. Not addressed: no global ceiling, so a distributed flood is throttled per source and not in aggregate; the bucket table is bounded by TTL pruning above a threshold, not a hard cap. The rename is copy-only, so no migration and no redirect.
- Status: Accepted.
