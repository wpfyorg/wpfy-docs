# WPFY CLI VM Release Matrix

Updated: 2026-07-09

Source plan: `/Users/arnab/Desktop/_Projects/wpfy-pvt/.omo/plans/wpfy-cli-vm-release-five-hour-pages.md`

## Purpose

This matrix maps the planned VM-release CLI surface against the current grouped CLI baseline. Page 9 locks the release policy: flat commands are primary where exact equivalents exist, and grouped `site`/`stack` commands are retained for this release instead of being removed.

## Current CLI Baseline

Verified from `src/wpfy/cli.py`, `pyproject.toml`, help output, and `tests/test_cli.py`.

- Parser: `argparse`
- Entrypoint: `wpfy = "wpfy.cli:main"` in `pyproject.toml`
- Registration: top-level commands are centralized in `build_parser()`
- Current top-level commands: `site`, `run`, `backup`, `cron`, `smtp`, `dns`, `restore`, `rm`, `wp`, `version`, `compose`, `up`, `down`, `exec`, `cp`, `pull`, `config`, `edit`, `refresh`, `healthcheck`, `motd`, `utility`, `stack`, `sftp`, `clean`, `info`, `log`, `secure`, `maintenance`, `update`, `debug`
- Current site commands: `create`, `ssl`, `backup`, `restore`, `wp`, `delete`, `list`, `info`, `show`, `status`, `update`
- Current stack commands: `install`, `remove`, `purge`, `migrate`, `upgrade`, `status`
- Current log commands: `show`, `reset`, `cron`
- Current version surface: `wpfy --version`
- Page 9 retention target: keep grouped `stack install|remove|purge|migrate|upgrade|status`; keep grouped site-only `site ssl`, `site list`, `site info`, `site show`, and `site status`; keep duplicate grouped `site create|backup|restore|wp|delete|update` for compatibility.
- Primary flat site flows where exact equivalents exist: `run`, `backup`, `restore`, `wp`, `rm`, and `config`.

## Release Command Matrix

