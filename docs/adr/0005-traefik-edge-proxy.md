# ADR 0005: Traefik as edge proxy with built-in ACME

Date: 2026-05-22
Status: Accepted

## Context
`wpfy` needs a global edge proxy to route public traffic (ports 80 and 443) to per-site Docker Compose stacks. The proxy must handle TLS termination and automatic certificate issuance for sites that opt into Let's Encrypt. Without a proxy, every site would need its own port-mapped web container, creating port conflicts and complicating certificate management.

## Decision
Use Traefik v3 as the edge proxy with built-in ACME support and Docker provider label-based auto-discovery.

## Reasoning
Traefik integrates directly with the Docker socket to discover containers and routes via labels. It handles ACME certificate issuance, renewal, and TLS termination natively, avoiding the need for a separate `acme.sh` or certbot process. Docker label-based routing lets `wpfy` annotate per-site containers declaratively in `compose.yaml` without maintaining a separate proxy configuration file.

The proxy runs as its own Compose project (`wpfy-traefik`) on a shared `wpfy` bridge network. Per-site containers join that network and advertise their routing rules through Docker labels. Traefik watches the Docker socket read-only for new containers and applies routing automatically.

## Alternatives Considered
- **Caddy**: Also supports Docker integration and built-in ACME, but Traefik has a larger Docker ecosystem and more mature label-based configuration. Caddy's Caddyfile approach is less container-native.
- **nginx with acme.sh**: Would require host-level nginx installation, acme.sh scripting, and manual proxy config updates on every site change. Counter to the Docker-first philosophy.
- **nginx container with manual config**: Requires regenerating and reloading nginx config on every site change. More operational complexity than label-based auto-discovery.

## Consequences
- Traefik becomes a required infrastructure component. The `wpfy` stack install command (`stack install --nginx`) pulls and starts Traefik.
- ACME certificates are stored in a Docker volume (`letsencrypt_data`) and Traefik handles renewal automatically.
- All per-site containers must join the shared `wpfy` Docker network and include Traefik routing labels in their Compose configuration.
- No dependency on host-level ACME tools (certbot, acme.sh). Certificate management lives entirely within the container runtime.
- Traefik dashboard is disabled by default. API access is restricted to the Docker network.
- Certificate expiry monitoring and force-renewal are handled through `wpfy` CLI commands that read Traefik's `acme.json` state.

## Implemented
- `traefik.py` module: scaffold generation, network creation, start/stop/status/reload, ACME status checks, force certificate renewal.
- `compose.yaml` and `traefik.yml` generation in `/opt/wpfy/traefik/`.
- CLI integration via `wpfy stack install --nginx`, `wpfy stack status`, `wpfy stack upgrade`, `wpfy stack remove`, `wpfy stack purge`.
- `wpfy debug` reports Traefik health.

## Follow-up Tasks
- Add Traefik dashboard behind authentication for debugging.
- Add metrics endpoint for monitoring.
- Evaluate HTTP challenge support as an alternative to TLS challenge for environments where TLS challenge is problematic.
