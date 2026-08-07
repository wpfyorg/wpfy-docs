# `wpfy security fail2ban` (host Login Shield)

## Purpose
Operate the shared host Fail2ban service that backs WPFY Login Shield: inspect host status, repair the WPFY-managed configuration, run a controlled fixture-level test, and unban an IP. The command group is distinct from `wpfy secure` (read-only audit) and `wpfy site security <domain>` (per-site controls).

## Status
- Implemented.

## Syntax
```bash
wpfy security fail2ban status
wpfy security fail2ban repair
wpfy security fail2ban test
wpfy security fail2ban unban <ip>
```

## Per-site surface
```bash
wpfy site security <domain> fail2ban on
wpfy site security <domain> fail2ban off
wpfy site security <domain> fail2ban status
wpfy site security <domain> fail2ban reset
```

## Details
- `wpfy security fail2ban status` reports host Fail2ban health, the panel jail (`wpfy-panel-auth`), jail activity, event-log health, recent matched failures and bans, trusted-proxy health, IPv4/IPv6 enforcement, configuration validation, and the exact ban-scope disclosure. Health reports `degraded` with a reason while a stale Docker action (IPv6-capable host, action rendered without IPv6) or an out-of-band plugin deactivation exists.
- `wpfy security fail2ban repair` idempotently ensures the host install (package if absent, WPFY-owned configs, validation, service, ping, reload) and re-renders WPFY configs. Emits `login_shield.repaired` on success.
- `wpfy security fail2ban test` compiles the strict panel and WordPress auth regexes against controlled TEST-NET-3 records, asserts host extraction, and checks the panel jail is active over `panel-auth.log`. Fixture-level only; no real ban is issued.
- `wpfy security fail2ban unban <ip>` releases the address from every WPFY jail (`wpfy-panel-auth` plus all enabled per-site `wpfy-<sha256[:16]>` jails). It never touches administrator-owned jails. Requires root or the wpfy wrapper; invalid IPs exit 2. Emits `login_shield.unban` when at least one jail released the address.
- Per-site `fail2ban status` shows the same field surface for one site; `fail2ban reset` clears only that site's WPFY jail bans and rebuilds that site's config, and is a no-op message on a disabled site.

## Examples
```bash
wpfy security fail2ban status
wpfy security fail2ban unban 203.0.113.8
wpfy site security shop.example.com fail2ban on
wpfy site security shop.example.com fail2ban status
wpfy site security shop.example.com fail2ban reset
```

## Idempotency Behaviour
- `repair` and the per-site `reset`/`on`/`off` lifecycle are idempotent; repeat runs converge without duplicate bans or duplicate event records.

## Security Notes
- Never-ban identities (loopback, Docker bridge, Cloudflare ranges when configured, Traefik edge, panel backend) are redacted at emission and rejected by the filter; Fail2ban `ignoreip` stays loopback-only.
- Bans block TCP 80/443 via Docker's `DOCKER-USER` chain only; SSH is never a ban target.
- WPFY never modifies `/etc/fail2ban/jail.conf` or administrator-owned jails; `unban` targets WPFY jails only.
