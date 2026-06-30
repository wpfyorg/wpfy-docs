# ADR 0001: Ubuntu-first v1

Date: 2026-05-20
Status: Accepted

## Context
`wpfy` needs a one-shot VPS installer that can safely install Docker, Docker Compose plugin, paths, logs, and CLI entrypoint. Supporting many Linux distributions from day one increases installer branching.

## Decision
v1 targets Ubuntu first.

## Reasoning
Ubuntu is common on VPS providers and gives a smaller initial support/test matrix. Docker installation flows are well documented for Ubuntu.

## Alternatives Considered
- Support Ubuntu and Debian from day one.
- Support any Docker-capable Linux distribution with best-effort checks.

## Consequences
- Debian support is delayed.
- Installer can be simpler and safer for the first release.

## Follow-up Tasks
- Decide exact supported Ubuntu LTS versions.
- Add Debian support to the later roadmap after Ubuntu v1 stabilizes.
