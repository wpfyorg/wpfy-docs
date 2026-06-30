# Introduction

## What is WPFY?

WPFY is a Docker-first CLI for WordPress server administration on Ubuntu VPS. It replaces host-level Nginx, PHP, MariaDB, and Redis packages with per-site Docker Compose stacks.

Every site runs in its own isolated Compose project — separate containers, volumes, and networks. Traefik sits at the edge as a reverse proxy with automatic Let's Encrypt SSL.

You manage everything through a single CLI: `wpfy`.

## Features

- **Automated WordPress** — spin up a site with `wpfy site create domain.com --wp`
- **Per-site isolation** — each site gets its own PHP, MariaDB, and Redis containers
- **Automatic SSL** — Traefik handles Let's Encrypt with DNS/IP preflight checks
- **One-command backups** — `wpfy site backup domain.com` archives files and database
- **PHP version management** — pick 7.4 through 8.4 per site with `--php 8.3`
- **Cache integration** — FastCGI cache, Redis object cache, WP Rocket, and more
- **SFTP access** — per-site SFTP with `wpfy sftp domain.com --enable`
- **WP-CLI** — run WP-CLI inside any site container via `wpfy site wp domain.com`
- **Diagnostics** — `wpfy debug` audits Docker, Traefik, and all sites

## Requirements

- Ubuntu 22.04 LTS or 24.04 LTS
- Docker Engine and Docker Compose plugin
- A domain name pointing to your server
- Ports 80 and 443 open

## Architecture

```
Internet → Traefik (reverse proxy + SSL) → Nginx → WordPress (PHP-FPM) → MariaDB
                                           → Redis (optional)
                                           → SFTP (optional)
```

All services run as Docker containers orchestrated through Compose files managed by WPFY.

## Next Steps

- [Install WPFY](/getting-started/installation)
- [Create your first site](/site-commands/site-create)
