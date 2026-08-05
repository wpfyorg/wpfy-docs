# ADR 0030: S3 backup transport and redirects

- Status: Accepted
- Date: 2026-08-05

## Context

Site archives include database dumps and WordPress secrets. An explicit `http://` S3-compatible endpoint sent those archives in plaintext. Python's default redirect handler also replayed SigV4 authorization headers to a redirect target for redirect-following methods.

## Decision

Require HTTPS when loading or writing S3 backup configuration. `wpfy backup storage set --allow-insecure` is the sole HTTP opt-out and persists `WPFY_BACKUP_S3_ALLOW_INSECURE=1`. Existing stored HTTP endpoints fail closed and name the opt-out for deliberate migration.

Use one S3-specific urllib opener for every uploader verb. It refuses redirects that change scheme or host:port before forwarding any request, so authorization, `x-amz-date`, and payload-hash headers remain at the configured endpoint and never move from HTTPS to plaintext HTTP.

## Alternatives considered

- **Warn for HTTP endpoints.** Rejected: archives and credentials would still cross the network in plaintext, and warnings are easy to miss in scheduled backups.
- **Allow redirects after stripping credentials.** Rejected for now: refusal is smaller, unambiguous, and avoids transferring sensitive archives to an unconfigured host.
- **Patch only GET list/restore calls.** Rejected: redirect behavior belongs to the common opener so future methods retain the invariant.

## Consequences

- Operators with legacy HTTP storage must migrate the endpoint to HTTPS or explicitly accept the plaintext risk by reconfiguring with `--allow-insecure`.
- S3 providers that redirect across hosts, ports, or schemes fail with a clear transfer error and must be configured with their final endpoint.
