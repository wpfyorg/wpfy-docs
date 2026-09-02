# ADR 0025: Run-token-authorized first-run panel setup

- Status: Accepted
- Date: 2026-07-28
- Extends: ADR 0020 panel authentication, roles, and TOTP

## Context

A fresh installation has no named panel user. ADR 0020 deliberately keeps the generated run token active in that state and retires it as soon as a user exists. The primary first-user path should be a browser wizard, but an endpoint that creates the first administrator must not remain available after configuration or become reachable through the edge-bound panel.

The original proposal assumed a userless panel accepted every API request without authentication and therefore called for an unconfigured-state API lockdown. Direct verification showed the opposite: every API route already requires the run token, and the server refuses to start without a non-empty token. Changing that contract would have contradicted the immutable anti-vacuity gates that prove the run token works before the first user exists and dies afterwards.

## Decision

Keep the existing authentication model unchanged. The wizard's static shell is public like the existing login shell, while `GET /api/setup/status` and `POST /api/setup` require the run token printed by `wpfy panel`. Do not narrow the run token's other pre-setup permissions in this change.

`POST /api/setup` requires first name, last name, username, email, password plus confirmation, a separate licence acknowledgement, and a separate optional telemetry choice. Email validation is shape-only and username remains the login identity. Passwords must be at least 12 characters; this blocks obvious short credentials without imposing composition rules that encourage predictable substitutions.

Create the first user as an administrator, persist the profile fields in the mode-0600 user store, record licence acceptance and install-scoped state in a separate mode-0600 `panel-state.json`, then open an in-memory setup session. Once the user exists, `GET /api/setup/status` and `POST /api/setup` return HTTP 410 regardless of credential. They are not reusable administration routes.

Refuse setup creation when `PanelConfig.edge_bind` is true and direct the operator to the SSH tunnel. Count invalid setup submissions through the existing client-failure throttle rather than adding a separate limiter.

The second wizard step uses the setup session. Generate a TOTP seed in memory, disclose it once, and persist it only after a valid six-digit RFC 6238 code is verified. Skipping requires a second explicit confirmation that states exposure will remain unavailable; the existing exposure gate is unchanged. Finishing or skipping retires the setup-session privilege. Record only `panel.setup.completed`, `panel.totp.enrolled`, or `panel.totp.skipped` events, without password, seed, or email.

Vendor QRCode.js 1.0.0 at an exact upstream commit under the existing static directory, with its MIT licence, source URL, and SHA-256. The local script uses canvas/data-image output and requires no CSP relaxation, dependency, or network request.

## Alternatives considered

- Make setup unauthenticated: rejected because it would expose an administrator-minting endpoint to any process that can reach the listener.
- Lock every other API route before setup: rejected because the premise was false, the run token already authenticates those routes, and changing it would require a separate security decision and gate amendment.
- Keep setup available to administrators after first use: rejected because account recovery already has the CLI and a reusable setup route becomes a privilege-escalation path.
- Allow edge-bound first-run setup: rejected because a premature router must not publish account creation to the internet.
- Store the TOTP seed before verification: rejected because an unusable factor is discovered only at lockout time.
- Bundle licence and telemetry consent: rejected because one checkbox must carry one meaning.

## Consequences

- The run token remains powerful until the first user is created. Narrowing that bootstrap capability is defensible future hardening, but deliberately outside this decision.
- Losing the one-time TOTP disclosure requires restarting the setup path through CLI recovery; the seed is never returned again.
- Skipping TOTP leaves loopback/tunnel access working, but `wpfy panel expose` continues to refuse publication.
- Old user records without profile fields read as empty profile values and are not rewritten destructively.
- The offline suite proves closure, edge refusal, throttling, password/licence validation, verified enrollment, explicit skip, file modes, legacy reads, and event secrecy. Live browser and authenticator proof remains a separate release check.
