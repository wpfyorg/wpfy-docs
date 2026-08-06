# ADR 0031: Adopt the FileBrowser Quantum fork for the per-site file manager

- Status: Accepted (implemented)
- Date: 2026-08-06
- Deviation note: the 2026 panel-audit remediation plan referenced ADR 0024 for
  this decision, but 0024 and 0025 are already taken
  (`0024-ssl-intent-and-observed-certificate-state.md`,
  `0025-first-run-panel-setup.md`). This decision is recorded at 0031, the next
  free slot.

## Context

The per-site file manager in the shipped Phase-6A code was built on
`filebrowser/filebrowser`, which was archived upstream on 2026-09-01 and is no
longer maintained. It carries two unpatched vulnerability classes with no
upstream fix: command-execution surfaces (runner/hooks) and non-revocable,
self-contained JWT sessions.

The Phase-6A integration compounded this. The container ran with `--noauth` and
a JWT facade the original filebrowser never validates: `auth.go` in v2.32.0
accepts only JWTs carrying `user.id` or `user` claims signed with its own
`settings.Key` and an `iss="File Browser"` issuer. The shipped enable path also
could not succeed by construction: the loopback health check targeted
`127.0.0.1:8080` while the container sat on the wpfy network with no published
port, so the health probe never reached the container and enable always failed.

A spike was run on 2026-08-06
(`docs/release-evidence/quantum-spike-2026-08-06/quantum-spike.md`) against the
maintained fork.

## Decision

Adopt the maintained FileBrowser Quantum fork (`gtsteffaniak/filebrowser`).

- Image: `gtstef/filebrowser:1.5.0-stable-slim@sha256:aadfaa026ebae24e373e523662cd9e8f562b5e3c404ac1df65ef13ddcd14b2fc`
  (linux/amd64 digest, spike-verified).
- License: Apache-2.0.
- Shell/command execution is removed upstream (no command runner exists).
- All six known advisories were fixed in `1.3.3` or earlier, and the pinned
  `1.5.0-stable` is newer: GHSA-r633-fcgp-m532, GHSA-mmpx-jh39-wrv6,
  GHSA-fwj3-42wh-8673, GHSA-3jmg-p96m-m328, GHSA-qqqm-5547-774x,
  GHSA-vvp7-h4fj-m28w.

Authentication is proxy-header mode (`auth.methods.proxy.header:
X-Forwarded-User`) with the panel as the ONLY ingress. Deployment shape
(implemented in `file_manager_providers/quantum.py` and mirrored in
`deploy/file-manager/`):

- Per-site loopback-only published port (`127.0.0.1:<port>:80`), no public port.
- Container NOT attached to the shared wpfy network.
- No Docker socket mounted.
- `read_only` rootfs plus `/tmp` tmpfs; `cap_drop: ALL`; `no_new_privileges: true`.
- Runs as the site's non-root UID/GID.
- Panel session cookie is 60s, HttpOnly, `SameSite=Strict`, path-scoped; wpfy
  bearer auth governs access to the panel, and only the panel may set the
  forwarded-user header.

## Alternatives considered

- `--noauth`: rejected and never to be reintroduced. Any future regression that
  restores an unauthenticated file manager is treated as a release blocker.
- `?auth=` / query-token URLs: rejected because tokens leak through history,
  referer headers, and server logs.
- The plan's 60s single-use `jti` launch JWT: rejected. Quantum's
  `auth.methods.jwt` validates only `sub`, `exp`, and signature; it does not
  enforce `jti`, `iss`, or `aud`, so a single-use claim is decorative. The
  proxy-header design replaces it and still satisfies the "no second login"
  requirement, because the panel already authenticates the operator.
- CSRF tokens: rejected as redundant. Authentication is bearer-only with no
  ambient credentials; the Origin/Referer check on the panel is the control for
  cross-origin state-changing requests.

## Consequences

- `WPFY_FM_ENABLED` defaults to off (`0`) until the feature is promoted.
- `WPFY_FM_LEGACY_API` defaults to on (`1`) as the rollback path.
- Upgrades go through the plan's section 20 compatibility lane.
- Rollback is the previous release plus the legacy API; the Quantum container
  is never reachable without the panel proxy.
- Release artifacts for the chosen image live in `deploy/file-manager/`
  (`image.lock`, `compose.fragment.yaml`, `config.template.yaml`, `SBOM.txt`,
  `LICENSE.txt`, `SECURITY.md`, `config.generated.yaml`).
