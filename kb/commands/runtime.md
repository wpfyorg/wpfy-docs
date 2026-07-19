# Runtime Commands

Operate one managed site's Docker Compose runtime through flat commands.

## Status

Implemented: `compose`, `up`, `down`, `exec`, `cp`, and `pull`.

## Syntax

```bash
wpfy compose <domain> -- <compose args>
wpfy up <domain>
wpfy down <domain> [--volumes]
wpfy exec <domain> [service] -- <command>
wpfy cp <domain> <source> <destination>
wpfy pull <domain> [--all|--service <service>]
```

## Options

| Option | Purpose |
|---|---|
| `--volumes` | Remove volumes on `down`; omitted by default. |
| `--all` | Pull all images for a site. |
| `--service <service>` | Pull one service image. |
| `-- <args>` | Separate wpfy arguments from Compose or container command arguments. |

## Safe Examples

```bash
wpfy compose example.com -- ps
wpfy up example.com
wpfy down example.com
wpfy exec example.com -- php -v
wpfy pull example.com --all
```

## Expected Behavior

Runtime commands validate the domain and managed-site existence before invoking Docker Compose.

## Files And Services Touched

The selected site's Compose project and containers.

## Idempotency Notes

`up`, `down`, and `pull` can be rerun. `down` keeps volumes unless `--volumes` is supplied.

## Failure Modes

Missing site, invalid service name, Docker unavailable, Compose failure, unsafe `cp` path, or failing container command.

## Recovery Steps

Run `wpfy site status <domain>` and inspect `wpfy log show <domain>` before retrying mutating runtime commands.

## Related Commands

[`wpfy run`](./run), [`wpfy log`](./log), [`wpfy healthcheck`](./healthcheck).
