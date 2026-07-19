# Debug Site

## Goal

Collect safe diagnostics for one managed site.

## Prerequisites

- The site is managed by wpfy.
- Docker access is available for runtime checks unless running offline-safe diagnostics.

## Steps

1. Run `wpfy site status example.com`.
2. Run `wpfy healthcheck app example.com`.
3. Run `wpfy log show example.com --lines 100`.
4. Run `wpfy debug` for broader host and registry diagnostics.

## Verification

Identify whether the failure is scaffold, runtime, HTTP readiness, database, SSL, or host-level.

## Failure Recovery

Use the narrowest command that addresses the failed layer: `wpfy up`, `wpfy refresh`, `wpfy config`, SSL preflight, or restore.

## Cleanup

Do not publish raw logs if they contain private domain, path, or credential context.

## Related Reference Pages

[`wpfy healthcheck`](../commands/healthcheck), [`wpfy log`](../commands/log), [`Server layout`](../reference/server-layout).
