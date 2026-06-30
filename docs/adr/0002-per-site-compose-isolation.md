# ADR 0002: Per-site Compose isolation

Date: 2026-05-20
Status: Accepted

## Context
The product goal requires strong per-site container isolation so compromise of one WordPress/PHP stack does not directly expose other sites through shared runtime services.

## Decision
Each site gets its own Docker Compose project, containers, network, volumes, database container, and optional Redis container.

## Reasoning
This reduces shared blast radius and avoids common multi-tenant failures from shared PHP, DB, Redis, or writable app volumes.

## Alternatives Considered
- Shared PHP-FPM containers with per-site vhosts.
- Shared MariaDB and Redis containers for all sites.
- One monolithic Compose project for all sites.

## Consequences
- Higher resource usage per site.
- More Compose projects to manage.
- Clearer ownership and safer deletion/backup boundaries.

## Follow-up Tasks
- Define per-site Compose template.
- Define per-site naming conventions.
- Define edge proxy attachment rules.
