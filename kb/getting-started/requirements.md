# Requirements

## Server

| Requirement | Details |
|-------------|---------|
| OS | Ubuntu 22.04 LTS or 24.04 LTS (x86_64) |
| RAM | 1 GB minimum (2 GB recommended for WordPress) |
| Disk | 10 GB minimum (20 GB+ recommended) |
| Docker | Engine 24+ with Compose plugin v2 |
| Python | 3.10+ (installed automatically by the installer) |

## Network

| Requirement | Details |
|-------------|---------|
| Port 80 | Open inbound (HTTP, ACME HTTP-01 challenge) |
| Port 443 | Open inbound (HTTPS, Traefik TLS termination) |
| Domain | A/AAAA record pointing to VPS public IP |

## Cloud Providers

WPFY has been tested on:

- HostHatch (Ubuntu 24.04)
- DigitalOcean (Ubuntu 22.04/24.04)
- Linode (Ubuntu 22.04/24.04)
- Vultr (Ubuntu 22.04/24.04)
- Hetzner Cloud (Ubuntu 22.04/24.04)

## Supported Stacks

| Stack | Flag | Description |
|-------|------|-------------|
| WordPress | `--wp` | Default WordPress with Nginx + PHP-FPM + MariaDB |
| Static HTML | `--html` | Nginx serving static files |

## PHP Versions

WPFY supports PHP 7.4 through 8.4 via pre-built Docker images (`ghcr.io/wpfyorg/php-fpm`). Select per site with `--php`:

```bash
wpfy site create example.com --wp --php 8.1
wpfy site update example.com --php 8.4
```
