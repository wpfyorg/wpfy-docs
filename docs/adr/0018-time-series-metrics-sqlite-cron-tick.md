# ADR 0018: Time-series metrics in SQLite on the existing cron minute tick

- Status: Accepted
- Date: 2026-07-27

## Context

Phase 5 needs bounded host and per-site history for later panel graphs. The sampler must run without a new runtime dependency and without creating a second resident control process. The existing minute systemd tick already runs WordPress due events and operator-defined per-site cron jobs for every managed site, so sampling joins a shared failure domain: a streaming or wedged Docker call, a parser exception, or a locked data store could otherwise stop all three tenants.

JSONL is easy to append but makes scope/range reads, retention, and later downsampling scan and parse the whole file. The site registry remains a small filesystem-authoritative metadata cache and is not an appropriate time-series store.

## Decision

Store samples in the stdlib `sqlite3` database `/var/lib/wpfy/metrics.sqlite3`, resolved through the redirectable state directory. Enable WAL mode and a bounded busy timeout. Use one `samples` table with `timestamp`, `scope`, `cpu_percent`, `memory_used`, `memory_total`, `disk_used`, `disk_total`, and `load1`. Index `(scope, timestamp)` for exact-scope range reads and `timestamp` for retention deletion. Keep 14 days by default; the daily tick deletes older rows without running `VACUUM`.

The existing minute tick calls the sampler after per-site cron work. Host CPU comes from two `/proc/stat` reads about 250 ms apart, with a zero-total-delta result defined as 0%. Host memory comes from `/proc/meminfo` with kB converted to bytes; disk and load use stdlib APIs. `WPFY_TEST_PROC_DIR` replaces `/proc` for deterministic tests and non-Linux development. When `/proc` is unavailable, the sampler records the portable disk/load information it can and reports warnings instead of raising.

Collect container metrics with one bounded `docker stats --no-stream --format json` call for the whole machine. Resolve each container name by comparing it against the complete set of candidate names built from (managed project × known service), where the services are `web`, `app`, `db`, `redis`, `sftp`, `adminer`, and `wpcli`. A name matches only as the whole string `{project}-{service}`, or as `{project}-{service}-{N}` with a numeric replica index.

The replica index must be optional, not required. Every service wpfy generates sets an explicit `container_name` of `{project}-{service}` — web and app in `site_layout.py`, db, redis and wpcli likewise, sftp and adminer in `site_definition.py` — and that directive overrides Compose's default `{project}-{service}-{N}` naming. Real container names are therefore `example-com-web`, `example-com-app`, and so on, with no index at all. A resolver that requires the numeric component silently discards every wpfy container: `docker stats` still runs and still parses, and per-site metrics are simply always empty while host metrics keep working. The index is tolerated only so that a service which ever loses its explicit `container_name` still resolves.

Never use prefix or substring matching: project `metrics-example` must not absorb `metrics-example-org`. Whole-candidate comparison gives this for free, because `metrics-example-org-app` can only be formed as `metrics-example-org` + `-app` — `org-app` is not a service name. Foreign containers, including `wpfy-traefik` and any unrelated Compose stack, match no candidate and are ignored.

Sampling and pruning are contained inside cron adapters. A sampler/pruner exception becomes an explicit `metrics ...: FAIL` cron-log line and a non-zero interval result, but WordPress cron, per-site cron, custom hooks, daily health reporting, and log rotation continue. Expected partial availability, such as Docker being absent while host sampling succeeds, is a warning rather than a failed tick.

Expose manual operations as `wpfy metrics sample|show|prune`. Range vocabulary is bounded to 30 minutes, 1, 3, 6, 12, or 24 hours, and every SQL value uses bound parameters with exact scope equality.

## Alternatives considered

- **Resident metrics daemon:** rejected. It adds process supervision, lifecycle, upgrade, and failure-state complexity for one-minute data that already has a durable scheduler.
- **Sub-minute sampling:** rejected. The first graph surface does not justify a resident or high-frequency collector, additional Docker load, or larger retention volume.
- **JSONL:** rejected. Scope/range queries, retention, concurrent access, and later downsampling would require application-level scans and locking.
- **One Docker stats call per site:** rejected. Runtime cost grows linearly with the fleet and increases the shared minute tick's failure exposure.
- **Streaming `docker stats`:** rejected. It never returns and would halt every minute-tick tenant.
- **`VACUUM` during daily pruning:** rejected. It rewrites the whole database under an exclusive operation; indexed deletion keeps the shared daily tick bounded.

## Consequences

- Metrics add no third-party runtime dependency and no new long-lived service.
- The panel can query one exact scope and bounded time range without scanning unrelated tenants.
- WAL plus the busy timeout supports concurrent sampler and reader/pruner processes; operators still receive a visible failure if storage cannot be written.
- Per-site CPU and memory are container-derived; disk usage and load reflect the underlying host/filesystem because Docker's one-shot stats output does not provide per-site filesystem occupancy.
- A host without `/proc` records degraded portable data instead of crashing, while production Linux hosts use kernel counters.
- Retention bounds normal growth, but SQLite file pages are reused rather than compacted automatically.
