# Environment Variables

WPFY behaviour is configured through environment variables. Set them in your shell profile or `/etc/wpfy/wpfy.conf`.

## Core

| Variable | Default | Description |
|----------|---------|-------------|
| `WPFY_ACME_EMAIL` | — | Let's Encrypt contact email (required for SSL) |
| `WPFY_SKIP_RUNTIME` | — | Set to `1` to skip Docker operations |
| `WPFY_DRY_RUN` | — | Set to `1` for dry-run mode |
| `WPFY_NO_SELF_ELEVATE` | — | Set to `1` to disable sudo self-elevation |

## Installer

| Variable | Default | Description |
|----------|---------|-------------|
| `WPFY_REF` | `main` | Git ref to install |
| `WPFY_SOURCE_SHA256` | — | Verify source archive checksum |
| `WPFY_SKIP_WPFY_INSTALL` | — | Skip pip install (bootstrap use) |
| `WPFY_SWAP` | — | Set to `0` to disable swap creation |
| `WPFY_SWAP_SIZE_MB` | — | Override swap size |
| `WPFY_SWAP_FILE` | `/swapfile` | Swap file location |
| `WPFY_INSTALL_LOG` | `/var/log/wpfy/install.log` | Installer log path |

## Testing / Offline

| Variable | Default | Description |
|----------|---------|-------------|
| `WPFY_TEST_DNS_IPS` | — | Override DNS resolution result |
| `WPFY_TEST_PUBLIC_IPS` | — | Override public IP detection |

## Paths

All `WPFY_*` path variables default to the standard layout:

| Variable | Default |
|----------|---------|
| `WPFY_HOME` | `/opt/wpfy` |
| `WPFY_CONFIG_DIR` | `/etc/wpfy` |
| `WPFY_STATE_DIR` | `/var/lib/wpfy` |
| `WPFY_LOG_DIR` | `/var/log/wpfy` |
| `WPFY_BACKUP_DIR` | `/var/lib/wpfy/backups` |
| `WPFY_REGISTRY_FILE` | `/var/lib/wpfy/sites.json` |
