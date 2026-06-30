# ADR 0008: Non-root operator support via wrapper self-elevation

Date: 2026-06-05
Status: Accepted

## Context
Until now, disposable-VPS validation logged in as `root`. Real Ubuntu cloud
images (AWS, etc.) log in as an unprivileged user such as `ubuntu`. wpfy manages
root-owned paths (`/opt/wpfy`, `/etc/wpfy`, `/var/lib/wpfy`, `/var/log/wpfy`,
created `0750 root:root`) and drives the **system** Docker daemon, so every
`wpfy` command fails for a non-root login on both filesystem permissions and the
Docker socket.

The product requirement is that the operator types `wpfy site create`, **not**
`sudo wpfy site create`. The CLI UX must not carry a `sudo` prefix.

## Decision
The installed `wpfy` wrapper at `/usr/local/bin/wpfy` **self-elevates**: when run
as a non-root user it re-execs itself under `sudo`, forwarding `WPFY_*`/`ACME_*`
environment variables across `sudo`'s env reset. When already root (root login,
installer context) it execs the venv binary directly — backward compatible.
`WPFY_NO_SELF_ELEVATE=1` disables elevation (used to exercise the raw non-root
path in tests).

```bash
if [ "$(id -u)" -eq 0 ] || [ -n "${WPFY_NO_SELF_ELEVATE:-}" ]; then
    exec "$VENV_BIN" "$@"
fi
# ...require sudo, forward WPFY_*/ACME_* env...
exec sudo -- env "${fwd[@]}" "$VENV_BIN" "$@"
```

Self-elevation relies on the operator having passwordless `sudo`, which Ubuntu
cloud images grant the default user via `/etc/sudoers.d/90-cloud-init-users`.

## Reasoning
wpfy genuinely requires root: it writes system directories and uses the system
Docker daemon, and containers bind-mount and write **root-owned** files into
`/opt/wpfy/sites/<domain>/app`. Self-elevation keeps the entire existing
root-based model (paths, permissions, container file ownership) unchanged while
delivering the no-sudo UX. The blast radius is one wrapper script plus a latent
host-uid bug fix; no per-image uid remap, no directory-ownership re-architecture.

## Alternatives Considered
- **True rootless (operator owns everything):** add the operator to the `docker`
  group and relax wpfy directory ownership (e.g. a setgid `wpfy` group) so wpfy
  runs as the operator with no elevation. Rejected: containers still write
  root-owned files, so backup/restore/delete break; `docker`-group membership is
  root-equivalent anyway, so it adds no security over `sudo`; much larger and
  more fragile change across every image.
- **Require typed `sudo wpfy ...`:** violates the UX requirement.
- **A setuid wrapper:** more dangerous than `sudo`, no audit trail, and still
  requires solving the root-owned-files problem.

## Consequences
- The operating model is: install once with `sudo bash install.sh`; afterwards
  the operator runs plain `wpfy ...` and the wrapper elevates internally.
- Trust assumption: the operator has passwordless `sudo`. If absent,
  self-elevation prompts for a password (or fails non-interactively); a future
  installer option may drop `/etc/sudoers.d/wpfy` scoped to
  `/usr/local/bin/wpfy` for `$SUDO_USER`.
- `WPFY_*`/`ACME_*` env vars set before `wpfy` survive elevation; other env is
  reset by `sudo` as usual.
- The validation harness runs unprivileged as the login user, invokes `wpfy`
  bare (exercising self-elevation), and prefixes only raw non-wpfy probes (raw
  `docker`, `ss`, reads of root-owned files, `install.sh`) with `sudo`.

## Implemented
- Self-elevating wrapper heredoc in `wpfy` installer (`install_python_package`).
- `handle_site_wp` (`src/wpfy/cli.py`) now always injects wp-cli `--allow-root`
  (the wpcli container runs as root); the previous `os.getuid()==0` gate broke
  `wpfy site wp` for a non-root operator.
- Harness (`scripts/vps-release-validation*.sh`) defaults to `ubuntu@…`,
  home-based staging dir, and a `$SUDO` helper applied to raw probes only.

## Follow-up Tasks
- Optional installer flag to write a scoped `/etc/sudoers.d/wpfy` fragment.
- Revisit true non-root container users (see `docs/SECURITY.md`) independently of
  the host operator model.
