# ADR 0023: Per-site fail2ban access logs and narrow WordPress hardening

- Status: Accepted
- Date: 2026-07-28
- Amended: 2026-08-07 (WPFY Login Shield; see Amendment below)
- Extends: ADR 0016 per-site security controls; ADR 0022 login rate limiting

## Context

Nginx previously wrote every access record to container stdout. Host fail2ban therefore had no log file to read. A filter and jail can look installed while matching nothing, show zero bans forever, and be indistinguishable from a quiet week. This silent failure is more dangerous than a rejected Nginx configuration because neither Nginx nor fail2ban reports it as an error.

Nginx is behind the shared Traefik edge. Without trusted real-IP resolution, an access log records Traefik's bridge address rather than the client address. Banning that address would ban the edge proxy and take every site on the host offline. Also, connections to published container ports traverse Docker forwarding, not the host `INPUT` chain. A stock fail2ban iptables action aimed at `INPUT` would report bans that do not block container traffic.

WordPress also leaves a few high-impact public paths outside the existing generic secret-file protections: its installer and upgrader scripts, and backup-plugin archives commonly placed below `wp-content`.

## Decision

Every site bind-mounts one private `nginx/wpfy-access.log` into its Nginx container. Nginx writes that file in `combined` format, whose first field is the client address. The log is owned by the isolated site UID, mode `0640`, and receives a host logrotate policy using weekly rotation, a `maxsize 100M` ceiling, compression, twelve retained copies, and `copytruncate`. The log is per site; no site shares a log or a fail2ban jail with another site's traffic.

`copytruncate` is load-bearing rather than stylistic. The log is bind-mounted as a single file, so a rotation mode that renames it would leave the mount resolving the old inode and Nginx writing to an unlinked file indefinitely. The size ceiling is equally deliberate: a weekly interval is at its loosest exactly when a site is under sustained attack, and a full host disk takes down every site, which is a worse outage than the brute force the log exists to observe.

Scaffold code never decodes the access log. It contains attacker-influenced bytes — Nginx's default escaping passes `0x80`–`0xFF` through unaltered — and it is unbounded between rotations, so an existence check reads its metadata and never its contents.

Removing a site re-renders the aggregate jail file and drops the site's logrotate stanza. A jail section left pointing at a deleted log path is not inert: the jail file is shared by every enabled site, so one removed tenant could disturb another's protection on reload.

Every generated Nginx security snippet configures `set_real_ip_from` from the discovered wpfy Traefik CIDRs, `real_ip_header X-Forwarded-For`, and recursive forwarding resolution before access logging. Discovery failure returns a non-zero result for explicit features that depend on client identity (deny lists, rate limits, or fail2ban) and installs a loopback-only trust source plus `deny all`, rather than trusting a guessed proxy range.

`wpfy site security <domain> fail2ban on|off` is explicit opt-in. Enabling refuses before any state or configuration write unless `fail2ban-client` is present. The shared fixed filter is installed below `/etc/fail2ban/filter.d` and an aggregate generated jail file is installed below `/etc/fail2ban/jail.d`; normal test paths mirror those siblings of the redirected wpfy configuration root. Each enabled site has its own hashed jail section and its own exact log path. The generated action uses `iptables-multiport` with `chain=DOCKER-USER`, never `INPUT`. Wpfy does not install firewall rules: fail2ban owns only the jail action it is explicitly enabled to run.

The filter recognizes failed `POST /wp-login.php` responses (200, 401, or 403) in wpfy's own combined log output, and nothing else. Phase 7e gate B4 compiles the generated regex after substituting fail2ban's `<HOST>` placeholder, tests it against abusive log lines, and proves it does not match normal successful traffic. This makes the otherwise silent log/filter mismatch a test failure.

The filter deliberately carries **no `xmlrpc.php` rule**. Phase 7e originally shipped one keyed on HTTP 401 or 403, which no WordPress emits: a failed XML-RPC authentication returns HTTP 200 with an XML `<fault>` body, and `xmlrpc.php` never calls `status_header(401)`. The rule could not fire on any production log — the precise silent failure this ADR's context describes, and gate B4's own sample set was what asserted the wrong status. Widening the rule to match `POST /xmlrpc.php` regardless of status was rejected in turn: ordinary Jetpack and mobile-app clients clear `maxretry 5` inside `findtime 10m` without difficulty, so the rule would ban legitimate integrations — an availability regression caused by the security feature, the same failure class as banning the Traefik edge. `wp-login.php` is the brute-force surface wpfy defends; an operator who does not use XML-RPC should block the endpoint rather than ban its users. Gate B4 now pins a 200-status XML-RPC line as traffic the filter must **not** match, so a later widening fails the gate.

