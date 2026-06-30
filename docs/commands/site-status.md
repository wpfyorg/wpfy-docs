# `wpfy site status`

## Purpose
Inspect the current state of a managed site and, when possible, its Docker Compose runtime.

## Status
- Implemented: reports scaffold metadata from `/opt/wpfy/sites/<domain>/`.
- Implemented: reports Compose runtime state when Docker is available.
- Implemented: inspects container health with `docker inspect` when containers are running.
- Implemented: performs an HTTP probe against the per-site web container when Docker is available.
- Implemented: reports readiness fields for scaffold, bootstrap, and runtime.
- Implemented: service-level checks for app, web, DB, and Redis based on the site flavor.
- Implemented: prints a sectioned status summary with human-friendly yes/no readiness fields and a short health summary line.

## Syntax
```bash
wpfy site status <domain>
```

## Examples
```bash
wpfy site status example.com
```

## Expected Files Touched
- Read-only access to `/opt/wpfy/sites/<domain>/`.
- No files should be modified.

## Output Fields
- `status`
- `scaffold_ready`
- `bootstrap_ready`
- `runtime_ready`
- `http_ready`
- short message describing runtime or bootstrap state

## Readiness States
- `missing`: no managed site exists.
- `needs-bootstrap`: scaffold exists but WordPress-style app files are not bootstrapped.
- `degraded`: bootstrap is ready but Docker/Compose cannot be inspected.
- `ready`: scaffold, bootstrap, and runtime are all healthy enough to report as ready.
- `partial`: app container is up, but one or more required runtime services are missing or unhealthy.
- `running`: runtime is up and the HTTP probe has passed.

## Idempotency Behaviour
- Read-only and safe to run repeatedly.

## Failure Modes
- Site not found.
- Invalid domain.
- Docker/Compose unavailable, which results in an unavailable runtime status rather than a hard failure.

## Security Notes
- Must not print secrets from `.env`.
