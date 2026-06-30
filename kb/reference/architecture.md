# Architecture

## Overview

WPFY uses Docker Compose for per-site isolation. Each site runs in its own Compose project with separate containers, volumes, and networks. A shared Traefik instance handles edge routing and SSL termination.

## Component Diagram

```
┌─────────────────────────────────────────────────┐
│                   Internet                        │
└─────────────────┬───────────────────────────────┘
                  │ :80 :443
                  ▼
┌─────────────────────────────────────────────────┐
│  Traefik (shared)                                │
│  - Docker provider (label-based routing)         │
│  - ACME TLS-ALPN-01 / HTTP-01                   │
│  - Read-only Docker socket                       │
└──────┬──────────────────────────────────────────┘
       │ docker network: wpfy
       ▼
┌──────────────────┐ ┌──────────────────┐
│  Site: example1  │ │  Site: example2  │
│  ┌────────────┐  │ │  ┌────────────┐  │
│  │ Nginx      │  │ │  │ Nginx      │  │
│  ├────────────┤  │ │  ├────────────┤  │
│  │ PHP-FPM    │  │ │  │ PHP-FPM    │  │
│  ├────────────┤  │ │  ├────────────┤  │
│  │ MariaDB    │  │ │  │ MariaDB    │  │
│  ├────────────┤  │ │  ├────────────┤  │
│  │ Redis      │  │ │  │ SFTP       │  │
│  │ (optional) │  │ │  │ (optional) │  │
│  ├────────────┤  │ │  └────────────┘  │
│  │ WP-CLI     │  │ │                  │
│  └────────────┘  │ │                  │
└──────────────────┘ └──────────────────┘
```

## File Layout

```
/opt/wpfy/
├── traefik/           # Shared edge proxy
│   ├── compose.yaml
│   ├── traefik.yml
│   └── acme.json
├── sites/
│   └── <domain>/
│       ├── compose.yaml
│       ├── .env
│       ├── app/       # WordPress files
│       ├── nginx/
│       │   └── default.conf
│       ├── php/
│       ├── backups/
│       └── sftp/
└── venv/              # Python virtualenv

/etc/wpfy/
└── wpfy.conf          # Environment config

/var/lib/wpfy/
├── sites.json         # Registry
├── backups/
│   └── <domain>/      # Timestamped tarballs
└── ...
```

## Key Design Decisions

See the project repository for detailed Architecture Decision Records (ADRs):

- ADR 0001: Docker Compose over host-level packages
- ADR 0002: JSON file registry with atomic writes
- ADR 0004: Traefik v3 with Docker label auto-discovery
- ADR 0005: Per-site PHP version via versioned images
- ADR 0008: Non-root operator UX with self-elevating wrapper
