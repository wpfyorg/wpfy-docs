# Server Layout

## Directory Structure

```
/opt/wpfy/                  # WPFY home
├── traefik/                # Edge proxy
│   ├── compose.yaml
│   └── traefik.yml
├── sites/                  # Per-site scaffolds
│   └── <domain>/
│       ├── compose.yaml    # Docker Compose definition
│       ├── .env            # Environment variables (secrets)
│       ├── app/            # WordPress files (wp-content, etc.)
│       ├── nginx/
│       │   └── default.conf
│       ├── php/
│       ├── backups/
│       └── sftp/
└── venv/                   # Python virtualenv

/etc/wpfy/
└── wpfy.conf               # Environment configuration

/var/lib/wpfy/
├── sites.json              # Site registry (JSON)
└── backups/
    └── <domain>/           # Timestamped backup tarballs

/var/log/wpfy/
└── install.log             # Installer log

/usr/local/bin/wpfy         # CLI wrapper script
```

## Compose Project Naming

Each site's Compose project name is derived from the domain with dots replaced by hyphens: `example.com` → `wpfy-example-com`. Duplicate-neutral project names are rejected at create time.

## Networks

- `wpfy` — shared network, all Traefik-routed sites connect here
- `wpfy-<domain>_default` — per-site internal network for inter-container communication

## Volumes

Every site gets named Docker volumes for persistent data:

- `<domain>_db_data` — MariaDB data
- `<domain>_app` — WordPress files (bind mount to `/opt/wpfy/sites/<domain>/app/`)

Volumes are never shared between sites.
