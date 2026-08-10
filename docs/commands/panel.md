# `wpfy panel`

The loopback-only panel exposes site operations through an authenticated JSON API. Start it on the server and use an SSH tunnel for remote browser access; the panel does not bind to a public interface.

Each accepted panel connection has a 30-second idle socket timeout. A client that stalls while sending its request line or headers is disconnected before authentication can run; a legitimately slow client that pauses longer than 30 seconds must reconnect. Intentional HTTP/1.1 keep-alive is unaffected when the next request arrives within the idle timeout.

## Site field vocabularies

Site create/config requests accept PHP `php_version` values `7.4`, `8.0`,
`8.1`, `8.2`, `8.3`, or `8.4`; Let's Encrypt `letsencrypt` values `default`,
`wildcard`, or `off`; and `dns_provider` value `cloudflare`. The panel rejects
unknown values before it creates a job, and the shared site lifecycle validates
them again before preflight, rendering, or persistence.

## Token input

```text
wpfy panel --token-file <path>
WPFY_PANEL_TOKEN=<token> wpfy panel
```

The panel accepts the bearer token through `--token-file` or `WPFY_PANEL_TOKEN`. The file form keeps the token out of the process table. Raw `--token` values are refused because command-line arguments are visible in the process table.

## Panel exposure

The panel stays loopback-only by default; external access is opt-in through the Traefik edge (ADR 0021, ADR 0032). Command surface:

```text
wpfy panel expose --domain <host> --confirm <exact host> [--alias <host> ...] [--port N]
wpfy panel expose --status
wpfy panel expose --disable
wpfy panel service install|remove
```

Exposure is refused unless named-user login is required, at least one TOTP-enabled user exists, the typed `--confirm` matches the canonical host plus every sorted alias verbatim, and the DNS/IP preflight passes for the domain and every alias. A valid non-local ACME contact on every resolver plus the `le-http` HTTP-01 resolver on entryPoint `web` is a prerequisite enforced by the same preflight that protects site SSL; `wpfy stack acme-email` shows and sets it. The canonical host is the only host that serves the panel; `--alias` hostnames receive SAN coverage and redirect permanently to the canonical host. The HTTP-to-HTTPS redirect router is pinned to `service: noop@internal` (Traefik v3 rejects a service-less router); that fix requires deployment and is not live until a release containing it is deployed.

The panel believes `X-Forwarded-Proto`/`X-Forwarded-Host` for same-origin checks and `X-Forwarded-For` for failed-login throttle keying only when the direct peer belongs to the discovered `wpfy-panel-edge` network, walking the chain right-to-left past trusted hops (ADR 0028); direct and loopback callers cannot spoof their throttle identity. `wpfy panel expose --disable` removes the router file (written atomically) and the installed service — the complete rollback path. IPv6 external exposure is not verified; no live host with global IPv6 has validated the exposed panel.

## First-run setup

On an install with no panel users, `wpfy panel` prints a URL containing a run-token fragment. The browser uses that token to call:

```text
GET  /api/setup/status
POST /api/setup
POST /api/setup/totp
```

The account form requires first/last name, username, email, a password of at least 12 characters plus confirmation, and the licence/no-warranty acknowledgement. Anonymous telemetry is a separate optional checkbox and is selected by default. Email is stored for future recovery only; it is not verified and is not a login identifier.

`POST /api/setup` creates the first administrator and returns a temporary named-user setup session. Both account setup routes then return HTTP 410 permanently, including direct POST attempts. Setup creation returns 403 when the panel is edge-bound and tells the operator to use the SSH tunnel. Invalid submissions count toward the existing client throttle.

The TOTP step discloses one seed and QR code, verifies a real authenticator code before persistence, and then removes the setup privilege. Skip is available only after a second confirmation stating that `wpfy panel expose` will refuse without a factor. The exposure gate is unchanged.

Install state lives in `<config>/panel-state.json` at mode 0600. It records the stable install UUID, telemetry preference/last-send time, and licence acceptance identity/time/version. User records add first name, last name, and email; older records read with empty profile fields.

## Telemetry controls

```text
wpfy telemetry status
wpfy telemetry enable
wpfy telemetry disable
```

Status prints the real payload that would be sent: `install_id`, `wpfy_version`, `os`, `release`, `python_version`, `site_count`, and `active_sites`. No domain or other site/operator identifier is included. `WPFY_TELEMETRY=0` overrides stored state. The built-in endpoint is intentionally empty, so nothing is sent unless `WPFY_TELEMETRY_ENDPOINT` is configured.

## Cache endpoints

All cache routes are scoped to a managed WordPress site and require the panel bearer token.

