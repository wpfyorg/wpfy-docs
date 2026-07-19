# wpfy version

Print the installed wpfy package version.

## Status

Implemented.

## Syntax

```bash
wpfy version
```

## Options

| Option | Purpose |
|---|---|
| None | This command has no command-specific options. |

## Safe Examples

```bash
wpfy version
wpfy --version
```

## Expected Behavior

The command prints local package version information only. It does not update the installation.

## Files And Services Touched

None.

## Idempotency Notes

Read-only.

## Failure Modes

Broken installation or missing package metadata.

## Recovery Steps

Run the installer repair path or reinstall from the public bootstrap once a release is available.

## Related Commands

[`wpfy update`](../operations/update), [`Release matrix`](../reference/release-matrix).
