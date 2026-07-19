# First WordPress Site

Create a first managed WordPress site after wpfy and the shared stack are installed.

## Steps

1. Install shared runtime components:

```bash
wpfy stack install --nginx --php --mysql
```

2. Create the site:

```bash
wpfy run example.com --wp
```

3. Check status:

```bash
wpfy site status example.com
```

4. Run a read-only WP-CLI command:

```bash
wpfy wp example.com core version
```

## Notes

Use `-le` only after DNS points at the server and the ACME email is configured. Generated WordPress passwords are printed once for fresh installs.

## Related Pages

[`wpfy run`](../commands/run), [`Create WordPress site`](../runbooks/create-wordpress-site), [`Enable SSL`](../runbooks/enable-ssl).