```text
GET  /api/sites/<domain>/cache
PUT  /api/sites/<domain>/cache
POST /api/sites/<domain>/cache/purge
```

### Read cache state

`GET /api/sites/<domain>/cache` returns the selected `page_cache` and `object_cache`, the complete page-cache picker options, and the generated snippet path. Each page-cache option includes a `badge` of either `Free` (wpfy can install it) or `Bring your own` (the operator uploads and activates it). For a selected BYO plugin, `byo_plugin.files_present` reports whether the plugin directory exists under `app/wp-content/plugins/`.

The response also includes `object_cache_options` (`none` and `redis`) so page and object cache choices remain visibly independent.

### Preview and apply cache configuration

Send one or both cache axes to `PUT`:

```json
{
  "page_cache": "w3-total-cache",
  "object_cache": "redis",
  "dry_run": true
}
```

A dry run returns HTTP 200 with `state: "preview"`, `changes`, and the ordered operation plan. It does not write the site's `.env`, Compose file, nginx files, or WordPress configuration. Remove `dry_run` to apply the same payload. The apply sequence stages the site definition, then calls the accepted cache operation layer in this order:

1. `install_page_cache` (free plugins may be installed; BYO plugins are never downloaded).
2. `render_cache_nginx`.
3. `set_wp_cache_constants`.
4. `wire_redis_backend` when Redis is enabled or explicitly disabled.

A paid/BYO selection is a successful expected state, not an error: the response uses HTTP 200 and `state: "awaiting-upload"`, with an action message explaining that the server configuration is staged and the operator must upload the plugin. The panel displays the upload directory and the fact that the nginx rule and `WP_CACHE` are already staged.

### Purge cache

`POST /api/sites/<domain>/cache/purge` reports a result for each layer in `outcomes`:

- `plugin` — the active plugin's WP-CLI purge command, if one is known; FlyingPress uses its registered `purge-everything` subcommand;
- `nginx` — wpfy's owned nginx cache directories;
- `redis` — the site's Redis service when object caching is enabled.

Each layer reports its own status. A missing plugin command is reported as `skipped`, while owned-layer failures remain `error`. The `cache.purge` audit record preserves the same per-layer detail. When at least one applicable layer clears and another applicable layer does not, the overall purge outcome is `partial`, not `ok`; the layer name and message remain in the response and audit detail. A fully successful purge, including one with intentionally non-applicable layers, remains HTTP 200 with `state: "purged"`.

Responses contain cache metadata and operation outcomes only. They do not expose `.env` credentials or other site secrets.

## Security endpoints

```text
GET /api/sites/<domain>/security
PUT /api/sites/<domain>/security
```

`GET /security` returns the deny list, user-agent blocks, basic-auth enabled state and username, Cloudflare-only state, generated snippet path, the resolved trusted edge sources, and the Login Shield state (`fail2ban`, `login_shield`, `protected_surfaces`). It never returns a password or hash.

`PUT /security` accepts `deny_ips`, `ua_blocks`, `basic_auth`, `cloudflare_only`, `login_rate_limit`, and `fail2ban`. A request may also carry `dry_run` and `acknowledge_warnings`. Unknown fields are rejected, and all values pass through the accepted per-site security operation layer.

A dry run validates the complete desired state, runs `security_preflight`, and returns `changes`, planned `operations`, and `warnings` without calling a mutator. It therefore does not write `security.json`, the Nginx snippet, `nginx/htpasswd`, or Compose output.

Cloudflare-only lockout warnings are load-bearing. If DNS is not fully Cloudflare-proxied, an unacknowledged request returns the warning with `acknowledgement_required: true` and does not apply. The operator must send the same desired state with `acknowledge_warnings: true`; a genuinely proxied site applies without acknowledgement.

When basic auth is enabled without a supplied password, the apply response includes:

```json
{"one_time": {"password": "..."}}
```

The panel displays it in the existing one-time credential panel. Later reads expose only `{enabled, username}`, and the site stores only the `{SHA}` htpasswd value.

A successful apply response means the requested protection is active at the running edge, or explicitly staged when the site's `web` service is stopped. Snippet controls reload Nginx only when `web` is running; a stopped site reports that the configuration will apply when it starts. Cloudflare-only compares rendered labels with the running container and force-recreates `web` only when labels are stale or unreadable, so an already-applied state is not re-applied on an unchanged save. If application fails, the response is non-success and explains that configuration was staged but not applied. Repeating the same request retries the operation, including when the desired state was already persisted by a prior failed request. Runtime-skipped and unavailable-Docker operation remains offline-safe.

### Login Shield (Security tab)

