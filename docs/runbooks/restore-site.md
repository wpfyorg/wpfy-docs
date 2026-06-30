# Runbook: Restore Site

## Status
- Implemented with archive validation and optional SQL import.

## Goal
Restore a site from a backup without crossing site isolation boundaries.

## Steps
1. Confirm the backup belongs to the target site.
2. Run `wpfy site restore <domain> <backup-path>`.
3. The restore validates archive members before extraction.
4. The runtime is restarted and SQL dumps are imported after DB readiness when present.
5. Verify site health with `wpfy site status <domain>`.

## Safety
- Restore rejects archives rooted at a different domain and unsafe paths, links, and device files.
- Use disposable validation before restoring into a production site.
