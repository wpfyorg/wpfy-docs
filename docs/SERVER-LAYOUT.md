# Server Layout

## Implemented
- No server-side paths are created by code yet.
- `site create` creates `/opt/wpfy/sites/<site>/`, `/opt/wpfy/sites/<site>/compose.yaml`, `/opt/wpfy/sites/<site>/.env`, `/opt/wpfy/sites/<site>/nginx/`, `/opt/wpfy/sites/<site>/php/`, `/opt/wpfy/sites/<site>/app/`, and `/opt/wpfy/sites/<site>/backups/`.

## Planned Paths
- `/opt/wpfy`: installed runtime, release files, templates, and managed site projects.
- `/opt/wpfy/sites/<site>`: per-site Compose project and generated config.
- `/etc/wpfy`: host-level `wpfy` configuration.
- `/var/lib/wpfy`: state, metadata, generated secrets, and persistent service data not stored in Docker named volumes.
- `/var/log/wpfy`: installer and CLI logs.
- `/usr/local/bin/wpfy`: CLI entrypoint symlink or wrapper.
- `/var/lib/wpfy/backups/<site>/`: backup archives and database dump artifacts.

## Per-Site Planned Layout
- `/opt/wpfy/sites/<site>/compose.yaml`
- `/opt/wpfy/sites/<site>/.env`
- `/opt/wpfy/sites/<site>/app/healthz.html`
- `/opt/wpfy/sites/<site>/nginx/`
- `/opt/wpfy/sites/<site>/php/` — includes the generated `php/zz-wpfy-pool.conf` `[www]` pool section and the operator-editable `php/pool-custom.conf` (ADR 0038) next to `php/zz-wpfy.ini` and `php/custom.ini`; all are bind-mounted read-only into the app service only (the WP-CLI service mounts none of the FPM pool files), generated files are updated in place, operator files are never rewritten.
- `/opt/wpfy/sites/<site>/backups/` is no longer the backup target; backups live under `/var/lib/wpfy/backups/<site>/`.

## Constraints
- Do not reuse legacy server-panel host paths unless a future ADR explicitly changes this.
- Secrets must not be world-readable.
