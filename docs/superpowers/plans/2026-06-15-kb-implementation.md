# KB Implementation Plan: docs.wpfy.org

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VitePress-powered knowledge base at docs.wpfy.org with MotherDuck custom theme, 32 articles across 6 categories, deployed via GitHub Pages.

**Architecture:** VitePress reads markdown from `kb/` directory, renders static HTML via Vue SSR at build time. Custom CSS theme overrides VitePress defaults with MotherDuck design tokens (cream/ink palette, IBM Plex Mono + Inter fonts, 2px borders, hard shadows). GitHub Actions builds on push to main, deploys `kb/.vitepress/dist` to GitHub Pages. CNAME at docs.wpfy.org.

**Tech Stack:** VitePress ^1.x, Vue 3 (shipped with VitePress), Node 20+, GitHub Actions (upload-pages-artifact + deploy-pages)

**Design tokens (from website/assets/styles.css):**
```
--cream: #f4efea;
--paper: #ffffff;
--ink: #383838;
--ink-soft: #5c5c5c;
--blue: #97d4ff;
--yellow: #ffde00;
--teal: #53dbc9;
--red: #f2655a;
--green: #1fa04c;
--mono: "IBM Plex Mono", ui-monospace, "SF Mono", Menlo, monospace;
--sans: "Inter", -apple-system, "Segoe UI", Roboto, sans-serif;
--border: 2px solid var(--ink);
--shadow: 5px 5px 0 var(--ink);
```

---
## File Map

| File | Responsibility |
|------|---------------|
| `kb/index.md` | KB landing page with category grid |
| `kb/.vitepress/config.ts` | Sidebar, nav, search, site metadata |
| `kb/.vitepress/theme/index.ts` | Theme entry, imports custom CSS |
| `kb/.vitepress/theme/custom.css` | MotherDuck visual overrides |
| `kb/getting-started/*.md` (4) | Intro, install, quick-start, requirements |
| `kb/site-commands/*.md` (11) | All `wpfy site *` commands |
| `kb/stack-commands/*.md` (4) | All `wpfy stack *` commands |
| `kb/operations/*.md` (7) | Debug, clean, log, secure, info, maintenance, update |
| `kb/sftp/*.md` (1) | SFTP management |
| `kb/reference/*.md` (5) | Architecture, security, SSL, env vars, server layout |
| `package.json` | Node dependencies (vitepress, vue) |
| `.github/workflows/deploy-kb.yml` | Build + deploy to GitHub Pages |
| `.gitignore` | Add kb/.vitepress/dist, kb/.vitepress/cache, node_modules |

Existing `docs/` and `website/` directories are NOT touched.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Add Node dependencies**

```bash
# Run from project root
npm init -y
npm install -D vitepress vue
```

- [ ] **Step 2: Add scripts to package.json**

Edit `package.json` to add scripts section:

```json
{
  "name": "wpfy-kb",
  "private": true,
  "scripts": {
    "docs:dev": "vitepress dev kb",
    "docs:build": "vitepress build kb",
    "docs:preview": "vitepress preview kb"
  },
  "devDependencies": {
    "vitepress": "^1.6.3",
    "vue": "^3.5.13"
  }
}
```

- [ ] **Step 3: Add KB build artifacts to .gitignore**

Append to `.gitignore`:

```
# VitePress KB
kb/.vitepress/dist
kb/.vitepress/cache
node_modules
```

- [ ] **Step 4: Verify scaffold**

```bash
npm run docs:dev
```
Expected: VitePress dev server starts, shows default welcome page at localhost.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .gitignore kb/
git commit -m "feat: scaffold VitePress KB project"
```

---

### Task 2: VitePress Config & Theme

**Files:**
- Create: `kb/.vitepress/config.ts`
- Create: `kb/.vitepress/theme/index.ts`
- Create: `kb/.vitepress/theme/custom.css`
- Create: `kb/index.md`
- Create: `kb/getting-started/introduction.md`
- Create: `kb/site-commands/site-create.md`

- [ ] **Step 1: Write VitePress config**

Write `kb/.vitepress/config.ts`:

```typescript
import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'WPFY Knowledge Base',
  description: 'Docker-first WordPress server management — documentation and command reference',
  lang: 'en-US',
  base: '/',
  lastUpdated: true,
  cleanUrls: true,

  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap'
    }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  themeConfig: {
    logo: { text: 'wpfy_', },
    search: { provider: 'local' },

    nav: [
      { text: 'wpfy.org', link: 'https://wpfy.org' },
      { text: 'GitHub', link: 'https://github.com/wpfyorg/wpfy' },
    ],

    sidebar: {
      '/getting-started/': [
        { text: 'Getting Started', items: [
          { text: 'Introduction', link: '/getting-started/introduction' },
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Quick Start', link: '/getting-started/quick-start' },
          { text: 'Requirements', link: '/getting-started/requirements' },
        ]},
      ],
      '/site-commands/': [
        { text: 'Site Commands', items: [
          { text: 'wpfy site create', link: '/site-commands/site-create' },
          { text: 'wpfy site update', link: '/site-commands/site-update' },
          { text: 'wpfy site delete', link: '/site-commands/site-delete' },
          { text: 'wpfy site list', link: '/site-commands/site-list' },
          { text: 'wpfy site info', link: '/site-commands/site-info' },
          { text: 'wpfy site show', link: '/site-commands/site-show' },
          { text: 'wpfy site status', link: '/site-commands/site-status' },
          { text: 'wpfy site ssl', link: '/site-commands/site-ssl' },
          { text: 'wpfy site backup', link: '/site-commands/site-backup' },
          { text: 'wpfy site restore', link: '/site-commands/site-restore' },
          { text: 'wpfy site wp', link: '/site-commands/site-wp' },
        ]},
      ],
      '/stack-commands/': [
        { text: 'Stack Commands', items: [
          { text: 'wpfy stack install', link: '/stack-commands/stack-install' },
          { text: 'wpfy stack status', link: '/stack-commands/stack-status' },
          { text: 'wpfy stack upgrade', link: '/stack-commands/stack-upgrade' },
          { text: 'wpfy stack remove', link: '/stack-commands/stack-remove' },
        ]},
      ],
      '/operations/': [
        { text: 'Operations', items: [
          { text: 'wpfy debug', link: '/operations/debug' },
          { text: 'wpfy clean', link: '/operations/clean' },
          { text: 'wpfy log', link: '/operations/log' },
          { text: 'wpfy secure', link: '/operations/secure' },
          { text: 'wpfy info', link: '/operations/info' },
          { text: 'wpfy maintenance', link: '/operations/maintenance' },
          { text: 'wpfy update', link: '/operations/update' },
        ]},
      ],
      '/sftp/': [
        { text: 'SFTP', items: [
          { text: 'wpfy sftp', link: '/sftp/sftp' },
        ]},
      ],
      '/reference/': [
        { text: 'Reference', items: [
          { text: 'Architecture', link: '/reference/architecture' },
          { text: 'Security', link: '/reference/security' },
          { text: 'SSL Flow', link: '/reference/ssl-flow' },
          { text: 'Environment Variables', link: '/reference/environment-variables' },
          { text: 'Server Layout', link: '/reference/server-layout' },
        ]},
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/wpfyorg/wpfy' },
    ],

    footer: {
      message: 'Open source under AGPL-3.0-only',
      copyright: 'wpfy.org',
    },

    editLink: {
      pattern: 'https://github.com/wpfyorg/wpfy/edit/main/kb/:path',
      text: 'Edit this page on GitHub',
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
  },
})
```

- [ ] **Step 2: Write theme entry**

Write `kb/.vitepress/theme/index.ts`:

```typescript
import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default DefaultTheme
```

- [ ] **Step 3: Write MotherDuck custom CSS**

Write `kb/.vitepress/theme/custom.css`:

```css
:root {
  --vp-font-family-base: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
  --vp-font-family-mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace;

  /* MotherDuck palette mapped to VitePress CSS vars */
  --vp-c-bg: #f4efea;
  --vp-c-bg-soft: #ffffff;
  --vp-c-bg-elv: #ffffff;
  --vp-c-bg-alt: #f4efea;

  --vp-c-text-1: #383838;
  --vp-c-text-2: #5c5c5c;

  --vp-c-brand-1: #383838;
  --vp-c-brand-2: #5c5c5c;
  --vp-c-brand-3: #383838;
  --vp-c-brand-soft: rgba(56, 56, 56, 0.08);

  --vp-c-border: #383838;
  --vp-c-divider: #383838;
  --vp-c-gutter: #f4efea;

  /* Code */
  --vp-code-block-bg: #ffffff;
  --vp-code-line-height: 1.7;

  /* Search */
  --vp-c-text-3: #5c5c5c;

  /* Sidebar */
  --vp-sidebar-bg-color: #f4efea;

  /* Nav */
  --vp-nav-bg-color: #f4efea;
  --vp-nav-height: 64px;
}

