# Grouped wpfy stack Commands

Shared runtime components remain under the grouped stack namespace.

## Status

Retained canonical grouped stack namespace for this release.

## Syntax

```bash
wpfy stack install|remove|purge|migrate|upgrade|status [options]
```

## Options

| Command | Purpose |
|---|---|
| `install` | Pull and start selected shared components. |
| `remove` | Stop Traefik. |
| `purge --force` | Remove Traefik Compose project including volumes after explicit confirmation. |
| `migrate` | Retained parser surface; host-stack migration remains out of scope. |
| `upgrade` | Pull updated Traefik image and restart. |
| `status` | Show shared runtime status. |

## Safe Examples

```bash
wpfy stack install --nginx --php --mysql
wpfy stack status
wpfy stack upgrade
```

## Expected Behavior

Stack commands manage shared runtime surfaces such as Traefik and pulled images. They do not create site app data.

## Files And Services Touched

Traefik scaffold, shared Docker network, selected images, and shared Compose project state.

## Idempotency Notes

Install and status are safe to rerun. Purge is destructive for shared Traefik state, requires `--force`, and returns non-zero if stop or Compose teardown fails.

## Failure Modes

Docker unavailable, image pull failures, Traefik start/stop/teardown failure, missing `--force` for purge, or unsupported migration request.

## Recovery Steps

Run `wpfy stack status`, resolve Docker/image issues, then rerun the specific stack command.

## Related Commands

[`wpfy backup edge`](./backup-edge), [`SSL flow`](../reference/ssl-flow), [`Architecture`](../reference/architecture).
