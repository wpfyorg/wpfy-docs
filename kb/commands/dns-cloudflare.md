# wpfy dns cloudflare

Store and test Cloudflare DNS credentials used by supported wildcard SSL flows.

## Status

Implemented for Cloudflare. Other DNS providers are deferred.

## Syntax

```bash
wpfy dns cloudflare set|status|test|clear
```

## Options

| Option | Purpose |
|---|---|
| `set` | Store Cloudflare credentials. |
| `status` | Show redacted status. |
| `test` | Test the stored credentials. |
| `clear` | Remove stored credentials. |

## Safe Examples

```bash
wpfy dns cloudflare status
wpfy dns cloudflare test
```

## Expected Behavior

Credentials are redacted in output. Wildcard SSL support is Cloudflare-only in this release.

## Files And Services Touched

wpfy-managed DNS credential state under `/etc/wpfy/`.

## Idempotency Notes

Setting credentials again replaces the stored Cloudflare config.

## Failure Modes

Missing credentials, invalid token, provider API failure, or unsupported DNS provider.

## Recovery Steps

Store a corrected token, run `status`, then run `test` before requesting wildcard SSL.

## Related Commands

[`Enable SSL`](../runbooks/enable-ssl), [`Configure wildcard SSL`](../runbooks/configure-wildcard-ssl), [`SSL flow`](../reference/ssl-flow).
