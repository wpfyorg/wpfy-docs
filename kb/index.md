---
layout: home
title: wpfy docs
description: Public documentation for the Docker-first WordPress server management CLI.

hero:
  name: wpfy
  text: Public docs
  tagline: Docker-first WordPress and server administration for Ubuntu VPS operators.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/introduction
    - theme: alt
      text: Commands
      link: /commands/run

features:
  - title: Getting Started
    details: Install wpfy, check host requirements, and create a first WordPress site.
    link: /getting-started/introduction
  - title: Commands
    details: Use the flat operator CLI first, with grouped site and stack commands retained where required.
    link: /commands/run
  - title: Backups
    details: Create local archives, configure S3-compatible storage, schedule backups, and restore safely.
    link: /commands/backup
  - title: SSL And DNS
    details: Understand preflight checks, Cloudflare wildcard SSL, and Traefik certificate state.
    link: /runbooks/enable-ssl
  - title: Operations
    details: Run health checks, inspect logs, configure cron and SMTP, and debug managed sites.
    link: /commands/healthcheck
  - title: Runbooks
    details: Follow task-oriented procedures for installs, SSL, restore, backups, and release validation.
    link: /runbooks/fresh-install
  - title: Reference
    details: Review architecture, security boundaries, site isolation, server layout, ADRs, and release status.
    link: /reference/architecture
  - title: Releases
    details: Check release status, retained command surfaces, and deferred work for the current candidate.
    link: /releases/v1.0.0-rc2
---
