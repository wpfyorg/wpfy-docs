# `wpfy metrics`

## Purpose

Record and inspect bounded host and per-site operational metrics without a resident monitoring daemon.

## Status

- Implemented: one SQLite time-series database under the wpfy state directory.
- Implemented: host CPU, memory, disk, and one-minute load sampling.
- Implemented: per-site container CPU and memory from one whole-machine Docker stats call.
- Implemented: minute-tick sampling, daily 14-day retention pruning, WAL-mode concurrent access, and explicit cron failure lines.
- Implemented in Phase 5b: dashboard and per-site canvas graphs, with the API reporting the accepted range vocabulary.

## Syntax

```bash
wpfy metrics sample
wpfy metrics show [--scope host|<domain>] [--range 30m|1h|3h|6h|12h|24h]
wpfy metrics prune
```

`show` defaults to `--scope host --range 1h`.

## Operations

### `sample`

Records one timestamp shared by the host row and every managed site observed in Docker's one-shot stats output. Output prints the values that were persisted. Docker unavailability skips per-site rows but does not discard the host row.

### `show`

Returns samples for one exact scope and bounded range in ascending timestamp order. Valid scopes are `host` and managed domain names. Scope and cutoff are bound SQL parameters; scope matching uses equality, not wildcard matching.

Each row contains:

- Unix timestamp in seconds
- scope (`host` or a managed domain)
- CPU percent
- memory used and total in bytes
- disk used and total in bytes
- host one-minute load average

### `prune`

Deletes rows older than the default 14-day retention window. It does not run `VACUUM`; SQLite reuses freed pages without blocking the shared daily tick for a full-file rewrite.

## Storage and indexes

The database is `<state-dir>/metrics.sqlite3` (normally `/var/lib/wpfy/metrics.sqlite3`) with mode `0600`. The `samples` table has no secret-bearing fields. WAL mode and a bounded busy timeout permit concurrent CLI/cron/panel processes.

- `(scope, timestamp)` bounds exact-scope range reads.
- `(timestamp)` bounds retention deletion.

## Cron integration

- `wpfy cron minute` runs WordPress cron, due per-site jobs, then one metrics sample.
- `wpfy cron daily` runs the all-site health summary, prunes metrics retention, and rotates the cron log.
- Metrics failures are written as `metrics sample: FAIL ...` or `metrics prune: FAIL ...`; later tick work still runs.

## Failure modes

- Missing `/proc` records portable data with a warning instead of crashing (useful for macOS development; Linux production hosts provide full kernel counters).
- Missing or failed Docker stats records the host sample and warns that per-site metrics were skipped.
- A wedged Docker daemon is bounded by the sampler timeout in addition to `--no-stream`.
- SQLite write/query errors return non-zero and appear in CLI or cron output.
- Unknown range keys are rejected.

## Security notes

- Sampling is read-only: it invokes no host package/service management and no mutating Docker verb.
- The sampler writes only the state database, never site directories.
- Container attribution parses exact Compose project components; prefix or substring matches are not used.
- The database contains operational numbers and domain scopes only, never `.env` credentials.
