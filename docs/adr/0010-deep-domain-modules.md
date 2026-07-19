# ADR 0010: Deep modules for domain and runtime operations

Date: 2026-06-07
Status: Accepted

## Context
The managed-site lifecycle now owns mutation ordering, but three related areas still leaked implementation knowledge into callers:

- SFTP patched generated Compose YAML, `.env`, and registry metadata independently.
- Certificate state and domain matching were duplicated between SSL and Traefik modules.
- `info`, `debug`, and `secure` embedded low-level probes and interpretation directly in CLI handlers.

These leaks made retry safety and representation consistency caller obligations.

Stack lifecycle/image orchestration, cache selection/execution, and log/WP-CLI process construction later remained in `cli.py` or were duplicated by the panel. Cross-module callers also depended on private HTTP-probe and service-wait helpers.

## Decision
Use three deep modules:

- `site_definition.py` owns the persisted site vocabulary and renders Compose, env, and registry metadata, including optional SFTP state.
- `site_paths.py` owns validated site path construction and env reads; `site_runtime.py` owns Docker/Compose execution and health inspection. `site_layout.py` retains scaffold rendering, backup/restore, WordPress bootstrap, ownership, and inventory.
- `certificate_lifecycle.py` owns DNS/IP preflight, ACME reads, domain matching, certificate metadata/expiry, and renewal.
- `operational_inspection.py` collects structured aggregate, diagnostic, and security facts; CLI handlers retain rendering and exit policy.
- `stack.py` owns shared-stack component selection, image pulls, status facts, upgrade/remove ordering, and destructive purge results.
- `cache_operations.py` owns cache target selection, Redis applicability, per-site execution, and aggregate outcomes.
- `site_runtime.py` publicly owns captured/followed logs, ordered log reset, captured/interactive WP-CLI execution, HTTP probing, and service readiness. CLI and panel retain presentation and transport policy only.
- `site_paths.py` supplies the descriptor-relative no-follow env reader used by stored SMTP, Cloudflare DNS, and S3 configuration. `redaction.py` owns exact-value replacement while key-based CLI sanitization and SFTP field-pattern masking remain separate.
- `systemd.py` owns unit-root resolution, command quoting, `systemctl` execution, and common install/disable ordering. Cron and backup scheduling retain their interval, unit-content, validation, and message policy.

`traefik.py` remains the adapter for proxy scaffold and runtime operations. `sftp.py` remains the adapter for port allocation, readiness, and sidecar runtime commands.

## Reasoning
Each module puts high-risk invariants behind one interface:

- persisted site representations cannot drift through independent edits;
- certificate matching and ACME state have one implementation;
- operational probes are testable without coupling tests to CLI formatting.

This supports ADR 0002, ADR 0003, ADR 0004, ADR 0005, ADR 0006, and ADR 0009 without changing their accepted product decisions.

## Alternatives Considered
- Keep SFTP YAML surgery and add more repair tests.
- Keep certificate helpers split between SSL and Traefik modules.
- Extract only CLI formatting helpers while leaving probes in command handlers.

## Consequences
- `SiteSpec` remains a compatibility alias for `SiteDefinition`.
- `ssl_flow.py` remains a compatibility import for existing public Python imports.
- Adding a persisted site option must update the site definition instead of editing generated files in place.
- New operational commands should consume structured inspection facts and define their own presentation and exit policy.
- Destructive stack purge requires explicit `--force`; cache execution failures produce a non-zero aggregate exit.
- CLI and panel do not construct raw Compose commands for stack, cache, log/reset, or WP-CLI operations.
- Secret-config loaders shape no-follow/filesystem failures at their domain boundary, and scheduler cleanup remains limited to explicitly supplied owned unit paths.
