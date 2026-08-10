# Runbook: WPFY Login Shield — operate, unban, repair, roll back

## Status
- Implemented. Live-verified end to end 2026-08-06/07 (16/16 checks PASS, real ban, rollback drill) and re-verified 2026-08-09/10 in the release rehearsal against the exact planned artifact (per-site ban on `DOCKER-USER`, untouched second site, SSH untouched, unban restores; evidence `.omo/evidence/wpfy-fix-plan/task-15/`).

## Goal
Operate WPFY Login Shield: inspect status, unban an IP, repair a degraded service, and recover from a bad configuration or an unintended ban.

## Background
Login Shield protects the panel login (always-on in-memory throttling plus host jail `wpfy-panel-auth`) and, per-site opt-in, WordPress authentication (wp-fail2ban plugin + WPFY bridge, per-site jail `wpfy-<sha256[:16]>`). Bans block TCP 80/443 through Docker's `DOCKER-USER` chain, server-wide. SSH (port 22) is never a ban target; root key login is the recovery path. Never-ban identities (loopback, Docker bridge, Cloudflare ranges when configured, Traefik edges, panel backend) are redacted and cannot be banned. See amended ADR 0023 and `SECURITY.md`.

## Inspect status

```bash
wpfy security fail2ban status                # host: panel jail, health, IPv4/IPv6, bans
wpfy site security <domain> fail2ban status  # per-site: plugin, jail, log health, bans
```

- Health `ok` / `degraded` (with reason) / `disabled`. `degraded` is expected while the Docker action is stale (IPv6-capable host, action rendered without IPv6 support) until `wpfy stack install --fail2ban` re-renders it, or when the plugin was deactivated out of band.
- `IPv6 protection: inactive` is the honest gated state, not a silent gap.
- "0 banned" clarity: `fail2ban-client status sshd` may show internet-scanner bans unrelated to WPFY. WPFY jails (`wpfy-panel-auth`, `wpfy-<hash>`) hold only Login Shield bans; both are clean after tests.

## Unban an IP

```bash
# Unban one IP from one WPFY jail
fail2ban-client set wpfy-panel-auth unbanip <ip>
fail2ban-client set wpfy-<sha256[:16]> unbanip <ip>

# Unban one IP from all WPFY jails (CLI; requires root or the wpfy wrapper)
wpfy security fail2ban unban <ip>

# Per-site: clear this site's WPFY jail bans and rebuild its config
wpfy site security <domain> fail2ban reset

# Admin-only flush of every ban
fail2ban-client flush
```

SSH recovery: root key login always works because the HTTP action never targets port 22.

## Repair

```bash
# Idempotent host repair: re-render WPFY configs, validate, reload
wpfy security fail2ban repair

# Repair the host install explicitly (same path as stack install)
wpfy stack install --fail2ban

# Per-site repair of missing jail/filter files
wpfy site security <domain> fail2ban on     # idempotent re-enable re-renders and validates
```

- `repair` emits `login_shield.repaired`; validation or reload failure records `login_shield.health_failed` and returns non-zero without changing state.
- A degraded host after a failed reload with a bad per-site jail: remove the WPFY jail file and restart the service, then repair:
  ```bash
  rm -f /etc/fail2ban/jail.d/wpfy-wordpress.conf
  systemctl restart fail2ban
  wpfy security fail2ban repair
  ```

## Rollback drill

1. Baseline: record sha256 of the WPFY filter before touching anything, e.g. `sha256sum /etc/fail2ban/filter.d/wpfy-panel-auth.conf`.
2. Break: append a duplicate `failregex` line to a WPFY filter file.
3. Detect: `fail2ban-client -t` reports `option 'failregex' ... already exists`; the service may also refuse to start.
4. Repair: `wpfy stack install --fail2ban` re-renders WPFY-owned configs.
5. Restore check: sha256 matches the baseline; `grep -c broken` returns 0; `fail2ban-client ping` returns `pong`.
6. Re-verify enforcement live with a controlled IP, then unban it.

## Troubleshooting

- **Jail never increments although failures occurred**: confirm the log path — the per-site jail tails only `<site>/security/wp-auth.log` (single logpath), the panel jail tails `/var/log/wpfy/panel-auth.log`. Verify records carry a real client IP: `client_ip=0.0.0.0` records are redacted identities and are never bannable.
- **fail2ban server exits at start with a regex exception**: fail2ban >= 1.0 requires `ip4`/`ip6`/`dns`/`fid` failure-id groups; `fail2ban-client -t` passes while the server start fails. Read `journalctl -u fail2ban -n 40` and `/var/log/fail2ban.log`; run `wpfy security fail2ban repair` to re-render validated filters.
- **CI/local regex gap**: `fail2ban-regex` is not present on macOS, so the live binary validation runs in CI (apt installs fail2ban, then runs `fail2ban-regex` over fixture logs). A filter that only passes `fail2ban-client -t` can still fail at jail start.
- **Blocked client sees ~1 s latency under a sustained burst**: this is the kernel ICMP reply rate limit on the `icmp-port-unreachable` reject action, bounded, not growing. `--reject-with tcp-reset` is the recommended future improvement.
- **Multi-site `wpfy wp` compose-run incident**: on hosts with several sites, `wpfy wp` (docker compose run) can recreate a site's db container and drop its `db` network alias, producing 500 "db does not resolve". Repair:
  ```bash
  docker network connect --alias db <site-network> <site>-db
  ```
  Verify with `wpfy site status <domain>` and a login flow. Flag for review: verify compose-run alias/network lifecycle under `wpfy wp` on multi-site hosts.
- **Ban scope nuance**: the DOCKER-USER ban blocks forwarded/foreign HTTP traffic. Traffic that originates host-locally, through docker-proxy userland, or from a compromised container is not blocked by the ban rule; treat a host compromise as full compromise.

## Recovery commands (record before any test ban)

```bash
fail2ban-client set <jail> unbanip <ip>    # one IP, one jail
fail2ban-client flush                       # admin only; every jail
wpfy security fail2ban unban <ip>           # one IP, all WPFY jails
```
