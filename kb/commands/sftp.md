# wpfy sftp

Enable, disable, or inspect per-site SFTP access.

## Status

Implemented.

## Syntax

```bash
wpfy sftp <domain> --enable [--password <password>]
wpfy sftp <domain> --disable
wpfy sftp <domain> --status
```

## Options

| Option | Purpose |
|---|---|
| `--enable` | Enable or restart the SFTP sidecar. |
| `--disable` | Disable SFTP. |
| `--status` | Show redacted SFTP status. |
| `--password <password>` | Set or rotate the SFTP password. |

## Safe Examples

```bash
wpfy sftp example.com --enable
wpfy sftp example.com --status
wpfy sftp example.com --disable
```

## Expected Behavior

SFTP is scoped to the selected site and binds to a loopback-only host port. Auto-generated passwords are printed once on enable; status never prints password values.

## Files And Services Touched

The site definition, per-site `.env`, Compose scaffold, registry metadata, and SFTP sidecar.

## Idempotency Notes

Enabling an enabled site regenerates the same definition and restarts the sidecar without duplicate Compose blocks. Disabling an already-disabled site succeeds.

## Failure Modes

Missing site, invalid domain, Compose start failure, or the allocated port not becoming ready.

## Recovery Steps

Check status, verify the loopback port, inspect container logs, and rerun enable after fixing the reported issue.

## Related Commands

[`wpfy run`](./run), [`wpfy log`](./log), [`Site isolation`](../reference/site-isolation).
