# `wpfy site update`

## Purpose
Update a managed site's PHP, cache, SSL, or WordPress administrator password settings.

## Status
- Implemented: grouped compatibility surface for managed-site updates.
- Implemented: password rotation accepts stdin or a TTY prompt without accepting a raw argv password.

## Syntax
```bash
wpfy site update <domain> [--php <version>] [--wpredis] [-le [provider]]
wpfy site update <domain> [--password [-|prompt]]
```

## Examples
```bash
wpfy site update example.com --php 8.4
wpfy site update example.com --wpredis
# Non-interactive automation: read exactly one password line from stdin.
printf '%s\n' "$WPFY_ADMIN_PASSWORD" | wpfy site update example.com --password -
wpfy site update example.com --password prompt
```

## Password Behaviour
- `--password -` reads one password line from stdin.
- `--password prompt` (or `--password` without a value) prompts only from a TTY.
- Raw `--password <password>` values are rejected with exit code 2 so passwords
  never appear in process argv.

- `--php` accepts only `7.4`, `8.0`, `8.1`, `8.2`, `8.3`, or `8.4`;
  `--letsencrypt` accepts only `default`, `wildcard`, or `off`; and `--dns`
  accepts only `cloudflare`. The lifecycle validates persisted and requested
  site state before scaffold regeneration.
