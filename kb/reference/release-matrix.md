# Release Matrix

## What It Covers

The v1 release command surface and current implementation status.

## Current Behavior

`v1.0.0-rc2` is locally validated but not final. Public tags retain Python
tests and CI; wheel, sdist, and installed production source omit tests.

Flat commands are primary where exact equivalents exist: `run`, `backup`, `restore`, `wp`, `rm`, `config`, runtime commands, `cron`, `smtp`, `dns cloudflare`, `healthcheck`, `motd`, `utility`, and `version`.

Grouped `wpfy site ...` and `wpfy stack ...` commands are retained for this release. Stack remains the canonical grouped namespace for shared runtime components.

## Security Constraints

Release docs must not include secrets, private evidence paths, local machine paths, or real VPS IPs.

## Known Limitations

Future flat replacements for grouped-only operations require separate product decisions. Provider bucket lifecycle API automation remains deferred.

## Related ADRs Or Command Pages

[`Commands`](../commands/run), [`Grouped site commands`](../commands/grouped-site), [`Grouped stack commands`](../commands/grouped-stack), [`v1.0.0-rc2`](../releases/v1.0.0-rc2).
