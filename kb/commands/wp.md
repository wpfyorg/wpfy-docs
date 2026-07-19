# wpfy wp

Run WP-CLI inside a managed site's WP-CLI container.

## Status

Implemented. `wpfy site wp` is retained for compatibility.

## Syntax

```bash
wpfy wp <domain> <wp-cli args>
```

## Options

| Option | Purpose |
|---|---|
| `<wp-cli args>` | Arguments passed to WP-CLI after the domain. |

## Safe Examples

```bash
wpfy wp example.com core version
wpfy wp example.com plugin list
```

## Expected Behavior

wpfy runs WP-CLI through the site's container path and includes the root allowance needed by the container.

## Files And Services Touched

The target site's WP-CLI service and any WordPress files or database rows affected by the WP-CLI command.

## Idempotency Notes

Idempotency depends on the WP-CLI subcommand. Read WP-CLI output before rerunning mutating commands.

## Failure Modes

Missing site, non-WordPress site, Docker unavailable, WP-CLI service failure, or a failing WP-CLI subcommand.

## Recovery Steps

Check `wpfy site status <domain>` and rerun a read-only WP-CLI command before retrying mutation.

## Related Commands

[`wpfy run`](./run), [`wpfy config`](./config), [`wpfy site wp`](./grouped-site).
