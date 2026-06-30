# ADR 0011: Publish PHP images only from the public mirror

Date: 2026-06-08
Status: Accepted

## Context
The PHP-FPM runtime images (`docker/php-fpm/<version>`) are built by
`.github/workflows/php-images.yml` and pushed to
`ghcr.io/wpfyorg/php-fpm:<version>`. That workflow is part of the public export
allowlist, so an identical copy runs in both the private source repo
(`wpfyorg/wpfy-pvt`) and the public mirror (`wpfyorg/wpfy`).

Two problems surfaced once the imagick build was fixed and the push step was
reached for the first time:

- The push from `wpfy-pvt` failed with `denied: permission_denied: write_package`.
  The private repo's `GITHUB_TOKEN` is not the owner of the org-level
  `wpfyorg/php-fpm` package.
- The image label `org.opencontainers.image.source` is derived from
  `github.repository`, so a push from `wpfy-pvt` would advertise a **private**
  repository as the public image's source.

Both repos targeting the same package also meant two publishers racing to own
the same tags.

## Decision
Publish PHP images only from the public mirror. The shared workflow gates both
the GHCR login and `push` on `github.repository == 'wpfyorg/wpfy'`:

- In `wpfyorg/wpfy` (public): on `main` push the images build and publish, and
  `image.source` points at the public repository. The GHCR login uses the
  repo's built-in `GITHUB_TOKEN`; the existing `wpfyorg/php-fpm` package grants
  the `wpfy` repo Write access via its "Manage Actions access" setting, so no
  PAT is required.
- In `wpfyorg/wpfy-pvt` (private): the workflow builds both platforms as a
  validation gate but never logs in or pushes.

## Reasoning
The package is consumed publicly, so it should be published from the public repo
whose URL is the correct `image.source`. Keeping a single shared workflow file
(rather than diverging the two repos) preserves the export-allowlist model; the
repository guard makes the one file behave correctly in each context. The
`wpfyorg/php-fpm` package predates this workflow, so the repo's `GITHUB_TOKEN`
is denied (`permission_denied: write_package`) until the package explicitly
grants the `wpfy` repo Write access. Granting that access is preferred over a
dedicated PAT, which would expire and need rotation. (An earlier revision of
this ADR used a `PUBLICPUSH` PAT after misreading the push denial as the token
lacking effective scope; the real cause was the package's per-repo access
setting.)

## Alternatives Considered
- Grant `wpfy-pvt` write access to the org package and keep publishing from the
  private repo — still advertises a private `image.source` and leaves two
  publishers racing for the same tags.
- Remove `php-images.yml` from the private repo entirely — loses the build
  validation gate before changes reach the mirror.

## Consequences
- The private repo no longer needs any GHCR package permissions.
- The `wpfyorg/php-fpm` package must grant the `wpfy` repo Write access (package
  settings -> Manage Actions access); no Actions secret/PAT is needed.
- `docker/php-fpm/**` changes are build-validated in `wpfy-pvt` and only
  published after they reach `wpfyorg/wpfy` through the public mirror workflow.
- A successful publish depends on the imagick build fix (retry loop) having
  already been mirrored to the public repo.
