# Commands

## Implemented Commands
- `wpfy site create <domain> [flags]`
- `wpfy run <domain> [site create flags]` (flat command; currently delegates to `wpfy site create`)
- `wpfy site update <domain>`
- `wpfy site delete <domain>`
- `wpfy rm <domain> [--force]` (flat command; currently delegates to `wpfy site delete`)
- `wpfy site list`
- `wpfy site info <domain>`
- `wpfy site show <domain>`
- `wpfy site status <domain>`
- `wpfy site ssl <domain> --letsencrypt`
- `wpfy config <domain> [--php <version>|--wpfc|--wpredis|-le|--letsencrypt off|--dns cloudflare|--proxied|--no-proxied|--password|--password-stdin]`
- `wpfy edit <domain> [--print-path]`
- `wpfy refresh <domain|all> [--restart]`
- `wpfy compose <domain> -- <compose args>`
- `wpfy up <domain>`
- `wpfy down <domain> [--volumes]`
- `wpfy exec <domain> [service] -- <command>`
- `wpfy cp <domain> <source> <destination>`
- `wpfy pull <domain> [--all|--service <service>]`
- `wpfy healthcheck [all|system|disk|load|app]`
- `wpfy motd [--compact]`
- `wpfy utility password|username|uid|token|htpasswd`
- `wpfy site backup <domain> [--list|--path <directory>|--s3]`
- `wpfy backup <domain|all> [--list|--path <directory>|--s3]`
- `wpfy backup storage set|status|test|clear`
- `wpfy backup schedule daily|weekly|status|disable`
- `wpfy cron minute|five-minute|hourly|six-hour|daily|weekly`
- `wpfy cron install|status|disable`
- `wpfy smtp set|status|test|clear`
- `wpfy dns cloudflare set|status|test|clear`
- `wpfy security fail2ban status|repair|test|unban <ip>` (host Login Shield)
- `wpfy site security <domain> fail2ban on|off|status|reset` (per-site Login Shield)
- `wpfy site restore <domain> [<backup>|--list|--latest]`
- `wpfy restore <domain> [<backup>|--list|--latest]`
- `wpfy backup prune <domain|all> --keep N [--dry-run]`
- `wpfy backup remote list|restore|delete|prune <domain> [--profile NAME]`
- `wpfy backup edge [--path DIR] [--s3 --profile NAME]`
- `wpfy restore edge <archive> --force`
- `wpfy site wp <domain> <wp-cli args>`
- `wpfy wp <domain> <wp-cli args>` (flat command; currently delegates to `wpfy site wp`)
- `wpfy version`
- `wpfy stack install|remove|purge|migrate|upgrade|status [flags]` — `migrate` is deprecated in 1.0 (never implemented) and is removed no earlier than 1.1
- `wpfy debug`, `wpfy clean`, `wpfy info`, `wpfy log show|reset|cron`, `wpfy secure`, `wpfy maintenance`, `wpfy update`

Flat commands are the canonical VM/operator target surface where exact equivalents exist. Grouped `wpfy site ...` and `wpfy stack ...` commands are retained for this release; flat `run`, `backup`, `restore`, `wp`, `rm`, and `config` are primary where they match grouped site behavior. Per the 2026-08-25 decision, grouped compatibility surfaces and confirmed legacy removals are deprecated in 1.0 and are not removed earlier than 1.1; each removal ships with actionable migration guidance naming the replacement command. `wpfy config` prints sanitized status only and routes mutations through the existing site update path, `wpfy edit --print-path` prints the config path without contents, `wpfy edit` requires an editor and creates a backup, and `wpfy refresh` regenerates scaffold files from authoritative state without restarting unless `--restart` is passed. `wpfy healthcheck` provides plain text operator checks with nonzero exit for failed checks, `wpfy motd` prints a safe login summary, and `wpfy utility` generates offline values without Docker or site mutation. `wpfy backup all`, backup listing, restore listing, explicit latest restore, local pruning, remote S3-compatible list/restore/delete/prune, named storage profiles, edge backup/restore, and one systemd backup timer are implemented. `wpfy dns cloudflare` stores the Cloudflare token used by wildcard SSL. `wpfy cron` runs WordPress due events and small interval health tasks, while automatic cron uses systemd timers per interval; backups remain on `wpfy backup schedule`. `wpfy smtp` stores and tests outbound SMTP settings only and does not send automatic notifications. `wpfy security fail2ban` operates the shared host fail2ban service (status/repair/test/unban) that backs Login Shield, and `wpfy site security <domain> fail2ban on|off|status|reset` manages the opt-in per-site WordPress Login Shield; see `commands/wpfy-security-fail2ban.md` and amended ADR 0023.

## Command Docs
- `commands/runtime.md`
- `commands/config.md`
- `commands/operator.md`
- `commands/site-create.md`
- `commands/site-delete.md`
- `commands/site-list.md`
- `commands/site-ssl.md`
- `commands/site-backup.md`
- `commands/site-restore.md`
- `commands/backup-storage-schedule.md`
- `commands/cron.md`
- `commands/smtp.md`
- `commands/sftp.md`
- `commands/stack-install.md`
- `commands/wpfy-security-fail2ban.md`

## Deferred Command Surface
- Grouped `site` and `stack` commands are deprecated in 1.0 and retained through it; removal happens no earlier than 1.1, each with actionable migration guidance.
- Page 8 validation exercises flat commands where they exist, but grouped `wpfy stack ...` remains operationally required until a flat stack replacement is planned.
- Grouped site status/SSL/list/show surfaces and grouped stack lifecycle commands are retained for this release; future flat replacements require a separate product decision.
- Provider bucket lifecycle API automation remains deferred; wpfy-managed remote prune is implemented.
- `stack install --phpmyadmin`, `--adminer`, and `--composer` pull pinned-major helper images. `--mysqltuner` skips until a vetted pinned image exists.
- `stack migrate` is deprecated in 1.0 and is removed no earlier than 1.1; it was never implemented for Docker-first v1.
- Wildcard SSL is implemented for Cloudflare DNS only.

## Command Rules
- Commands must be idempotent.
- Commands must not share per-site PHP, DB, Redis, or writable app volumes.
- `wpfy stack purge` requires `--force`; failed stop or Compose teardown returns non-zero and does not print successful removal.
- `wpfy clean` defaults to nginx when no cache flag is supplied; any requested cache execution failure returns non-zero while successful/skipped site messages remain visible.
- SSL commands must run DNS/IP preflight before ACME issuance.
- Documentation must label unimplemented commands as planned.
