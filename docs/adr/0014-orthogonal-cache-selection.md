# ADR 0014: Orthogonal page and object cache selection

- Status: Accepted
- Date: 2026-07-24

## Context

The original WordPress flavor vocabulary used one `SITE_FLAVOR` value for both the base site type and a cache choice. Values such as `wpfc`, `wpredis`, and `wpsc` therefore made cache choices mutually exclusive even when the runtime could safely support a page cache and a Redis object cache together. A W3 Total Cache page cache with Redis object caching is a valid and useful configuration that the overloaded vocabulary could not represent.

## Decision

Persist two independent cache selections in the authoritative `SiteDefinition`:

- `page_cache`: `none`, `wpfc`, `wp-super-cache`, `w3-total-cache`, `cache-enabler`, `wp-fastest-cache`, `wp-rocket`, or `flying-press`.
- `object_cache`: `none` or `redis`.

`flavor` remains the base site type (`wp`, `wpsubdir`, `wpsubdomain`, `html`, `mysql`, or `site`). The `--wpfc`, `--wpsc`, `--wprocket`, and `--wpce` flags remain accepted as page-cache shortcuts. `--w3tc`, `--wpfastest`, and `--flyingpress` select the corresponding new page-cache values. `--wpredis` selects `object_cache=redis` and can be combined with any page-cache flag.

On load, legacy `SITE_FLAVOR` values are migrated in memory: `wpfc` becomes base flavor `wp` plus `page_cache=wpfc`; `wpredis` becomes `wp` plus `object_cache=redis`; and the other legacy cache flavors map to their corresponding page-cache value. The next scaffold regeneration writes canonical `SITE_FLAVOR`, `PAGE_CACHE`, and `REDIS_ENABLED` values to `.env`; no manual migration step is required.

## Alternatives considered

- Keep one overloaded flavor string: rejected because it cannot express independent page and object caches.
- Store cache choices only in the registry: rejected because the filesystem `.env` remains the authoritative persisted site state and registry reconciliation would lose the setting.
- Require operators to edit `.env` manually: rejected because migration and validation belong at the state boundary and manual edits are not retry-safe.

## Consequences

- Page-cache plugin lifecycle and Redis object-cache lifecycle can be composed without changing the base site type.
- Compose Redis provisioning follows the object-cache axis and never publishes a host port.
- Existing sites continue to load correctly from legacy `SITE_FLAVOR` values and converge to canonical state on refresh.
- Registry metadata now records both axes while retaining a compatibility `cache_type` summary.
- The panel must adopt the same two-axis vocabulary in Phase 3b; this phase intentionally does not modify panel files.