The Security tab renders a Login Shield section with the header "Protect WordPress authentication using WP fail2ban and the server's Fail2ban service." It shows an enable checkbox, a status block, the protected surfaces (`wp_login, xmlrpc, rest, password_reset, user_enum, app_password`), and two static notes:

- "Only enabled sites can trigger Login Shield bans. A resulting HTTP ban may block the attacker from all websites on this WPFY server."
- "The panel's own fail2ban jail is host-managed and cannot be disabled here."

The `login_shield` status object carries `enabled`, plugin `{slug, version, ownership, auto_updates_disabled, active}`, host fail2ban installed/health, `jail_name`, `jail_active`, `event_log_path`, `event_log_health`, `last_detected_failure`, `recent_matched_failures`, `recent_bans`, `total_bans`, `ban_scope`, `trusted_proxy_health`, `ipv4_protection`, `ipv6_protection`, `config_validation`, `wpfy_chain_attached`, `action_stale`, `degraded_reason`, and `health`. Status is always read live, never from the preview.

The checkbox is dirty-tracked: only an actual change sends `PUT /security {"fail2ban": true|false}`. The panel route calls the same `set_fail2ban` operation layer as the CLI (host ensure, plugin install/deactivate, bridge guard, jail render, validate/reload, fixture proof, rollback); no business logic is duplicated in the panel. Preview change text is `enable WordPress fail2ban login shield` / `disable WordPress fail2ban login shield`; an unchanged toggle is a no-op. A degraded health (`health: degraded` plus `degraded_reason`, for example a stale Docker action or an out-of-band plugin deactivation) renders as a warn row while every other row stays visible. The payload never exposes the auth log, account hashes, client IPs, or any credential; only the last-detected-failure UTC timestamp surfaces.

## Cron endpoints

```text
GET    /api/sites/<domain>/cron
POST   /api/sites/<domain>/cron
PUT    /api/sites/<domain>/cron/<job_id>
DELETE /api/sites/<domain>/cron/<job_id>
POST   /api/sites/<domain>/cron/<job_id>/run
```

`GET /cron` returns `jobs` plus the site's derived `services` allowlist for the service picker. Each job includes `id`, `schedule`, `command`, `service`, `enabled`, `timeout`, and the latest matching run event when available.

`POST /cron` accepts a five-field `schedule`, `command`, optional `service` (default `app`), and optional `timeout` (default 300 seconds). The operation layer validates that the service belongs to this site; another site's container and the shared edge proxy are refused.

`PUT /cron/<job_id>` accepts one boolean `enabled` field. Delete removes the named job after UI confirmation. Run-now returns the real `outcome` (`ok`, `failed`, `timeout`, or `skipped`) plus message, duration, exit code, and ran/skipped flags. Its HTTP status follows the same operation-result convention as cache purge: `ok` returns 200, an unavailable-runtime `skipped` result returns 503, and `failed`, `timeout`, or any other non-success result returns 500. The panel preserves the structured payload on non-2xx responses, so the Cron tab still displays the specific skipped or failure outcome.

## Metrics, Events, and Services

The dashboard reads the accepted metrics operation layer and draws host CPU, memory, disk, and one-minute load for a server-reported range vocabulary. The per-site Activity tab uses the same endpoint for exact-domain samples and combines the charts with that site's event feed. If no samples exist, both views explain that the operator must install the sampler with `wpfy cron install` rather than presenting a blank plot.

```text
GET  /api/metrics?scope=<host|domain>&range=<30m|1h|3h|6h|12h|24h>
GET  /api/events?domain=<domain>&action=<action>&limit=<n>
GET  /api/system/services
POST /api/sites/<domain>/services/<service>/restart
POST /api/system/traefik/restart
```

`GET /api/metrics` returns the complete sample shape plus `ranges`. An unknown range is HTTP 400. An unknown scope is a successful exact-equality query with an empty `samples` list; it never widens to another scope.

The Events view filters by exact domain and action and keeps `job_id` visible for correlation. The endpoint response shape is unchanged.

The Services view reports the shared `wpfy-traefik` edge and the services derived for every managed site. A per-site restart accepts only the existing `site_cron` service allowlist for that site (`web`, `app`, and conditional `db`, `redis`, `sftp`, or `adminer`). Validation happens before the service reaches the Compose argument vector, so flag-shaped names, cross-site names, unavailable services, and `wpfy-traefik` are refused without running a restart.

The shared edge has a separate destructive route. It requires the exact JSON body `{"confirm":"wpfy-traefik"}`. The browser states that restarting the edge affects every site and enables the action only after the same typed confirmation.
