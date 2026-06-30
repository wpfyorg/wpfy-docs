# Security

## Isolation Model

Every site runs in its own Docker Compose project. Containers, volumes, and networks are never shared between sites.

| Resource | Isolation |
|----------|-----------|
| PHP-FPM | Per-site container, no shared volumes |
| MariaDB | Per-site container, separate data volume |
| Redis | Per-site container |
| Nginx | Per-site container with generated config |
| SFTP | Per-site container on loopback port |
| WP-CLI | Per-site container, `--allow-root` |

## Container Hardening

WPFY configures these security options by default:

- `no-new-privileges: true` — prevents privilege escalation
- `cap_drop: [NET_RAW]` — drops raw socket capability
- `pids_limit` — limits fork bombs
- `mem_limit` — per-container memory bounds
- Log rotation — prevents disk exhaustion

## Secret Handling

- Generated passwords (SFTP, WordPress admin) are printed once and never persisted in plain-text by WPFY
- `.env` files contain secrets but are never printed in CLI output
- Backup archives are not world-readable
- ACME certificate storage (`acme.json`) is read-only to WPFY
- Registry (`sites.json`) never stores secret values

## Known Limitations

| Concern | Status |
|---------|--------|
| Docker socket access | Traefik has read-only access; Docker daemon compromise affects all sites |
| PHP-FPM user | Currently runs as root (USER www-data deferred — needs volume ownership strategy) |
| Container escape | Docker provides kernel-level isolation, not VM-level isolation |
| Supply-chain | Installer source verification via `WPFY_SOURCE_SHA256` |

## Audit Commands

```bash
wpfy secure          # Full hardening audit
wpfy debug           # Docker + Traefik + site diagnostics
```
