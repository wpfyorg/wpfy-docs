# wpfy run

Create a managed site scaffold and runtime. This is the primary flat command for new sites.

## Status

Implemented. `wpfy site create` is retained as a compatibility command.

## Syntax

```bash
wpfy run <domain> [site flags]
```

## Options

| Option | Purpose |
|---|---|
| `--html` | Create a static HTML site. |
| `--php 7.4\|8.0\|8.1\|8.2\|8.3\|8.4` | Select the PHP runtime. |
| `--mysql` | Include MariaDB. |
| `--wp`, `--wpfc`, `--wpredis` | Create WordPress variants. |
| `-le`, `--letsencrypt [on\|off]` | Request SSL with DNS/IP preflight first. |
| `--dns cloudflare` | Use Cloudflare DNS mode for supported SSL flows. |
| `--proxied`, `--no-proxied` | Force proxied mode on or off. |
| `--user`, `--email`, `--pass` | Set initial WordPress admin details. |

## Safe Examples

```bash
wpfy run example.com --wp
wpfy run example.com --wp -le
wpfy run example.com --html
```

## Expected Behavior

The command writes a per-site Compose scaffold, starts runtime when Docker is available, and provisions WordPress for WordPress flavors. Generated WordPress passwords are printed once for fresh installs only.

## Files And Services Touched

`/opt/wpfy/sites/<domain>/`, the per-site Compose project, per-site `.env`, app files, Nginx config, and registry metadata.

## Idempotency Notes

Re-running with the same inputs refreshes managed scaffold files and does not rotate an already-installed WordPress administrator password.

## Failure Modes

Invalid domains, Compose project-name collisions, Docker startup failures, DNS/IP preflight failures, missing ACME contact email, and WordPress provisioning failures return nonzero exits.

## Recovery Steps

Fix the reported preflight/runtime issue and rerun the same command. For SSL failures, set a valid ACME email and verify DNS before retrying.

## Related Commands

[`wpfy config`](./config), [`wpfy up`](./runtime), [`wpfy site create`](./grouped-site).
