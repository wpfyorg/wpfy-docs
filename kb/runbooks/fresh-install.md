# Fresh Install

## Goal

Install wpfy on a supported Ubuntu VPS and verify the CLI is ready.

## Prerequisites

- Ubuntu 22.04 LTS or 24.04 LTS.
- Root access or a sudo-capable operator user.
- Public release bootstrap availability.
- No host-level Nginx, PHP, MariaDB, or Redis setup is required by wpfy.

## Steps

1. Run the public bootstrap command from the release instructions.
2. Let the installer verify Docker and the Compose plugin.
3. Run `wpfy version`.
4. Run `wpfy stack install --nginx --php --mysql`.
5. Run `wpfy stack status`.

## Verification

`wpfy version`, `wpfy stack status`, and `wpfy healthcheck system` should complete without unexpected failures.

## Failure Recovery

Check installer output and `/var/log/wpfy/install.log` on the server. Rerun the installer after correcting package, Docker, or permission failures.

## Cleanup

No cleanup is needed after a successful install. For a failed test host, destroy the disposable VPS rather than manually unwinding host packages.

## Related Reference Pages

[`Requirements`](../getting-started/requirements), [`Architecture`](../reference/architecture), [`Server layout`](../reference/server-layout).