.dark {
  --vp-c-bg: #1a1a1a;
  --vp-c-bg-soft: #242424;
  --vp-c-bg-elv: #242424;
  --vp-c-bg-alt: #1a1a1a;

  --vp-c-text-1: #f4efea;
  --vp-c-text-2: #a0a0a0;

  --vp-c-brand-1: #97d4ff;
  --vp-c-brand-2: #6fc2ff;
  --vp-c-brand-3: #97d4ff;
  --vp-c-brand-soft: rgba(151, 212, 255, 0.14);

  --vp-c-border: #383838;
  --vp-c-divider: #383838;
  --vp-c-gutter: #1a1a1a;

  --vp-code-block-bg: #242424;

  --vp-sidebar-bg-color: #1a1a1a;
  --vp-nav-bg-color: #1a1a1a;
}

/* Typography — uppercase headings like MotherDuck */
.vp-doc h1, .vp-doc h2, .vp-doc h3 {
  font-family: var(--vp-font-family-mono);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

/* Sidebar headings */
.VPSidebarItem .text {
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.04em;
}

/* Nav logo */
.VPNavBarTitle .title {
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
}

/* Brand buttons */
.VPButton.brand {
  border: 2px solid var(--vp-c-text-1) !important;
  box-shadow: 3px 3px 0 var(--vp-c-text-1);
  border-radius: 2px;
  font-family: var(--vp-font-family-mono);
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.02em;
}

/* Code blocks — bordered like MotherDuck */
.vp-doc div[class*='language-'] {
  border: 2px solid var(--vp-c-text-1);
  border-radius: 2px;
  box-shadow: 3px 3px 0 var(--vp-c-text-1);
}

/* Inline code */
.vp-doc :not(pre) > code {
  background: var(--vp-c-brand-soft);
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 0.9em;
}

/* Tables — bordered */
.vp-doc table {
  border: 2px solid var(--vp-c-text-1);
}
.vp-doc th {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.04em;
}
.vp-doc td {
  border: 1px solid var(--vp-c-text-1);
}

/* Prev/Next footer */
.VPDocFooter {
  border-top: 2px solid var(--vp-c-text-1);
}

/* Sidebar border */
.VPSidebar {
  border-right: 2px solid var(--vp-c-text-1);
}
```

- [ ] **Step 4: Write KB landing page**

Write `kb/index.md`:

```markdown
---
layout: home
title: WPFY Knowledge Base

hero:
  name: wpfy_
  text: Knowledge Base
  tagline: Docker-first WordPress server management for Ubuntu VPS
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/wpfyorg/wpfy

features:
  - icon: 🚀
    title: Getting Started
    details: Install wpfy and create your first WordPress site in minutes.
    link: /getting-started/introduction
  - icon: 📦
    title: Site Commands
    details: Create, update, delete, backup, restore, and manage WordPress sites.
    link: /site-commands/site-create
  - icon: ⚡
    title: Stack Commands
    details: Pull Docker images, manage the Traefik edge proxy, and monitor shared services.
    link: /stack-commands/stack-install
  - icon: 🔧
    title: Operations
    details: Debug issues, clear caches, view logs, audit security, and check for updates.
    link: /operations/debug
  - icon: 📂
    title: SFTP Access
    details: Enable per-site SFTP access with auto-assigned loopback ports.
    link: /sftp/sftp
  - icon: 📖
    title: Reference
    details: Architecture decisions, security model, SSL flow, environment variables, and server layout.
    link: /reference/architecture
---
```

- [ ] **Step 5: Write first sample article (Introduction)**

Write `kb/getting-started/introduction.md`:

```markdown
# Introduction

## What is WPFY?

WPFY is a Docker-first CLI for WordPress server administration on Ubuntu VPS. It replaces host-level Nginx, PHP, MariaDB, and Redis packages with per-site Docker Compose stacks.

Every site runs in its own isolated Compose project — separate containers, volumes, and networks. Traefik sits at the edge as a reverse proxy with automatic Let's Encrypt SSL.

You manage everything through a single CLI: `wpfy`.

## Features

- **Automated WordPress** — spin up a site with `wpfy site create domain.com --wp`
- **Per-site isolation** — each site gets its own PHP, MariaDB, and Redis containers
- **Automatic SSL** — Traefik handles Let's Encrypt with DNS/IP preflight checks
- **One-command backups** — `wpfy site backup domain.com` archives files and database
- **PHP version management** — pick 7.4 through 8.4 per site with `--php 8.3`
- **Cache integration** — FastCGI cache, Redis object cache, WP Rocket, and more
- **SFTP access** — per-site SFTP with `wpfy sftp domain.com --enable`
- **WP-CLI** — run WP-CLI inside any site container via `wpfy site wp domain.com`
- **Diagnostics** — `wpfy debug` audits Docker, Traefik, and all sites

## Requirements

- Ubuntu 22.04 LTS or 24.04 LTS
- Docker Engine and Docker Compose plugin
- A domain name pointing to your server
- Ports 80 and 443 open

## Architecture

```
Internet → Traefik (reverse proxy + SSL) → Nginx → WordPress (PHP-FPM) → MariaDB
                                           → Redis (optional)
                                           → SFTP (optional)
```

All services run as Docker containers orchestrated through Compose files managed by WPFY.

## Next Steps

- [Install WPFY](/getting-started/installation)
- [Create your first site](/site-commands/site-create)
```

- [ ] **Step 6: Write second sample article (site-create) as template validator**

Write `kb/site-commands/site-create.md`:

```markdown
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
- Runs `wp core download` and `wp core install` after runtime is ready
- Prints generated admin password once on first install

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

## Related Commands

- [wpfy site update](/site-commands/site-update) — change PHP version or cache
- [wpfy site delete](/site-commands/site-delete) — remove a site
- [wpfy site ssl](/site-commands/site-ssl) — SSL management
- [Stack install](/stack-commands/stack-install) — install Traefik before first site
```

- [ ] **Step 7: Verify VitePress dev server renders articles**

```bash
npm run docs:dev
```
Expected: Dev server shows landing page with 6 feature cards. Sidebar shows all 6 categories. Introduction and site-create articles render with correct typography, code blocks, and table styles.

- [ ] **Step 8: Run production build**

```bash
npm run docs:build
```
Expected: Build succeeds with no warnings. Output in `kb/.vitepress/dist/`.

- [ ] **Step 9: Commit**

```bash
git add kb/.vitepress/config.ts kb/.vitepress/theme/ kb/index.md kb/getting-started/ kb/site-commands/
git commit -m "feat: VitePress config, MotherDuck theme, landing page, 2 sample articles"
```

---

### Task 3: Write Getting Started Articles (3 remaining)

**Files:**
- Create: `kb/getting-started/installation.md`
- Create: `kb/getting-started/quick-start.md`
- Create: `kb/getting-started/requirements.md`

- [ ] **Step 1: Write installation.md**

Write `kb/getting-started/installation.md`:

```markdown
# Installation

Install WPFY on a fresh Ubuntu VPS with a single command.

## One-Line Install

```bash
curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash
```

## What the Installer Does

1. Verifies Ubuntu 22.04 or 24.04
2. Installs Docker Engine and Compose plugin
3. Creates `/opt/wpfy/`, `/etc/wpfy/`, `/var/lib/wpfy/`, `/var/log/wpfy/`
4. Sets up Python virtual environment in `/opt/wpfy/venv`
5. Installs the `wpfy` CLI at `/usr/local/bin/wpfy`
6. Optionally creates adaptive swap (2–4 GB depending on free disk)
7. Writes `/etc/wpfy/wpfy.conf`

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `WPFY_ACME_EMAIL` | Let's Encrypt contact email (required for SSL) |
| `WPFY_SKIP_RUNTIME=1` | Skip Docker operations (offline-safe) |
| `WPFY_SWAP=0` | Disable automatic swap creation |
| `WPFY_SWAP_SIZE_MB` | Override swap size |
| `WPFY_SOURCE_SHA256` | Verify source archive checksum |
| `WPFY_REF` | Git ref to install (default: `main`) |

## Post-Install

```bash
# Verify installation
wpfy --help

# Install the Traefik edge proxy
wpfy stack install --nginx

# Set your ACME email for SSL
export WPFY_ACME_EMAIL=you@example.com
wpfy stack install --nginx
```

## Troubleshooting

**Docker not found:** The installer fetches Docker from get.docker.com. On some VPS images, run `apt update` first.

**Swap creation skipped:** If you have < 8 GB free on `/`, the installer skips swap. Set `WPFY_SWAP_SIZE_MB=1024` to force a smaller swap.

**Logs:** Installation logs are written to `/var/log/wpfy/install.log`.
```

- [ ] **Step 2: Write quick-start.md**

Write `kb/getting-started/quick-start.md`:

```markdown
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
```

- [ ] **Step 3: Write requirements.md**

Write `kb/getting-started/requirements.md`:

```markdown
# Requirements

## Server

| Requirement | Details |
|-------------|---------|
| OS | Ubuntu 22.04 LTS or 24.04 LTS (x86_64) |
| RAM | 1 GB minimum (2 GB recommended for WordPress) |
| Disk | 10 GB minimum (20 GB+ recommended) |
| Docker | Engine 24+ with Compose plugin v2 |
| Python | 3.10+ (installed automatically by the installer) |

## Network

| Requirement | Details |
|-------------|---------|
| Port 80 | Open inbound (HTTP, ACME HTTP-01 challenge) |
| Port 443 | Open inbound (HTTPS, Traefik TLS termination) |
| Domain | A/AAAA record pointing to VPS public IP |

## Cloud Providers

WPFY has been tested on:

- HostHatch (Ubuntu 24.04)
- DigitalOcean (Ubuntu 22.04/24.04)
- Linode (Ubuntu 22.04/24.04)
- Vultr (Ubuntu 22.04/24.04)
- Hetzner Cloud (Ubuntu 22.04/24.04)

## Supported Stacks

| Stack | Flag | Description |
|-------|------|-------------|
| WordPress | `--wp` | Default WordPress with Nginx + PHP-FPM + MariaDB |
| Static HTML | `--html` | Nginx serving static files |

## PHP Versions

WPFY supports PHP 7.4 through 8.4 via pre-built Docker images (`ghcr.io/wpfyorg/php-fpm`). Select per site with `--php`:

```bash
wpfy site create example.com --wp --php 8.1
wpfy site update example.com --php 8.4
```
```

- [ ] **Step 4: Verify build**

```bash
npm run docs:build
```
Expected: No build errors. All 5 articles rendered (index + 4 getting-started + site-create).

- [ ] **Step 5: Commit**

```bash
git add kb/getting-started/
git commit -m "feat: add Installation, Quick Start, Requirements articles"
```

---

### Task 4: Write New Site Command Articles (10 articles)

**Files (create all):**
- `kb/site-commands/site-update.md`
- `kb/site-commands/site-delete.md`
- `kb/site-commands/site-list.md`
- `kb/site-commands/site-info.md`
- `kb/site-commands/site-show.md`
- `kb/site-commands/site-status.md`
- `kb/site-commands/site-ssl.md`
- `kb/site-commands/site-backup.md`
- `kb/site-commands/site-restore.md`
- `kb/site-commands/site-wp.md`

- [ ] **Step 1: Write site-update.md**

Write `kb/site-commands/site-update.md`:

```markdown
# wpfy site update

Change a site's PHP version, cache configuration, or admin password.

## Syntax

```bash
wpfy site update <domain> --php 8.4
wpfy site update <domain> --wpredis
wpfy site update <domain> --password
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--php` | string | PHP version: `7.4`, `8.0`, `8.1`, `8.2`, `8.3`, `8.4` |
| `--wpfc` | bool | Enable Nginx FastCGI cache |
| `--wpredis` | bool | Enable Redis object cache |
| `--wpsc` | bool | Enable WP Super Cache |
| `--wprocket` | bool | Enable WP Rocket |
| `--wpce` | bool | Enable WP Cache Enabler |
| `-le`, `--letsencrypt` | bool | Enable SSL (same as `wpfy site ssl --letsencrypt`) |
| `--password` | bool | Rotate WordPress admin password (prompts over stdin) |

## Examples

```bash
wpfy site update example.com --php 8.4
wpfy site update example.com --wpredis
wpfy site update example.com --password
wpfy site update example.com -le
```

## Expected Behavior

- Regenerates `compose.yaml` with new PHP image tag or cache labels
- Restarts site runtime (`docker compose up -d`)
- For `--password`: finds the WordPress administrator user, prompts for new password over stdin, never prints the value
- For `-le`: runs DNS preflight before changes, same as SSL enablement

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Site not found | `site not found` error |
| Invalid PHP version | Rejected, lists valid versions |
| PHP change fails to restart | Compose project left in previous state |

## Related Commands

- [wpfy site create](/site-commands/site-create)
- [wpfy site ssl](/site-commands/site-ssl)
- [wpfy site status](/site-commands/site-status)
```

- [ ] **Step 2: Write site-delete.md**

Write `kb/site-commands/site-delete.md`:

```markdown
# wpfy site delete

Remove a managed site and its resources. Asks for confirmation by default.

## Syntax

```bash
wpfy site delete <domain>
```

## Examples

```bash
wpfy site delete example.com
```

## Expected Behavior

- Stops site runtime (`docker compose down`)
- Removes site scaffold from `/opt/wpfy/sites/<domain>/`
- Removes registry entry from `/var/lib/wpfy/sites.json`
- Does NOT remove backups (they stay under `/var/lib/wpfy/backups/<domain>/`)

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Site not found | `site not found` error |
| Runtime stop fails | Deletion continues, scaffold removed |

## Related Commands

- [wpfy site create](/site-commands/site-create)
- [wpfy site restore](/site-commands/site-restore)
```

- [ ] **Step 3: Write site-list.md**

Write `kb/site-commands/site-list.md`:

```markdown
# wpfy site list

List all managed sites from the JSON registry.

## Syntax

```bash
wpfy site list
wpfy site list --enabled
wpfy site list --disabled
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--enabled` | bool | Show only SSL-enabled sites |
| `--disabled` | bool | Show only non-SSL sites |

## Examples

```bash
wpfy site list
wpfy site list --enabled
```

## Expected Behavior

- Reads `/var/lib/wpfy/sites.json`
- Outputs a table: domain, flavor, PHP version, SSL status, creation date

## Related Commands

- [wpfy site status](/site-commands/site-status) — detailed health per site
- [wpfy info](/operations/info) — aggregate state
```

- [ ] **Step 4: Write site-info.md**

Write `kb/site-commands/site-info.md`:

```markdown
# wpfy site info

Show detailed metadata and file paths for a site. Secrets are sanitized.

## Syntax

```bash
wpfy site info <domain>
```

## Examples

```bash
wpfy site info example.com
```

## Expected Output

- Domain, flavor, PHP version, SSL status
- File paths: compose.yaml, .env, app root, nginx config
- Container names and image tags
- Registry metadata from `/var/lib/wpfy/sites.json`

## Security Notes

WPFY never prints secrets from `.env` or state files. Password fields are redacted.

## Related Commands

- [wpfy site status](/site-commands/site-status) — runtime health
- [wpfy site show](/site-commands/site-show) — raw compose.yaml
```

- [ ] **Step 5: Write site-show.md**

Write `kb/site-commands/site-show.md`:

```markdown
# wpfy site show

Display the generated `compose.yaml` for a site.

## Syntax

```bash
wpfy site show <domain>
```

## Examples

```bash
wpfy site show example.com
```

## Expected Output

The full Docker Compose definition for the site — services, networks, volumes, labels. Useful for debugging or manual inspection.

## Related Commands

- [wpfy site info](/site-commands/site-info) — parsed metadata
- [wpfy debug](/operations/debug) — full diagnostics
```

- [ ] **Step 6: Write site-status.md**

Write `kb/site-commands/site-status.md`:

```markdown
# wpfy site status

Show site readiness: scaffold, bootstrap, runtime, HTTP health, and service checks.

## Syntax

```bash
wpfy site status <domain>
```

## Examples

```bash
wpfy site status example.com
```

## Expected Output

| Check | What it verifies |
|-------|-----------------|
| Scaffold | `compose.yaml` and `.env` exist |
| Bootstrap | WordPress files exist in `app/` |
| Runtime | Containers are running (`docker compose ps`) |
| HTTP | `healthz.html` returns 200 |
| SSL | Certificate metadata (issuer, expiry, SANs) |
| Services | Flavor-aware: MariaDB, Redis, WP-CLI |

## When Docker is Unavailable

If `WPFY_SKIP_RUNTIME=1` is set or Docker is missing, status falls back to scaffold-only checks and reports `runtime unavailable`.

## Related Commands

- [wpfy site list](/site-commands/site-list) — all sites at a glance
- [wpfy debug](/operations/debug) — deep diagnostic audit
```

- [ ] **Step 7: Write site-ssl.md (migrate from existing doc)**

Write `kb/site-commands/site-ssl.md`:

```markdown
# wpfy site ssl

Enable or manage Let's Encrypt SSL for a site.

## Syntax

```bash
wpfy site ssl <domain> --letsencrypt
wpfy site ssl <domain> --status
wpfy site ssl <domain> --renew
wpfy site ssl <domain> --preflight-only
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--letsencrypt` | bool | Enable SSL (runs DNS preflight first) |
| `--status` | bool | Show certificate issuer, validity, SANs, expiry |
| `--renew` | bool | Force certificate renewal |
| `--preflight-only` | bool | Run DNS/IP checks without changing anything |
| `--proxied` | bool | Force HTTP-01 challenge (for proxied domains) |
| `--no-proxied` | bool | Force TLS-ALPN-01 (direct connection) |

## Examples

```bash
wpfy site ssl example.com --letsencrypt
wpfy site ssl example.com --status
wpfy site ssl example.com --renew
wpfy site ssl example.com --preflight-only
```

## Expected Behavior

**`--letsencrypt`:**
- Runs DNS A/AAAA vs public IP preflight
- Blocks file changes if preflight fails
- Updates site scaffold with Traefik router labels
- Restarts runtime so Traefik picks up the new labels
- For WordPress: updates `home` and `siteurl` to `https://`

**`--status`:**
- Reads Traefik ACME storage (`acme.json`)
- Reports issuer, validity period, SANs, days until expiry
- Warns when expiry is < 30 days

**`--renew`:**
- Removes domain entry from `acme.json`
- Reloads Traefik so it reissues on next request

## Proxied Domains (Cloudflare)

WPFY auto-detects Cloudflare-proxied domains during preflight. When detected:
- Uses HTTP-01 challenge instead of TLS-ALPN-01
- Cloudflare forwards `/.well-known/acme-challenge/` to origin on port 80
- Set CF SSL mode to **Full** or **Full (strict)**

Override auto-detection with `--proxied` or `--no-proxied`.

## Preflight Requirement

Requires `WPFY_ACME_EMAIL` to be set before SSL enrollment. Fix by running:

```bash
export WPFY_ACME_EMAIL=you@example.com
wpfy stack install --nginx
```

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| No ACME email configured | Blocked, no file changes |
| DNS doesn't point to VPS | Preflight fails, blocked |
| Public IP detection fails | Preflight fails, blocked |
| Traefik ACME storage unavailable | Status read fails |
| ACME issuance fails | Non-zero exit after preflight passes |

## Related Commands

- [wpfy site create -le](/site-commands/site-create)
- [Stack install](/stack-commands/stack-install)
```

- [ ] **Step 8: Write site-backup.md (migrate from existing doc)**

Write `kb/site-commands/site-backup.md`:

```markdown
# wpfy site backup

Create a timestamped backup archive of site files and database.

## Syntax

```bash
wpfy site backup <domain>
```

## Examples

```bash
wpfy site backup example.com
```

## Expected Behavior

- Creates tarball at `/var/lib/wpfy/backups/<domain>/<domain>-<timestamp>.tar.gz`
- Includes: app files, database dump, `.env`, `compose.yaml`, nginx config
- Backup is not world-readable
- Does not stop the running site

## Backup Contents

| Path in archive | Content |
|-----------------|---------|
| `app/` | WordPress files |
| `db-dump.sql` | MariaDB dump |
| `.env` | Environment variables (secrets preserved) |
| `compose.yaml` | Compose project definition |
| `nginx/` | Nginx configuration |

## Related Commands

- [wpfy site restore](/site-commands/site-restore)
```

- [ ] **Step 9: Write site-restore.md (migrate from existing doc)**

Write `kb/site-commands/site-restore.md`:

```markdown
# wpfy site restore

Restore a site from a backup archive.

## Syntax

```bash
wpfy site restore <domain> /path/to/backup.tar.gz
```

## Examples

```bash
wpfy site restore example.com /var/lib/wpfy/backups/example.com/example.com-20260601-120000.tar.gz
```

## Expected Behavior

1. Validates archive members (no path traversal, absolute paths, links, devices)
2. Rejects archives rooted at a different domain
3. Stops existing runtime if present
4. Extracts scaffold files (`.env`, `compose.yaml`, `nginx/`, `app/`)
5. Starts runtime
6. Waits for MariaDB readiness
7. Imports SQL dump if present in archive
8. Preserves live DB credentials when `db-data/` is initialized

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Archive contains path traversal | Rejected before extraction |
| Archive domain mismatch | Rejected before extraction |
| Runtime start fails | Files extracted, error reported |
| SQL import fails | Runtime left running, import error reported |

## Related Commands

- [wpfy site backup](/site-commands/site-backup)
- [wpfy site create](/site-commands/site-create)
```

- [ ] **Step 10: Write site-wp.md**

Write `kb/site-commands/site-wp.md`:

```markdown
# wpfy site wp

Run WP-CLI commands inside a site's wpcli container.

## Syntax

```bash
wpfy site wp <domain> <wp-cli args...>
```

## Examples

```bash
wpfy site wp example.com plugin list
wpfy site wp example.com plugin install wordpress-seo --activate
wpfy site wp example.com user list
wpfy site wp example.com option get siteurl
wpfy site wp example.com core update
wpfy site wp example.com theme install twentytwentyfour --activate
```

## Expected Behavior

- Executes the WP-CLI command inside the site's `wpcli` Docker container
- Passes `--allow-root` automatically (the container runs as root)
- Streams output to stdout

## Common Tasks

```bash
# List active plugins
wpfy site wp example.com plugin list --status=active

# Create a new admin user
wpfy site wp example.com user create editor editor@example.com --role=editor

# Check WordPress version and updates
wpfy site wp example.com core check-update

# Export database
wpfy site wp example.com db export - > backup.sql

# Flush rewrite rules
wpfy site wp example.com rewrite flush
```

## Related Commands

- [wpfy site create](/site-commands/site-create)
- [wpfy site update](/site-commands/site-update)
```

- [ ] **Step 11: Verify build**

```bash
npm run docs:build
```
Expected: No build errors. All 13 site-command articles resolve. Sidebar links work.

- [ ] **Step 12: Commit**

```bash
git add kb/site-commands/
git commit -m "feat: write all site command articles (10 new)"
```

---

### Task 5: Write Stack Command Articles (3 new + 1 migrate)

**Files:**
- Create: `kb/stack-commands/stack-status.md`
- Create: `kb/stack-commands/stack-upgrade.md`
- Create: `kb/stack-commands/stack-remove.md`
- Migrate: `kb/stack-commands/stack-install.md` (from existing `docs/commands/stack-install.md`)

- [ ] **Step 1: Write stack-install.md**

Write `kb/stack-commands/stack-install.md`:

```markdown
# wpfy stack install

Bootstrap or verify shared runtime stack components.

## Syntax

```bash
wpfy stack install --nginx
wpfy stack install --php
wpfy stack install --php 8.3
wpfy stack install --all
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--nginx` | bool | Scaffold and start Traefik edge proxy |
| `--php` | string | Pull PHP-FPM image (default: 8.4; also: 7.4, 8.0–8.3) |
| `--mysql`, `--mariadb` | bool | Pull MariaDB image |
| `--redis` | bool | Pull Redis image |
| `--wpcli` | bool | Pull default PHP image for WP-CLI |
| `--all` | bool | Install all v1 Docker-backed components |
| `--phpmyadmin`, `--adminer`, `--composer`, `--mysqltuner` | — | Deferred to v2 |

## Examples

```bash
wpfy stack install --nginx --php --mysql --redis --wpcli
wpfy stack install --nginx
wpfy stack install --php 8.1
```

## Expected Behavior

**Traefik (`--nginx`):**
- Creates `/opt/wpfy/traefik/compose.yaml` and `traefik.yml`
- Creates shared `wpfy` Docker network
- Reads `WPFY_ACME_EMAIL` for ACME configuration
- Starts Traefik container with read-only Docker socket

**PHP images:**
- Pulls from `ghcr.io/wpfyorg/php-fpm:<version>`
- Never builds on the VPS — pull-only
- Default version: 8.4

**All other components:**
- Pull official Docker images (MariaDB, Redis)

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Docker unavailable | Error, nothing installed |
| Compose plugin missing | Error, nothing installed |
| Traefik start fails | Error, check `docker compose logs` |
| Image pull fails | Error for that component, others continue |

## Related Commands

- [wpfy stack status](/stack-commands/stack-status)
- [wpfy stack upgrade](/stack-commands/stack-upgrade)
```

- [ ] **Step 2: Write stack-status.md**

Write `kb/stack-commands/stack-status.md`:

```markdown
# wpfy stack status

Show shared stack component status.

## Syntax

```bash
wpfy stack status
```

## Examples

```bash
wpfy stack status
```

## Expected Output

- Docker Engine version and status
- Traefik container status and uptime
- Pulled WPFY images listed by tag
- Shared network `wpfy` existence

## Related Commands

- [wpfy stack install](/stack-commands/stack-install)
- [wpfy info](/operations/info) — aggregate state
```

- [ ] **Step 3: Write stack-upgrade.md**

Write `kb/stack-commands/stack-upgrade.md`:

```markdown
# wpfy stack upgrade

Pull updated Traefik image and restart.

## Syntax

```bash
wpfy stack upgrade
```

## Examples

```bash
wpfy stack upgrade
```

## Expected Behavior

- Pulls latest pinned Traefik image (`traefik:v3.6.17`)
- Restarts Traefik container
- Site containers are unaffected (they run in separate Compose projects)

## Related Commands

- [wpfy stack install](/stack-commands/stack-install)
- [wpfy stack status](/stack-commands/stack-status)
```

- [ ] **Step 4: Write stack-remove.md**

Write `kb/stack-commands/stack-remove.md`:

```markdown
# wpfy stack remove

Stop the Traefik edge proxy.

## Syntax

```bash
wpfy stack remove
```

## Examples

```bash
wpfy stack remove
```

## Expected Behavior

- Stops Traefik container (`docker compose down`)
- Does NOT remove Traefik scaffold files
- Does NOT remove the `wpfy` network
- Site containers keep running (they lose proxy routing)

## Warning

With Traefik stopped, sites become unreachable at their domains. Run `wpfy stack install --nginx` to restore.

## Related Commands

- [wpfy stack install](/stack-commands/stack-install)
- [wpfy stack purge](/stack-commands/stack-purge) — remove completely including volumes
```

- [ ] **Step 5: Verify build**

```bash
npm run docs:build
```
Expected: No build errors. All 4 stack command articles render.

- [ ] **Step 6: Commit**

```bash
git add kb/stack-commands/
git commit -m "feat: write all stack command articles (4)"
```

---

### Task 6: Write Operations Articles (7 articles)

**Files (create all):**
- `kb/operations/debug.md`
- `kb/operations/clean.md`
- `kb/operations/log.md`
- `kb/operations/secure.md`
- `kb/operations/info.md`
- `kb/operations/maintenance.md`
- `kb/operations/update.md`

- [ ] **Step 1: Write debug.md**

Write `kb/operations/debug.md`:

```markdown
# wpfy debug

Run full diagnostics across Docker, Traefik, and all managed sites.

## Syntax

```bash
wpfy debug
wpfy debug <domain>
```

## Examples

```bash
wpfy debug
wpfy debug example.com
```

## Expected Output

Reports PASS / WARN / FAIL for each check:

| Category | Checks |
|----------|--------|
| Docker | Engine availability, Compose plugin, version |
| Traefik | Container status, network, ACME config |
| Disk | Usage under `/opt/wpfy/`, `/var/lib/wpfy/` |
| Registry | Filesystem consistency, orphaned/unregistered sites |
| Per-site | Compose config, container health, HTTP response, SSL cert, DB connectivity |

## Related Commands

- [wpfy site status](/site-commands/site-status) — single site health
- [wpfy secure](/operations/secure) — security audit
```

- [ ] **Step 2: Write clean.md**

Write `kb/operations/clean.md`:

```markdown
# wpfy clean

Clear site caches.

## Syntax

```bash
wpfy clean <domain> --all
wpfy clean <domain> --nginx
wpfy clean <domain> --redis
wpfy clean <domain> --opcache
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--all` | bool | Clear all caches |
| `--nginx` | bool | Clear Nginx FastCGI, proxy, and uwsgi caches |
| `--redis` | bool | Run `FLUSHALL` on Redis |
| `--opcache` | bool | Reset PHP OPcache via `kill -USR2` |

## Examples

```bash
wpfy clean example.com --all
wpfy clean example.com --redis
```

## Expected Behavior

Each flag targets a specific cache layer inside the site's containers. No files are deleted. Site stays running.

## Related Commands

- [wpfy debug](/operations/debug)
```

- [ ] **Step 3: Write log.md**

Write `kb/operations/log.md`:

```markdown
# wpfy log

View or reset site container logs.

## Syntax

```bash
wpfy log show <domain> --nginx
wpfy log show <domain> --php
wpfy log show <domain> --mysql
wpfy log show <domain> -f
wpfy log show <domain> --lines 100
wpfy log reset <domain>
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `show` | subcommand | Display logs |
| `reset` | subcommand | Restart containers to clear logs |
| `--nginx` | bool | Nginx access/error logs |
| `--php` | bool | PHP-FPM logs |
| `--mysql` | bool | MariaDB logs |
| `-f`, `--follow` | bool | Follow log output (tail -f) |
| `--lines` | int | Number of lines to show (default: 50) |

## Examples

```bash
wpfy log show example.com --nginx -f
wpfy log show example.com --php --lines 200
wpfy log reset example.com
```

## Related Commands

- [wpfy debug](/operations/debug)
```

- [ ] **Step 4: Write secure.md**

Write `kb/operations/secure.md`:

```markdown
# wpfy secure

Audit site and container hardening.

## Syntax

```bash
wpfy secure
wpfy secure <domain>
```

## Examples

```bash
wpfy secure
wpfy secure example.com
```

## Expected Output

Per-site checks:

| Check | What it audits |
|-------|---------------|
| File permissions | `/opt/wpfy/sites/<domain>/` ownership and mode |
| Privileged mode | Container running with `--privileged` |
| no-new-privileges | `--security-opt no-new-privileges` |
| `NET_RAW` dropped | Network capability restriction |
| PID limits | `--pids-limit` set |
| Memory limits | Container memory limit configured |
| Log rotation | Log driver with rotation policy |
| Root user | Container running as root (warning) |
| Host port binds | Ports exposed on `0.0.0.0` |

## Related Commands

- [wpfy debug](/operations/debug)
- [Security reference](/reference/security)
```

- [ ] **Step 5: Write info.md**

Write `kb/operations/info.md`:

```markdown
# wpfy info

Show aggregate state across all managed sites and stack components.

## Syntax

```bash
wpfy info
wpfy info <domain>
```

## Examples

```bash
wpfy info
wpfy info example.com
```

## Expected Output

**Aggregate (no domain):**
- Site count
- Traefik status
- Docker version
- Registry health

**Per-site:**
- Same output as `wpfy site info <domain>` with sanitized secrets

## Related Commands

- [wpfy site info](/site-commands/site-info) — detailed per-site metadata
- [wpfy stack status](/stack-commands/stack-status)
```

- [ ] **Step 6: Write maintenance.md**

Write `kb/operations/maintenance.md`:

```markdown
# wpfy maintenance

Toggle maintenance mode for a site.

## Syntax

```bash
wpfy maintenance <domain> --on
wpfy maintenance <domain> --off
```

## Examples

```bash
wpfy maintenance example.com --on
wpfy maintenance example.com --off
```

## Expected Behavior

Enables or disables a maintenance page served by Nginx. When active, visitors see a maintenance notice instead of the site. Useful during updates or migrations.

## Related Commands

- [wpfy site update](/site-commands/site-update)
```

- [ ] **Step 7: Write update.md**

Write `kb/operations/update.md`:

```markdown
# wpfy update

Check for new WPFY CLI releases.

## Syntax

```bash
wpfy update --check
```

## Examples

```bash
wpfy update --check
```

## Expected Output

- Current installed version
- Latest available version from GitHub releases
- Upgrade instructions if newer version exists

## Related Commands

- [Stack upgrade](/stack-commands/stack-upgrade) — update Traefik
```

- [ ] **Step 8: Verify build**

```bash
npm run docs:build
```
Expected: No build errors. All 7 operations articles render.

- [ ] **Step 9: Commit**

```bash
git add kb/operations/
git commit -m "feat: write all operations articles (7)"
```

---

### Task 7: Write SFTP + Reference Articles (6 articles)

**Files (create all):**
- `kb/sftp/sftp.md`
- `kb/reference/architecture.md`
- `kb/reference/security.md`
- `kb/reference/ssl-flow.md`
- `kb/reference/environment-variables.md`
- `kb/reference/server-layout.md`

- [ ] **Step 1: Write sftp.md (migrate from existing doc)**

Write `kb/sftp/sftp.md`:

```markdown
# wpfy sftp

Manage per-site SFTP access.

## Syntax

```bash
wpfy sftp <domain> --enable
wpfy sftp <domain> --disable
wpfy sftp <domain> --status
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--enable` | bool | Enable SFTP access |
| `--disable` | bool | Disable SFTP access |
| `--status` | bool | Show SFTP status |

## Examples

```bash
wpfy sftp example.com --enable
wpfy sftp example.com --status
wpfy sftp example.com --disable
```

## Expected Behavior

**`--enable`:**
- Adds an atmoz/sftp sidecar container to the site's Compose project
- Allocates a per-site loopback-only host port
- Waits for the port to become available
- Stores credentials in `.env`

**`--status`:**
- Shows enabled/disabled state
- Shows port number
- Never prints the SFTP password value

**`--disable`:**
- Removes SFTP container from Compose project
- Removes SFTP configuration from `.env`

## Security

- SFTP binds to `127.0.0.1` only (loopback)
- Never exposed to the public internet
- Password is generated per site, printed once on enable

## Related Commands

- [wpfy site create](/site-commands/site-create)
```

- [ ] **Step 2: Write architecture.md**

Write `kb/reference/architecture.md`:

```markdown
# Architecture

## Overview

WPFY uses Docker Compose for per-site isolation. Each site runs in its own Compose project with separate containers, volumes, and networks. A shared Traefik instance handles edge routing and SSL termination.

## Component Diagram

```
┌─────────────────────────────────────────────────┐
│                   Internet                        │
└─────────────────┬───────────────────────────────┘
                  │ :80 :443
                  ▼
┌─────────────────────────────────────────────────┐
│  Traefik (shared)                                │
│  - Docker provider (label-based routing)         │
│  - ACME TLS-ALPN-01 / HTTP-01                   │
│  - Read-only Docker socket                       │
└──────┬──────────────────────────────────────────┘
       │ docker network: wpfy
       ▼
┌──────────────────┐ ┌──────────────────┐
│  Site: example1  │ │  Site: example2  │
│  ┌────────────┐  │ │  ┌────────────┐  │
│  │ Nginx      │  │ │  │ Nginx      │  │
│  │            │  │ │  │            │  │
│  ├────────────┤  │ │  ├────────────┤  │
│  │ PHP-FPM    │  │ │  │ PHP-FPM    │  │
│  │            │  │ │  │            │  │
│  ├────────────┤  │ │  ├────────────┤  │
│  │ MariaDB    │  │ │  │ MariaDB    │  │
│  │            │  │ │  │            │  │
│  ├────────────┤  │ │  ├────────────┤  │
│  │ Redis      │  │ │  │ SFTP       │  │
│  │ (optional) │  │ │  │ (optional) │  │
│  ├────────────┤  │ │  └────────────┘  │
│  │ WP-CLI     │  │ │                  │
│  └────────────┘  │ │                  │
└──────────────────┘ └──────────────────┘
```

## File Layout

```
/opt/wpfy/
├── traefik/           # Shared edge proxy
│   ├── compose.yaml
│   ├── traefik.yml
│   └── acme.json
├── sites/
│   └── <domain>/
│       ├── compose.yaml
│       ├── .env
│       ├── app/       # WordPress files
│       ├── nginx/
│       │   └── default.conf
│       ├── php/
│       ├── backups/
│       └── sftp/
└── venv/              # Python virtualenv

/etc/wpfy/
└── wpfy.conf          # Environment config

/var/lib/wpfy/
├── sites.json         # Registry
├── backups/
│   └── <domain>/      # Timestamped tarballs
└── ...
```

## Key Design Decisions

See [ADR index](https://github.com/wpfyorg/wpfy/tree/main/docs/adr) for detailed decision records:

- ADR 0001: Docker Compose over host-level packages
- ADR 0002: JSON file registry with atomic writes
- ADR 0004: Traefik v3 with Docker label auto-discovery
- ADR 0005: Per-site PHP version via versioned images
- ADR 0008: Non-root operator UX with self-elevating wrapper
```

- [ ] **Step 3: Write security.md**

Write `kb/reference/security.md`:

```markdown
# Security

## Isolation Model

Every site runs in its own Docker Compose project. Containers, volumes, and networks are never shared between sites.

| Resource | Isolation |
|----------|-----------|
| PHP-FPM | Per-site container, no shared volumes |
| MariaDB | Per-site container, separate data volume |
| Redis | Per-site container |
| Nginx | Per-site container with generated config |
| SFTP | Per-site container on loopback port |
| WP-CLI | Per-site container, `--allow-root` |

## Container Hardening

WPFY configures these security options by default:

- `no-new-privileges: true` — prevents privilege escalation
- `cap_drop: [NET_RAW]` — drops raw socket capability
- `pids_limit` — limits fork bombs
- `mem_limit` — per-container memory bounds
- Log rotation — prevents disk exhaustion

## Secret Handling

- Generated passwords (SFTP, WordPress admin) are printed once and never persisted in plain-text by WPFY
- `.env` files contain secrets but are never printed in CLI output
- Backup archives are not world-readable
- ACME certificate storage (`acme.json`) is read-only to WPFY
- Registry (`sites.json`) never stores secret values

## Known Limitations

| Concern | Status |
|---------|--------|
| Docker socket access | Traefik has read-only access; Docker daemon compromise affects all sites |
| PHP-FPM user | Currently runs as root (USER www-data deferred — needs volume ownership strategy) |
| Container escape | Docker provides kernel-level isolation, not VM-level isolation |
| Supply-chain | Installer source verification via `WPFY_SOURCE_SHA256` |

## Audit Commands

```bash
wpfy secure          # Full hardening audit
wpfy debug           # Docker + Traefik + site diagnostics
```

For the full security audit report, see the project repository.
```

- [ ] **Step 4: Write ssl-flow.md**

Write `kb/reference/ssl-flow.md`:

```markdown
# SSL Flow

## Certificate Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Preflight  │────▶│   ACME       │────▶│   Renewal    │
│   (DNS/IP)   │     │   Issuance   │     │   (auto)     │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 1. Preflight (DNS/IP Verification)

Before any ACME request, WPFY verifies:

1. Resolve domain's A/AAAA records
2. Detect current VPS public IP
3. Match DNS records to public IP

If they match: preflight passes, proceed to issuance.
If they don't match: blocked, no file changes. Cloudflare-proxied domains are auto-detected and use HTTP-01 instead.

## 2. ACME Issuance

**Direct (default — TLS-ALPN-01):**
- Traefik serves a self-signed cert on port 443 during challenge
- Let's Encrypt validates via TLS-ALPN
- WPFY never touches port 80

**Proxied (HTTP-01):**
- Cloudflare forwards `/.well-known/acme-challenge/` to origin
- Let's Encrypt validates via HTTP
- Requires Cloudflare SSL mode: Full or Full (strict)

## 3. Certificate Storage

Certificates stored in Traefik's `acme.json` at `/opt/wpfy/traefik/acme.json`. WPFY reads this file to report status.

## 4. Renewal

Traefik auto-renews certificates 30 days before expiry. Manual renewal:

```bash
wpfy site ssl example.com --renew
```

## WordPress URL Update

When SSL is enabled on a WordPress site, WPFY updates:
- `home` → `https://<domain>`
- `siteurl` → `https://<domain>`

## Related Commands

- [wpfy site ssl](/site-commands/site-ssl)
- [wpfy site create -le](/site-commands/site-create)
```

- [ ] **Step 5: Write environment-variables.md**

Write `kb/reference/environment-variables.md`:

```markdown
# Environment Variables

WPFY behaviour is configured through environment variables. Set them in your shell profile or `/etc/wpfy/wpfy.conf`.

## Core

| Variable | Default | Description |
|----------|---------|-------------|
| `WPFY_ACME_EMAIL` | — | Let's Encrypt contact email (required for SSL) |
| `WPFY_SKIP_RUNTIME` | — | Set to `1` to skip Docker operations |
| `WPFY_DRY_RUN` | — | Set to `1` for dry-run mode |
| `WPFY_NO_SELF_ELEVATE` | — | Set to `1` to disable sudo self-elevation |

## Installer

| Variable | Default | Description |
|----------|---------|-------------|
| `WPFY_REF` | `main` | Git ref to install |
| `WPFY_SOURCE_SHA256` | — | Verify source archive checksum |
| `WPFY_SKIP_WPFY_INSTALL` | — | Skip pip install (bootstrap use) |
| `WPFY_SWAP` | — | Set to `0` to disable swap creation |
| `WPFY_SWAP_SIZE_MB` | — | Override swap size |
| `WPFY_SWAP_FILE` | `/swapfile` | Swap file location |
| `WPFY_INSTALL_LOG` | `/var/log/wpfy/install.log` | Installer log path |

## Testing / Offline

| Variable | Default | Description |
|----------|---------|-------------|
| `WPFY_TEST_DNS_IPS` | — | Override DNS resolution result |
| `WPFY_TEST_PUBLIC_IPS` | — | Override public IP detection |

## Paths

All `WPFY_*` path variables default to the standard layout:

| Variable | Default |
|----------|---------|
| `WPFY_HOME` | `/opt/wpfy` |
| `WPFY_CONFIG_DIR` | `/etc/wpfy` |
| `WPFY_STATE_DIR` | `/var/lib/wpfy` |
| `WPFY_LOG_DIR` | `/var/log/wpfy` |
| `WPFY_BACKUP_DIR` | `/var/lib/wpfy/backups` |
| `WPFY_REGISTRY_FILE` | `/var/lib/wpfy/sites.json` |
```

- [ ] **Step 6: Write server-layout.md**

Write `kb/reference/server-layout.md`:

```markdown
# Server Layout

## Directory Structure

```
/opt/wpfy/                  # WPFY home
├── traefik/                # Edge proxy
│   ├── compose.yaml
│   └── traefik.yml
├── sites/                  # Per-site scaffolds
│   └── <domain>/
│       ├── compose.yaml    # Docker Compose definition
│       ├── .env            # Environment variables (secrets)
│       ├── app/            # WordPress files (wp-content, etc.)
│       ├── nginx/
│       │   └── default.conf
│       ├── php/
│       ├── backups/
│       └── sftp/
└── venv/                   # Python virtualenv

/etc/wpfy/
└── wpfy.conf               # Environment configuration

/var/lib/wpfy/
├── sites.json              # Site registry (JSON)
└── backups/
    └── <domain>/           # Timestamped backup tarballs

/var/log/wpfy/
└── install.log             # Installer log

/usr/local/bin/wpfy         # CLI wrapper script
```

## Compose Project Naming

Each site's Compose project name is derived from the domain with dots replaced by hyphens: `example.com` → `wpfy-example-com`. Duplicate-neutral project names are rejected at create time.

## Networks

- `wpfy` — shared network, all Traefik-routed sites connect here
- `wpfy-<domain>_default` — per-site internal network for inter-container communication

## Volumes

Every site gets named Docker volumes for persistent data:

- `<domain>_db_data` — MariaDB data
- `<domain>_app` — WordPress files (bind mount to `/opt/wpfy/sites/<domain>/app/`)

Volumes are never shared between sites.
```

- [ ] **Step 7: Verify final build**

```bash
npm run docs:build
```
Expected: No build errors. All 32 articles rendered. Search index generated. Output in `kb/.vitepress/dist/`.

- [ ] **Step 8: Commit**

```bash
git add kb/sftp/ kb/reference/
git commit -m "feat: write SFTP + all reference articles (6)"
```

---

### Task 8: GitHub Actions Deploy Workflow

**Files:**
- Create: `.github/workflows/deploy-kb.yml`

- [ ] **Step 1: Write deploy workflow**

Write `.github/workflows/deploy-kb.yml`:

```yaml
name: Deploy KB to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'kb/**'
      - '.github/workflows/deploy-kb.yml'
      - 'package.json'
      - 'package-lock.json'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run docs:build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: kb/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Verify workflow syntax**

```bash
# Check YAML is valid (requires Python)
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/deploy-kb.yml'))"
```
Expected: No output (no errors).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy-kb.yml
git commit -m "ci: add GitHub Pages deploy workflow for KB"
```

---

### Task 9: Final Verification

- [ ] **Step 1: Full production build**

```bash
npm run docs:build
```
Expected: Clean build with 0 warnings. All 32 articles rendered.

- [ ] **Step 2: Preview the build**

```bash
npm run docs:preview
```
Quick check: navigate to a few articles, verify sidebar links, search works, dark mode toggle works.

- [ ] **Step 3: Run lint if available**

```bash
npx vitepress build kb --debug 2>&1 | grep -i "warn\|error" || echo "No warnings or errors"
```

- [ ] **Step 4: Final commit (any fixes)**

```bash
git status
git add -A
git commit -m "chore: final KB verification fixes"
```

---

## Completion Checklist

- [ ] 32 markdown articles written across 6 categories
- [ ] VitePress config with sidebar, nav, search, edit links
- [ ] MotherDuck custom CSS theme (light + dark mode)
- [ ] All internal links resolve (no broken VitePress warnings)
- [ ] GitHub Actions deploy workflow ready
- [ ] `kb/.vitepress/dist` in `.gitignore`
- [ ] Dev server (`npm run docs:dev`) works
- [ ] Production build (`npm run docs:build`) succeeds

## DNS Setup (Manual)

After merge to main and first successful deploy:

1. In GitHub repo Settings → Pages, set source to "GitHub Actions"
2. Add CNAME record: `docs.wpfy.org` → `wpfyorg.github.io`
3. Add custom domain in Pages settings: `docs.wpfy.org`
4. Wait for DNS propagation + HTTPS certificate provisioning (GitHub handles this)