Nginx refuses only `/wp-admin/install.php`, `/wp-admin/upgrade.php`, and the known `wp-content` archive directories for UpdraftPlus and Sucuri. It explicitly sends `X-XSS-Protection: 0`. It does not broadly block `/wp-admin/`, `/wp-includes/`, `/wp-content/`, or normal PHP handling.

## Alternatives considered

- Use Docker's JSON stdout log for fail2ban: rejected because logs are shared operational artifacts rather than per-site inputs, and container log rotation does not give a stable per-site log path.
- Use the stock fail2ban `INPUT` action: rejected because Docker DNAT traffic bypasses it.
- Trust the Traefik container hostname or all bridge networks: rejected because a stale or broad trust source can cause an edge-wide ban.
- Install UFW rules or manage a host firewall: rejected. As ADR 0021 records, host and provider firewall policy remain the operator's responsibility.
- Copy a large public WordPress Nginx hardening gist: rejected because overlapping PHP blocks and broad URI substring rules break legitimate plugins and ordinary traffic.

## Consequences

- Existing sites need `wpfy refresh <domain>` once to recreate their Compose service with the new access-log bind mount. Enabling or disabling fail2ban already performs that re-render.
- Operators must install and run the host `fail2ban` package before enabling the feature. They should validate a production deployment with `fail2ban-client status` and the generated jail name after making failed test requests.
- The offline suite proves filter/log agreement, path isolation, state validation, action chain selection, access-log permissions, and inode preservation. It cannot prove that a production host's Docker, Nginx, fail2ban, and iptables versions accept and enforce the generated configuration; that requires real-host validation.

## Amendment 2026-08-07: WPFY Login Shield (Branch C, Docker action, panel jail, wp-fail2ban bridge)

Supersedes the 2026-07-28 text where the two conflict; the original decision remains accurate for the access-log and filter baseline.

### Branch C host install (idempotent, not refuse)

`wpfy site security <domain> fail2ban on` no longer refuses when `fail2ban-client` is absent; it calls `ensure_fail2ban_host()` (Branch C) and the same path backs `wpfy stack install --nginx`, `--all`, and `--fail2ban`. Order: apt install (lock timeout) when absent -> land WPFY-owned configs before service start -> in-process failure-id and jail-logpath validation -> `fail2ban-client -t` -> `systemctl enable --now` -> ping -> reload. Fresh-install failure rolls the package back; an existing install restores the previous WPFY-owned files and restarts the service so protection is never silently off. `/etc/fail2ban/jail.conf` and non-WPFY jails are never modified; distro jails such as `sshd` are reported, never edited. Enabling a site with a skipped/unhealthy host ensure still refuses cleanly with no partial state.

### WPFY-owned Docker action replaces stock iptables-multiport

Generated jails use `action = wpfy-docker-http[name=<jail>]` referencing `action.d/wpfy-docker-http.conf`, a WPFY-rendered action with one unique `f2b-wpfy-<name>` chain per jail (validated <= 28 chars). It attaches to `DOCKER-USER` with check-before-insert, bans with `REJECT --reject-with icmp-port-unreachable` on TCP 80/443 only, never touches `INPUT` or port 22, and removes only its own rules and empty chains. All commands use `iptables -w` / `ip6tables -w` (nft backend compatible). IPv6 is rendered only when the host is IPv6-capable; a rendered action embeds a marker, and `enforcement_status` reports `health: degraded` (`action stale`) until an IPv6-capable action is re-rendered, so there is no silent unprotected public IPv6.

### Panel authentication log and jail (the panel's own protection layer)

Panel auth failures append a strict six-key JSONL record to `/var/log/wpfy/panel-auth.log` (mode 0600, `O_NOFOLLOW`, in-process copytruncate rotation 10 MB x 3). Filter `wpfy-panel-auth` matches exactly `event=panel_auth_failure` with a real (non-`0.0.0.0`) client IP. Jail `wpfy-panel-auth` activates with the host install: maxretry 8 / findtime 10m / bantime 15m, `ignoreip 127.0.0.0/8 ::1`, action chain `f2b-wpfy-panel-auth`. The panel's in-memory throttling (Layer 1) remains active independently of fail2ban. Never-ban identities (loopback, Docker bridge, Cloudflare ranges when configured, Traefik edge addresses, panel backend) are redacted to the `0.0.0.0` sentinel at resolution and at emission; the sentinel is rejected by the filter, so edge identities can never be banned at the filter layer either.

### Per-site jail single logpath + wp-fail2ban bridge

