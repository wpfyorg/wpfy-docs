# `wpfy cache`

Manage native WordPress page-cache and object-cache integrations for one managed site.

## Syntax

```text
wpfy cache <domain> show
wpfy cache <domain> set <plugin>
wpfy cache <domain> object redis|none
wpfy cache <domain> purge
```

## Page-cache plugins

`set` accepts:

- `none` — disable page caching and remove the generated `nginx/extra/wpfy-cache.conf` include.
- `wpfc` — wpfy's per-site Nginx FastCGI cache plus `nginx-helper`.
- `wp-super-cache`
- `w3-total-cache`
- `cache-enabler`
- `wp-fastest-cache`
- `wp-rocket` — paid/BYO; wpfy stages server-side rules and does not install it. Nginx additionally serves WP Rocket's cached HTML directly (see below).
- `flying-press` — paid/BYO; wpfy stages server-side rules and does not install it.

Free repository plugins are installed and activated through the site's WP-CLI service. Paid plugins return an awaiting-upload status and preserve operator-supplied files. Upload licensed BYO plugin files under:

```text
<site root>/app/wp-content/plugins/
```

For example, the site root is `/opt/wpfy/sites/example.com` on a default installation.

## WP Rocket static serving

When the page cache is `wp-rocket`, the generated `nginx/extra/wpfy-cache.conf` also carries an adapted [Rocket-Nginx](https://github.com/satellitewp/rocket-nginx) 3.1.2 block (MIT). Nginx resolves WP Rocket's own cache file for the request and, if it exists, serves it directly — PHP, WordPress and MySQL are not involved. Responses carry `X-Wpfy-Cache: HIT` when the file was served and `MISS` otherwise. See ADR 0029.

wpfy's own bypass rules decide eligibility; the rocket block only resolves the filename. A request is never served from the static cache when it carries a `wordpress_logged_in`, `comment_author`, or `wp-postpass` cookie, when it is a POST, when it carries any query string, or when the path is under `/wp-admin`. It also falls back to PHP when the site is in maintenance mode. HTTPS and separate-mobile-cache variants are honoured; pre-gzipped `.html_gzip` companions are deliberately not served, and nginx compresses the plain file instead.

Two consequences worth knowing:

- Any query string bypasses the cache, including tracking parameters such as `?utm_source=…`. Upstream Rocket-Nginx strips a configurable list of these; wpfy does not, because its cache-bypass invariant treats every query string as potentially personalised.
- Cached pages are served with `Vary: Accept-Encoding, Cookie` and `Cache-Control: no-cache, no-store, must-revalidate` so a proxy in front of the site cannot merge the anonymous cached copy with a logged-in response, or retain a copy after a purge.

The block is inert until WP Rocket is uploaded and generating cache files: with no cache file present every request falls through to PHP exactly as before.

## Object cache

```text
wpfy cache example.com object redis
wpfy cache example.com object none
```

Redis Object Cache is installed, configured for the site's private `redis` Compose service, and enabled with WP-CLI. The generated Compose service has no `ports:` mapping and is not reachable through the host. `none` disables the plugin, removes the Redis service on the next scaffold refresh, and does not leave the previous Redis container running.

Page and object selection are independent, so this is valid:

```text
wpfy cache example.com set w3-total-cache
wpfy cache example.com object redis
```

## Purge

`purge` first attempts the active plugin's WP-CLI purge command. FlyingPress uses the registered `purge-everything` subcommand. It then always clears wpfy's Nginx cache directories and the site's Redis layer when enabled. On `wp-rocket` sites it also deletes WP Rocket's cached files from disk as a separate `rocket` layer, regardless of whether the plugin command succeeded — Nginx serves those files without consulting PHP, so a failed `wp rocket clean` would otherwise leave purged pages still being served. The result reports each layer separately (`plugin`, `rocket` on WP Rocket sites, `nginx`, and `redis` when enabled), including skipped or error status. If at least one applicable layer clears and another applicable layer does not, the overall outcome is `partial` rather than `ok`; an owned-layer failure still returns non-zero.

## Create/update shortcuts

The site create and update surfaces retain the legacy flags `--wpfc`, `--wpsc`, `--wprocket`, `--wpce`, and `--wpredis`. New shortcuts are `--w3tc`, `--wpfastest`, and `--flyingpress`. `--wpredis` can be combined with a page-cache flag.

Legacy sites whose `.env` contains only `SITE_FLAVOR=wpfc` (or another legacy cache flavor) are migrated when loaded. A scaffold refresh writes canonical `SITE_FLAVOR=wp`, `PAGE_CACHE=...`, and `REDIS_ENABLED=1` where applicable.

## Safety and idempotency

Generated cache snippets bypass cache for logged-in, comment-author, and post-password cookies, POST requests, query strings, and `/wp-admin` paths. The `$wpfy_skip_cache` variable is consulted for both cache reads and cache stores. Generated snippets are trusted deterministic output from validated wpfy inputs and do not require a scaffold-time container validation round-trip. `nginx/extra/wpfy-cache.conf` is installed through a non-`.conf` candidate and atomic swap inside its directory mount; the individually mounted `nginx/cache-path.conf` is updated in place with no-follow protection so a running container sees the new bytes. A running site's reload failure is retried briefly for delayed shared-folder propagation, then returns non-zero if it remains rejected; `wpfy debug <domain>` reports the actionable Nginx error. Repeating the same command does not churn generated files.
