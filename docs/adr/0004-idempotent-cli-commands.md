# ADR 0004: Idempotent CLI commands

Date: 2026-05-20
Status: Accepted

## Context
VPS automation frequently fails midway due to network, DNS, package, Docker, or user environment issues. Retrying should be safe.

## Decision
Day-to-day `wpfy ...` commands must be idempotent.

## Reasoning
Retry-safe commands reduce operator risk and make support easier.

## Alternatives Considered
- Imperative commands that assume clean state and fail on existing resources.
- Manual cleanup steps after every partial failure.

## Consequences
- Commands must inspect existing files, containers, networks, volumes, and metadata before changing state.
- Failure messages should identify the failed step and retry behavior.

## Follow-up Tasks
- Define idempotency contracts per command doc.
- Add tests for re-running install and site lifecycle commands.
