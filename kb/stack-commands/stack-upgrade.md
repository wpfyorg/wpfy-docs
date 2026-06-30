# wpfy stack upgrade

Pull updated Traefik image and restart.

## Syntax

```bash
wpfy stack upgrade
```

## Examples

```bash
wpfy stack upgrade
```

## Expected Behavior

- Pulls latest pinned Traefik image (`traefik:v3.6.17`)
- Restarts Traefik container
- Site containers are unaffected (they run in separate Compose projects)

## Related Commands

- [wpfy stack install](/stack-commands/stack-install)
- [wpfy stack status](/stack-commands/stack-status)
