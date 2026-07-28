# ADR 0015: Caching plugin integration tiers

- Status: Accepted
- Date: 2026-07-24

## Context

wpfy owns the per-site Docker and Nginx runtime but does not own every WordPress plugin's internal settings or licensing. Free repository plugins can be installed with WP-CLI. WP Rocket and FlyingPress are paid products that operators must supply, and fetching a same-named repository plugin would be unsafe and misleading. Plugin cache-file conventions also drift between major plugin releases, so a permanently exact set of plugin-internal Nginx paths cannot be promised.

## Decision

Use three integration tiers:

1. **Free repository plugins** — WP Super Cache, W3 Total Cache, Cache Enabler, and WP Fastest Cache are installed and activated through WP-CLI. wpfy asserts `WP_CACHE` through `wp config set`, stages the shared Nginx bypass safety rules, and deactivates other wpfy-managed free page-cache plugins when switching.
2. **BYO paid plugins** — WP Rocket and FlyingPress never trigger an install command. wpfy stages `WP_CACHE` and the Nginx bypass rules, returns an explicit awaiting-upload status, and tells the operator to upload/extract the licensed plugin under the site's `app/wp-content/plugins/` directory. wpfy never deletes those operator-supplied files.
3. **wpfy-owned FastCGI cache** — `wpfc` renders a real per-site `fastcgi_cache_path` and cache zone, configures both `fastcgi_cache_bypass` and `fastcgi_no_cache`, and installs the free `nginx-helper` plugin for purge-on-save when the runtime is available.

The FastCGI cache data lives at `<site-root>/cache-data`, a per-site directory owned by the site's uid and bind-mounted to `/var/cache/nginx/fastcgi`. It deliberately does not use the image's default `/var/cache/nginx` directory: that image path is owned by an image uid/group and is not writable by wpfy's per-site web uid. The sibling directory is also outside the backup archive's `compose.yaml`, `.env`, `app/`, `nginx/`, and `php/` set.

Redis object caching is an independent axis. Enabling it installs and activates Redis Object Cache, asserts `WP_REDIS_HOST=redis` and `WP_REDIS_PORT=6379`, and runs `wp redis enable`. The Redis service remains on the site's private network with no published host port.

Every generated page-cache snippet starts with a safe `$wpfy_skip_cache=0` default and bypasses personalized or mutating requests: logged-in, comment-author, and post-password cookies; POST requests; query strings; and `/wp-admin` paths. The variable is consulted by both cache-read and cache-store directives. The generated `wpfy-cache.conf` and `cache-path.conf` are deterministic, trusted outputs from validated wpfy inputs and do not require a scaffold-time container round-trip, so generation cannot depend on an `app` upstream that does not exist yet. Generated files inside a directory bind mount may use an atomic replace, but any wpfy-generated file that `compose.yaml` mounts individually must be updated in place: an atomic replace changes the host inode while the running container remains pinned to the old inode. The in-place path must still use no-follow writes and reject a destination symlink. Operator-owned `custom.conf` remains a separate untrusted surface and keeps validate-then-swap `nginx -t` behavior on an existing runtime. Disabling page caching removes `wpfy-cache.conf` and clears the individually mounted `cache-path.conf` in place so neither include path retains stale behavior.

The snippets deliberately do not promise plugin-internal cache-file paths. Plugin authors change those conventions across major versions. The bypass rules are verified against the specific Nginx/plugin integration implemented by this release and must be reviewed when a plugin major version changes.

## Alternatives considered

- Download paid plugins from WordPress.org by slug: rejected because it may fetch an unrelated plugin and cannot satisfy licensing.
- Delete every old plugin when switching: rejected because BYO plugin files belong to the operator.
- Hard-code every plugin's cache directory: rejected because conventions drift across major versions and stale paths can create a false sense of safety.
- Make Redis reachable through a host port: rejected because this stack has no Redis authentication and per-site network isolation is the safety boundary.

## Consequences

- Free plugin installation and activation are automatable; paid plugin completion remains an explicit operator step.
- Operator-supplied Nginx custom configuration still requires Docker/Compose and a running site runtime for fail-closed `nginx -t` validation. Generated cache rules do not require that scaffold-time round-trip because wpfy owns their deterministic templates; this avoids both the missing `app` upstream and bind-mounting a candidate into the read-only include directory. When the site is running, reload failures are non-zero and the status/diagnostics paths run `nginx -t` so a rejected generated config is visible.
- Future generated single-file mounts, including files added by later phases, must use the same inode-preserving no-follow update rule rather than atomic replacement.
- Purge always attempts the active plugin command, then unconditionally clears wpfy's Nginx and Redis layers. Plugin command drift is tolerated, but owned-layer failures remain non-zero.
- Major plugin upgrades require a review of the integration and bypass assumptions rather than an unsupported claim of permanent compatibility.
