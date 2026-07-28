# ADR 0020: Panel authentication, roles, and TOTP

- Status: Accepted
- Date: 2026-07-27
- Supersedes: ADR 0012's single-token, single-operator authorization decision

## Context

ADR 0012 established one centralized `authorize(principal, meta, domain)` seam while the loopback panel had one omnipotent run token. The panel now needs durable user accounts, browser login sessions, a real boundary between whole-system and assigned-site operators, and optional second-factor authentication. This must cover every existing route without moving policy into dozens of handlers or adding a runtime dependency.

The existing run token is printed in a URL and can survive in terminal scrollback or logs. It is acceptable only as fresh-install bootstrap behavior. Once named users and roles exist, retaining that full-admin credential would bypass every role restriction.

## Decision

Store panel users in `<config_dir>/panel-users.json` with mode `0600`. Each record contains a username, role, assigned site list, per-user scrypt salt and password hash, and an optional base32 TOTP seed. Read this file on every access because the CLI and panel are separate processes. Password verification uses `hashlib.scrypt` and constant-time comparison; unknown users perform the same KDF work against a dummy salt.

Keep sessions in panel-process memory only. Bearer session tokens have idle and absolute lifetimes, logout deletes the session, and a panel restart invalidates every session. Do not use cookies, so CSRF remains structurally outside this bearer-header design.

The static browser panel signs in through the login API and keeps only its bearer session token in `sessionStorage`. It reads the live principal from the `me` endpoint before rendering role-aware navigation; presentation never replaces `authorize()` and list filtering. The printed run-token fragment remains a bootstrap-only path: the client can use it for a fresh, userless panel, but it is neither persisted as a session nor accepted by the server once a user exists. Logout calls the API and clears the browser-held token.

Support two roles. Administrators may reach every authenticated route. Site managers may reach only declared identity/session actions, filtered site/job/event lists, and site-scoped routes whose path names an assigned domain. Site-scoped routes without a domain are administrator-only. Route authorization remains centralized and default-deny; list filtering and single-job ownership checks happen at the relevant transport handlers because those decisions depend on returned records rather than route metadata alone.

Use RFC 6238 TOTP with SHA-1, 30-second steps, six digits, and one step of skew. Enrollment is self-service for a live session and discloses the seed once. Store the last accepted step per user in memory and reject replay during the accepted step window. Administrators may disable another user's TOTP but cannot retrieve its seed. TOTP remains optional for the loopback-only panel, but ADR 0021 makes it mandatory, alongside named-user login, before an edge-bound panel service may bind.

Lock each username after five consecutive login failures for five minutes. A locked account rejects even the correct password. Lockouts are per username and are recorded in the existing redacted event log without credentials.

Keep the generated run token only while no panel user exists. The first user disables run-token authentication immediately, including for an already-running server, and `panel_url()` stops emitting the token fragment. Removing every user restores the bootstrap behavior.

Maintain the invariant that a non-empty user store always contains at least one administrator. Removing the final administrator or changing their role to `site-manager` is rejected by the shared user-store mutation layer, from both the CLI and API paths. Removing the final user entirely is allowed: the store becomes empty, `login_required()` returns false, and the generated run token is deliberately re-enabled as the documented bootstrap recovery path.

Panel user management is administrator-only, including changes to one's own password, role, and site assignments through the API. Self-service TOTP enrollment and disablement are the deliberate exception because sending a seed through another operator would weaken the second factor.

## Alternatives considered

- Keep the run token alongside users: rejected because it remains an unscoped administrator bypass retained in terminal history.
- Persist sessions for restart survival or remote revocation: rejected because it creates another credential store and lifecycle; restart invalidation is acceptable for this self-hosted panel.
- Use signed stateless tokens: rejected because logout, idle expiry, and immediate user removal or role changes require server-side state or revocation tracking anyway.
- Store TOTP seeds encrypted with a local key: rejected because the decrypting service must also hold that key on the same host, adding key management without protecting against host compromise.
- Permit self-service password or assignment changes: rejected because a site manager's own user record is a privilege-escalation surface; only TOTP ownership justifies a separate self-service route.
- Put role checks in handlers or enumerate all denied routes: rejected because forgotten and newly added routes would fail open.
- Add an authentication library or database: rejected to preserve the stdlib-only runtime and the current file-backed operating model.

## Consequences

- Panel restarts log out every operator. There is no session listing or remote session revocation interface.
- The TOTP seed is plaintext in a `0600` file. A shared secret must be recoverable by the verifier, so host/root compromise exposes it; the file mode protects against ordinary local users, not host compromise.
- Password and role changes become visible to a running panel without restart, and removed users lose session access on their next request.
- The user file is a second panel-owned secret store and must remain excluded from API responses, event details, backups intended for other sites, and diagnostic output.
- User administration stays simple and auditable, but even an operator changing their own password needs an administrator path rather than a self-service API.
- The last-administrator invariant prevents a non-empty store from bricking the panel; the empty-store transition remains the intentional run-token bootstrap recovery path.
- The offline suite proves password handling, session expiry, TOTP vectors/replay, the route role matrix, filtering, and run-token transition over a real loopback HTTP server. It does not prove behavior under a real multi-user deployment, hostile local scheduling, process crashes during writes, a real Traefik file-provider load, routing to a host gateway, or a compromised host. ADR 0021 covers the edge-exposure boundary.
- ADR 0012 remains authoritative for in-process jobs and append-only events, but its single-token and single-operator authorization state is superseded by this decision.
