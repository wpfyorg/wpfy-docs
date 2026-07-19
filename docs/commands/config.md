# Flat Config Commands

## Purpose
Inspect or safely update managed-site configuration without printing raw `.env` contents.

## Status
- Implemented: `wpfy config <domain>` shows sanitized config status.
- Implemented: `wpfy config <domain> [flags]` applies controlled updates through the site lifecycle path.
- Implemented: `wpfy edit <domain> --print-path` prints the authoritative `.env` path only.
- Implemented: `wpfy edit <domain>` opens the operator editor, creates a backup, and refreshes scaffold files after a successful edit.
- Implemented: `wpfy refresh <domain|all> [--restart]` regenerates scaffold files from authoritative state.

## Syntax
```bash
wpfy config example.com
wpfy config example.com --php 8.4
wpfy config example.com --wpredis
wpfy config example.com --letsencrypt off
wpfy config example.com --password-stdin
wpfy edit example.com --print-path
wpfy edit example.com
wpfy refresh example.com
wpfy refresh all --restart
```

## Safety Notes
- `config` output is sanitized and must not print database passwords, salts, tokens, SMTP passwords, or raw `.env` content.
- Password changes use prompt or stdin; raw password values are not accepted as CLI arguments.
- `edit` refuses editor mode when no TTY/editor is available.
- `refresh` preserves operator-added `.env` keys and restarts runtime only with `--restart`.

## Compatibility
- Controlled mutations reuse the existing site lifecycle/update path.
- Grouped `wpfy site update` remains a compatibility surface until cleanup.