Each enabled site's jail renders exactly one `logpath` = `<site>/security/wp-auth.log`. Two `logpath` keys (or a line-continuation that becomes `addlogpath p1 p2`) are rejected by fail2ban 1.0 at reload while `fail2ban-client -t` passes, so an in-process `validate_jail_logpath` guard runs before any write. The coarse nginx access-log backstop regex stays in the shared filter but is inert for per-site jails because they no longer tail the access log; the strict WordPress event path is authoritative. WordPress protection uses the official wp-fail2ban plugin 5.4.1 (pinned; per-file checksums verified, including array-shaped manifests; auto-update disabled) and a WPFY-owned MU-plugin bridge hooking the plugin's `Syslog::write` filter (4-argument contract: `$value, $level, $msg, $remote_addr`) and WordPress core `application_password_failed_authentication`. The bridge writes one JSONL record per failure (surface, `client_ip`, `account_hash`, `reason_class`), returns `true` to skip native syslog (unreachable from the Alpine PHP image), uses `REMOTE_ADDR` only (never forwarded headers), and is never fatal. Plugin ownership is recorded in `security.json`; disable deactivates only WPFY-owned activation and never uninstalls admin-installed plugins.

### fail2ban 1.0 failure-id groups (validated in-process)

fail2ban >= 1.0 requires a failure-id group (`fid`/`ip4`/`ip6`/`dns`) in every failregex; the legacy `(?P<host>...)` raises `RegexException` at jail start while `fail2ban-client -t` passes. WPFY strict JSONL filters use non-capturing `(?:(?P<ip4>...)|(?P<ip6>...))` groups, keep the `(?!0\.0\.0\.0")` never-ban guard, and are validated in-process before any `-t`; CI additionally runs the real `fail2ban-regex` binary against fixture logs. `host` groups are absent from strict filters (fail2ban 1.0 would not extract a ban IP from them).

## Amendment consequences

- `wpfy stack install --nginx|--all|--fail2ban` now manages host fail2ban; `wpfy security fail2ban status|repair|test|unban <ip>` and `wpfy site security <domain> fail2ban on|off|status|reset` are the operator surfaces. Bans are server-wide HTTP and disclosed verbatim.
- Live-verified 2026-08-06/07 on the dev host: 16/16 checks PASS (panel and per-site jail chains, real bans on `DOCKER-USER`, SSH untouched, unban restores, trusted-proxy spoofing fails safely, container recreation and fail2ban restart preserve enforcement), plus a rollback drill and measured performance.

## Amendment 2026-08-10: post-implementation gate truth (release rehearsal evidence)

The 2026-08-07 amendment described the implemented design and the dev-host verification. The Todo 15 release rehearsal (2026-08-09/10, staging host `155.94.241.76`, exact planned artifact; evidence in `.omo/evidence/wpfy-fix-plan/task-15/`) re-verified the Login Shield claims against a clean deploy and corrected nothing in the design text. Recorded truths:

- Re-verified live: 6 bad `wp-login` POSTs from an external client produced `wordpress_auth_failure` records in `<site>/security/wp-auth.log`, tripped the per-site jail (`f2b-wpfy-<sha256[:16]>` REJECT on `DOCKER-USER`, TCP 80/443, `icmp-port-unreachable`), and the next attempt returned 000. The panel jail `wpfy-panel-auth` banned and unbanned its rehearsal client; every ban/unban ran over SSH with the `sshd` jail untouched; `unbanip` restored site HTTP to 200 immediately. A second site with Login Shield untouched wrote a 0-byte `wp-auth.log` and had no jail. Never-ban identities (including forged `X-Forwarded-For`) still resolve to the `0.0.0.0` sentinel.
- **Gate truth (B5/B6):** the phase 7e gates `test_gate_the_jail_reads_the_log_the_site_writes` (B5) and `test_gate_the_ban_lands_in_the_docker_user_chain` (B6) assert the pre-amendment design and remain red (16 passed / 2 failed at this writing). B5 expects the per-site jail text to reference the Nginx access log, but the 2026-08-07 amendment makes `<site>/security/wp-auth.log` the single authoritative per-site `logpath` (the coarse access-log regex is inert for per-site jails). B6 expects `DOCKER-USER` to appear inline in the jail/filter text, but the amended action is rendered into `action.d/wpfy-docker-http.conf` and referenced by name (`action = wpfy-docker-http[name=...]`), so the string is not in the jail text. Both gates are stale probes, not security regressions: the rehearsal proves live `DOCKER-USER` enforcement and single-logpath tailing. Fixing the two gate expectations is tracked as release-blocking test maintenance because the audit treats them as a blocked release signal.
- Host install (Branch C) is idempotent on a clean host with no preinstalled fail2ban, matching the 2026-08-07 amendment's "install, not refuse" contract.
