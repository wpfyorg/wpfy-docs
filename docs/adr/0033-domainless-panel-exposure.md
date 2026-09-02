# ADR 0033: Publish the panel without a domain, over self-signed TLS

- Status: Accepted (implemented, validated on the VPS 2026-08-15)
- Date: 2026-08-15

## Context

`wpfy panel expose --domain` publishes the panel through Traefik with an ACME
certificate, gated on a typed domain confirmation, a named-user login, at least
one TOTP-enabled user, and a passing DNS preflight.

That path assumes a domain. Operators who have a VPS and no DNS name have no
supported way to reach the panel from anywhere but an SSH tunnel, which is the
mode `panel_setup.create_account` enforces by refusing outright when the panel is
edge-bound:

```
first-run setup is disabled while the panel is edge-bound; use the SSH tunnel
```

The request was for exposure without a domain — the panel answering on the
host's public address on port 3939 — with a printed URL carrying a secret that
gates first-run account creation.

Taken literally that combination is worse than either half. No CA issues
certificates for a bare IP address, so a domainless panel has no TLS, and
first-run setup sends a password and then a TOTP secret, after which every
request carries a bearer token. On the open internet all three are readable by
anyone on the path — including the gating secret itself, if it travels in the
URL as a query string.

## Decision

Ship the mode, with the transport fixed.

**Self-signed TLS, with a verifiable fingerprint.** `panel_tls.py` generates a
self-signed certificate through the `openssl` binary (already required by
`site_security` for password hashing, so no new runtime dependency) and the
panel wraps its own socket with it before the first `accept`. A bare address
gets an IP SAN, because browsers ignore the CN.

The browser will warn, and cannot be made not to. A warning an operator clicks
through blindly is worth close to nothing, so `expose --no-domain` prints the
certificate's SHA-256 fingerprint next to the URL. That converts the warning
from a nuisance into a check against the host that actually generated the key.
The certificate is generated once and reused: regenerating per start would
change the fingerprint the operator was told to verify, which teaches them to
stop verifying.

**A one-time setup secret replaces the tunnel.** The edge-bound refusal stands
unless the request carries the secret that `expose --no-domain` printed on the
host — the only place it is ever shown. Only its SHA-256 is persisted, so a
readable state file does not hand over the right to create the administrator. It
is compared with `secrets.compare_digest`, burned inside the same lock that
checked it so two racing requests cannot both win, and expires after an hour.
Without a secret the original refusal is unchanged, wording included.

**The secret travels in the URL fragment.** Browsers never transmit a fragment,
so it stays out of access logs, out of `Referer` headers, and out of anything a
proxy on the path records. The client reads it from `location.hash`, strips it
from the address bar immediately, and puts it in the request body itself. A
query string would have written an account-creation grant into every log between
the operator and the host.

**Panel basic auth guards the public router only.** A `basicAuth` middleware on
the panel's Traefik router, so a scanner reaching the public domain is refused
before the login form is served. It is deliberately not applied to loopback or
the tunnel: a forgotten credential must stay recoverable, and the tunnel is the
recovery path. Only the hash is stored, 0600, and a colon in the username is
rejected because it would forge a second field in the htpasswd line.

## Consequences

- This is a real relaxation of a deliberate decision, not an addition. Account
  creation over a public address was previously impossible; it is now possible
  with a secret. The secret's properties — single-use, hashed at rest, expiring,
  fragment-carried — are what makes that acceptable, and none of them is
  optional.
- The self-signed mode is strictly a stopgap. An operator who acquires a domain
  should move to `--domain`, where the certificate chains to a public root and
  the fingerprint ritual disappears.
- `openssl` becomes a hard requirement for this mode specifically. A host
  without it is told so and pointed at the domain path, rather than silently
  falling back to plaintext.
