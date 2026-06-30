# Site Isolation

## Implemented
- One Compose project per site.
- Each site has its own containers.
- Each site has its own web container for HTTP health and routing.
- Each site has its own Docker network.
- Each site has its own volumes.
- Each site has its own database container.
- Each site has its own Redis container if Redis caching is enabled.
- Optional SFTP access runs as a per-site sidecar mounted only to that site's app directory.
- PHP, DB, Redis, and writable app volumes are never shared between sites.

## Networks
- Per-site internal network for PHP, DB, Redis, and site-specific services.
- Edge proxy attaches only as needed for HTTP routing.
- Site networks should not be able to reach other site networks by default.

## Volumes
- WordPress files are per-site.
- Database data is per-site.
- Redis data, if persistent, is per-site.
- Shared read-only templates are allowed only if they cannot expose or mutate site data.

## Proxy Boundary
- Global edge proxy may route 80/443 to sites.
- Edge proxy must not get broad write access to site app files, DB data, Redis data, or secrets.

## What This Protects Against
- A compromised WordPress/PHP container should not directly access another site’s DB, Redis, or app files through shared containers or shared writable mounts.

## What This Does Not Protect Against
- Docker daemon compromise.
- Host kernel compromise.
- Root compromise on the VPS.
- Misconfigured mounts or networks introduced later.
