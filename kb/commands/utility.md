# wpfy utility

Generate offline-safe operator values.

## Status

Implemented.

## Syntax

```bash
wpfy utility password|token|username|uid|htpasswd
```

## Options

| Option | Purpose |
|---|---|
| `password --length <n>` | Generate a random password. |
| `token --bytes <n>` | Generate a URL-safe token. |
| `username <text>` | Normalize a safe username. |
| `uid <domain>` | Show deterministic project-name and site UID guidance. |
| `htpasswd --username <name> --password-stdin` | Generate a stdlib-compatible htpasswd line. |

## Safe Examples

```bash
wpfy utility password --length 32
wpfy utility token --bytes 24
wpfy utility username "Client Site"
wpfy utility uid example.com
printf '%s\n' "$PASSWORD" | wpfy utility htpasswd --username admin --password-stdin
```

## Expected Behavior

Helpers run offline and do not require Docker or site mutation.

## Files And Services Touched

None.

## Idempotency Notes

Random generators intentionally return new values. Normalization and UID helpers are deterministic.

## Failure Modes

Invalid length, missing stdin password, or invalid input.

## Recovery Steps

Correct the input and rerun. Do not publish generated secret values.

## Related Commands

[`wpfy config`](./config), [`wpfy smtp`](./smtp).
