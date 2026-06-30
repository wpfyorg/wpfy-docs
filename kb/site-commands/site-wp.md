# wpfy site wp

Run WP-CLI commands inside a site's wpcli container.

## Syntax

```bash
wpfy site wp <domain> <wp-cli args...>
```

## Examples

```bash
wpfy site wp example.com plugin list
wpfy site wp example.com plugin install wordpress-seo --activate
wpfy site wp example.com user list
wpfy site wp example.com option get siteurl
wpfy site wp example.com core update
wpfy site wp example.com theme install twentytwentyfour --activate
```

## Expected Behavior

- Executes the WP-CLI command inside the site's `wpcli` Docker container
- Passes `--allow-root` automatically (the container runs as root)
- Streams output to stdout

## Common Tasks

```bash
# List active plugins
wpfy site wp example.com plugin list --status=active

# Create a new admin user
wpfy site wp example.com user create editor editor@example.com --role=editor

# Check WordPress version and updates
wpfy site wp example.com core check-update

# Export database
wpfy site wp example.com db export - > backup.sql

# Flush rewrite rules
wpfy site wp example.com rewrite flush
```

## Related Commands

- [wpfy site create](/site-commands/site-create)
- [wpfy site update](/site-commands/site-update)
