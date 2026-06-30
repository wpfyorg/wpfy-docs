# `wpfy sftp`

## Purpose
Manage per-site SFTP access.

## Status
- Implemented: enables, disables, and reports a per-site SFTP sidecar.

## Syntax
```bash
wpfy sftp <domain> --enable [--password <password>]
wpfy sftp <domain> --disable
wpfy sftp <domain> --status
```

## Examples
```bash
wpfy sftp example.com --enable
wpfy sftp example.com --status
wpfy sftp example.com --disable
```

## Expected Files Touched
- Implemented: updates the authoritative site definition and regenerates `compose.yaml`, `.env`, and registry metadata together.
- Implemented: stores `SFTP_PASSWORD` and `SFTP_PORT` in the private per-site `.env`.
- Implemented: binds the SFTP host port to `127.0.0.1` only.

## Idempotency Behaviour
- Implemented: enabling an already-enabled site regenerates the same definition and restarts the SFTP sidecar without duplicate compose blocks.
- Implemented: disabling an already-disabled site returns success.

## Failure Modes
- Site not found.
- Invalid domain.
- Docker Compose start failure.
- The configured per-site SFTP port not becoming ready after container start.

## Password Behaviour
- Precedence on `--enable`: an explicit `--password` always wins (this is the rotation path), then the already-configured value, then a freshly generated one.
- A newly auto-generated password is printed exactly once in the enable summary (`password (shown once): …`), mirroring the generated WordPress admin password behaviour. Explicit and pre-existing passwords are never echoed.

## Security Notes
- SFTP access must be constrained to the intended site.
- Must not grant access to other sites or global secrets.
- Host port allocation starts at `2222` and skips ports already used by other managed sites.
- `--status` reports whether a password is configured but must not print the password value.
