# ADR 0036: IPv6 is enforced at the edge, not per site

- Status: Accepted (implemented 2026-08-26; live-validated 2026-09-01 on Ubuntu 24.04 /
  Docker 29.7.2 — see Consequences. Two paths remain unexercised live and keep the
  validation PARTIAL: the `stack install` IPv4-only edge-network refusal, and the
  panel-edge real-IPv6 bind. Evidence: WPFY repo
  `docs/release-evidence/ipv6-validation-2026-09-01/`.)
- Date: 2026-08-26 (amended 2026-09-01 after validation day)

## Context

wpfy enabled IPv6 on neither the Docker daemon nor any Docker network. Measured
on an IPv6-only Ubuntu 24.04 host on 2026-08-21 (running an older Docker
engine; its version was not recorded on that host):

- On that host, inbound IPv6 to a published port was relayed by `docker-proxy`
  in userland. It never traversed `ip6tables FORWARD` / `DOCKER-USER`, so a
  correctly installed IPv6 ban rule sat at **0 packets** while the IPv4 chain
  counted normally. The Login Shield could not block an IPv6 client at all.
  **This behaviour is Docker-version-specific, not a property of IPv6.** The
  2026-09-01 validation on Docker 29.7.2 did **not** reproduce it: with
  `ip6tables` on, IPv6 REJECT rules matched real external traffic in both
  daemon states — a manual pre-restart ban counted **2 packets** and blocked
  `curl -6`, and the later organic ban's counter rose **0→2** (evidence:
  phase-0 `28`–`31`, phase-1–2 `08`–`11`). The historical finding is retained
  as an accurate record of that host's engine, not as a universal claim.
- On that same host, Traefik saw **every** IPv6 client as `172.18.0.1`, the
  bridge gateway (confirmed by tcpdump on the bridge while curling from an
  external IPv6 host). Client identity was destroyed before anything wpfy owns
  could key on it. That is worse than "no rate limiting": the panel's token
  bucket and its sign-in throttle collapse into a **single shared key**, so one
  IPv6 client can exhaust the bucket for every other IPv6 client, and a ban
  lands on the gateway. Under Docker 29.7.2 dual-stack (validated 2026-09-01),
  Traefik and nginx instead saw the real external client IPv6 end-to-end — the
  access-log field 1 was the client's own address, not the gateway.
- `wpfy security fail2ban status` reported `IPv6 protection: active` throughout,
  because it verified the rendered action, the `ip6tables DOCKER-USER` chain and
  the chain attachment — none of which establish that a packet ever arrives. The
  claim was withheld in rc6 as an interim honesty fix; the gap itself stayed.

The root cause is one daemon setting. The fix is host-level daemon
configuration plus a topology change to shared networks, so it gets an ADR.

## Decision

**1. wpfy manages `ipv6`, `ip6tables` and `fixed-cidr-v6` in
`/etc/docker/daemon.json`.** Merged, never clobbered: keys wpfy does not own
survive untouched, unparseable JSON is refused rather than overwritten, and the
file is backed up before the first write. `wpfy stack install` writes it;
`--ipv6` / `--no-ipv6` override the host-capability default.

**2. wpfy never restarts the Docker daemon.** A restart stops every container on
the host. The command tells the operator to run `systemctl restart docker`
themselves, and says what it costs.

**3. Every claim of IPv6 protection is gated on the _running_ daemon and both
shared edge networks, never on the file wpfy just wrote.** Because (2) leaves a
window where the file says enabled and the daemon it describes still has IPv6
off, `daemon_ipv6_active()` inspects the live default `bridge`, `wpfy`, and
`wpfy-panel-edge` networks. Anything unknown — no Docker, no permission,
timeout, missing network, junk output — answers "not active".

**4. All wpfy IPv6 subnets are `/64`s carved from one ULA prefix,
`fd4a:3b1c::/48`** (pseudo-random per RFC 4193). The 48→64 split leaves a 16-bit
index that is literally the fourth hextet. Reserved: index 0 = the daemon's
default bridge (`fixed-cidr-v6`), index 1 = the `wpfy` network, index 2 =
`wpfy-panel-edge`.

**5. Per-site networks stay IPv4-only.** They carry only
nginx↔php↔mariadb↔redis traffic, none of it reachable from outside the host, so
IPv6 there buys nothing — while a per-site subnet needs a per-site allocator.

**6. A live network that lacks IPv6 is refused, never silently recreated.**
`docker network create` cannot modify an existing network, and recreating one
disconnects every attached container. `wpfy stack ipv6-migrate --force` is the
only sanctioned path: it stops Traefik, recreates the edge networks, and starts
it again, disclosed as a maintenance window that takes every site offline.

**7. WPFY infrastructure IPv6 addresses are never bannable.** The WPFY
`fd4a:3b1c::/48` prefix, discovered edge endpoints, and the `::` sentinel join
the never-ban set in the panel and in the WordPress bridge's in-container
`REMOTE_ADDR` redaction. The wider `fc00::/7` is deliberately excluded:
unrelated operator Docker networks and routed ULA clients remain bannable.
Validated 2026-09-01 in its emission-side form only — the bridge mu-plugin's
redaction was confirmed in the running container. wpfy exposes no operator ban
CLI, so no operator-facing ban refusal is claimed by this decision.

