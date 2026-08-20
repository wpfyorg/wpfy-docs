# ADR 0034: Traefik reads Docker through an allowlisted socket proxy

- Status: Accepted (implemented 2026-08-21; live proxy behaviour unproven on Linux)
- Date: 2026-08-21

## Context

Traefik discovered site containers by mounting the Docker socket:

```
- /var/run/docker.sock:/var/run/docker.sock:ro
```

`:ro` describes the file, not the API. A process that can talk to that socket
can do everything the daemon exposes: create containers, bind-mount any host
path into one, exec into a running site, read every container's environment.
On a normal host that is root, indirectly.

Both the rc4 and rc5 pentests recorded this under "not changed; remains
supply-chain/architectural debt". It also sits badly with the isolation rule the
project already states — the edge proxy gets no broad write access to site data
— because a full API socket is broader than any per-site mount the rule was
written to constrain.

Traefik itself needs very little of that API: the container list, the event
stream, and a version/ping handshake.

## Decision

Put a filtering proxy between them, on a network that does not reach the
internet or the sites.

`traefik_compose_content()` now emits a `socket-proxy` service alongside
Traefik. It mounts `/var/run/docker.sock` read-only, publishes no host port,
carries the same `compose_hardening_lines` as the rest of the stack (128 pids,
128m, 0.25 cpu), and joins one network:

```
wpfy-docker-socket:
  internal: true
```

Traefik joins that network too, drops its socket mount entirely, and its
provider endpoint becomes `tcp://socket-proxy:2375`.

The proxy is `wollomatic/socket-proxy`, pinned by digest through the new
`image_references.py` inventory, and configured by method and path rather than
by API category:

```
SP_ALLOW_FROM=traefik
SP_ALLOW_GET=/version
SP_ALLOW_GET_2=/v1\..{1,2}/(version|containers/.*|events.*)
SP_ALLOW_HEAD=/_ping
```

No POST is allowed at all. There is no `CONTAINERS=1`-style category switch to
get wrong, and nothing grants images, volumes, networks, exec, or build.

## What this does and does not buy

It removes the write half of the API. Code execution inside Traefik can no
longer start a container, mount a host path, or exec into a site.

It does **not** make container metadata confidential. `containers/.*` is exactly
what Traefik needs to route, and `/containers/{id}/json` returns each
container's environment — which for a WPFY site includes database credentials.
An attacker who fully controls the Traefik container can still read those. The
honest claim is reach reduction, not secrecy; treat compose environment as
readable by anything that owns the edge.

Operationally: Traefik `depends_on` the proxy, so a failed proxy means Traefik
starts with no dynamic discovery and serves only file-provider routes. Existing
installs pick the topology up on the next `wpfy stack install --nginx`, which
adds a container and a network to the Traefik project.

## Alternatives considered

- **Keep the direct mount.** Rejected; the finding stands, and it is the
  single widest privilege in the stack.
- **Drop the Docker provider and route entirely from generated file config.**
  This removes the socket rather than filtering it, but every site mutation
  becomes an edge config write with its own reload and failure mode, and every
  site's routing labels would have to move. Much larger change for the same
  practical reduction.
- **`tecnativa/docker-socket-proxy`.** Better known, HAProxy-based, but its
  configuration is per-category environment flags; `CONTAINERS=1` grants the
  whole container namespace including POST routes. The path-and-method regex
  is what decided it.

## Verification and residual risk

`tests/docker-hardening.sh` and `tests/exposed-ports.sh` assert the topology:
internal network, no published proxy port, read-only mount, pinned images, the
allowlist as written, and no direct socket mount on Traefik.

`tests/docker-runtime-hardening.sh` (opt-in, `RUN_DOCKER_RUNTIME_HARDENING=1`)
is the behavioural proof. On the macOS Docker Desktop host where it was written
the proxy container was denied access to the socket, so every live API
assertion — `/version` reachable, `/v1.47/containers/json` reachable, mutation
refused — reported SKIP rather than pass.

Until that script runs on a Linux host, the allowlist is proven as written
config and not as enforced behaviour. Release notes must not claim otherwise.
