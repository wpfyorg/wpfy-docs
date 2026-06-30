# Commands

## Implemented Commands
- `wpfy site create <domain> [flags]`
- `wpfy site update <domain>`
- `wpfy site delete <domain>`
- `wpfy site list [--enabled] [--disabled]`
- `wpfy site info <domain>`
- `wpfy site show <domain>`
- `wpfy site status <domain>`
- `wpfy site ssl <domain> --letsencrypt`
- `wpfy site backup <domain>`
- `wpfy site restore <domain> <backup>`
- `wpfy stack install|remove|purge|migrate|upgrade|status [flags]`
- `wpfy debug`, `wpfy clean`, `wpfy info`, `wpfy log`, `wpfy secure`, `wpfy maintenance`, `wpfy update`

## Command Docs
- `commands/site-create.md`
- `commands/site-delete.md`
- `commands/site-list.md`
- `commands/site-ssl.md`
- `commands/site-backup.md`
- `commands/site-restore.md`
- `commands/sftp.md`
- `commands/stack-install.md`

## Deferred Command Surface
- `stack install --phpmyadmin`, `--adminer`, `--composer`, and `--mysqltuner` report v2 deferral.
- `stack migrate` is not implemented for Docker-first v1.
- Wildcard SSL is deferred until DNS provider validation exists.

## Command Rules
- Commands must be idempotent.
- Commands must not share per-site PHP, DB, Redis, or writable app volumes.
- SSL commands must run DNS/IP preflight before ACME issuance.
- Documentation must label unimplemented commands as planned.
