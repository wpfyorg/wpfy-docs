# ADR 0023: Per-site fail2ban access logs and narrow WordPress hardening

- Status: Accepted
- Date: 2026-07-28
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
