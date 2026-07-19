# Grouped wpfy site Commands

Grouped site commands are retained for this release.

## Status

Retained compatibility for `create`, `backup`, `restore`, `wp`, `delete`, and `update`. Retained grouped operations for `ssl`, `list`, `info`, `show`, and `status`.

## Syntax

```bash
wpfy site create|ssl|backup|restore|wp|delete|list|info|show|status|update ...
```

## Options

| Command | Primary status |
|---|---|
| `site create` | Compatibility; prefer `wpfy run`. |
| `site backup` | Compatibility; prefer `wpfy backup`. |
| `site restore` | Compatibility; prefer `wpfy restore`. |
| `site wp` | Compatibility; prefer `wpfy wp`. |
| `site delete` | Compatibility; prefer `wpfy rm`. |
| `site update` | Compatibility; prefer `wpfy config` for controlled config changes. |
| `site ssl`, `site list`, `site info`, `site show`, `site status` | Retained grouped operations. |

## Safe Examples

```bash
wpfy site status example.com
wpfy site ssl example.com --letsencrypt
wpfy site list
```

## Expected Behavior

Grouped commands continue to route through the same implemented lifecycle and inspection modules.

## Files And Services Touched

Depends on the subcommand. Status/list/info/show are inspection-oriented; create/update/ssl/backup/restore/delete mutate managed site state.

## Idempotency Notes

The same idempotency rules apply as the matching flat or grouped operation.

## Failure Modes

Subcommand-specific validation, runtime, DNS, archive, or lifecycle failures.

## Recovery Steps

Prefer the matching flat command where one exists. For grouped-only operations, rerun with `--help` and correct the reported input or runtime issue.

## Related Commands

[`wpfy run`](./run), [`wpfy config`](./config), [`wpfy healthcheck`](./healthcheck).
