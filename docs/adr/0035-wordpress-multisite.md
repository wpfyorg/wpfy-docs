# ADR 0035: Schedule WordPress Multisite for 1.1 with both modes

- Status: Accepted (scheduling decision only; implementation not started)
- Date: 2026-08-25
- Owner: Product maintainer
- Target: WPFY 1.1

## Context

WordPress Multisite is a recurring operator request, but it does not map
cleanly onto wpfy's two standing guarantees:

1. Per-site isolation: one Compose project, database, Redis instance, writable
   volume set, and UID/GID per WPFY site. A multisite network's child sites
   live inside one WordPress installation and therefore share one runtime and
   one database.
2. Preflight-gated certificate issuance: ACME is attempted only after DNS/IP
   preflight passes. Subdomain networks cannot route or certify their children
   without a wildcard DNS record and a wildcard certificate path, neither of
   which the current single-site flow provisions or verifies.

No implementation evidence exists yet, offline or on a disposable VPS.

## Decision

WordPress Multisite is scheduled for WPFY 1.1 and will support both modes:

- **Subdirectory** mode.
- **Subdomain** mode, gated on hard preconditions evaluated before any
  mutation (scaffold, runtime, or WordPress):
  - a Cloudflare DNS wildcard record for the network's domain pointing at the
    VPS, and
  - a wildcard TLS preflight that passes before anything is written.

Two obligations ship with the feature:

- **Disclosure:** the product must state plainly that a network's child sites
  share one WPFY site runtime and one database. Separately managed WPFY sites
  remain isolated from each other exactly as today; multisite does not weaken
  the per-WPFY-site isolation rule.
- **Evidence gate:** implementation is blocked pending offline tests plus a
  disposable-VPS pass. This ADR records a scheduling decision and makes no
  implementation or validation claim.

Owner: product maintainer.

## Alternatives considered

- Ship multisite in 1.0: rejected — 1.0 is the stabilization window and no
  runtime evidence exists.
- Subdirectory-only in 1.1: rejected — operators need subdomain networks, and
  deferring the mode would force a disruptive second migration later.
- Present network children as isolated WPFY sites: rejected — false, and it
  would misstate the isolation boundary the product is built on.

## Consequences

- Compatibility: additive in 1.1. Existing single-site behavior and the
  per-WPFY-site isolation guarantees are unchanged.
- Migration: none defined yet. Whether an existing single site can be
  converted into a network is part of the 1.1 design and needs its own
  evidence.
- Rollback: nothing is implemented, so nothing rolls back. A future
  implementation must define rollback for partially provisioned networks
  before it ships.
