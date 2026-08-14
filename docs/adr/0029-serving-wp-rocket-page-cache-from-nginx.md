# ADR 0029: Serving the WP Rocket page cache from nginx

- Status: Accepted
- Date: 2026-08-02

## Context

WP Rocket is a bring-your-own page cache: the operator uploads and activates the plugin, and wpfy never installs it. Until now wpfy's server-side contribution for `page_cache=wp-rocket` was inert. `_cache_snippet` emitted the shared `$wpfy_skip_cache` bypass rules followed by `fastcgi_cache_bypass` / `fastcgi_no_cache`, but those directives only mean something when a FastCGI cache zone is active, which is true for `wpfc` alone. Every request therefore still traversed PHP, and WP Rocket's cached HTML was returned by WordPress rather than by nginx.

WP Rocket writes complete HTML pages to `wp-content/cache/wp-rocket/<host>/<path>/index.html`. Serving those files directly from nginx removes PHP, WordPress bootstrap and MySQL from the anonymous request path entirely. [Rocket-Nginx](https://github.com/satellitewp/rocket-nginx) (MIT, maintained by SatelliteWP) is the established configuration for doing this and encodes the filename conventions — HTTPS and mobile variants, gzip companions, the maintenance-mode marker — that change between plugin releases.

The hazard is that a cached HTML file served by nginx has never been seen by WordPress. Any bypass rule that lives in PHP is not consulted. If the nginx-side rules disagree with wpfy's own, a logged-in visitor can be handed another visitor's cached page, which is a disclosure bug rather than a performance one.

## Decision

Render an adapted Rocket-Nginx block into `nginx/extra/wpfy-cache.conf` when, and only when, the site's page cache is `wp-rocket`. Take the filename resolution from upstream and depart from it in three places.

**`$wpfy_skip_cache` is the sole authority on whether a request may be served from cache.** Upstream re-derives eligibility from its own cookie and request-method list. wpfy already renders that decision for every page-cache option, and it is the invariant the Phase 3 gates pin. The rocket block reduces to `if ($wpfy_skip_cache = 1) { set $rocket_bypass 0; }`, so the two halves cannot drift apart across an upstream release. This also makes the previously inert bypass rules load-bearing for `wp-rocket` for the first time.

**Pre-gzipped `.html_gzip` variants are never served.** Returning a pre-encoded body means setting `Content-Encoding` by hand, and getting it wrong corrupts the response for every client. nginx's own `gzip` compresses the plain file instead. The cost is per-request compression rather than a precomputed file; the PHP bypass is where the saving is.

**The cached-HTML location re-emits wpfy's security headers.** nginx's `add_header` inheritance is all-or-nothing: a location that adds a header of its own silently drops every header inherited from the server block. The location must add `X-Wpfy-Cache`, `Vary` and `Cache-Control`, so it also repeats `BASE_SECURITY_HEADERS` (and HSTS when SSL is enabled) from `site_layout.py`, which is now the single source both call sites read.

`Vary: Accept-Encoding, Cookie` and `Cache-Control: no-cache, no-store, must-revalidate` are set on cached pages so a shared cache in front of the site — Cloudflare, in the proxied configuration wpfy supports — cannot merge the anonymous cached copy with a logged-in response, or retain a copy wpfy has purged.

Purge gains a `rocket` layer that deletes the cached files from disk whenever the site's page cache is `wp-rocket`, independently of whether `wp rocket clean` succeeded. It runs in the `app` container, which owns the files; the `web` container mounts the application read-only.

## Alternatives considered

- **Vendor the upstream generator.** Rocket-Nginx ships `rocket-parser.php`, which reads the site's WP Rocket configuration and an operator-edited `rocket-nginx.ini`. Rejected: it adds a PHP build step, a second configuration file with its own bypass vocabulary, and a per-site tunable that could contradict `$wpfy_skip_cache`. wpfy renders deterministic configuration from `SiteDefinition`.
- **Keep upstream's own cookie and method conditions alongside wpfy's.** Rejected as two authorities for one invariant; the failure is silent and only visible in production.
- **Add the query-string allow/ignore lists.** Upstream strips known tracking parameters so `?utm_source=…` can still hit cache. Rejected for now because wpfy's gated invariant bypasses cache on any query string. Revisiting it means amending that gate, not working around it.
- **Override `location /` with a `try_files` chain.** Rejected: the include is at server level and a second `location /` is a configuration error. Upstream's server-level `rewrite … last` needs no change to the generated vhost.
- **Leave purge to the plugin.** Rejected: nginx now answers from those files without consulting PHP, so a failed `wp rocket clean` would leave purged pages still being served.

## Gate amendment

Two frozen cases in `.agent-tests/sol-gates/test_cache_status_header_gates.py` failed against this change, and only for `wp-rocket`. `test_byo_plugins_emit_no_status_header` forbade a cache-status header because `$upstream_cache_status` is empty where no cache zone exists — a premise that no longer describes this option, though it still describes the other five. `test_snippet_opens_no_location_block` forbade a location block because one changes where `add_header` inheritance applies — reasoning that is still correct, and is precisely the hazard the implementation had to solve, but whose remedy was broader than its concern.

Both were narrowed to the options their premise still fits, with the reason recorded in the file, and each was replaced by a gate enforcing what it was standing in for: a permitted status header must be wired to a variable the snippet assigns more than one value, and a permitted location must re-emit every header it displaces, including HSTS exactly when the site has a certificate.

The amendment was mutation-tested. Four mutations were caught; a fifth was not. Deleting the single line `if ($wpfy_skip_cache = 1) { set $rocket_bypass 0; }` left every case green while making all six bypass conditions decorative. Gate 3 proves the conditions are still written down; nothing proved they were wired to anything. A gate tracing the rewrite's guard variable back to `$wpfy_skip_cache` now closes that.

## Consequences

- Anonymous cache hits for `wp-rocket` sites are served by nginx with no PHP, WordPress or MySQL involvement, and report `X-Wpfy-Cache: HIT`.
- The bypass invariant is enforced in one place for every page-cache option. A change to `_bypass_conditions()` now changes WP Rocket behaviour too.
- `wpfy cache purge` reports a `rocket` layer for these sites; a stopped site surfaces as an error on that layer rather than a silent stale cache.
- Cached pages carry the same security headers as every other response. If a header is added to the vhost it must be added to `BASE_SECURITY_HEADERS`, or cached pages will lose it.
- Sites that enable WP Rocket's separate mobile cache are honoured through the `.mobile-active` marker; sites that do not pay nothing for the check.
- wpfy tracks Rocket-Nginx 3.1.2. A WP Rocket release that changes the cache-file layout breaks hits, not correctness: an unresolved filename fails the `-f` test and falls back to PHP.
