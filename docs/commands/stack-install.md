# `wpfy stack install`

## Purpose
Bootstrap or verify runtime stack components.

## Status
- Implemented: `--nginx` scaffolds and starts Traefik on the shared `wpfy` network.
- Implemented: `--php`, `--mysql`/`--mariadb`, `--redis`, and `--wpcli` pull the required Docker images.
- Implemented: `--php` with no version pulls the default PHP 8.4 image; explicit version pulls support `7.4`, `8.0`, `8.1`, `8.2`, and `8.3`.
- Implemented: `--all` selects the Docker-backed v1 components and pulls only the default PHP image.
- Implemented: `--phpmyadmin`, `--adminer`, and `--composer` pull pinned-major helper images for opt-in preparation.
- Implemented: non-Docker host tools are reported as not applicable; `--mysqltuner` skips until a vetted pinned image exists.
- Implemented: phase banners and per-component summary lines make long installs readable without exposing raw Docker pull chatter.

## Syntax
```bash
wpfy stack install
wpfy stack install --nginx
wpfy stack install --all
wpfy stack install --php
wpfy stack install --php 8.3
wpfy stack install --phpmyadmin --adminer --composer
```

## Examples
```bash
wpfy stack install --nginx --php --mysql --redis --wpcli
```

## Expected Files Touched
- `/opt/wpfy/traefik/compose.yaml`.
- `/opt/wpfy/traefik/traefik.yml`.
- Docker network `wpfy` and the Traefik Compose project when runtime is available.
- Pulled Docker images for selected components; PHP images are pulled from `ghcr.io/wpfyorg/php-fpm` and never built locally on the VPS.
- Helper image pulls use `phpmyadmin:5-apache`, `adminer:5`, and `composer:2`; they do not publish a dashboard or attach to sites.

## Idempotency Behaviour
- Re-running regenerates the Traefik scaffold as needed, reuses the shared network, and restarts/pulls components without duplicating site resources.

## Failure Modes
- Docker unavailable.
- Compose plugin unavailable.
- Edge proxy startup failure.

## Security Notes
- Must not install host-level Nginx/PHP/MariaDB/Redis packages.
- Must not weaken per-site isolation by creating shared PHP, DB, or Redis services.
- Helper flags are prep-only; expose any helper UI explicitly and separately if needed later.
