# wpfy secure

Audit site and container hardening.

## Syntax

```bash
wpfy secure
wpfy secure <domain>
```

## Examples

```bash
wpfy secure
wpfy secure example.com
```

## Expected Output

Per-site checks:

| Check | What it audits |
|-------|---------------|
| File permissions | `/opt/wpfy/sites/<domain>/` ownership and mode |
| Privileged mode | Container running with `--privileged` |
| no-new-privileges | `--security-opt no-new-privileges` |
| `NET_RAW` dropped | Network capability restriction |
| PID limits | `--pids-limit` set |
| Memory limits | Container memory limit configured |
| Log rotation | Log driver with rotation policy |
| Root user | Container running as root (warning) |
| Host port binds | Ports exposed on `0.0.0.0` |

## Related Commands

- [wpfy debug](/operations/debug)
- [Security reference](/reference/security)
