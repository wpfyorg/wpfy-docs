# wpfy rm

Remove a managed site and its runtime resources.

## Status

Implemented. `wpfy site delete` is retained for compatibility.

## Syntax

```bash
wpfy rm <domain> [--force]
```

## Options

| Option | Purpose |
|---|---|
| `--force` | Skip interactive confirmation when supported. |

## Safe Examples

```bash
wpfy rm old.example.com
wpfy rm old.example.com --force
```

## Expected Behavior

The command stops the site runtime and removes the managed scaffold for the selected site only.

## Files And Services Touched

The per-site Compose project, per-site scaffold under `/opt/wpfy/sites/<domain>/`, and registry metadata.

## Idempotency Notes

Missing sites return a clean site-not-found error instead of a traceback.

## Failure Modes

Missing site, invalid domain, confirmation refusal, or Docker stop failure.

## Recovery Steps

Verify the domain with `wpfy site list`, then rerun. Do not remove paths manually unless you understand the registry and scaffold state.

## Related Commands

[`wpfy backup`](./backup), [`wpfy restore`](./restore), [`wpfy site delete`](./grouped-site).
