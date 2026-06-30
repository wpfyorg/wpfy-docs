# wpfy site delete

Remove a managed site and its resources. Asks for confirmation by default.

## Syntax

```bash
wpfy site delete <domain>
```

## Examples

```bash
wpfy site delete example.com
```

## Expected Behavior

- Stops site runtime (`docker compose down`)
- Removes site scaffold from `/opt/wpfy/sites/<domain>/`
- Removes registry entry from `/var/lib/wpfy/sites.json`
- Does NOT remove backups (they stay under `/var/lib/wpfy/backups/<domain>/`)

## Failure Modes

| Condition | Behavior |
|-----------|----------|
| Site not found | `site not found` error |
| Runtime stop fails | Deletion continues, scaffold removed |

## Related Commands

- [wpfy site create](/site-commands/site-create)
- [wpfy site restore](/site-commands/site-restore)
