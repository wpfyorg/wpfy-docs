# ADR 0021: Gated panel exposure through the Traefik edge

- Status: Accepted
- Date: 2026-07-28
- Extends: ADR 0020 panel authentication, roles, and TOTP

## Context

The browser panel is a host process and initially listens only on loopback. Operators sometimes need to reach it through the existing Traefik edge, but publishing a management surface must not make the panel's bootstrap run token or a password-only account reachable from the internet.

The panel remains a host process rather than becoming a container. Making it a container would require access to the Docker socket and every site's directories to retain its management duties. That is the broad host access the locked isolation decision rejects.

## Decision

Use a dedicated Docker network named `wpfy-panel-edge`. Traefik joins this network and a host panel service binds only to its gateway address. The generated dynamic router targets that address and port through TLS-only `websecure`, an ACME resolver, and a small rate limit. The target must be a plain HTTP URL containing only an IP address and port; credentials, hostnames, paths, queries, and fragments are refused.

Exposure is an explicit operator action. It requires an exact confirmation of the domain, a passing DNS/IP certificate preflight, named-user login, and at least one enrolled TOTP factor. The panel service repeats those checks at bind time and also requires an active exposure-router file. A stale or manually restarted systemd unit therefore cannot republish the panel after exposure is disabled or the authentication prerequisites disappear.

The unauthenticated static login assets keep the panel CSP at `default-src 'self'; img-src 'self' data:; frame-ancestors 'none'`. They use external JavaScript listeners only: no inline script, inline handler, CDN, or relaxed script policy is permitted. This policy bounds what an XSS could do with the browser-held bearer token; role-aware UI hiding remains only a presentation affordance.

Router status is derived from the dynamic-router file, not bookkeeping. Any router file present is reported as exposed so a malformed, truncated, unreadable, or tampered file cannot cause a false assurance that the panel is unpublished. Parsed target details are reported separately as recognition metadata.

`wpfy` deliberately installs no UFW or other firewall rules. This preserves the project's no-host-mutation boundary; firewall policy remains an operator and provider responsibility.

## Alternatives considered

- Containerize the panel: rejected because granting it the Docker socket and every site directory would collapse the locked site-isolation boundary.
- Bind the host panel directly to a public interface: rejected because it bypasses Traefik TLS, certificate preflight, and the constrained exposure lifecycle.
- Treat an unparseable router file as unpublished: rejected because Traefik may still serve it; status must fail safe rather than conceal a possible publication.
- Add UFW rules automatically: rejected because `wpfy` deliberately does not manage host firewalls.

## Consequences

- The dedicated network narrows exposure, but does not eliminate host reachability: a container on a different bridge can still route to a host gateway IP.
- The controls that actually protect the published panel are mandatory named-user login and mandatory TOTP. The dedicated network is defense in depth, not the authentication boundary.
- The offline suite proves the gating decisions, rendered configuration, and refusal paths. It does not prove that a real Traefik instance accepts the file-provider configuration or routes from its container to the host gateway.
- Operators need real-Docker validation before relying on published-panel reachability, and remain responsible for any host or provider firewall policy.
