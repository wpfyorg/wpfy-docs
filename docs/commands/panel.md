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

### Setup without a domain (ADR 0033)

`wpfy panel expose --no-domain --confirm expose` prepares a public, self-signed panel on port 3939. It prints the URL with a one-time setup secret in the **fragment** (`https://<ip>:3939/#setup=…`), the certificate's SHA-256 fingerprint to check against the browser warning, and — when the firewall is active and the port is closed — the `ufw allow` command needed to reach it at all. Start it with `wpfy panel --public`, which re-derives the address the certificate was issued for; passing a public `--host` to a plain `wpfy panel` is refused.

Over that address the setup routes accept the secret **as the bearer token**, because a public panel prints no run token: the run token is a full admin grant and would land in the terminal and the systemd journal. The secret authorises the setup routes and nothing else (403 elsewhere), is burned by account creation, and expires after an hour. `GET /api/setup/status` reports `edge_bound: true` there.

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

## Client structure (rebuilt 2026-08-15, ADR 0032)

The client is a set of plain ES modules served from `panel_static/`, with no
build step. `panel.js` is the core — transport, session, router, confirmations,
job polling, event stream, and the shell chrome — and every page is a separate
module imported on first visit. Tabler 1.4.0 is vendored beside them
(`tabler.min.css`, `tabler.min.js`, `tabler.LICENSE`, `tabler.PROVENANCE.md`),
along with `qrcode.min.js` for TOTP enrolment. Nothing loads from a third-party
origin; the panel CSP is `default-src 'self'`.

Each page receives `ctx.params`, `ctx.mount`, `ctx.signal`, `ctx.header` and
`ctx.onLeave`. The signal is a per-navigation `AbortController`, so a response
that arrives after the operator has moved on is discarded rather than rendered
under the wrong site.

### Routes

```text
/dashboard                     /sites            /sites/new
/site/<domain>/<tab>           /events           /account/settings
/admin/users                   /admin/services   /admin/settings
/admin/instance                /admin/backup     /admin/firewall
/admin/mail                    /admin/basic-auth /admin/jobs/<id>
```

`/admin/jobs` redirects to `/events`; the jobs list is the header popover.
`/admin/notifications` redirects to `/admin/mail`.

### Site detail: five tabs

| Tab | Absorbs |
|---|---|
| Overview | Overview, Logs, Activity, Runtime, Services, SSL state |
| Settings | Config, PHP, Cache, Vhost, Security, and the delete danger zone |
| Data | Databases, Backups |
| Access | SFTP, Files, WP-CLI |
| Automation | Cron |

Every pre-rebuild tab path redirects onto one of these for one release, so
existing bookmarks and the links elsewhere in this document keep working.

### Running operations

Long operations return `202 {"job_id": ...}` and are polled at
`GET /api/jobs/<id>`. They are rendered in a header popover that lives in the
shell, so an operation started from one page stays visible after navigating
away. The progress bar is indeterminate: jobs append step strings and never
declare a total, so a percentage would be fabricated. `/admin/jobs/<id>` shows
the full step log for one operation.

Job state is held in memory. A panel restart loses in-flight jobs; polling then
returns 404 and the client says the panel restarted and points at Events, which
is the durable record.

## Firewall

```text
GET    /api/firewall
POST   /api/firewall/install
POST   /api/firewall/ports
DELETE /api/firewall/ports
POST   /api/firewall/enable
POST   /api/firewall/disable
```

`GET /api/firewall` returns both halves of the page: `enforcement` (fail2ban,
which bans addresses that misbehave) and `ports` (ufw, which decides whether a
connection is accepted at all). The `ports` object carries `installed`,
`active`, `checked`, the default policies, `ssh_port`, the parsed `rules`, and
the preset list. **`checked: false` means nothing was read** — ufw absent, the
probe failed, or the runtime skip is set — and `active: false` alongside it is
"not known", not "off".

wpfy does not install `ufw`. A host without it reports that and the command to
install it.

Two guards protect the connection the panel is reached over:

- `POST /api/firewall/enable` allows the SSH port before enabling the firewall.
  `ufw enable` applies default-deny the instant it runs, so a rule added
  afterwards would arrive over a connection that no longer exists.
- Denying the SSH port, or deleting the allow rule carrying it, requires
  `confirm` to equal the SSH port as a string. The port is read from
  `sshd_config`, so a host moved off 22 is guarded where it actually listens,
  and a range that contains it (`20:30`) is guarded too.

`POST /api/firewall/disable` requires `{"confirm": "disable"}`; it opens every
port on the host at once.

## Mail

```text
GET    /api/notifications/smtp
PUT    /api/notifications/smtp
POST   /api/notifications/smtp/test
DELETE /api/notifications/smtp
```

The page is called Mail, not Notifications: it configures an SMTP transport, and
nothing in wpfy sends mail on its own — `smtp.send_test_message` has one caller,
the explicit test. The page says so rather than implying an alerting engine
exists.

The password is write-only and never returned. A `PUT` with `password` omitted
or empty keeps the stored value; only a non-empty value replaces it. The first
write must supply one. `PUT /api/backup/remote` follows the same rule for
`secret_key`.
