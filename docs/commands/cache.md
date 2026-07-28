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
- `wp-rocket` — paid/BYO; wpfy stages server-side rules and does not install it.
- `flying-press` — paid/BYO; wpfy stages server-side rules and does not install it.

Free repository plugins are installed and activated through the site's WP-CLI service. Paid plugins return an awaiting-upload status and preserve operator-supplied files. Upload licensed BYO plugin files under:

```text
<site root>/app/wp-content/plugins/
```

For example, the site root is `/opt/wpfy/sites/example.com` on a default installation.

## Object cache

```text
wpfy cache example.com object redis
wpfy cache example.com object none
```

Redis Object Cache is installed, configured for the site's private `redis` Compose service, and enabled with WP-CLI. The generated Compose service has no `ports:` mapping and is not reachable through the host. `none` disables the plugin and removes the Redis service on the next scaffold refresh.

Page and object selection are independent, so this is valid:

```text
wpfy cache example.com set w3-total-cache
wpfy cache example.com object redis
```

## Purge

`purge` first attempts the active plugin's WP-CLI flush command. It then always clears wpfy's Nginx cache directories and the site's Redis layer when enabled. A missing or renamed plugin command does not prevent the owned layers from being cleared; an owned-layer failure returns non-zero.

## Create/update shortcuts

The site create and update surfaces retain the legacy flags `--wpfc`, `--wpsc`, `--wprocket`, `--wpce`, and `--wpredis`. New shortcuts are `--w3tc`, `--wpfastest`, and `--flyingpress`. `--wpredis` can be combined with a page-cache flag.

Legacy sites whose `.env` contains only `SITE_FLAVOR=wpfc` (or another legacy cache flavor) are migrated when loaded. A scaffold refresh writes canonical `SITE_FLAVOR=wp`, `PAGE_CACHE=...`, and `REDIS_ENABLED=1` where applicable.

## Safety and idempotency

Generated cache snippets bypass cache for logged-in, comment-author, and post-password cookies, POST requests, query strings, and `/wp-admin` paths. The `$wpfy_skip_cache` variable is consulted for both cache reads and cache stores. Generated snippets are trusted deterministic output from validated wpfy inputs and do not require a scaffold-time container validation round-trip. `nginx/extra/wpfy-cache.conf` is installed through a non-`.conf` candidate and atomic swap inside its directory mount; the individually mounted `nginx/cache-path.conf` is updated in place with no-follow protection so a running container sees the new bytes. A running site's reload failure is retried briefly for delayed shared-folder propagation, then returns non-zero if it remains rejected; `wpfy debug <domain>` reports the actionable Nginx error. Repeating the same command does not churn generated files.
