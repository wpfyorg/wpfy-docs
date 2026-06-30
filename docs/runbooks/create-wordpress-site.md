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

## Notes
- Use `-le` only when DNS already points to the VPS.
- Re-running `site create` does not rotate the WordPress admin password once WordPress is installed.
