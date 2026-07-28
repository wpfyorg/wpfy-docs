# Runbook: Reach the panel — tunnel or expose

## Status
- Implemented. Tunnel is the default; exposure is opt-in and gated.

## Goal
Decide how you reach the browser control panel, and set it up.

## Choosing

The panel binds to `127.0.0.1` and is not reachable from the network. There are
two ways to get to it, and the right answer for most installs is the first one.

| | SSH tunnel | Traefik exposure |
|---|---|---|
| Setup | one command, nothing persisted | `wpfy panel expose`, a router, a cert |
| Public attack surface | none — the panel is not listening publicly | the panel login page is on the internet |
| Needs 2FA | no | yes, refused without it |
| Needs a DNS record + working ACME | no | yes, preflighted |
| Works from a phone | awkward | yes |
| Survives a laptop change | yes, if the key does | yes |

**Take the tunnel unless you actually need browser access from a device that
cannot hold an SSH key.** Exposure is supported and gated carefully, but the
tunnel removes the panel from the internet entirely, which no amount of gating
matches.

## Steps — tunnel (default)

1. On your workstation:
   ```
   ssh -L 8642:127.0.0.1:8642 <server>
   ```
2. Open `http://127.0.0.1:8642` locally.
3. Sign in with your panel user.

Nothing is installed and nothing is exposed. Close the SSH session to revoke
access.

## Steps — exposure (opt-in)

1. Create at least one named user and enrol a TOTP factor:
   ```
   wpfy panel user add <username> --role admin
   wpfy panel totp enable <username>
   ```
   Exposure is refused until a factor exists. This is not advisory — the command
   stops.
2. Point a DNS A/AAAA record for the panel domain at the VPS.
3. Configure the exposure router. The domain must be typed twice — `--confirm`
   has to match `--domain` exactly:
   ```
   wpfy panel expose --domain panel.example.com --confirm panel.example.com
   ```
   This runs the same DNS/IP preflight as site SSL and never skips it. It writes
   a Traefik file-provider router with TLS and a rate-limit middleware, on a
   dedicated `wpfy-panel-edge` network. The command reports router configuration,
   not public readiness.
4. **Install the panel service. This step is mandatory; the router returns 502
   without its backend:**
   ```
   wpfy panel service install
   ```
5. Check that both pieces are configured:
   ```
   wpfy panel expose --status
   ```
   The router must be `configured` and the service must be `installed` before
   the public URL is expected to work.
6. Reverse it at any time:
   ```
   wpfy panel expose --disable
   ```
   Idempotent — safe to run when nothing is exposed.

> `wpfy panel expose --status` reports the generated router, recognised domain,
> and whether the required panel service is installed. It is local configuration
> state, not a public network probe; verify the HTTPS URL after both pieces are
> configured. `expose --disable` remains the idempotent way to remove exposure.

## Firewalls

**wpfy does not manage your host firewall, and will not.** No UFW rules, no
iptables rules of its own, no ports opened or closed on your behalf. Host and
provider firewall policy stays yours, deliberately — a tool that silently edits
firewall rules can lock you out of your own machine, and wpfy has no way to know
what else the host is serving.

The one exception is scoped and explicit: if you enable per-site fail2ban, the
jail's own action inserts and removes ban rules in Docker's `DOCKER-USER` chain
while it is running. That is fail2ban acting, on a jail you turned on by name.

## Recovery

- Exposed the panel and want it gone now: `wpfy panel expose --disable`, then
  confirm the generated router file is absent from the Traefik dynamic
  configuration directory.
- Locked out by repeated failed logins: the lockout is time-based and clears on
  its own. Check `wpfy log events` for the recorded failures.
- Lost your TOTP device: an admin can clear another user's factor with
  `wpfy panel totp disable <username>`. If it was the only admin's factor and
  the panel is exposed, use the SSH tunnel to reach it.
- Restarted the panel and everyone is logged out: expected. Sessions are
  in-memory and do not survive a restart.
