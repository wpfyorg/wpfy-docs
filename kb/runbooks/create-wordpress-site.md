# Create WordPress Site

## Goal

Create a Docker-backed WordPress site managed by wpfy.

## Prerequisites

- wpfy installed.
- Docker runtime available.
- `wpfy stack install --nginx --php --mysql` already run.
- DNS prepared if SSL will be requested during creation.

## Steps

1. Run `wpfy run example.com --wp`.
2. Save the generated WordPress password if one is printed.
3. Run `wpfy site status example.com`.
4. For SSL during creation, use `wpfy run example.com --wp -le` only after DNS points at the host.

Fresh bootstrap resolves the latest stable en_US release and verifies the versioned WordPress.org tarball's published SHA-1 before extraction. `WPFY_SKIP_WORDPRESS_DOWNLOAD=1` is only an offline test fixture.

## Verification

Check site status, container health, and HTTP readiness. For WordPress, verify `wpfy wp example.com core version`.

## Failure Recovery

If Docker is unavailable, wpfy may create files and skip runtime startup. Fix Docker and run `wpfy up example.com`. If release metadata or digest verification fails, fix the network/upstream condition and rerun create; no unverified archive is extracted.

## Cleanup

Use `wpfy rm example.com` for a test site after taking any needed backup.

## Related Reference Pages

[`wpfy run`](../commands/run), [`wpfy wp`](../commands/wp), [`Site isolation`](../reference/site-isolation).