| Command label | Target surface | Current equivalent | Status | Page | Notes |
|---|---|---|---|---|---|
| backup | `wpfy backup ...` | `wpfy site backup <domain>` | implemented flat command | Page 2/parity | Includes `backup all`, local listing, destination copies, S3 upload, `--keep-local`, `backup prune`, named storage profiles, `backup remote ...`, and `backup edge`. |
| compose | `wpfy compose <domain> -- <args>` | internal `compose_command()` | implemented flat command | Page 3 | Validates domain/site before subprocess execution and preserves Compose exit codes. |
| config | `wpfy config <domain> ...` | partial via `wpfy site info` and `wpfy site update` | implemented flat command | Page 4 | Prints sanitized status only, never raw `.env`; controlled mutations route through `UpdateSiteRequest` and `update_site`. |
| cp | `wpfy cp <domain> <source> <destination>` | internal `compose_command(..., "cp", ...)` | implemented flat command | Page 3 | Requires explicit source/destination and rejects broad local paths such as `/`, `.`, `..`, `/etc`, and `/var`. |
| cron | `wpfy cron ...` | no direct command | implemented flat command | Page 7 | Manual interval runners plus systemd-backed `install|status|disable`. Runs due WordPress events and small health tasks only; backups remain separate. |
| down | `wpfy down <domain> [--volumes]` | internal `stop_site_runtime()` | implemented flat command | Page 3 | Non-destructive stop by default; volumes are removed only with `--volumes`. |
| dns | `wpfy dns cloudflare ...` | no direct command | implemented flat command | parity | Stores and tests redacted Cloudflare DNS token for wildcard SSL. |
| edit | `wpfy edit <domain> [--print-path]` | no direct command | implemented flat command | Page 4 | `--print-path` prints the `.env` path only; editor mode requires a TTY/editor, creates a backup, and refreshes without dumping config contents. |
| exec | `wpfy exec <domain> [service] -- <args>` | internal `compose_command(..., "exec", ...)` | implemented flat command | Page 3 | Defaults to `app`, validates allowed service names, preserves subprocess return code, and avoids shell interpolation. |
| healthcheck | `wpfy healthcheck ...` | `wpfy site status`, `wpfy debug`, `wpfy secure` | implemented flat command | Page 5 | Reuses existing inspection and health helpers; exits nonzero on failed checks and treats runtime skip as a warning. |
| help | `wpfy --help`, grouped help commands | existing help surfaces | existing | Page 1 | Verified `wpfy --help`, `site --help`, `stack --help`, and `log --help` exit 0. |
| info | `wpfy info [domain]` | existing top-level command; `wpfy site info <domain>` | existing | Page 1 | Top-level aggregate/per-site info exists; site info remains grouped. |
| log | `wpfy log show|reset|cron ...` | existing top-level command group | existing plus Page 7 cron log | Page 1/Page 7 | `log cron` tails `/var/log/wpfy/cron.log`; container logs remain under `log show`. |
| motd | `wpfy motd` | no direct command | implemented flat command | Page 5 | Summarizes version, Docker, Traefik, managed sites, and warnings without secrets or daemon work. |
| pull | `wpfy pull <domain> [--all|--service <service>]` | internal `compose_command(..., "pull", ...)` | implemented flat command | Page 3 | Pulls images for one managed site only; global/stack pulls remain out of Page 3. |
| refresh | `wpfy refresh <domain|all> [--restart]` | partial via scaffold regeneration in site update flows | implemented flat command | Page 4 | Regenerates from authoritative state, preserves unmanaged `.env` keys, iterates `all` deterministically, and restarts only with `--restart`. |
| restore | `wpfy restore ...` | `wpfy site restore <domain> <backup>` | implemented flat command | Page 2/parity | Preserves archive validation before runtime stop and supports `--latest` only when explicit. `restore edge` restores validated Traefik/ACME archives. |
| rm | `wpfy rm <domain>` | `wpfy site delete <domain>` | existing flat command | Page 2 | Preserves confirmation and non-TTY `--force` safety. |
| run | `wpfy run <domain> ...` | `wpfy site create <domain> ...` | existing flat command | Page 2 | Delegates to the existing site-create lifecycle path while flat CLI becomes canonical. |
| smtp | `wpfy smtp ...` | no direct command | implemented flat command | Page 7 | Config/status/test/clear only; credentials are redacted and sends require explicit `test --to`. |
| up | `wpfy up <domain>` | internal `start_site_runtime()` | implemented flat command | Page 3 | Validates existing site and keeps runtime helper behavior, including skip mode. |
| update | `wpfy update`, `wpfy site update`, `wpfy stack upgrade` | existing top-level and grouped commands | existing | Page 1 | Keep meanings distinct: application update, site update, stack image upgrade. |
| utility | `wpfy utility ...` | no direct command | implemented flat command | Page 5 | Uses stdlib helpers such as `secrets`, `hashlib`, and `base64`; no Docker, mutation, or new dependency. |
| version | `wpfy version` | `wpfy --version` | existing | Page 2 | Prints local package version only; update checks remain in `wpfy update`. |
| wp | `wpfy wp <domain> ...` | `wpfy site wp <domain> ...` | existing flat command | Page 2 | Preserve `--allow-root` behavior while grouped `site wp` remains compatibility. |

## Grouped Retention Matrix

| Grouped surface | Release policy | Flat equivalent |
|---|---|---|
| `wpfy stack install|remove|purge|migrate|upgrade|status` | retained canonical grouped stack namespace | none |
| `wpfy site ssl` | retained grouped site operation | none |
| `wpfy site list` | retained grouped site operation | none |
| `wpfy site info` | retained grouped site operation | partial: `wpfy config` is primary for sanitized config status |
| `wpfy site show` | retained grouped site operation | none |
| `wpfy site status` | retained grouped site operation | partial: `wpfy healthcheck` covers operator checks |
| `wpfy site create` | retained compatibility command | primary: `wpfy run` |
| `wpfy site backup` | retained compatibility command | primary: `wpfy backup` |
| `wpfy site restore` | retained compatibility command | primary: `wpfy restore` |
| `wpfy site wp` | retained compatibility command | primary: `wpfy wp` |
| `wpfy site delete` | retained compatibility command | primary: `wpfy rm` |
| `wpfy site update` | retained compatibility command | partial: `wpfy config` for controlled config updates |

## Parser Safety Baseline

- Unknown top-level commands are rejected by `argparse` before any handler is dispatched.
- Help commands exit successfully for top-level, `site`, `stack`, and `log`.
- Command registration is centralized in `build_parser()`, with grouped command registration in `add_site_parser()`, `add_stack_parser()`, and `add_log_parser()`.
- Existing parser tests cover top-level, `site`, and `stack` help.
- Page 1 verified `log --help` and unknown command behavior through direct CLI invocations captured in evidence.
- Parser risk before Page 2: adding flat aliases expands the top-level namespace, so aliases should delegate to existing handlers/helpers.
- Page 9 decision: retain grouped `wpfy site ...` and `wpfy stack ...` parser surfaces for this release.
- Future flat replacements for retained grouped-only operations require a separate design page; Page 9 does not invent new flat command names.
