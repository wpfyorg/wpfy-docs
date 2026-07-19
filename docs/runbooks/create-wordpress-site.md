# Runbook: Create WordPress Site

## Status
- Implemented for Docker-backed WordPress sites.

## Goal
Create a WordPress site with per-site containers and volumes.

## Steps
1. Ensure fresh install completed and `wpfy stack install --nginx` has started Traefik.
2. Run `wpfy site create example.com --wp`.
3. Optionally pass admin values: `--user=admin --email=admin@example.com --pass='secret'`.
4. If the password is omitted, record the generated password printed by the command; it is not stored for later display.
5. Verify `wpfy site status example.com`.
6. Visit the site through the edge proxy.
7. Expect the create command to show sectioned progress for scaffold, bootstrap, runtime, and WordPress provisioning steps.
8. Expect fresh bootstrap to report the verified WordPress version before runtime starts.

## Notes
- Use `-le` only when DNS already points to the VPS.
- Re-running `site create` does not rotate the WordPress admin password once WordPress is installed.
- Release metadata, digest, or archive mismatch returns non-zero before extraction. Correct transient upstream/network problems and rerun; the scaffold and secrets are reused.
- WordPress.org publishes SHA-1 for release tarballs. wpfy uses it for mismatch/corruption detection, not signature verification.
