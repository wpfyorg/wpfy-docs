# wpfy sftp

Manage per-site SFTP access.

## Syntax

```bash
wpfy sftp <domain> --enable
wpfy sftp <domain> --disable
wpfy sftp <domain> --status
```

## Flags

| Flag | Type | Description |
|------|------|-------------|
| `--enable` | bool | Enable SFTP access |
| `--disable` | bool | Disable SFTP access |
| `--status` | bool | Show SFTP status |

## Examples

```bash
wpfy sftp example.com --enable
wpfy sftp example.com --status
wpfy sftp example.com --disable
```

## Expected Behavior

**`--enable`:** - Adds an atmoz/sftp sidecar container to the site's Compose project - Allocates a per-site loopback-only host port - Waits for the port to become available - Stores credentials in `.env`

**`--status`:** - Shows enabled/disabled state - Shows port number - Never prints the SFTP password value

**`--disable`:** - Removes SFTP container from Compose project - Removes SFTP configuration from `.env`

## Security

- SFTP binds to `127.0.0.1` only (loopback)
- Never exposed to the public internet
- Password is generated per site, printed once on enable

## Related Commands

- [wpfy site create](/site-commands/site-create)
