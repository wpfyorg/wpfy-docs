# ADR 0036: IPv6 is enforced at the edge, not per site

- Status: Accepted (implemented 2026-08-26; live behaviour unproven — see Consequences)
- Date: 2026-08-26

## Context

wpfy enabled IPv6 on neither the Docker daemon nor any Docker network. Measured
on an IPv6-only Ubuntu 24.04 host on 2026-08-21:

- Inbound IPv6 to a published port was relayed by `docker-proxy` in userland. It
  never traversed `ip6tables FORWARD` / `DOCKER-USER`, so a correctly installed
  IPv6 ban rule sat at **0 packets** while the IPv4 chain counted normally. The
  Login Shield could not block an IPv6 client at all.
- Traefik saw **every** IPv6 client as `172.18.0.1`, the bridge gateway
  (confirmed by tcpdump on the bridge while curling from an external IPv6 host).
  Client identity was destroyed before anything wpfy owns could key on it. That
  is worse than "no rate limiting": the panel's token bucket and its sign-in
  throttle collapse into a **single shared key**, so one IPv6 client can exhaust
  the bucket for every other IPv6 client, and a ban lands on the gateway.
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

**3. Every claim of IPv6 protection is gated on the _running_ daemon, never on
the file wpfy just wrote.** Because (2) leaves a window where the file says
enabled and the daemon it describes still has IPv6 off, `daemon_ipv6_active()`
inspects the live default `bridge` network. Anything unknown — no Docker, no
permission, timeout, junk output — answers "not active".

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

**7. wpfy's own IPv6 addresses are never bannable.** `fc00::/7` and the `::`
sentinel join the never-ban set in the panel and in the WordPress bridge's
in-container `REMOTE_ADDR` redaction, mirroring the existing `172.16.0.0/12`
and `0.0.0.0` handling on the IPv4 side.

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
  degraded and names the reason.
- Stacks installed before this change keep IPv4-only edge networks until
  `wpfy stack ipv6-migrate --force` is run. `stack install` refuses to recreate
  them and prints that command.
- Enabling IPv6 on `wpfy-panel-edge` makes Docker report two IPAM configs on
  that network. `panel_edge_network_facts` previously required exactly one and
  would have hard-failed, taking `edge_bind_address` and domainless panel
  exposure with it; it now selects by address family (v4 preferred for the host
  bind and the ufw rule, v6-only networks still resolve). Two configs of the
  *same* family remain ambiguous and are still refused.
- ULA sources are never-ban, so an attacker who can originate from inside a
  wpfy Docker network is unbannable by this mechanism. That is already true on
  the IPv4 side and is accepted: reaching that position means container escape,
  which this control does not model.
- **Unproven live.** Everything above is covered by offline tests only. A green
  offline suite stubs `subprocess.run` and cannot show that the daemon accepts
  the merged `daemon.json`, that an IPv6 ban drops a packet (it previously sat
  at zero), or that Traefik reports a real IPv6 client address. Those belong to
  the validation-day gate and are not claimed here.
