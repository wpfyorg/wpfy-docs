# wpfy stack install

Bootstrap or verify shared runtime stack components.

## Syntax

```bash
wpfy stack install --nginx
wpfy stack install --php
wpfy stack install --php 8.3
wpfy stack install --all
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--nginx` | bool | Scaffold and start Traefik edge proxy |
| `--php` | string | Pull PHP-FPM image (default: 8.4; also: 7.4, 8.0–8.3) |
| `--mysql`, `--mariadb` | bool | Pull MariaDB image |
| `--redis` | bool | Pull Redis image |
| `--wpcli` | bool | Pull default PHP image for WP-CLI |
| `--all` | bool | Install all v1 Docker-backed components |
| `--phpmyadmin`, `--adminer`, `--composer`, `--mysqltuner` | — | Deferred to v2 |

## Examples

```bash
wpfy stack install --nginx --php --mysql --redis --wpcli
wpfy stack install --nginx
wpfy stack install --php 8.1
```

## Expected Behavior

**Traefik (`--nginx`):**
- Creates `/opt/wpfy/traefik/compose.yaml` and `traefik.yml`
- Creates shared `wpfy` Docker network
- Reads `WPFY_ACME_EMAIL` for ACME configuration
- Starts Traefik container with read-only Docker socket

**PHP images:**
- Pulls from `ghcr.io/wpfyorg/php-fpm:<version>`
- Never builds on the VPS — pull-only
- Default version: 8.4

**All other components:**
- Pull official Docker images (MariaDB, Redis)

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Docker unavailable | Error, nothing installed |
| Compose plugin missing | Error, nothing installed |
| Traefik start fails | Error, check `docker compose logs` |
| Image pull fails | Error for that component, others continue |

## Related Commands

- [wpfy stack status](/stack-commands/stack-status)
- [wpfy stack upgrade](/stack-commands/stack-upgrade)
