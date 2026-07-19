# wpfy site create

Create a managed WordPress or static HTML site with Docker Compose-backed runtime resources.

## Syntax

```bash
wpfy site create <domain> --wp
wpfy site create <domain> --html
wpfy site create <domain> --wp -le
wpfy site create <domain> --wp --php 8.3
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--wp` | bool | Create a WordPress site |
| `--html` | bool | Create a static HTML site |
| `--php` | string | PHP version: `7.4`, `8.0`, `8.1`, `8.2`, `8.3`, `8.4` (default) |
| `-le`, `--letsencrypt` | bool | Enable Let's Encrypt SSL (runs DNS preflight first) |
| `--wpfc` | bool | Enable Nginx FastCGI cache |
| `--wpredis` | bool | Enable Redis object cache |
| `--wpsc` | bool | Enable WP Super Cache |
| `--wprocket` | bool | Enable WP Rocket |
| `--wpce` | bool | Enable WP Cache Enabler |
| `--wpsubdir` | bool | WordPress in subdirectory mode |
| `--wpsubdomain` | bool | WordPress multisite subdomain |
| `--user` | string | WordPress admin username |
| `--email` | string | WordPress admin email |
| `--pass` | string | WordPress admin password (auto-generated if omitted) |
| `--dns` | bool | DNS-only mode (skip runtime) |
| `--proxied` | bool | Force proxied-domain ACME (HTTP-01) |
| `--no-proxied` | bool | Force direct ACME (TLS-ALPN-01) |

## Examples

```bash
wpfy site create example.com --wp
wpfy site create blog.example.com --wp -le --php 8.3
wpfy site create landing.example.com --html
wpfy site create store.example.com --wp --wpredis --user=admin --email=admin@example.com
```

## Expected Behavior

**Files created:**
- `/opt/wpfy/sites/<domain>/compose.yaml` — Docker Compose project definition
- `/opt/wpfy/sites/<domain>/.env` — environment variables for the Compose project
- `/opt/wpfy/sites/<domain>/nginx/default.conf` — Nginx site config
- `/opt/wpfy/sites/<domain>/app/healthz.html` — health check endpoint
- Registry entry in `/var/lib/wpfy/sites.json`

**For WordPress (`--wp`):**
- Resolves the latest stable en_US release and verifies the versioned official tarball against WordPress.org's published SHA-1 before extraction
- Runs `wp core download` and `wp core install` after runtime is ready
- Prints generated admin password once on first install
- Stops before ownership, runtime, credentials, and provisioning if filesystem bootstrap fails; retry reuses the scaffold and secrets
- Rejects destination file/directory symlinks, including nested components, and merges core with descriptor-relative no-follow writes; partial retries require the site runtime to be stopped

**With SSL (`-le`):**
- Runs DNS A/AAAA vs public IP preflight before any file changes
- Adds Traefik router labels for ACME certificate issuance

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Invalid domain | Rejected before file changes |
| Docker unavailable | Scaffold created, runtime skipped |
| DNS/preflight fails (with `-le`) | Blocked, no file changes |
| Missing ACME email (with `-le`) | Blocked, no file changes |
| Compose project name collision | Rejected before file changes |
| WordPress provision fails | Non-zero exit, redacts password |
| WordPress download/archive/filesystem bootstrap fails | Non-zero exit; runtime and provisioning are skipped |
| WordPress release metadata or digest is missing, malformed, or mismatched | Non-zero exit before archive extraction; retry reuses the scaffold |
| WordPress destination or pre-runtime ownership tree contains a symlink | Non-zero exit; external target is unchanged and runtime/provisioning stay skipped |

`WPFY_SKIP_WORDPRESS_DOWNLOAD=1` is an explicit offline test fixture. Unexpected failures never create exit-0 placeholder success.

The SHA-1 comparison is an integrity check, not a release signature or independent authenticity proof.

## Related Commands

- [wpfy site update](/site-commands/site-update) — change PHP version or cache
- [wpfy site delete](/site-commands/site-delete) — remove a site
- [wpfy site ssl](/site-commands/site-ssl) — SSL management
- [Stack install](/stack-commands/stack-install) — install Traefik before first site
