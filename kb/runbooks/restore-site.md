# Restore Site

## Goal

Restore a managed site from a validated backup archive.

## Prerequisites

- A backup archive exists locally or in configured remote storage.
- The target domain is the intended restore target.
- Runtime access is available for database import when needed.

## Steps

1. Run `wpfy restore example.com --list`.
2. Select the intended archive.
3. Run `wpfy restore example.com <archive>`.
4. Run `wpfy site status example.com`.

## Verification

Confirm scaffold status, runtime status, and application behavior. For WordPress, run a read-only WP-CLI command.

## Failure Recovery

Unsafe archives are rejected before runtime is stopped. Pick another archive or recreate the backup if validation fails.

## Cleanup

Remove temporary downloaded archives after a remote restore if wpfy reports a retained temp path.

## Related Reference Pages

[`wpfy restore`](../commands/restore), [`wpfy backup remote`](../commands/backup-remote).
