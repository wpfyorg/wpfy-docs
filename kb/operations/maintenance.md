# wpfy maintenance

Toggle maintenance mode for a site.

## Syntax

```bash
wpfy maintenance <domain> --enable
wpfy maintenance <domain> --disable
wpfy maintenance <domain> --status
```

## Examples

```bash
wpfy maintenance example.com --enable
wpfy maintenance example.com --disable
```

## Expected Behavior

`--enable` stops the app container; `--disable` starts it; `--status` (also the default) is read-only. The flags are mutually exclusive. Registry state is updated only after the matching Compose action succeeds, so a runtime failure returns non-zero and leaves recorded state unchanged.

## Related Commands

- [wpfy site update](/site-commands/site-update)