## Alternatives considered

- **Hashing the Compose project name to a per-site `/64`** (the first
  implementation). Rejected: 65536 buckets collide at ~300 sites by the birthday
  bound, and two sites sharing a subnet is a cross-site isolation break. A hash
  over an unbounded domain cannot be *proven* collision-free; only allocation
  can. Superseded by decision 5, which removes the need entirely.
- **Deriving the per-site index from `SITE_UID`.** Rejected: `SITE_UID` is not
  dense from `SITE_UID_BASE` — `_allocate_site_uid` echoes whatever an existing
  `.env` holds, and legacy sites carry uids well below the base. Reusing it
  would have crashed compose rendering for every pre-existing site.
- **A second per-site allocation registry, modelled on `_allocate_site_uid`.**
  Rejected under decision 5: correct, but it is a second registry that can drift
  from the first, in service of a capability nothing needs.
- **Reading `/etc/docker/daemon.json` for the protection claim.** Rejected: that
  is precisely the false assurance rc6 withheld, restored in the other
  direction — claiming enforcement from wpfy's own intent rather than evidence.
- **Restarting Docker automatically after writing the config.** Rejected: an
  unannounced full-host outage in the middle of `stack install`.
- **Leaving IPv6 disabled and documenting it as unsupported.** Rejected: a host
  with public IPv6 is served over IPv6 whether wpfy models it or not. The
  address family was reachable and unprotected, not absent.

## Consequences

- Operators must restart Docker once, at a time they choose, before IPv6
  enforcement becomes real. Until then `fail2ban status` reports IPv6 as
  degraded and names the reason. Measured nuance (2026-09-01, Docker 29.7.2):
  while the running daemon still reported IPv6 off, the installed IPv6 rules
  already matched real traffic — the gate is therefore *conservative* on this
  Docker version (it withholds a claim that is partly true), not overstating.
  The design is retained: protection claims track the running daemon, never the
  file wpfy wrote.
- Stacks installed before this change keep IPv4-only edge networks until
  `wpfy stack ipv6-migrate --force` is run. `stack install` refuses to recreate
  them and prints that command. **This refusal path was never triggered live:**
  on Docker 29.7.2 both edge networks were created dual-stack at initial
  creation, so `_network_ipv6_mismatch` returned nothing to refuse. The branch
  exists in the source but remains unproven on a real host — see the retained
  exception below.
- Enabling IPv6 on `wpfy-panel-edge` makes Docker report two IPAM configs on
  that network. `panel_edge_network_facts` previously required exactly one and
  would have hard-failed, taking `edge_bind_address` and domainless panel
  exposure with it; it now selects by address family (v4 preferred for the host
  bind and the ufw rule, v6-only networks still resolve). Two configs of the
  *same* family remain ambiguous and are still refused. Validated live in its
  v4-selection form on 2026-09-01 (`panel_edge_network_facts` returned v4 facts
  against a dual-IPAM network); the **real-v6-bind branch was not exercised**
  and remains a residual gap.
- WPFY ULA sources and discovered edge endpoints are never-ban. Unrelated ULA
  sources are bannable, so an operator-created Docker network or routed ULA
  client cannot evade this control merely through address family selection.
  Validated on 2026-09-01 only in its emission-side form: the WordPress bridge
  mu-plugin redacts never-ban identities to a rejected sentinel. wpfy exposes
  **no operator ban CLI**, so there is no supported path for an operator ban
  attempt to be refused — a manual `fail2ban-client banip` bypasses wpfy and is
  not covered by this guarantee. The never-ban control is therefore not an
  operator-facing ban rejection, and this ADR does not claim one.
- **Live validation (2026-09-01, Ubuntu 24.04, Docker 29.7.2, Box A/B
  dual-stack, real Let's Encrypt certificates over both address families).**
  Proven: the daemon accepts the merged `daemon.json` and the post-restart
  stack self-recovered from a measured **36.7 s** full-stack outage; an
  **organic** IPv6 ban (5 real failed WordPress logins, no manual `banip`)
  blocked a real external IPv6 client (connection refused, chain counter
  **0→2 packets**) while IPv4 stayed served, and unban restored strict-verified
  v6 service; Traefik and nginx carried the real client IPv6 end-to-end with
  XFF spoofing defeated; no-force `ipv6-migrate` refused with zero mutation
  (exit 2) and the forced path ran in a measured **2.1 s** user-visible outage
  and is idempotent; runtime-hardening proofs passed `failures=0 skips=0`,
  including socket-proxy POST-mutation refusal (405) and neighbour healthz 403;
  `wpfy secure --all` passed against the running dual-stack. Claim 3 is
  **PARTIAL** only for the retained exception below.
- **Retained exception (validation PARTIAL).** The `stack install` refusal of
  still-IPv4-only edge networks (the exit-3 `_ipv6_migration_refusal` path) was
  not reproducible on the validated stack because Docker 29.7.2 created both
  edge networks dual-stack at initial creation — there was nothing to refuse.
  It exists in source, is covered offline, but has never fired on a real host.
  A second residual: the panel-edge real-IPv6 bind path
  (`validate_panel_edge_bind`'s IPv6 branch) was not exercised live. Neither gap
  is claimed as proven.
