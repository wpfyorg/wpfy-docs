# Runbook: Debug Site

## Status
- Implemented diagnostic workflow.

## Goal
Investigate a broken managed site.

## Steps
1. Run `wpfy debug` for aggregate Docker, Traefik, registry, disk, site, HTTP, SSL, and DB checks.
2. Run `wpfy site status <domain>` for scaffold/bootstrap/runtime readiness.
3. Run `wpfy info <domain>` for sanitized registry, compose, and environment metadata.
4. Check logs with `wpfy log show <domain> --nginx`, `--php`, or `--mysql`.
5. Verify DNS and certificate status with `wpfy site ssl <domain> --status` when SSL/routing is involved.

## Safety
- Do not attach one site to another site’s network for debugging.
- Do not expose secrets in logs or support output.