- **Validated on the VPS (155.94.241.76) on 2026-08-15**, which found five
  defects the offline suite could not see, because it builds `PanelConfig`
  directly and so never runs the command an operator would type:

  1. The mode was unreachable. `expose --no-domain` printed
     `wpfy panel --host <ip> --port 3939`; a non-loopback host without
     `--edge-service` is refused, and nothing set `self_signed_tls`, so the TLS
     this whole decision rests on was never wired. `wpfy panel --public` now
     re-derives the address the certificate was issued for.
  2. **First-run setup was ungated over the internet.** The secret requirement
     keyed off `edge_bind`, and a domainless panel is not edge-bound. An
     administrator was created on the VPS from a laptop with no secret at all.
     The condition is now "can this request have come from off the host".
  3. The printed setup link could not authenticate anything: the secret was
     only read from the request body, so the request carrying it got 401. It
     now authenticates the setup routes and nothing else, is checked without
     being spent, and a public panel prints no run token — that token is a full
     admin grant, and a public panel writes it into the terminal and journal.
  4. An active ufw blackholes the panel silently, because it is a host process
     while the Docker-published ports bypass ufw's INPUT chain entirely.
     `expose --no-domain` now reports a closed port and the command to open it.
  5. Panel basic auth rejected the correct password. sha512crypt is what nginx
     verifies for the per-site gate; Traefik's basicAuth understands MD5-APR1,
     SHA1 and bcrypt only, so it loaded the middleware without a log line and
     refused forever. Now APR1, verified through real Traefik: 401 / 401 / 200.

  Proven end to end afterwards: public-address detection, the IP SAN, the
  fingerprint agreeing with `openssl` and with what the browser is offered, the
  setup link creating the first administrator over the internet, that link
  being single-use, and the session working afterwards.

## Amendment, 2026-08-21: the panel now rate-limits its own requests

This ADR replaced Traefik's TLS with a self-signed certificate and a
fingerprint. It did not replace the other half of what routing through Traefik
bought. The panel router carries a `rateLimit` middleware
(`panel_exposure.RATE_LIMIT_AVERAGE`/`RATE_LIMIT_BURST`, 10/20); a panel bound
directly on 3939 never passes through Traefik and so inherited none of it.
Credential guessing was still priced by the login throttle and the scrypt
admission gate in `panel_auth`, but general request-rate protection was absent,
and this ADR did not say so. The README did.

The limiter now lives in `PanelHandler` itself, checked once per request from
`do_GET`/`do_POST`/`do_PUT`/`do_DELETE`/`do_PATCH`. Putting it in the handler
rather than behind a domainless branch is deliberate: domainless is where the
gap was visible, but the handler is where all three exposure modes converge, so
one guard covers Traefik-fronted, direct-bind, and loopback alike. Behind
Traefik it is a harmless second layer.

It is keyed on `resolve_client_address` — the same resolution login throttling
uses, which believes a forwarded header only from a trusted edge and walks the
chain right-to-left past our own hops. An attacker cannot prepend entries to
claim a fresh bucket, and cannot pin their cooldown onto someone else's address.

Two consequences worth recording:

- **The burst is a thread-spike, not just a counter.** The panel runs on
  `ThreadingHTTPServer`, which spawns a thread per request, so burst size is
  the concurrency an attacker gets before throttling engages. The default
  (burst 40, refill 10/s) is set with headroom over a measured cold boot of
  ~16 requests and deliberately *not* raised to accommodate callers that walk
  the whole API surface.
- **A full route sweep is not an operator access pattern.** Enumerating all
  101 routes in one pass is something this project's own gate tests in
  `tests/gates/` do, not something a panel user does. Those callers raise
  `PanelConfig.rate_limit_burst` for their own server instead of loosening the
  production default. The bucket table belongs to the handler built by
  `make_panel_server`, not to the module, so two panels in one process never
  share a budget.

Still not addressed: this is a per-address limiter with no global ceiling, so a
distributed flood is throttled per source and not in aggregate. The bucket table
is bounded by TTL-based pruning above a threshold, not by a hard cap.

## Amendment, 2026-08-23: basic-auth disable refuses when the router is not recognized

This ADR's exposure model assumes wpfy knows the router serving the panel.
When that holds, disabling panel basic auth is a two-step dance: remove the
credential, rewrite the router. The convergent version restores the
credential (bytes and mode) when the rewrite fails, so disk never claims
"disabled" while Traefik still prompts, and a retry repairs instead of
reporting "not configured".

The amendment covers the case where the assumption itself breaks: the panel
is exposed but `exposure_status()` cannot attribute it to a managed router
(`domain` is None -- a hand-edited router, a leftover from another tool, or
state wpfy does not recognize). The earlier fix silently skipped the rewrite
here and reported success after deleting the credential, which is exactly
wrong: an unmanaged router may still be enforcing basic auth from its own
embedded htpasswd source, and the operator just watched the panel tell them
it was gone.

Disable now treats unrecognized-router exposure like a failed rewrite: the
stored credential survives and the caller gets 409 with the cause. The
`GET`/`PUT` settings payload carries an `enforced` flag (exposed AND domain
recognized) so the UI can render stored-but-unenforced as Staged rather than
Enabled. Resolution of a genuinely stale router remains out-of-band by
design: wpfy refuses to guess at router state it does not own.
