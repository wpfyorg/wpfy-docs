# Quick Start

Create your first WordPress site in under 5 minutes.

## Prerequisites

- WPFY installed on an Ubuntu VPS
- Traefik running (`wpfy stack install --nginx`)
- Domain pointing to your VPS IP
- `WPFY_ACME_EMAIL` set for SSL

## 1. Create a WordPress Site

```bash
wpfy site create myblog.com --wp
```

This creates the site scaffold, pulls PHP/MySQL images, starts containers, and runs `wp core install`.

## 2. Add SSL

```bash
wpfy site ssl myblog.com --letsencrypt
```

WPFY runs DNS preflight to verify the domain points to your server, then enables SSL via Traefik + Let's Encrypt.

## 3. Run WP-CLI Commands

```bash
wpfy site wp myblog.com plugin list
wpfy site wp myblog.com user list
```

## 4. Back Up

```bash
wpfy site backup myblog.com
```

Creates a timestamped tarball with files and database under `/var/lib/wpfy/backups/myblog.com/`.

## 5. Check Status

```bash
wpfy site status myblog.com
wpfy site list
```

## Next Steps

- [View all site commands](/site-commands/site-create)
- [Enable SFTP access](/sftp/sftp)
- [Set up Redis cache](/site-commands/site-update)
