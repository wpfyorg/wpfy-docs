# Installation

Install WPFY on a fresh Ubuntu VPS with a single command.

## One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash
```

## What the Installer Does

1. Verifies Ubuntu 22.04 or 24.04
2. Installs Docker Engine and Compose plugin
3. Creates `/opt/wpfy/`, `/etc/wpfy/`, `/var/lib/wpfy/`, `/var/log/wpfy/`
4. Sets up Python virtual environment in `/opt/wpfy/venv`
5. Installs the `wpfy` CLI at `/usr/local/bin/wpfy`
6. Optionally creates adaptive swap (2–4 GB depending on free disk)
7. Writes `/etc/wpfy/wpfy.conf`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `WPFY_ACME_EMAIL` | Let's Encrypt contact email (required for SSL) |
| `WPFY_SKIP_RUNTIME=1` | Skip Docker operations (offline-safe) |
| `WPFY_SWAP=0` | Disable automatic swap creation |
| `WPFY_SWAP_SIZE_MB` | Override swap size |
| `WPFY_SOURCE_SHA256` | Verify source archive checksum |
| `WPFY_REF` | Git ref to install (default: `main`) |

## Post-Install

```bash
# Verify installation
wpfy --help

# Install the Traefik edge proxy
wpfy stack install --nginx

# Set your ACME email for SSL
export WPFY_ACME_EMAIL=you@example.com
wpfy stack install --nginx
```

## Troubleshooting

**Docker not found:** The installer fetches Docker from get.docker.com. On some VPS images, run `apt update` first.

**Swap creation skipped:** If you have < 8 GB free on `/`, the installer skips swap. Set `WPFY_SWAP_SIZE_MB=1024` to force a smaller swap.

**Logs:** Installation logs are written to `/var/log/wpfy/install.log`.
