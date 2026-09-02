# ADR 0037: SMTP alerting is deferred to v1.1; site credentials stay isolated

- Status: Accepted (scheduling; implementation deferred — see Consequences)
- Date: 2026-09-01

## Context

SMTP in v1 is transport-only. The panel stores transport settings and sends a
test message (`wpfy smtp status|test` and the panel SMTP page); nothing in wpfy
sends mail when an event or failure occurs. Event-driven alerting — "email me
when a backup fails, a container goes down, a certificate stops renewing" — is
a recurring request, but it has no isolation-safe design yet.

A naive design gives every site's containers (or site PHP) the operator's SMTP
credential so that any site can send an alert. That puts one shared secret
across mutually untrusted tenants: a compromised site could read the
credential, send mail as the operator, and pivot further. It cuts against the
per-site Compose isolation model (ADR 0002) and against the 2026-08-25 scope
decision that SMTP stays test-only in 1.0.

This ADR records the deferral and the constraints the eventual implementation
must satisfy. It deliberately does not settle the secrets design.

## Decision

**1. Production SMTP alerting is deferred to v1.1.** v1 ships transport-only
SMTP: stored transport settings plus explicit test sends. Nothing changes in
v1 by this ADR.

**2. The planned v1.1 direction is global SMTP configuration with per-site
propagation.** One place to configure the transport; alert-capable consumers
receive what they need through a propagation mechanism, not by mounting the
operator's raw credential everywhere.

**3. The final secrets storage and isolation design is deferred to an
implementation ADR.** That ADR must be written and accepted before any
alerting code ships. It must specify how each consumer receives the
credential without exposing it to other sites' containers, and it must define
rotation and rollback for the distribution mechanism.

**4. Hard constraint, effective now: production SMTP credentials must not be
shared directly across site containers.** No implementation may place the
operator's SMTP credential where another site's containers or PHP can read it.
The stored transport configuration remains a host-side, mode-0600 file outside
every site runtime.

## Alternatives considered

- **Ship alerting in 1.0 with a shared credential injected into every site
  container.** Rejected: one compromised tenant reads the transport
  credential and can send as the operator; this widens the exact blast radius
  ADR 0002 exists to bound, inside a stabilization release.
- **Defer SMTP entirely (remove the transport/test surface).** Rejected: the
  surface exists, is scoped, and is harmless; alerting, not transport, is the
  deferred part.
- **Per-site SMTP credentials only.** Rejected as the sole v1.1 answer — it
  burdens the operator and duplicates configuration — but the implementation
  ADR may include it in its option set (per-site credentials, a broker, or
  scoped distribution are all open).

## Consequences

- v1 operators who want notification must wire their own monitoring to
  `wpfy smtp test` or external tooling; wpfy sends nothing automatically.
- v1.1 alerting work starts from the implementation ADR, not code. Until that
  ADR exists, "global SMTP with per-site propagation" is a plan, not a
  design.
- The isolation wording stays honest: in v1 no path exists by which site code
  can reach the operator's SMTP credential, and this ADR forbids creating one
  in v1.1's implementation.
- Nothing here is validated at runtime — there is no runtime change. The v1.1
  implementation carries its own validation obligations in its ADR.
