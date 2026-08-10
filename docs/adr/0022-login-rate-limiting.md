# ADR 0022: Login rate limiting without login bans

- Status: Accepted
- Date: 2026-07-28
- Superseded in part: 2026-08-01 (ADR 0028) for the panel throttle key; see below
- Extends: ADR 0016 per-site security controls; ADR 0020 panel authentication

## Context

The panel's per-account lockout limits password guesses against one known user, but intentionally does not retain failures for unknown usernames. Every panel login still runs scrypt, so a client can consume CPU by spraying unknown names. WordPress `wp-login.php` is also a public brute-force target; `xmlrpc.php` is already blocked, but its login endpoint needs an operator-controlled limit.

The two surfaces have different trust and configuration boundaries. The panel can use the TCP peer address from its socket. Each site runs Nginx behind Traefik, so Nginx must first resolve the client address from the discovered wpfy edge CIDRs before a `$binary_remote_addr` limit is meaningful.

## Decision

Always apply an in-process, per-socket-peer cooldown to panel login failures. A throttled peer is refused before password verification or scrypt work, receives HTTP 429, and produces a redacted event. The panel does not use forwarding headers for this key. Account lockout remains separate and unchanged.

Make WordPress login limiting opt-in as `security.json` state named `login_rate_limit`. Each enabled site receives a deterministic, hash-derived request zone and connection zone in its own `nginx/wpfy-ratelimit.conf`; the Compose mount places this file in Nginx's HTTP context. The server-context security include adds `limit_req_status 429`, `limit_conn_status 429`, and an exact `location = /wp-login.php` using the site's zones.

That exact location repeats the PHP FastCGI directives, including `fastcgi_params`, `SCRIPT_FILENAME`, and `fastcgi_pass app:9000`. Exact Nginx locations take precedence over the generic PHP regex location: omitting the handler would serve the PHP file as a static asset and disclose source. This is prohibited.

The zone file uses `$binary_remote_addr`, a 1 MiB bounded zone per site, `1r/s`, `burst=5 nodelay`, and a five-connection cap. It is individually bind-mounted, so changes use an inode-preserving no-follow in-place write rather than `os.replace`. Enabling or disabling re-renders the site's Compose file so pre-existing sites gain the mount.

The server snippet emits `set_real_ip_from` for every discovered Traefik CIDR whenever either IP denial or login rate limiting needs real-client resolution, plus `real_ip_header X-Forwarded-For` and recursive resolution. CIDR discovery failure installs fail-closed rules rather than guessing a proxy source. A future operator-IP exception is noted but deliberately deferred.

## Superseded in part: 2026-08-01 — panel throttle key follows the trusted edge (ADR 0028)

The sentence in the Decision that the panel throttle "does not use forwarding
headers for this key" is superseded for the exposed-panel path. ADR 0028
records that the panel now keys failed-login throttling on a forwarded client
address when — and only when — the direct socket peer belongs to the discovered
`wpfy-panel-edge` network, walking the forwarded chain right-to-left past
trusted hops. The Nginx-side `$binary_remote_addr` decision in this ADR is
unchanged; the panel-side cooldown key is what ADR 0028 refines.

## Alternatives considered

- Use one shared Nginx zone: rejected because activity on one site would throttle another site.
- Put `limit_req_zone` in the security include: rejected because that include is inside `server {}`, while zones require HTTP context.
- Limit only through an exposed-panel Traefik route: rejected because the loopback panel remains reachable through SSH tunnels.
- Use `X-Forwarded-For` for the panel throttle: rejected because a direct client controls the header.
- Treat a panel throttle or Nginx leaky-bucket rejection as a permanent ban: rejected because recoverable operator mistakes must not create a support intervention or durable client denial of service.

## Consequences

- The panel has a client cooldown in addition to, not instead of, the account lockout. The cooldown bounds KDF work but expires automatically.
- Nginx's leaky bucket is likewise a short-term rate-control mechanism, not a wpfy IP ban. `limit_req` and `limit_conn` return 429 rather than Nginx's default 503.
- A live existing site needs `wpfy refresh <domain>` if it has not yet been re-rendered by toggling the feature, so its Compose file obtains the new HTTP-context zone-file mount. Using `wpfy site security <domain> login-rate-limit on|off` performs that re-render itself.
- The offline suite proves persisted-state validation, per-site zone isolation, generated FastCGI handling, and HTTP status selection. It does not prove a production Nginx image accepts the rendered configuration or a real Traefik deployment's client-IP chain; those require real-Docker validation.
