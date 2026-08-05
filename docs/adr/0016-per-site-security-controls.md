# ADR 0016: Per-site security controls and generated Nginx rules

- Status: Accepted
- Date: 2026-07-24

## Context

Per-site deny lists and user-agent blocks are evaluated by the site's Nginx container, but requests arrive from the shared Traefik edge proxy. Without real-client-IP resolution, every access rule sees the proxy address instead of the visitor. Conversely, trusting every possible source for forwarded headers makes the header attacker-controlled and turns a deny list into a bypass.

The rules are rendered into an Nginx include that wpfy owns. The include directory is mounted read-only into the web container, and scaffold generation can happen before a runtime exists. Operator-supplied `custom.conf` therefore has a different trust boundary from deterministic rules rendered from validated wpfy state.

## Decision

Persist per-site security state in `<site>/security.json`. The JSON is authoritative and contains normalized `deny_ips` and `ua_blocks` lists. The derived `<site>/nginx/extra/wpfy-security.conf` is regenerated from that state on scaffold creation, refresh, and security mutations. Writes are atomic and no-follow; invalid input is rejected before state or generated configuration is changed.

Generated security rules are trusted wpfy output. They are written directly and deterministically, without a container `nginx -t` round-trip. This matches the Phase 3 generated-cache decision: a candidate filename cannot be mounted into the read-only include directory, and validation can fail before an `app` upstream or runtime exists. `custom.conf` remains operator-owned and keeps fail-closed validate-then-swap behavior.

The real-IP preamble trusts Traefik's discovered host address(es) on the Docker `wpfy` edge network:

```nginx
set_real_ip_from 172.18.0.2/32; # example only; discovered per host
real_ip_header X-Forwarded-For;
real_ip_recursive on;
```

The addresses are read from `docker inspect wpfy-traefik` for its `wpfy` attachment and rendered as `/32` and `/128` sources; wpfy never hardcodes or guesses them. A whole edge subnet would let any neighbouring site forge forwarded client data. Edge startup re-renders every managed site's trust snippets after Traefik is healthy and reloads only changed running nginx services, so a recreate picks up its new address. If that refresh fails, edge start reports failure and the previous site configuration remains in effect; retrying start converges. When a site is Cloudflare-proxied, the published Cloudflare CIDRs are trusted as an additional hop in both real-IP and forwarded-scheme rendering. If discovery fails, wpfy installs a loopback-only trust source plus `deny all` and returns a non-zero result. Wildcard sources such as `0.0.0.0/0` and `::/0` are refused because they allow a visitor to forge the forwarded address used by the deny list.

CIDRs are parsed with `ipaddress.ip_network(..., strict=False)`, canonicalized, and rejected when they are empty, invalid, or a `/0` network. User-agent patterns use a conservative ASCII allowlist for quoted Nginx regexes. The allowlist excludes quotes, backslashes, semicolons, braces, NULs, and line breaks, so accepted input cannot terminate the quoted regex or inject a second directive.

Basic authentication state is authoritative in `security.json`, while the credential hash is kept at `<site>/nginx/htpasswd`, outside the served `app/` document root. The file is mounted read-only at `/etc/nginx/wpfy-htpasswd` and uses mode `0640` with the site's Unix uid. Because it is an individual Compose bind mount, password rotation and revocation update the existing inode in place with `O_NOFOLLOW`; atomic replacement would leave a running Nginx container reading the old credential inode. The generated health endpoint explicitly disables inherited basic auth so Docker's internal healthcheck continues to work. Passwords are generated or accepted through stdin/prompt, returned once when generated, and never persisted in state or events.

Cloudflare-only is enforced as a Traefik `ipAllowList` middleware on the site's router, using the effective published Cloudflare ranges. It is intentionally an edge control rather than an Nginx deny rule: rejecting at the origin would still allow non-Cloudflare traffic to reach the origin network. Disabling the feature removes both the middleware label and router reference. Before enabling it, the security preflight resolves the site's A/AAAA records and warns when they are not all Cloudflare addresses; the CLI requires `--force` to proceed. The operation layer returns the warnings for panel confirmation. No additional warning is emitted for unknown webhooks or WP-Cron dependencies because wpfy has no reliable inventory of those external callers; its managed health probe is exempted directly.

A successful interactive security mutation means the control is active on the running edge. Snippet-carried controls (basic authentication, deny-IP, user-agent block, and login rate limit) reload the site's Nginx. Cloudflare-only is carried by Traefik container labels, which Traefik reads at container creation, so applying it requires a forced `web` recreate; that recreate is skipped when the running container's `traefik.` labels already equal the rendered labels, avoiding disruptive re-application of an already-applied state. The comparison is scoped to the `traefik.` prefix because a real container also carries Compose-managed (`com.docker.compose.*`) and image (`maintainer`, `org.opencontainers.image.*`) labels that wpfy does not render, so an exact whole-label-set comparison would never match. Equality over that slice, rather than containment, detects stale labels as well as missing labels, so revoking Cloudflare-only reaches the running edge. When Docker is available but the site's `web` is not running, the change is staged and the command succeeds because there is no running edge to be out of sync with; it applies at next start. A genuine runtime failure on a running container leaves the staged configuration in place and returns a non-zero result saying it was not applied; repeating the request retries and converges. `WPFY_SKIP_RUNTIME=1` and unavailable Docker retain the established offline behavior.

## Alternatives considered

- Trust `0.0.0.0/0` or `::/0`: rejected because forwarded headers become spoofable.
- Trust the Traefik hostname: rejected because Nginx resolves it at config-load time, making startup depend on edge DNS and leaving stale addresses after container recreation.
- Trust the discovered edge subnet: rejected because every neighbouring web container is a peer on that subnet and can forge forwarded headers.
- Trust a fixed guessed subnet: rejected because it may not match the network created on the host and would make the rule incorrect.
- Trust all sources: rejected because forwarded headers become spoofable.
- Enforce Cloudflare-only only in site Nginx: rejected because traffic has already reached the origin before Nginx can reject it.
- Put `htpasswd` under `app/`: rejected because the served document root and its backups would expose a crackable credential hash.
- Use an atomic replacement for the individually mounted `htpasswd`: rejected because the running container remains pinned to the original inode and would continue accepting a revoked password.
- Validate generated security snippets through a temporary container mount: rejected because the include directory is read-only and scaffold creation may precede runtime availability.
- Store deny and user-agent rules only in the generated file: rejected because refresh would have no authoritative source and disabling a rule could leave stale directives behind.

## Consequences

- Deny rules evaluate the real client address supplied through the Traefik edge rather than the proxy's connection address.
- Security state survives scaffold regeneration and backup/restore; generated bytes remain stable across repeated renders.
- Conservative user-agent validation may reject exotic regex syntax, but it prevents configuration injection at the Nginx trust boundary.
- Exact Traefik addresses remove peer-container forwarding spoofing. A site not refreshed after an out-of-band edge address change stops resolving clients through Traefik until `wpfy stack install --nginx` or another edge start refreshes it; it fails toward proxy attribution, not header trust.
- Basic authentication protects normal site requests without breaking the managed health probe; external webhook and WP-Cron compatibility remains operator-specific and is not inferred by wpfy.
- Cloudflare-only blocks at Traefik before the request reaches the site container, but enabling it on direct DNS is an intentional lockout if the operator uses `--force` after the warning.
- Interactive security mutations reconcile the rendered control with the running edge when one exists; stopped sites stage successfully for the next start, while genuine runtime failures are reported as not applied and remain retryable.
