# wpfy maintenance

Toggle maintenance mode for a site.

## Syntax

```bash
wpfy maintenance <domain> --on
wpfy maintenance <domain> --off
```

## Examples

```bash
wpfy maintenance example.com --on
wpfy maintenance example.com --off
```

## Expected Behavior

Enables or disables a maintenance page served by Nginx. When active, visitors see a maintenance notice instead of the site. Useful during updates or migrations.

## Related Commands

- [wpfy site update](/site-commands/site-update)
