# ADR 0006: JSON site registry with filesystem authority

Date: 2026-05-22
Status: Accepted

## Context
`wpfy` manages sites through per-site directories under `/opt/wpfy/sites/<domain>/`. Each site has a `compose.yaml` and `.env` file. Listing sites, tracking metadata (flavor, PHP version, SSL status), and generating consistent output requires reading every `.env` file on each command. As the number of sites grows, repeated filesystem scans and `.env` parsing become inefficient. We need a fast, consistent way to enumerate sites and query metadata without walking the filesystem on every `list` or `info` call.

## Decision
Maintain a JSON registry at `/var/lib/wpfy/sites.json` as a cache of site metadata. The filesystem remains authoritative. A `sync_from_filesystem()` operation reconciles the registry against what exists on disk.

## Reasoning
A JSON file is simple, human-readable, and requires no database dependencies. It fits the operational model: sites are created and destroyed through `wpfy` commands, which update the registry alongside the filesystem. The filesystem is the source of truth; the registry can always be rebuilt from disk state.

Atomic writes (write to `.tmp`, then `os.replace()`) prevent corruption on partial writes or crashes. The singleton `Registry` class with module-level convenience functions provides a clean API: `add_site()`, `update_site()`, `remove_site()`, `get_site()`, `list_sites()`, `sync_from_filesystem()`.

## Alternatives Considered
- **Filesystem-only (no registry)**: Reading every `.env` on each command. Simple but slow at scale and requires parsing `.env` files in every code path.
- **SQLite database**: More powerful queries but adds a dependency, schema migrations, and concurrency complexity. Overkill for the current scale (tens to hundreds of sites).
- **YAML or TOML registry**: Less standardized for structured data than JSON. JSON is universally supported in Python's stdlib.

## Consequences
- Every site create, update, delete, and SSL command must update the registry in addition to the filesystem.
- `wpfy debug` validates registry/filesystem consistency and reports orphaned entries.
- The registry is not a substitute for the filesystem. Missing or corrupted `sites.json` can be repaired by running `sync_from_filesystem()`.
- Concurrent writes from multiple `wpfy` processes are not safe. `wpfy` is designed for single-operator VPS use.

## Implemented
- `registry.py` module: `Registry` class with atomic `_save()` via `os.replace()`, `_metadata_from_env()`, and filesystem sync.
- Module-level API: `add_site()`, `update_site()`, `remove_site()`, `get_site()`, `list_sites()`, `sync_from_filesystem()`.
- `wpfy info` reports both registry and filesystem state.
- `wpfy site update` writes flavor, PHP version, SSL status, and cache type to the registry.
- `wpfy debug` checks registry/filesystem consistency and flags orphaned entries.
- Registry path configurable via `WPFY_STATE_DIR` environment variable (default: `/var/lib/wpfy`).

## Follow-up Tasks
- Add a `registry repair` command for explicit user-triggered resynchronization.
- Consider file locking (`fcntl`) if multi-process access becomes a requirement.
- Add registry pruning for old entries beyond a configurable retention period.
