# wpfy stack remove

Stop the Traefik edge proxy.

## Syntax

```bash
wpfy stack remove
```

## Examples

```bash
wpfy stack remove
```

## Expected Behavior

- Stops Traefik container (`docker compose down`)
- Does NOT remove Traefik scaffold files
- Does NOT remove the `wpfy` network
- Site containers keep running (they lose proxy routing)

## Warning

With Traefik stopped, sites become unreachable at their domains. Run `wpfy stack install --nginx` to restore.

## Related Commands

- [wpfy stack install](/stack-commands/stack-install)
- [wpfy stack purge](/stack-commands/stack-purge) — remove completely including volumes
