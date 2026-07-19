# Site Isolation

## What It Covers

How wpfy separates managed site runtime resources.

## Current Behavior

Each managed site uses its own Compose project, PHP runtime, database service, optional Redis service, writable app volume, and generated configuration. SFTP access is per-site and bound to loopback-only host ports.

## Security Constraints

wpfy must not share PHP, DB, Redis, or writable app volumes between sites. The edge proxy must not get broad write access to site data, and one site must not attach to another site's network.

## Known Limitations

Do not claim perfect isolation. Docker daemon or host compromise can affect all sites on the same host.

## Related ADRs Or Command Pages

ADR 0002 covers per-site Compose isolation. See [`wpfy run`](../commands/run), [`wpfy sftp`](../commands/sftp), and [`Security`](./security).
