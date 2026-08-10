# ADR 0032: Panel exposure — canonical host, ACME prerequisites, trust boundary, and atomic rollback

- Status: Accepted
- Date: 2026-08-10
- Extends: ADR 0021 gated panel exposure through the Traefik edge; ADR 0027 ACME contact email resolution and applied state; ADR 0028 trusting a forwarded client address in the panel
- Live evidence: `.omo/evidence/wpfy-fix-plan/task-15/` (release rehearsal, 2026-08-09/10, staging host)

## Context

ADR 0021 made external panel exposure opt-in, gated on named-user login, an enrolled TOTP factor, an exact typed confirmation, and a DNS/IP certificate preflight. The release rehearsal (Todo 15) exercised that surface against a real staging host and exposed three facts the earlier text did not pin down:

1. A canonical host is required, not optional. The rehearsal canonicalized `panel.wpfydev.top` (base `wpfydev.top`) on the staging host `155.94.241.76` with ACME contact `arnab@wpfy.org`; aliases are extra hostnames on the same certificate that must redirect to the canonical host rather than serving the panel directly.
2. The ACME contact is a hard prerequisite of exposure, not just of site SSL. The panel's own preflight path runs the static-config resolver check: every ACME resolver must carry an identical valid non-local contact email, and the `le-http` HTTP-01 resolver must exist on entryPoint `web`.
3. The HTTP→HTTPS redirect router is a live release gate. Traefik v3 rejects a router that declares no service, so the first rendered redirect router was refused and the rehearsal recorded `404` on port 80 for the panel host (live finding D1). The post-rehearsal hotfix pins the redirect router to the internal `noop@internal` service; that fix **requires deployment** and is not yet live.

## Decision

Record the exposure contract precisely, matching the implementation in `panel_exposure.py` and `panel.py`.

- **Loopback default, tunnel recommended.** The panel binds to `127.0.0.1` and is reachable only through an SSH tunnel until an operator deliberately exposes it. Exposure never changes the loopback default for ordinary `wpfy panel` runs.
- **Opt-in external exposure.** `wpfy panel expose --domain <host> --confirm <exact host> [--alias <host> ...]` is the only publication path. It refuses unless named-user login is required, at least one TOTP-enabled user exists, the typed confirmation matches the canonical host plus every sorted alias verbatim, and the DNS/IP preflight passes for the domain and every alias. The preflight is never skipped. If the exposure router file already exists and matches, exposure reports `already configured`.
- **Canonical host and aliases.** The canonical router is the only router that routes to the panel service. Alias routers receive SAN coverage on the canonical certificate and redirect to the canonical host via a permanent `redirectRegex`; an alias never serves panel content. The HTTP-to-HTTPS redirect router lives on entryPoint `web`, carries `service: noop@internal` (Traefik v3 requires a declared service), and cannot hijack the ACME HTTP-01 challenge because Traefik answers `/.well-known/acme-challenge/` before routers run.
- **ACME contact and preflight.** The static Traefik configuration must set one identical valid non-local ACME contact email on every resolver and define the `le-http` HTTP-01 resolver on entryPoint `web`; otherwise the exposure preflight fails with an actionable `wpfy stack acme-email you@example.com` hint. Configured addresses survive later renders (ADR 0027).
- **Trust boundary.** The panel believes forwarded identity only from the direct connection peer that belongs to the discovered `wpfy-panel-edge` network. `X-Forwarded-Proto` and `X-Forwarded-Host` feed the same-origin check only in edge-bind mode with a trusted peer; `X-Forwarded-For` feeds failed-login throttle keying only through the right-to-left trusted-chain walk (ADR 0028). Direct and loopback callers always resolve to plain HTTP plus the preserved Host header, and cannot spoof their throttle identity with a forged header.
- **Atomic rollback.** `wpfy panel expose --disable` removes the router file (written via temp file + `fsync` + `os.replace`, so publication is atomic) and the installed systemd service idempotently. `wpfy panel service install|remove` manages only the edge service unit. Router status is derived from the file, not bookkeeping: any router file present is reported as exposed, so a malformed or tampered file cannot produce a false "not exposed" assurance.
- **IPv6 is NOT VERIFIED.** No live host with global IPv6 has validated the exposed-panel path; the plan forbids reporting PASS without live IPv6 evidence.

## Alternatives considered

- Keep the panel tunnel-only with no exposure: rejected because operators with browser-only devices need a supported published path, and ADR 0021 already scoped the gated exposure.
- Let aliases serve the panel directly: rejected because a certificate-adjacent hostname serving a management surface is a standing cross-origin target; redirecting aliases to the canonical host keeps one origin authoritative.
- Emit the HTTP redirect router without a service: rejected by the live rehearsal — Traefik v3 refuses the configuration (finding D1).
- Skip the ACME contact check for the panel: rejected because Let's Encrypt registration requires a valid contact, and a silent registration failure is exactly the failure class the rehearsal gate exists to catch.
- Treat an unparseable router file as unpublished: rejected in ADR 0021 and retained — fail-safe exposure reporting is more important than precision.

## Consequences

- An exposed panel is only as strong as named-user login, mandatory TOTP, the exact typed confirmation, and the `wpfy-panel-edge` network grant. The network boundary is defense in depth, not the authentication boundary (ADR 0021).
- A valid ACME contact and the `le-http` HTTP-01 resolver are now documented prerequisites of exposure, enforced by the same preflight that protects site SSL.
- The HTTP→HTTPS redirect fix (D1, `noop@internal`) **requires deployment**. Until the hotfix is deployed, the live staging host returns `404` on port 80 for the panel host; documentation must not describe the redirect as live.
- IPv6 exposure remains unverified and must be reported `NOT VERIFIED` until a capable host is exercised.
- wpfy still installs no host firewall rules; host and provider firewall policy stays the operator's responsibility (ADR 0021). Loopback and SSH tunnelling remain the recommended access path.
- The offline suite proves gating, rendering, atomic write, and status derivation. It does not prove a real Traefik instance accepts the file-provider config or a real host's ACME/network environment; those require live validation, which the Todo 15 rehearsal now provides for the canonical staging host.
