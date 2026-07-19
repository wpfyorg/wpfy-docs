# Operator Commands

## Purpose
Expose script-safe health, login-summary, and offline utility helpers through the canonical flat CLI.

## Status
- Implemented: `wpfy healthcheck all|system|disk|load|app`.
- Implemented: `wpfy motd [--compact]`.
- Implemented: `wpfy utility password|token|username|uid|htpasswd`.

## Syntax
```bash
wpfy healthcheck
wpfy healthcheck disk --warn 80 --fail 90
wpfy healthcheck load
wpfy healthcheck system
wpfy healthcheck app example.com
wpfy healthcheck app --all-sites
wpfy motd
wpfy motd --compact
wpfy utility password --length 32
wpfy utility token --bytes 24
wpfy utility username "Client Site"
wpfy utility uid example.com
printf '%s\n' 'secret' | wpfy utility htpasswd --username admin --password-stdin
```

## Behavior
- Health checks return nonzero when a checked surface fails.
- `WPFY_SKIP_RUNTIME=1` is reported as a warning rather than hidden.
- MOTD summarizes version, Docker, Traefik, managed-site state, and warnings without dumping secrets.
- Utility helpers run offline and do not require Docker or site mutation.

## Security Notes
- Utility output can include generated secrets requested by the operator; do not write those values into docs, evidence, or shared logs.
- MOTD and healthcheck output must not print `.env` values, database credentials, SMTP credentials, SFTP passwords, salts, or tokens.
