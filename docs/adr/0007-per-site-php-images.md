# ADR 0007: Per-site PHP version via Docker image tags

Date: 2026-05-22
Status: Accepted

## Context
Different WordPress sites may require different PHP versions due to plugin compatibility, theme requirements, or migration timelines. `wpfy` must support selecting a PHP version per site without affecting other sites. In a Docker-first model, each site's PHP-FPM container can run a different image.

## Decision
PHP version is selected per site through Docker image tags. Each site's `compose.yaml` references `ghcr.io/wpfyorg/php-fpm:<version>` where the tag is determined by the `--php` flag on `site create` (choices: 7.4, 8.0, 8.1, 8.2, 8.3, 8.4). The version is stored in the site's `.env` as `PHP_VERSION` and in the JSON registry.

## Reasoning
Docker image tags provide clean, immutable PHP runtime selection per container. Changing a site's PHP version means updating the image tag in its `compose.yaml`, pulling the new image, and restarting the container. No host-level PHP installations, no version-switching scripts, and no risk of cross-contamination between sites.

The `ghcr.io/wpfyorg/php-fpm` image namespace is reserved for `wpfy`-curated PHP-FPM images that include the extensions and configuration needed for WordPress. Version 8.4 is the default. Only one PHP version runs per site, determined at creation time and changeable via `site update --php`.

## Alternatives Considered
- **Host-level PHP-FPM with multiple versions**: Requires host package management, version-switching scripts, and per-site socket/port configuration. Contradicts the Docker-first philosophy and creates host mutation risk.
- **Single PHP image with bundled multi-version support**: Complex image with multiple PHP binaries and a version-selector script. Larger image size, hard to maintain, harder to audit for security patches.
- **PHP version as a container build-time variable**: Requires rebuilding images per version. Slower deploys and more complex CI/CD. Pre-built versioned images are simpler.

## Consequences
- Images must be pre-built and published to `ghcr.io/wpfyorg/php-fpm` for each supported version.
- Public releases publish those images via `.github/workflows/php-images.yml` from `docker/php-fpm/<version>/`.
- `stack install --php` pulls the default 8.4 image. `stack install --php 8.3` pulls only the explicitly requested image.
- Customer VPS hosts never build PHP images locally; bundled Dockerfiles are only for CI image publication.
- `site create --php 8.3` references the tag; Docker Compose pulls it when that explicit runtime is started if it was not pre-pulled.
- `site update --php 8.3` regenerates `compose.yaml` with the new tag and restarts the site container.
- Adding a new PHP version requires publishing a new image and adding the version to the CLI `--php` choices.
- Default PHP version is 8.4. Sites created without `--php` get 8.4.
- The `wpcli` service uses the same PHP image as the site's `app` container, ensuring WP-CLI runs against the correct PHP runtime.

## Implemented
- `SiteSpec.php_version` field (default "8.4").
- `compose_content()` generates `image: ghcr.io/wpfyorg/php-fpm:{spec.php_version}` in the `app` service.
- CLI: `site create --php {7.4|8.0|8.1|8.2|8.3|8.4}`, `site update --php {7.4|8.0|8.1|8.2|8.3|8.4}`.
- `.env` stores `PHP_VERSION=<version>`.
- Registry stores `php_version` field per site.
- `stack install --php` pulls 8.4; `stack install --php 8.3` pulls only 8.3.
- `stack upgrade` pulls updated tags for existing images.
- GitHub Actions workflow `.github/workflows/php-images.yml` builds and publishes `7.4`, `8.0`, `8.1`, `8.2`, `8.3`, and `8.4` images to GHCR on public `main` pushes and manual dispatch.

## Follow-up Tasks
- Define PHP extension list and php.ini tuning per image.
- Consider per-site `php.ini` overrides via mounted config files.
